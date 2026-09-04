# UI Changelog: 2026-08-28

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-8-27.md`](./changelog-8-27.md)

---

## Conventions

### Nav items can hide per workspace variant `0bf830e`

`buildVariantSections` (`src/layouts/nav-sections.ts`) previously supported
only `LOCKED_IN_FREE` (item rendered as an inert lock affordance). New
`HIDDEN_IN_FREE` set + `hiddenIds` param removes an item from that variant's
sidebar entirely, and drops any group left empty. First user: Teams, which
the PRD scopes to Pro and Enterprise, so the Free workspace shows no Teams
row at all rather than a locked one.

## Components

### MultiSelect options carry an optional description line `0bf830e`

`MultiSelectOption` (`src/components/ui/multi-select.tsx`) gains
`description?: string` — a secondary line under the label, and the search
box now matches label + description. Backward compatible; existing call
sites (AuditTrail filters) render unchanged. First user: the Teams
add-members picker, where a member already placed on another team shows
`Currently on <Team>` so the move is visible before confirming.

### SettingsRow title widens to ReactNode `0bf830e`

`src/components/ui/settings-row.tsx`: `title` was `string`, now `ReactNode`,
and `subtitle` becomes optional. No existing call site moved; needed by the
Teams budget summary rows.

## Sections

### Teams workspace pages cloned from staging `0bf830e`

New WORKSPACE nav item "Teams" (`Building2`, between Team and Billing) and
four routes: `/teams` (list), `/teams/:teamId` (detail), plus `-default`
twins for both. Cloned 1:1 from the official staging build
(`gate-v2.12.0-rc.5`) captured live 2026-08-28, then extended per the
org-team-hierarchy PRD (AG-514..518).

- **List** (`src/pages/Teams.tsx`): header with 7D/30D/90D + Custom range
  (scaffold-only, page-local — the shared range helper has no 90D), Create
  team, org-budget meter card, sortable table Team | Members | Keys |
  Manager | Spend | Budget | row-action menu (Rename/Delete, disabled on
  the Default team).
- **Detail** (`src/pages/TeamDetail.tsx` + `src/pages/teams/`): back link,
  five tabs. Usage: Total spend + Requests KPIs, Spend by member, Spend by
  model. Members: role Select derived from a single `managerId` (promoting
  a member demotes the previous manager by construction). Keys, Budget
  (meter + summary incl. block threshold on hard budgets), Security: five
  populated cards (findings summary linking to /security, By outcome badge
  rows, By category, By pipeline stage, By member) on Pro; the Default twin
  keeps the "No guardrail activity" empty state.
- **Dialogs** (`src/pages/teams/dialogs.tsx`): create, rename, delete
  (folds members/keys into Default), org/team budget (window presets
  Per 5 hours / Weekly / Monthly, Soft/Hard enforcement, warn threshold,
  block threshold on Hard with warn <= block enforced inline), add members
  (moves a member between teams — one team per user), add keys (revoked
  keys filtered at the data source).
- **Data** (`src/data/teams.ts`): three-team seed (Default / Platform /
  Design) + org budget; every number is a group-by over `MEMBER_ROWS`,
  `API_KEY_SEED_ROWS`, and activity-data, so KPIs, tables, and budget bars
  reconcile exactly (Platform $216.74 everywhere; org bar = sum of teams;
  security identities hold: allowed = checks − findings, stages sum to
  total). Helpers `teamRole`, `withManager`, `moveMembersToTeam` own the
  role/movement semantics so pages don't re-implement them.

Known scaffold gaps are tracked in `docs/teams-audit.md` (local): P1 items
(manager role, move semantics, block threshold, Spend-by-member rename) are
done in this hash; P2/P3 (manager-scoped view, prompt-visibility setting,
budget alerts, budget-block error state, Enterprise forced settings) are
open.
