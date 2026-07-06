# UI Changelog: 2026-07-06

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-6-26.md`](./changelog-6-26.md)

---

## Sections

### Rename Requests to Messages and regroup sidebar `c5553b2`

**`src/layouts/nav-sections.ts`, `src/pages/Requests.tsx`**

- Renamed the `requests` nav item label `Requests` → `Messages` and swapped its icon `ArrowLeftRight` → `Mail` to match the updated sidenav.
- Restructured `SIDEBAR_SECTIONS` from the old (ungrouped) / Gateway / Security / Audit / Workspace Admin grouping into **Monitor** (Messages, Conversations, Security Events, Audit Trail) / **Manage** (Policies, Limits, Token Savings) / **Gateway** (Models) / **Workspace** (Activity, Team, Billing, API Keys, Settings), with Overview ungrouped at top.
- Renamed sidebar labels `Events` → `Security Events` and `Workspace Admin` → `Workspace`.
- Page copy (shared `Requests.tsx`, so Pro + Free): `PageTitle` `Requests` → `Messages`, table `SectionTitle` `Recent requests` → `Recent messages`.
- Default workspace keeps its `Requests` page body verbatim (`RequestsDefault.tsx` untouched); `buildVariantSections` gained an optional `labelOverrides` seam but the nav label now reads `Messages` on all tiers per the new sidenav.
