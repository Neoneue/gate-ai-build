# UI Changelog: 2026-07-27

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-7-20.md`](./changelog-7-20.md)

---

## Conventions

### Content pane is a container-query context; page grids key off content width `389f73e`

**`src/layouts/DashboardChrome.tsx`** (the shared shell's `<main>`)

The content pane `<main>` now carries `@container` (Tailwind v4 `container-type: inline-size`, no dependency). This makes it the container-query context for everything a page renders, and its width already nets out both the nav rail (collapsed/expanded) and the Ask AI panel (open/closed).

New convention for page layout: responsive grids inside the content pane should use **container** variants (`@sm`/`@md`/`@lg`/`@2xl`/`@4xl`…) instead of viewport variants (`sm:`/`md:`/`lg:`), so a layout collapses on the width it actually has rather than the browser width. This is what lets content "convert to tablet earlier" when the panel steals ~368px, with no open/closed state threaded anywhere.

Note: container thresholds are NOT the viewport values (`@lg` = 512px container width, not 1024px viewport) — pick each per real content width. Overview is converted as the proof-of-pattern (see Sections); the remaining content pages roll out the same way.

## Components

### Ask AI top-bar button + docked chat-panel shell `389f73e`

**`src/components/ui/ask-ai-panel.tsx`** (new) · **`src/layouts/DashboardChrome.tsx`** · **`src/components/ui/feedback-fab.tsx`**

New "Ask AI" affordance in the top bar, left of Docs: outline `Button` (`size="lg"`), leading lucide `Sparkles` (`data-icon="inline-start"`), matching the Docs button. It toggles chrome-internal `askAiOpen` state; `aria-expanded` drives the outline variant's pressed styling (`aria-expanded:bg-muted`).

`AskAiPanel` is a **skeleton only** (inner chat elements deferred): a `h-16 border-b` header — unwired "New session" trigger (WorkspaceSwitcher-style) + unwired `SquarePen` ghost + wired `PanelRightClose` collapse — over an empty scroll body. Surface/border come from the mount.

- **Docked (lg+):** third flex sibling after the main column, `hidden lg:block shrink-0 overflow-hidden`, animating `transition-[width]` between `lg:w-0` and `lg:w-[368px]` (300ms, `var(--ease-out)`, `will-change-[width]`, `motion-reduce:transition-none`). Inner is a fixed `w-[368px] border-l border-border bg-card`, so the top bar + content condense in sync while panel content stays stable at 368px. `inert` when closed.
- **Below lg:** same shell in a right-docked `Sheet` (`sm:max-w-[368px]`), gated `open={askAiOpen && !isDesktop}` so it never portals open beside the docked column.
- **Feedback FAB tracks the panel.** `FeedbackFab` gained an `askAiOpen` prop; on lg+ when open it shifts from `right-6` to `right-[392px]` (24 + 368, on grid) so it rides with the main content instead of covering the panel. Its `right` transition uses the panel's exact `var(--ease-out)` curve at 300ms so the two glide as one (fixing an earlier lag where a bare `ease-out` keyword resolved to the CSS default curve, not the token).

### Docs button icon → leading BookOpen `389f73e`

**`src/layouts/DashboardChrome.tsx`**

The Docs top-bar button's trailing `ExternalLinkIcon` was replaced by a single leading lucide `BookOpen` (`data-icon="inline-start"`, `size={16}`), mirroring the Ask AI button. The now-unused `external-link` import was removed. The external-link arrow is gone.

## Sections

### Overview: container-query responsive conversion `389f73e`

**`src/pages/Dashboard.tsx`** (renders `/overview` and its twin)

Overview's major grids were moved from viewport variants to container variants so they respond to the content-pane width (see Conventions). Result: when the panel opens (especially rail expanded + chat open, ~760px content, the cramped worst case) the page collapses cleanly to a tablet layout with zero truncation, while the panel-closed desktop layout is unchanged.

- **3-up preview tables** (Latest messages / conversations / security events): `xl:grid-cols-3` → `@4xl:grid-cols-3` (896px). Held at `@4xl` rather than `@lg` so 1280–1439 laptops with the rail expanded keep their current 3-col layout instead of regressing to stacked.
- **"Tokens used" chart + legend:** `md:grid-cols-12` → `@4xl:grid-cols-12`; chart `md:col-span-8` → `@4xl:col-span-8`, breakdown `md:col-span-4 …` → `@4xl:…`. Legend sits below the chart when narrow, two-column only at `@4xl`. This also resolves the audit's tablet legend-clip finding.
- **KPI stat rail** (Messages / Tokens saved / Threats detected): call-site `lg:grid-cols-3` → `@2xl:grid-cols-3` (672px), with `sm:grid-cols-1` added to neutralize the shared `KpiRail` primitive's baked-in viewport `sm:grid-cols-3` (primitive untouched). Stays a horizontal rail down to 672px, single column on mobile.
