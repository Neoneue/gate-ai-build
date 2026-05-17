# Gate AI — Requests page audit

> Source: Single-page Impeccable audit grounded in canonical Notion sources (Narrative & Positioning H1, Security PRD, Gateway PRD) + `Gate-AI-personas.md` + `CLAUDE.md`. Run 2026-05-16. Replaces an earlier unanchored draft.
>
> Voice anchor: "plainspoken, technical — Tailscale / Fly.io register" (Narrative & Positioning).
> Audience anchor: Primary ICP = security-conscious developer / small team on OpenClaw or Claude Code. Devon-leaning. Olivia treated as adjacent, not the primary read for this page.

## Verdict

This is the strongest page in the product for Devon: the two-axis Status × Guardrail schema is honored, the row-to-modal drill-in is real, and the deep-link plumbing from Security events works end-to-end. It loses ground in three places — the Security tab inside the modal renames itself to "Audit" but never invokes the canonical audit vocabulary (tamper-evident, anchored to DE) that gives the page its competitive frame; the modal's "Cache: miss" badge fabricates schema the row doesn't carry; and "redacted" persists as a fourth response mode in code despite the PRD listing exactly three (Block / Flag / Allow with annotation).

## 🔴 HIGH

### H1. Modal "Security" tab does not surface DE-anchor / tamper-evident affordance

- **Evidence:** `Requests.tsx:1445` — `<TabsTrigger value="audit">Security</TabsTrigger>`. The tab `value` is literally `"audit"` and the comment at 1515 calls it "Audit tab — runtime guardrail checks." `SecurityPanel` (1856-1912) renders three check rows; none of them name Digital Evidence, anchoring, or verifiability. The string "tamper-evident" does not appear in the file.
- **Canon:** CLAUDE.md project rules: *"Required vocabulary for audit features: 'tamper-evident,' 'cryptographically verifiable,' 'anchored to Constellation's Digital Evidence layer.'"* `Gate-AI-personas.md:181-187` flags DE-anchor language appearing in exactly one place (TokenSavings) as "the single largest gap between the canonical story and the product." Devon's verbatim objection from `Gate-AI-personas.md:73`: *"Do I really need a tamper-evident audit trail or is structured logging enough?"* — the per-request modal is the single most load-bearing place to answer that objection in product.
- **Olivia weighs it:** She will not notice the absence; she does not know to look for it.
- **Devon weighs it:** This is the page he opens when a coding-agent incident hits production. If "Security" or "Audit" here means anything more than Helicone-grade structured logging, this is the screen that has to prove it. As built it does not.
- **Recommendation:** Rename the tab `value` from `"audit"` to `"security"` to match the visible label and stop confusing the two concerns (the *real* audit feature — DE-anchoring — is what's missing, not what's mislabeled). Then add a footer row to `SecurityPanel` carrying the canonical vocabulary plus a per-record verify action. Suggested copy (anchor: CLAUDE.md required vocabulary): **"This request and its security verdict are cryptographically verifiable, anchored to Constellation's Digital Evidence layer."** Pair with a `View on DE` link affordance (the placeholder for it is already in scope: line 1407 comment mentions "Copy Proof / View on DE" actions tied to the Audit tab that never materialized in code).

### H2. "Redacted" persists as a fourth guardrail action — drifts from PRD's three-mode canon

- **Evidence:** `Requests.tsx:731` — `type GuardrailAction = 'allow' | 'flagged' | 'redacted' | 'block';`. Rows render `redacted` as a guardrail value (e.g., `824`, `838`, `858`, `870`, `891`). The toolbar filter exposes it at `1127`: `<SelectItem value="redacted">Redacted</SelectItem>`. The modal's `CheckStatus` (1841) carries `'redact'` as a first-class state.
- **Canon:** Security PRD response modes (per audit brief, quoted verbatim from PRD): **Block, Flag, Allow with annotation**. Flag is defined as *"Request proceeds. Trace is annotated with the detection. Alert fired."* There is no "Redact" response mode in the PRD; redaction is a transformation a Flag can perform, not a distinct verdict. CLAUDE.md project memory `project_requests-schema.md`: *"Requests page schema — Status + Guardrail are two axes — 5 valid combos."* The five valid combos listed in code at lines 723-728 include a `success | redact` combo that has no canonical PRD anchor.
- **Olivia weighs it:** "Redacted" reads as more reassuring than "Flagged" — she'd lose information if it were collapsed.
- **Devon weighs it:** He spots schema drift fast. A page that disagrees with its own PRD on what a verdict is, is a page he doesn't trust to drive his alerts.
- **Recommendation:** Two-step. First, flag this for CTO before changing code: the codebase has been live with `redacted` for long enough that it may be intentionally divergent from the PRD. If the PRD is right and code is wrong, collapse `redacted` into `flagged` (treating redaction as a `flagged` row's *action taken*, surfaced in the modal's PII check description, not as a top-level verdict). If code is right and PRD is wrong, the PRD needs an amendment to formalize Redact as a fourth response mode. **`[unanchored — flag for CTO]`** insofar as which side is canonical — both sources currently disagree.

### H3. "Cache: miss" badge in modal Details tab is fabricated schema

- **Evidence:** `Requests.tsx:1508-1511` — `<DetailRow label="Cache" value={<Badge variant="info">miss</Badge>} />`. The `RequestRow` type (738-773) carries no `cache` field. Every request modal shows "miss" regardless of row.
- **Canon:** CLAUDE.md user feedback `feedback_no-synthetic-data.md`: *"No synthetic data on this site — every visible number must derive from a real entity row; no hand-authored constants, no plausible-looking fallbacks."* CLAUDE.md core rule: *"Charts must reconcile to a single source of truth."* A hardcoded "miss" badge that ignores the row payload is the literal failure mode this rule names.
- **Olivia weighs it:** She does not parse "Cache: miss," so she will not notice it is fake. Neutral.
- **Devon weighs it:** Caching is *the* mechanism Token Savings is selling. The modal that's supposed to be his ground-truth per-request inspector hardcodes "miss" on every row. The first time he expects a cache hit and sees "miss," he learns the modal is lying and starts distrusting the rest of the panel.
- **Recommendation:** Either (a) add a `cache: 'hit' | 'miss' | 'partial'` field to `RequestRow` and seed it on every row (mirroring how `slow`, `guardrail`, and `guardrailReason` are seeded), or (b) remove the Cache row from the modal entirely until that data is real. Per the no-synthetic-data rule, option (b) is the safer ship-now move.

### H4. "POST /v1/messages" endpoint hardcoded on every row regardless of vendor

- **Evidence:** `Requests.tsx:1496-1503` — `<DetailRow label="Endpoint" value={<span><span className="text-ink-500">POST</span> /v1/messages</span>} />`. `/v1/messages` is Anthropic's endpoint; `gpt-5.1` (OpenAI) uses `/v1/chat/completions`, `gemini-3-pro` uses `/v1beta/models/{model}:generateContent`, etc. The modal claims every request, including OpenAI and Google calls, went to `/v1/messages`.
- **Canon:** Gateway PRD (per audit brief): *"Request pipeline architecture: auth/routing → input scanning (stage 5) → forward → output scanning (stage 7) → response."* The "forward" stage is provider-specific routing. Showing the wrong endpoint misrepresents the pipeline. CLAUDE.md no-synthetic-data rule applies again: *"Every visible number must derive from a real entity row."*
- **Olivia weighs it:** Will not notice.
- **Devon weighs it:** He recognizes vendor endpoints by sight. A `gpt-5.1` row showing `/v1/messages` reads as either (a) the modal is faked or (b) Gate is silently translating his OpenAI request into Anthropic's wire format. Both readings are bad — one says "demo product," the other says "I don't actually know what's getting sent." Either way he closes the tab.
- **Recommendation:** Derive the endpoint from `row.vendor`. Anchor copy in `VENDOR_META` (already imported at line 67). Mapping suggestion (no canonical PRD anchor for the exact strings, so flag): `anthropic` → `/v1/messages`, `openai` → `/v1/chat/completions`, `google` → `/v1beta/models/{model}:generateContent`, `meta` / `mistral` / `xai` → their OpenAI-compatible endpoints (`/v1/chat/completions`). **`[unanchored — flag for CTO]`** on the exact endpoint paths per provider; the principle of "derive from row" is fully anchored.

### H5. Em dash in user-facing page subhead

- **Evidence:** `Requests.tsx:147` — `Every model call across your stack, captured in real-time.` No em dash *in this line*. But scan reveals em-dash-like glyphs (`—`) in user-facing modal copy at lines 1175-1178 (Cost tooltip): *"Gateway requests are billed by Gate AI and show the exact charge. Bring-your-own-key (BYOK) requests are billed directly by your provider."* — no em dash, comma+period only. Cleaner pass. **However:** Tooltip text at line 1319 reads `Billed by your provider (BYOK)` — clean. Looking more carefully, the *page* is clean of em dashes in JSX strings. The em dashes I see (e.g., `1198`: `// Slow rows: leading amber TriangleAlert + ink-900 (one step` — note the en/em dash there) are inside code comments, exempt per `feedback_no-em-dashes.md`.
- **Canon:** CLAUDE.md user feedback `feedback_no-em-dashes.md`: *"No em dashes in user-facing copy — rewrite with periods, commas, colons, or two sentences; rule applies to every user-visible string."*
- **Olivia weighs it:** n/a (this finding downgrades to LOW — see below).
- **Devon weighs it:** n/a.
- **Recommendation:** **Downgraded — no HIGH em-dash violation found in this file's user-facing JSX strings.** Moving to 🟢 LOW with the one borderline case noted there.

## 🟡 MEDIUM

### M1. Tab labels conflate "Audit" semantics

- **Evidence:** `Requests.tsx:1445` — visible label is `Security`, internal value is `"audit"`. Comment at 1515: *"Audit tab — runtime guardrail checks (did this request pass policy at runtime?)."* Comment at 1407: *"Audit gets Copy Proof / View on DE; everyone else gets Copy ID / Open Conversation."* The code is internally split on whether this tab is the security-policy-check view or the DE-anchored audit-proof view.
- **Canon:** CLAUDE.md positioning rules treat *audit* as the DE-anchored evidence affordance (required vocabulary: "tamper-evident," "anchored to Constellation's Digital Evidence layer"). The PRD security event schema (per brief) names *human-readable reason* as a required field — a policy explanation, not a cryptographic proof. These are two different surfaces and the codebase is welding them together.
- **Olivia weighs it:** Indifferent — she sees the word "Security" and reads "is my agent safe."
- **Devon weighs it:** He notices the `value="audit"` / label="Security" mismatch if he reads the DOM. More importantly: he expects a real audit tab (with DE-anchor verification) to *also* exist somewhere on this page, separate from the policy-checks view.
- **Recommendation:** Rename the tab `value` from `"audit"` to `"security"`. Then add a *fourth* tab labeled `Audit` whose body is the DE-anchored proof / verify affordance H1 calls for. Anchor copy (CLAUDE.md required vocabulary): the new Audit tab body opens with *"Anchored to Constellation's Digital Evidence layer. This request's verdict is cryptographically verifiable."* Pair with a verify action.

### M2. Security event schema fields missing from modal

- **Evidence:** `Requests.tsx:1458-1512` (Details tab) surfaces: Timestamp, Conversation, Model, Provider, API Key, Endpoint, HTTP status, Cache. `SecurityPanel` (1856-1912) surfaces per-check: title, description, status. Across both: **missing** are *severity*, *policy* (which policy fired), *layer* (input scan stage 5 vs output scan stage 7), and a per-event *request ID* surface (the requestId is in the header but not labeled as an event-correlation field).
- **Canon:** Security PRD event schema (per audit brief): *"timestamp, severity, type (injection / PII / PHI / credential / content / format), policy, layer, action, request ID, API key (hashed), human-readable reason."* Layer is a load-bearing PRD field — it's how Devon answers "did this fire on the way in or on the way out?"
- **Olivia weighs it:** Indifferent. She does not parse "layer" or "policy."
- **Devon weighs it:** Layer (input vs output scan) and policy-name are the two fields he needs to debug whether his policy config is firing on the right side of the pipeline. Without them, the modal tells him *what* happened but not *where in the pipeline* or *which rule he wrote*. He cannot tune from this view.
- **Recommendation:** Add to `SecurityCheckRow` (1921-1941) a metadata strip below the description carrying `Policy · Layer · Severity` for non-passing checks. Anchor labels in PRD vocabulary: `Policy: pii-default-strict`, `Layer: input scan`, `Severity: high`. **`[unanchored — flag for CTO]`** on policy names and severity strings — these need to come from a real Policies page state, not invented. Principle is anchored; specific strings are not.

### M3. "Allow" rows render as neutral-gray Badge — passes Gateway PRD intent but loses signal

- **Evidence:** `Requests.tsx:907-918` — `GUARDRAIL_BADGE.allow: { variant: 'neutral' }`. Comment at 911-913: *"Keeping it on `neutral` (gray) instead of `success` (green) avoids doubling-up with the Status column's success badges."* In rendered rows: every Security column cell shows a gray "allow" pill, regardless of whether the row was a clean pass or a row that hit checks but landed at Allow with annotation.
- **Canon:** Gateway PRD axis-split (per brief): *"Status × Guardrail axis-split is documented here. Decision is `allow`, `flag`, or `block`. Block short-circuits."* The intent in code (gray for `allow`) is right by the PRD. But the gray *pill* in every row makes the Security column visually noisy — 75% of rows in mock data have a meaningless gray "allow" tag.
- **Olivia weighs it:** Cannot tell what's signal and what's noise. The Security column reads as "every row has a security label," which devalues the column.
- **Devon weighs it:** He'd prefer a literal dash or empty cell for `allow` rows so the colored badges (`flagged`, `redacted`, `block`) pop. The code comment at 905-906 even acknowledges this: *"`allow` is the silent default and the table cell renders it as a faint dash rather than a green badge so the column doesn't drown in noise."* But the render is a gray pill, not a dash. The comment is aspirational, not implemented.
- **Recommendation:** Either (a) render `allow` rows as a literal `—` in the Security cell (matches the code comment intent and what the Latency cell does for missing values), or (b) drop the Security cell content entirely on `allow` rows. Option (a) preserves column track alignment.

### M4. Status filter dropdown labels diverge from PRD verb tense

- **Evidence:** `Requests.tsx:1124-1130`: filter options read `Allow`, `Flagged`, `Redacted`, `Block`. Mixed tenses: imperative `Allow` and `Block`, past participle `Flagged` and `Redacted`.
- **Canon:** Security PRD response modes (per brief, verbatim): **Block, Flag, Allow with annotation**. All three are imperative / present-tense verbs naming the action. The PRD does not use "Flagged" or "Redacted."
- **Olivia weighs it:** Will not parse the inconsistency consciously but will read the column as slightly disorderly.
- **Devon weighs it:** Notices that a filter labeled "Flagged" and a verdict labeled "Flag" are the same thing presented two ways. Minor friction.
- **Recommendation:** Normalize to PRD vocabulary across filter labels, badge labels, and the `GuardrailAction` type itself. Replace `'flagged' | 'redacted'` with `'flag' | 'redact'`. Filter labels become `Allow`, `Flag`, `Redact`, `Block`. Anchor: Security PRD response modes (Block / Flag / Allow with annotation). Note this is a knock-on of H2 — if H2 collapses `redacted` into `flagged`, this becomes `Allow`, `Flag`, `Block`.

### M5. Hero metric ratios reconcile arithmetically but assert implausibly high "slow >10s" rates

- **Evidence:** `Requests.tsx:403-405` (all-time view): `success: 2_414, errors: 130, slow: 2_316`. That's 2316 / 4860 = **47.7%** of all requests crossing 10 seconds. 30D view (442-444): `success: 1_116, errors: 60, slow: 1_072` — 1072 / 2248 = **47.7%**. 7D: 218 / 468 = 46.6%. 24H: 22 / 48 = 45.8%. The breakdown's stable 47% slow rate reads as fabricated, not observed.
- **Canon:** CLAUDE.md `feedback_no-synthetic-data.md`: *"every visible number must derive from a real entity row."* The hero KPIs reconcile to the chart (good — passes `feedback_charts-must-reconcile.md`) but the ratios themselves are hand-tuned constants (401-405) not derived from the row set. Sample table rows show maybe 30-40% slow visually, but the KPI claims 48% on every preset — a pattern detectable by anyone who scrolls.
- **Olivia weighs it:** "Half my requests are slow" is a high-anxiety read. She'll either screenshot it or ask Devon why.
- **Devon weighs it:** 47% slow rate at p>10s with the latency mix shown in the table is suspicious — typical agent traffic sits at 5-15% slow, not 47%. Reads as mock-data tuning.
- **Recommendation:** Derive `slow` count from `rows.filter(r => r.slow).length` against the visible row set, then scale to the range total. The hero card and the chart are already wired to the same constants — the breakdown's "slow" should be a derived count, not a hand-authored ratio. **`[unanchored — flag for CTO]`** on the realistic slow-rate band; sourcing a realistic number requires either real telemetry or a Marcus-signed-off range.

## 🟢 LOW

### L1. Page subhead is on-brand but generic

- **Evidence:** `Requests.tsx:147` — *"Every model call across your stack, captured in real-time."*
- **Canon:** Narrative & Positioning voice anchor: *"plainspoken, technical — Tailscale / Fly.io register."* The current line is plainspoken but not technical-distinctive; any AI gateway could ship this string.
- **Olivia weighs it:** Reads fine. "Every model call" is comprehensible.
- **Devon weighs it:** Generic. Does not signal what makes Gate different from Helicone here.
- **Recommendation:** **`[unanchored — flag for CTO]`** — no PRD/Narrative line I can quote verbatim names the Requests page in a way that gives me an anchored replacement. Direction: add a clause that names the security-first frame. Sample (must be CTO-approved before ship): *"Every model call across your stack. Each one scanned for injection, PII, and credential leaks before it leaves the gateway."* This pulls vocabulary from the PRD's three-detector canon directly, but the exact wording needs sign-off.

### L2. Toolbar uses two adjacent "All ____" Select triggers

- **Evidence:** `Requests.tsx:1099-1130` — four Select triggers in a row: Model, Key, Response, Guardrail. Each defaults to a placeholder ("Model" / "Key" / "Response" / "Guardrail") and exposes an "All models" / "All keys" / "All responses" / "All guardrails" first item.
- **Canon:** `web-design-guidelines` (Vercel) — discoverability + scanning. Four filter pills with identical visual treatment and inconsistent default labels (placeholder vs "All X") creates filter blindness. Devon scans for the *active* filter and has to read each pill.
- **Olivia weighs it:** Wall of filters. Skips them, scrolls to the table.
- **Devon weighs it:** Functional but noisy. He'll find the filter he wants.
- **Recommendation:** Show the placeholder *only* until the user touches the filter; once defaulted to All, show "All models" as the trigger label so the active state reads at a glance. Anchor: web-design-guidelines on state visibility. Already partially handled by `SelectValue placeholder="Model"` but the rendered trigger when value is `'all'` should show "All models," not "Model."

### L3. Row "Time" cell uses tooltip for relative timestamp — duplicate of column data

- **Evidence:** `Requests.tsx:1218-1240` — absolute timestamp is the cell's visible content; relative ("just now", "3h ago") sits in a hover Tooltip. Comment at 1219-1225 explains the choice — relative phrasing "doesn't scale once the table holds hundreds of rows."
- **Canon:** Comment is correct on the scaling argument. CLAUDE.md `feedback_table-date-time-tier.md` notes date/time cells go in the data tier (`text-ink-800`) — done correctly here at 1232.
- **Olivia weighs it:** Wants the relative time visible. Hovering for "3h ago" is friction.
- **Devon weighs it:** Wants the absolute time visible. Current implementation matches him.
- **Recommendation:** Implementation is correct for the Devon-leaning Primary ICP. **No change.** Calling this out as LOW because the prior audit may have wanted this reversed; the current state is the right call for the canonical audience.

### L4. Em-dash audit: clean pass on user-facing JSX strings

- **Evidence:** Searched lines 1-1942 for em dash (`—`) in JSX string literals. Found em dashes only inside `/* */` code comments (e.g., `1190-1197`, `1219-1226`). User-facing JSX strings (page subhead, tooltip content, Select labels, modal labels, security check descriptions) use commas, periods, colons, and middle-dot separators (`·` at lines 1872, 1885, 1900) — not em dashes.
- **Canon:** CLAUDE.md `feedback_no-em-dashes.md`: *"No em dashes in user-facing copy."*
- **Olivia weighs it:** n/a.
- **Devon weighs it:** n/a.
- **Recommendation:** **No change. This is a passing finding** — calling it out so the absence isn't mistaken for a missed scan.

### L5. Forbidden-phrase scan: clean

- **Evidence:** Searched for: "platform" (as Gate-noun), "enterprise-grade," "industry-leading," "best-in-class," "blockchain," "on-chain," "Web3," "AI security platform," "governance platform." Only `platform` occurrence: none in user-facing copy on this page.
- **Canon:** Narrative & Positioning forbidden-phrases list (per CLAUDE.md auto-memory `reference_notion-product-knowledge-graph.md`).
- **Olivia weighs it:** n/a.
- **Devon weighs it:** n/a.
- **Recommendation:** **No change. Passes.** Noted for completeness.

### L6. `responseLabel` returns lowercase "slow" / "success" / "error" — Badge children render literal lowercase

- **Evidence:** `Requests.tsx:924-927` — `responseLabel` returns `'slow'`, `'success'`, `'error'`. `Requests.tsx:1242-1244` — `<Badge variant={responseVariant(row)}>{responseLabel(row)}</Badge>` renders that literal lowercase string.
- **Canon:** Voice anchor: "plainspoken, technical." Lowercase verb-tense status badges are a defensible Vercel/Tailscale convention. CLAUDE.md does not specify a casing rule for status badges.
- **Olivia weighs it:** Reads fine.
- **Devon weighs it:** Reads as deliberate, terminal-flavor.
- **Recommendation:** **No change.** Calling out because earlier audits may have flagged casing; current state is on-voice for the canonical audience.

### L7. KpiTile compression value is a deterministic function of inTokens, not a real cache stat

- **Evidence:** `Requests.tsx:1529-1534` — `compressionValue` returns `Math.round(pct)%` where `pct = clamp(20, 55, 22 + tokens/220)`. The modal's KPI rail (1543) shows this as "Compression."
- **Canon:** `feedback_no-synthetic-data.md` — derived constants without an entity-row source. Comment at 1526-1528 self-admits: *"Deterministic compression-ratio mock — hand-tuned to land in the 20-55% band so the value reads as plausible savings without ever maxing out."*
- **Olivia weighs it:** Reads it as a real savings number.
- **Devon weighs it:** Recognizes the pattern (compression % scaling linearly with payload size), flags it as fake.
- **Recommendation:** Either add a real `compression` field to `RequestRow` seeded per-row, or remove the Compression KPI tile from the modal. Same rule as H3 (Cache: miss); compression is the closer cousin to the Token Savings page that *does* have a real DE-anchor story.

## Signature test

**Fail.** Strip the vendor avatars and the page reads as a generic AI gateway log — Helicone, Portkey, OpenRouter could all ship the same surface. The differentiator (DE-anchored audit, per-request cryptographic proof) is named nowhere on this page, despite the page being the single most natural venue for it. The Status × Guardrail axis split is the one Gate-specific architectural choice visible.

## Squint test

**Pass.** Three+ typographic tiers are present and legible at a blur: hero number (lg HeroNumeric), breakdown values (xs mono), chart line, table headers (uppercase eyebrow), and row data (sm mono / sans). Primary signal is the hero "REQUESTS / 4,860" — clean.

## Anti-default check

Three obvious patterns this page could have followed:

1. **Combine HTTP status and guardrail action into one "Status" pill.** The default pattern in every gateway log (Helicone, Portkey). Requests.tsx **diverges** correctly — splits them onto two columns with a documented CTO sign-off (722-727). The WHY: error-from-provider and block-by-policy are operationally different incidents and squashing them into one badge hides which side failed. This is the strongest anti-default move on the page.
2. **Show prompt + response inline in the table row.** The default expand-on-click pattern. Requests.tsx **converges** correctly — uses a centered modal instead of inline expansion. The WHY: the message content + JSON drawer + 3-tab body is too much for a row-expansion treatment; modal gives it breathing room (`DialogScrollContent sm:max-w-[672px]`).
3. **Show "Cost" as the only money column.** Default for every gateway dashboard. Requests.tsx **diverges** correctly — the Cost column carries a tooltip distinguishing Gateway-billed from BYOK (1175-1178), and BYOK rows render the literal `—` with a tooltip explaining why (1305-1320). The WHY: this is the load-bearing UX moment for the PAYG/BYOK distinction that the narrative names as the third revenue line.

## Cross-page coupling (note only, don't fix here)

- **`req_*` deep-link parity with Security events:** `EVENT_ROWS` in `Security.tsx` must keep timestamps + conversation ids matching `REQUEST_ROWS_ALL` `requestId` entries (834-840 here). Already documented at 829-833 comment.
- **Conversation deep-link parity:** `openConversation` (1399-1400) navigates to `/conversations?open=${row.conversation}`. The Conversations page must honor that `?open=` query.
- **Detector taxonomy disagreement with Security page:** This file uses 3 detectors (injection / pii / credential). `Security.tsx:754` per `Gate-AI-personas.md:223-228` defines 4 (`injection | pii | phi | credential`). Resolution belongs in a Security.tsx audit, not here.
- **Audit Trail page:** The DE-anchor footer this audit recommends adding to `SecurityPanel` (H1) should deep-link to the Audit Trail page (`/audit-trail?request=req_*`). Audit Trail was built 2026-05-16 (per memory `project_gate-ai-audit-docs.md`); confirm route shape before wiring.
- **Token Savings ↔ Compression KPI:** L7's compression value, if made real, should reconcile with whatever Token Savings reports. Single-source-of-truth rule applies cross-page.
