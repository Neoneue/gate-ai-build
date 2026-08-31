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

### Enterprise workspace tier joins Pro / Default / Free `744bdd6`

Before: three tiers, derived from a pathname ENDING in `-default` / `-free`.
After: a fourth `-enterprise` tier exists so the Teams UI can be A/B compared
against Pro. The workspace switcher lists Enterprise first (info badge, same
treatment as Pro; the tight-band rail slot abbreviates it to "ENT." via a new
`compactBadge` prop), `ENTERPRISE_SIDEBAR_SECTIONS` locks and hides nothing,
and 17 `-enterprise` routes exist — Teams renders real divergent clones
(`TeamsEnterprise.tsx`, `TeamDetailEnterprise.tsx`), every other route reuses
the Pro page under Enterprise chrome. Tier suffixes now match at SEGMENT
boundaries (`/-(default|free|enterprise)(?=\/|$)/`), which also fixes the
latent bug where detail drill-ins like `/teams-default/:teamId` dropped back
to Pro chrome; tier switches now carry a detail path to its twin instead of
falling back to Overview. Where: `src/lib/plan.ts`,
`src/layouts/nav-sections.ts`, `src/layouts/DashboardChrome.tsx`,
`src/components/ui/workspace-switcher.tsx`, `src/App.tsx`, `data-model.md`.

### Team member roles are org roles; the manager select is gone `744bdd6`

Before: the team detail Members tab offered a lowercase `member` / `manager`
per-membership select (AG-514's `team_role` enum). After: the roles a user
can actually assign are the org roles, mirroring the Team page's row control
exactly — Owner renders static, everyone else gets a w-28 Select with
capitalized "Admin" / "Member" (local state, like the Team page). Column head
reads "Role"; the lowercase "active" status cells read "Active" (Members and
Keys tabs both). `managerIds` machinery stays in the data layer, seed-only.
Applied to BOTH detail files by user direction. Where:
`src/pages/TeamDetail.tsx`, `src/pages/TeamDetailEnterprise.tsx`.

## Components

### BudgetMeter gains a warn state; fill logic shared via budget-band `8f3da8e`

Before: two fill states (primary under, destructive over). After: three —
`bg-warning-600` once spend passes the budget's warn threshold, so a budget
in the warn band reads amber before it reads red. The state → class mapping
lives in the new `src/pages/teams/budget-band.ts` (split, not inlined, per
the react-refresh convention) and feeds both the Budget tab meter and the
list column meter from one source. Where: `src/pages/teams/budget.tsx`,
`src/pages/teams/budget-band.ts`.

### New Callout primitive: quiet persistent info banner `744bdd6`

A `role="note"` banner for scope-setting context that must sit near the
surface it qualifies: `rounded-md border border-border bg-card px-4 py-3`,
16px Info glyph in an `h-5` wrapper (centers on the first text line and stays
put when the copy wraps), `type-copy-14` muted ink, no dismiss, no status
tones — it states a fact, it does not report an event. Started `bg-card-muted`
and dropped to `bg-card` the same day: the muted band sat brighter than the
cards in dark mode. First consumer is the team Budget tab's window note.
Spec: `design.md` §7. Where: `src/components/ui/callout.tsx`.

### Line tab rails are no longer vertically scrollable `744bdd6`

Before: the line variant's sliding underline sat at `bottom-[-1px]` inside an
`overflow-x-auto` list, and that 1px overhang is scrollable overflow — every
line tab rail could be nudged vertically by a pixel. After: the indicator
sits at `bottom-0` and the list adds `overflow-y-hidden`. Site-wide effect:
the rail's hairline border is now visible under the active underline instead
of being covered by it. Where: `src/components/ui/tabs.tsx`.

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

### Enterprise Teams list: CTA-only header, deduped org budget card `744bdd6`

The Enterprise clone of the Teams list drops the whole range chrome (7D/30D/
90D pill AND the Custom date picker; both were scaffold-only) so the header
is the title plus a default-size Create team button. The Org budget card's
description now reads just the window ("Monthly") instead of
`budgetWindowLine`'s "Org budget · Monthly", which repeated the card title.
Pro `Teams.tsx` is untouched — it stays frozen as the A/B baseline. Where:
`src/pages/TeamsEnterprise.tsx`.

### Enterprise team detail: Usage tab gets Activity's chart treatment `744bdd6`

Before: two flat KPI cards (Total spend, Requests) above two plain tables.
After: an "Overview" `SectionTitle` row with Activity's exact range chrome
(All / 24H / 7D / 30D pill + Custom picker, landing on All; title and rail
grouped at `gap-4`, matching Activity's 16px title-to-cards), then Activity's
exact three KPI cards — Total Spend / Total Messages / Tokens Used with
CompactSpark sparklines (chart-1 / neutral-500 / chart-3, fmtUsd / fmtInt /
fmtTokens tooltips), no delta chips (no prior-period team data exists). Every
number on the tab scales by the same `effectiveScale` projection Activity
uses — KPIs, sparklines (distributeSeries over the range's bucket count,
seeded per team, metric, and range), and both breakdown tables. Spend-by-user
rows carry Monograms (single first initial, member's own tone, Activity's
Top-users treatment); spend-by-model rows carry the Models page's
`VendorAvatar` brand marks, on the Budget tab's copies of the tables too.
`TeamUsage` gains `tokens` (in + out over the same key rows, BYOK included).
24px now sits under the tab rail (`gap-6`). Where:
`src/pages/TeamDetailEnterprise.tsx`, `src/data/teams.ts`.

### Enterprise team detail: Budget tab combined into one card + Callout `744bdd6`

Before: a floating right-aligned Edit budget button above a bare meter card,
and the window caveat as an orphaned muted sentence. After: one card in the
list page's Org-budget shape — CardHeader with "Team budget" and the Edit
budget button nested as CardAction, meter plus the four facts (Remaining /
Enforcement / Warn at / Window) in the content; no description line since the
Window fact already names the window. The caveat ("Spend below covers
{window}...") moved into the new quiet `Callout` directly under the card,
with `mt-2` topping the gap below it up to 24px before "Spend by user".
Rename / Delete header buttons are hidden for now — their dialogs stay wired
for a future Settings tab. Where: `src/pages/TeamDetailEnterprise.tsx`.

### Enterprise team detail: Members / Keys table parity `744bdd6`

Add members / Add keys buttons moved BELOW their tables, right-aligned, at
default size. Members rows matched to Keys rows at 48px: `py-0` on the two
control-bearing cells (Monogram row, role Select) so 28-32px controls stop
inflating the row past `py-3`. Both actions cells take `pr-4 pl-0` — in a
48px `w-12` column the primitive's 12px left padding left only 20px for the
24px icon button, which overflowed its right-align and sat 12px from the
edge instead of 16px (Playwright-measured 16.0 / 16.0 after). Where:
`src/pages/TeamDetailEnterprise.tsx`.
