# Gate AI — /clarify audit

## Verdict

Voice is mostly held. Forbidden phrases are absent from user-facing strings, the Tailscale/Fly.io register is generally intact, and the three required audit-vocabulary terms ("tamper-evident," "cryptographically verifiable," "anchored to Constellation's Digital Evidence layer") appear on the pages where they belong most. The meaningful problems are: (1) "public ledger" in AuditTrail's subtitle implies blockchain without using the required vocabulary; (2) a comment in Requests.tsx smuggles "toxicity" and "model allowlist" into the documented security check set, creating schema drift if that comment ever becomes user-facing; (3) several product-name instances drop "AI" from "Constellation Gate AI"; (4) two em dashes appear in rendered strings; (5) a cluster of empty-state bodies are dead ends with no next step; and (6) the "Flag" action description on Policies speaks HTTP/headers to an audience that may not know what response headers are.

---

## HIGH — voice / vocabulary violations

### H1. "Public ledger" implies blockchain without required vocabulary
- **File:** `src/pages/AuditTrail.tsx:160`
- **Current:** `"Every request, policy decision, and limit check is logged here. Each entry is hashed and anchored on a public ledger — independently verifiable, tamper-evident by construction."`
- **Why:** "Public ledger" is the vocabulary the project's Narrative & Positioning page flags as too close to "blockchain/on-chain/Web3" framing. The required vocabulary is "Constellation's Digital Evidence layer" or "tamper-evident." This sentence uses "tamper-evident" correctly but names the mechanism as "a public ledger," which does not match the canonical description. The em dash also violates the no-em-dash rule.
- **Proposed:** `"Every request, policy decision, and limit check is logged here. Each entry is hashed and anchored to Constellation's Digital Evidence layer, independently verifiable and tamper-evident by construction."`

### H2. AuditRecordDialog calls DE a "public ledger"
- **File:** `src/pages/AuditRecordDialog.tsx:79`
- **Current:** `"This event is anchored on the Constellation Digital Evidence public ledger."`
- **Why:** Same "public ledger" framing as H1. Required vocabulary: "Constellation's Digital Evidence layer," not "public ledger."
- **Proposed:** `"This event is anchored to the Constellation Digital Evidence layer."`

### H3. TokenSavings uses "Constellation DE" shorthand without context
- **File:** `src/pages/TokenSavings.tsx:49`
- **Current:** `"Cache, compress and deduplicate to spend less per request. Every saved token is anchored on Constellation DE for verifiable cost reporting."`
- **Why:** "Constellation DE" is an internal abbreviation. The canonical vocabulary is "Constellation's Digital Evidence layer." "Verifiable cost reporting" is also a weak use of the vocabulary: the audit trail's load-bearing claim is verifiable agent actions, not cost reporting. The Narrative & Positioning page reserves this language for the audit differentiator, not a savings page footnote.
- **Proposed:** Remove the DE clause from this page entirely. It is displaced here. The audit anchor belongs on the Audit Trail page and the Security page. Token Savings copy should stand on its own savings claim: `"Cache, compress and deduplicate to spend less per request."`

### H4. Policies "Flag" action description uses HTTP/header vocabulary
- **File:** `src/pages/Policies.tsx:106`
- **Current:** `"Forward the request, attach detection metadata to response headers."`
- **Why:** "Response headers" is HTTP implementation vocabulary. The canonical voice is "technical-plain" per Notion Narrative: name what happens in terms the user cares about, not the transport mechanism. Devon knows what headers are; Olivia does not; and even Devon cares about "what does this do to my agent's output" more than "where the metadata goes." This is a mechanism description, not an outcome description.
- **Proposed:** `"Allow the request through and log a security event. The detection result is visible in Security events and the audit trail."` [Anchored to Security PRD response-mode taxonomy: Flag = allow with annotation]

### H5. The same "Flag" issue appears on PII and Credential scanners
- **File:** `src/pages/Policies.tsx:141, 181`
- **Current (PII):** `"Forward as-is, attach detection metadata to response."`
- **Current (Credential):** `"Forward as-is; emit a security event for the audit trail."`
- **Why:** "Attach detection metadata to response" has the same header-mechanism problem as H4. The Credential scanner's version is actually better ("emit a security event for the audit trail") and should be the template for all three.
- **Proposed (PII):** `"Allow the request through and log a security event. PII is visible in Security events and the audit trail."` [Unanchored for PII specifics; CTO to review]

### H6. Models page quick-start uses "Constellation Gate API key" (name drift)
- **File:** `src/pages/Models.tsx:1248`
- **Current:** `"and authenticate with your Constellation Gate API key."`
- **Why:** Canonical product name is Constellation Gate AI. Dropping "AI" erodes the "security product that happens to be a gateway" frame. Per Gate-AI-personas.md dashboard audit section 3.
- **Proposed:** `"and authenticate with your Constellation Gate AI key."`

---

## MEDIUM — register drift

### M1. Guardrails subtitle has an em dash in a rendered string
- **File:** `src/pages/Guardrails.tsx:84`
- **Current:** `"Enforce spend, token, and request rate caps at the org, project, or key level. Limits run inline — no separate billing system to wire up."`
- **Why:** Em dash in user-facing string. No-em-dash rule is a hard constraint in CLAUDE.md. The em dash here is in the `<p>` element rendered in the browser.
- **Proposed:** `"Enforce spend, token, and request rate caps at the org, project, or key level. Limits run inline with no separate billing system to wire up."`

### M2. Conversations subtitle has an em dash in a rendered string
- **File:** `src/pages/Conversations.tsx:139`
- **Current:** `"A conversation is a chain of requests that share session context — agent runs, multi-turn chats, tool-calling loops. Click any row to see its message thread."`
- **Why:** Em dash in user-facing string. Same rule.
- **Proposed:** `"A conversation is a chain of requests that share session context: agent runs, multi-turn chats, tool-calling loops. Click any row to see its message thread."`

### M3. ApiKeys warning callout has em dash in rendered string
- **File:** `src/pages/ApiKeys.tsx:611`
- **Current:** `"Paste it into your secret manager or .env before closing. Once you close, we can't show it again — you'd need to rotate the key."`
- **Why:** Em dash in user-facing string.
- **Proposed:** `"Paste it into your secret manager or .env before closing. Once you close, we can't show it again. You'll need to rotate the key to get a new one."`

### M4. Models page subtitle has an em dash in a rendered string
- **File:** `src/pages/Models.tsx:798`
- **Current:** `"providers — capabilities, per-provider pricing, and code samples on every detail page."`
- **Why:** Em dash in a rendered `<p>` string (the route-to-N-models-across-N-providers subtitle).
- **Proposed:** `"Route to {modelCount} models across {providerCount} providers, with per-provider pricing and code samples on every detail page."`

### M5. Security events subtitle buries the key claim
- **File:** `src/pages/Security.tsx:583`
- **Current:** `"Every threat we caught on your traffic. Blocked, flagged, or redacted. Each event is anchored to a tamper-evident audit log."`
- **Why:** The register is correct. The ordering is not: "tamper-evident audit log" should not be the last clause and lowest-emphasis phrase in the subtitle. The Narrative page requires this language to be central. Also, "tamper-evident audit log" is weaker than the full required vocabulary ("anchored to Constellation's Digital Evidence layer"). This is a required-vocabulary gap.
- **Proposed:** `"Every injection, PII, and credential event your policies caught, anchored to Constellation's Digital Evidence layer. Blocked, flagged, or redacted."`

### M6. "Toxicity" appears in a code comment that describes user-visible behavior
- **File:** `src/pages/Requests.tsx:1831`
- **Current (comment):** `"every gateway request runs the same set of guardrails (prompt-injection, PII, toxicity, model allowlist, spend cap)."`
- **Why:** "Toxicity" and "model allowlist" and "spend cap" are not part of the canonical three-detector set (injection, PII, credential). The comment describes a five-check model but the UI renders three. This is not a user-facing string, but it names detectors that must not appear in future copy derived from this comment. Flagging so it gets corrected before it propagates.
- **Proposed comment:** `"every gateway request runs the canonical three inline scans (prompt-injection, PII, credential). The check state is driven by row.status + row.guardrailReason:"` [Not user-facing, but must be corrected]

### M7. Billing "Constellation Gate audit trail" drops "AI"
- **File:** `src/pages/Billing.tsx:91`
- **Current:** `"...a cryptographically verifiable audit trail anchored to Constellation's Digital Evidence layer."` — this portion is correct. But earlier in the same sentence: `"BYOK gateway plus a tamper-evident audit trail, no security pipeline."` The sentence opens without naming Gate AI at all.
- **Why:** The sentence never calls the product by name. A user reading only this card cannot confirm which product they're paying for. This is a low-severity name-drift variant; the full name should appear at least once in the plan description.
- **Proposed:** `"On Free, you get a BYOK gateway and a tamper-evident audit trail with no security pipeline. Upgrade to Pro for prompt-injection scans, PII redaction, and a cryptographically verifiable audit trail anchored to Constellation's Digital Evidence layer."` [Unanchored for exact plan scope; CTO to confirm]

### M8. KPI tile titles use title case inconsistently
- **File:** `src/pages/Dashboard.tsx:126,138,150,164`
- **Current:** `"Total Requests"`, `"Total Cost"`, `"Avg Latency"`, `"Total Tokens"`
- **Why:** These KPI eyebrows are rendered as `Eyebrow` components or `CompactKpi` titles. Title case is inconsistent with the sentence-case convention used everywhere else in the UI ("Events logged," "Verified rate," "Last anchor" in AuditTrail; "Active Now," "Conversations" in Conversations). The inconsistency is across-page. [Unanchored — flag for CTO on whether KPI eyebrows should follow sentence case or product uses title case intentionally]

### M9. Quick actions use title case for action labels
- **File:** `src/pages/Dashboard.tsx:525-528`
- **Current:** `"Rotate API Key"`, `"Upgrade to Pro"`, `"Review Security Events"`, `"Read Integration Guide"`
- **Why:** Same title-case inconsistency as M8. The verb-noun button convention used elsewhere ("Create limit," "Create key," "Invite member") is sentence case. These read as marketing callouts, not operator actions. [Unanchored — flag for CTO]

### M10. "Scan direction" helper text explains scanning in terms of perimeter, not user workflow
- **File:** `src/pages/Policies.tsx:124-126`
- **Current (PII):** `"Output scanning is on by default. Input scanning catches data leaving your perimeter, but agents often legitimately include user data in prompts."`
- **Why:** "Your perimeter" is a network-security / enterprise framing that the Narrative page explicitly does not use. The canonical ICP is a developer or agent operator. The concept is correct but the framing should use the agent's data flow, not the network perimeter metaphor.
- **Proposed:** `"Output scanning checks what the model sends back. Input scanning checks what goes into the model, though agents often legitimately include user data in prompts."` [Anchored to persona analysis: "Input vs. output scanning is a meaningful distinction for Devon. For Olivia it needs to read as 'check what goes to the AI' vs. 'check what the AI sends back'"]

---

## LOW — polish

### L1. Empty state "No audit events" has no next step
- **File:** `src/pages/AuditTrail.tsx:501-503`
- **Current:** `title="No audit events"` / `body="Requests, policy decisions, and limit checks will appear here as your workspace routes traffic."`
- **Why:** Body describes the trigger condition but gives no action. The user's next step is to route a request or adjust the active filter range. This is correct for a filtered empty state (where the fix is "change filters"), but as a zero-traffic empty state it needs a path forward.
- **Proposed:** Keep the existing body. Add: `"Start by routing a request through the gateway."` or surface a link to the API Keys page. [Unanchored for exact CTA — flag for CTO]

### L2. Empty state "No security events" is a dead end
- **File:** `src/pages/Security.tsx:1078-1079`
- **Current:** `title="No security events"` / `body="Prompt injection, PII, and credential leak events flagged by your policies will appear here."`
- **Why:** Correct explanation. No next action. If the user has no events because their policies are disabled, they should be pointed to Policies. If it's because no traffic has flowed, they should be pointed to API Keys.
- **Proposed:** `[unanchored — flag for CTO]` — The next step depends on the actual reason for emptiness. At minimum: append `"Check that your policies are enabled."` with a link to Policies.

### L3. "No keys to show" empty state is vague
- **File:** `src/pages/Activity.tsx:1392`
- **Current:** `title="No keys to show"`
- **Why:** When filtered, the user may not understand why keys are hidden. "No keys match this filter" is more specific.
- **Proposed:** `title="No keys match"` with body explaining what filter is active, or change to "No keys match this filter."

### L4. "No members" empty state body is generic
- **File:** `src/pages/Team.tsx:235-236`
- **Current:** `title="No members"` / `body="Workspace members and their roles will appear here."`
- **Why:** Correct, but no next action. This state should only appear when search/filter produces no matches; the body should say so.
- **Proposed:** `body="No members match your search. Try a different name or email."` [for filtered empty state] or surface an Invite button for the zero-member state.

### L5. TokenSavings KPI tiles show bare zeros with no empty-state framing
- **File:** `src/pages/TokenSavings.tsx:60-63`
- **Current:** `<KpiTile title="Total saved" value="0%" />` etc.
- **Why:** Per Gate-AI-personas.md: "She'll read this as 'this feature doesn't work,' which is the worst possible first impression." Zero is not an empty state. If caching is enabled and no traffic has flowed yet, the tile should say so explicitly, not show raw zeros.
- **Proposed:** Value should be `"—"` with a caption like `"No requests yet"` until the first real data point. [Unanchored for exact implementation — flag for CTO. Zero vs. dash is a product decision.]

### L6. AuditRecordDialog placeholder tabs say "Coming next" with no timeline
- **File:** `src/pages/AuditRecordDialog.tsx:150, 155`
- **Current:** `"Coming next"` (Merkle path and How it works tabs)
- **Why:** "Coming next" is fine for internal dev; it should not ship as user-visible copy. Users who click these tabs get no information about when or what to expect.
- **Proposed:** `"Merkle path verification is coming soon."` with a single sentence explaining what it will show. Or hide the tabs until the content is ready. [Unanchored — flag for CTO]

### L7. "Create Key" button label is title case on Dashboard; "Create key" elsewhere
- **File:** `src/pages/Dashboard.tsx:112`
- **Current:** `"Create Key"` (PageHeader button)
- **Why:** Inconsistent with the same action on ApiKeys (`"Create key"`) and every other action button in the product (sentence case). One character but a visible inconsistency between pages.
- **Proposed:** `"Create key"` to match ApiKeys.

### L8. "View All" and "Quick Actions" are title case on Dashboard
- **File:** `src/pages/Dashboard.tsx:444, 540`
- **Current:** `"View All"`, `"Quick Actions"`
- **Why:** Same sentence-case inconsistency. All other navigation labels and card titles use sentence case.
- **Proposed:** `"View all"`, `"Quick actions"`

### L9. "Recent Requests" card title is title case
- **File:** `src/pages/Dashboard.tsx:440`
- **Current:** `"Recent Requests"`
- **Why:** Matches the title-case cluster above. Other card titles across the product use sentence case or product-noun capitalization.
- **Proposed:** `"Recent requests"`

### L10. Settings "No passkeys registered yet" is a dead end
- **File:** `src/pages/Settings.tsx:264-266`
- **Current:** `"No passkeys registered yet."`
- **Why:** No action. The section directly above has an "Add a passkey" button. The empty-state message should repeat or point to that action.
- **Proposed:** `"No passkeys registered yet. Use the button above to add one."` or remove the sentence and let the empty visual speak for itself.

---

## Cross-page patterns

**Em dashes in rendered strings.** Hits: AuditTrail subtitle (H1), Guardrails subtitle (M1), Conversations subtitle (M2), ApiKeys key-created warning (M3), Models subtitle (M4). Five files, same fix: replace ` — ` with a colon, comma, or period. Do a global search for ` — ` and ` – ` in all JSX string literals before ship.

**"Public ledger" framing.** Hits: AuditTrail subtitle (H1), AuditRecordDialog verification banner (H2). Two files, same fix: replace "public ledger" with "Constellation's Digital Evidence layer."

**Title-case verb-noun buttons and section headers.** Hits: Dashboard "Create Key," "View All," "Quick Actions," "Recent Requests" (L7-L9). Likely more exist in pages not scanned. Convention is sentence case everywhere else. Establish one rule and sweep.

**Dead-end empty states (no next step).** Hits: AuditTrail (L1), Security (L2), Activity (L3), Team (L4), Settings (L10). Pattern: body explains why it's empty but never tells the user what to do. Every empty state needs one action or link.

---

## Forbidden-phrase scan summary

| Phrase | Files hit | Verdict |
|---|---|---|
| "platform" (Gate-noun) | None in user-facing strings | Pass |
| "enterprise-grade" | None | Pass |
| "industry-leading" / "best-in-class" | None | Pass |
| "blockchain" / "on-chain" / "Web3" | None (direct) | Pass |
| "public ledger" | AuditTrail.tsx:160, AuditRecordDialog.tsx:79 | FAIL — equivalent framing |
| "CISO-ready" / "SOC-integrated" | None | Pass |
| Em dash in rendered strings | 5 files (AuditTrail, Guardrails, Conversations, ApiKeys, Models) | FAIL |
| Product name drop ("Constellation Gate" without AI) | Models.tsx:1248, Billing.tsx (implicit) | FAIL |
| "toxicity" in guardrail description | Requests.tsx:1831 (comment only) | Watch — not yet user-facing |
| "Constellation DE" (unresolved abbrev.) | TokenSavings.tsx:49 | FAIL — not canonical |
