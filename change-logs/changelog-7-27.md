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

### Design-token guard runs at commit time; markdown gated in CI only `fa8e937`

**`.lintstagedrc.json`** · **`.markdownlint-cli2.jsonc`** · **`scripts/check-design-tokens.mjs`** · **`.github/workflows/ci.yml`**

`npm run lint:design` previously ran only via `npm run lint`, so a token violation surfaced at push or in CI, the slowest possible point for the change type this repo makes most often. The guard now runs on every commit touching `.ts` / `.tsx` / `.css`. To make that scoped rather than a full-tree rescan, `check-design-tokens.mjs` learned to accept file paths (`process.argv.slice(2)`, filtered to `.tsx?`/`.css`) and falls back to the full `src` walk when given none, so `npm run lint:design` and CI keep their existing whole-tree behavior. The `FONT_ALLOW` allowlist is unchanged.

Markdown went the other way. `markdownlint-cli2` was installed and configured but invoked by nothing, so `npm run lint:md` is now a CI step, while markdown is deliberately NOT on the pre-commit path: nits break nothing, a changelog lands most working days, and CI already covers it. It is check-only wherever it runs, never `--fix` — during rollout `markdownlint --fix` read the wrapped `+` conjunction in `CLAUDE.md` (`binds to design.md + src/index.css + .claude/rules/`) as a `+`-style list bullet and rewrote it to `-`, changing the file's meaning while leaving lint green. That sentence was reflowed so the `+` ends the line and the rule can no longer fire on it. Ignores gained `docs/**`, `plans/**`, and `handoff.md` (gitignored or generated); the 9 real violations in tracked files were fixed.

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

### Pagination footer wraps on content width `2d2ef8a`

**`src/components/ui/table-pagination-footer.tsx`**

The shared table pagination footer stayed a cramped single row when the Ask AI panel narrowed the content pane, because its wrap keyed off viewport breakpoints. Converted to container variants: `md:flex-row md:justify-between` → `@xl:flex-row @xl:justify-between`, `lg:pb-3` → `@xl:pb-3`. `@xl` (576px) clears the footer's ~534px natural single-row width, so it wraps to two lines based on the pane, not the browser. Shared primitive, so it fixes every table page at once.

### Top-bar workspace switcher relocates to the rail when cramped `2d2ef8a`

**`src/layouts/DashboardChrome.tsx`** · **`src/components/ui/sidebar.tsx`**

When the expanded rail and the Ask AI panel are both open, the top bar ran out of room and its actions collided with the panel header. Below ~1280px viewport in that state (`switcherInRail = isDesktop && sidebarExpanded && askAiOpen && isTight`, where `isTight` is a `max-width: 1280px` matchMedia), the `WorkspaceSwitcher` hides from the top bar and renders full-width at the top of the expanded rail via a new `topSlot` prop on `Sidebar` (mirroring the tablet/mobile Sheet treatment). Reverses on rail collapse, panel close, or widening past 1280. Only one switcher instance is ever active. Collision measured at ~1150px, so 1280 swaps with margin.

### Ask AI panel state persists across navigation `2d2ef8a`

**`src/App.tsx`** · **`src/layouts/DashboardChrome.tsx`**

The panel closed on every route change because `askAiOpen` was local `useState` in the per-page-mounted `DashboardChrome`. Hoisted it into `App.tsx`'s `Layout` with `localStorage` (key `askai`, default closed), mirroring `sidebarExpanded`; `DashboardChrome` now reads `askAiOpen`/`setAskAiOpen` via `useOutletContext<LayoutContext>()`. The panel stays open across navigation and refresh once opened, like the side nav.

### Accessible name on the Overview chart select; Policies check bullet realigned `2d39b5a`

**`src/pages/Dashboard.tsx`** · **`src/pages/Policies.tsx`**

A rams accessibility and design pass over the 14 main pages (16,175 lines) returned zero critical issues, one serious and two moderate; all three are fixed here. Overview's chart dimension `Select` (`DimSelector`) exposed no accessible name, because `SelectValue` announces the current value ("By model") but never the control's purpose, leaving it unidentifiable out of visual context. Added `aria-label="Chart dimension"` on `SelectTrigger`, parallel to the sibling `SegmentedPill`'s existing `aria-label="Chart metric"`; the wrapper spreads `...props` onto `SelectPrimitive.Trigger`, so the attribute reaches the DOM. On Policies, the Pro-benefits check bullet used `mt-0.5` (2px, off the 4px grid) plus `bg-blue-200 text-blue-800`, where the identical bullet in `TokenSavings` and design.md's `badge-info` token both use `blue-100`/`blue-700`. Dropped the top margin in favor of `items-center` on the `<li>`, which is the canonical `BenefitList` treatment rather than a new 4px value, and aligned the tone pair. Dark variants unchanged. Cleared as non-defects in the same pass: the brand-blue Pro-upsell CTAs (design.md §388 blessed exception), `outline-none` on Base UI menus (keyboard position shows via `data-[highlighted]`), and the `<tr onClick>` row drill-in (the keyboard/AT target is the real `<a href>` in the model cell).

## Sections

### Overview: container-query responsive conversion `389f73e`

**`src/pages/Dashboard.tsx`** (renders `/overview` and its twin)

Overview's major grids were moved from viewport variants to container variants so they respond to the content-pane width (see Conventions). Result: when the panel opens (especially rail expanded + chat open, ~760px content, the cramped worst case) the page collapses cleanly to a tablet layout with zero truncation, while the panel-closed desktop layout is unchanged.

- **3-up preview tables** (Latest messages / conversations / security events): `xl:grid-cols-3` → `@4xl:grid-cols-3` (896px). Held at `@4xl` rather than `@lg` so 1280–1439 laptops with the rail expanded keep their current 3-col layout instead of regressing to stacked.
- **"Tokens used" chart + legend:** `md:grid-cols-12` → `@4xl:grid-cols-12`; chart `md:col-span-8` → `@4xl:col-span-8`, breakdown `md:col-span-4 …` → `@4xl:…`. Legend sits below the chart when narrow, two-column only at `@4xl`. This also resolves the audit's tablet legend-clip finding.
- **KPI stat rail** (Messages / Tokens saved / Threats detected): call-site `lg:grid-cols-3` → `@2xl:grid-cols-3` (672px), with `sm:grid-cols-1` added to neutralize the shared `KpiRail` primitive's baked-in viewport `sm:grid-cols-3` (primitive untouched). Stays a horizontal rail down to 672px, single column on mobile.

### Container-query rollout to the remaining pages `2d2ef8a`

**Conversations, Models, Activity (+ `activity/TrendCard.tsx`), TokenSavings, Security, Policies, Settings, AuditTrail (+ `AuditTrailDefault`), SetupConnect, SetupCredits, Upgrade, DashboardDefault**

Extends the Overview proof-of-pattern (above) to the rest of the navigable pages + twins. Page grids moved from viewport to container variants so they collapse on the content-pane width when the rail and/or panel narrow it. Thresholds by archetype:

- KPI / stat rails → `@2xl:grid-cols-3` (+ `sm:grid-cols-1` to neutralize the `KpiRail` primitive); Models 4-up → `@4xl:grid-cols-4`
- chart + side legend (`TrendCard`) → `@4xl` (matches Overview)
- 2-up stat pairs → `@xl` (AuditTrail + Default); breakdown-card pairs → `@3xl` (Security)
- 2-col forms / option lists → `@lg` (Settings, Policies, TokenSavings)
- card pairs → `@xl` / `@3xl` (SetupConnect, Upgrade, DashboardDefault); Activity Top-lists → `@3xl` / `@7xl`

Call-site only, no shared primitives touched. Messages / Team / SecurityDefault / LimitsDefault had no page-level grids (tables + single-column). Billing / Limits multi-col grids are dialog-bound (fixed overlays, not converted). Deferred to a later wave: the heavy detail surfaces (Request / Conversation detail).
