# Findings Model — Spec (Requests + Conversations modals)

> **Status:** PROPOSAL for review. No code written yet. Once approved, the finalized
> types fold into `data-model.md` §3.3 and the two modals are reskinned against them.
> **Goal:** reproduce the two spec images as closely as possible while obeying this
> repo's hard rule — *every visible value derives from one entity-row source of truth;
> nothing is hardcoded in JSX, and all surfaces reconcile.*

Spec images:

- **A. Requests detail modal** — `req_8f3a1c4…`: Findings tab, 2 findings + 1 passed, evidence panel with inline highlight, "Why this fired", "What we sent upstream" diff.
- **B. Conversations detail modal** — `cnv_4f7a91b2`: finding banner, All/Findings/Errors segmented control, inline highlights + finding chips on messages, richer trace rows.

---

## 1. Source-of-truth principle

One array of findings is authored per conversation. **Everything else is derived** —
banner counts, "highest action", inline offsets, redaction diffs, the Passed row, the
segmented counts, the existing `guardrail`/`guardrailReason` fields, and the Security-tab
check states. No finding count, score, or offset is ever written twice.

The conversation thread (messages) is the source of truth for **body text**; the findings
array is the source of truth for **what fired**. A finding points *into* a message by turn
index and carries the verbatim matched substring — never a stored offset (see §3.3).

---

## 2. New types

Aligns with the existing vocabulary (`CheckKey`, `CheckStatus`, `GuardrailAction`) so the
old fields can be derived from the new ones with no drift.

```ts
// Detector that ran. Maps 1:1 to the three checks already in the Security tab.
type DetectorId = 'presidio' | 'credential' | 'injection';

// Finding category == existing CheckKey.
type FindingCategory = 'pii' | 'credential' | 'injection';

// Finer-grained entity within a category (drives the finding title + redaction tag).
type EntityType =
  | 'email' | 'phone' | 'ssn' | 'credit-card' | 'person' | 'ip-address'  // pii
  | 'openai-key' | 'aws-key' | 'generic-secret'                          // credential
  | 'prompt-injection';                                                  // injection

// Action at finding granularity. Subset of CheckStatus (no 'pass' — a passed
// detector produces no finding). 'flag' | 'redact' | 'block' carry the app's
// policy tones (amber redact / red block / amber flag).
type FindingAction = 'flag' | 'redact' | 'block';

// Result of one detector on one request's payload. Models BOTH outcomes:
// fired === true  -> contributes a Finding (and a row in the Findings list)
// fired === false -> contributes to the collapsed "Passed · N" row
type DetectorResult = {
  detector: DetectorId;
  category: FindingCategory;
  /** UI label for the detection method: 'presidio' | 'entropy+regex' | 'classifier'. */
  method: string;
  /** Confidence 0..1. Present even when passed (e.g. injection 0.04). */
  score: number;
  /** Fire threshold; score >= threshold => fired. Shown in popover + Why-fired. */
  threshold: number;
  fired: boolean;
  /** Present iff fired. */
  finding?: Finding;
};

type Finding = {
  entityType: EntityType;
  action: FindingAction;
  /** Verbatim substring as it appears in the message body. Offsets are DERIVED
   *  at render via body.indexOf(match) — never stored (one source of truth). */
  match: string;
  /** Replacement sent upstream, e.g. '<EMAIL>'. */
  redactedAs: string;
  /** Index into the conversation message thread where `match` textually lives. */
  turn: number;
  role: 'user' | 'assistant';
  /** Trace step / request that scanned + carried this finding. Links the message
   *  chip to its trace row, and lets the Requests modal group findings by request. */
  requestId: string;
  /** "Why this fired" display strings. recognizer = detector's internal id
   *  (e.g. 'presidio.entity.email'); rule = human pattern note ('RFC-5322 pattern'). */
  recognizer: string;
  rule: string;
  /** Governing policy name, e.g. 'customer-pii-redact-v2'. */
  policy: string;
};
```

### Attachment to existing entities

- **Conversation** gains `detectors: DetectorResult[]` (the whole conversation's results,
  fired + passed). This is the single authored array.
- **`CONVERSATION_MESSAGES[*].body`** becomes a **plain `string`** for any message that
  carries a finding (today it is `React.ReactNode`). Tool-result bubbles can stay
  `ReactNode`. Rationale: highlighting needs `indexOf` on a real string.
- **`RequestRow`** gains nothing stored. For a given `requestId`, its findings are
  `conversation.detectors.filter(d => d.finding?.requestId === row.requestId)`.
  `guardrail` and `guardrailReason` are **derived** from those (see §3.4) and asserted
  to match the authored row in a dev check, so the table and modal never drift.
- **`TraceEvent`** keeps its shape; `warnNote` is **replaced** by a lookup into the same
  findings (the trace row renders detector + match + score from the finding whose
  `requestId` matches the event).

---

## 3. Derived values (the reconciliation rules)

| Visible thing | Where shown | Derivation (no hardcoding) |
| --- | --- | --- |
| Inline highlight span | both modals | `start = body.indexOf(f.match)`, `end = start + f.match.length` |
| "Bytes redacted: 14" | Req evidence | `f.match.length` (`"j.doe@acme.com".length === 14`) |
| Banner "N findings" | both | `detectors.filter(d => d.fired).length` (Conv = whole conv; Req = filtered by requestId) |
| "highest action: Redact" | both | max over fired actions by tone order `block > redact > flag` |
| Findings list | Req | `detectors.filter(d => d.fired)` |
| "Passed · N" row | Req | `detectors.filter(d => !d.fired)`; each shows `method` + `score` |
| Segmented "All steps · 8" | Conv | `trace.length` |
| Segmented "Findings only · 3" | Conv | count of trace steps whose `requestId` has a fired finding |
| Segmented "Errors · 0" | Conv | `trace.filter(t => t.status === 'danger').length` (or error status) |
| Message finding chip "1 finding" | Conv | count of findings with `f.turn === messageIndex` |
| Trace row detector+match+score | Conv | the finding for that step's `requestId` |
| Redaction diff (`j.doe@…` → `<EMAIL>`) | Req | `body` with `match` sliced out and `redactedAs` spliced in |
| Upstream provider/model | Req diff | from the `RequestRow` (`vendor`, `model`) — not the finding |
| `guardrailReason` (legacy) | table | `firedFinding?.category` |
| `guardrail` (legacy) | table | highest fired `action` mapped: flag→`flagged`, redact→`redacted`, block→`block`, none→`allow` |
| Security-tab check state | Req (old tab) | per `CheckKey`: `fired ? action : 'pass'` |

---

## 4. Canonical seed scenario (reproduces both images)

Conversation `cnv_4f7a91b2`, 8 turns / 8 trace steps. Three fired findings + passed
injection. (Turn indices are 0-based in code; the images label them 1-based "turn 4/5".)

| # | category | entityType | turn (role) | requestId | match | redactedAs | method | score | thr | action | recognizer / rule | policy |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | pii | email | 4 (user) | req_b2c9 | `j.doe@acme.com` | `<EMAIL>` | presidio | 0.97 | 0.50 | redact | `presidio.entity.email` / RFC-5322 pattern | customer-pii-redact-v2 |
| 2 | credential | openai-key | 5 (user) | req_d4e5 | `sk-abc…xyz` (full key in data; display truncated) | `<OPENAI_KEY>` | entropy+regex | 1.00 | 0.90 | redact | `secret.openai.api_key` / `sk-` prefix + high entropy | secret-redact-v1 |
| 3 | pii | email | 7 (user) | req_… | *(see decision D3)* | `<EMAIL>` | presidio | 0.95 | 0.50 | redact | `presidio.entity.email` / RFC-5322 pattern | customer-pii-redact-v2 |
| — | injection | prompt-injection | — | (per request) | — | — | classifier | 0.04 | 0.70 | *(passed)* | `injection.classifier.v2` | — |

Notes that make this match the images:

- **Image A (Requests)** shows one request with the email + credential findings + a passed
  injection (score 0.04). To render that single-request view, the spec groups findings by
  `requestId`; see decision **D2** for whether both live on one request or two.
- **Image B (Conversations)** banner "3 findings" = findings 1-3; segmented "Findings only · 3";
  chips on the finding-bearing user turns; trace rows for req_b2c9 (turn 4, PII) and
  req_d4e5 (turn 5, credential) render detector+match+score.
- `bytesRedacted` for finding 1 = `len("j.doe@acme.com")` = **14** ✓ (matches image).

---

## 5. Field → image-element mapping

### A. Requests modal

| Image element | Field / derived |
| --- | --- |
| Banner "2 findings · highest action: Redact" | §3 count + highest-action |
| Banner sentence ("PII detector matched … turn 4 · Credential … turn 5") | composed from each fired `finding` (category + entityType + turn) |
| Findings list item "PII · email · presidio · turn 4 · score 0.97" | `category`,`entityType`,`method`,`turn`,`score` |
| Finding action chip "Redact" | `finding.action` (tone: amber) |
| Evidence message with highlight | `messages[turn].body` + `indexOf(match)` |
| Hover popover (detector / score / threshold; admin Unredact) | `method`,`score`,`threshold`; Unredact reveals full `match` (role-gated — decision D4) |
| "Why this fired" (recognizer / rule / offset / score) | `recognizer`,`rule`, derived offset, `score` |
| "What we sent upstream" diff + "Bytes redacted 14 · Policy … · provider … · model …" | body splice with `redactedAs`; `match.length`; `policy`; row `vendor`/`model` |
| "Passed · 1: Prompt injection scan · 0.04" | passed `DetectorResult` (`method`,`score`) |
| Footer "Mark false positive" / "Tune policy →" / "View Conversation →" | actions (FP/tune = stubs unless wired; View Conversation already exists) |

### B. Conversations modal

| Image element | Field / derived |
| --- | --- |
| Banner "3 findings across this conversation · highest action: Redact" | §3 over whole conv |
| "Filter trace to findings only" link | sets segmented → Findings only |
| Segmented "All steps · 8 / Findings only · 3 / Errors · 0" | `trace.length` / fired-step count / error-step count |
| Inline highlight on user turn 4 / turn 5 | `body.indexOf(match)` per finding |
| Finding chip "1 finding ↗" top-right of message | count of findings with `turn === i`; click scrolls trace to `requestId` |
| Trace row "req_b2c9 · turn 4 · PII · email · redacted … · presidio · 0.97" | finding for that `requestId` |
| Warn/danger tone on trace step | `action` tone (redact=amber, block=red) — replaces coarse `warnNote` |
| "View Request →" footer | existing |
| "Findings only" collapses passing runs into "…3 passing requests…" placeholder | group consecutive non-finding trace steps; render one placeholder, click to expand |

---

## 6. Realism notes (from the Presidio research)

So the mock values stay credible:

- Presidio's **default email score is ~0.5**, lifted by nearby context words. The image's
  **0.97 is optimistic** — keep it if we want a "strong" example, but know it implies
  context boosting / a tuned pattern, not the out-of-box recognizer. (Decision D5.)
- Presidio's real recognizer name is `EmailRecognizer` / pattern `"Email (Medium)"`. The
  image's `presidio.entity.email` + "RFC-5322 pattern" are **display strings** we choose;
  fine for a mock, just not literal Presidio output.
- Redaction `replace → <EMAIL>` is exactly Presidio's `replace` operator behavior. ✓
- **Credential** (`entropy+regex`) and **injection** (`classifier`) are **not Presidio** —
  modeled as separate detectors, which is why `DetectorId` has three members.

---

## 7. Open decisions (discuss before reskin)

- **D1 — Banner count source.** Confirm Conversations banner = all fired findings in the
  conv; Requests banner = findings for that one `requestId`. (Recommended: yes.)
- **D2 — One request, two findings (image A) vs one finding per request (image B).** The
  two images disagree: A shows email+credential in a single request modal; B shows them on
  two different trace requests (`req_b2c9`, `req_d4e5`). Recommend: **findings live per
  trace request (B's model)**; the Requests modal shows the finding(s) for whichever
  request was opened. If we must reproduce A's "2 findings in one request" literally, we
  author one request whose payload spanned turns 4+5. Need your call.
- **D3 — The 3rd conversation finding.** Banner says "3" but the visible message panel shows
  only 2 finding-bearing turns (the panel is scrolled). Proposal: a 3rd PII email on a
  later turn (turn 7) that's out of view. Confirm the 3rd finding or drop the banner to "2".
- **D4 — Admin "Unredact" toggle.** No role/permission concept exists in the app today.
  Options: (a) add a simple `isAdmin` mock flag, (b) always show Unredact, (c) drop it for
  v1. Recommend (a) a single mock flag.
- **D5 — Email score 0.97.** Keep as-is (tuned/strong example) or set ~0.5 to mirror
  Presidio defaults. Recommend keep 0.97 for a clearer demo, with a code comment noting it.
- **D6 — turn-5 author.** Image A banner says "assistant turn 5"; image B shows the user
  typing the API key in user turn 5. Recommend **user turn 5** (matches the visible thread).
- **D7 — Footer actions.** "Mark false positive" / "Tune policy →" — inert stubs for v1, or
  wired to a toast / route? Recommend inert stubs (toast confirmation) for v1.

---

## 8. Code impact (high level — for the post-approval reskin, not now)

- `Conversations.tsx`: author `detectors: DetectorResult[]`; convert finding-bearing
  `body` to strings; add highlight + chip rendering; add the All/Findings/Errors segmented
  control + passing-run collapse; enrich trace rows from findings (retire `warnNote`).
- `Requests.tsx`: replace the "Security" (`audit`) tab with a "Findings" tab (first);
  two-column list + evidence panel; banner; derive `guardrail`/`guardrailReason` and the
  old check states from findings; footer actions.
- Shared: a small `findings.ts` (types + the authored dataset + derivation helpers:
  `highestAction`, `offsetsFor`, `redactDiff`, `findingsForRequest`, `passedFor`) so both
  modals read one source. Fold types into `data-model.md` §3.3 once approved.
- No new heavy deps; highlight/popover/segmented/diff all use primitives already in the app.
