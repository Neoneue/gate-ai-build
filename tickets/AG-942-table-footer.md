# Table footer and pagination behavior

The footer under every paginated table should describe the list it is actually
showing, and should only render controls that do something.

---

## Existing issue

The footer renders its full chrome regardless of how many rows exist.

- A table with a single page still shows a page strip: `<` `1` `>`, all three
  dead. There is nothing to page to, but the control is there suggesting
  otherwise.
- The rows-per-page select offers page sizes larger than the list itself. A
  "50" on a 6 row table is a no-op that reads as broken.
- Every table starts at the same page size, so a 400 row model catalog and an
  8 row team roster get the same treatment. Ten rows is too few for the
  catalog; twenty five is too many for a roster inside a team overview, where
  the table is a summary and should not dominate the page.

Net effect: the footer is decorative on small tables and adds height without
adding function.

---

## What needs to change

### Page strip

- Render the page strip only when there is more than one page. The predicate is
  `totalPages > 1`, never a hardcoded row count, so it follows whatever page
  size the user has selected.
- Keep the count line ("Showing 1 to 8 of 8") in all cases. It is information,
  not a control, and keeping it means the footer bar never appears and
  disappears, so nothing on the page reflows when a list crosses the threshold.

### Rows-per-page select

- Offered steps are 10, 25, 50, All.
- Never offer a step larger than the list. A 12 row list offers 10 and All.
- When only "All" survives, drop the select, its label and its separator
  entirely. A one option select is chrome with nothing to choose.

### Per-surface page size

- Large tables (model catalog, activity, messages, conversations, audit trail,
  security events, billing history): floor of 25, default 25. The 10 step is
  removed on these.
- Small and roster tables (team list, team members, team API keys, the per
  member and per model breakdowns inside a team): floor of 10, default 10.
  These stay at 10 even when a team grows past ten people.
- A surface's default page size must never sit below its own floor. See the
  trap note in the prompt below.

### Empty tables

- An empty table replaces the table and the footer with the empty state. The
  footer never sits beside an empty state.

---

## How this will help

- Small tables stop carrying controls that do nothing, which removes about a
  row of height from every roster and summary table.
- The footer stops making claims the table cannot back up. What the count line
  says and what the table renders are the same number.
- The range and page controls only appear when they will change something, so
  a dead control is never mistaken for a broken one.
- Page size matches the job of each table instead of being uniform, so a
  catalog opens with enough rows to scan and a team summary stays short.

---

## Prompt for your coding agent

Paste the block below into your agent, along with the screenshots of the
before and after states.

```text
Change the shared table footer / pagination component so it only renders
controls that do something, and so page size fits each surface. Do not build a
new component: change the existing shared footer and pass the per-surface
setting in as a prop. Screenshots of the target behavior are attached.

RULES

1. Page strip visibility
   - Render the prev / page numbers / next strip ONLY when totalPages > 1.
   - The predicate is totalPages > 1. Do NOT key it on a row count, and do not
     hardcode a threshold like "more than 10 rows". Page size is user
     controlled, so a row count and a page count are different questions.
   - Never render the strip disabled or greyed out as a substitute for hiding
     it.

2. The count line always renders
   - "Showing X to Y of N" stays visible in every case, including a single
     page and a single row.
   - This is deliberate: the footer bar stays mounted at a constant height so
     the page does not reflow when a list grows past one page. Only the
     controls on the right appear.

3. Rows-per-page select
   - Offer the steps 10, 25, 50 and All, in that order, All last.
   - Filter out any numeric step larger than the total row count.
   - Apply a per-surface minimum step (see rule 4) that filters from the other
     end.
   - If only "All" remains after filtering, do not render the select at all.
     Remove its label and any separator with it.

4. Per-surface floor and default
   - The footer takes a minimum-page-size setting, defaulting to 10.
   - Large / log-style tables pass 25: model catalog, activity, messages,
     conversations, audit trail, security events, billing history. Their
     default page size is also 25.
   - Small / roster tables keep the default of 10 and start at 10: team list,
     team members, team API keys, and the per-member and per-model breakdown
     tables inside a team.
   - The floor only has an effect on lists longer than the floor. A 6 invoice
     table shows "All" alone either way, so short lists are unaffected.

5. THE TRAP, do not skip this
   - A surface whose default page size sits BELOW its own floor will silently
     desynchronise. The floor removes that value from the options list, so the
     select falls back to displaying "All" while the table keeps slicing at
     the old size. The footer then reads "Showing 1 to 10 of 400" next to a
     select showing "All".
   - When you set a floor of 25 on a surface, raise its default page size to
     25 in the same edit.
   - Add a test that walks every call site, reads its floor and its default,
     and asserts the default is present in the options that floor produces.
     Assert the test found the expected number of call sites so a selector
     that matches nothing cannot pass.

6. Empty state
   - An empty table swaps out the table AND the footer for the empty state.
     The footer must never render beside an empty state.

7. The total must be the rows you are paging
   - Wire the footer's total to the same array the table renders, after all
     filters are applied. Do not wire it to a separate count from elsewhere
     (a summary endpoint, a headline metric, an unfiltered total).
   - If a filter or a date range narrows the table, it must narrow the footer
     total by the same amount in the same render.

VERIFY BEFORE YOU CALL IT DONE
Render each table at 1 row, at a count just under its floor, at one row over
its page size, and at several hundred rows. At each size confirm: the count
line is present and correct; the select is present only when it has more than
one option; the strip is present only when totalPages > 1; and the number in
the count line equals the number of rows in the tbody.
```
