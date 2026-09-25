# UI Changelog: 2026-09-25

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-9-24.md`](./changelog-9-24.md)

---

## Sections & surfaces

### Messages: Device name column and filter, columns reordered (`pages/requests/RequestsTable.tsx`) · [911a926]

The Recent messages table on `/messages` gains a Device name column and
filter, and two columns move.

- **Column order, before:** Time, Status, Security, Model, Message,
  Conversation, Key, Tokens In/Out, Latency, Cost. **After:** Time, Status,
  Security, Key, Device name, Message, Conversation, Model, Tokens In/Out,
  Latency, Cost. Key moves before Message; Model moves after Conversation.
- **Device name column:** new, sortable, after Key. Cell styling copies the
  Activity page's Device name column (`type-copy-14 block max-w-[20ch]
  truncate`). The device resolves from `API_KEY_ROWS` (`activity-data.ts`)
  through a module-level `DEVICE_BY_KEY` map, so both pages agree. A miss
  renders a dash plus sr-only "No device recorded".
- **Widths:** Device name takes 8% (header-bound, about 123px needed of
  126px). Table floor `min-w-[1484px]` to `min-w-[1612px]`; other columns
  keep their pixel widths.
- **Filters modal:** new Device name select (distinct devices on the
  scope-filtered rows, sorted, plus "All devices"), wired through draft,
  apply, reset and the active count. Field order is now Key, Device name,
  Model, Response, Guardrail.

### Messages: every row shows a message, flagged rows get matching findings (`data/authored-request-bodies.ts`) · [1659527]

- **Before:** 51 rows on `/messages` rendered a dash in the Message column
  and detail body because no captured body existed for them. **After:**
  each has an authored user message in the new
  `src/data/authored-request-bodies.ts`, merged in `getRequestBody` as a
  fallback after the verbatim captures in `request-bodies.ts`. Previews in
  `request-previews.ts` regenerated: 153/153 rows resolve.
- **Findings:** 18 flagged, redacted or blocked legacy rows in
  `data/requests.ts` now carry findings that match their message text
  (evidence equals the message; the match is masked in the preview).

### Activity reconciled to the Messages page (`data/message-totals.ts`) · [1659527]

- **Single source:** new `MESSAGE_TOTALS` (48 / 468 / 2,248 / 4,860 per
  range) feeds the Activity KPIs, key table and trend
  (`activity-data.ts`, `Activity.tsx`, `activity/TrendCard.tsx`), the
  Messages hero (`requests/hero-data.ts`), Overview, Teams, team security
  and token savings.
- **Per key:** messages split by each key's share of the real rows; spend
  and tokens = messages x that key's real-row averages (BYOK keys $0).
- **Activity at All, before:** 542,241 messages, $2,104.52 spend.
  **After:** 4,860 messages, $24.69 spend, 626.9M tokens.
- **Test:** `activity-data.test.ts` asserts KPI === Messages hero ===
  key-table column sum per range for messages, spend and tokens.

### Security events and budget meters follow the real rows (`security/events-data.ts`, `data/teams.ts`) · [1659527]

- **Security events, before:** a fixed 25% of messages (All 1,215).
  **After:** the real rows' non-allow share (32/153) of `MESSAGE_TOTALS`
  (All 1,016). Test added in `events-data.test.ts`.
- **Seed budget caps** resized to the real spend so the meters show a
  believable fill with no state change: org $1,500 to $15 (15.9%);
  Development $25 / $100 / $250 to $1 / $2.50 / $7; Design $250 to $7. A
  test asserts every seed meter is visibly filled and under its warn line.
  Shipped dialog presets are untouched.

### Messages: Filters key list follows the Keys page (`pages/requests/RequestsTable.tsx`) · [23eb715]

- **Before:** the Key select in the Filters modal was a hardcoded list that
  left out design-agent and offered the revoked test-key. **After:** it
  lists the live (non-revoked) keys from `API_KEY_SEED_ROWS`, in Keys page
  order, narrowed to the viewer's scope. Held in a module-level
  `LIVE_KEY_NAMES` plus a `useMemo` on the scope.

### Keys and Activity: only test-key and ci-runner are revoked (`data/api-keys.ts`, `pages/activity-data.ts`) · [23eb715]

- **Revoked set:** test-key and ci-runner on both the Keys page and
  Activity. ci-runner was never used: traffic all zeros, last-used empty,
  and it leaves the Design team (`data/teams.ts`). test-key has real
  Messages rows, so its last-used is its latest row (May 12 09:40:44).
- **Activity per-key split:** a revoked key reads 0 in any window that
  opens after its last activity (the later of its last real row and its
  last-used date), and its share goes to the keys that could still send.
- **Tests:** pinned 7D figures updated in `teams.test.ts`,
  `view-scope.test.ts` and `activity-data.test.ts` (org spend $2.38 to
  $2.41, 15.9% to 16.1%; Sonnet 5 and Qwen swap rank).

### Messages: real replies on authored rows, none on blocked or errored rows (`data/authored-request-bodies.ts`, `requests/RequestDetailBody.tsx`) · [23eb715]

- **Blocked and error rows:** no placeholder assistant reply. The detail
  body returns an empty response for them, so the response block is
  skipped.
- **Replies:** 44 authored rows that reached the model now carry a real
  assistant reply that answers their message (Jev reply-fit min 0.83,
  median 0.94). Row 1ba6a849 rewritten to fit its SEPA conversation.
- **Blocked attacks:** 4 blocked messages rewritten so the attack arises
  from the conversation's own work. Findings keep their category, type,
  rule, verdicts and match; evidence equals the new message. Jev
  plausibility, before to after: 78fe6ea4 (credential in a pasted
  finance-bucket config) 0.66 to 0.82; 460e3baa (injection inside pasted
  partner welcome copy) 0.62 to 0.81; d382e628 (system prompt request to
  share the setup with another team) 0.74 to 0.82; d0b46d2b (key inside a
  pasted API call) 0.70 to 0.82. Previews regenerated.

## Conventions

### Unused finding and detector fields removed; scanner vendor name dropped (`data/requests.ts`) · [1659527]

- **Deleted fields nothing reads:** `RequestFinding` `policy`, `method`,
  `score`, `threshold`, `recognizer`, `reasoning`; `PassedDetector`
  `method`, `score`, `threshold`; `DETECTOR_CATALOG` `method`,
  `cleanScore`, `threshold`; security `TYPE_DETAILS` `policy`,
  `detection`, `layer`. Kept `turn`, `verdicts`, `rule`.
- **Vendor name:** every mention of the PII scanner's vendor name is gone
  from `src`, along with the dead doc references in `CLAUDE.md` and the
  front-end agent's `gateway-context.md`.
