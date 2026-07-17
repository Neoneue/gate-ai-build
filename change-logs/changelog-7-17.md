# UI Changelog: 2026-07-17

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-7-16.md`](./changelog-7-16.md)

---

## Conventions

### Site margins 16px on mobile `b3d77c7`

**`src/layouts/DashboardChrome.tsx`**

The shell site margins dropped from 24px to 16px below the `sm` breakpoint. Both the `<main>` content column and the top bar changed `px-6` → `px-4 sm:px-6`: 16px horizontal padding on phones (<640px), 24px restored from 640px up. The pagination footer lives inside `<main>`, so it inherits the new margin; there is no separate shell footer. No vertical padding change.

### Subtitles full-width on mobile and tablet `b576c2c`

**22 page files** (Activity, ApiKeys, AuditTrail, Billing, Conversations, Limits, Models, Requests, Security, Settings, Team, TokenSavings, Upgrade + their `*Default`/`*Free` twins)

Page-header subtitles were capped at `max-w-1/2` at every width, so on mobile and tablet they compressed into a tall narrow column. Propagated the pattern Dashboard already used (`max-w-full` + `xl:max-w-1/2`) to every other page header: full width up to `xl` (1280px), 50% cap only on large desktop. One class per file; no other changes.

## Components

### Filter modal footer: Reset left, Cancel+Apply right, one row `0712c53`

**`src/pages/requests/RequestsTable.tsx`**, **`src/pages/security/EventsTable.tsx`**, **`src/pages/AuditTrail.tsx`**

The filter `DialogFooter` stacked its buttons on mobile (the primitive default is `flex-col-reverse`, so the grouped Cancel+Apply sat above a centered Reset). Forced `flex-row items-center justify-between` at base width, keeping `sm:justify-between` to beat the primitive's `sm:justify-end`. Result at every width: Reset flush-left, Cancel + Apply grouped flush-right, one row. JSX grouping was already correct; class-only change on all three filter modals.

### Pagination footer: +4px bottom padding on mobile + tablet `0712c53`

**`src/components/ui/table-pagination-footer.tsx`**

Added `pb-4` (16px) to the shared footer, reverting to `pb-3` (12px) at `lg`+ (`py-3 pb-4 ... lg:pb-3`). Gives mobile and tablet a little more clearance under the pagination; desktop unchanged. Covers every large paginated table via the one primitive.

### Table column gutter standardized to 24px `0712c53`

**`src/components/ui/table.tsx`**

`TableCell`, `TableHead`, and `SortableTableHead` moved from `px-4` (16px, = 32px between columns) to `px-3` (12px, = 24px between columns), with the outer edges kept at 16px via `first:pl-4 last:pr-4`. Sortable-header text realigns to the same x as a plain header; the `[&:has([role=checkbox])]:pr-0` exception is preserved; vertical padding, height, type, and colors unchanged. Applies to every table via the primitive (measured 24px middle-column gutter, 16px outer, in-browser).

### Data tables side-scroll on mobile + tablet `0712c53`

**`src/pages/AuditTrail.tsx`**, **`src/pages/Activity.tsx`**, **`src/pages/Limits.tsx`**, **`src/pages/LimitsFree.tsx`**, **`src/pages/Team.tsx`** (×2), **`src/pages/TeamDefault.tsx`**

A `table-fixed` table always equals its container width, so on narrow viewports its columns crush together and, since the table never exceeds the container, the primitive's `overflow-x-auto` had nothing to scroll. Added a `min-w-[Npx]` floor sized to each table's column count (Activity/Limits/LimitsFree `1000px`; Team invites `860px`; Team members `680px`; TeamDefault `560px`) so they side-scroll below the floor and never force horizontal scroll on desktop (largest floor 1000px < ~1326px desktop content area). Matches the existing ApiKeys pattern. AuditTrail additionally widened its Time column (`w-[14%]`→`w-[18%]`, Description `w-[30%]`→`w-[26%]`) so the timestamp no longer overflows into Event ID.

### Sidebar rail desktop-only; hamburger nav on tablet + mobile `c69e6dd`

**`src/layouts/DashboardChrome.tsx`**, **`src/components/ui/sidebar.tsx`**, **`src/App.tsx`**

The persistent sidebar rail now renders at `lg`+ only; tablet and mobile use the hamburger sheet (the rail/hamburger split moved from `md` to `lg`). The workspace switcher lives in the top bar on desktop (both collapse states) and in the hamburger sheet below `lg`; the top-bar logomark shows below `lg` (where there is no rail to carry the brand) and is hidden at `lg`+. Removed the `≤1024px` force-collapse in `App.tsx` so the rail's expand/collapse toggle works at every width, and moved the MobileNav auto-close threshold from 768px to 1024px to match. Exactly one workspace switcher is reachable at every size; no duplicate logo.

## Sections

### Hero cards: delta under the KPI number, key bottom-aligned `0712c53`

**`src/pages/Security.tsx`**, **`src/pages/requests/HeroMetric.tsx`**

On both hero metric cards the delta tag (`+22.4% · All time`) moved from inline-right of the big number to directly under it (`flex items-baseline gap-3` → `flex flex-col gap-1`), and the header row bottom-aligns the two columns (`items-start` → `items-end`) so the last key row (Redacted / Errors) lines up with the delta row.

### Hero-chart x-axis ticks: recharts-native thinning `0712c53`

**`src/pages/requests/hero-data.ts`**, **`src/pages/requests/HeroMetric.tsx`**, **`src/pages/Security.tsx`** (deleted `src/lib/use-responsive-ticks.ts`)

The hero area charts forced every tick with `interval={0}` (no collision removal) and Messages hardcoded its tick arrays at `00:00`, which never matched the 6-hour-bucket data — so All/30D rendered zero ticks and 7D collided. Switched `<XAxis>` to recharts' own thinning (`interval="preserveStartEnd"` + `minTickGap`), and replaced the hardcoded tick arrays with a `deriveTicks(data, count)` helper that picks real data-point times (the method Security already used). Verified in-browser on both charts across 24H/7D/30D/All at 390/1440px: every range renders non-overlapping ticks (2–4 on mobile, ~7 on desktop). Removed the failed `useResponsiveTicks` measuring hook.

### Activity: bottom 4 breakdown cards stack on tablet + mobile `0712c53`

**`src/pages/Activity.tsx`**

The Top models / API keys / users / attack-types grid was 2-up below `2xl`. Changed to `grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4` so the four cards stack to a single column on tablet and mobile, 2-up at `lg`, 4-up at `2xl`. Card header controls were intentionally left inline (not moved).

### Overview security-events preview: unique row key `9b48cc3`

**`src/pages/Dashboard.tsx`**

A single request can carry two security findings (e.g. `req_8389e4` has both a PII and a credential finding), so keying the "Latest security events" preview rows by `requestId` produced a duplicate-React-key warning. Rows are now keyed by `requestId`-plus-index, matching the `EventsTable` house pattern. Cosmetic fix; no rows were dropped.

### Table pagination: legible active page, prev button, compact window, 32px `9d53976`

**`src/components/ui/pagination.tsx`**, **`src/components/ui/table-pagination-footer.tsx`**

Four fixes to the table pagination footer. (1) The active page number was invisible in dark mode: the Button `outline` variant carries `dark:bg-input/30` + `dark:border-input`, which tailwind-merge does not treat as conflicting with `bg-primary`, so the `.dark` rule won and left dark `text-primary-foreground` on a translucent dark fill; added `dark:border-primary dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary` to the active state so it reads in both themes. (2) Added an always-present Previous (`<`) button, disabled + `pointer-events-none opacity-50` on page 1 (mirrors the existing Next pattern). (3) `buildPageWindow` is now constant-width: any gap of one or more hidden pages collapses to an ellipsis (removed the lone-page-to-number fill), so a 7-page table shows e.g. `‹ 1 … 3 4 5 … 7 ›` at page 4 and never balloons back to all seven numbers. (4) All controls (numbers, `<`, `>`, ellipsis) sized to 32px (`icon-sm` / `size-8`), numbered links `min-w-8 px-2` so multi-digit pages don't clip. Verified against canonical shadcn (via the shadcn skill): all a11y/semantics already match; prev/next stay icon-only (accessible name via `aria-label`).

### Mobile-responsive pass: content-flow shell, toolbar/footer stacking, Policies cards `94b34ec`

**`src/layouts/DashboardChrome.tsx`**, **`src/components/ui/filter-toolbar.tsx`**, **`src/components/ui/table-pagination-footer.tsx`**, **`src/pages/Policies.tsx`** + 7 page toolbars (Activity, AuditTrail, Conversations, Models, Team, requests/RequestsTable, security/EventsTable)

Broad mobile/tablet layout pass, all gated at `lg` (nav) / `md` (toolbars):

- **Shell sizes to content below `lg`.** The viewport-lock + internal scroll (`h-screen`/`overflow-hidden` root, `<main>` `overflow-y-auto flex-1`) are now `lg:`-only; below `lg` the document flows to content height so short pages no longer show a large dead scroll region. Root bottom padding `pb-20`→`pb-8` base (`lg:pb-20`); top bar `sticky top-0 z-40 lg:static` so the hamburger stays reachable. MobileNav auto-close threshold moved 768→1024.
- **Shell background.** Root paints `bg-background` (was `bg-card`), so the area exposed below content on small screens matches the page background in BOTH themes (light neutral-50, dark neutral-950) instead of the lighter card surface (white / neutral-900).
- **Table toolbars stack on mobile.** Below `md`: search input full-width on its own row, trailing controls (Filters / Export / Selects) split evenly on the row below (2→50%, 3→33%); single inline row at `md`+. Applied to the shared `FilterToolbar` and 7 page toolbars.
- **Pagination footer stacks on mobile.** The "Showing … · Rows" summary group sits above the pagination below `md`, inline space-between at `md`+; summary gains `whitespace-nowrap`.

### Policies cards: full-width description + spacing `94b34ec`

**`src/pages/Policies.tsx`**

The `PolicyCard` header is now a `flex-col` — a top flex row holds the icon, title, ON badge, and expand chevron; the description sits on its own full-width row below (was nested in a column beside the icon, so at 449px it was indented to ~237px). Description now spans the full card width (~367px). Title→description gap `gap-1`→`gap-3` (12px). Page header→cards gap `gap-6`→`gap-8` on mobile (`md:gap-6`). Covers all three routes (`/policies`, `/policies-free`, `/policies-default`) via the single component.

### Mobile polish: pagination footer centered, tabs side-scroll, conversation-trace `98163ab`

**`src/components/ui/table-pagination-footer.tsx`**, **`src/components/ui/tabs.tsx`**, **`src/pages/conversations/ConversationDetail.tsx`**

- **Pagination footer** centers both rows on mobile (`flex-col items-center`), reverting to the inline space-between row at `md`+; numbered pagination retained.
- **Tabs (`line` variant)** in the primitive gained `min-w-0 flex-nowrap overflow-x-auto` with `shrink-0` triggers, so an overflowing tab bar (e.g. the conversation-trace All steps / Findings only / Errors) scrolls left-to-right on mobile instead of forcing horizontal page overflow. Applies to every `line` tab bar; those that fit are visually unchanged. Verified page `scrollWidth === innerWidth` (no page overflow) and single-row/no vertical scroll.
- **Conversation-trace panels** (Messages + Request Trace) are +100px on mobile: the grid is `h-[840px]` below `lg` (was 640px), `lg:h-[640px]` for the 2-column desktop layout; measured 312px→412px per card at 390px. Applied to both the All-steps and Findings tab grids.
- **Conversation-trace footer** stacks the `Key … started` meta above the actions with a 16px gap below `lg`, buttons full-width 50/50; inline space-between (meta left, buttons right) at `lg`+.

### Compact-millions KPI formatter (1M+ → N.NM) across KPI tiles `98163ab`

**`src/lib/formatters.ts`** + KPI tiles in **Dashboard**, **Activity**, **AuditTrail**, **Security**, **Conversations**, **requests/HeroMetric**, **requests/RequestDetailBody**, **conversations/ConversationDetail**

New `formatCompactCount(n)`: raw counts with `abs(n) >= 1_000_000` render as `(n/1e6).toFixed(1) + "M"` (rounded one decimal, e.g. 19,386,869 → `19.4M`); sub-1M values keep full comma formatting (`toLocaleString`). M tier only (no K, no B). Routed the raw count values on KPI tiles site-wide (tokens in/out, messages, requests, turns, events, threats/blocked/flagged/redacted) through it. Currency (Cost/Spend), durations, and percentages are unchanged; table cells and chart axes/tooltips keep full numbers (KPI tiles only). Note: the Overview "Messages" tile previously used Intl compact (`63.8K`) and now shows full commas (`63,793`) under the no-K rule.
