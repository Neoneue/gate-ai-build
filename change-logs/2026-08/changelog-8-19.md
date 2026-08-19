# UI Changelog: 2026-08-19

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-8-12.md`](./changelog-8-12.md)

---

## Components

### Message column identifies a request on its row `dbcdacb`

**`pages/requests/RequestsTable.tsx`**, **`pages/requests/message-preview.ts`**, **`data/redact.ts`**

Before: a session's rows were indistinguishable. Conversation is per-conversation, so the same title and `cnv_*` repeated on every row, leaving Time as the only difference between two requests.

After: a Message column sits between Model and Conversation, two lines, `type-copy-14` truncating text over a `type-mono-12` request id. The text is what the request actually said, resolved `userMessage` → `toolArgs` → `summary`. `toolArgs` is what makes a tool row readable: `Bash: grep -n "isVerySlow" src/...` instead of the useless `tool: Bash` that `summary` gives. Measured over 153 rows, coverage is 13 / 89 / 101; the 51 rows with no captured body render an em dash plus an `sr-only` note, matching how Cost handles BYOK.

Full text is reached from the row via the `Tooltip` primitive, not a native `title`. The trigger is the text span itself, so it adds no tab stop and the row's only keyboard target stays the drill-in link in the Model cell.

Preview text is masked before it renders. `data/redact.ts` is now the single implementation of the PII/credential rule, shared with `conversationDetail.ts`. Four rows were showing real email addresses in the DOM and tooltip before this.

### Request ids are UUIDs, shown as two segments `dbcdacb`

**`data/requests.ts`**, **`data/request-bodies.ts`**

Before: `req_cd0e57`. After: `5ef89e48-0545-40cb-8b7f-9f6045eace37`, displayed as `5ef89e48-0545`.

Grounded in gate-main, where `gateway_requests.request_id` is a text column filled by `randomUUID()`. `req_*` is only a display shortening there, so storing it as the value was backwards. Three helpers now exist: `requestRowId` (full UUID, used for routing and body lookup), `requestIdLabel` (first two segments, what the row shows), `shortRequestId` (gate-main's `req_` + 6 hex form).

Also fixes a collision: the old fallback repeated for rows sharing a conversation and status code, so 20 of 153 rows were unreachable at `/messages-findings/:id`.

### Tokens In and Out merge into one stacked column `dbcdacb`

**`pages/requests/RequestsTable.tsx`**

Both columns were header-bound, not value-bound: `Tokens Out` needed 105px for its label against 68px for its widest number. Merged into one `Tokens In/Out` column, in over out, in the two-line shape Message and Conversation already use. Row height is unchanged. Freed ~108px.

### Time renders the date in sans, the clock in mono `dbcdacb`

**`pages/requests/RequestsTable.tsx`**

A date is read as a word, not scanned digit by digit, and mono made `Jun 6` unnecessarily wide. The date is now sans with `tabular-nums`, which restores the fixed-advance figures mono was providing for free, so every date span measures 39.3px and the clocks stay in a straight edge. The clock stays mono.

### Key column truncates `dbcdacb`

**`pages/requests/RequestsTable.tsx`**, **`data/requests.ts`**

The Key cell had no truncation, so a long key name spilled into the next column. Now capped at 20 characters by `keyLabel()` plus a CSS `truncate` and a hover tooltip. Both bounds are needed: 20 mono characters are still wider than the column.

## Sections

### Device name column on the key usage table `15a8d94`

**`pages/Activity.tsx`**, **`pages/activity-data.ts`**

A left-aligned, sortable Device name column between Users and Messages, so a key's row names the machine it runs from. Values resolve as `seed.device ?? deviceFor(seed.owner)`: `DEVICE_BY_OWNER` holds each person's default, and a seed overrides it when a key runs from a second machine. Chad's `prod-agent` reports a Macbook Air while his other keys stay on the Macbook Pro, so owner and device are independent axes.

Widths: the three text columns take an explicit 14%, the six numeric columns stay unspecified so `table-fixed` splits the rest evenly, and `min-w` moves 1000 → 1168. Text cells cap at 20ch with a `title`.

### Messages table column widths, re-measured `dbcdacb`

**`pages/requests/RequestsTable.tsx`**

`table-fixed` with `min-w-[1580px]`, down from 1780px across the session. Widths are now measured rather than estimated, by cloning the table with `table-layout:auto; width:max-content` and stripping every clamp:

| col | % | px | need | slack |
| --- | --- | --- | --- | --- |
| Time | 9.5 | 150 | 138 | +12 |
| Status | 6.5 | 103 | 92 | +10 |
| Security | 7 | 111 | 100 | +11 |
| Model | 13 | 205 | 156 | +50 |
| Message | 16.5 | 261 | 4501 | elastic |
| Conversation | 16.5 | 261 | 401 | elastic |
| Key | 8.5 | 134 | 125 | +9 |
| Tokens In/Out | 9.5 | 150 | 121 | +29 |
| Latency | 6.5 | 103 | 92 | +10 |
| Cost | 6.5 | 103 | 74 | +29 |

Message and Conversation are the only truncating columns, the only two whose content is unbounded. The eight others need 898px in total, which is why this table side-scrolls: at the 1226px content column only 328px would remain to split between them.

The stale body-cell widths (`w-48` on Time, `w-28` on the badges, `w-60` on Model, `max-w-[320px]` on Conversation) are gone. Under `table-fixed` they were inert and only misleading.
