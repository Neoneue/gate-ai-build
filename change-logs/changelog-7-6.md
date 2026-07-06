# UI Changelog: 2026-07-06

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-6-26.md`](./changelog-6-26.md)

---

## Conventions

### Request-data optimization: transcript dedup + body split `e9a251d` `9de4175`

**`src/data/requests.ts`, `src/data/request-bodies.ts` (new), `src/data/conversationDetail.ts`, `src/pages/requests/{types.ts,RequestDetailModal.tsx}`**

Zero visual change. The eager `requests` data chunk carried every captured transcript inline and loaded on first paint of every page. Two phases, each proven byte-identical via sha256 baseline harnesses:

- Phase 1 (`e9a251d`): hoisted the 6 groups of duplicated >2KB string literals into `SHARED_TRANSCRIPT_*` consts. Chunk 706 → 557 kB min.
- Phase 2 (`9de4175`): moved the 6 heavy per-row fields (`userMessage`, `assistantResponse`, `requestBodyRaw`, `toolArgs`, `toolResult`, `errorBody`) off `RequestRow` into `src/data/request-bodies.ts`, keyed by `requestRowId`. Detail surfaces read via `getRequestBody(row)`. The bodies module is imported only by the request modal/findings page and the conversation trace, so it bundles as its own on-demand chunk (433 kB). Eager chunk now **125 kB min / 25 kB gzip** (was 706/145). `finding.evidence` stays eager — Security's `getEventFindingCopy` returns it.
- Authoring rule going forward: new heavy message bodies go in `request-bodies.ts` (or reference a `SHARED_TRANSCRIPT_*` const), never inline on the row.

### Requests.tsx split into `src/pages/requests/` modules `4ede243`

**`src/pages/Requests.tsx`, `src/pages/requests/*`, `src/pages/RequestsFindings.tsx`**

Zero visual change — a five-slice mechanical split of the 4,006-line monolith (`e0c4211`, `0e8970a`, `1831acf`, `b7b32c7`, `4ede243`). Where Requests page code now lives:

- `requests/types.ts` — the 9 shared types (`RequestRow`, `RangeKey`, `HeroView`, guardrail/check unions). `Requests.tsx` still re-exports `RequestRow` for external importers.
- `requests/data.ts` — pure helpers: sort keys, `RESPONSE_BADGE` / `GUARDRAIL_BADGE` variant maps, `MODEL_FILTER_OPTIONS`, `RANGE_OPTIONS`, `RANGE_ROWS`, `responseLabel` / `responseVariant`, `VENDOR_ENDPOINT`.
- `requests/range-store.ts` — module-scoped `rangeStore` + `useRange` / `useCustomRange` (Hero ↔ Table shared state; kept as one unit).
- `requests/hero-data.ts` — seeded bucket generator, `HERO_*` constants, `HERO_VIEWS`, `buildCustomHeroView`.
- `requests/HeroMetric.tsx` — `HeroMetricCard` + chart internals (components only, per `react-refresh/only-export-components`).
- `requests/RequestsTable.tsx` — `RequestsTableSection` (toolbar, sortable table, filters modal, pagination, detail-dialog mount).
- `requests/RequestDetailModal.tsx` — V1 dialog, `REQUEST_MODAL_VERSION` toggle, `RequestDetailDialogV2`, `RequestDetailBodyV2` + all findings/security panels. `RequestsFindings.tsx` now imports `RequestDetailBodyV2` from here directly (Biome `noBarrelFile` bans a value re-export through `Requests.tsx`).
- `Requests.tsx` — 122-line page shell: `Requests()` + `PageHeader` only.

### Split oversized page files into focused modules `1f70ba5`

**`src/pages/Models.tsx`, `Conversations.tsx`, `Activity.tsx` + new `src/data/models.ts`, `src/pages/conversations/`, `src/pages/activity/`, `src/lib/range.ts`, `src/lib/reduce-motion.ts`, `src/components/ui/code-panel.tsx`**

- Continues the module-split convention (`4ede243`). No behavior change; tsc / lint / tests (29) / browser verified at each step.
- **Models** 2634 → 1655: the `MODELS` catalog + types + config maps + `MODEL_OPTIONS` → `src/data/models.ts`.
- **Conversations** 1926 → 721: shared types → `conversations/types.ts` (breaks the page↔data-module type cycle), request trace → `conversations/RequestTracePanel.tsx`, detail dialog/body → `conversations/ConversationDetail.tsx`.
- **Activity** 1570 → 914: trend chart → `activity/TrendCard.tsx`, shared bucket/axis math + compact number formatters → `activity/chart-helpers.ts`, `Metric`/`METRIC_OPTIONS` → `activity-data.ts`.
- **Shared**: `lib/range.ts` (range types + scale shared by Activity/Conversations/Security), `lib/reduce-motion.ts`, and `CodePanel` relocated out of `DashboardDefault.tsx` → `components/ui/code-panel.tsx`.

### Extract Policies config/data to `policies/config.ts` `4bbe47a`

**`src/pages/Policies.tsx`, new `src/pages/policies/config.ts`**

- Continues the module-split convention. Moved the title-icon color map + per-action style maps, the `PolicyConfig`/`PolicyState` types, the `POLICIES` catalog, `INITIAL_POLICIES` seed, and the free-tier copy → `src/pages/policies/config.ts`. The page keeps the components + `Policies({ variant })`. 1053 → 733. tsc / lint / tests / both variants verified.

### Remove experimental Merkle audit variant `4bbe47a`

**Deleted `src/pages/AuditRecordDialogMerkle.tsx`, `src/pages/AuditTrailMerkle.tsx`; `src/App.tsx`, `src/data/audit-trail.ts`, `README.md`, `data-model.md`**

- The Merkle-tree audit design was wired only to `/audit-trail-merkle` — a route with no sidebar link and no tier twins, never shipped. Removed both files, the lazy import + route, and stale doc entries (mermaid node, Merkle-variant section, README route row, and a stale claim that the live `AuditRecordDialog` had Merkle-path/How-it-works tabs). The live `/audit-trail` (which uses `AuditRecordDialog`) is unaffected.

## Sections

### Rename Requests to Messages and regroup sidebar `c5553b2`

**`src/layouts/nav-sections.ts`, `src/pages/Requests.tsx`**

- Renamed the `requests` nav item label `Requests` → `Messages` and swapped its icon `ArrowLeftRight` → `Mail` to match the updated sidenav.
- Restructured `SIDEBAR_SECTIONS` from the old (ungrouped) / Gateway / Security / Audit / Workspace Admin grouping into **Monitor** (Messages, Conversations, Security Events, Audit Trail) / **Manage** (Policies, Limits, Token Savings) / **Gateway** (Models) / **Workspace** (Activity, Team, Billing, API Keys, Settings), with Overview ungrouped at top.
- Renamed sidebar labels `Events` → `Security Events` and `Workspace Admin` → `Workspace`.
- Page copy (shared `Requests.tsx`, so Pro + Free): `PageTitle` `Requests` → `Messages`, table `SectionTitle` `Recent requests` → `Recent messages`.
- Default workspace keeps its `Requests` page body verbatim (`RequestsDefault.tsx` untouched); `buildVariantSections` gained an optional `labelOverrides` seam but the nav label now reads `Messages` on all tiers per the new sidenav. *(Superseded same day by `5147cab` — Default matches Free/Pro after all.)*

### Complete the Messages copy rename across all tiers `5147cab` `2fc67e7`

**`src/pages/RequestsFindings.tsx`, `src/pages/RequestsDefault.tsx`, `src/pages/requests/{hero-data.ts,RequestsTable.tsx}`**

- Findings page back breadcrumb `Requests` → `Messages` (`5147cab`).
- Default page now matches Free/Pro (`5147cab`): title + overview card `Messages`, `Recent messages`, empty states `No messages yet` / `No messages`, body `Individual messages routed through the gateway will appear here.`
- Pro/Free label tier (`2fc67e7`): hero eyebrow `REQUESTS` → `MESSAGES`, chart bucket labels `Requests/hr|6h|15m` → `Messages/*`, search `Search messages` / `Search message…`, table empty state and row `Inspect … message to …` aria-label.

### Inner card title removed on all three Messages pages `842c717`

**`src/pages/RequestsDefault.tsx`, `src/pages/requests/HeroMetric.tsx`**

- Dropped the redundant in-card label under the `Overview` section title: the `CardHeader`/`CardTitle` (`Messages`) on the Default page and the `MESSAGES` `Eyebrow` inside the Pro/Free hero card. The section title above the card carries the label (per the titles-above-card convention).

### Routes renamed `/requests*` → `/messages*` `8b3d78c`

**`src/App.tsx`, `src/lib/plan.ts`, `src/layouts/nav-sections.ts`, deep-link call sites**

- `/requests` → `/messages`, `/requests-free` → `/messages-free`, `/requests-default` → `/messages-default`, `/requests-findings/:requestId` → `/messages-findings/:requestId`.
- Updated every deep link: nav `pageId`, plan twin sets, Dashboard `View all →`, findings breadcrumb `navigate`, Conversations per-step View Request, table row hrefs.
- File names and code symbols (`Requests.tsx`, `RequestRow`, `requestRowId`, …) keep the request terminology — UI term and URLs are `messages`, code stays `request` (same pattern as fingerprint/anchor).
