# UI Changelog: 2026-09-23

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-9-22.md`](./changelog-9-22.md)

---

## Conventions

### The page-link strip renders only past one page (`components/ui/table-pagination-footer.tsx`) · [98537c2]

- Before: the footer always drew the `Pagination` block. A list that fitted on
  one page got a fully disabled Prev / 1 / Next, three controls that could not
  be operated and one page number that told the reader nothing the count line
  had not already said.
- After: the block is wrapped in `showPageStrip = totalPages > 1`, so a
  one-page list renders the count line alone. The predicate keys on
  `totalPages`, never on a raw row count, so it follows the rows-per-page the
  reader picked: a 30-row list shows the strip at 25 per page and loses it at
  All. The count line always stays, on both sides of the gate. It is
  information rather than a control, and keeping it holds the bar's height
  steady so nothing reflows when a list crosses the threshold.
- The empty-state recipe is untouched: an empty table still swaps the whole
  footer out through `table-empty-state.tsx` rather than gating a piece of it.

### Page sizes split into two buckets, 10 on Teams and 25 everywhere else (`components/ui/table-pagination.ts`, `components/ui/table-pagination-footer.tsx`) · [537652e]

- Before: `rowsPerPageOptions(total)` offered 10 / 25 / 50 / All to every
  table, minus any step larger than the list itself.
- After: it takes a second argument, `rowsPerPageOptions(total, minStep = 10)`,
  and the footer exposes it as the `minRowsPerPage` prop. The Teams surfaces
  keep the floor of 10, because a roster or a team list is short and 25 would
  page nothing; every other table passes `minRowsPerPage={25}`, so the 10 step
  is gone there. The floor composes with the existing ceiling rule from the
  other end and never re-adds a step the list cannot support, so a 12-row list
  at floor 25 is still "All" alone.
- The contract a consumer must hold: raising the floor means raising its own
  default `rowsPerPage` to match. A `"10"` held against a floor of 25 is
  dropped from `options`, so the select would display "All" while
  `resolveRowsPerPage("10", total)` still sliced 10, the exact drift these two
  helpers exist to prevent. A test pins it for every consumer.

## Sections & surfaces

### Five Teams tables gain a pagination footer (`pages/teams/SecurityOverviewPane.tsx`, `pages/TeamDetailEnterprise.tsx`, `pages/TeamsEnterprise.tsx`) · [98537c2]

- Before: five tables on the Teams surfaces had no footer at all. They rendered
  every row they held with no count line and no page control, the only tables
  on the site outside the empty-state recipe to do so.
- After: `MemberFindingsTable` (`teams/SecurityOverviewPane`), `UsageBreakdown`,
  `MembersPane` and `KeysPane` (`TeamDetailEnterprise`) and `TeamsTable`
  (`TeamsEnterprise`) each take page state, slice through
  `resolveRowsPerPage` and render `TablePaginationFooter`. Eight render sites
  across the three files, since `MemberFindingsTable` is used twice and
  `UsageBreakdown` three times. The `MembersPane` in `pages/Team.tsx` is a
  different component that happens to share the name, and did not move.
- All five keep the default floor of 10 rather than passing `minRowsPerPage`:
  these are the short lists the Teams bucket exists for. In practice most of
  them sit on one page today, so what the reader sees is the count line alone,
  under the gate above.

### Eight tables take the 25-row floor (`pages/Models.tsx`, `pages/Activity.tsx`, `pages/Notifications.tsx`, `pages/Conversations.tsx`, `pages/requests/RequestsTable.tsx`, `pages/AuditTrail.tsx`, `pages/security/EventsTable.tsx`, `pages/billing/HistorySection.tsx`) · [537652e]

- Before: every one of these long tables opened its rows-per-page select on 10,
  a page size that turns a real list into a dozen pages.
- After: all eight pass `minRowsPerPage={25}`, so the select reads 25 / 50 /
  All. Activity and Notifications also move their default `rowsPerPage` state
  from `"10"` to `"25"`, because each was sitting below its own new floor and
  would have shown "All" in the select while the page still sliced 10. The
  other six already defaulted to 25 or higher.

### Policies: the nested inset cards are gone and the type hierarchy steps (`pages/Policies.tsx`, `pages/teams/PoliciesPane.tsx`) · [2f954a8]

- Before: each scanner's card held three further `Card`s inside it, one for the
  enable toggle, one for Action on detection and one for Sensitivity. A surface
  inside a surface with no hierarchy to earn it, and each inset card carried
  its own `px-4`, so its content indented away from the card header above it.
- After: the three are plain sections separated by a hairline through the
  `[&>*+*]:border-t [&>*+*]:border-border [&>*+*]:pt-4` divider idiom, and the
  `px-4` is gone, so every line in the tray shares one left edge with the
  header.
- Section titles step from `type-heading-16` to `type-heading-14`, four per
  file, so the scanner name reads as the heading and the three sections read as
  its parts rather than as three peers of it. The Pro promo card's own title
  stays at 16: it is a sibling of the scanner cards, not a section inside one.
- The spacing steps with the type. The card header takes 24/24 around its
  divider (`data-[density=default]:gap-6` on the `Card` when open, and the tray
  moves from `p-4` to `px-4 pt-6 pb-4`) against the sections' 16/16, so the
  header separates from the body by more than the sections separate from one
  another.
- Both twins move together, the Pro page and the Enterprise team pane.

### Conversations: the count is real and the range pills filter (`pages/Conversations.tsx`, `lib/range.ts`) · [5aa67af]

- Before: the page opened on `CONVERSATIONS_TOTAL = 100`, a fabricated constant
  that the hero scaled into a headline of 850 while eight real conversations
  sat in the table below it. The deltas beside it were hardcoded, the three
  sparklines were drawn from a `SPARK` literal fanned out by `distributeTotal`,
  and Avg cost came from an `AVG_COST_PER_CONVERSATION` constant. The range
  pills changed none of it.
- After: the headline, every hardcoded delta, `SPARK`, `distributeTotal`,
  `avgCostSeries` and `AVG_COST_PER_CONVERSATION` are deleted. `lib/range.ts`
  gains `rangeWindow` and `inRangeWindow`, and the pills filter
  `CONVERSATION_ROWS` by each row's real `updated` date. One filtered array
  then feeds the KPI count, all three sparklines, the table and the footer
  total, so none of the four can drift from the others.
- The ranges now report 24H 1, 7D 1, 30D 8 and All 8, which is what the eight
  seeded rows actually say.
- Avg turns and Avg cost derive for every role, and both render `—` when there
  is nothing to average, matching the mark the Cost column already shows for
  the BYOK conversation rather than printing a zero that would read as a
  measurement.

## Tests

### The pagination footer's two gates (`components/ui/table-pagination-footer.test.tsx`) · [98537c2]

- New suite, 6 cases, `render` under happy-dom, in two describes. The page-strip
  gate: the strip is absent when the whole list fits one page, present once it
  runs past one, keyed on `totalPages` rather than on a row count (a 30-row
  list at "All" gets no strip, the same list at 25 does), and the count line is
  present on both sides of the gate.
- The rows-select gate, pinned alongside it so the two cannot be confused: the
  select drops out under the smallest step while the count line stays, and
  returns once a step fits the list.

### The rows-per-page floor (`components/ui/table-pagination.test.ts`) · [537652e]

- New describe, 5 cases, on top of the existing `rowsPerPageOptions` suite: the
  10 step is dropped at floor 25, a list under the floor is still "All" alone,
  the floor never re-adds a step larger than the list, and the argument
  defaults to the Teams floor of 10.
- The fifth case is the drift guard. It reads every consumer's default
  `rowsPerPage` out of its own source and asserts the value is inside the
  options its floor produces, so a future page cannot set a default below its
  own floor and silently slice a different number than the select displays. The
  scan is itself asserted to be load-bearing, at least 13 footers across 13
  files, so a regex that quietly matched nothing could not pass.

### The conversations headline count (`test/conversations-count.test.tsx`) · [5aa67af]

- New suite, 3 cases, `renderRoute` against `DEMO_NOW`: the KPI value equals
  `CONVERSATION_ROWS.length`; the KPI, the footer total and the rendered row
  count are one number; and each range pill reports its own count with the KPI,
  the rows and the footer agreeing inside it.
- The point of the third case is that the pills are now a filter rather than a
  label, so the suite fails if any of the four numbers is ever re-derived from
  a constant instead of the filtered array.
