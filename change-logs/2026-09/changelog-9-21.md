# UI Changelog: 2026-09-21

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-9-20.md`](./changelog-9-20.md)

---

## Audits

- [`audits/2026-09/audit-9-21.md`](../../audits/2026-09/audit-9-21.md):
  test-smoke after applying seven of the eight remaining react-best-practices
  LOWs (rbp-3, 4, 6, 8, 9, 10, 13); rbp-12 reverted, the React Compiler
  lint rejected the hoist. Clean. Audit method reshaped: rule slug
  per item, day Summary, opinion scale, Patterns tail, portable template,
  600-line split rule.

## Sections & surfaces

### Limits, Settings and Teams copy grounded in the PRDs (`pages/Limits.tsx`, `pages/LimitsFree.tsx`, `pages/Upgrade.tsx`, `pages/Settings.tsx`, `pages/TeamDetailEnterprise.tsx`, `pages/teams/dialogs.tsx`) · [f34ca3d]

- Before: Limits intro "Enforce spend, token, and request rate caps at the
  org, project, or key level. Limits run inline with no separate billing
  system to wire up."; Create-limit description "Block messages that exceed
  the threshold (returns 429)." and block-mode hint "Messages that exceed
  the threshold are blocked (returns 429)."; Settings email helper "Verified
  at sign-in; changes require identity-provider re-verification."; default
  team callout "The default team can't be renamed or deleted. Members and
  keys removed from other teams land here."; Add members "Only existing org
  members can be added, and their keys move with them. This doesn't send
  invites."
- After: intro "Cap spend, tokens, or requests for the whole org, a team, or
  a single key, and choose whether crossing a cap blocks or only notifies."
  (Gateway PRD usage limits + H2 budgets; project scope and request rate
  were unsupported); description "Cap spend, tokens, or requests on any
  scope."; hint "Requests over the cap are refused."; email helper removed
  (Accounts PRD: Cognito email + password, no IdP re-verification);
  callout "Your org's default team. People and keys removed from other
  teams land here."; Add members "Pick people already in your org. Only
  their new traffic counts here; past requests stay with their old team."
  (H2 PRD 8.1 reassignment). Found by `npm run lint:copy` (new, opt-in Jev
  copy lint, e7553bb); truth-checked against Notion by hand.

### Enterprise twins: Summary card on Token Savings, shared titles on Token Savings and Policies (`pages/TokenSavingsEnterprise.tsx`, `pages/PoliciesEnterprise.tsx`) · [1d2de90]

- Before: the Enterprise Token Savings twin was the only one without the
  Summary section; it and Policies were titled "My token savings" / "My
  policies" with "Your ..." subtitles while every other twin says "Token
  savings" / "Policies".
- After: `SummaryCard` sits between the KPI rail and Savings options, fed by
  `summaryFor(range, customRange, { plan: "pro" })` so the Overview range
  picker drives it and the user's own switches do not. Both titles match
  their siblings; subtitles open with the shared sentence and keep the
  Enterprise-only admin-lock sentence.

### Token Savings breakdown: four categories plus All others (`pages/token-savings-summary.ts`) · [48f13d7]

- Before: the gateway's "Methods, ranked" top three (Deferred tool
  definitions, Boost recoverable elide, Tool output compaction: grep) plus
  "All others" at 83.1 / 2.4 / 1.9 / 12.6.
- After: Tool compression 70.0, Output compaction 13.0, Deduplication 9.0,
  Text trimming 5.0, All others 3.0 (five rows, `BREAKDOWN_MAX_ROWS` 4 to
  5). Weights are an assumed distribution until the gateway supplies real
  shares; the header comment says so. Renamed from Tool schemas and the
  catch-all re-added the same day.

### Animated icons read one reduced-motion constant, plus six small lookups (`components/ui/*.tsx`, `data/teams.ts`, `data/conversationDetail.ts`, others) · [65494e2]

- rbp-3: twelve icons import `REDUCE_MOTION` instead of querying
  `matchMedia` on mount. rbp-4/9/13: stable keys in `field.tsx`,
  `ConversationDetail.tsx`, `RequestDetailBody.tsx`. rbp-6/8: provider
  lookup Map and a min loop in Models and Conversations. rbp-10:
  `getConversationRequests` memoised per conversation. rbp-12 skipped. No visual change.
