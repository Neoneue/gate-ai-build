# UI Changelog: 2026-08-20

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-8-19.md`](./changelog-8-19.md)

---

## Conventions

### Table row-identifier cells take the copy voice `e7a08f5`

**`design.md`**, **`scripts/check-design-tokens.mjs`**

Before: `design.md` §3 handed entity display names to the Label voice "including when they are the clickable identifier of a table row". The Messages table's Model cell followed that rule and rendered at `type-label-14`, which made it the one column shouting across every row.

After: the enumeration reverses that clause. A table row's identifier cell is Copy even when it is the row's drill-in target, because it reads as one of a set of peer cells rather than as a control's own label. Scope is the identifier cell and `DetailList` values, nothing else — not buttons, nav, tabs, column headers, or standalone `TextLink` controls.

The voice gate flags `type-copy-*` inside a label-role tag and `RowActionButton` is one, so a site taking the carve-out declares it with a `design-allow-copy-voice` mention in a comment within the 5 lines above the `className`. Per-site by construction; there is no file or repo switch. Verified both directions: the same markup still fails without the marker.

Worth knowing for anyone auditing that table — the Conversation and Message cells were already `type-copy-14` inside clickable wrappers, and only passed because the gate cannot see through a `render` prop. They are legitimate under the carve-out now, but they carry no marker, so a change to that nesting will start failing.

## Components

### Security event verdict reaches the table `e7a08f5`

**`pages/security/EventsTable.tsx`**

Before: the analyst verdict (Unreviewed / Confirmed / Invalid) was local state inside the dialog body, so the table could not see it and closing the modal discarded it.

After: a trailing Status column carries a badge for the verdict — `neutral` for Unreviewed, `success` for Confirmed, `warning` for Invalid, text from the same `VERDICT_LABEL` the modal Select reads so the two cannot drift. The state moves up to `EventsTableSection`; leaving it in the body meant selection going null on close took the verdict with it. Keyed on `requestId + type`, not `requestId` alone, because one request can raise two events (`req_8389e4` raises both a PII and a credential event). The value persists across close and reopen, in memory for the page session as the modal's own verdict already was.

Non-sortable head, since a verdict is session state with no sort value in `eventSortValue`. Section title is now "Recent security events".

### Message blocks in the security event modal tighten to 8px `e7a08f5`

**`pages/security/EventsTable.tsx`**

The wrapper holding the prompt and response blocks goes `gap-3` → `gap-2`. 12px → 8px between the two messages.

### Model name drops to the copy voice `e7a08f5`

**`pages/requests/RequestDetailBody.tsx`**, **`pages/requests/RequestsTable.tsx`**

Before: `type-label-14` in both the detail body's `DetailList` and the Messages table row, at 500 against siblings at 400. In the modal it out-weighted Provider / API Key / Endpoint; in the table it out-weighted Message / Conversation / Key.

After: `type-copy-14` in both. The `DetailList` value needed nothing else. The table row sits inside `RowActionButton` and needed the `design-allow-copy-voice` marker described under Conventions above.

### Provider shows the upstream host `e7a08f5`

**`pages/requests/data.ts`**, **`pages/requests/RequestDetailBody.tsx`**

Before: `Anthropic`, from `VENDOR_META[row.vendor].label`.

After: `api.anthropic.com`, from a new `VENDOR_HOST` map that sits beside `VENDOR_ENDPOINT` in `pages/requests/data.ts` — both are `Record<Vendor, string>` and have to stay exhaustive together. Rendered in `type-mono-14`: a hostname is a machine identifier, and it now matches the Endpoint row directly below it. `VENDOR_META` still carries the brand name everywhere else.

Both the modal and `/messages-findings/:id` get this, since they share `RequestDetailBodyV2`.

## Sections

### Messages table narrows 1580 to 1484 `e7a08f5`

**`pages/requests/RequestsTable.tsx`**

Four steps against the measured basis from 8-19, to cut side-scrolling:

| col | before | after | need | slack |
| --- | --- | --- | --- | --- |
| Tokens | 150px | 134px | 121 | +13 |
| Message | 261px | 245px | 4501 | elastic |
| Conversation | 261px | 245px | 401 | elastic |
| Status | 103px | 95px | 92 | +3 |
| Security | 111px | 103px | 100 | +3 |
| Model | 205px | 189px | 156 | +33 |
| Cost | 103px | 87px | 74 | +13 |

Status and Security got half a point each, not the full point asked for: a point is ~15px at that floor against 11px of measured slack, so 1% off each would have clipped both. They are spent now at +3px apiece, the tightest margins in the table.

The floor lands on 1484 rather than a rounded figure because that is the value at which a column that was NOT narrowed keeps its exact pixel width (Time is `9.5 / 94 * 1484` = 149.96px), and it sits on the 4px grid. Declared percentages sum to 94, which is deliberate: `table-fixed` hands the spare six points back proportionally, and that is what holds the untouched columns steady as the floor drops.

Still ~258px of side-scroll against the 1226px content column. Remaining slack totals ~100px and taking all of it leaves zero margin, so the next real lever is structural — shortening "Tokens In/Out" to "Tokens" frees ~44px on its own, since that column is sized by its header rather than its data.

The measured-basis comment is re-derived for the new declarations, and its non-elastic total is corrected from 998px to 898px. The `need` column sums to 898 and always did, so the old figure was an arithmetic slip rather than a changed measurement; the space left for Message + Conversation at the 1226px content column is 328px, not 228px.
