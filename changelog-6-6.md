# UI Changelog: 2026-06-06

Running log of UI changes made this day. Written for an agent/dev to **diff
against and replicate**: each entry states what changed, before → after, where,
and (for committed work) its commit hash.

Prior days: [`changelog-6-5.md`](./changelog-6-5.md), [`changelog-6-4.md`](./changelog-6-4.md).

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

### A caught value never re-appears raw in the transcript (uncommitted)

Redaction happens at the gateway on ingress: Presidio / the credentials scanner
detect the entity, then the anonymizer replaces it with a placeholder before the
prompt reaches the provider. The Conversations **Messages** panel is a
reconstruction from those logs, so it must show the redacted form, not the raw
value the user typed.

Before: the message bubble rendered `r.userMessage` verbatim, so the user turn
showed `lena.ortiz@constellation.io`, the AWS key, and the live Anthropic key in
full. That contradicted the request-detail redaction diff and the assistant's own
"shows as a masked token" narration. → Now `redactUserBody(row, body)` replaces
each **user-role** finding's `match` with its `redactedAs` placeholder, so bubbles
read `<EMAIL>` / `<AWS_ACCESS_KEY_ID>` / `<ANTHROPIC_API_KEY>`. Assistant bubbles
are untouched (they narrate the redaction, never repeat the value). The
`…EXAMPLEKEY` dummy secret stays raw because it is not a finding, matching how the
detector behaves.

The request detail (`/requests-findings/:id`) is the **one** sanctioned place that
shows the raw value, as the before → after redaction diff. Where:
`src/data/conversationDetail.ts` (`redactUserBody`, applied in the scripted
messages `flatMap`).

## Components

### TraceItem — node color keys off guardrail status, not latency (uncommitted)

The timeline node ring + icon signal whether a security check fired, so latency
must not color them.

Before: a codified slow-latency policy flipped the node to amber
(`border-warning-600` / `text-warning-700`) for any `status === 'success' &&
latency > 2000ms`, so a clean-but-slow Allow step read as a finding. → Now
`nodeBorder` / `nodeIconTone` derive from `event.status` only via
`TRACE_NODE_BORDER` / `TRACE_NODE_ICON_TONE`: **green** = clean Allow (no detector
fired), **amber** = flag / redact, **red** = block / error. The slow-row tint is
kept on the latency **text** in the data line, so slowness is still surfaced but
never as a false security signal. Removed the now-unused `isVerySlow`. Matches
staging, which shows clean steps green regardless of latency. Where:
`src/pages/Conversations.tsx` (`TraceItem`).

## Sections & surfaces

### Conversations trace — redacted transcript + status-true node colors (uncommitted)

On `/conversations-trace/cnv_7a3f9e2b` the two changes above land together: the
Messages transcript shows the redacted placeholders, and the Request Trace nodes
color by guardrail. No raw PII or credential value appears anywhere on the
conversation surface.

**Verified at `localhost:3000`:** node sequence (oldest → newest) reads
`1-3 green · 4 amber (PII · Redact) · 5-6 green · 7 amber (PII · Redact) ·
8-9 green · 10 red (Credential · Block)`; the clean steps stay green despite 4-5s
latencies; the transcript contains no `lena.ortiz@` / `ops@` / `AKIA…` / `sk-ant-…`
values; banner reads "3 findings across this conversation · Highest action: Block".
Request detail keeps the raw value + redaction diff.

**Deep-links:** `/conversations-trace/cnv_7a3f9e2b` (trace page);
`/requests-findings/req_a1f3d9` (PII email), `/requests-findings/req_e4c7b1`
(PII + credential), `/requests-findings/req_3f9c2a` (block).
