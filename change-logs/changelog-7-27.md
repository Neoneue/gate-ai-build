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

### Two semantic tokens for icon-only controls: `--primary-foreground-soft`, `--control-raised` `6e42286`

**`src/index.css`** · **`design.md`**

The Ask AI composer's two icon buttons needed color pairs no existing semantic token supplied, and a raw ramp step would not have flipped with the theme. Both were added to `:root`, `.dark`, and `@theme`, and documented in `design.md` (token-contract table + scoping prose + the `colors:` manifest).

- **`--primary-foreground-soft`** — light neutral-200 / dark neutral-800. A softened on-primary ink for **icon-only** primary actions. Full white flares against the neutral-900 fill at 16px and reads heavier than the stroke is. Deliberately identical to `--primary-foreground` in dark, so it is a no-op there. Text-sized on-primary content stays on `--primary-foreground`.
- **`--control-raised`** — light white / dark neutral-700. Fill for a small icon-only control that must read as a discrete chip on a muted card surface. `--accent` (neutral-100) sits one ramp step off the neutral-50 shell and smudges at 24px. Dark matches what `--accent` already resolved to, so it is a no-op there too. Not a substitute for `--card`: a card inverts with the theme, this token stays lighter than whatever is beneath it in both.

### Four chat-bubble tokens, and a sans exception for reply prose `68d0b9a`

**`src/index.css`** · **`design.md`**

Bubble surfaces and inks needed pairs no existing semantic token supplied — `--card` is white/neutral-900, `--secondary` neutral-100/neutral-800, neither of which reproduces the Figma twins. Values re-read from the light/dark twins rather than carried over from the interim build, which had two inks wrong.

| Token | Light | Dark |
| --- | --- | --- |
| `--chat-bubble-user` | neutral-100 | neutral-800 |
| `--chat-bubble-user-foreground` | neutral-950 | neutral-100 |
| `--chat-bubble-agent` | white | neutral-950 |
| `--chat-bubble-agent-foreground` | neutral-900 | neutral-200 |

`design.md` also gains a first-class **"Exception: Ask AI reply prose"** block in §3 Typography, cross-referenced from the Data-voice rule: inline `code` and `pre` inside an agent reply render in the **sans** body voice, not the mono Data voice, because replies are long-form reading and mono degrades legibility at that length. Figma renders it sans and the user confirmed the reasoning. Scope is bounded to reply content — table cells, numerics, IDs, hashes, transcript surfaces, `InlineCode`, `CodePanel`, and `CodeCard` all stay mono — with a do-not-revert line, since it reads like a violation of the five-voice rule and is intentional.

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

### Ask AI chat composer `6e42286`

**`src/components/ui/ask-ai-composer.tsx`** (new) · **`src/components/ui/ask-ai-panel.tsx`**

The panel's empty scroll body becomes a real chat layout, built to Figma node `1125:5376`. `AskAiPanel` now owns a `px-4 pb-4` column stacking an empty scrolling message region (`min-h-0 flex-1 overflow-y-auto pt-4`, bubbles deferred) above the composer, so the first message will clear the top bar by 16px and the box sits 16px off the bottom, flush inset 16px left and right.

`AskAiComposer` is a `bg-card-muted` shell: `p-4`, `rounded-md` (8px, card tier — Figma's value, not the 16px modal tier), `border-border` stepping to `focus-within:border-primary` on focus.

- **Textarea** — borderless and transparent inside the shell, `field-sizing-content` at `type-copy-14-tight` (14/20), clamped `min-h-5` → `max-h-20`. Exact multiples of the 20px leading, so it hugs content from 1 line to 4, then holds and scrolls (`overflow-y-auto`). Placeholder "Ask Gatekeeper a question or type /help to see a list of options".
- **Action row** — `gap-3` (12px) below the field, `flex h-8 items-center justify-between`. 24px `Plus` left on `bg-control-raised` + `border-border`; 32px `Send` right on `bg-primary` with a `text-primary-foreground-soft` glyph, `opacity-50` until the field has text. Both carry `shadow-xs` and the standard press recipe (`active:scale-[0.98]`, 150ms `ease-out`, `motion-reduce` opt-out). Both unwired.

### Pagination ellipsis let the whole site scroll past the shell `d7ffcd0`

**`src/components/ui/pagination.tsx`**

`PaginationEllipsis` renders a `.sr-only` span, which Tailwind styles `position: absolute`. The wrapper was static, so the span's containing block was the initial containing block rather than the scroll container. Deep inside a scrolled table it resolved to a document offset far below the viewport (y 2035 against a 762px viewport on `/security`), inflating `<html>`'s scroll height while `body` and `#root` stayed at 762 — the page scrolled well past the app shell into empty background. The shell's `lg:overflow-hidden` could not clip it: an absolutely positioned element escapes an overflow ancestor that is not its containing block.

Fixed by adding `relative` to the wrapper. It is `flex size-8` with no offsets, so this is containment only, no visual change. Hit every page whose paginated table showed the ellipsis.

### Ask AI chat bubbles + markdown reply scope `68d0b9a`

**`src/components/ui/ask-ai-message.tsx`** (new) · **`src/components/ui/ask-ai-placeholder-thread.tsx`** (new) · **`src/components/ui/ask-ai-panel.tsx`**

The panel's empty message region becomes the conversation surface. `MessageThread` stacks turns at `gap-4`; `UserMessage` is right-aligned at `px-4 py-3` on `bg-chat-bubble-user`; `AgentMessage` is left-aligned at `p-4` on `bg-chat-bubble-agent` with `border-border`. Both `rounded-md`, 16px inset from each panel edge, 16px clear of the composer.

- **`ReplyProse` is a descendant-selector scope, not a layout.** It styles by element type (`[&_h3]:…`, `[&_p]:…`), so when the real agent's markdown lands it needs no restyling. Voices mapped from Figma: `p`/`li` → `type-copy-14-tight`, `h3` → `type-heading-16` + rule + `pb-2`, `strong` → `font-medium`, links underline-only. `h1`/`h2`/`h4` take the neighbouring rungs of the same ladder — Figma's source markdown only used `###`.
- **Block rhythm: 20px between blocks, 28px above a heading, 4px between list items.** Figma's *declared* 8px auto-layout gap and its *rendered* 20–36px disagree, because the mock's text frames carry pasted-markdown blank lines a renderer never emits; the values come from pixel-measuring the render. Built on flex `gap-5` + `[&>*+h1,…]:mt-2` rather than `[&>*+*]:mt-5` — the sibling selector is (0,1,0) and silently loses to the `[&_p]:m-0` reset at (0,1,1), so the first implementation did nothing at all.
- **Inline `code` is sans**, per the new design.md exception. Chips render on `bg-muted rounded-xs` with no literal backticks (Figma's are a paste artifact).
- Each reply carries the completion action row — 4 × 24px unwired icon buttons at `text-muted-foreground`.
- **Placeholder copy is doc-sourced, not mock-sourced.** Reconciled against [the live quickstart](https://docs.constellationgate.ai/getting-started/quickstart-gate-connect): Figma's "Step 3. Turn off your apps" is a typo (the doc says *Turn on*), its download link label was wrong, and it added five bolds the doc doesn't have. The doc's routing screenshot is omitted — agents can't render images. Marked as placeholder in its own file so the swap to live data is obvious.

### Ask AI scroll-to-latest FAB `68d0b9a`

**`src/components/ui/ask-ai-scroll-to-latest.tsx`** (new) · **`src/components/ui/ask-ai-panel.tsx`**

32px circular control with a 16px `ArrowDown`, floating 16px above the composer and 16px off the panel's right edge (Figma `1149:10955` light / `1125:4280` dark). Positioned against the body wrapper's existing `px-4` / `gap-4`, so both offsets survive the composer growing. Fill is `bg-control-raised` — the same token as the composer's plus button, so the two circular controls stay consistent — with `shadow-(--shadow-card-soft)` in the runtime `var()` form so the shadow actually flips between themes.

Visible only when the thread **both** overflows and sits **more than 60px** off the bottom. A smaller threshold is a known bug source: ordinary content growth briefly opens a gap and reads as a user scroll.

- **IntersectionObserver sentinel, not a scroll handler** — a zero-height last child observed against the region with `rootMargin: "0px 0px 60px 0px"`. Overflow is tracked by a `ResizeObserver`, so it will follow streaming growth without a scroll listener anywhere.
- **`overflow-anchor` does the pinning in CSS** — `none` on the thread wrapper, `auto` on the sentinel. The view stays pinned to the bottom as content grows and releases when the user scrolls the sentinel out of view, with no JS. The wrapper exists specifically so the two rules sit on different elements; as a `[&>*]` rule plus a sentinel override they would tie at (0,1,0) and be decided by emit order.
- **A gesture mid-animation cancels the smooth scroll** via `scrollTo({top: el.scrollTop, behavior: "instant"})` bound to `wheel`/`touchmove`/`keydown`, so a user scrolling during the animation doesn't fight it into a bounce.
- Hidden state is `aria-hidden` + `tabIndex -1` + `pointer-events-none`. `motion-reduce` drops both the smooth scroll and the press scale.

Behavior follows the established streaming-chat pattern rather than the mock, which can only draw the control statically. Deliberately **not** copied from ChatGPT: its habit of stopping auto-follow once one response fills the viewport. Verified in both themes — hidden at 30px scrolled up, visible at 200px, never present on a non-overflowing thread, and no layout shift between states.

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
