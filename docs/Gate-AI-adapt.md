# Gate AI — /adapt audit

## Verdict

Gate AI is a deliberate desktop-first SaaS dashboard. There are zero responsive breakpoint classes in any of the 15 page files except for four `sm:max-w-*` modal overrides and two isolated uses in Activity and Conversations. The sidebar has no mobile collapse behavior — at any sub-240px-sidebar viewport it simply truncates the layout. KPI rails (`grid-cols-4`, `grid-cols-6`) collapse to unreadably narrow tiles below ~900px. The Guardrails dialog is hard-pinned at 500px via inline `style`, which overflows at any viewport narrower than ~540px. For the actual ICP (Olivia and Devon, both desktop operators), this is acceptable as a design posture, but three specific patterns will cause pain at the 1024px laptop viewport (13" MacBook, Surface), which is the real danger zone for a gateway tool that both personas access at their desk.

---

## Project posture

**Existing breakpoint usage (across all 16 files):**

| Breakpoint | Occurrences | Where |
|---|---|---|
| `sm:` | 8 | Dialog primitives: `sm:max-w-sm`, `sm:max-w-lg`, `sm:max-w-[672px]`, `sm:max-w-[592px]`, `sm:max-w-[900px]`, `sm:max-w-2xl`, alert-dialog, sheet |
| `md:` | 3 | Activity.tsx: `md:grid-cols-12`, `md:col-span-8`, `md:col-span-4` |
| `lg:` | 1 | Conversations.tsx: `lg:grid-cols-2` (inside dialog body) |
| `xl:` | 0 | Not used |
| `2xl:` | 0 | Not used |

The three `md:` and one `lg:` uses are the only genuinely responsive layout classes in the entire page layer. Every other layout — KPI rails, middle rows, sidebar, page headers, toolbars — has no breakpoint variant.

**Design intent: Desktop-first, no mobile intent.** The sidebar requires `w-60` or `w-16` at all times (no drawer behavior). The `h-screen overflow-hidden` chrome collapses to useless on any sub-600px viewport. This is a deliberate operator tool not targeting mobile. The audit therefore flags only 1024px+ failures (common laptop) and 768–900px (iPad landscape, smaller laptops).

---

## HIGH — breaks at common viewports (1024px laptop, iPad portrait)

### H1. Guardrails "Create Limit" dialog — hardcoded 500px inline style

- **File:** `src/pages/Guardrails.tsx:354`
- **Failure:** `style={{ width: 500, minWidth: 500, maxWidth: 500 }}` — inline styles override the responsive `max-w-[calc(100%-2rem)]` safety net baked into `DialogContent`. At 540px viewport width (iPad portrait in app-shell + system chrome), the dialog clips on both sides. The dialog primitive (dialog.tsx:67) already has `w-full max-w-[calc(100%-2rem)]` in its base classes, but the inline style wins in specificity and pins width unconditionally.
- **Fix:** Remove the `style` prop entirely. Add `className="sm:max-w-lg"` (448px at `sm:`) to replace it. The form's two-column grid inside (`grid-cols-2`) has enough room at 448px; both columns collapse cleanly to single-column if you add `sm:grid-cols-2` with a `grid-cols-1` base. Concrete change:
  ```
  <DialogContent className="sm:max-w-lg gap-4">
    {/* inside: change grid-cols-2 → grid-cols-1 sm:grid-cols-2 */}
  ```

### H2. Conversations detail modal — 900px cap with no narrow fallback

- **File:** `src/pages/Conversations.tsx:523`
- **Failure:** `className="sm:max-w-[900px] max-h-[calc(90vh-96px)]"` — at 1024px laptop with a 240px expanded sidebar, the content pane is 784px. The modal is capped at 900px and the primitive adds `max-w-[calc(100%-2rem)]` so it fits, but the inner body is `grid grid-cols-1 lg:grid-cols-2` (line 587). At 1024px viewport, `lg:` doesn't trigger until 1024px, and the dialog is narrower than 1024px, so the two-panel Messages + Trace layout collapses to single-column. This is actually fine behavior, but the `max-h-[calc(90vh-96px)]` — rather than the standard `max-h-[90vh]` from the primitive — clips 96px from the top, which means on a 768px tall laptop screen (common 13" with toolbar + tab bar) the modal body is only ~595px tall with a 6-tile KPI rail inside. On short viewports the scrollable body region is very cramped.
- **Fix:** Remove the `-96px` deduction. Use `max-h-[90vh]` (the DialogScrollContent default) or `max-h-[85dvh]` to use dynamic viewport height for browsers that handle the mobile URL-bar correctly. The primitive already handles `flex-col / overflow-hidden / flex-1`; the extra subtraction isn't buying anything and makes short-viewport layouts cramped:
  ```
  className="sm:max-w-[900px]"
  ```

### H3. KpiRail primitive — no responsive column fallback

- **File:** `src/components/ui/kpi-rail.tsx:36–41`, consumed by Dashboard.tsx (`columns={4}`), Requests.tsx (`columns={5}`), Conversations.tsx (page: `columns={4}`, dialog: `columns={6}`), Activity.tsx (`columns={3}`), AuditTrail.tsx (`columns={4}`), Models.tsx (`columns={4}`), TokenSavings.tsx (`columns={3}`)
- **Failure:** `COLUMN_CLS` is a fixed map — `grid-cols-4`, `grid-cols-5`, `grid-cols-6` — with zero breakpoint variants. At 1024px with a 240px sidebar and 48px scrollbar margin, the content pane is ~736px. A `grid-cols-5` rail (Requests) gives each tile ~147px. A `grid-cols-6` rail (Conversations detail KPI) gives each tile ~123px. Both are tolerable but tight. If the sidebar is expanded (240px), the `columns={5}` rail on Requests gets ~112px per tile — at that width the `CompactKpi` tile's value (`48,293`) and sparkline start crowding. The `columns={6}` Conversations dialog KPI is worst: ~98px per tile at 1024px with sidebar open.
- **Fix:** Add responsive column collapses to the `COLUMN_CLS` map. Because the primitive is shared, the fix is one change in `kpi-rail.tsx`:
  ```ts
  const COLUMN_CLS: Record<number, string> = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  };
  ```
  At `columns={4}`, tiles go 2-up below `md:` (768px) — each tile gets half the content width, which is always enough for a CompactKpi.

### H4. Page header toolbar — title + range pill don't wrap on narrow content panes

- **Files:** `src/pages/Requests.tsx:141`, `src/pages/Dashboard.tsx:98`, `src/pages/Activity.tsx:181`, `src/pages/Security.tsx:576`, `src/pages/AuditTrail.tsx:157`
- **Failure:** All page headers follow the same pattern: `flex items-start justify-between gap-6`. The left side is `max-w-1/2` (capped at 50% of the content pane). The right side contains a `SegmentedPill` + optional `DateRangePicker` with `shrink-0`. At 1024px viewport with the expanded 240px sidebar, the content pane is ~736px. The right-side pill group (All / 24h / 7d / 30d / Custom + date picker) on Requests is approximately 360px wide — that leaves only ~315px for the `max-w-1/2` title column, which forces the subtitle onto very narrow lines. On pages with more pill options (Requests has 5 presets + date picker), the pills themselves may force the header to overflow rather than wrap, clipping the right edge.
- **Fix:** Change from `justify-between` + `shrink-0` to a wrapping flex pattern so the range controls drop below the title on very narrow content panes:
  ```
  flex flex-wrap items-start justify-between gap-4
  ```
  And change the right-side container from `shrink-0` to `flex-wrap gap-2` so the DateRangePicker breaks to a second line before the pills overflow viewport. The `max-w-1/2` constraint on the title can be relaxed to `max-w-prose` or removed entirely when the layout is wrapping.

---

## MEDIUM — works but feels squeezed

### M1. Dashboard MiddleRow — `grid-cols-3` with `col-span-2` chart

- **File:** `src/pages/Dashboard.tsx:182`
- **Failure:** `<div className="grid grid-cols-3 gap-4">` with `RequestVolumeCard` spanning `col-span-2` and `TopKeysCard` in the remaining column. At 1024px with the expanded sidebar, the TopKeysCard gets ~245px. The key-label + cost row at that width uses `flex items-center justify-between` with a truncated label — this works but the truncation kicks in very early. The chart card gets ~486px and its `h-[176px]` bar chart shows 6 series across 7 date bars — tolerable but bar width shrinks to 5–6px at that content pane width.
- **Fix:** Below `md:`, stack the two cards vertically: `grid-cols-1 md:grid-cols-3`. At single-column, `col-span-2` and the `min-w-0` on both cards give each card full width:
  ```
  grid grid-cols-1 md:grid-cols-3 gap-4
  ```

### M2. Activity Spend chart + sidebar — `md:grid-cols-12` with forced column spans

- **File:** `src/pages/Activity.tsx:845`
- **Failure:** `grid grid-cols-1 gap-4 md:grid-cols-12` with `md:col-span-8` (chart) and `md:col-span-4` (sidebar). This is the only page that uses `md:` for responsive layout. At 1024px with expanded sidebar, the 12-col grid in a ~736px pane gives each column 61px — the 4-col sidebar (`md:col-span-4`) is 244px and the chart is 488px. The sidebar contains a UsageByKey table with a progress bar + key label + spend value row: at 244px the key label (`font-mono text-sm`) truncates after 10–12 chars, which cuts off all key names. The `md:border-l md:border-border md:pl-3` visual separation also adds 12px of padding to an already tight column.
- **Fix:** Change the sidebar to `md:col-span-3` for a 75/25 split, or bump the chart to `lg:grid-cols-12` so the two-column layout only activates at 1024px+:
  ```
  grid grid-cols-1 gap-4 lg:grid-cols-12
  ```
  Then the single-column stacked view runs through 1023px, which is fine for the content.

### M3. Billing — two-column top row cards and four-column credit presets

- **File:** `src/pages/Billing.tsx:75, 240`
- **Failure:** The Plan + Credits top row is `grid-cols-2 gap-4`. At 1024px with sidebar, each card is ~360px — fine. Inside CreditsCard's dialog, the credit-amount preset radio buttons are `grid-cols-4 gap-2` (line 240). At `sm:max-w-sm` (~384px dialog), each preset tile is ~90px, which is fine, but at the base `max-w-[calc(100%-2rem)]` on very narrow viewports (400px), four tiles at ~85px each is very tight for `$1,000` as a label.
- **Fix:** Billing's top row is fine at 1024px. The preset grid inside the dialog: `grid-cols-2 sm:grid-cols-4` so on narrow viewports the tiles stack 2-up at larger touch targets.

### M4. Security page — `grid-cols-2` two-column breakdown cards

- **File:** `src/pages/Security.tsx:606`
- **Failure:** `grid grid-cols-2 gap-4` for the two security breakdown cards below the hero. At 1024px with an expanded sidebar (~736px content pane), each card is ~366px, which works. But Security's hero section also uses `flex items-start justify-between gap-6` with a right-side button cluster (`grid grid-cols-[auto_auto_auto]`) marked `shrink-0`. The three toggle buttons for the filter controls are auto-sized inline elements — at narrow content panes these don't wrap and could overflow.
- **Fix:** The two-column card row: `grid-cols-1 md:grid-cols-2`. The filter button cluster: consider `flex-wrap` so the pills wrap to two lines before they overflow.

### M5. Models — `grid-cols-3` platform cards

- **File:** `src/pages/Models.tsx:1284`
- **Failure:** `grid grid-cols-3 gap-4` for PlatformPanel (integration cards). At 1024px with expanded sidebar, each card is ~236px — fine, the content is a name + one-line description. But the `columns={4}` ModelKpiRail above (line 1311) at that content width gives ~184px per tile, which fits the values (`128K`, `$3.00`, `$15.00`) but only barely.
- **Fix:** `grid-cols-1 sm:grid-cols-2 md:grid-cols-3` for PlatformPanel.

### M6. Quick Actions — `grid-cols-4` on Dashboard

- **File:** `src/pages/Dashboard.tsx:543`
- **Failure:** `grid grid-cols-4` for the QuickActionsRow with no responsive variant. Each tile is ~184px at 1024px with expanded sidebar. The inset-divider pattern (`before:absolute before:left-0 before:inset-y-4`) works visually. But the action items use `flex items-center gap-3 p-4` — at 184px that's tight (icon chip 32px + gap 12px + text flex = ~140px for title + subtitle). Title text uses `truncate`, so labels like "Read Integration Guide" collapse to "Read Integrati…" at this width.
- **Fix:** `grid-cols-2 md:grid-cols-4` so on sub-768px content panes the actions stack 2-up at ~368px each, where no truncation occurs.

---

## LOW — polish for mobile / narrow viewports

### L1. Sidebar — no mobile drawer behavior below 640px

- **File:** `src/layouts/DashboardChrome.tsx:47`, `src/components/ui/sidebar.tsx:86`
- **Failure:** The sidebar is always in the document flow as a `w-16` or `w-60` element. There is no `hidden sm:block` or drawer/sheet pattern. At 640px viewport (the minimum for most tablets in portrait), the `w-16` icon-only sidebar consumes 64px, leaving 576px for content — functional but tight. At 480px (some iPad Minis in portrait), the full layout is squeezed enough to cause horizontal overflow on some table cells.
- **Fix (low priority given desktop posture):** For a low-cost fix, add `hidden sm:flex` to the sidebar and a hamburger drawer trigger visible below `sm:` using the existing `Sheet` primitive. This is infrastructure work; flag for when mobile is a stated target.

### L2. AuditTrail toolbar — two controls with no wrap strategy

- **File:** `src/pages/AuditTrail.tsx:474`
- **Failure:** `flex items-center gap-2 p-4` with a `SearchInput` + `Select`. The SearchInput has no explicit `w-` constraint — it likely `flex-1`s to fill available space. At narrower content panes, this is the most graceful toolbar on the page: the select is compact (`size="sm"`), and the search field shrinks. No overflow expected at 1024px.
- **Note:** Actually fine as-is. Flagging only because the Requests toolbar (SearchInput + 3 Select dropdowns) at the same width is tighter; see cross-page note below.

### L3. Requests toolbar — four filter controls with no wrap

- **File:** `src/pages/Requests.tsx:1055`
- **Failure:** Comment explicitly says "No flex-wrap: the sortable-table convention is single-row." Four controls (SearchInput + Model select + Key select + Status select + Download button) in a single `flex items-center gap-2 p-4` row. At 1024px with expanded sidebar, this is ~736px for five controls — each select is ~100px, search is ~160px, download icon is 32px. Total ~620px + gaps. This fits at 1024px expanded, but if the sidebar is still at 240px and the content is even slightly narrow, the Download button clips.
- **Fix:** Low severity at 1024px+. For 900px viewports (iPad landscape without full sidebar expansion), allow `flex-wrap` and let the bottom row be search alone on its own line: `flex flex-wrap items-center gap-2 p-4`.

### L4. Conversations dialog KPI — 6-column rail inside a 900px-capped modal

- **File:** `src/pages/Conversations.tsx:623`
- **Failure:** `KpiRailShell columns={6}` inside `DialogScrollSummary`. At the modal's effective width (min of 900px cap and viewport-2rem), the six tiles each get ~137px. Fine at 1024px+. On a 900px viewport with the dialog filling ~868px, tiles are ~131px. The tile content (small numeric labels like "5 turns", "8 reqs") fits.
- **Fix:** Apply the KpiRail fix from H3 above — `columns={6}` would go `grid-cols-2 md:grid-cols-3 lg:grid-cols-6`, giving a 2-up tile layout inside narrow modals. This is a follow-on of H3.

### L5. Sidebar nav items — touch targets at 36px (below 44px guideline)

- **File:** `src/components/ui/sidebar.tsx:242`
- **Failure:** Expanded sidebar nav items use `px-2 py-2` on a `flex items-center gap-3` button. The button has no explicit `h-` class. At `text-sm` (14px) with `py-2` (8px top + 8px bottom), the computed height is approximately 14px line-height + 16px padding = ~30px. The collapsed icon rail (SidebarCollapsed, line 170) uses `size-9` (36px). Both are below the 44px WCAG 2.5.5 touch target guideline.
- **Note:** For a desktop-primary dashboard this is acceptable (dense-dashboard register per the audit brief accepts ≥32px). Flag if mobile intent is added. The collapsed `size-9` (36px) is inside the dense-dashboard threshold.

---

## Cross-page patterns

**KPI rail responsive shape (H3):** Every page uses `KpiRailShell` with a fixed `columns` prop and no breakpoint classes. The fix is one change to `kpi-rail.tsx`'s `COLUMN_CLS` map and propagates to all 7 call sites. This is the highest-leverage single fix in the codebase.

**Page header pattern (H4):** The `flex items-start justify-between gap-6` / `max-w-1/2` + `shrink-0` right-side header pattern is copy-pasted identically into Dashboard, Requests, Activity, Security, AuditTrail (and partially Conversations, Guardrails). A single shared `PageHeader` primitive with `flex-wrap` handling would fix all occurrences.

**Table overflow strategy:** The `Table` primitive (`src/components/ui/table.tsx:16`) already wraps every table in `overflow-x-auto` — this is correct. Tables will scroll horizontally rather than clip. The bigger risk is the `whitespace-nowrap` discipline: all `TableHead` and `TableCell` elements use `whitespace-nowrap` per project rules, which means tables will always try to expand to their natural width. The `overflow-x-auto` container on the primitive means this is handled correctly — tables scroll, they don't overflow the page. No action needed.

**Modal sizing pattern:** Four modals (`sm:max-w-lg`, `sm:max-w-[672px]`, `sm:max-w-[592px]`, `sm:max-w-2xl`) use responsive `sm:` caps correctly and are bounded by `max-w-[calc(100%-2rem)]`. The Guardrails inline-style modal (H1) is the only outlier that breaks this pattern and must be fixed.

**Toolbar pattern:** All table-page toolbars (`flex items-center gap-2 p-4`) have a "no flex-wrap by convention" comment in Requests. This works at 1024px+ but will break at 800px content panes. Since the intended minimum is 1024px laptop, this is medium-low severity — flag for when actual responsive breakpoints are added.

**Chart heights:** `h-[176px]` (Dashboard), `h-[184px]` (Activity), `h-24` (Requests hero spark), `h-[88px]` (Security) are all fixed pixel heights. Charts use `aspect-auto` which deactivates the aspect-ratio behavior in favor of the explicit height. At any viewport, the chart renders at exactly that height — no overflow, but also no fluid adaptation. For this desktop-first register, fixed heights are acceptable; the charts clip correctly within their card containers.
