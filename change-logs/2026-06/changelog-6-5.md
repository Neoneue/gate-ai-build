
# UI Changelog: 2026-06-05

Running log of UI changes made this day. Written for an agent/dev to **diff
against and replicate**: each entry states what changed, before → after, where,
and (for committed work) its commit hash.

Prior days: [`changelog-6-4.md`](./changelog-6-4.md).

**Using this log to make a change:**

- Each entry is tagged with its commit (`[abc1234]`) or `(uncommitted)`. For a
  committed entry, **`git show <hash>` is the exact diff** (the most reliable
  source; this prose is the summary).
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

### Findings reconcile to one source; values are detector-accurate (uncommitted)

The trace finding chip and the request's fired Security check now derive from the
same field (`guardrailReason` / the row's `findings`), so they cannot disagree.
Staging has a bug where a trace chip reads "pii" while the Security tab flags
prompt injection; we do not replicate that. Finding values follow the docs: email
is Presidio (`EmailRecognizer` / `EMAIL_ADDRESS`); AWS and Anthropic keys are
regex + Shannon entropy (`AWSKeyDetector` / `AnthropicKeyRecognizer`), never
labeled "Presidio".

## Components

### TraceItem — finding chip replaces the warn-only badge (uncommitted)

The step row's third line rendered a badge only when `status === 'warn'` with a
`warnNote`, so blocked findings showed nothing. → It now renders whenever
`event.finding` is set, label `{finding} · {findingAction}`, with
`variant={findingAction === 'Block' ? 'destructive' : 'warning'}` (red for Block,
amber for Redact/Flag) and an orange node icon. Needs `TraceEvent.finding` +
`findingAction` (added). Where: `src/pages/Conversations.tsx` (~1277).

## Sections & surfaces

### Requests + Conversations — recent window is one scripted conversation (uncommitted)

**What:** The 10 most-recent Requests rows are now a single conversation
`cnv_7a3f9e2b` (key `test1`, model `claude-opus-4-8`) instead of a different
conversation per row. All 10 requests are authored from `conversation-script.md`
(repo root): a dev session on the dashboard, 7 Allow / 2 Redacted / 1 Block,
tokens-in monotonic (2,140 → 18,730), block last.

**Before → after:**

- `REQUEST_ROWS_RECENT` was 6 rows spread across
  `cnv_aurora_42`/`orion_70`/`lyra_92`/`skylark_18`/`meridian_07`. → 10 rows, all
  `conversation: 'cnv_7a3f9e2b'`, each carrying `summary`, `traceKind`,
  `userMessage`, `assistantResponse`; the 3 finding rows carry `findings: [...]`
  with `evidence` = the userMessage.
- Request detail (`/requests-findings/:id` → `RequestDetailBodyV2`, the
  Findings-first PAGE) showed category-generic content (e.g. `j.doe@acme.com`,
  customer-feedback text). → It prefers `row.userMessage` / `row.assistantResponse`,
  and the finding rows' real `findings[]` drive the evidence, offset, and
  redaction diff: `lena.ortiz@constellation.io` (req_a1f3d9, PII);
  `ops@constellation.io` + `AKIAJ7XQ9DLF3VBNK2E4` (req_e4c7b1, PII + credential);
  `sk-ant-api03-…` (req_3f9c2a, credential BLOCK, 403, 0 out).
- Conversation detail KPIs reconcile from the 10 rows (10 reqs / 10 turns /
  104,080 in / 9,375 out / $0.8535 / 10m 19s). Messages render the real
  per-request user + assistant turns (a `scripted` path in `conversationDetail`
  that emits a user bubble + assistant bubble per request when rows carry
  `userMessage`; other conversations keep the title + derived-bubble fallback).

**Where:** `src/pages/Requests.tsx` (`REQUEST_ROWS_RECENT`, `RequestRow` type +4
fields, `RequestDetailBodyV2` ~3042, `ENTITY_LABEL` + aws/anthropic),
`src/pages/Conversations.tsx` (`CONVERSATION_ROWS` seed, `ModelId` +
`claude-opus-4-8`), `src/data/conversationDetail.ts`.

**Deep-links:** `/requests-findings/req_a1f3d9` (PII email),
`/requests-findings/req_e4c7b1` (PII + credential),
`/requests-findings/req_3f9c2a` (block); `/conversations?open=cnv_7a3f9e2b`.

### Conversations — finding count includes blocks + View Request resolves (uncommitted)

**What:** The finding banner/count now treats a block as a finding, trace steps
show finding chips, and View Request routes to the real request id (no 404).

**Before → after:**

- `findingCount` counted only `status === 'warn'` steps, so a block landed in
  Errors not findings (banner undercounted). → `findingCount =
  trace.filter(e => e.finding)`; `highestAction` = max finding action
  (Block > Redact > Flag); `bannerTone` destructive when Block. Banner now reads
  "3 findings · Highest action: Block", tabs Findings only 3 / Errors 1.
- Trace step `requestId` was `${requestRowId(r)}__${i}`, so View Request hit
  `/requests-findings/req_x__0` → "Request not found" 404. → trace + message
  `requestId` = `requestRowId(r)` (the real id); the React key stays
  `id: stepId(r, i)` (still unique via `__i`). View Request now lands on the
  exact request and round-trips with View Conversation.

**Where:** `src/data/conversationDetail.ts` (`FINDING_LABEL`/`FINDING_ACTION`
maps, trace `finding`/`findingAction`, `requestId`, scripted messages),
`src/pages/Conversations.tsx` (`TraceEvent` +`finding`/`findingAction`,
`findingCount`/`highestAction` ~611, `TraceItem` chip ~1277).

### Conversations — detail + list derive from one per-conversation source (uncommitted)

**What:** A conversation's detail (Request Trace, Messages, KPI rail, finding
banner, step-tab counts) and its list-row aggregates now derive from that
conversation's own request rows — a single source of truth — instead of shared
module constants. Fixes the bug where every conversation rendered
`cnv_aurora_42`'s trace + messages.

**Before → after:**

- `ConversationDetailBody` read module-level `SAMPLE_TRACE` (7 aurora steps) +
  `CONVERSATION_MESSAGES` (8 aurora msgs) for the trace, messages, banner, and
  tab counts, so every conversation looked identical. → It now calls
  `getConversationDetail(row, REQUEST_ROWS_ALL)`: trace = the conversation's
  request rows mapped to `TraceEvent`; messages = derived turns (opening user
  message = title, then one bubble per request) each carrying that row's id.
- The list + KPI rail showed hand-authored `reqs`/`turns`/tokens/cost that did
  not match the request rows (orion reqs 38 vs 10 rows; meridian 4 vs 11; lyra 32
  vs 8; vela 26 vs 7; skylark 11 vs 7). → `getConversationView(seed,
  REQUEST_ROWS_ALL)` recomputes `reqs` = row count, `inTokens`/`outTokens`/`cost`
  = sums of the owned rows, `turns` = authored turns capped at the row count,
  `status` → `failed` when every row errored (meridian). `duration` is unchanged
  (wall-clock, not a row aggregate).
- Trace + message ids are now `<requestRowId>__<index>` so cross-highlight
  (message ↔ trace) pairs correctly per conversation; the index disambiguates
  rows that share a base id (e.g. four aurora rows resolve to `req_aurora_4200`).
  Request-row latency (`"3.80s"`) is converted to `"3800ms"` so the trace's
  slow-row tinting still fires.

**Where:**

- NEW `src/data/conversationDetail.ts` — leaf module (type-only page imports +
  the pure `requestRowId`); exports `getConversationRequests`,
  `getConversationView`, `getConversationDetail`. No runtime import cycle:
  callers pass `REQUEST_ROWS_ALL` in and derivation runs at render time.
- `src/pages/Conversations.tsx` — wired `ConversationDetailBody`, the two panels
  (new optional `messages`/`trace` props), `ConversationKpiRail`, and the list
  section (`viewRows`) to the derived data; exported
  `ConversationStatus`/`TraceStatus`/`TraceEvent` + new `ConversationMessage`
  type for the data module to consume.

**No UI/visual change:** components, layout, classNames, buttons, tabs, and the
existing "View Request" / "View Conversation" links are untouched. Only the data
each surface renders, and the cross-highlight ids, changed.

**Verified at `localhost:3000`:** `/conversations-trace/:id` (page) and
`/conversations?open=cnv_…` (modal) both render correct, distinct
per-conversation data (aurora / meridian / lyra); KPIs reconcile (Requests =
trace length = All-steps tab); findings surface as warn chips; errors surface;
cross-highlight pairs message ↔ trace. No console errors. `npx tsc -b` still
needs a clean pass before promotion.

**Known follow-ups (out of this scope):**

- Legacy aurora constants `SAMPLE_TRACE` / `CONVERSATION_MESSAGES` /
  `ASSISTANT_TURN_COUNT` are now unused; kept (exported) to satisfy
  `noUnusedLocals`, pending removal.
- The list **Models** column still reflects each conversation's authored
  `models`/`vendors`, which can differ from the trace's actual request-row models
  (e.g. lyra seed = `gpt-4o-mini`, rows = `gemini-3-pro`). Deriving
  vendors/models from rows needs `ModelId` typing work.
- Agent C's findings-value corrections (PII score, recognizer/redaction strings,
  BYOK em-dash, slow-latency clamps) deferred per request.
</content>
