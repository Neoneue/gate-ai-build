# UI Changelog: 2026-09-04

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-9-3.md`](./changelog-9-3.md)

---

## Sections

### Messages: budget-blocked row reads a UUID prefix, not "budget-block" `a3843b0`

Before: the live budget-blocked message (one per team over a hard cap,
`src/pages/requests/budget-block-rows.ts`) carried the id
`budget-block-<teamId>`. The Message cell's second line shows the first two
dash segments of the row id, so that row read "budget-block" where every
other row reads a UUID prefix such as `34fef969-7dfc`. After: the id is
seeded through `fallbackRequestUuid` on the team, so it is UUID-shaped like
every seeded row and stable across reloads. The deep link
`/messages-findings/:requestId` follows the same id. Test asserts the shape.
