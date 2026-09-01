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
