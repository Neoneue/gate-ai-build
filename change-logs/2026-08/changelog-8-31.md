# UI Changelog: 2026-08-31

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-8-28.md`](./changelog-8-28.md)

---

## Conventions

### Manager role is per-membership; co-managers allowed `8f3da8e`

Before: a team stored a single `managerId`, and promoting a member silently
demoted the previous manager. After: `TeamRow.managerIds: string[]` mirrors
the shipped schema (`memberships.team_role`, migration 170): assigning the
manager role never demotes anyone else, demoting removes only the addressed
member, and moving someone off a team resets their role. The list's Manager
column shows the first manager via `teamManagerName()` (best-effort single
name, matching the production roll-up). Where: `src/data/teams.ts`,
`src/pages/Teams.tsx`, `src/pages/TeamDetail.tsx`.

### Budgets drop the block threshold, gain quick-pick presets `8f3da8e`

Before: `TeamBudget.blockThreshold` (a PRD-sketched field the shipped schema
never got) rendered as a Hard-only dialog field and a summary row. After:
warn threshold only; a hard budget blocks at the amount itself. The dialog's
window control is now a quick-pick preset: choosing a window fills the amount
from `BUDGET_WINDOW_DEFAULT_AMOUNT` (5h $25 / weekly $200 / monthly $500,
always editable), helper copy per window, dialog description "Match the
limits you know from Claude and Codex." Weekly is a ROLLING window now, and
the copy says so. Where: `src/data/teams.ts`, `src/pages/teams/dialogs.tsx`.

## Components

### BudgetMeter gains a warn state; fill logic shared via budget-band `8f3da8e`

Before: two fill states (primary under, destructive over). After: three —
`bg-warning-600` once spend passes the budget's warn threshold, so a budget
in the warn band reads amber before it reads red. The state → class mapping
lives in the new `src/pages/teams/budget-band.ts` (split, not inlined, per
the react-refresh convention) and feeds both the Budget tab meter and the
list column meter from one source. Where: `src/pages/teams/budget.tsx`,
`src/pages/teams/budget-band.ts`.

## Sections

### Teams seed splits members and keys into real teams `8f3da8e`

Before: all three seeded team keys were Chad's, so every per-team breakdown
showed one name. After: `api-keys.ts` carries all ten org keys with an
`ownerId` aligned 1:1 with activity-data's owners, and the seed groups people
with their own keys — Default = Chad + prod-web/prod-agent/design-agent
($216.74, no budget), Platform = Kira (manager) + Mateus + their four keys
($12.39 of $500 monthly soft), Design = Jordan (manager) +
development/ci-runner ($18.46 of $20 weekly hard = 92.3%, seeded into the
warn band). Every figure still derives from activity-data; the API Keys page
lists ten rows. Where: `src/data/api-keys.ts`, `src/data/teams.ts`,
`src/pages/ApiKeys.tsx`, `data-model.md`.

### Teams list: budget utilization column + deleted-teams card `8f3da8e`

Before: the Budget column printed the cap amount or "No budget"; deleting a
team left no trace. After: the column renders a compact meter (h-2 w-24
track, shared three-state fill) with the one-decimal percent beside it, and
deletion files a `{ name, spend }` snapshot into a "Deleted teams (historical
usage)" card below the table — the mock's stand-in for soft-deleted teams
keeping their historical attribution. Table min-width 860 → 960px. Where:
`src/pages/Teams.tsx`.

### Team detail: header actions, sortable spend tables, richer Keys tab `8f3da8e`

Header gains Rename (outline) and Delete (destructive) for non-default teams,
wired to the existing dialogs; delete folds members and keys into Default and
returns to the list. Usage tab renames "Spend by member" → "Spend by user"
(production vocabulary: a spend row can outlive the membership) and both
breakdown tables get sortable headers. Keys tab grows Prefix and Last used
columns (house `Timestamp`, "Never" when null), the add-picker offers every
assignable key with "Currently on `<Team>`" descriptions (assignment MOVES
the key), and per-row removal is a confirm dialog — "This key moves to the
default team. It keeps working, and only its team attribution changes." —
hidden on Default itself. Budget tab appends the budget-window spend
breakdowns under a scope note, and its summary is a four-fact grid
(Remaining / Over budget by, Enforcement, Warn at with dollar equivalent,
Window with reset copy). Where: `src/pages/TeamDetail.tsx`,
`src/pages/teams/dialogs.tsx`, `src/pages/teams/budget.tsx`.

### Team Security tab counts findings and renders zero-findings states `8f3da8e`

Before: By category padded a "No category recorded" row with clean checks and
By member counted scan volume per person. After: both count FINDINGS only,
sorted descending, matching the production summary endpoint; a team with
checks but no findings (seeded: Design) renders the "No security findings"
headline and "Nothing to attribute" bodies instead of rows. Outcome badges
are capitalized (Blocked / Redacted / Flagged / Allowed). Where:
`src/pages/teams/SecurityPane.tsx`, `src/pages/teams/security-data.ts`.
