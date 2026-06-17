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

### No-findings empty state: standalone card, success/allow only `a5f0364`

On a success + allow request the findings detail now shows **only** the
No-findings card (the originating message / tool-request panel is hidden). The
card is a standalone `rounded-md` card fixed at `h-[304px]` to match the Passed
card; the outer `PANEL_OUTER` wrapper is dropped for the no-finding case
(`contents`) so there's no double border. Also removed the Bytes-redacted
metadata card from the PII / credential detail panels, and renamed
`PiiRightPanel` / `InjectionRightPanel` to `...DetailPanel` (they render on the
left). All in `Requests.tsx`.

### Policies: per-action active colors, swapped halves, key icon `a5f0364`

On the three policy cards (`Policies.tsx`):

- "Credential & secrets scanner" uses the `KeyRound` icon (was `ShieldAlert`).
- The two inner cards are swapped: **Action on detection** (left),
  **Sensitivity / Scan direction** (right).
- The selected action border is now per-action: Flag `warning-500` (amber),
  Redact `neutral-600` (gray), Block `destructive` (red) — was `border-primary`.
- The checked radio fill/border is one step darker than its card border:
  `warning-600` / `neutral-700` / `danger-700`.
