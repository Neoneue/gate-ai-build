# UI Changelog: 2026-09-08

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-9-7.md`](./changelog-9-7.md)

---

## Data

### Teams: an archived team keeps its security events and member rows `d0d03a0`

Before: opening an archived team (for example Design, manager Jordan Lee)
showed request and check volume on the Security tab but 0 total events, an
empty Attack types card and "No per-member findings". The detail page
renders an archived team from its frozen snapshot after the live list has
dropped it, and the event share was allocated across the live list only, so
the archived team's lookup missed. After: `teamsIncluding(teams, team)`
(`src/pages/teams/security-data.ts`) adds the target team to the allocation
set when it is absent, at the findings headline and the 7d chart seed in
`SecurityOverviewPane.tsx`. The archived team reads the same events it had
before archiving, its members keep their rows, and every live team's share
is unchanged (history is immutable, PRD 3 Reassignment). Covered by
`security-data.test.ts`.
