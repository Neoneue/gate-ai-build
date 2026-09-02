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
