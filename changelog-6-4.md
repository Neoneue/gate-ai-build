# UI Changelog — 2026-06-04

Running log of UI changes made this day, grouped by component (sections
alphabetical). Concise and written for an agent/dev to **diff against and
replicate** — each entry states what changed, the before → after, and where.
Append new entries as we make UI changes.

---

## Badges

- **Case:** `uppercase` (was `capitalize` / first-letter only). Baked into the
  Badge primitive base class (`ui/badge.tsx`).
- **Contrast → WCAG AA (4.5:1):**
  - `success`: `text-success-700` → `text-success-800` (was 4.47:1 → now 6.44:1).
  - `destructive`: translucent `bg-destructive/10 text-destructive` (3.97:1) →
    solid `bg-danger-100 text-danger-800` (6.91:1). Also brings it to visual
    parity with the other solid status variants (success/warning/neutral).
- **Findings-tab counter:** the Requests count badge → `neutral` (grey); was
  `warning`/`destructive` action-colored.

## Buttons

- **Press scaling:** scale DOWN on `:active` from `1` → `0.99` (was a
  `translate-y-px` drop). Curve = strong ease-out `cubic-bezier(0.23, 1, 0.32, 1)`
  (the `--ease-out` token / bare `ease-out` utility), `duration-150`.
- **Crisp labels:** added `will-change: transform` to the Button +
  IconActionButton primitives so the scaled text re-rasters cleanly instead of
  bitmap-stretching.
- **Reduced motion:** `motion-reduce:transition-none motion-reduce:active:scale-100`.
- **Scope:** applied site-wide via primitives + hand-rolled pressables (sidebar,
  Models card, etc.). NOT applied to popup/select/menu/dialog triggers, switches/
  toggles, navigating table rows, or plain text links.

## Cards / surfaces (radius)

- **Concentric radius:** a card nested inside another card uses a SMALLER radius,
  one step down per level. Ladder: `24 → 16 → 8 → 4`. On this stack: outer panels
  `rounded-md` (8px) → nested cards `rounded-xs` (4px). Surfaces at the same
  nesting level match; only descending a level steps down. Override shared
  primitives (DetailList, CodeCard) at the usage site, not in the primitive.

## Dropdowns (Select / Popover / Menu / DateRangePicker)

- **Position standard:** open BELOW the trigger (`side="bottom"`), right-aligned
  to it (`align="end"`), 8px gap (`sideOffset={8}`).
- **Select:** `alignItemWithTrigger={false}` → renders as a real dropdown that
  **flips up** when near the viewport bottom (collision avoidance), instead of the
  macOS-style overlay that centered the selected item over the trigger.

## Tables

- **Header row height:** 36px → 40px (`h-9` → `h-10`).
- **Sort on hover:** column headers are click-to-sort.
  - A `⇅` (ChevronsUpDown) glyph fades in on hover when the column is inactive;
    when it is the active sort it PERSISTS as a directional `↑`/`↓`
    (ArrowUp / ArrowDown).
  - **Three-state cycle:** click 1 = ascending, click 2 = descending, click 3 =
    unsorted (restores the table's default/authored order). Never locks the user in.
  - Click target is **content-width** (label + glyph), capped at half the cell —
    empty cell area is not clickable.
  - `aria-sort` set on the `<th>`.
  - **Foundation:** `useTableSort` + `sortRows` + `parseNumeric`
    (`@/hooks/use-table-sort`), `SortableTableHead` (`@/components/ui/table`).
    Local state, no TanStack. Table supplies a `getValue(row, key)` accessor;
    numeric columns parse via `parseNumeric` (em-dash/empty → null, sorts last).
  - Sort runs after filter/search, before pagination. Default = unsorted.
  - Applied to all data tables. NOT applied to action/kebab/checkbox columns,
    headers with interactive content (e.g. a Tooltip), or columns with no clean
    comparable value.

## Tabs

- Tab triggers gained the same press feedback as buttons: `active:scale-[0.99]` +
  `transition-[colors,scale]` + `will-change:transform`.
