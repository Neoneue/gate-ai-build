# Demo clock: shift every authored date to "recently used"

Status: PLAN, not started. Owner: main session orchestrates; three
front-end-developer agents execute Phases 1 to 3 in parallel after Phase 0
lands. Target: the site reads as if the org has been using it through late
August 2026, and stays current on every future load without another edit.

## 1. Findings from the survey (2026-09-01)

Dates on the site come in three storage shapes and at least eight
independent "now" anchors. Nothing shares a clock.

| Shape | Where | Count |
| --- | --- | --- |
| `Date` literals `new Date(2026, m, d, ...)` | api-keys 19, audit-trail 19 (+`NOW`), conversations 8, billing-history 6, teams 4, team-members 4, Team.tsx 3 (+`NOW`), notifications 3 (`NOTIFICATIONS_NOW`, `RECENT_CUTOFF`), chart-helpers 9, Dashboard 1, Conversations 1, TokenSavings 1, TeamDefault 1, events-data 1 | ~80 |
| ISO strings `"2026-05-12 09:09:42"` | pages/security-feed.ts 48, pages/security-data.ts 27 (parsed by `parseEventTime`) | 75 |
| Day + time string pairs `day: "Jun 6", time: "00:50:51"` | data/requests.ts, 153 rows across 20 distinct days (Mar 22 to Jun 6; 102 rows on Jun 6) | 153 |
| Turn time strings `time: "May 12, 14:24:14"` | data/conversations.ts message turns | 7 |
| Authored relative strings `relative: "5h ago"` | requests.ts, security-data.ts | dead field, no UI consumer |
| Hardcoded copy | Billing.tsx "Jun 6, 2026 · $25"; cancel-plan-dialog `BILLING_PERIOD_END = "Jun 12, 2026"` | 2 |
| Transcript text | data/request-bodies.ts, 49 ISO dates inside message bodies | leave as is |
| Real API data | data/models.ts `releasedAt` | do NOT shift |

Anchors ("now") currently in play:

| Anchor | Value | Used by |
| --- | --- | --- |
| Latest authored activity | Jun 6 2026 (18:30:12 = design-agent lastUsed) | requests (102 rows), api-keys, billing, notifications, security-data, conversations, team-members (Jordan), teams memberJoined (Jun 1 to 8) |
| `NOTIFICATIONS_NOW` | Jun 6 18:30:12 | notifications feed + bell relative labels; `RECENT_CUTOFF` Jun 6 00:00 = unread band |
| `SPARK_TODAY` (x2) | Jun 15 12:00 | Conversations.tsx, TokenSavings.tsx sparkline axis labels |
| `NOW` (audit-trail.ts) | May 16 16:00 | audit rows May 12 to 14, `fmtRelative`, AuditTrail KPI, AuditRecordDialog |
| `NOW` (Team.tsx) | May 16 16:00 | invites sent May 6/7, expires NOW + 5/6 days, `Timestamp anchor={NOW}` |
| `ANCHOR` (x2) | May 12 14:30 | security/events-data.ts + requests/hero-data.ts hero chart axes |
| Apr 27 (x5 literals) | Apr 27 (14:30 for 24H) | activity/chart-helpers `getRangeDates`, Dashboard `make7dLabels`, activity/TrendCard bucket dates |
| security-feed.ts rows | May 12 | Dashboard + Activity preview feeds |

Real-clock reads that are CORRECT and must stay real: `Timestamp` relative
tooltip default anchor, `formatRelative` default anchor, Limits/LimitsFree
`resetsAt(new Date())`, ApiKeys create `createdAt: new Date()`, teams
`moveMembersToTeam` / fold-ins / `memberJoinedAt` fallback.

Filters never compare authored dates to real now. Ranges are RANGE_SCALE
projections and per-range row sets, so shifting data cannot empty a view.
`DateRangePicker` has no future bound and opens on the current real month.

## 2. Design decision

**Shift authored dates by whole days at construction time. Never shift at
the formatter.** One module computes the offset once per load:

- `AUTHORED_TODAY = 2026-06-06` (local). It is the latest authored activity
  day and the day the unread notification band, the Messages "today" rows,
  and the newest key usage all sit on.
- `DEMO_TODAY = startOfDay(real now) minus 1 day`. Authored "today" maps to
  real YESTERDAY, so every authored instant is in the past, times of day are
  preserved (00:50:51 stays 00:50:51), and no timestamp can read as future.
- `DEMO_SHIFT_DAYS = daysBetween(AUTHORED_TODAY, DEMO_TODAY)`, applied with
  `setDate` so DST never moves the wall clock.
- Because the offset is computed from the real clock at load, the site is
  current forever. No re-run.

Why not shift at render (formatters / Timestamp): runtime-created dates
(new key, team move, limit reset) are real now and would be pushed into the
future. Why not rewrite literals with a script: it goes stale in a quarter
and the day/time string rows would need 153 edits in a 4,000-line file.

Charts are re-anchored, not shifted. Their series are synthetic (no per-row
dates), so the Apr 27 / May 12 / Jun 15 anchors all become `DEMO_NOW`. This
also fixes today's silent inconsistency where the Activity axis ends 40
days before the Messages table.

## 3. Phase 0: foundation (main session, before any agent starts)

New `src/lib/demo-clock.ts` (pure, no React, no imports from data):

```ts
export const AUTHORED_TODAY: Date;            // 2026-06-06 00:00 local
export const DEMO_TODAY: Date;                // real yesterday 00:00 local
export const DEMO_SHIFT_DAYS: number;
export const DEMO_NOW: Date;                  // shift(2026-06-06 18:30:12)
export function shiftAuthored(d: Date): Date; // + DEMO_SHIFT_DAYS via setDate
export function authoredDate(y, m, d, h = 0, mi = 0, s = 0): Date; // shifted
export function parseAuthoredEventTime(s: "2026-05-12 09:09:42"): Date;
export function parseAuthoredDayTime(day: "Jun 6", time: "00:50:51"): Date; // year 2026
export function authoredDayLabel(d: Date): string;   // "Aug 31" via formatters
export function demoAnchorFields(): { month, day, hour, minute, date }; // DEMO_NOW parts
export function __setDemoShiftDaysForTests(n: number | null): void;
```

`src/lib/demo-clock.test.ts`: shift preserves H:M:S; `shiftAuthored(AUTHORED_TODAY)`
equals DEMO_TODAY; DEMO_NOW < real now; `parseAuthoredDayTime("Jun 6","00:50:51")`
lands on DEMO_TODAY 00:50:51; `parseAuthoredEventTime` round-trips;
`DEMO_SHIFT_DAYS` is an integer.

Gate: tsc, vitest. Commit `feat(demo-clock): ...` alone so agents branch from it.

## 4. Phase 1: Date-literal data files (agent A)

Mechanical: `new Date(2026, ...)` becomes `authoredDate(2026, ...)`. Files
and specifics:

- `src/data/api-keys.ts` (19): createdAt / lastUsed. The `// 2026-05-17 09:41:06`
  trailing comments become `// authored 2026-05-17 09:41:06`.
- `src/data/audit-trail.ts` (19 + `NOW`): rows to `authoredDate`; `NOW`
  becomes `authoredDate(2026, 4, 16, 16, 0, 0)`. `fmtRelative` unchanged.
- `src/data/billing-history.ts` (6).
- `src/data/conversations.ts`: 8 `updated` to `authoredDate`; the 7 turn
  `time: "May 12, 14:24:14"` strings become
  `time: formatTimestamp(authoredDate(2026, 4, 12, 14, 24, 14))` (formatTimestamp
  already yields "May 12, 14:24:14" shape). Verify the rendered string is
  byte-identical in shape before and after.
- `src/data/team-members.ts` (4 `joined`).
- `src/data/teams.ts` (4 `memberJoined`).
- `src/data/notifications.ts`: `NOTIFICATIONS_NOW = DEMO_NOW`;
  `RECENT_CUTOFF = DEMO_TODAY`; delete local `parseRequestTime` + `MONTHS`
  and import `parseAuthoredDayTime`. `parseEventTime` import stays (Phase 1
  changes its body, below).
- `src/pages/security-data.ts` `parseEventTime`: return
  `parseAuthoredEventTime(stored)`. All 75 ISO strings then shift with zero
  data edits. `eventSortValue` keeps sorting on the raw string (monotonic).
  Verified consumers: EventsTable (Timestamp via parseEventTime),
  notifications, Dashboard L794 (`formatTimestamp(parseEventTime(row.time))`).
  No surface renders the raw string.
- `src/pages/Team.tsx`: `NOW` becomes `DEMO_NOW`; invites `sent` become
  `authoredDate(2026, 5, 5)` and `authoredDate(2026, 5, 4)` (re-dated from
  May 6/7 so they sit inside the expiry window); `expires = sent + 7 days`;
  drop `anchor={NOW}` on the expires Timestamp so "in 6 days" reads against
  real now. This is the ONE fiction re-date in the plan; it is required
  because a 7-day invite cannot be 25 days old and unexpired.
- `src/pages/Billing.tsx` L236: value becomes
  `${formatDateNumeric(BILLING_HISTORY[topUpRow].date)} · $25` reading the
  Jun 6 top-up row from billing-history (single source).
- `src/pages/cancel-plan-dialog.tsx`: `BILLING_PERIOD_END = formatDateNumeric(authoredDate(2026, 5, 12))`.
- `src/pages/TeamDefault.tsx` L26 `joined: new Date(2026, 3, 20)` to `authoredDate(2026, 3, 20)`.

Tests: `notifications.test.ts` and `audit-trail.test.ts` compare against
the exported anchors, so they stay valid. Run them.

## 5. Phase 2: chart anchors (agent B)

Every synthetic axis re-anchors to `DEMO_NOW` / `demoAnchorFields()`:

- `src/pages/security/events-data.ts` `ANCHOR` and
  `src/pages/requests/hero-data.ts` `ANCHOR`: replace the `{ month: 4, day: 12, hour: 14, minute: 30 }`
  literals with `demoAnchorFields()`; `minutesBeforeAnchor` keeps its
  year-2026 scaffolding comment but constructs from `DEMO_NOW` instead.
  Hour changes from 14:30 to 18:30; tick derivation reads real data points,
  so nothing else moves.
- `src/pages/Conversations.tsx` and `src/pages/TokenSavings.tsx`
  `SPARK_TODAY = DEMO_NOW`.
- `src/pages/activity/chart-helpers.ts` `getRangeDates` + `getRangeLabels`:
  the five `new Date(2026, 3, 27...)` become `DEMO_TODAY` / `DEMO_NOW`.
- `src/pages/Dashboard.tsx` `make7dLabels` anchor = `DEMO_TODAY`.
- `src/pages/activity/TrendCard.tsx` bucket dates: same anchor.

Assert: Activity 7D axis ends on DEMO_TODAY; Security and Messages hero
24H axis ends on DEMO_NOW; sparkline tests in teams.test.ts still pass
(they are shape tests, no dates).

## 6. Phase 3: Messages day/time strings (agent C)

Do NOT edit row literals. Add derived accessors in the API region of
`src/data/requests.ts` (top ~550 lines only; never Read the file whole):

```ts
export function requestDate(row: RequestRow): Date;       // parseAuthoredDayTime(row.day, row.time)
export function requestDayLabel(row: RequestRow): string; // authoredDayLabel(requestDate(row)) -> "Aug 31"
export function requestTimeLabel(row: RequestRow): string;// `${requestDayLabel(row)}, ${row.time}`
```

Consumers to switch (all render `row.day` or compose it):

- `src/pages/requests/RequestsTable.tsx` L721 `{row.day},` to `{requestDayLabel(row)},`; L742 aria-label keeps `row.time`.
- `src/pages/requests/RequestDetailBody.tsx` L434 `{row.day}, {row.time}` to `{requestTimeLabel(row)}`.
- `src/data/conversationDetail.ts` L218, L245, L294, L308 `${r.day}, ${r.time}` to `requestTimeLabel(r)`.
- `src/pages/requests/data.ts` `rowTimeValue` to `requestDate(row).getTime()`.
- `src/data/requests.ts` L45 to 50 is the `fallbackRequestUuid` seed built from raw `row.day` + `row.time`. LEAVE RAW: shifting it would change every `/messages-findings/:id` URL and break the uniqueness test.
- `src/pages/Dashboard.tsx` L686 `{row.day} {row.time}` (Messages preview table) to `{requestDayLabel(row)} {row.time}`. L794 already goes through `parseEventTime`, nothing to do.
- `src/data/notifications.ts` `parseRequestTime` call sites to `requestDate(row)` (coordinate: agent A deletes the local helper, agent C wires the import; agent C owns notifications.ts edits, agent A does not touch it).

## 7. Phase 4: verification (main session)

1. `npx tsc -b`, `npm exec -- ultracite check src`, `npm run lint:design`, `npx vitest run`.
2. Residual grep must be empty outside the allowlist:
   `grep -rn "new Date(2026" src --exclude=request-bodies.ts` allowlist =
   `lib/demo-clock.ts` only. `grep -rn '"2026-' src` allowlist = models.ts
   `releasedAt`, comments, request-bodies.
3. Playwright sweep (port 3000, reuse the user's server): visit Overview,
   Activity, Messages, a message detail, Conversations, a conversation
   detail, Security, Audit Trail, API Keys, Billing, Members (both tabs),
   Notifications, Teams Enterprise + a team detail (Members, Keys, Budget,
   Security tabs). Extract every rendered date token
   (`/\b(Jan|Feb|...|Dec) \d{1,2}/`, `/\d{4}-\d{2}-\d{2}/`, relative
   phrases). Assert: no rendered date earlier than DEMO_TODAY minus 90 days
   (Mar 22 authored is the oldest request, 76 days back); no date later
   than real today except invite expiry and Limits reset; no "months ago"
   tooltip on any Jun 6 authored row.
4. Charts: 24H axes end at the DEMO_NOW hour; 7D axes end on DEMO_TODAY.
5. Reload twice, confirm identical output (offset is stable within a day).

## 8. Known leftovers, decide separately

- Transcript text in `request-bodies.ts` keeps 49 April to June dates inside
  message bodies. Visible only when reading a body closely.
- `security-feed.ts` rows are authored May 12, so the Dashboard and Activity
  preview feeds will read about 25 days before "yesterday". Re-dating them
  to Jun 5/6 is a fiction change (48 strings), not part of the clock.
- Audit trail rows are authored May 12 to 14 (about 24 days back). Same
  category.
- Weekday pattern of the sparkline backbones shifts with the offset;
  harmless.
- The authored `relative` fields on request and security rows are dead
  data; can be deleted in a later cleanup.

## 9. Rollback

Every change routes through `demo-clock.ts`. Setting `DEMO_SHIFT_DAYS` to
0 via `__setDemoShiftDaysForTests(0)` (or a one-line constant) restores the
authored calendar exactly, which is also how a screenshot regression can be
compared against the pre-shift build.
