# Gate AI — Site Fixes & Suggestions

> Source: cross-referenced against [Gate-AI-personas.md](./Gate-AI-personas.md), Notion → Narrative & Positioning (H1), Competitive Positioning (H1), Executive Summary (H1), and the canonical Constellation Gate AI product record.
>
> Each item carries a **persona tag** so we can decide whether copy / UI / UX changes serve both Olivia and Devon, or one at the expense of the other.

Persona tags:
- 🤖 **Olivia** — primary ICP, non-/semi-technical agent operator
- 👨‍💻 **Devon** — secondary ICP, technical coding-agent developer
- 👥 **Both** — serves both personas
- ⚙️ **Internal** — code hygiene, schema, naming; no direct user impact

Priority tags: 🔴 High · 🟡 Medium · 🟢 Low

---

## Copy

Copy issues = wrong words on the page. These do not require any code or layout change beyond a string edit.

### 🔴 High

- [ ] **Standardize the product name → "Constellation Gate AI" / "Gate AI"** 👥
  Two drift spots drop the "AI" suffix and weaken the security-first frame:
  - `src/pages/Models.tsx:1273` — "Constellation Gate API key"
  - `src/pages/Billing.tsx:91` — "the full Constellation Gate audit trail"
  Pin the canonical form in CLAUDE.md.

- [ ] **Surface the DE-anchored audit claim with the right words.** 👥
  The narrative requires "tamper-evident," "cryptographically verifiable," "anchored to Constellation's Digital Evidence layer." Today it appears once, on TokenSavings.tsx, attached to *cost reporting*. Move it onto the Audit Trail page header and the Security page subhead. Drop it from Token Savings.

- [ ] **Replace Token Savings 0% / $0 hardcoded values with a real empty state.** 👥
  *"No traffic yet — savings will appear once your first requests come through."* For Olivia this removes a false "broken" signal on her highest-anxiety concern. For Devon it stops looking like a stub feature.

- [ ] **Rewrite Policies "Action on detection" helper text in plain language.** 🤖
  *"Forward the request, attach detection metadata to response headers"* → *"Let the request through, but record the detection."* Implementation framing belongs in dev docs. Action labels can stay technical; the per-option descriptions need to translate.

### 🟡 Medium

- [ ] **Translate Policies "Scan direction" labels.** 🤖
  *"Scan direction"* → *"What to scan."* Options: *"Incoming messages" / "AI responses" / "Both"* instead of input/output/bidirectional. Domain-correct, plain-English.

- [ ] **Add an Olivia-friendly subhead on Models.tsx.** 🤖
  Single sentence at the top: *"These are the models available through your gateway — you don't have to configure anything. Pick a default if you want to override your agent platform's choice."* Prevents the misread as required config.

- [ ] **Pre-traffic empty states on Requests, Conversations, Activity, Security, Overview.** 👥
  Every page currently assumes data is already flowing. First-10-minutes Olivia sees seeded mock rows. Add *"You haven't sent any requests yet — here's how to connect."*

### 🟢 Low

- [ ] **Add a one-line trust signal on the Security page hero.** 🤖
  Below the "threats blocked" metric: *"Every event below is anchored to a tamper-evident audit log."* Doubles down on the differentiator at the exact moment Olivia decides whether to trust the number.

---

## UI

UI issues = visible component or layout changes. The page exists; the controls or surfaces on it need work.

### 🔴 High

- [ ] **Build the Audit Trail page.** 👥
  `src/layouts/nav-sections.ts:51` ships the nav item with no `pageId`. The hero differentiator of the entire H1 narrative is an inert sidebar label. Minimum viable surface: chain status (last anchor timestamp, anchor cadence, current Merkle root), per-record verify affordance reachable from the Requests modal, and the "tamper-evident audit anchored to Constellation's Digital Evidence layer" language in the page header.

- [ ] **Surface a detection-quality artifact.** 👨‍💻
  Devon's reflexive *"is your detection actually any good?"* has no in-product answer. Options: (a) per-policy "detection performance" link on Policies pointing to a benchmark/leaderboard view, (b) a one-time provenance badge on Security with the F1 98.16% / "ahead of Lakera Guard" claim, (c) both. He won't ship without seeing this once.

### 🟡 Medium

- [ ] **Add sub-hourly period options on Guardrails (5m, 15m).** 👨‍💻
  Devon's most important use case — burst protection on a runaway agent loop — is not covered by the current 1h minimum. A tight loop can burn meaningful spend before the limit trips.

- [ ] **Add Settings → Webhooks / Notifications.** 👨‍💻
  His toolchain is Datadog / PagerDuty / Sentry. A webhook URL for security events and limit breaches is the single most-missing Settings item. Even a placeholder card with "coming soon" signals the product is finished enough to plan around.

- [ ] **Add a CSV / API export affordance on Activity's UsageByKey table.** 👨‍💻
  Closes his main Activity objection: pulling data into spreadsheets or Datadog.

### 🟢 Low

- [ ] **Add a verify-this-record button inside the Requests drill-in modal.** 👨‍💻
  Once the Audit Trail page exists, the Requests modal becomes the natural entry point for record-level verification. One button, one link out.

---

## UX

UX issues = information architecture, navigation, onboarding flow, mental-model mismatches. The pages and components may be fine in isolation; the journey between them is wrong.

### 🔴 High

- [ ] **Move OpenClaw / Hermes integration cards from Models.tsx onto API Keys.** 🤖
  Olivia's actual onboarding path is currently hidden behind a sidebar item she has no reason to click. The Models page hosts a `PlatformPanel` with the exact cards she needs. Surface them on API Keys alongside the cURL / Claude Code / OpenAI SDK tabs as a distinct *"Connect via agent platform"* path.

- [ ] **Add a PAYG / "use our keys" onboarding moment.** 🤖
  The third revenue line in the narrative is invisible at first-run. Olivia is unlikely to ever paste a provider key. On API Keys or in a first-run flow, give her *"Use our keys, pay per token, no provider setup."*

- [ ] **Flatten the security sidebar section for Olivia.** 🤖
  Guardrails, Policies, and Security read as three pages about the same thing to her. Devon parses them as rate caps / scan config / event log. Either consolidate into a single "Protection" page with tabs, or add a one-line descriptor under each nav label so she can disambiguate without clicking three times.

### 🟡 Medium

- [ ] **Regroup the sidebar by user intent rather than eng-org.** 👥
  Current groups (Gateway, Security, Audit, Workspace Admin) reflect the eng-team split. Propose: **Activity** (Overview / Requests / Conversations) · **Cost & Limits** (Token Savings / Guardrails / Activity) · **Security** (Events / Policies / Audit Trail) · **Workspace** (Models / Team / Billing / API Keys / Settings). Neither persona thinks "Gateway is where my cost controls live."

- [ ] **A simplified Olivia home / first-run mode.** 🤖
  Home screen surfaces Security events, Conversations, cost this week, and active limits. Everything else stays one click deeper. Serves the primary ICP without removing Devon's power surfaces.

### 🟢 Low

- [ ] **Cross-link from Audit Trail back to its source events.** 👥
  Once Audit Trail ships, complete the deep-link chain: Audit Trail entry → Requests modal → Conversations thread. Already 2/3 done.

---

## Other (Data / Schema / Code Hygiene)

Items that don't fit Copy / UI / UX but affect product correctness or future maintenance.

### 🔴 High

- [ ] **Collapse PHI into PII across Security event categories.** ⚙️
  `src/pages/Security.tsx:754` defines four categories (injection / pii / phi / credential). Requests uses the canonical three (injection / pii / credential). PHI is medical PII. Two pages disagreeing on the schema of "what is a security event" violates the single-source-of-truth rule that CLAUDE.md already enforces for charts. Collapse to three; PHI becomes a sub-tag.

### 🟡 Medium

- [ ] **Rename `PLATFORM_LINKS` / `PlatformPanel` in Models.tsx.** ⚙️
  Variable-level forbidden-phrase hygiene. Rename to `AGENT_INTEGRATIONS` / `IntegrationPanel`. Keeps the discipline live at the code level so it doesn't bleed into user-facing copy in a future commit.

### 🟢 Low

- [ ] **Audit `Token Savings` page placement and naming.** 👥
  If the DE clause is pulled out (per Copy section), the page is purely about cache / compression savings. Is "Token Savings" the right name, or is "Cache & Compression" closer to what it actually is? Consider when Audit Trail ships.
