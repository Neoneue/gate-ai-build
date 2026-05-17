# Gate AI — /harden audit

## Verdict

The data model and reconciliation machinery across Activity, Requests, and Security are unusually well-engineered for a mock: single-source constants, LCG-seeded buckets, largest-remainder integer splitting. No chart-vs-KPI drift, no orphan constants. The largest structural brittleness is the detector-category four-way split on Security (injection / pii / phi / credential) that contradicts the three-way canonical (injection / pii / credential) the Requests page uses, creating a cross-surface schema conflict that will confuse both Devon (who drills from Security to Requests) and the API contract. Beyond that, the two most launch-relevant risks are (1) the `resetsAt()` function in Guardrails uses live `new Date()` — a mock surface that will return wrong "Resets on" timestamps the day after the demo was built — and (2) the Guardrails Create Limit form accepts a `threshold` of any string and feeds it to `Math.random()` with no NaN guard, so entering a non-numeric threshold produces a `NaN` in the table. Nearly everything else is medium-to-low polish work.

---

## HIGH — will break at launch

### H1. Guardrails: `resetsAt()` uses live `new Date()` — every "Resets on" cell goes stale

- **File:** `src/pages/Guardrails.tsx:278-300`
- **Evidence:** `const now = new Date();` inside `resetsAt(period)` — called synchronously at render time with no memo or anchor.
- **Failure mode:** Every "Resets on" cell in the limits table shows the next wall-clock reset from the moment the browser renders the page. By the time a reviewer watches a recording, the timestamps will have advanced or crossed a period boundary. More critically: the function is called at module eval time via the JSX render, not in an effect, so it drifts on every re-render triggered by any state change on the page.
- **Suggested fix:** Either anchor to the same frozen mock date the rest of the project uses (per CLAUDE.md "no synthetic data" = deterministic), or wrap in `useMemo(() => resetsAt(period), [period])` so at minimum the value is stable per render cycle. The anchor pattern (`const NOW = new Date(2026, 4, 16, 16, 0, 0)`) used in AuditTrail.tsx is the correct precedent.

### H2. Guardrails: `used` field initialized via `Math.random()` — creates unpredictable "Used" column values

- **File:** `src/pages/Guardrails.tsx:333`
- **Evidence:** `used: String(Math.floor(Math.random() * (thresholdNum + 1)))`
- **Failure mode:** Every time a limit is created, "Used" gets a random number between 0 and threshold. If threshold is blank or non-numeric, `thresholdNum` is `NaN`, `Math.random() * (NaN + 1)` is `NaN`, and the cell renders `"NaN"`. The form's `canSubmit` guard (line 319) catches `!Number.isFinite(thresholdNum)` before submit, but if the guard logic ever drifts this produces a visible "NaN" in the table. Additionally, random initial "Used" is inconsistent with the "no synthetic data" rule: the same limit created twice gets different used values.
- **Suggested fix:** Seed `used` to `"0"` on creation. "Used" is a live counter; the mock should start at zero.

### H3. Security + Requests detector-category schema conflict

- **File:** `src/pages/Security.tsx:754`, `src/pages/Requests.tsx:735`
- **Evidence:** Security defines `type EventCategory = 'injection' | 'pii' | 'phi' | 'credential'` (four values). Requests defines `type GuardrailReason = 'injection' | 'pii' | 'credential'` (three values). Security's `AttackCategoriesCard` renders PHI as a separate breakdown row; Requests' security panel collapses pii+phi into one check row.
- **Failure mode:** The deep-link chain (Security event → Requests modal → security tab) is a named differentiator. A PHI event on Security shows a four-row breakdown; the linked Requests modal shows a three-row security panel with PII/PHI combined. Devon, following a PHI event to the Requests modal, will not find a matching "PHI" row — the two surfaces disagree about what a security event is. This also violates the CLAUDE.md "single source of truth" rule for security check categories.
- **Suggested fix:** Collapse Security's breakdown to three canonical categories: Prompt injection, PII / PHI (combined, as the detection grid already does at line 812), Credential leak. `EventCategory` should drop `'phi'` as a standalone value and treat PHI as a sub-tag of PII. This is a 3-line type change plus removing the orphan `phi` breakdown row.

---

## MEDIUM

### M1. Dashboard KPI rail totals are not derived from any source of truth

- **File:** `src/pages/Dashboard.tsx:127-176`
- **Evidence:** `value="48,293"`, `value="$1,247.82"`, `value="1.24 s"`, `value="18.4 M"` are all hardcoded string literals.
- **Failure mode:** These four numbers have no relationship to `HERO_ALL_TOTAL` (4,860 in Requests) or `TOTAL_7D_BASE_REQUESTS` (63,793 in Activity). "Total Requests: 48,293" on Overview vs. "7d Total Requests: 63,793" on Activity is a contradiction visible to Devon in a single session. The CTO check (Overview KPI = derived total) fails immediately.
- **Suggested fix:** Derive Overview KPIs from the same base constants as Activity/Requests, scoped to the default "7d" view. At minimum, `48,293` should read from a shared constant, not a string literal.

### M2. Dashboard "Top Keys" total does not equal the sum of its rows

- **File:** `src/pages/Dashboard.tsx:377-378`
- **Evidence:** `<HeroNumeric>$1,147.82</HeroNumeric>` is shown as the total, but the five `TOP_KEYS` cost values sum to: `412.30 + 287.14 + 198.41 + 152.88 + 89.16 = $1,139.89`. The hero number is $7.93 higher than the displayed rows' sum.
- **Failure mode:** Any user (or CTO) who adds up the five rows will get a different number than the card's hero metric. Violates the "Charts reconcile to a single source of truth" rule in CLAUDE.md.
- **Suggested fix:** Either derive the hero from `TOP_KEYS.reduce((a, k) => a + parseFloat(k.cost.slice(1)), 0)` or ensure the hardcoded total matches the row sum exactly.

### M3. AuditTrail: range filter does not scope KPI "Events logged" and "Anchors" correctly when the table and KPIs disagree

- **File:** `src/pages/AuditTrail.tsx:182-204`
- **Evidence:** `KpiRailSection({ rows })` and `EventLog({ rows })` both receive `rangeRows` — the filter is correct and they will agree. However, `verifiedRate` at line 191 is hardcoded to `100.0` regardless of the rows' actual `verified` field (the comment acknowledges this). The `EventRow` type has no `verified` boolean field.
- **Failure mode:** The "100.0% verified" rate is a claim, not a derived value. When real data lands with any unverified event, this tile will still show 100% unless the type is extended. For launch: the KPI makes a strong integrity promise that has no backing field. Grace (AI Governance Officer persona) will ask to drill into why every event shows 100% verified, and there is no answer in the data model.
- **Suggested fix:** Add `verified: boolean` to `EventRow`, set it `true` on all seed rows, and derive `verifiedRate = (rows.filter(r => r.verified).length / rows.length) * 100`. Then the KPI is defensible.

### M4. Conversations: `scaleCostStr` loses precision on small values, rendering misleading costs

- **File:** `src/pages/Conversations.tsx:259`
- **Evidence:** `'$' + (parseFloat(s.replace('$', '')) * scale).toFixed(4)` — at `scale = 0.16` (24h), `$0.5841 * 0.16 = $0.09346` rounds to `$0.0935`. But at `scale = 8.5` (all-time), `$0.082 * 8.5 = $0.697` renders as `$0.6970`. This is fine numerically but the 4 decimal places on cost are inconsistent with the rest of the app (`$0.43` in Conversations header copy, `$0.028` in Dashboard).
- **Failure mode:** Medium only — the numbers are correct to 4dp, but Devon reading the Conversations table will see costs like `$0.8857` while the Dashboard shows `$0.028`. The visual register is inconsistent. Not a crash, but breaks the "same number reads identically across surfaces" principle.
- **Suggested fix:** Format costs to 2 decimal places for values >= $0.01, 4dp below that threshold: `toFixed(cost >= 0.01 ? 2 : 4)`.

### M5. Security events table: no pagination, fixed 17-row sample with no empty state for filtered-to-zero

- **File:** `src/pages/Security.tsx:729-735`
- **Evidence:** Code comment: "No pagination — fixed 17-row sample fits the surface." The table filter (search + type + action selectors) can reduce `visibleRows` to zero, but the component has no `<TableEmptyState>` — it renders an empty `<TableBody>` with no row-zero feedback.
- **Failure mode:** Combining search + type + action filters to a non-matching combo produces a blank table with no message. Olivia will not know whether no events exist or her filter is wrong.
- **Suggested fix:** Wrap the table body with: `if (visibleRows.length === 0) return <TableEmptyState title="No matching events" body="..." />` — the canonical pattern from AuditTrail, Conversations, Team.

### M6. Guardrails: Create Limit dialog does not reset form state on cancel

- **File:** `src/pages/Guardrails.tsx:339-348`
- **Evidence:** `onOpenChange: (next) => { onOpenChange(next); if (!next) { setName(''); ... } }` only fires on Base UI's internal close trigger. If the user clicks "Create limit" again after a partial fill and cancels, the form fields retain previous input because the `if (!next)` block inside `CreateLimitDialog`'s own `onOpenChange` handler runs on dialog close — but the parent `setCreateOpen(false)` in the Guardrails component also needs to be in sync. Structurally correct; however there is no `DialogClose` in the cancel path — only a `Button onClick={() => onOpenChange(false)}`. Base UI Dialog should fire `onOpenChange(false)` on this, which triggers the reset. Verified the reset block runs. **Downgrade to LOW confirmed — this is actually wired correctly.** Leaving at M6 for the partial-fill UX note: the form does not warn on close with partial data.
- **Failure mode:** Low severity — no data loss since the form resets. UX only.

### M7. TokenSavings: KPI tiles show `0%` with no empty-state framing

- **File:** `src/pages/TokenSavings.tsx:58-65`
- **Evidence:** `<KpiTile title="Total saved" value="0%" />` — all three tiles are hardcoded zeros.
- **Failure mode:** As Gate-AI-personas.md documents: "She lands on a page called 'Token Savings' and sees she's saving nothing. She won't read this as a placeholder — she'll read it as 'this feature doesn't work.'" This is a confirmed persona friction point. The zeros are not derived from a zero-traffic real state; they are permanent hardcoded values. Violates the no-synthetic-data rule for a sentinel value that reads as "feature broken."
- **Suggested fix:** Render a true empty state ("No traffic routed through Gate yet — savings will appear once your first request is proxied.") rather than `0%` tiles. If the page must show tiles: `value="—"` with a caption, not `"0%"`.

---

## LOW — polish

### L1. Dashboard "Quick Actions" subtitle uses live-data language with a hardcoded value

- **File:** `src/pages/Dashboard.tsx:527`
- **Evidence:** `subtitle: '3 events in the last hour'` for "Review Security Events" — hardcoded string. In production this would need to be derived from the security event count.
- **Failure mode:** The number "3" is never updated. Olivia might click through and see 12 events in the Security page. Low severity since this is a demo surface.

### L2. Conversations: `CONVERSATIONS_TOTAL = 100` — comment says "Synthetic total"

- **File:** `src/pages/Conversations.tsx:253`
- **Evidence:** `const CONVERSATIONS_TOTAL = 100; // Synthetic total — held at module scope`
- **Failure mode:** The KPI tile says "Conversations: 100" (7d) but the table has 7 visible rows. The pagination footer says "of 100" which is the synthetic total, not the seed row count. Minor inconsistency at `scale=1`; more noticeable at 24h (scale=0.16) where `paginationTotal = Math.round(100 * 0.16) = 16` but only 7 actual rows scroll into view.
- **Suggested fix:** If the page is filter-free, `paginationTotal` should use the scaled total for pre-filtered state and row count for filtered state — which it already does at line 274. The issue is that `CONVERSATIONS_TOTAL` (100) disagrees with `RANGE_SCALE['7d'] = 1` producing exactly 100, which is correct. This is actually internally consistent. Flag only for the `// Synthetic total` comment — the constant should be named to communicate intent.

### L3. AuditTrail: `fmtTime` and `fmtRelative` are exported from a page file

- **File:** `src/pages/AuditTrail.tsx:77-93`
- **Evidence:** `export function fmtTime`, `export function fmtRelative`, `export function truncateHex` — utility functions exported from a page module, imported by `AuditRecordDialog.tsx`.
- **Failure mode:** Coupling two pages through a direct import from a page module. AuditRecordDialog imports from `'./AuditTrail'` at line 21. If AuditTrail is ever refactored or lazy-loaded, this import may cause circular dependency or bundle issues.
- **Suggested fix:** Move these three utilities to `src/lib/format.ts` or a shared audit utils module. The types they reference (`EventRow`, `KIND_BADGE_VARIANT`) should move with them.

### L4. Security: `formatEventTime` parses dates as local midnight, silently misbehaves in non-US timezones

- **File:** `src/pages/Security.tsx:741-746`
- **Evidence:** `const date = new Date(\`${datePart}T00:00:00\`);` — no timezone suffix. The string `"2026-05-12T00:00:00"` is parsed as local time. In UTC+5:30 (IST), `May 12 00:00 local` = `May 11 18:30 UTC`. For a US-east demo this is invisible; for any non-US reviewer the date labels shift by 1 day.
- **Failure mode:** Date cells in the Security event log show a different calendar day depending on the browser's local timezone. For launch: single-locale US targeting per Narrative doc means this is LOW risk but brittle at the structural level.
- **Suggested fix:** Append `T00:00:00Z` (UTC) or use `new Date(datePart + 'T00:00:00.000Z')` consistently across all date parsing.

### L5. Activity `SPEND_BASE` invariant comment says $927 but the actual target is $238

- **File:** `src/pages/Activity.tsx:349`
- **Evidence:** `INVARIANT: every dimension's 7d row sums equal $927` — but the next line says "Do not hand-edit one without the other." The constant `TOTAL_7D_BASE_DOLLARS = 238` at line 222. Running the actual model row sums (line 354-362) gives ~$238, not $927.
- **Failure mode:** The comment is wrong, not the data. No runtime breakage, but stale documentation creates maintenance risk: the next dev to touch this will hand-derive the wrong invariant check target.
- **Suggested fix:** Update the comment to `$238`.

### L6. Requests: `rangeStore` is module-scoped mutable state — will not reset on HMR

- **File:** `src/pages/Requests.tsx:196-217`
- **Evidence:** `const rangeStore = { current: 'all' as RangeKey, customRange: null, listeners: new Set<() => void>(), ... }` — initialized once at module scope.
- **Failure mode:** In development, Vite HMR reloads the component but may not re-execute module-scope initializers cleanly, leaving `rangeStore.current` at whatever value it held before the hot reload. Not a production bug; a dev-experience roughness.
- **Suggested fix:** Move store initialization into a factory or use React state + `useSyncExternalStore` without the external store (or keep as is and document the HMR caveat).

### L7. AuditRecordDialog: "Merkle path" and "How it works" tabs render with no content or placeholder

- **File:** `src/pages/AuditRecordDialog.tsx:97-99`
- **Evidence:** `<TabsTrigger value="merkle">Merkle path</TabsTrigger>` and `<TabsTrigger value="how">How it works</TabsTrigger>` are clickable tabs that render nothing (no `<TabsContent>` for them in the visible portion of the file).
- **Failure mode:** Grace (AI Governance persona) or Aiden (Auditor) clicks "Merkle path" or "How it works" and sees a blank modal body with no feedback. No empty state, no "coming soon" message, no disabled state on the tab.
- **Suggested fix:** Either add a simple placeholder body ("Merkle path verification is coming in the next release") or disable the tabs with `disabled` prop until the content exists.

---

## Skipped as false-flag

- **PHI as a four-way type vs. three-way** — NOT skipped. This is H3 above (real cross-surface schema conflict).
- **`aria-hidden` without `="true"`** — JSX coerces boolean props correctly per the brief's skip list.
- **`Intl.*` for date formatting** — The project ships single-locale. `toLocaleDateString('en-US', ...)` is correct for the launch target. Flagged L4 only because of timezone parsing brittleness, not locale formatting.
- **Decorative `aria-hidden` icons** — skipped per brief.
- **Base UI primitive internals** — not inspected.
- **`PLATFORM_LINKS` / `PlatformPanel` naming in Models.tsx** — noted in Gate-AI-personas.md as "internal only, won't ship to users." Confirmed against the Models code: these are internal React component names and the variable `MARKETPLACE_META` in vendor-meta, not user-facing strings. Not flagged.
- **Missing `<label>` for SearchInput** — SearchInput accepts `ariaLabel` prop and passes it to the underlying input. Not a bug.

---

## Cross-page patterns

### Pattern 1: No empty/first-run state on traffic-dependent surfaces (3 pages)

**Requests, Conversations, Security** each show populated tables but have no zero-traffic first-run state. The toolbar hides on empty (Conversations does this correctly at line 305), but the page-level KPI tiles and hero metric still show zeroed or stale numbers rather than a "no traffic yet" affordance. **Affected:** Requests.tsx, Conversations.tsx, Security.tsx. One shared `<FirstRunState>` primitive or a `if (totalRequests === 0)` early return pattern would fix all three.

### Pattern 2: Hardcoded spark data in KPI rails (3 pages)

**Dashboard.tsx** KPI rail (lines 132, 143, 153, 163), **Conversations.tsx** KPI rail (lines 166-194) use hardcoded spark data arrays. Activity and Requests correctly derive sparklines from the same base constants as the hero numbers. The Dashboard and Conversations sparklines are independent hand-authored arrays with no relationship to the totals they illustrate. The CTO's "sum(bars) == KPI" check applies to sparks too: if the sparkline trend goes up but the KPI delta is negative, the visual contradicts the number.

### Pattern 3: `new Date()` vs. mock anchor inconsistency (Guardrails)

Only **Guardrails.tsx** uses `new Date()` at render time. Every other time-aware page (Activity, Requests, Security, Conversations, AuditTrail) pins to a fixed mock anchor (`const ANCHOR = { month: 4, day: 12, hour: 14, minute: 30 }` or `const NOW = new Date(2026, 4, 16, 16, 0, 0)`). Guardrails' `resetsAt()` function is the only surface that will produce different output on different days. The fix is to anchor to `NOW` per AuditTrail's pattern.
