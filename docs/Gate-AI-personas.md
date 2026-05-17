commi# Gate AI — Persona Analysis & Dashboard Alignment

> Source: Constellation Product Knowledge Graph (Notion), May 2026.
> Purpose: Map the H1 ICP set against the Gate AI dashboard design — what creates friction, what lands well, and what changes are worth making.

---

## The Personas

### 🤖 Agent Operator Olivia — Primary ICP (H1 launch)

**Role:** Non-technical or semi-technical knowledge worker running AI agents day-to-day.

**Platforms:** Claude Cowork, OpenClaw, Hermes, ChatGPT Agents, Notion Agents, Microsoft Copilot Workspaces.

**Technical sophistication:** Medium. AI tooling has pulled her into more technical territory than she'd otherwise occupy, but she will never write a YAML config or read a stack trace.

**Decision power:** Champion. She can advocate and adopt self-serve. She cannot close an enterprise deal.

**Budget authority:** Partial. Credit card or expensed SaaS — yes. Procurement loop — no.

**Goals:**
- Get more done with agents without getting burned
- Set up security, usage limits, and audit in minutes — no IT ticket, no annual contract
- Have a clean record she can show her boss, customer, or auditor when something goes wrong
- Stay in control of costs without understanding the technical details

**Pain points:**
- No way to know if a prompt injection or poisoned input compromised an agent run
- No visibility into what her agents actually did or which tool calls fired
- Cost surprises from a runaway agent loop with no circuit breaker
- Not technical enough to wire up Helicone, Lakera, or a homegrown audit pipeline
- Personally on the hook if an agent leaks a credential — and there's no neutral record to point to

**Objections:**
- "Isn't this what my agent platform already does for me?"
- "I'm not a developer — this sounds like dev tooling"
- "My company hasn't approved this — is it safe for me to set up on my own?"

**Buying motion:** Self-serve only. OpenClaw plugin, ClawHub, agent-platform marketplaces. Discovers through her agent platform, not through developer channels.

---

### 👨‍💻 Coding-Agent Dev Devon — Secondary ICP (H1 launch)

**Role:** Developer or small-team lead running AI coding agents (OpenClaw, Claude Code, Cursor agent mode, Cline, Aider) on their own production codebase.

**Technical sophistication:** High. Can wire up Helicone, build a homegrown proxy, write a YAML guardrail policy. Chooses not to.

**Decision power:** Champion. Installs self-serve, advocates to the team.

**Budget authority:** Partial. Credit card or team budget — yes. Enterprise procurement — no.

**Goals:**
- Ship features faster with agents without adding new failure modes
- One base-URL swap: inherit prompt-injection defense, credential and PII scanning, usage limits, and audit
- Keep model and provider choice open — no lock-in
- Have a verifiable record of every agent action when a CI failure, customer complaint, or compliance question lands

**Pain points:**
- Coding agents read attacker-controlled input on every run (READMEs, support tickets, GitHub issues, log files) with no inline defense
- Credentials and secrets leak out of agent prompts and tool calls in ways existing observability never catches
- Runaway agent loops produce surprise bills with no in-the-moment circuit breaker
- Existing gateway tools (Helicone, Portkey, LiteLLM, OpenRouter) do routing and observability but ship no inline prompt-injection defense
- Enterprise prompt-security tools (Lakera, Prompt Security) are gated behind procurement and annual contracts

**Objections:**
- "Doesn't my existing gateway already cover this?"
- "Isn't prompt injection a model-provider problem?"
- "Will this add latency to every request?"
- "Can I keep BYOK and not route through your token reseller?"
- "Do I really need a tamper-evident audit trail or is structured logging enough?"

**Buying motion:** Self-serve. One base-URL swap and a few headers. Discovers through developer channels, OpenClaw, ClawHub.

---

### Adjacent / future personas

**Platform Administrator Alex** — DevOps/SRE at an integrating customer. Monitors system health, API keys, credit consumption, integration reliability. No budget authority, end-user decision power. Cares about: unified signer dashboard, credential rotation, Datadog/Prometheus integration, SLA visibility. H1 adjacent.

**AI Governance Officer Grace** — AI Governance Officer or Model Risk Manager at a regulated institution (financial services, healthcare, public sector). Decision maker with partial budget authority. Goals: provably tamper-evident audit trail for regulators, EU AI Act Article 12 compliance before August 2026. The DE-anchored audit trail is her closing argument. H1 wedge buyer, H2 target.

**Auditor Aiden** — External or cross-org verifier. Needs to independently reconstruct and verify agent actions. Downstream of Grace.

---

## Dashboard Friction Analysis

### What causes friction for Olivia

**1. Three security-adjacent pages with no clear hierarchy.**
Guardrails, Policies, and Security are separate pages about adjacent concepts. Devon can parse that Guardrails = rate caps, Policies = scan config, Security = event log. Olivia cannot. All three sound like "the thing that stops bad stuff." She'll bounce between them confused or ignore two of the three.

**2. The Requests page is a developer log.**
HTTP status codes, `inTokens`/`outTokens`, latency in milliseconds, guardrail action codes — she has no frame for any of this. Her question is "did something bad happen to my agent?" The signal she needs is buried inside columns she can't read. The page as built is Devon's canonical surface, not hers.

**3. The Models page is invisible to her use case.**
Olivia doesn't pick models — her agent platform does. Context windows, throughput TPS, pricing per million tokens: none of this means anything to her. She may actively misread this page as "configuration I have to do before the product works."

**4. Token Savings shows 0% / $0 saved.**
Her primary fear is runaway costs. She lands on a page called "Token Savings" and sees she's saving nothing. She won't read this as a placeholder — she'll read it as "this feature doesn't work," which is the worst possible first impression on her most anxiety-producing concern.

**5. API Keys onboarding is pure developer UX.**
The code examples (cURL, Claude Code, OpenAI SDK) are the setup path for Devon. Olivia connects through the OpenClaw plugin and never sets a base URL. There is no "set up with OpenClaw" path anywhere in the dashboard. She lands on the API Keys page with no clear path forward.

**6. Policies "scan direction" has no consumer translation.**
Input vs. output scanning is a meaningful distinction for Devon. For Olivia it needs to read as "check what goes to the AI" vs. "check what the AI sends back." Current field labels don't bridge that gap.

**7. Overall density and register.**
The dashboard is an operator tool: dense, monospace numbers, ink-900 primary, warm canvas. Olivia comes from Claude.ai, Notion, ChatGPT — approachable, bright, consumer-grade surfaces. The density of a page like Activity (dimension toggles, metric switches, stacked bar decompositions) will feel like a wall.

---

### What causes friction for Devon

**1. No webhook or alert configuration.**
Devon's toolchain is Datadog, PagerDuty, Sentry. He wants a policy trigger or limit breach routed to his existing alerting. There's no webhook endpoint or notification config anywhere in the product. He'll look for it in Settings and find a display-name form.

**2. Settings is nearly empty for him.**
He expects SSO config, webhook URLs, notification preferences, API rate limit settings, export controls. What exists: display name, email, passkey. He'll read this as a sign the product isn't finished.

**3. Token Savings placeholder values.**
Same trust signal problem as Olivia, different interpretation: he'll read "0% / $0 saved" as "feature not implemented yet" and deprioritize the caching config he actually wants to tune.

**4. Guardrails minimum period is 1 hour.**
A runaway agent in a tight loop can burn through significant spend before a 1-hour limit trips. Devon wants burst protection at 1-minute or 5-minute windows. The current period options (1h/1d/1w/1mo) don't cover his most important use case.

---

## What Works Well

### For Olivia

**Security page hero metric** is her most important screen. "12 threats blocked, 14 flagged, 2 redacted" — this is exactly what she screenshots and sends her manager. The area chart + breakdown tiles give her a before/after narrative without requiring her to understand the underlying mechanics.

**Conversations view** maps directly to her mental model. She doesn't think in API requests — she thinks in sessions. "I ran an agent on the Q2 report, it took 8 turns, cost $0.43." The conversation detail modal with the message thread is the most Olivia-native surface in the product.

**Guardrails is immediately intuitive.** "Stop spending when I hit $X per day" — no mental model required. The Create Limit dialog (name, type, threshold, period, scope) is a standard SaaS form she's filled out dozens of times.

**Overview KPI rail.** Total Requests, Total Cost, Avg Latency — three numbers she can understand and report upward. Sparklines give her trend without requiring chart literacy.

---

### For Devon

**Requests drill-in modal.** Full trace with messages, security check results per detector (injection/PII/credential), and cross-link to the parent conversation. This is the incident investigation workflow. Most competitors don't have this.

**Security ↔ Requests ↔ Conversations deep-link chain.** Security event → associated request → parent conversation. This is how Devon debugs a real incident and the fact that it's implemented is a meaningful differentiator.

**Models page with provider comparison.** Latency p50, throughput TPS, input/output price per million tokens, context window — the right data in the right shape for routing decisions.

**Policies with tunable sensitivity and action.** The escape hatch that converts Devon from skeptic to advocate. Configuring sensitivity/scan direction/action-on-detection per policy type is what differentiates Gate from "it just blocks everything."

**Activity dimensional analytics.** Model vs. provider vs. API key breakdown, spend vs. tokens toggle, the UsageByKey table — the right analytical surface for attributing costs and spotting anomalies across multiple agents.

---

## The Core Gap

The dashboard is built Devon-first, Olivia-second. The density, terminology, sidebar depth, and code-first onboarding are all Devon defaults. That's not fatal — the pages that serve Olivia well (Security hero, Conversations, Guardrails, Overview KPIs) are present and strong. But she has to navigate past or through ten other pages to find them. The product doc is unambiguous: Olivia is the H1 primary ICP and the larger audience. Her first-run experience needs to match that priority.

---

## Where the action items live

This file holds the persona definitions and the persona-driven analysis above. **Concrete changes — copy edits, UI work, UX rework, schema fixes — live in [Gate-AI-fixes.md](./Gate-AI-fixes.md).** That file is broken into Copy / UI / UX / Other, with each item tagged for which persona it serves so we can keep both audiences in view when prioritizing.

---

## Dashboard Audit (Beyond Personas)

> Source: cross-referenced against Notion → Narrative & Positioning (H1), Competitive Positioning (H1), Executive Summary (H1), and the canonical Constellation Gate AI product record. Findings below are about the product as built versus the canonical story the company is telling about it.

### 1. Missing-differentiator surfacing

The narrative names four primary differentiators. Two of them are nearly invisible in the dashboard.

**1.1 The Audit Trail page does not exist.**
`src/layouts/nav-sections.ts:50–52` declares an "Audit" section with a single "Audit Trail" item — and that item has no `pageId`. It is an inert nav affordance. The narrative is explicit that DE-anchored tamper-evident audit is the **hero differentiator, not a coming-soon wedge** — "named, explained, and central to launch messaging." Today it is named in the sidebar and nowhere else. This is the single largest gap between the canonical story and the product.

**1.2 "Tamper-evident" / "cryptographically verifiable" / "Digital Evidence" language appears once.**
The only mention is `src/pages/TokenSavings.tsx:50`: *"Every saved token is anchored on Constellation DE for verifiable cost reporting."* That sentence uses DE as evidence for *cost reporting*, which is a side use of the layer. The headline use — verifiable audit of every request and tool call — is absent from Security, Requests, Conversations, Overview, and Billing. The narrative requires this language to be central; it is currently a footnote on a placeholder page.

**1.3 The detection-quality claim is absent.**
Per the product record: F1 98.16% across the 26-dataset public benchmark suite at a 1% false-positive budget, beating Lakera Guard 92.08 vs 82.30 on deepset. This is meant to be the answer to "is your detection actually any good?" Nowhere in the dashboard is detection performance, benchmark provenance, or comparative positioning surfaced. Devon's reflexive objection ("is this real defense or just a feel-good label?") has no in-product answer.

**1.4 PAYG / managed-key as a third revenue line has no onboarding surface.**
The narrative names three motions — Free, Paid Subscription, PAYG token reselling — and explicitly calls PAYG "a pricing surface competitors don't have." Activity and Requests do a strong job *reporting* on BYOK vs. Gate-routed traffic after the fact (with a good explanatory tooltip on the Activity table). What is missing is the onboarding moment: "Use our keys, pay per token, no provider keys to manage." This is the path that should be defaulted for Olivia, who is the larger audience and unlikely to ever paste a provider key.

**1.5 What *is* surfaced well.**
Multi-provider neutrality is reasonably visible — the Models page lists OpenAI, Anthropic, Mistral, xAI, Google side-by-side with comparable metrics. BYOK vs. Gate distinction is well-handled with a tooltip on Activity's UsageByKey table. The Pro tier description on Billing names the three load-bearing capabilities cleanly: "prompt-injection scans, PII redaction, and the full Constellation Gate audit trail."

### 2. Narrative voice & forbidden-phrase scan

Cross-referenced against the "Forbidden phrases / narrative guardrails" section of Narrative & Positioning (H1).

**Passes (no violations found in user-facing copy):**
- No "enterprise-grade," "CISO-ready," "SOC-integrated," "compliance-ready"
- No "industry-leading," "best-in-class detection," detection-superlative claims
- No "blockchain," "on-chain," "Web3," DAG name in product copy
- No "platform" as a noun describing Gate itself
- No "decentralized AI," "network-hosted inference," "node compute"

**Borderline:**
- `src/pages/Models.tsx` uses the variable names `PLATFORM_LINKS` and `PlatformPanel` for the OpenClaw / Hermes integration cards. Internal-only, won't ship to users, but the framing reinforces the term we don't want creeping into user-facing copy. Consider renaming to `AGENT_INTEGRATIONS` / `IntegrationPanel`.
- "Platform" appears inside two Models page descriptions (Mistral "platform of record," Grok "major social platform") — these refer to *other* platforms, not Gate. Acceptable.

### 3. Product-name consistency

Canonical name per Notion: **Constellation Gate AI**.

Drift found:
- `src/pages/Models.tsx:1273` — "Constellation Gate API key" (drops the AI suffix)
- `src/pages/Billing.tsx:91` — "the full Constellation Gate audit trail" (drops the AI suffix)

Two lines is not a crisis, but the name is load-bearing — the entire competitive frame is "this isn't a developer gateway, it's a security product that happens to be a gateway." Dropping the "AI" suffix erodes that. Standardize on Constellation Gate AI in long form, Gate AI in short form, never "Constellation Gate" alone.

### 4. Schema drift: detector categories

The canonical security pipeline has **three detectors**: prompt injection, PII (PHI subsumed), credential. Project memory and `CLAUDE.md` both call this out: *"Requests page security tab has exactly 3 checks (injection/PII/credential)."*

Drift on Security page:
- `src/pages/Security.tsx:754` defines `EventCategory = 'injection' | 'pii' | 'phi' | 'credential'` — four categories
- `src/pages/Security.tsx:630` lists Prompt Injection, PII, PHI, Credential as separate breakdown rows
- Requests page (per memory) uses the canonical three

PHI is medical PII. It should not be a separate category. The breakdown should collapse to three, or PHI should be a sub-tag inside PII. As-built, the Security page and the Requests page disagree about what a security event is — a violation of the "single source of truth" rule that the existing CLAUDE.md already calls out for charts.

### 5. Page-level copy & IA findings

**5.1 Token Savings — wrong placeholder, wrong page-level promise.**
Hero copy reads: *"Cache, compress and deduplicate to spend less per request. Every saved token is anchored on Constellation DE for verifiable cost reporting."* The DE clause is doing too much work on the wrong page — it should be the hero of the Audit Trail page that doesn't exist yet, not a postscript on a savings page. KPI tiles show "0% / $0 saved" hardcoded; rename or rewrite as a true empty state. See suggestion in High-Priority list above.

**5.2 The Olivia onboarding path is hidden inside the Models page.**
`Models.tsx` has a `PlatformPanel` listing OpenClaw, Hermes, etc. with "Paste the model ID in your setup." This is exactly the onboarding card Olivia needs — and it lives behind a sidebar item she has no reason to click. Moving this onto API Keys (alongside the cURL / Claude Code / OpenAI SDK tabs) puts it on the page she will land on at first run.

**5.3 Policies "Action on detection" copy is dev-only voice.**
*"Forward the request, attach detection metadata to response headers."* Devon understands "response headers." Olivia does not. The radio-button labels themselves can stay technical; the helper text under each option should translate to plain language for the action's behavior, not its implementation mechanism.

**5.4 Sidebar grouping fights both personas.**
Current top-level groups: Gateway, Security, Audit, Workspace Admin. "Gateway" and "Security" both contain pages Olivia uses (Models / Token Savings / Guardrails under Gateway; Events / Policies under Security). She does not know that "Gateway" is the bucket for her cost-control page. The labels are eng-org labels (gateway team, security team, audit team) showing through to the user. Consider regrouping by user intent: "Activity" (Overview / Requests / Conversations), "Cost & Limits" (Token Savings / Guardrails / Activity), "Security" (Events / Policies / Audit Trail), "Workspace" (Models / Team / Billing / API Keys / Settings).

**5.5 No empty / first-run state anywhere.**
Every page assumes traffic is already flowing. Olivia's first 10 minutes — install plugin, sign up, look at dashboard — will show her tables with seeded mock data and a Token Savings page declaring 0%. There is no "you haven't sent your first request yet, here's how to" state on Requests, Conversations, Security, Activity, or Overview.

### 6. Action items

All concrete changes — copy edits, UI work, UX rework, schema fixes — moved to **[Gate-AI-fixes.md](./Gate-AI-fixes.md)**, categorized Copy / UI / UX / Other and persona-tagged. This file stays the *why*; the fixes file is the *what*.

