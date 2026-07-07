# Gateway Fixes — 2026-07-06

Large-file audit. Every source file over 1,000 lines, with split/refactor
tracking. Audit only so far — no edits made. Severity is refactor urgency,
not correctness (all files work today).

## Complete inventory — every file over 1,000 lines

Full sweep result (`find . -name '*.{ts,tsx,js,jsx,mjs,css,md,json}' -not node_modules`,
lines > 1000). 15 files total: 9 in-scope source, 6 out-of-scope.

| File | Lines | Class | In scope? |
| --- | --- | --- | --- |
| `package-lock.json` | 9056 | Auto-generated (npm) | No |
| `src/data/requests.ts` | 4144 | Source — mock data (quarantined) | Yes |
| `src/pages/Models.tsx` | 2634 | Source — page | Yes |
| `src/pages/requests/RequestDetailModal.tsx` | 2216 | Source — component | Yes |
| `docs/message-script.md` | 2143 | Doc — local-only session source | No |
| `src/pages/Conversations.tsx` | 1926 | Source — page | Yes |
| `.claude/skills/figma-design/EXAMPLES.md` | 1818 | Doc — vendored skill | No |
| `src/pages/Security.tsx` | 1769 | Source — page | Yes |
| `src/pages/Activity.tsx` | 1570 | Source — page | Yes |
| `.claude/skills/figma-design/SKILL.md` | 1227 | Doc — vendored skill | No |
| `src/pages/DashboardDefault.tsx` | 1088 | Source — page | Yes |
| `data-model.md` | 1089 | Doc — reference contract | No |
| `src/pages/Policies.tsx` | 1053 | Source — page | Yes |
| `design.md` | 1042 | Doc — reference contract | No |
| `src/pages/AuditRecordDialogMerkle.tsx` | 1024 | Source — component (DELETED: experimental, unrouted) | — |

Out-of-scope rationale: `package-lock.json` is generated; `docs/message-script.md`
and `.claude/skills/figma-design/*` are local-only / vendored; `data-model.md`
and `design.md` are reference contracts, not code. Line counts are a 2026-07-06
snapshot and drift as files change. The refactor tracking below covers only the
9 in-scope source files.

## Cross-cutting (highest leverage — do these first)

- [x] **Consolidate the duplicated syntax highlighter.** DONE (relocation).
  Moved `CodePanel` (+ its `tokenizeLine`, `CodeToken`, `KEYWORDS`) verbatim
  out of `DashboardDefault.tsx` into `src/components/ui/code-panel.tsx`, killing
  the page→page import (`Models` was importing a component from `DashboardDefault`)
  and getting the component into the UI layer. Repointed `Models.tsx` and
  `DashboardDefault.tsx` imports. Verified: tests 29/29, lint clean, and
  `CodePanel` renders correctly in-browser on `/setup-manual-default`.
  NOTE — the two tokenizers are intentionally left separate: Models' lang-aware
  `tokenize`→`CodeBlock` and Dashboard's single-pass `tokenizeLine`→`CodePanel`
  use different token models (`tone` vs `type`) and different class maps, so
  merging them changes rendered colors and is NOT covered by unit tests. That
  merge, if wanted, is a separate browser-verified task. Minor smell remaining:
  `paygConfigSnippet` (a string builder) still lives in `DashboardDefault` and is
  imported by `Models` — low priority.
- [x] **Extract shared range/spark/date logic.** DONE (scoped). Created
  `src/lib/range.ts` with the byte-identical shared primitives: types
  `PresetRange`/`Range`/`CustomRange`, `RANGE_OPTIONS`, `RANGE_SCALE`,
  `daysInRange`, `effectiveScale`. Repointed `Activity.tsx`, `Conversations.tsx`,
  and `Security.tsx` (Security keeps its local `EventsRange` alias and imports
  `PresetRange`/`CustomRange`/`RANGE_OPTIONS`). Verified: tsc 0, lint clean,
  tests 29/29, all three pages render in-browser with working range options +
  charts. NOTE — the spark/bucket helpers are NOT shared: Conversations has
  `sparkDates`/`distributeTotal`, Security has `buildSpark`/`normalizeSparkTo`,
  Activity has `getBucket*`/`getRange*`. Those are page-specific and stayed put;
  the audit's "spark" grouping was too broad.
- [x] **Move data literals out of page files.** DONE for the clearest offender:
  `MODELS` moved from `Models.tsx` → `src/data/models.ts` (see per-file item
  below). No other page carries a comparable data literal; reassess if one appears.
- [ ] (Low) `PageHeader` re-declared per page — project-wide pattern; a shared
  primitive would trim every page. Defer.

## Per-file

### High / Med-High

- [ ] **`src/pages/requests/RequestDetailModal.tsx`** (2216) — Med-High. Both v1
  and v2 modals live in-file behind `REQUEST_MODAL_VERSION="v2"` (v1 = 86–267).
  Retire the dead v1 path once v2 is locked; extract the finding-card cluster
  (`FindingCard`, `FindingSwitcherCard`, `PanelHeading`, `findingMatchOffset`,
  776+) to `src/pages/requests/findings/`.

### Medium

- [x] **`src/pages/Models.tsx`** (2634 → 1655) — DONE (data extraction). Moved the
  `MODELS` catalog + its types, config maps (`PROVIDER_LABELS`/`PROVIDER_VENDOR`/
  `CAPABILITY_META`/`CAPABILITY_ORDER`), and derived exports (`TOTAL_PROVIDERS`/
  `MODALITY_COUNTS`/`ModelOption`/`MODEL_OPTIONS`) into new `src/data/models.ts`
  (991 lines). `SetupManual.tsx` imports `MODEL_OPTIONS` from `@/data/models`;
  `PaygToolConfigCard` still from `@/pages/Models` (path kept stable). Formatters
  and view components stayed. Verified: tsc 0, lint 0 errors, tests 29/29, and
  in-browser (models list 24 rows, model detail pricing + provider table,
  setup-manual all clean). Remaining follow-up (separate): the tail highlighter /
  snippet builders could still move to `src/pages/models/code-snippets.ts`.
- [x] **`src/pages/Conversations.tsx`** (1926 → 721) — DONE (path A, 3 steps, now under 1000).
  Step 1: `src/pages/conversations/types.ts` (7 shared types) — also broke the old
  page↔data-module type cycle; repointed the page + 4 importers (conversations.ts,
  conversationDetail.ts, Dashboard.tsx, ConversationsTrace.tsx). Step 2: Request
  Trace cluster → `conversations/RequestTracePanel.tsx` (403 lines); shared
  `REDUCE_MOTION` → `src/lib/reduce-motion.ts`. Step 3: detail cluster
  (`ConversationDetailDialog` + `ConversationDetailBody` + KPI rail/tile + messages
  panel) → `conversations/ConversationDetail.tsx` (730 lines); repointed
  ConversationsTrace. No circular deps (detail cluster referenced no page-local
  helpers). Verified after each step: tsc 0, lint clean, tests 29/29, and
  in-browser — list renders, row→trace-page navigation works, full detail body
  (KPI rail + messages + trace timeline) renders on
  `/conversations-trace/cnv_7a3f9e2b`. Table section (~340 lines) left in the page;
  file is comfortably under 1000 without it.
- [x] **`src/pages/Security.tsx`** (1769 → 551) — DONE (2 steps, under 1000).
  Step 1: shared chart/spark math + detail/sort config (`eventsTotal`, `splitEventMix`,
  `buildSpark`, `buildEventsChartView`, `HERO_CHART_CONFIG`, `RANGE_DELTA_NOTE`,
  `DETECTION_CHECKS`, `TYPE_DETAILS`, `getEventDetail`, `EVENT_KEYS`, `eventSortValue`)
  → `src/pages/security/events-data.ts` (pure data, no JSX — the shared home that keeps
  the page and the events table from an import cycle). Step 2: `EventsTableSection` +
  the threat-event detail dialog (now file-local, unexported) → `src/pages/security/EventsTable.tsx`;
  confirmed zero page-stay refs, so no cycle. `ChartXAxisTick` + `HeroMetricCard` stayed
  in the page. Verified after each step: tsc 0, lint clean, tests 29/29, and in-browser
  (`/security` — hero + chart + 25 table rows + attack-category cards render; threat-detail
  dialog opens with DETECTION_CHECKS/TYPE_DETAILS content; 0 console errors). Commits
  `1cd350e` + `3686241`. data-model.md kept in sync.
- [x] **`src/pages/Activity.tsx`** (1570 → 914) — DONE (under 1000). Moved shared
  `Metric` + `METRIC_OPTIONS` to `src/pages/activity-data.ts`; extracted the trend
  cluster (`TrendCard`, `TrendBreakdownPanel`, trend consts, `DIMENSION_OPTIONS`) → `src/pages/activity/TrendCard.tsx`
  (490 lines); extracted the shared bucket/axis math + compact formatters
  (`getBucketCount`/`getBucketLabel`/`getRangeDates`/`getRangeLabels`/`BUCKET_COUNTS`,
  `fmtUsd`/`fmtInt`/`fmtTokens`) → `src/pages/activity/chart-helpers.ts` (181 lines),
  imported by both the page (KPI rail + top-by-axis) and TrendCard. Verified: tsc 0,
  lint clean, tests 29/29, and in-browser (trend chart bars + Tokens/Spend/dimension
  toggles + `$`/`K`/`M` formatters render). Note: first block cut was too greedy
  (pulled page-shared helpers); tsc caught it and the fix was the correct
  chart-helpers module boundary.
- [ ] **`src/pages/DashboardDefault.tsx`** (1088) — extract the inline highlighter
  (share with Models), `DownloadGateConnectDialog` (459), and `ConnectTabs` (882).

### Med-Low / Low

- [x] **`src/pages/Policies.tsx`** (1053 → 733) — DONE. Extracted the style maps,
  `PolicyConfig`/`PolicyState` types, `POLICIES`/`INITIAL_POLICIES` data, and free-tier
  copy → `src/pages/policies/config.ts` (342 lines); page keeps the components +
  `Policies({ variant })`. Verified: tsc 0, lint clean, tests 29/29, both `/policies`
  and `/policies-free` render. Note: the `ICON_COLOR`/`ACTION_*` maps use `design.md`
  semantic classes (e.g. `border-*-600`, `TYPE_META` colors), not raw values — moved
  verbatim, lint:design still green.
- [x] **`src/pages/AuditRecordDialogMerkle.tsx`** (1024) — DELETED (not refactored).
  Investigation showed this + `AuditTrailMerkle.tsx` were an experimental Merkle-tree
  audit design wired only to `/audit-trail-merkle` — a route with no sidebar link and
  no tier twins; the live `/audit-trail` uses the simpler `AuditRecordDialog.tsx` (161
  lines). Deleted both files, the App.tsx lazy import + route, and stale
  `data-model.md` entries (mermaid node, Merkle-variant subsection, and a stale claim
  that the live dialog had Merkle-path/How-it-works tabs). Verified: tsc 0, lint clean,
  tests 29/29, live `/audit-trail` renders.
- [ ] **`src/data/requests.ts`** (4144) — Low. Working as designed: ~86%
  (567–4119) is 5 `REQUEST_ROWS_*` data arrays, ~14% API; 24
  `SHARED_TRANSCRIPT_*` consts already dedupe. Optional: split the 5 range
  arrays into per-range files. Stays quarantined either way.

## Twin-file map (avoid wrong-surface edits)

- `Policies.tsx` is the single source; `PoliciesDefault`/`PoliciesFree` are thin
  re-exports (variant handled via internal `variant: "pro" | "free"` prop).
- `DashboardDefault.tsx` is NOT a twin of `Dashboard.tsx` — different pages
  despite the name. `DashboardFree` re-exports `Dashboard`, not `DashboardDefault`.
- `Activity.tsx` has no large duplicate (`ActivityDefault` = 114-line variant,
  `ActivityFree` = 6-line re-export).
