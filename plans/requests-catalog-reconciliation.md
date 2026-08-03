# Plan — reconcile Messages/Requests with the production model catalog

Written 2026-08-03, after `6bdc828` replaced the Models catalog with the 25
real production models across 3 real providers. Messages still tells a
different story about which models exist. This closes that gap.

## The finding that shapes the plan

**The transcripts are safe.** `REQUEST_BODIES` is keyed by request id
(`req_cd0e57`), not by model name, so changing a row's model label cannot
detach it from its body. 440 KB of real captured session data stays put and
is never edited. This is a **relabel**, not a rebuild.

**Most rows are already correct.** Of ~153 rows in `data/requests.ts`:

| Model in `requests.ts` | Rows | In new catalog? |
| --- | --- | --- |
| `claude-opus-4-8` | 102 | **yes** |
| `claude-opus-4.7` | 14 | **yes** (dot vs dash) |
| `claude-haiku-4.5` | 2 | **yes** (dot vs dash) |
| `claude-sonnet-4.8` | 10 | no |
| `gemini-3-pro` | 9 | no |
| `gpt-5.1` | 6 | no |
| `llama-4.2-405b` | 4 | no |
| `grok-4.1-fast` | 3 | no |
| `mistral-large-3` | 3 | no |

**118 of 153 rows (77%) already name a real catalog model.** They only need
format normalization. 35 rows across 6 models need a decision.

## Phase 0 — the one decision, make it first

The 35 rows name models that no longer exist anywhere in the app. Three ways
to go, and everything downstream depends on which:

**A. Remap to catalog models. (Recommended.)** The row count, findings,
transcripts, and per-row cost/latency all survive; only the label moves. The
multi-vendor variety was invented in the first place, and the new catalog
still carries five vendors, so the "gateway routes many vendors" story
survives intact — it just tells it with the real ones:

| From | Rows | To | Why |
| --- | --- | --- | --- |
| `claude-sonnet-4.8` | 10 | `anthropic/claude-sonnet-5` | nearest real Sonnet |
| `gemini-3-pro` | 9 | `google/gemini-3-1-pro-preview` | nearest real Gemini Pro |
| `gpt-5.1` | 6 | `deepseek/deepseek-v4-pro` | keeps a non-Google, non-Anthropic vendor in the mix |
| `llama-4.2-405b` | 4 | `qwen/qwen3-next-80b-a3b-instruct` | open-weight large model, same role |
| `grok-4.1-fast` | 3 | `deepseek/deepseek-v4-flash` | fast/cheap tier, same role |
| `mistral-large-3` | 3 | `moonshotai/kimi-k2-thinking` | keeps the fifth vendor represented |

Cost of A: any narrative tied to a specific vendor (a finding whose evidence
mentions GPT, a "why we route to Meta" story) has to be re-read. See Phase 4.

**B. Expand the catalog.** Add the 6 models back to `data/models.ts` so
Messages stays untouched. Rejected unless you say otherwise: it re-introduces
invented models into a catalog we just made 100% traceable to the prod API,
and the Models page would no longer match prod page 1.

**C. Do nothing.** Messages and Models keep disagreeing. Only acceptable if
this is deferred deliberately.

**This plan assumes A.** Everything below is written against it.

## Phase 1 — normalize the id format (mechanical, no judgment)

`requests.ts` uses bare ids with inconsistent separators; the catalog uses
`vendor/model` with dashes throughout.

- `claude-opus-4-8` → `anthropic/claude-opus-4-8`
- `claude-opus-4.7` → `anthropic/claude-opus-4-7`
- `claude-haiku-4.5` → `anthropic/claude-haiku-4-5`

Decide one thing here: does the Messages table **display** the full
`anthropic/claude-opus-4-8` or keep showing the short name? Prod shows the
full vendor-namespaced id in its Model ID column and the short display name
in its Model column. Recommend matching that: store the canonical id, render
`displayName` from the catalog. That makes the catalog the single source for
naming and kills this class of drift permanently.

## Phase 2 — apply the Phase 0 remap

35 rows, six find-and-replace operations, plus a vendor field update on each.
Script it and verify counts before and after; do not hand-edit 35 rows.

## Phase 3 — downstream reconciliation

Every surface that names a model or vendor has to agree. Known references:

| File | Refs | What needs doing |
| --- | --- | --- |
| `data/requests.ts` | 16 | Phases 1–2 |
| `data/conversations.ts` | 8 | same remap, same format |
| `pages/requests/data.ts` | 4 | `VENDOR_ENDPOINT` — drop entries for vendors that no longer appear |
| `pages/Conversations.tsx` | 4 | vendor filter options |
| `pages/Activity.tsx` | 4 | model dimension |
| `pages/SetupModels.tsx` | 4 | the model picker offers GPT-5.2, o4, Grok 4, Llama 4 Maverick — none exist |
| `pages/DashboardDefault.tsx` | 2 | top-model list |
| `icons/vendor-meta.tsx` | 5 | see below |

**`activity-data.ts`'s model dimension** currently reads Claude Sonnet 4.5,
GPT-5.1, Gemini 3 Pro, Claude Opus 4.7, Llama 4.2 405B, Others. After the
remap it must reflect the models that actually carry traffic in
`requests.ts`, and its per-day totals must keep reconciling with the provider
and apiKey dimensions — the invariant `6bdc828` just established and pinned
with tests. **Do not break that.** Run the regression suite after.

**`Vendor` union and `VENDOR_META`:** after the remap, `openai`, `meta`,
`mistral`, `xai`, `cohere` have zero references anywhere. At that point they
CAN be deleted, which was blocked before precisely because these rows existed.
Deleting them is optional and cosmetic; keeping them costs nothing. Decide at
the end, not the start.

## Phase 4 — transcript text (the only manual read)

Model ids appear **inside transcript strings** in `request-bodies.ts`:
`gemini-3-pro` ×3, `claude-sonnet-4.8` ×2. Five occurrences total, zero for
the other four models.

These need a human read, not a script. A transcript is a verbatim capture; if
the text says "switching to gemini-3-pro" then either the label was always
wrong or the sentence needs rewording. **Read each of the five in context and
decide individually.** Do not blind find-and-replace inside captured data.

## Phase 5 — verification

1. `npx tsc -b`, `npm run lint`, `npx vitest run` (35 tests today).
2. **Assert every model referenced anywhere resolves to a catalog id.** Write
   this as a test, not a one-off check — it is the guard that stops this
   drifting again. Same idea as the `splitAcrossBuckets` regression test.
3. Browser: Messages list + a detail page, Conversations, Activity on all
   three dimensions and both lenses, Overview, Setup model picker.
4. Confirm Activity's per-day reconciliation still reads 0.0000px drift.

## Sequencing

Phase 0 is a conversation, not work. Phases 1–2 are one scripted pass. Phase 3
is the bulk. Phase 4 is five careful reads. Phase 5 gates the commit.

Phases 1–3 should go to the `front-end-developer` agent as a single brief with
the remap table above stated explicitly, since partial application would leave
the app in a state where Messages, Activity, and Models each disagree
differently. Phase 4 comes back to a human decision.

## Explicitly out of scope

- Editing `request-bodies.ts` transcript content beyond the five occurrences
  in Phase 4.
- Re-deriving costs, latencies, or token counts. The remap changes labels, not
  economics. If a remapped model's real price differs enough that a row's cost
  looks wrong, flag it — do not silently recompute.
- Sourcing new request data from the prod API. Prod has 56 requests total
  against our 153, and its traces are a different shape.
