# UI Changelog: 2026-08-03

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-7-30.md`](../2026-07/changelog-7-30.md)

---

## Conventions

### `type-copy-14-tight` is deleted — it was a no-op alias `a1279c9`

**`index.css`** · **`lib/utils.ts`** · **`design.md`**

The scale carried two tokens at 14px. `type-copy-14` is `text-sm`; `type-copy-14-tight` was `text-sm/5`. Tailwind v4 defines `--text-sm--line-height` as `calc(1.25 / 0.875)`, which resolves to `1.25rem` — the exact value `/5` supplies. The two produced byte-identical CSS, so the "tight" variant had never rendered differently from the plain one since the day it was written.

- **The token is gone from `index.css`** and from the voice allowlist in `lib/utils.ts`. All 15 call sites now use `type-copy-14`: `ask-ai-message`, `ask-ai-composer`, `ask-ai-thinking-row`, `tool-result-code`, `card`, `Policies`, `EventsTable`. Zero visual change, verified by computed style rather than by eye.
- **Three raw `text-sm/5` in the Ask AI prose recipe** (`code`, `pre`) were the same redundancy spelled inline. They are now `text-sm`; `text-sm/5` no longer appears anywhere in `src`.
- **The copy scale is Tailwind's own size/line-height pairing** at the three sizes that matter: 12/16, 14/20, 16/24. `design.md` §"Type scale" drops the duplicate row.

Still outstanding, deliberately untouched: `type-copy-18` is `text-lg/7`, and `/7` is *also* Tailwind's default for `text-lg` — the same redundancy one rung up. `type-copy-20` (`text-xl/9` = 20/36) and `type-copy-24` (`text-2xl/9` = 24/36) genuinely deviate from the defaults (28 and 32). **Resolved the same day — see the entry below.**

### The copy scale is finished — `type-copy-20` and `-24` deleted `281ecda`

**`index.css`** · **`lib/utils.ts`** · **`design.md`** · **`public/design-system.html`**

Follow-up to the entry above, closing the three sizes it left open.

- **`type-copy-18` drops its `/7`.** `text-lg/7` is 28px and Tailwind's `text-lg` already resolves to 28px, so the override said nothing. Verified live on `/upgrade`, where all three call sites live (the " per month" beside a price): 18px / 28px / -0.18px before and after.
- **`type-copy-20` and `type-copy-24` are deleted.** Neither had a single call site — only a definition and an allowlist entry — so their deviation from Tailwind's 20/28 and 24/32 (both were `/9`, 36px) never rendered anywhere. There was no design decision to preserve. Removed from `index.css`, the voice allowlist in `lib/utils.ts`, the `design.md` scale table, and the mirrored token layer in `public/design-system.html`, which defined them too. No specimen on that page referenced either, so nothing lost content.
- **The copy scale is now four tokens, each a bare Tailwind size class** with the line-height implied: 12/16, 14/20, 16/24, 18/28. `tracking-snug` still applies at 16 and above — tighter tracking as size grows is deliberate, not drift.

### Money is never authored — every dollar derives from the catalog `52fa629`

**`data/models.ts`** · **`data/requests.ts`** · **`data/conversations.ts`** · **`data/conversationDetail.ts`** · **`pages/activity-data.ts`** · **`pages/Conversations.tsx`** · **`data/pricing.test.ts`** · **`data-model.md`**

Spend and tokens had no price relationship anywhere on the site. Divide one by the other on any surface and you got a rate that appears in no catalog — on pages one click from the Models table that prints the real one.

- **`costOf(modelId, tokensIn, tokensOut)` is the only place a dollar figure may originate.** It reads `listPrice`, so a model's own markup rides along (the two DeepSeek rows bill at 1.1× upstream). `blendedRate(modelId, outShare)` gives the $/M a mixed workload actually pays, which is what makes an aggregate checkable. Every `$` in the app is now one of those calls or a sum of them.
- **51 request rows were mispriced by 0.48× to 14.7×.** A DeepSeek V4 Pro call showed $0.0169 against a real $0.0012, one column from the model name; a Sonnet 5 call showed $0.1842 against $0.0615. All recomputed. Metered costs now span $0.0009 to $0.2325 — a 250× spread, because that is what a fleet holding Opus 4.7 and Qwen3 Next actually costs.
- **Conversation seeds were re-synced to their own rows.** They had drifted on volume as well as money: `cnv_orion_70` claimed 38 requests over 9 real ones, `cnv_vela_21` claimed 86,735 input tokens against a real 40,658. Overview's preview table reads the raw seed while the list renders the derivation, so the same conversation showed two different figures depending on which page you opened.
- **Conversations' "Avg Cost / Conv" was the string `"$0.082"`.** Its own rows average $0.134. It now derives from them, and the sparkline is rescaled so its last dot and the number beside it are the same fact.
- **`SAMPLE_TRACE` was repriced too.** It is exported reference data rather than a render path, which is exactly how it kept a Sonnet 5 step at $0.0142 against a real $0.0042. Stale money in an exported constant is still wrong money.
- **`pricing.test.ts` pins all of it** — 15 assertions across request rows, conversations, the workload model, and both Activity tables. A failure means a page is quoting a price the gateway does not charge.

### Activity's spend engine inverted — tokens are authored, dollars are derived `52fa629`

**`pages/activity-data.ts`**

The file hand-authored roughly 110 dollar values (a 3 × 7 × N matrix of daily spend) and authored the token splits separately. Both were internally consistent; neither agreed with the price list. The header said so out loud: *"do not try to reconcile spend ÷ tokens here against the catalog's per-1M rates."*

- **The workload is declared once, as tokens.** `MODEL_SERIES_7D` (per-model 7d in/out), `PROVIDER_MIX_7D` (share across the three routes), `KEY_MIX_7D` (share across the Gate keys). Their product is `USAGE_7D`, one cell per (model, provider, key), each priced by `costOf` × that route's catalog `paygMarkup`. `SPEND_TOTALS_7D`, `TOKENS_TOTALS_7D`, `SPEND_BASE`, `TOTAL_7D_BASE_DOLLARS` and `TOTAL_7D_BASE_TOKENS` are all groupings of it.
- **The cross-dimension invariant is now arithmetic, not tuning.** Every dimension sums to the same total on every day because they group the same cells and share one day shape. The regression test that used to guard 110 hand-tuned numbers still passes, and can no longer be broken by an edit.
- **Total 7d spend moves $238 → $247.59.** Nobody chose that; it is what the catalog charges for the same 73,450,000 tokens. Tokens and requests are untouched.
- **Routing is catalog-constrained and the test enforces it.** Alibaba serves only DeepSeek and Qwen, so it carries 11% of tokens and 1.7% of dollars — a hairline on the spend lens, an 11% band on the tokens lens. That contrast is the finding. OpenRouter runs the other way: its +10% PAYG markup lifts its dollar share (66%) above its token share (63%).
- **The model lens now tells the truth it always claimed to.** Opus 4.7 is 5.6% of tokens and 24.7% of spend; Qwen3 Next is 20.1% of tokens and 2.4% of spend. Before, the card billed Qwen3 Next at 13× list and Gemini 3.1 Pro at 0.47×.
- **Top Models authors `tokensPerRequest`, not `requests`.** Opus' 9,000-token agentic runs and Haiku's 450-token classification calls are why one leads on spend and the other on requests. Counts derive from tokens ÷ call size, rescaled onto `TOTAL_7D_BASE_REQUESTS`, so the card sums to the KPI rail above it — which the old comment claimed and the old numbers had not done for some time.

### BYOK means one thing on every surface `52fa629`

**`pages/activity-data.ts`** · **`data/requests.ts`** · **`data/conversations.ts`**

Three definitions of "this key is BYOK" had to agree, and none of them did.

- **`design-agent` was charted as a Gate key with $21.00 of spend** while all 102 of its request rows carry no cost, because the session is BYOK. The Activity page and the Messages page disagreed about whether the gateway bills it. It is BYOK: spend $0, and it drops out of `SPEND_SERIES.apiKey`, which now lists 5 keys. Its Activity token counts are the real ones off its own 102 rows.
- **Ten rows on `openclaw`, `hermes-agent`, `nova-chat` and `test-key` carried a dollar figure** even though `isByokKey` already listed those keys, so the Messages table showed the "billed by your provider" badge while `getConversationView` quietly summed their money into the conversation total — $0.2565 of one 9-request conversation, 64% of another. Those rows are now unmetered. 41 rows carry a cost; 112 read "—".
- **The three definitions are now equivalent and asserted:** `isByokKey(keyId)` ⟺ `row.cost === "—"` ⟺ `API_KEY_ROWS.path === "BYOK"`. The comment in `data/requests.ts` claiming its set "mirrors the BYOK rows in Activity.tsx API_KEY_ROWS" is finally true.

## Sections

### Settings — section titles move above their cards `a1279c9`

**`Settings.tsx`**

Profile and Security each led with a `CardHeader` *inside* the card. Both now lead with a title block *above* it, which is the pattern every other page already uses for a titled section over a card.

- **`CardTitle` / `CardDescription` / `CardHeader` are gone from both cards**, replaced by `<SectionTitle as="h2">` plus the standard subtitle `<p>` in a `flex-col gap-1` wrapper. The 4px title-to-subtitle gap that `CardHeader gap-y-1` provided is preserved. Each card now opens directly on `CardContent` and keeps its 16px top padding.
- **Both sizes step up.** Title `type-heading-16` → **`type-heading-20`** (the `SectionTitle` primitive — there is no primitive at 18, and reaching it would mean overriding a primitive's typography at the call site). Subtitle `type-copy-14-tight` → **`type-copy-16`**, the subtitle recipe already used in 15+ files. Verified live: 20/28/500 and 16/24.
- **Section rhythm matches the canonical spec** — first section `flex flex-col gap-4`, second `mt-2 flex flex-col gap-4`, both direct children of the page's `gap-6` column.
- **Heading outline no longer skips a level.** Lifting the `h3` `CardTitle` out of the Security card orphaned `Registered passkeys` at `h4`, so it steps to `h3`. Visual voice unchanged — only the tag moved. Outline is h1 → h2 → h3.

Form fields, dirty state, the `beforeunload` guard, and save/reset behavior are untouched.

### Models — catalog and providers rebuilt from production `6bdc828`

**`data/models.ts`** · **`Models.tsx`** · **`icons/vendor-meta.tsx`** · **`icons/vendor-avatar.tsx`** · **`icons/gateway-providers.tsx`** · **`icons/model-providers.tsx`** · **`requests/data.ts`** · **`data-model.md`**

The page listed 23 invented models across 14 invented providers. Both were replaced wholesale with the real ones, pulled from the live production API (`GET /api/v1/available-models`, gate-v1.27.1) and filtered to the 25 models prod's page 1 renders in its "Most popular" order. Every value on the page now traces to that payload — nothing is authored, estimated, or rounded by hand.

- **Three providers, one flat list.** `alibaba` · `vertex` · `openrouter`. The First-party / Marketplace grouping is gone, so `MarketplaceProvider` / `MARKETPLACE_META` / `MarketplaceAvatar` are now `ProviderId` / `PROVIDER_META` / `ProviderAvatar`, and `marketplace-providers.tsx` became `gateway-providers.tsx` (Azure, Bedrock, Fireworks, Groq, Together deleted; Alibaba and OpenRouter added, Vertex reused verbatim). `PROVIDER_META` carries **three** label fields because prod uses three strings for the same provider and all three are real: `label` in row cells, `filterLabel` in the dropdown ("Alibaba Direct"), `detailLabel` on the detail page ("Google Vertex AI").
- **Prices derive in two stages and are never stored twice.** The table shows `pricing × pricingMarkup`; each provider row shows that list price × its own `paygMarkup`. That is why OpenRouter reads 10% above Vertex on the same model, and the `+10%` badge is computed from the same number, so badge and figures cannot drift. Verified against prod's DOM on Claude Opus 4.8: Vertex `$5.00 / $25.00 / $0.50 / $6.25`, OpenRouter `$5.50 / $27.50 / $0.55 / $6.88`.
- **Prod's context formatting is mirrored exactly, including what looks like an inconsistency.** Anthropic reports a decimal 1,000,000 and renders `1M`; Google and DeepSeek report a binary 1,048,576 and render `1.0M`; Qwen3 Next reports none and renders an em dash. One `formatTokenCount`, different inputs. Sorting runs on the raw numbers, so `1.0M` correctly outranks `1M`.
- **All four sort options ship and all four sort.** `Most popular` (default, the catalog's own order) · `Newest` (`releasedAt` desc, the 22 undated models sink and resolve alphabetically) · `Cheapest input` (marked-up price, so the order matches what the eye reads) · `Largest context`. The **"All vendors" filter is removed** — prod has no such control. Tabs are **All types 25 / Text 25**; Embeddings / Audio / Rerank went with the invented catalog, along with their code-sample branches.
- **Capabilities went 6 → 11**, matching prod's set and its exact labels, which are the icons' accessible names: Tool use, Vision, Reasoning, Prompt caching, JSON mode, Streaming, Web search, Audio in, PDF in, Video in, Audio out. All eleven are lucide at `strokeWidth 1.75`, so five new imports and no new SVG files. The canonical order was reverse-engineered from prod and verified to reproduce all 25 capability strips byte-for-byte.
- **Detail pages are per-model.** The view is keyed on `selectedModel.id`, so it remounts and no expanded-description or column-sort state leaks between models. The providers table lists exactly that model's providers in the API's own order — 3 for Qwen, 2 elsewhere, and the two DeepSeek rows are OpenRouter + Alibaba with no Vertex.
- **Two prod bugs deliberately not replicated.** Prod's `family` field is the literal string `"system"` for Qwen, which its avatar renders as `SsystemQwen3 Next 80B A3B Instruct`; we normalize to lowercase vendor slugs and render the real Qwen mark. Prod's footer still names `bedrock/…` as the pin example for a provider it does not have; ours uses `openrouter/claude-haiku-4-5`.
- **Null telemetry is a real state, not missing data.** 19 of 25 models have never been called, so `latencyP50Ms` / `throughputTps` render the em-dash empty state plus prod's note, "No telemetry yet. Call this model to populate latency and throughput." A real `0` (DeepSeek cache write) renders `$0.00/M`; only `null` renders an em dash.
- **`Vendor` gained `qwen` and `moonshotai` and lost nothing.** `openai`, `meta`, `mistral`, `xai`, and `cohere` no longer appear in the catalog but still key mock rows in `data/requests.ts`, `data/conversations.ts`, Activity, Conversations, DashboardDefault, and SetupModels, so the union stays complete. `requests/data.ts`'s `VENDOR_ENDPOINT` gained the two matching entries.

`activity-data.ts` was deferred at first and then done in the same commit — see the two entries below.

### Activity — the provider dimension was three names out of date `6bdc828`

**`activity-data.ts`**

The `provider` dimension read `anthropic, openai, google, bedrock, openrouter`, which conflated model VENDORS with gateway PROVIDERS and named a `bedrock` the gateway never routed through. All five provider-keyed structures move to the real three: `SPEND_SERIES`, `SPEND_BASE`, `SPEND_TOTALS_7D`, `TOKENS_TOTALS_7D`, `SAVINGS_RATES_7D`.

- **Spend splits 68 / 24 / 8, tokens split 62 / 27 / 11.** Both are grounded, not picked: ordering and dominance come from production's real spend (OpenRouter 98.6%), the size of the gap from catalog coverage (25/25, 23/25, 3/25). Prod's real split is too lopsided to stack legibly, so Alibaba is lifted to a visible 8%. Tokens deliberately differ from spend — Gemini and Qwen buy more volume per dollar — which is the whole point of a cost dashboard, and it mirrors what the `model` dimension already does with Opus.
- **Volumes are unchanged.** Production's real numbers are $0.99 across 56 messages on one API key over three days. Adopting them would render an empty-looking product, so only the taxonomy moved.
- **Slots 1 / 2 / 3** (blue / orange / green) picked for separation at three bands rather than index order. No new colors.

### The three Activity dimensions disagreed on every single day `6bdc828`

**`activity-data.ts`** · **`activity/TrendCard.tsx`** · **`Dashboard.tsx`** · **`activity-data.test.ts`**

A pre-existing defect, found while fixing the taxonomy above. `SPEND_BASE`'s three dimensions agreed on the grand total (~$238) and disagreed on all seven days — day 6 read $40.05 by model and $43.14 by provider. Switching the selector changed the bars while the KPI held still.

Worse, the trend charts never read `SPEND_BASE` at all. `TrendCard` and `Dashboard`'s `makeStackedTokenRows` each took a series' 7d total and re-synthesized every bucket with `distributeSeries(total, count, seed + perSeriesOffset)`. Because the offset increments per series, the series COUNT changed the summed curve: a 3-series stack and a 6-series stack landed on different daily shapes from identical totals. Measured drift ran to **40.6px**.

- **One curve, then shares.** `splitAcrossBuckets(totals, count, seed, scale)` in `activity-data.ts` distributes the workspace total ONCE with a dimension-independent seed, then gives each series a fixed share of every bucket. Both call sites use it; TrendCard's block went 35 lines → 4, Dashboard's 12 → 5. The identical bug lived in two files because the identical rounding logic was pasted into two files, so the fix is one function, not two patches.
- **The tradeoff, taken deliberately.** You cannot have exact per-series totals, identical stack heights across dimensions, AND independent per-series daily texture. The texture goes. Series moving in lockstep is not a compromise — a heavy day genuinely lifts every model, provider, and key together, and the old independent jitter was asserting that some series fell on a day the workspace rose. `distributeSeries` keeps its trend and spike/dip character on the workspace curve, so the chart still reads organic.
- **`SPEND_TOTALS_7D.apiKey` reconciled**, 237.95 → 238.05. Not by uniform rescale, which smeared the authored paired-step pattern on the small keys (`design-agent` 2.53, 2.53, 2.90, 2.90 → 2.56, 2.52, 2.85, 2.95). The four small keys are byte-identical; the whole correction lands on `prod-agent` and `prod-web` by their existing ratio. No share moved more than 0.01pp. `API_KEY_ROWS` tracks, which also closed `ci-runner` claiming $1.42 while its rows always summed to $1.44.
- **`distributeSeries` is untouched** — it has a determinism test and five other callers, all single-series, all unaffected.
- **28 measurements across both pages, four ranges, three lenses: 0.0000px.** Six regression tests pin it, including one asserting the daily curve is identical regardless of series count. The old data fails that test at day 0.
- **"By api key" → "By API key."** The label was Title Case run through `.toLowerCase()`, in two places (the Select option and the card description). `DIMENSION_OPTIONS` now carries an authored `noun`, removing the mechanism rather than patching the output.

### Messages, Conversations, Activity and Setup now name the same fleet as Models `2be812a`

**`data/models.ts`** · **`data/requests.ts`** · **`data/conversations.ts`** · **`data/conversationDetail.ts`** · **`data/models-catalog.test.ts`** · **`requests/types.ts`** · **`requests/data.ts`** · **`RequestsTable.tsx`** · **`RequestDetailBody.tsx`** · **`conversations/types.ts`** · **`conversations/data.ts`** · **`Conversations.tsx`** · **`Activity.tsx`** · **`activity-data.ts`** · **`Dashboard.tsx`** · **`DashboardDefault.tsx`** · **`SetupModels.tsx`** · **`icons/vendor-meta.tsx`** · **`data-model.md`**

Rebuilding the catalog from production earlier the same day (`6bdc828`) left every other surface describing a different fleet. **35 of 153 request rows named models that had stopped existing.** Activity charted four more that never existed anywhere. The Setup pricing page quoted per-1M rates for GPT-5.2, o4, Grok 4 and Llama 4 Maverick. Each page carried its own spelling — `claude-opus-4.7` in Messages, `Claude Opus 4.7` in Activity, `claude-opus-4-7` in the catalog — and nothing checked any of them against anything.

- **The canonical id is the only way a model is referenced.** `RequestRow.model` was a bare name (`gemini-3-pro`) that the detail modal re-namespaced with `${row.vendor}/${row.model}`. It now stores the catalog id verbatim (`google/gemini-3-1-pro-preview`) — the same string the gateway takes as a handle. `data/models.ts` gains `modelById` / `modelName` / `MODEL_IDS`, and every surface reads the label back rather than re-typing it.
- **118 of the 153 rows only needed the format.** `claude-opus-4-8` → `anthropic/claude-opus-4-8`, `claude-opus-4.7` → `anthropic/claude-opus-4-7`, `claude-haiku-4.5` → `anthropic/claude-haiku-4-5`. The remaining 35 were remapped onto real catalog models holding the same role: Sonnet 4.8 → **Sonnet 5** (10), Gemini 3 Pro → **Gemini 3.1 Pro Preview** (9), GPT-5.1 → **DeepSeek V4 Pro** (6), Llama 4.2 405B → **Qwen3 Next 80B A3B Instruct** (4), Grok 4.1 Fast → **DeepSeek V4 Flash** (3), Mistral Large 3 → **Kimi K2 Thinking** (3). Five vendors before, five after — the multi-vendor story survives with the real ones.
- **No transcript was touched.** `REQUEST_BODIES` is keyed by request id, not by model, so relabelling a row cannot detach its captured body. 440 KB of session data is byte-identical.
- **The Messages Model cell shows the name over the id** — `type-label-14` over `type-mono-12`, the same two-line shape the Conversation cell one column right already uses, and the same split production draws across its Model and Model ID columns. The request detail's Model row matches. Overview's compact preview shows the name only. Sorting moved to the label, since that is the line the eye reads.
- **The sample assistant response stopped claiming to be GPT-4.** `sampleResponseText()` opened with a fixed *"I'm an AI developed by OpenAI called GPT-4"* on every unscripted row — wrong on a Claude row before the remap, and naming a vendor the catalog does not carry after it. It now introduces itself as the model that served the request.
- **`src/data/models-catalog.test.ts` is the guard**, 8 assertions covering every request row (id *and* vendor), every conversation seed and derivation, every trace step, both filter dropdowns, Activity's series and Top Models rows, and the Setup price list. A model that exists on one page and nowhere else now fails the build with the offending id and the surface that carries it.

### Conversations advertised models their own requests never ran `2be812a`

**`data/conversationDetail.ts`** · **`data/conversations.ts`** · **`conversations/types.ts`**

`getConversationView()` already re-derived `reqs`, `inTokens`, `outTokens`, `cost` and `status` from the conversation's own request rows. `vendors` and `models` were the exception — hand-authored on the seed — and they had drifted on **7 of 8 rows**. `cnv_lyra_92` advertised a single OpenAI model while its requests ran four models across three vendors, and the trace immediately below the list said so. The hero session `cnv_7a3f9e2b` listed a second `gpt-5.3-codex` entry; not one of its 102 captured requests ran an OpenAI model.

- **Both fields are derived now**, in first-seen chronological order, alongside the five that already were. A conversation with no rows keeps its seed values.
- **The seeds were rewritten to match the derivation** — they are still what raw consumers read (Overview's preview table, `ConversationsTrace`'s lookup) — and the catalog test asserts seed and derived stay equal, so the two cannot part again.
- **The `ModelId` union is deleted.** A hand-maintained list of 12 literals was the mechanism of the drift: it type-checked a claim nobody had verified. `models` is `string[]` of canonical ids, pinned by the test rather than by a stale union.

### Activity charted four models that never existed `2be812a`

**`activity-data.ts`** · **`Activity.tsx`**

The model dimension read Claude Sonnet 4.5 / GPT-5.1 / Gemini 3 Pro / Claude Opus 4.7 / Llama 4.2 405B / Others, and the Top Models card added Mistral Large 3. Only Opus 4.7 was real.

- **Labels and keys moved together**, 1:1 onto the same remap Messages used, so no future reader chases a `gpt` key that charts DeepSeek. `gpt` → `deepseek`, `llama` → `qwen`, and `haiku` → `others` (that key had been labelled "Others" for a while — the name was the last thing still saying Haiku).
- **Not one number changed.** The per-day values are what the cross-dimension reconciliation invariant from `6bdc828` is built on; the six regression tests that pin it still pass. The comment now says out loud that these are authored workspace aggregates and were never price-derived, so nobody tries to reconcile spend ÷ tokens against the catalog's per-1M rates.
- **Claude Opus 4.8 is deliberately absent** from both surfaces even though it is 102 of the 153 request rows. Every one of those rows belongs to the BYOK session `cnv_7a3f9e2b`, and these charts are Gate-metered spend only.
- **`MODEL_ROWS` moved from `Activity.tsx` to `activity-data.ts`**, beside `API_KEY_ROWS`. It is pure data, it belongs with the pure-data module, and it means the catalog test can read it without importing a page. Its rows are keyed by catalog id and drop their authored `label` — `modelName()` supplies it.

## Components

### Setup pricing quoted a fictional price list `2be812a`

**`SetupModels.tsx`** · **`data/models.ts`**

`/setup-models-default` hand-typed all four columns for seven models, four of which the gateway does not serve (GPT-5.2, o4, Grok 4, Llama 4 Maverick). The three real ones quoted rates that were nobody's source of truth — Opus 4.8 at $15/$75 against the catalog's $5/$25.

- **Nothing on the page is authored now.** The row set is `PAYG_PRICING_MODEL_IDS` in `data/models.ts`; the name, the provider and both rates come from `modelById` + `listPrice`, which is the same derivation the Models page's own table runs. The two pages cannot quote different figures for the same model.
- **Still seven rows across five vendors**, and the four replacements follow the Messages remap: DeepSeek V4 Pro, Kimi K2 Thinking, DeepSeek V4 Flash, Qwen3 Next 80B A3B Instruct.
- **Sub-cent rates widen to 4 decimals**, matching the fix `6bdc828` made on the Models page — DeepSeek V4 Flash's real $0.1540 input would otherwise round toward reading as free.

### Both model filters offered models that could never match `2be812a`

**`requests/data.ts`** · **`conversations/data.ts`** · **`Conversations.tsx`**

Messages' Filters modal offered six models, four invented. Conversations' toolbar offered ten, six invented. Neither was checked against the rows it filtered.

- **Both derive from `MODEL_OPTIONS`**, narrowed to the models that actually carry rows — so an option can never return an empty table, and can never name a model the gateway does not serve. Messages lists 9, Conversations 7.
- **Labels are the catalog's**, not a second spelling of them. Messages' filter used to show raw ids (`gpt-5.1`); it now shows `Claude Opus 4.8` like Conversations always did.
- **`conversations/data.ts` is a new leaf module**, mirroring `requests/data.ts`. `Conversations.tsx` goes back to exporting only components (react-refresh), and the catalog test can read the options without importing a page.

### PAYG card promised GPT; the pooled catalog has none `2be812a`

**`DashboardDefault.tsx`**

- **"Claude, GPT, Gemini" → "Claude, Gemini, DeepSeek"** on the pay-as-you-go choice card. That card is the pooled-catalog path, and there is no OpenAI model in it. The BYOK card one column left still says Claude and Codex, which is correct — a ChatGPT subscription is exactly what it routes.
- **The OpenClaw BYOK snippet names `moonshotai/kimi-k2-thinking`** instead of `kimi-k2.5`. Same model, and now a handle that resolves.
- **The "Works with" footer is untouched** — OpenAI, xAI, Anthropic, Google, Meta are BYOK provider brands, not catalog entries, and Gate does route your own key to all five.

### Messages Model cell drops the canonical-id subtext `dc8311d`

**`requests/RequestsTable.tsx`** · **`requests/RequestDetailBody.tsx`**

`2be812a` restructured the Model cell in both the Messages table and the request Details list into two lines — name over `anthropic/claude-opus-4-8` — on the reasoning that prod splits Model and Model ID into separate columns. That reasoning does not transfer, and more to the point it was scope creep: a data change had no business touching JSX.

- **Both surfaces are back to a single line** showing the catalog name beside the vendor mark. The Details list shows every value exactly once, and the canonical id is already in the Quick start snippet on the same page, which is where you copy it from.
- **The Details row's voice moved `type-mono-14` → `type-label-14`** with the content. Mono is the data voice for ids, hashes, and numerics; a product name is not data-tier.
- **Audited the rest of `2be812a`**: these two cells were its only structural UI changes. `Conversations.tsx` and `Activity.tsx` had zero JSX changes; `SetupModels`, `DashboardDefault`, and `Dashboard` were label and data swaps.

### Models table — provider marks sit on 8px, not on top of each other `6bdc828`

**`Models.tsx`**

The Providers cell stacked its marks at `-ml-1` (-4px) and synthesized a 1px card-colored ring with two stacked `drop-shadow`s so the collided silhouettes stayed legible. They now sit on a real `gap-2`. Separating them makes the ring unnecessary, so the negative margin AND the filter are both gone rather than one left inert. Verified live: `gap: 8px`, measured 8px between every pair, `filter: none`, on the 3-mark Qwen row as well as the 2-mark rows.

### Sub-cent prices stop reading as free `6bdc828`

**`data/models.ts`**

`formatPricePerM` rendered everything at 2 decimals, so DeepSeek V4 Pro's real `cachedInputReadPer1M` of `0.003625` printed `$0.00/M` — indistinguishable from free, for a rate that is $3.63 per billion cached tokens. Values in `(0, 0.01)` now widen to 4 decimals: `$0.0040/M` at list, `$0.0044/M` through OpenRouter's markup. Simulated across all 200 price cells in the catalog, exactly 2 changed. A real `0` still prints `$0.00/M` and a `null` still prints an em dash, so free, absent, and small stay three distinct facts.

### PAYG snippet named the wrong models `6bdc828`

**`payg-config.ts`**

Two handles in a copyable config snippet pointed at models that made no sense.

- **`ANTHROPIC_DEFAULT_HAIKU_MODEL` read `anthropic/claude-opus-4-8`.** That env var exists so Claude Code can route cheap background work to a fast model; it was naming the most expensive model in the catalog. Now `anthropic/claude-haiku-4-5`, extracted to `PAYG_FAST_MODEL`. Deliberately NOT the selected model — pinning the Haiku slot to whichever row you are viewing is what produced the bug.
- **`PAYG_DEMO_MODEL` read `sakana/fugu-ultra`**, which exists in neither the catalog nor the traffic data. A snippet naming a model the gateway cannot route fails the moment anyone pastes it. Now `anthropic/claude-opus-4-8` — the most-used model on the site by a wide margin, 106 of 183 rows in `data/requests.ts`.

### Ask AI reply actions — thumb ratings hidden behind a flag `a1279c9`

**`ask-ai-message.tsx`**

The reply feedback row ships as **copy + regenerate only**. Product decision, and explicitly temporary, so the rating pair is gated rather than removed.

- **`SHOW_REPLY_RATING` is a module-level `boolean`, currently `false`.** The annotation is load-bearing: without it TypeScript narrows to the literal `false`, marks the branch dead, and stops type-checking the JSX inside — it would rot silently while hidden. Flipping the one boolean restores both buttons verbatim.
- **Nothing was deleted.** `rating` state, `rate()`, `THANKS_TEXT`, the 3s `thanksVisible` timer and its unmount cleanup, and both icon imports all stay. The `aria-live` region is untouched and still announces "Copied!"; the "Thanks for your feedback!" branch is simply unreachable while the flag is off.
- **No layout fix was needed.** The row's `ml-auto` and its `gap-0 px-0` → `lg:gap-1 lg:px-1` trade absorb the two missing children; the remaining glyphs keep their 28px desktop / 32px mobile pitch relative to each other, and the row still reserves its box while `showActions` is false.
- **The block comment above the row is marked `TEMPORARILY HIDDEN`**, so the next reader does not diff against the Figma node and conclude the affordances were dropped.
