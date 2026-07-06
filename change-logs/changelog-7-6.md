# UI Changelog: 2026-07-06

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-6-26.md`](./changelog-6-26.md)

---

## Conventions

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

## Sections

### Rename Requests to Messages and regroup sidebar `c5553b2`

**`src/layouts/nav-sections.ts`, `src/pages/Requests.tsx`**

- Renamed the `requests` nav item label `Requests` → `Messages` and swapped its icon `ArrowLeftRight` → `Mail` to match the updated sidenav.
- Restructured `SIDEBAR_SECTIONS` from the old (ungrouped) / Gateway / Security / Audit / Workspace Admin grouping into **Monitor** (Messages, Conversations, Security Events, Audit Trail) / **Manage** (Policies, Limits, Token Savings) / **Gateway** (Models) / **Workspace** (Activity, Team, Billing, API Keys, Settings), with Overview ungrouped at top.
- Renamed sidebar labels `Events` → `Security Events` and `Workspace Admin` → `Workspace`.
- Page copy (shared `Requests.tsx`, so Pro + Free): `PageTitle` `Requests` → `Messages`, table `SectionTitle` `Recent requests` → `Recent messages`.
- Default workspace keeps its `Requests` page body verbatim (`RequestsDefault.tsx` untouched); `buildVariantSections` gained an optional `labelOverrides` seam but the nav label now reads `Messages` on all tiers per the new sidenav.
