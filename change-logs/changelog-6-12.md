# UI Changelog: 2026-06-12

Running log of UI changes for 06-12. Written for an agent/dev to **diff against
and replicate**: each entry states what changed, before → after, where, and (for
committed work) its commit hash.

Prior day: [`changelog-6-11.md`](./changelog-6-11.md).

---

## Sections

### Requests Details tab → three subcards `[a7b5dab]`

Replaced the Details tab's left column (previously a full-request-only panel,
`RequestBodyPanel … fullRequestOnly`) with three stacked subcards in
`src/pages/Requests.tsx`:

- **User message** and the **response** subcards: plain-text heading (no icon)
  above a bordered prose box, `max-h-[200px] overflow-y-auto`, `px-4 py-4` (16px).
- The response subcard is one card: for a recorded provider/upstream failure it
  becomes an **Error response** variant inline (origin `Badge` → `PROVIDER ERROR`,
  a plain-language explanation, and the raw error body as flush-left mono text,
  `mt-2` above it) instead of a separate error/blocked card; otherwise it's the
  assistant (or tool) turn.
- **Full request**: a Base UI `Collapsible`, collapsed by default (progressive
  disclosure). The trigger and code well are **one connected component** — a
  single `border-border` on the container, no gap, header gains a divider only
  when open. Code well + error JSON both use `bg-neutral-50`.

Data + helper (same commit):

- Added optional `errorSource` / `errorCode` / `errorBody` to `RequestRow`.
- New `src/lib/error-origin.ts` — `errorOrigin` / `errorExplanation` ported from
  the production dashboard, em dashes replaced with spaced hyphens.
- Added a real provider-error request (`openai/gpt-5.3-codex`, HTTP 400,
  `errorSource: "provider"`) to `cnv_7a3f9e2b`; reconciled that conversation's
  `vendors` / `models` / `reqs` in `src/data/conversations.ts`.

### Drop invalid `ignoreDeprecations` from tsconfig `[795c342]`

Removed `"ignoreDeprecations": "6.0"` from `tsconfig.app.json` — TS 6.0.3 silences
nothing with it and the IDE language service rejected the value. No build effect.
