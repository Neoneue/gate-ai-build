# UI Changelog: 2026-06-18

Running log of UI changes for 06-18. Written for an agent/dev to **diff against
and replicate**: each entry states what changed, before → after, where, and (for
committed work) its commit hash.

Prior day: [`changelog-6-17.md`](./changelog-6-17.md).

---

## Conventions

### Press scale 0.98 + cursor:pointer on buttons `7550799`

- Press affordance standardized to `active:scale-[0.98]` **site-wide** (was a
  uniform `0.99`): 18 usages across 12 files. `motion-reduce` resets unchanged.
- New global `@layer base` rule in `index.css`: `button:not(:disabled)` and
  `[role="button"]` (excluding `aria-disabled`) get `cursor: pointer`. Tailwind
  v4 preflight ships buttons as `cursor:default`; this restores the pointer.
  Disabled / aria-disabled controls keep the default arrow.

### shadow-xs darkened ~10% `7550799`

Overrode the Tailwind default `--shadow-xs` in `@theme`: alpha `0.05` → `0.055`
(`0 1px 2px 0 rgb(0 0 0 / 0.055)`). Site-wide, slightly more lift on cards /
buttons / rails.

### Ultralight `-25` tint tokens `7550799`

Added a `-25` step (above `-50`) to the warning / success / danger ramps in
`index.css`: `--color-warning-25` `oklch(0.995 0.008 95.277)`,
`--color-success-25` `oklch(0.993 0.007 155.826)`,
`--color-danger-25` `oklch(0.988 0.007 17.380)` (danger kept more saturated).
Used as active-card background tints (see Components).

## Components

### `select.tsx`: additive `multiple` (multi-select) support `e85cafb`

`src/components/ui/select.tsx`. The wrapper was single-select only (`value`,
`onValueChange` typed as `string`). Extended **additively** so Base UI's native
multi-select is available without touching the ~dozen existing single-select
call sites.

- `SelectProps` is now a **discriminated union on `multiple`**:
  - single mode (`multiple` absent/`false`) keeps the exact original shape —
    `value?: string`, `defaultValue?: string`, `onValueChange?: (v: string)`.
  - multiple mode (`multiple: true`) — `value?: string[]`,
    `defaultValue?: string[]`, `onValueChange?: (v: string[])`.
  - Shared base props are `Omit<…, "value"|"defaultValue"|"onValueChange"|"multiple">`.
- The `Select` body forwards `onValueChange` once (cast to
  `(string | string[])`); the union has already constrained the consumer's
  callback, and `multiple` flows through `{...props}` to `SelectPrimitive.Root`.
- Base UI renders the per-item checkmark (`ItemIndicator`) for every selected
  item in multiple mode — no change to `SelectItem` needed. Multi triggers use
  the existing `SelectValue` render-fn children for an "N selected" summary.
- No regression: whole-project `npx tsc -b` passes; all 16 consumer files
  compile unchanged (single-select sites resolve to the single-mode arm).

### Findings switcher: whole-card click + detail polish `a2a5263`

A batch of findings-detail refinements in `RequestDetailBodyV2` /
`FindingSwitcherCard` / `FindingCard` / `CountChip` (`src/pages/Requests.tsx`).

- **Whole card clickable.** Before: only the top portion (label + match line)
  selected the group; the bottom pager row was dead. After: the select button
  carries a stretched overlay (`after:absolute after:inset-0 after:content-['']`)
  on a `relative` wrapper, so clicking anywhere on the card selects it. The
  pager paddles are lifted to `relative z-10` to stay clickable above the
  overlay; because the paddles already carry `disabled:pointer-events-none`,
  clicks over a disabled paddle (inactive card) fall through to the overlay too,
  so there are no dead zones.
- **No reset on re-click.** Added `disabled={isActive}` to the select button.
  Before: re-clicking an already-active card called `onSelect(items[0])` and
  snapped the pager back to "Finding 1 of N." After: the active card's body is
  inert; the paddles remain enabled for paging.
- **Inactive border tone.** Unselected switcher cards now keep the action tone
  dimmed instead of `border-border`: `border-warning-200` (flag/redact) /
  `border-danger-200` (block), darkening one step to `-300` on hover with a
  `transition-colors` on the wrapper. Active stays `border-warning-500` /
  `border-destructive`. Hover bg moved from the inner button to the wrapper so
  the whole card responds.
- **Sizing.** Pager `‹ ›` paddles 24 → 32px (`size-6` → `size-8`); the
  "Finding N of M" label `text-xs` → `text-sm`.
- **Count chips restored.** Re-added the `<CountChip>` aside on the "Findings"
  and "Passed" `PanelHeading`s (flush right, `count={findings.length}` /
  `count={passed.length}`); gave `CountChip` an explicit `font-medium` so the
  heading chips match the switcher chip (which inherited medium from its parent
  span).

## Sections

### Findings cards: active tint, static single card, select-none `7550799`

`FindingCard` / `FindingSwitcherCard` (`Requests.tsx`):

- **Active tint.** Active cards fill with the action-tone `-25` tint
  (`bg-warning-25` flag/redact, `bg-danger-25` block); inactive cards are white
  and **hover** to the tint. Hover classes are literal `hover:bg-warning-25` /
  `hover:bg-danger-25` consts (not composed `hover:${var}`) so Tailwind's
  scanner emits the rules.
- **Single finding is static.** When `findings.length === 1`, the lone
  `FindingCard` renders as a `<div>` (not a `<button>`): no pointer, no select,
  no click — there is nothing else to select. Multiple findings stay clickable.
- **select-none.** Clickable findings cards are `select-none` (matching the
  `Button` primitive) to stop accidental text selection on click; message /
  evidence content stays selectable.
- In-card count chip dropped to `text-xs` via a new `CountChip` `size` prop;
  the Findings / Passed heading chips stay `text-sm`.

### Detail KPI rail gets shadow-xs `7550799`

The request-detail KPI rail (`KpiRailShell` at `Requests.tsx`) passed
`shadow-none`, overriding the shell default. Changed to `shadow-xs` so it
matches the other rails (Models / Activity / Conversations already inherit it).

### Tune policy action routes to the Policies page `a2a5263`

In the finding "How to fix" actions (`RequestDetailBodyV2`), the **Tune policy**
button previously fired a toast ("Policy tuning · Adjust detector thresholds").
After: it navigates to `/policies` via the in-scope `navigate`.

### Audit Trail: Filters modal replaces inline event-type Select `e85cafb`

`EventLog` in `src/pages/AuditTrail.tsx`. Mirrors the canonical Requests.tsx
Filters dialog (staged drafts + Reset/Apply).

- **Toolbar.** Removed the inline "All events" event-type `<Select>`. `SearchInput`
  stays inline. Added a **Filters** `Button` (`variant="outline" size="sm"`,
  `SlidersHorizontalIcon` + label) in its place, with an active-count `Badge`
  (`secondary`, `h-4 min-w-4`) — count = number of active filter groups.
- **Modal** (`Dialog` → `DialogContent w-full sm:max-w-[440px] gap-4`): three
  labeled full-width rows + a `DialogFooter sm:justify-between` footer.
  1. **Event time** — reuses the existing `DateRangePicker` (`className="w-full"`,
     From/To date+time, no new calendar component).
  2. **Member** — multi-select `Select` (`multiple`), options = roster present in
     the rows (Chad Ponticas, Jordan Lee, Mateus Silva, Kira Tan). Trigger label
     via `SelectValue` render fn: "All members" / "N selected".
  3. **Event type** — multi-select `Select` (`multiple`), options = the full
     `EventKind` union (AUDIT, REQUEST, POLICY, EVENT, LIMITS) in badge casing.
  4. Footer: **Reset** (ghost, clears drafts) + **Apply** (commits drafts, closes).
- **Filtering** (AND-combined in `filteredRows`): search query AND member ∈
  selected (if any) AND kind ∈ selected (if any) AND row `at` within the
  date+time range (if set). An empty group imposes no constraint.
- **Empty-state recovery.** `TableEmptyState` now renders a "Clear filters"
  `action` button when any group is active or a search query is set; it resets
  all four (members, kinds, range, query).
- Page-reset key now tracks members/kinds/range/query (was the single `filter`).

### Audit Trail Filters modal: Cancel button `e85cafb`

Footer now mirrors Requests exactly: **Reset** (ghost, left) + a right cluster
of **Cancel** (`DialogClose` rendering an `outline` Button) + **Apply**. Cancel
closes without committing drafts.

### TableEmptyState merges into its host Card — no empty bands `e85cafb`

`src/components/ui/table-empty-state.tsx`. The inner `EmptyState` kept its
`border` even with radius/shadow stripped, so inside a `<Card density="flush">`
it read as a bordered box nested in the Card, with the Card's `py-6` showing as
empty bars above and below the content. Added `border-none bg-transparent` to
the override (now `rounded-none border-none bg-transparent shadow-none`) so the
empty-state content sits directly on the host Card surface — one card, centered
content, no top/bottom bands. Global: applies to every table empty state
(Audit Trail, Requests, Security, Team, Activity).

### Table-section wrapper audit — all 13 table pages `e85cafb` (no code change)

Audited every `src/pages/` table page to confirm the section title + toolbar and
the table `<Card>` share ONE `flex flex-col gap-4` wrapper (16px title→table gap,
not the content-pane `gap-6` of 24px), matching the corrected `AuditTrail` /
Overview shape. **No code changes were needed — every page is already conformant.**

Two distinct, both-acceptable patterns exist and were classified per page:

- **Page-level section title above a table Card (the pattern under audit).** Title
  row + toolbar and the `<Card>` are children of one `flex flex-col gap-4` wrapper;
  the `<Card>` is the wrapper's last child (wrapper close immediately follows
  `</Card>`). Verified correct on:
  - `AuditTrail` (`EventLog`, reference — untouched)
  - `AuditTrailMerkle` (wrapper L379 `mt-2 flex flex-col gap-4`, Card L423→close L542→`</div>` L543)
  - `Conversations` (wrapper L561, Card→`</Card>` L784→`</div>` L785)
  - `Requests` (wrapper L1305, table Card→`</Card>` L1842→`</div>` L1843)
  - `Security` (wrapper L1167, Card→`</Card>` L1369→`</div>` L1370)
  - `Models` (two sections, both `<section className="flex flex-col gap-4">`: h3 L1870
    and h3 L1886 → Card L1909 → `</section>` L1966)
- **Self-contained Card (title/toolbar inside the Card, or no separate page-level
  title) — correctly NOT in scope:** `Activity` (chart-card h3 is inside the Card;
  usage tables use `FilterToolbar` inside `<Card>`), `ApiKeys` (Keys table `<Card>`
  with `Toolbar` inside; Gate Connect is a 2-card setup block, not a table section),
  `Billing` (all tables use `CardHeader`/`CardTitle` inside the Card),
  `Limits` / `LimitsFree` (table `<Card>` opens directly, no separate section title),
  `LimitsDefault` (the only h-tag above a Card is inside the blurred upsell overlay,
  not a table section), `Team` (members table uses `FilterToolbar` inside `<Card>`).

Read-mangling caveat honored: wrapper class strings were read from ground truth via
`grep -o 'className="..."'` (the lossy Read/sed display had shown these as
`flex-col gap-4` with the leading `flex` token dropped — the files all contain the
literal `flex flex-col gap-4`). Card-vs-sibling nesting was confirmed by tracing the
first closing tag after each `</Card>` (it is the wrapper's own `</div>`/`</section>`
in every case). In-browser computed-style verification was not performed in this pass
(browser-driver tooling unavailable to the agent); no files were modified, so there
is no render-regression risk and no `tsc`/lint delta from the committed state.

### Security: Filters modal replaces three inline event Selects `e85cafb`

The `RecentEvents` table component in `src/pages/Security.tsx`. Mirrors the
canonical Requests.tsx Filters dialog (staged drafts + Reset/Cancel/Apply), kept
**single-select** — the existing single `<Select>`s move verbatim, no `multiple`,
`select.tsx` untouched.

- **Toolbar.** Removed the three inline single-select `<Select>`s — **Type**
  ("All types"), **Key** ("All keys"), **Action** ("All actions"). `SearchInput`
  stays inline; **Export CSV** stays inline. Added a **Filters** `Button`
  (`variant="outline" size="sm"`, `border-border bg-card font-normal`,
  `SlidersHorizontalIcon` + label) in their place, with an active-count `Badge`
  (`h-4 min-w-4 justify-center px-1 leading-none`). Count = number of the three
  filters not set to `"all"` (`[type, action, keyFilter].filter(v => v !== "all")`).
- **Modal** (`Dialog` → `DialogContent w-full sm:max-w-[440px] gap-4`,
  `DialogHeader` + `DialogTitle` "Filters"): three labeled full-width single-select
  rows (`flex flex-col gap-2`, `Label` `font-medium text-neutral-600 text-sm`,
  `SelectTrigger w-full`), in this order:
  1. **Type** — `draftType` / `setDraftType`; options All types · Injection · PII ·
     PHI · Credential (moved verbatim from the inline Select).
  2. **Action** — `draftAction` / `setDraftAction`; options All actions · Blocked ·
     Flagged · Redacted.
  3. **Key** — `draftKeyFilter` / `setDraftKeyFilter`; options All keys + the
     `EVENT_KEYS` map (verbatim).
  - Footer: `DialogFooter sm:justify-between` — **Reset** (ghost, left,
    `disabled` when `draftActiveFilterCount === 0`) + a right cluster of **Cancel**
    (`DialogClose` rendering an `outline` Button) + **Apply**.
- **Staged apply.** Three `draft*` states bind to the modal's `<Select>`s.
  `openFilters` seeds drafts ← committed on open; `applyFilters` commits
  drafts → committed (`setType`/`setAction`/`setKeyFilter`) and closes; Reset
  clears drafts only; Cancel / X / Esc / overlay discard. The committed
  `type`/`keyFilter`/`action` still drive `filteredRows` unchanged (AND-combined
  with the search query) — only the chrome moved.
- **Empty state.** `TableEmptyState` here has no "Clear filters" recovery action
  (title + body only), so it was left as-is per spec.
- **Verification.** `npm run lint` (eslint + ultracite) clean; `npx tsc -b` exits 0.
  In-browser verification of the modal filter flow was **not** performed — browser-
  driver tooling (Playwright MCP) was unavailable to the agent this session. The
  filter values + comparison logic are byte-identical to the prior inline Selects
  (the option lists moved verbatim, confirmed by exact-match edits), and the
  committed-state filtering predicate (`r.type !== type`, `r.key !== keyFilter`,
  `r.action !== action`) was not touched, so behavior parity is high-confidence at
  the type/logic level; only the live click-through of staged → applied is
  unconfirmed visually.

### Page subtitles use `tracking-snug` `e85cafb`

Swept every page-header subtitle (`text-base text-neutral-500`) from
`tracking-tight` (-0.025em, too aggressive for 16px body) to the project's
`tracking-snug` (-0.01em) — 22 pages. `design.md` updated: the `tracking-snug`
scope grew from two tiers to three (added page-header subtitles), and the
page-header subtitle layout spec now names `tracking-snug`.

### Audit Trail: header + KPI rail slimmed `e85cafb`

`src/pages/AuditTrail.tsx`. Removed the **Verify a hash** button (Export view
stays) and the **range controls** above the KPI rail (date pills +
`DateRangePicker`); the "Overview" label stays and all range-filter plumbing
was deleted, so KPIs + log read the full event set. KPI rail trimmed from four
tiles to **two** (Events logged, Last fingerprint), then split into two separate
`rounded-md border bg-card shadow-xs` cards in a `grid-cols-1 gap-4 sm:grid-cols-2`
(16px gutter); delta tag + link render inline (no `deltaRow`). Renamed the tile
link **"Open in DE Explorer" -> "Open in Explorer"**. Added a "To learn more,
check out our Digital Evidence docs" line under the subtitle linking to the
GitBook docs.

### Audit Trail: section title + table share one `gap-4` wrapper `e85cafb`

The `mt-2 flex flex-col gap-4` wrapper had closed after the "Recent events"
header row, leaving the table `<Card>` a sibling whose gap was governed by the
page pane's `gap-6`. Moved the Card inside the wrapper (like Overview's
label + KPI rail) so the title -> table gap is the intended 16px. Audited the
other 12 table pages: already conformant.

### Requests findings always masked; Unredact toggle removed `5734de5`

`src/pages/Requests.tsx` (`RequestDetailBody`, shared by the request-detail
modal + the `RequestsFindings` page) and `src/data/requests.ts`.

- Removed the admin **Unredact** toggle + label and all `showRaw` / `IS_ADMIN`
  threading. Sensitive values are never revealed.
- **Findings cards + evidence always render `redactedAs`** (never the raw
  `match`), for every finding type: PII/credentials show their token
  (`<EMAIL>`, `<AWS_ACCESS_KEY_ID>`, `<ANTHROPIC_API_KEY>`,
  `<AWS_SECRET_ACCESS_KEY>`, `<OPENAI_API_KEY>`); injection/blocked show
  `[blocked]`; flagged shows `[flagged]`. `match` is retained in data only for
  offset/highlight position math. The Details-tab Full request always renders
  the redacted body.
- The highlight popover (method/score/threshold) and evidence reveal-scroll are
  unchanged.
- Data: `redactedAs "<OPENAI_KEY>" -> "<OPENAI_API_KEY>"` (2 findings) so the
  card token matches the message body. All other PII/credential `redactedAs`
  already match their message token.

### Billing modals: fixed 500px from md up `5734de5`

`AddCreditsDialog` + `AutoRechargeDialog` in `src/pages/Billing.tsx`.

- Width is mobile-first: base `w-[calc(100%-2rem)]` (viewport minus 16px
  gutters) capped at `max-w-[500px]`, then `md:w-[500px]` locks a fixed 500px
  from 768px up. On a 1920px screen the dialog is 500px, not full-bleed.
- Root cause of the prior breakage: the base `DialogContent` ships
  `w-full max-w-[calc(100%-2rem)] sm:max-w-sm`. The earlier inline-`style`
  and base-only `max-w-[500px]` attempts never beat `sm:max-w-sm` (a separate
  twMerge variant group), so from 640px up the dialog stayed capped at 384px.
  The override now replaces all three width classes, including the `sm:` one.
- Auto-recharge form grid breaks two-up at `min-[480px]` instead of `md`.
