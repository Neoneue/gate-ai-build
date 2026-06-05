# UI Changelog — 2026-06-04

Running log of UI changes made this day. Written for an agent/dev to **diff
against and replicate** — each entry states what changed, before → after, where,
and (for committed work) its commit hash.

**Using this log to make a change:**

- Each entry is tagged with its commit (`[abc1234]`) or `(uncommitted)`. For a
  committed entry, **`git show <hash>` is the exact diff** — the most reliable
  source; this prose is the summary.
- This file logs **deltas, not the full contract.** `design.md` is the
  authoritative design system (token + primitive rules, e.g. Badge's
  no-icons-inside); `data-model.md` is the architecture (routes, types, data).
  Check those before a "fix" so you don't break an unstated invariant.
- **Verify** edits with `npx tsc -b` (must exit 0) and the dev server at
  `localhost:3000`; per-surface deep-links are noted under each surface entry.

Organized by **scope**. Filing test: edit one primitive → **Components**; apply a
rule in N places → **Conventions**; rebuild one surface → **Sections**. Components
are alphabetical; Conventions and Sections are newest-first.

---

## Conventions & tokens

### Action color — 2-tier severity (red / amber) · [5a00d8b]

Guardrail/event action → color, applied **everywhere** an action is colored
(badges, finding banner, firing-card borders, breakdown dots + bars):

- **blocked / block → `destructive` (red)**
- **flagged → `warning` (amber)** and **redacted → `warning` (amber)** — same
  tier. The badge/label text carries the flagged-vs-redacted distinction.
- **allow → `neutral`.**

Replaces the earlier mix where redacted was `info`/blue in the badge maps but got
lumped into amber by some `block ? red : amber` 2-way splits. Now one rule; all
3-way `block/redact/flag` branches collapsed back to 2-way. (CPO direction.)

**Action→variant maps (which action gets which tone):** `security-data.ts`
`ACTION_BADGE`; `Dashboard.tsx` + `Requests.tsx` `GUARDRAIL_BADGE`; Requests
`actionVariant` + `CHECK_BADGE_VARIANT`.

**Variant→appearance (what `warning`/`destructive` actually paint):** lives in
`ui/badge.tsx` — change a tone's look there, change which action maps to a tone in
the maps above.

**Non-badge literals:** borders `border-destructive` (block) / `border-warning-500`
(flag+redact) — Requests `selectedBorder`, `Security.tsx` detection-card
`borderClass` (non-firing = `border-border`). Banner (`Requests.tsx`):
`border-destructive/50 bg-danger-50` + icon `text-destructive` (block) vs
`border-warning-500/50 bg-warning-50` + icon `text-warning-600` (flag/redact).
Breakdown dots/bars (`Security.tsx` `BreakdownRow` + `ACTION_CATEGORY_META`):
`var(--color-danger-500)` / `var(--color-warning-500)`.

Verify: `/requests?open=req_8f3a1c4` (redacted → amber banner/badges/border) and
`/security` → open any event row.

### Concentric card radius (24 → 16 → 8 → 4) · [9d4e590]

A card nested inside another card uses a SMALLER radius, one step down per level.
On this stack: outer panels `rounded-md` (8px) → nested cards `rounded-xs` (4px).
Same-level surfaces match; only descending a level steps down. Override shared
primitives (DetailList, CodeCard) at the usage site, not in the primitive.

### Titles above the card, never inside · [480633e · 9d4e590]

A section title renders ABOVE its card; the card holds only labels + data
(label-left / value-right rows), never a title inside the card. Section titles
are 16px (`text-base font-medium tracking-snug`, helper `PanelHeading`); the 14px
`SectionHeading` primitive stays for other uses. Applied across the Requests
findings modal + page (and now the Security event modal).

---

## Components

### Badges (`ui/badge.tsx`) · [5e8cbf0]

- **Case:** `uppercase` (was `capitalize` / first-letter only). Baked into the
  base class.
- **Contrast → WCAG AA (4.5:1):** `success` `text-success-700` → `text-success-800`
  (4.47 → 6.44:1); `destructive` translucent `bg-destructive/10 text-destructive`
  (3.97:1) → solid `bg-danger-100 text-danger-800` (6.91:1), now at parity with
  the other solid status variants.
- **Findings-tab counter** → `neutral` (grey); was action-colored.

### Buttons (`ui/button.tsx`, `ui/icon-action-button.tsx`) · [f31a350]

- **Press:** scale DOWN on `:active` `1` → `0.99` (was a `translate-y-px` drop).
  Curve = `--ease-out` `cubic-bezier(0.23,1,0.32,1)`, `duration-150`. Gated
  `active:not-aria-[haspopup]:scale-[0.99]` so popover/select/menu triggers don't
  scale.
- **Crisp labels:** `will-change: transform` on the Button + IconActionButton
  primitives so the scaled text re-rasters cleanly.
- **Reduced motion:** `motion-reduce:transition-none motion-reduce:active:scale-100`.
- Footprint: hand-rolled pressables match (sidebar, Models card, Security
  "Mark invalid"). NOT applied to popup/select/menu triggers, switches/toggles,
  navigating table rows, or plain text links.
- **Outline + `shadow-xs`** _[2ab3a47]_: the `outline` variant gains
  `shadow-xs` (now `border-border bg-card shadow-xs`, matching the Card recipe).
  Primitive-level, cascades to every `variant="outline"`. `box-shadow` is already
  in the transition list, so no hover snap.

### Dialog (`ui/dialog.tsx`) · [5e8cbf0]

- `DialogTitleBlock` `pr-12` close-button gutter is gated to `mode="dialog"` — no
  phantom gutter when the same block renders on a page (`mode="static"`).
- `gap-3` → `gap-2` in `DialogScrollHeader` + `DialogTitleBlock` (8px grid).

### Dropdowns (`ui/select.tsx`, `ui/popover.tsx`, `ui/menu.tsx`, `ui/date-range-picker.tsx`) · [f31a350]

- **Position standard:** open BELOW the trigger (`side="bottom"`), right-aligned
  (`align="end"`), 8px gap (`sideOffset={8}`).
- **Select:** `alignItemWithTrigger={false}` → renders as a real dropdown that
  **flips up** near the viewport bottom (collision avoidance), instead of the
  macOS-style overlay that centered the selected item over the trigger.
- Left-anchored triggers (sidebar workspace switcher, side-opening user menu) keep
  their intentional `align="start"` / non-bottom side.
- **Content inset** _[2ab3a47]_: `SelectContent` `py-1` → `p-1` so each
  `rounded-xs` item insets 4px from the popup edge and the highlighted/selected
  row no longer bleeds edge-to-edge (same inset recipe as `Menu`).

### RowActionButton (`ui/row-action-button.tsx`) · [5e8cbf0]

- Gains an `href` prop → renders a React Router `Link`, so table-row drill-ins are
  real `<a href>` (restores cmd/middle-click-to-new-tab, copy-link, and the
  correct link role). The `<tr>` drops the invalid
  `role="button"`/`tabIndex`/`onKeyDown`.

### Tables (`ui/table.tsx`, `hooks/use-table-sort.ts`) · [6d5e3e6]

- **Header row height:** 36 → 40px (`h-9` → `h-10`).
- **Sort on hover (`SortableTableHead`):** click-to-sort headers. A `⇅`
  (ChevronsUpDown) glyph fades in on hover when the column is inactive; when it is
  the active sort it PERSISTS as a directional `↑`/`↓` (ArrowUp/ArrowDown).
  **Three-state cycle:** click 1 = ascending, 2 = descending, 3 = unsorted
  (restores authored order). Click target is content-width (label + glyph), capped
  at half the cell. `aria-sort` on the `<th>`.
- **Foundation:** `useTableSort` + `sortRows` + `parseNumeric`
  (`@/hooks/use-table-sort`), `SortableTableHead` (`@/components/ui/table`). Local
  state, no TanStack. Table supplies a `getValue(row, key)` accessor; numeric
  columns parse via `parseNumeric` (em-dash/empty → null, sorts last). Sort runs
  after filter/search, before pagination; default unsorted. Applied to all data
  tables; NOT on action/kebab/checkbox columns, headers with interactive content,
  or columns with no clean comparable value.
- **Numeric header alignment** _[2ab3a47]_: numeric (right-aligned) columns
  use `flex-row-reverse` on the sort button so the glyph sits LEFT of the label
  and the label stays flush-right, aligned with the right-aligned data. Without
  it the glyph pushed the label left of the numbers. Left columns unchanged.
- Verify: any data table (e.g. `/requests`, `/activity`) → click a column header.

### Tabs (`ui/tabs.tsx`) · [f31a350]

- Tab triggers gained the same press feedback as buttons: `active:scale-[0.99]` +
  `transition-[colors,scale]` + `will-change:transform`.

---

## Sections & surfaces

### Conversations — model-filter icons + sortable Models column (`Conversations.tsx`) · [2ab3a47]

- **Model filter Select** renders each model's vendor `VendorAvatar` on the left
  of the item (new `MODEL_FILTER_OPTIONS` carrying `{value, label, vendor}`); the
  popup widens to fit. "All models" stays icon-less.
- **Models column is now sortable** (`SortableTableHead sortKey="vendors"`), keyed
  by the alphabetically-first vendor label in the row's set (`conversationSortValue`
  `case 'vendors'`) — the column is a multi-vendor set rendered as icons, so it
  orders by the brand shown (first-vendor-alpha; option 1).
- Verify: `/conversations` → open the Model filter; click the Models column header.

### Security event modal (`Security.tsx` → `ThreatEventDetailBody`) · [5a00d8b]

- **Reconcile copy with Requests.** A Security event is the same request as a
  Requests row (shared `requestId`), so the modal now shows the SAME finding copy
  the Requests findings panel shows — not divergent hand-authored strings. New
  exported bridge `getEventFindingCopy(requestId, category)` in `Requests.tsx`
  looks the row up in `REQUEST_ROWS_ALL` by `requestId` and returns
  `{ message, evidence }` from `getRequestFindings` (injection → `resolveInjectionCopy`
  "what happened" sentence; pii/credential → `findingBannerSentence`). In the modal:
  the **Message** block shows the finding evidence; the firing **Detection** row
  subtitle shows the finding message. Falls back to the standalone `TYPE_DETAILS`
  copy when no request row matches (sparse mock — ~7 of 17 events match; PHI never
  matches, as the Requests model has no PHI).
- **Detection description text:** `text-xs` (12px) → `text-sm/5 font-normal`
  (14/20 regular).
- **Section titles** ("Message" / "Detection" / "Request"): were `SectionHeading`
  (14px) → `text-base font-medium tracking-snug` (16/24 medium), matching the
  Requests modal `PanelHeading`. Title icons `size-4` → `size-5` (20px).
- **Width:** `sm:max-w-[592px]` → `sm:max-w-[640px]`.
- **Firing-card border** (`borderClass`): `border-destructive` (blocked) /
  `border-warning-500` (flagged + redacted); non-firing (pass) rows keep
  `border-border`. (See action-color convention.)
- Verify: `/security` → open any event row (e.g. the 09:48 injection = blocked,
  the 09:41 PII = redacted).

### Requests findings modal — Unredact default + model icon (`Requests.tsx` → `PiiRightPanel`) · [5a00d8b]

- **Unredact toggle defaults OFF** (`useState(false)`, was `true`) — the redacted
  value is shown until the operator opts in.
- **"What we sent upstream" Model row** renders the vendor `VendorAvatar` before
  the model name (matches the rest of the site); the Provider row stays text-only.
- Verify: `/requests?open=req_8f3a1c4` (PII + credential redacted showcase row).

### Requests detail — Details tab merged + titles unified (`Requests.tsx`) · [5e8cbf0 · 9d4e590]

- **Message merged into Details** as a Findings-style 2/3 + 1/3 grid (message
  left, metadata right); Full request expanded by default; `RequestBodyPanel`
  gains a `bare` prop for embedded use (V1 untouched).
- Message sections now use the standard `PanelHeading` (16px / neutral-900),
  matching the Findings tab — dropped the leading person/sparkles/braces icons and
  the `SectionHeading` / in-card-toggle styling.
- Full request: title moved above the card (no in-card header), collapse toggle
  removed (open by default), shadow removed (border only).
- Gap below the tabs reduced to 16px (body `pt-2` + Tabs `gap-2`).
- Verify: `/requests?open=req_8f3a1c4` → Details tab.

### Requests Findings page — `/requests-findings/:requestId` (`RequestsFindings.tsx`, `App.tsx`) · [5e8cbf0]

- URL-addressable, shareable, multi-tab findings detail (the GitHub model) — now
  the default row-click target from `/requests`. Reuses the SAME
  `RequestDetailBodyV2` as the stored modal via a `variant: 'modal' | 'page'` prop
  so the two can't drift. Page mode: no modal shell, full-width (`-mx-6` cancels
  the chrome gutter), no internal scroll, no footer; back breadcrumb (top-left) +
  "View Conversation" (top-right). The stored modal is kept for `?open=`
  deep-links (Security events).
- Verify: `/requests-findings/req_aurora_4200` (page); unknown id →
  "Request not found".

### Requests Findings modal v2 — full redesign (`Requests.tsx`, `ui/code-card.tsx`) · [480633e · a2e6fd0]

- **Polymorphic right panel by detector:** PII/credential → Presidio layout
  (`PiiRightPanel`: User message, Why this fired, What we sent upstream); injection
  → `InjectionRightPanel` (What happened + detector note, evidence segment, What we
  did, How to fix with Tune policy / Mark false positive). The three detectors
  legitimately render differently — that asymmetry is correct (injection =
  classifier, no recognizer/offset/bytes).
- **Banner** = `TriangleAlert` icon + title (`N findings · Highest action: X`) +
  a descriptive sentence (`findingBannerSentence`); tone via the action-color
  convention. No "View findings" link, no raw category list.
- **Fixed tab bar with its own scroll region** below it (modal only): a `shrink-0`
  tab bar over a `flex-1 min-h-0 overflow-y-auto` body.
- **"Offset in evidence" is a button** → jumps to the Message tab, expands the Full
  request drawer, scrolls to the top, and highlights the matched substring.
  `CodeBlock` gains a token `highlight` + `wrap` mode (`code-card.tsx`).
- **Human-readable rules** (`Email`, `OpenAI API key`); always defaults to the
  Findings tab (even all-pass, which shows the empty state).
- **Verdict chips dropped** (`a2e6fd0`) from the injection "What happened" card —
  the curated sentence + Detector note carry the meaning; removed the unused
  `verdicts` local.
- Verify: `/requests?open=req_8f3a1c4` (PII/credential panel) and an injection row
  (`?open=req_aurora_4200`).

### Requests findings — a11y + perf polish (Rams review) (`Requests.tsx`, `DashboardChrome.tsx`) · [5e8cbf0 · f31a350]

- **a11y:** "Request not found" → `role="alert"` + `<h2>`; page-mode header `pt-0`;
  offset-in-evidence + breadcrumb hit areas bumped to ~40px; `DashboardChrome`
  content pane → `<main>` landmark (global).
- **Grid / visual:** `gap-3` → `gap-2` in `DialogScrollHeader`/`DialogTitleBlock`
  (8px grid); `ml-1.5` → `ml-1`; empty-state `gap-3` → `gap-2`; passed-detector
  prose → `font-sans`; truncated `FindingCard` match gets a `title`.
- **Perf:** memoized `filteredRows` + `getRequestFindings`; Filters draft seeding
  moved; `tabular-nums` on `KvRow`; `text-balance` on empty/error headings;
  scale-on-press + `motion-reduce` on hand-rolled buttons.
