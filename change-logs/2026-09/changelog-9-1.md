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
