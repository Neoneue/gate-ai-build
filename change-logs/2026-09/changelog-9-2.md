# UI Changelog: 2026-09-02

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-9-1.md`](./changelog-9-1.md)

---

## Conventions

### Warn-threshold tick on a meter track: `bg-foreground/40` hairline `7f832db`

Before: no meter on the site marked a threshold. After: the budget meters
carry a 1px full-height mark at the warn percent, painted `bg-foreground/40`
and absolutely positioned inside the `role="meter"` track so it sits over the
fill. `design.md` names no hairline token that reads on BOTH a saturated fill
and the `bg-muted` track. `--border` (neutral-200 light, white/10 dark)
vanishes against `bg-muted` in the unfilled region, which is exactly where a
warn mark usually sits. `bg-foreground/40` is an alpha on a semantic token, so
it flips with the theme; it is not one of the named destructive-ladder rungs
and is the one value here `design.md` does not already name. Where:
`src/pages/teams/budget.tsx` (`BudgetWarnTick`, exported so the list column
and the detail meter cannot drift apart).

## Components

### Budget status word: `BudgetStatusBadge`, nothing when ok `7f832db`

Before: a budget's state was carried by bar colour alone: a team at 85% and a
team at 100% were an amber bar and a red bar, and nothing else. After: a
`Badge` renders `Warning` / `Exceeded` / `Blocking` from
`budgetStatus(spend, cap, warnThreshold, enforcement)`, with the tone from
`BUDGET_STATUS_VARIANT` (warning / destructive). `ok` renders NOTHING, so a
healthy surface stays quiet and the loud ones are legible. Two consumers, one
component: the Teams list Budget cell (after the percent text, same `gap-2`
flex row) and each per-window card on the detail Budget tab (inside
`CardAction`, right-aligned to the window title). The Budget tab guards the
`CardAction` on the status rather than letting the badge return null inside it.
The slot's mere presence flips `CardHeader` into a two-column grid and would
shave 8px off every healthy card's title. Where:
`src/pages/teams/budget.tsx`, `src/pages/TeamsEnterprise.tsx`
(`RowBudgetMeter`), `src/pages/TeamDetailEnterprise.tsx` (`BudgetPane`).

### Budget meter: hard budgets stop at their cap `7f832db`

Before: `BudgetMeter` printed raw spend and an unclamped percent, so a hard
budget could read "$21.40 of $20.00 · 107.0% used" on a bar the gateway
physically blocks at $20.00, reporting a state the system cannot enter. The
first fact keyed off `spend > cap`, so a team sitting exactly on its cap read
"Remaining $0.00" and amber, indistinguishable from a team at 80%. After: the
meter takes an `enforcement` prop and runs displayed spend through
`budgetSpendShown` and the percent through `budgetPercentLabel(…, enforcement)`.
Hard clamps at the cap and 100.0%, soft keeps counting (102.6%, showback).
`aria-valuenow` / `aria-valuetext` follow the shown figure, so a hard meter no
longer reports a value past its own `aria-valuemax`. `over` is now
`spend >= cap`; the first fact reads `Remaining $0.00` on a hard budget at cap
(it cannot be over) and `Over budget by` only on a soft one past it. Where:
`src/pages/teams/budget.tsx` (`BudgetMeter`, `BudgetSummary`),
`src/pages/TeamsEnterprise.tsx`.

## Sections

### Team budgets: status word, warn tick, blocked banner `7f832db`

Before: a team whose cap had blocked its traffic looked like a team having a
busy week. The list row showed a red bar and a percent, the detail page showed
nothing at all above the tabs, and the Budget tab's red bar was one tab deep,
so the only person who saw the blocked state was the person who already
suspected it. Nothing anywhere named which of a team's caps had fired, and no
meter marked where the warn alert sits, so a green bar gave no reading of how
much headroom was left (AG-695: "how a team at 80 percent reads differently
from one at 100 percent" and "which cap did it"). After: three additions, all
reading one helper set and never re-deriving state in JSX. (1) A status word
beside every meter: `Warning` / `Exceeded` / `Blocking`, absent when the
budget is fine. (2) A warn-threshold tick on both meter tracks, skipped once
the fill reaches the cap: a full bar has no headroom left to measure. (3) A
full-width `role="alert"` banner between the page header and the Tabs on the
team detail page, rendered only when a window is `blocking` or `exceeded`, with
one title per breached window stacked as a list inside the ONE banner and ONE
icon: a team running a 5-hour and a weekly cap can breach both, and two
stacked alert cards would read as two incidents rather than one team in
trouble. Copy is single-sourced in `src/data/teams.ts` as `budgetBreachTitle`
/ `budgetBreachBody`: hard reads "Blocking: Design weekly budget reached" /
"Requests from this team are blocked. Spend older than 7 days drops off.",
soft reads "Exceeded: Design weekly budget" / "Spend is $0.46 past the cap and
requests still go through. Spend older than 7 days drops off." Every title
names the team and the window, which is the answer to which cap did it; there
is no org budget on this site, so the copy never implicates a cap the admin
cannot see. `budgetResetLabel` was rewritten to plain forms at the same time
("Spend older than 7 days drops off", not "Rolling 7-day window; spend ages out
after 7 days"): the phrase has to survive being appended to a banner
sentence. Banner surface is the warning-note recipe in the destructive family:
`flex items-start gap-2 rounded-md border border-danger-200 bg-danger-50 p-3
dark:border-destructive/30 dark:bg-destructive/15`, ink `text-danger-800
dark:text-danger-300`, 16px `OctagonAlert` in an `h-5` wrapper so it centers on
the first 20px title line and stays put when the copy wraps (the `Callout`
pattern). The list's Budget column held its `w-[31%]`: meter + percent +
badge measures 278px inside a 302px cell at the table's 960px floor, so nothing
wrapped and no width moved. Where: `src/data/teams.ts` (`budgetBreachTitle`,
`budgetBreachBody`, `budgetResetLabel`), `src/pages/teams/budget.tsx`
(`BudgetStatusBadge`, `BudgetWarnTick`, `BudgetBreachBanner`, `BudgetMeter`,
`BudgetSummary`), `src/pages/TeamsEnterprise.tsx` (`RowBudgetMeter`),
`src/pages/TeamDetailEnterprise.tsx` (header + `BudgetPane`).

### Breach banner: 8px more air above the tabs `ebd1590`

Before: the banner sat in the page column's regular gap above the Tabs and
read tight against the tab row. After: the banner carries `mb-2`, so the
distance to the tabs is the column gap plus 8px (user direction 2026-09-02).
Where: `src/pages/teams/budget.tsx` (`BudgetBreachBanner` root).

### Teams list: default team named General; column widths rebalanced `7c6daa4`

Before: the catch-all team row read "Default" next to a DEFAULT badge, so
the badge repeated the name; and the Budget cell's new status badge crowded
the row actions at the 960px table floor. After: the seed team is named
"General" (Microsoft Teams and Slack use the same word for their undeletable
starter channel) and the DEFAULT badge alone carries the role; nothing in
the code keys on the name. Column widths: Team 20% / Members 12% / Keys 9% /
Manager 16% / Spend 12% / Budget 31% (was 22 / 11 / 9 / 15 / 12 / 31), so
"100.0% weekly BLOCKING" fits with its meter on one line. Where:
`src/data/teams.ts` (seed), `src/pages/TeamsEnterprise.tsx` (TableHead
widths).

### Team budgets: seeds carry no hard cap, three windows each `5016875`

Before: Design seeded a hard budget (5h $5, weekly $20) with spend at 92%
of the weekly cap, so a first-time visitor read a seeded number as a real
limit about to block. After: Platform and Design both seed 5h $25 / weekly
$100 / monthly $250, soft, so every meter sits low and the Blocking state
appears only when a demo edits a cap. PM decision 2026-09-02: demo seeds
must not suggest hard caps exist. Where: `src/data/teams.ts` (seed),
`src/data/teams.test.ts` (Design pins repinned).

### Default team named plainly, badge dropped; dialogs say where history stays `56b9db7`

Before: the catch-all team was "General" with a Default badge beside it,
and the five reassignment dialogs said only that members or keys "move to
the default team". After: the seed team is named "Default team" and the
badge is gone (the name carries the role). The detail subtitle drops "The
default team." so it does not repeat the title. Add members, Add keys,
Remove key and Remove member now say past requests stay with the previous
team and only new traffic counts toward the new one (PRD 3 Reassignment).
Delete team says "The team and its history are removed. This can't be
undone." (PM decision 2026-09-02; archiving is a later call). Where:
`src/data/teams.ts`, `src/pages/TeamsEnterprise.tsx`,
`src/pages/TeamDetailEnterprise.tsx`, `src/pages/teams/dialogs.tsx`.

### Team spend stays with the team that ran it; "Former member" rows `602e4d4`

Before: a team's spend, requests, tokens, by-user and by-model tables,
security counts, and the org total were all summed from whichever keys were
on the team at render time, so moving a key or member dragged its whole
past onto the new team and the old team's numbers fell. The dialogs said
the opposite. After: every roll-up sums by a frozen per-team attribution
that a move never touches (PRD 3 Reassignment: "past requests keep their
original team; only new traffic attributes to the new team"). Moving
Mateus from Platform to Design leaves Platform at $12.39 with his row
labeled "Former member" (`type-copy-12 text-muted-foreground`, after the
name) and Design at $18.46 with two more keys and no new spend; the org
total is unchanged. Deleting a team folds members and keys into the Default
team without moving spend, and the org total drops by the deleted team's
spend. Where: `src/data/teams.ts` (`historyKeyIds`, `attributedKeyIds`,
`freezeHistory`, `deleteTeam`, `UsageSlice.former`),
`src/pages/teams/security-data.ts`, `src/pages/TeamsEnterprise.tsx`,
`src/pages/TeamDetailEnterprise.tsx`, `src/data/teams.test.ts`.

### Usage tab: Spend by current members / Spend by past members `23342b2`

Before: one "Spend by member" table over everyone who ever spent on the
team, with a muted "Former member" label after names of people who had
left (added earlier today). After: "Spend by current members" lists only
today's roster; "Spend by past members" appears below it only when someone
who spent on the team has left, and is absent otherwise. Same
`UsageBreakdown` component, same columns and sorting, no new classes. The
two tables sum to Total Spend. PM direction 2026-09-02: past spenders do
not belong in a current team's list. Where: `src/pages/TeamDetailEnterprise.tsx`.

### Teams list: caption names the cap mode; team page gains a Settings tab `970c3fd`

Before: a healthy hard budget and a healthy soft one looked identical on
the Teams list (the caption read "18.5% weekly"), and Rename / Delete were
reachable only from the list row's menu. After: the caption reads
"18.5% weekly · Hard cap" or "18.5% weekly · Soft", same
`type-copy-12 text-muted-foreground tabular-nums` span, middle-dot
separator as on Billing; the meter's aria-label ends with the mode. Column
widths rebalanced to Team 18% / Members 11% / Keys 8% / Manager 13% /
Spend 12% / Budget 38% (was 20/12/9/16/12/31) after a Playwright measure at
the 960px floor showed "100.0% weekly · Hard cap" + a Blocking badge
overflowing the old Budget column by ~29px. The team page gets a sixth tab,
Settings, after Security: a "Team name" card (name + Rename, outline sm)
and a "Delete team" card (confirm copy + Delete team, destructive sm), both
in the Budget tab's `Card > CardHeader > CardAction` shape and wired to the
existing dialogs. The Default team shows one Callout: "The default team
can't be renamed or deleted. Members and keys removed from other teams land
here." Where: `src/pages/TeamsEnterprise.tsx`, `src/pages/TeamDetailEnterprise.tsx`.

### Status word "Blocked"; Teams list columns 20/10/8/14/12/36 `cd15145`

Before: the at-cap hard-budget badge and the breach banner title read
"Blocking". After: "Blocked", so the three status words share one
grammatical form (Warning / Exceeded / Blocked) and read as the team's
state rather than an activity; one character shorter. Single source
`BUDGET_STATUS_LABEL` in `budget-band.ts`; banner title in
`budgetBreachTitle`. Teams list column widths rebalanced from a live
Playwright measurement at the 960px floor: Team 20% / Members 10% / Keys 8%
/ Manager 14% / Spend 12% / Budget 36% (was 18/11/8/13/12/38 earlier
today). Team had the most unused room; Budget still clears the worst case
("100.0% weekly · Hard cap" + Blocked badge) at the floor. Where:
`src/pages/TeamsEnterprise.tsx`, `src/pages/teams/budget-band.ts`,
`src/data/teams.ts`, `design.md` status-word line.

### Block threshold field; "Messages" wording; Usage by tables gain token columns `e0b5acf`

Before: a hard budget blocked at its cap with no way to set a lower line
(the PRD's "warn at 80%, block at 100%" had only the warn half); team copy
said "requests"; the Usage tab tables were "Spend by …" with User /
Messages / Spend. After: the budget form shows "Block threshold (% of
budget)" directly under the warn field, only while Hard is selected, and
requires it above the warn value (Save disabled otherwise). Hard budgets
now block, clamp their shown spend, read "Blocked" and fill red at that
percent of the cap; soft budgets ignore it. The Budget tab card adds a
"Block at" fact (percent + dollars) for hard budgets, and the breach banner
title reads "Blocked: Design weekly budget at its N% block threshold"
when N is under 100. All team-page copy says "messages": the Usage column
header, "Hard: blocks messages once exceeded", the hard note under the
select, and both banner bodies ("Messages from this team are blocked").
Usage tab titles are "Usage by current members", "Usage by past members",
"Usage by model"; the two member tables read Member / Messages / Tokens in
/ Tokens out / Spend at 24 / 19 / 19 / 19 / 19 (the model table keeps 52 /
24 / 24), and per-member tokens in + out sum to the Tokens Used tile at
every range (pinned). Where: `src/data/teams.ts`, `src/pages/teams/budget-band.ts`,
`src/pages/teams/budget.tsx`, `src/pages/teams/dialogs.tsx`,
`src/pages/TeamsEnterprise.tsx`, `src/pages/TeamDetailEnterprise.tsx`,
`design.md` band boundary, `data-model.md`.
