# Ask AI — live agent plan

Turning the static Ask AI panel into a working chat loop against the docs site.

Decisions locked with the user (2026-07-27):

- Markdown rendering: `react-markdown` + `remark-gfm`
- Backend: Vercel serverless route + LLM (key stays server-side)
- Streaming: tokens stream in as they arrive

## What research changed

`docs.constellationgate.ai` is an Astro/Starlight site:

- **23 pages** total (`/sitemap-index.xml` → `/sitemap-0.xml`)
- No `llms.txt`, no `llms-full.txt` (both soft-404 to the HTML shell)
- No raw `.md` served — HTML only

At ~3KB of text per page the whole corpus is **~70KB / ~20k tokens**. That fits
in a single prompt with room to spare, so **there is no retrieval layer**: the
full docs corpus goes in the system prompt behind a `cache_control` breakpoint.
Cache reads cost ~0.1x, so repeat questions are cheap and the answer quality is
strictly better than top-k chunk retrieval — the model sees every page.

Revisit only if the docs grow past ~150 pages.

## Architecture

```
build time                     request time
──────────                     ────────────
scripts/sync-docs.mjs          src/.../AskAiPanel
  sitemap → fetch 23 pages       └─ POST /api/ask  { messages }
  HTML → markdown                     │
  → src/data/docs-corpus.json         ├─ api/ask.ts (Node, server-only key)
     (committed, ~70KB)               │    corpus (cached prefix) + messages
                                      │    → Anthropic SDK .stream()
                                      └─ SSE text deltas → client
```

## Work items

### 1. Docs ingest — `scripts/sync-docs.mjs`

- Read `/sitemap-index.xml` → `/sitemap-0.xml`, collect the 23 URLs.
- Fetch each, strip the Starlight chrome (nav, sidebar, footer, ToC), convert
  the `<main>` content to markdown.
- Emit `src/data/docs-corpus.json`: `[{ url, title, markdown }]`, sorted by URL
  so the serialization is deterministic (a reordered corpus would invalidate the
  prompt cache on every deploy).
- Add `npm run docs:sync`. Manual for now, not wired into build — the corpus is
  committed so deploys are reproducible and offline-safe.
- Print a token estimate on completion so corpus growth is visible.

### 2. Serverless route — `api/ask.ts`

- `POST /api/ask`, Node runtime. Reads `ANTHROPIC_API_KEY` from the Vercel
  environment; **never** exposed to the client.
- `@anthropic-ai/sdk`, `client.messages.stream()`, model `claude-opus-5`.
- System prompt = instructions + full corpus, one `cache_control:
  {type: "ephemeral"}` breakpoint on the last system block. Corpus is static, so
  every request after the first reads from cache.
- `output_config: { effort: "low" }` — docs Q&A over supplied context is
  retrieval-and-summarize, not reasoning-heavy; low effort is fast and cheap.
  Tune upward only if answers degrade.
- Answer-grounding instruction: answer only from the corpus, link the source
  page, say plainly when the docs don't cover it. No invention.
- Stream text deltas to the client as SSE. Handle `stop_reason: "refusal"`
  before reading content (Opus 5 classifiers can decline; ours is a benign
  workload but the check is one line).
- Cap `messages` length and per-message size server-side. Return 400 on
  oversize rather than forwarding it.

### 3. `vercel.json` — the trap

Current file rewrites **everything** to the SPA:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

That swallows `/api/ask`. Must become a negative-lookahead source (or an
explicit `/api/(.*)` passthrough ahead of it). Without this the route 200s with
the HTML shell and the failure looks like a JSON parse error.

### 4. Thread state — `src/hooks/use-ask-ai-thread.ts`

- Messages: `{ id, role, content, status }`.
- Machine: `idle → sending → thinking → replying → complete | error | stopped`.
- Lives above the panel so it survives navigation (the panel already persists).
- `AbortController` per request; `stop()` aborts and marks the turn `stopped`,
  keeping the partial reply.

### 5. Composer wiring — `ask-ai-composer.tsx`

- Enter sends, Shift+Enter newlines, clear on submit.
- Placeholder swaps by state: default → "The Gatekeeper is thinking…" →
  "The Gatekeeper is replying…".
- Send button becomes a **stop** button (square icon) while busy — per the
  Figma frame.
- Field stays editable while the agent works; queued send is out of scope.

### 6. Thinking row — new component

Brain icon + "Thinking ..." — muted, left-aligned, no bubble, sits where the
reply will land. Needs a Figma node for the exact icon and voice; ask before
guessing either.

### 7. Streaming markdown — `ask-ai-message.tsx`

- Add `react-markdown` + `remark-gfm`; render inside the existing `ReplyProse`
  scope, which already styles by element type. Should need no restyling.
- Partial markdown re-renders each delta. An unclosed fence renders as a
  paragraph mid-stream and settles when the fence closes — acceptable, and the
  reason `ReplyProse` styles elements rather than the wrapper.
- Keep the placeholder thread; render it when the live thread is empty.

### 8. Scroll + a11y

- Auto-scroll to bottom on new content, **suppressed if the user has scrolled
  up** (standard "stick to bottom unless they moved" check).
- **`overflow-anchor` does NOT do this** — corrected 2026-07-28 after
  measurement. Scroll anchoring stabilises content changing *above* the
  viewport; it never follows content appended *below* it. There is no native
  CSS stick-to-bottom. The JS is small: the sentinel's IntersectionObserver
  already tracks `isAtBottom`, so auto-follow is "when `isAtBottom` and content
  grows, set `scrollTop = scrollHeight`".
- The **scroll-to-bottom FAB** keys its visibility off scroll position, so it
  needs no streaming-specific wiring. Pressing it should re-arm stick-to-bottom
  so the thread resumes following the stream.
- `aria-live="polite"` on the message region; `aria-label` on the stop button.
- Announce the thinking state so it isn't a silent gap for screen readers.

### 9. Completion row

Wire copy (clipboard) and retry (re-send the prior user turn). Thumbs stay
unwired — no endpoint to record a vote against.

## Local development

`vite dev` does not serve `/api`. Options:

1. `vercel dev` on port 3000 — real parity, needs the Vercel CLI and a linked
   project.
2. A small Vite dev-server middleware that mounts the same handler.

**Recommend (1)** so local and production run identical code. Flagging it
because it changes the day-to-day dev command, which is the user's call.

## Out of scope

- Conversation persistence across reloads
- Multi-session support ("New session" stays unwired)
- Thumbs feedback storage
- Auth on `/api/ask` — it is unauthenticated and public once deployed. Rate
  limiting is a real follow-up; noting it rather than silently shipping an open
  LLM endpoint.

## Order

1 → 3 → 2 (verify with curl) → 4 → 5 → 6 → 7 → 8 → 9

Each step verifiable on its own. The route is provable with `curl` before any UI
depends on it.
