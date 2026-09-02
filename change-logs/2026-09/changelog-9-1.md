# UI Changelog: 2026-09-01

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-8-31.md`](../2026-08/changelog-8-31.md)

---

## Conventions

### Team usage math: by-model requests reconcile with the team total `f78bb14`

Before: `usageByModel` distributed a team's requests by the org-wide
requests-per-token ratios and let `settleValues` absorb the estimation
error, which dumped it all on the biggest model (Haiku showed -6,638
requests on Platform) — and it settled onto the METERED key subtotal while
the by-user table counted BYOK too, leaving the two tables 200k+ requests
apart on a BYOK-heavy team. After: estimates are normalized proportionally
onto the team's request total before settling (every row non-negative, the
settle absorbs only rounding), and requests settle onto the TEAM total,
BYOK included — the gateway proxies BYOK traffic, so every request has a
model even when no dollars are metered. Spend still settles onto the
metered dollars. A permanent reconciliation suite (`src/data/teams.test.ts`)
now audits per-team KPIs against both tables across 8 range scales,
sparkline sums, budget facts, security groupings, and the org roll-up.
Where: `src/data/teams.ts`, `src/data/teams.test.ts`.

### One scaled projection per range: scaleUsage() `f78bb14`

Before: the Enterprise Usage tab scaled each KPI and each table row
independently and rounded per row, so the tables drifted from the KPIs on
non-terminating scales (a custom 10-day window's 10/7). After: new
`scaleUsage(usage, scale)` in `src/data/teams.ts` projects a `TeamUsage`
onto the range scale with both breakdown lists re-settled onto the scaled
totals; the tab derives ONE projection feeding KPIs, sparklines, and both
tables. Where: `src/data/teams.ts`, `src/pages/TeamDetailEnterprise.tsx`
(UsagePane).

### Multi-window team budgets: one cap per window, shared enforcement `9b56fab`

Before: a `TeamBudget` held one `window` and one `amount`. After: `caps:
Partial<Record<BudgetWindow, number>>`, one USD cap per configured window
(5h / weekly / monthly in any combination), with name, enforcement and
warn percent shared across them (meeting decision 2026-09-01: "support
multiple simultaneous budget types"). Per-window spend is the 7d roll-up
scaled by `BUDGET_WINDOW_SCALE` (5h = 5/168, weekly = 1, monthly =
`RANGE_SCALE["30d"]`) so the Budget tab's monthly figure reconciles with
the Usage tab's 30D; `budgetReadings` / `tightestReading` are the API.
Seed: Design carries a $5 per-5-hour cap beside its $20 weekly (11.0% vs
92.3%). `teams.test.ts` asserts per-window table reconciliation, weekly ==
7d, strictly increasing window scale, tightest == max utilization. Where:
`src/data/teams.ts`, `src/pages/teams/budget-band.ts`.

### Chart bars take `--chart-N-soft` gradient ends `9b56fab`

Before: chart bars were solid `--chart-N`. After: every track + fill meter
site-wide is `from-{family}-500 to-{family}-400`, and chart slots use
new derived tokens `--chart-{1,2,3,4}-soft = color-mix(in oklch,
var(--chart-N), white 20%)` as the lighter end. Where: `src/index.css`
(`:root`, `.dark`, `@theme`), design.md "Data bars & meters".

### Demo clock: every authored date shifts onto the real calendar `d3cf779` `4fe91ce`

Before: eight independent "now" anchors (Apr 27 chart axes, May 12 hero
anchors, May 16 audit and invite `NOW`, Jun 6 notifications, Jun 15
sparkline today) and three date storage shapes, all pinned to spring 2026,
so the site read as months stale. After: one module, `src/lib/demo-clock.ts`,
maps the authored latest activity day (Jun 6) onto real YESTERDAY at load
and applies a whole-day offset at construction. Seed rows use
`authoredDate(...)`, the 75 security ISO strings shift inside
`parseEventTime`, the 153 Messages `day` / `time` strings shift at read via
`requestDate` / `requestDayLabel` / `requestTimeLabel` (row literals and
`requestRowId` seeds untouched, so findings URLs do not move), and every
chart axis re-anchors to `DEMO_NOW` / `DEMO_TODAY`. Runtime `new Date()`
sites stay real; `models.ts` `releasedAt` and transcript text do not shift.
Authored distances are preserved, so May 12 content lands about 25 days
before yesterday. Invites re-dated to 2 and 3 days before yesterday with a
7-day expiry (`Team.tsx`, in `35c37d8`). `BILLING_PERIOD_END` moves to
`src/data/billing-history.ts`. Where: `src/lib/demo-clock.ts` (+ test),
`src/data/*`, `src/pages/security-data.ts`, `src/pages/security/events-data.ts`,
`src/pages/requests/*`, `src/pages/activity/chart-helpers.ts`,
`src/pages/Dashboard.tsx`, `src/pages/Conversations.tsx`,
`src/pages/TokenSavings.tsx`, `src/pages/Billing.tsx`,
`src/pages/cancel-plan-dialog.tsx`, `data-model.md` 5.2a.

## Components

### Budget bars fill with success / warning gradients `f78bb14`

Before: the under-budget fill was `bg-primary` (near-white on the dark
theme — read as an unfilled track) and the warned fill was solid
`bg-warning-600`. After: under = `bg-gradient-to-r from-success-500
to-success-400`, warned = the same gradient shape in the warning family,
over stays solid `bg-destructive` — darker 500 at the origin, lighter 400
at the leading edge, matching the AG-514 build's green/amber/red states.
One `BAND_FILL` ladder colours every budget bar (list column, org budget
card, detail Budget tab, Pro and Enterprise alike). design.md gains a §7
Budget meter entry and the success-400 / warning-400 ramp rungs. Where:
`src/pages/teams/budget-band.ts`.

### MultiSelect: opt-in `minSelected` and `showSelectedLabels` `9b56fab`

Two more opt-in props on the shared picker, both default off so the Audit
Trail / Notifications filters and the Add members / Add keys pickers are
unchanged. `minSelected` disables a `commitMode` popup's Apply below N
staged options; `showSelectedLabels` makes the trigger read the chosen
labels in option order ("Weekly, Monthly") instead of "N selected". Both
wired on the Budget windows picker only. Where:
`src/components/ui/multi-select.tsx`, design.md §Selects & pickers.

### BudgetSummary: label + value facts with Info tooltips `9b56fab`

Before: four facts each carried a hint line that repeated the meter's
percent, the dialog's enforcement copy, or the full window reset sentence
(which wrapped to two lines). After: label + value only, hints folded into
the values ("80% ($16.00)", "Weekly, rolling" via new
`BUDGET_WINDOW_RESET_SHORT`), and each eyebrow carries an Info glyph
tooltip in the TokenSavings benefit-row recipe holding the teaching copy
(soft vs hard from `BUDGET_ENFORCEMENT_LABEL`, the long reset sentence).
`BudgetMeter` / `BudgetSummary` now take a number cap and a
`WindowReading`. Where: `src/pages/teams/budget.tsx`.

## Sections

### Enterprise Budget tab: window-aware table titles, scope Callout removed `f78bb14`

Before: the breakdown tables were titled "Spend by user" / "Spend by
model", and a Callout between the budget card and the tables restated the
budget's window ("Spend below covers this calendar month…"). After: the
titles carry the window via `BUDGET_WINDOW_TITLE_COPY` — "Monthly spend
per user" / "7-day spend per model" / "5-hour spend per user" by the
budget's window — which made the Callout a third statement of the same
fact (the facts grid already says Window: Monthly / resets on the 1st), so
it was removed. The `Callout` primitive stays with no current consumer;
`BUDGET_WINDOW_SCOPE_COPY` still feeds the tables' empty-state copy.
Where: `src/data/teams.ts`, `src/pages/TeamDetailEnterprise.tsx`
(BudgetPane).

### Enterprise Teams list: "Your teams" section title `f78bb14`

Before: the teams table sat directly in the page column with no heading.
After: a `SectionTitle` reading "Your teams" sits above the table in a
gap-4 group, matching the section-heading rhythm on Activity and the
detail page's Usage tab. Where: `src/pages/TeamsEnterprise.tsx`.

### Team sparklines: one daily backbone, windowed per range `30bab26`

Before: each range's sparkline was an independently seeded random series
(seed carried the range), so the All chart's tail showed spend plunging
while the 7D chart climbed over the same days — two fabrications of one
period contradicting each other. After: one 60-day daily curve is
generated per team + metric (`teams/spark-series.ts`, seed = team +
metric, never the range); All folds it into 30 two-day buckets, 7D / 30D
/ custom take trailing slices, and each window is re-settled onto its own
KPI so sum(bars) still equals the number on the card. 24H keeps its own
intraday distribution — no other range renders that granularity, so
nothing can contradict it. The reconciliation suite now asserts per-range
spark sums and that the 7D spark equals the backbone's last 7 days.
Where: `src/pages/teams/spark-series.ts` (new),
`src/pages/TeamDetailEnterprise.tsx` (UsagePane), `src/data/teams.test.ts`.

### Enterprise Budget dialog: window multi-select, per-window amounts, scrollable `9b56fab`

Before: a Segmented pill picked ONE window and refilled one amount. After:
the window field is the Add-members `MultiSelect` recipe (`commitMode`, 4
visible rows, no Select All, `minSelected={1}`, `showSelectedLabels`),
followed by one "… amount (USD)" input per selected window in canonical
order, prefilled from `BUDGET_WINDOW_DEFAULT_AMOUNT` or the saved cap;
Save is gated on at least one window with a positive cap. The dialog moved
onto `DialogScrollContent` (fixed title + footer, scrolling body,
`max-h-[90vh]`). Where: `src/pages/teams/dialogs.tsx` BudgetDialog.

### Enterprise Budget tab: header pill scopes card and tables to a window `9b56fab`

Before: one card with the budget name as CardTitle + Edit action, meter +
facts, then tables. After: a header row in the Usage / Security tab
pattern (budget name as SectionTitle left; window `SegmentedPill` + Edit
budget right, the pill hidden when only one window is configured), a
headerless card holding `BudgetSummary` for the selected window, then the
two breakdown tables retitled to that window ("5-hour spend per user").
Where: `src/pages/TeamDetailEnterprise.tsx` BudgetPane.

### Enterprise Teams list: org budget card removed, tightest-window meter, widths `9b56fab`

The full-width Org budget card between the header and the table is gone
(meeting decision: confusion / duplication, not in the PRD); its dialog,
state and imports went with it, `teamsStore.orgBudget` stays unrendered.
The row meter now reads `tightestReading` (the window closest to its cap)
and suffixes the window word: "92.3% weekly". Column widths rebalanced
24/11/9/17/14/25 -> 22/11/9/15/12/31 so the table fits the capped column
without a horizontal scroll. Where: `src/pages/TeamsEnterprise.tsx`.

### Enterprise team detail: tab order, Keys Member column, small monograms `9b56fab`

Tabs reordered Members, Keys, Budget, Usage, Security with Members as the
default (user: a fresh team is populated before it is read). Keys table
gains a Member column resolved from each key's `ownerId`, order Key |
Prefix | Member | Status | Last used, widths 22/22/24/12/20. Members and
Keys monograms drop from 28px two-letter to the 16px first-initial size
the Usage and Security tables use, gap-3 -> gap-2. Team-role select is
Manager / Member only; budget card titles render the saved budget name;
empty states get KeyRound / Wallet / ShieldCheck icons and the Keys /
Budget CTAs wait for a roster. Where: `src/pages/TeamDetailEnterprise.tsx`.

### Enterprise Security tab: overview pane, threat types per member, two sections removed `9b56fab`

New `SecurityOverviewPane.tsx`: Overview header (range pill +
DateRangePicker, defaults All), Total events hero with inline "+22.4%"
DeltaTag and area chart settled onto findings, Action types + Attack
types cards in the org recipes, then a By member table. The table now has
one column per threat type (PII / PHI, Prompt injection, Credential leak)
plus a Findings total; each column is allocated by member request weight
so it sums exactly to the Attack types card, with a repair pass keeping
every row within its total (test-guarded). Removed against PRD 8.4: the
"What this covers" summary card (explanatory UI) and the "By pipeline
stage" tiles (the dev build's scan-phase GROUP BY). Data:
`teams/security-data.ts` rewritten to allocate the org Security canon per
team (`securityForTeamAtRange`). Org `Security.tsx` hero legend removed,
DeltaTag inline on the baseline. Where: `src/pages/teams/SecurityOverviewPane.tsx`,
`src/pages/teams/security-data.ts`, `src/pages/Security.tsx`.

### Teams store shared by list and detail `9b56fab`

New `teams/teams-store.ts` (useSyncExternalStore, range-store idiom) holds
teams, org budget and deleted-team snapshots for BOTH Enterprise pages, so
a team created on the list exists on its detail route and renames / moves
/ budgets / deletes survive navigation. Full reload re-seeds by design.
Pro pages stay per-page for the A/B. Where: `src/pages/teams/teams-store.ts`.

### Members rename: nav label and routes `9b56fab`

Before: nav "Team", routes `/team*`. After: nav "Members", routes
`/members` + `-default` / `-free` / `-enterprise`, H1s updated. Code names
(`Team*.tsx`, nav id "team", `team-members.ts`) deliberately kept. Where:
`src/App.tsx`, `src/lib/plan.ts`, `src/layouts/nav-sections.ts`,
`src/data/notifications.ts`, `src/pages/Team.tsx`, `src/pages/TeamDefault.tsx`.

### Enterprise Budget tab: stacked per-window cards, tables leave `b8dbcd1`

Before: header row with a window pill, one headerless card for the picked
window, then the per-user / per-model tables retitled to that window.
After: header row (budget name + Edit budget), then ONE CARD PER WINDOW
stacked, the Claude / Codex limits shape: CardTitle = window label,
CardDescription = `BUDGET_WINDOW_RESET_COPY`, body = `BudgetSummary` with
new `omitWindowFact` (meter + Remaining / Enforcement / Warn at on a
three-column grid). No pill, no tables: PRD 8.3 describes one roll-up view,
and the tables were duplicated on Usage and Budget until today; they live
on Usage only now. Where: `src/pages/TeamDetailEnterprise.tsx` BudgetPane,
`src/pages/teams/budget.tsx`.

### Enterprise team Members tab: Status becomes Joined `b8dbcd1`

Before: a constant "Active" Status cell. After: Joined, the date the member
joined THIS team, in the Members page's `Timestamp format="dateNumeric"`
recipe. New optional `TeamRow.memberJoined` seeded early June 2026 (Chad
06-01, Kira 06-02, Mateus 06-03, Jordan 06-08, two days after his org
join); `moveMembersToTeam` and both delete fold-ins stamp runtime moves,
`memberJoinedAt()` falls back to today. Where: `src/data/teams.ts`,
`src/pages/TeamDetailEnterprise.tsx`, `src/pages/TeamsEnterprise.tsx`.

### Members page Invitations table: Actions column no longer overflows `b8dbcd1`

Before: widths 27/25/15/15/15/3, the 3% Actions column (about 26px at the
860px floor) pushed its visible label past the card edge and lit the edge
fade inside the 1024px cap. After: 28/18/15/13/16/10, Invited by paying
for a 10% Actions column to match the Members tab. Where:
`src/pages/Team.tsx`.

### Members page: full-width search, toolbar leaves the card `35c37d8`

Before: `SearchInput` capped at `@2xl:w-96` inside a `FilterToolbar` fused
to the table Card header, hidden when a query returned nothing; the only
table on the site with a toolbar attached to its card. After: the search
takes the shared `@2xl:w-auto w-full min-w-0 @2xl:flex-1` recipe, and the
search + role Select sit on the page background above `Card density="flush"`
in the same `flex flex-col gap-4` wrapper AuditTrail / Conversations use,
always rendered. Where: `src/pages/Team.tsx`.

### Enterprise team detail: Members and Keys toolbars, primary Add buttons `35c37d8`

Before: bare tables with an outline "Add members" / "Add keys" button below
the card. After: the Members page toolbar pattern above each Card. Members
tab: search by name or email plus a team-role Select (All roles / Managers /
Members); the row `MemberRoleSelect` now derives from and writes through to
`team.managerIds` via `onPatch`, so the Role column, the row select and the
filter read one source. Keys tab: search by key or member name, no Select
(Status is the only axis and the seed has no revoked team keys). Both: the
button moves into the toolbar row at the far right with `ml-auto`, primary
`variant="default"`, `size="default"` (h-9, matching the SelectTrigger), and
reads "Add member" / "Add key" (singular, also on the empty-state CTAs). New
"No members match" / "No keys match" `TableEmptyState`s for filtered-to-zero.
Where: `src/pages/TeamDetailEnterprise.tsx`.

### Enterprise Keys tab: Status renders the ApiKeys badge `35c37d8`

Before: plain "Active" text at widths 22/22/24/12/20. After: the same
`Badge` the API Keys page uses (`success` ACTIVE / `neutral` REVOKED,
reading `row.revoked`), widths 22/22/22/14/20 so the badge has room, min-w
760 unchanged. Where: `src/pages/TeamDetailEnterprise.tsx`.

### Enterprise Usage and Security tabs: member wording, sortable events table `35c37d8`

Before: Usage "Spend by user"; Security block titled "By member" with a
"Findings" total and a findings subtitle, plain headers. After: "Spend by
member"; "Events by member", subtitle "Which members the security events
came from, by threat type.", total column "Events" (the tile says events and
the column sums to it), and `SortableTableHead` on every header (Member by
name, the three threat types and Events by amount) via the `useTableSort` +
`sortRows` recipe the Usage tables already use. Where:
`src/pages/TeamDetailEnterprise.tsx`, `src/pages/teams/SecurityOverviewPane.tsx`.

### Teams: one build for Pro, Default and Enterprise `6d74a69`

Before: `/teams` and `/teams/:teamId` rendered the Pro `Teams.tsx` /
`TeamDetail.tsx`, frozen since 2026-08-31 while the Enterprise twin was the
sandbox; `/teams-default` wrapped the same Pro files. After: all three tiers
render `TeamsEnterprise.tsx` and `TeamDetailEnterprise.tsx` (the Enterprise
design is the north star), and the stale Pro files are deleted. Drill, back
and security paths come from `teamsListPath(pathname)` in `src/lib/plan.ts`
instead of a `variant` prop, so a row opened on `/teams` lands on
`/teams/:teamId`, on `/teams-enterprise` on `/teams-enterprise/:teamId`, and
so on. Side effect: the org budget card lived only in the deleted Pro list,
so no surface renders an org budget now. Where: `src/App.tsx`,
`src/lib/plan.ts`, `src/pages/TeamsEnterprise.tsx`,
`src/pages/TeamDetailEnterprise.tsx`, `src/pages/TeamsDefault.tsx`,
`src/pages/TeamDetailDefault.tsx`.

### Budget dialog: Hard enforcement shows a warning note `6d74a69`

Before: the Enforcement select offered "Soft: warn only, never blocks" and
"Hard: blocks requests once exceeded" with nothing beneath either. After:
while Hard is selected, a warning note card sits under the select (`mt-2
rounded-md border border-warning-200 bg-warning-50 p-3`, dark twin
`border-warning-500/30 bg-warning-500/15`, ink `type-copy-14 text-warning-700
dark:text-warning-300`, `role="note"`) reading "Team members will be unable
to send requests once a cap is reached, until that window resets." Same
shape as the API-key reveal and cancel-plan consequence notes; red stays
reserved for the over-budget state. Copy is single-sourced as
`BUDGET_HARD_ENFORCEMENT_HELP`. Where: `src/pages/teams/dialogs.tsx`,
`src/data/teams.ts`.

### Team Members tab: removal moves the member and their keys to Default `bdf2ee9`

Before: the trash button on a member row dropped them from the team's list in
place, leaving them on no team, with no confirmation, and it rendered on the
Default team too. After: the button opens a confirm dialog ("Remove {name}
from this team?" / "They move to the default team along with their N keys,
where you can reassign them. Their org access is unchanged, and only their
team attribution changes." / Cancel, destructive "Remove member"), the same
shape as the Keys tab's remove dialog. Confirming moves them to Default with
a fresh Joined stamp and drops their manager role. The button is hidden on
the Default team. A member's own keys now move with them on every team move,
including Add members; the Add members description reads "Only existing org
members can be added, and their keys move with them. This doesn't send
invites." Where: `src/pages/TeamDetailEnterprise.tsx`,
`src/pages/teams/dialogs.tsx` (`RemoveTeamMemberDialog`),
`src/data/teams.ts` (`moveMembersToTeam`).
