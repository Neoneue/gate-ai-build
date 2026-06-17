# UI Changelog: 2026-06-17

Running log of UI changes for 06-17. Written for an agent/dev to **diff against
and replicate**: each entry states what changed, before → after, where, and (for
committed work) its commit hash.

Prior day: [`changelog-6-16.md`](./changelog-6-16.md).

---

## Components

### FindingCard: sans message, tighter padding, no detector/turn line `fc9f5f3`

The finding-card body (the quoted `match`) switched from `font-mono` to
`font-sans` (`text-sm`). Removed the `{METHOD_LABEL} · Turn {turn}` subtitle line
entirely (e.g. "Classifier · Turn 101"). Card padding went from `p-4` to
`px-4 py-3` (12px top/bottom, 16px sides). All in `FindingCard` (`Requests.tsx`),
so it applies to every findings surface.

### Passed detector cards: px-4 py-3 `fc9f5f3`

The Passed-section item cards (PII / Credential PASS) changed from `p-4` to
`px-4 py-3` to match the FindingCard vertical padding. In the `passed.map`
render in `Requests.tsx`.

### Per-row compression override `fc9f5f3`

Added optional `compression?: string` to `RequestRow`. `compressionValue(row)`
now returns `row.compression` when set, otherwise the existing derived ratio.
Lets a row (e.g. an error response that produced no output) read a fixed
`100.0%` instead of the token-derived value.

## Sections

### req_cd0e57: flagged provider-error request `fc9f5f3`

Rebuilt the `req_cd0e57` row (`src/data/requests.ts`) as a 429 provider
rate-limit on Claude Opus: `status: error`, `guardrail: flagged`,
`guardrailReason: injection`, `vendor: anthropic`, `model: claude-opus-4-8`,
`code: 429`. Carries a prompt-injection FLAG finding, the CRITICAL user message,
`errorDetail`/`errorBody` for the rate-limit, and KPI stats latency `2.30s`,
tokens/cost as dashes, `compression: 100.0%`. (`requestBodyRaw` still holds the
prior codex payload, pending replacement.)

### Findings detail on provider errors: trimmed narrative + white wells `fc9f5f3`

On the `/requests-findings/:id` page (`Requests.tsx`):

- **What happened** section is hidden when the request is a provider/upstream
  error (`errorOrigin(row.errorSource) !== null`); policy findings still show it.
- **Error response** card lost its "Copy code" footer (the `<pre>` JSON well
  stands alone).
- Removed the injection **Detector note** (`reasoning`) and the user-message
  **"Found within this segment (~512 tokens)…"** footer line.
- User-message evidence text is now `font-sans text-sm` (was `font-mono text-xs`)
  and capped at `max-h-[200px]` with scroll.
- Code wells (Error response, Full request, mono evidence well) switched from
  `bg-neutral-50` to `bg-card` (white); only hover states keep the gray.

### req_cd0e57: full-request body swapped to empty text blocks `c233407`

Replaced `req_cd0e57`'s `requestBodyRaw` (`src/data/requests.ts`), the Full
request drawer payload, with a `user` message of two empty `text` blocks plus a
`claude-opus-4-8` / `max_tokens` / `stream` tail. Drops the stale codex thinking
+ base64 signature payload so the drawer reconciles with the row's Claude Opus
identity.
