---
name: verify-twins
description: Resolve a dashboard route to every file that renders on it (twins wrap shared pages; Enterprise pages mount panes from teams/) and prove a pattern's coverage across Free / Default / Pro / Enterprise with a grep table. Use automatically, without being asked, before briefing a review or apply agent on any page, before relaying a reviewer's "all twins" claim, before ticking an applied item, and whenever a change touches a page that has Free / Default / Pro / Enterprise variants.
---

# verify-twins

Twins are separate files (`.claude/rules/no-thrash.md`), and Enterprise pages
mount shared panes from `src/pages/teams/`. A reviewer who reads
`TokenSavings.tsx` and says "all four twins" has not seen
`teams/TokenSavingsPane.tsx`. This skill makes the file list and the coverage
table mechanical so the orchestrator never relays a twin claim it did not
check (memory: `feedback_verify-reviewer-claims-before-relay`, user
2026-09-21: "Require proof from now on").

## When it fires

Do not wait to be asked. Run it:

1. Before writing a review or apply brief for any page: the brief's scope
   list is this script's output, with line counts, not a guess.
2. Before relaying a reviewer item whose `Why:` says "all twins", "every
   site", "both pages", or names fewer files than the route renders.
3. Before ticking an applied item: the `Before:` pattern must be gone from
   every file the routes render, and the sweep table goes in the relay.
4. Whenever an edit lands on a file under `src/pages/` that has a `*Free`,
   `*Default`, `*Enterprise` sibling or is imported by one.

## Commands

Resolve routes to files (walks `App.tsx` route elements, then imports,
recursively, within `src/pages` and `src/layouts`):

```bash
node .claude/skills/verify-twins/resolve-route.mjs /token-savings /token-savings-free /token-savings-default /token-savings-enterprise
```

Coverage table for a pattern across those routes (regex, applied per file):

```bash
node .claude/skills/verify-twins/resolve-route.mjs --pattern 'cursor-help' /token-savings /token-savings-free /token-savings-default /token-savings-enterprise
```

Output per route: the rendered files with line counts, then a table
`route | file | hits`. A route with zero hits everywhere prints
`pattern absent`. Paste the table into the brief, the relay, or the audit
item's proof parenthesis verbatim; never summarise it as "all twins".

## Route families (names only; the script finds the files)

| Area | Routes |
| --- | --- |
| Models | `/models`, `/models-free`, `/models-default`, `/models-enterprise` |
| Token Savings | `/token-savings`, `/token-savings-free`, `/token-savings-default`, `/token-savings-enterprise` |
| Policies | `/policies`, `/policies-free`, `/policies-default`, `/policies-enterprise` |
| Billing | `/billing`, `/billing-free`, `/billing-default`, `/billing-enterprise` |
| Limits | `/limits`, `/limits-free`, `/limits-default` |
| Teams | `/teams`, `/teams-default`, `/teams-enterprise`, `/teams/:teamId` |

For any other page, `grep -n '<Route' src/App.tsx | grep -i <name>` lists its
routes. Enterprise routes with a "Viewing as" switch render three role views
from the same files; the file list is the same, the role sweep is
`feedback_sweep-role-lifecycle-matrix`.

## Tiers differ on purpose (user, 2026-09-21)

Not every workspace gets the same UI. Some features exist on Pro and not
Free; some have no Enterprise version; Teams has no Default page at all.
Feature presence is decided per feature by the PRD and the tier matrix, not
by symmetry. So:

- "pattern absent" on a twin is a FACT about coverage, never an instruction
  to add the pattern there. The table proves where a change landed; it does
  not say where it should land.
- A fix is applied to a twin only when that twin already carries the
  feature the fix touches (the `Before:` pattern, or the same component, is
  present). Never add a section, control or copy to a tier that lacks the
  feature to make the table symmetric.
- When it is unclear whether a tier should carry the feature (a missing
  `*Free` file, an Enterprise route that renders a shared pane, a Default
  page that does not exist), ASK the user before touching it. Name the
  tier, the feature and the PRD sentence you could not find.
- Memory `project_workspace-tiers-default-is-free` and
  `project_enterprise-view-role-switch` hold the standing tier facts;
  `docs/prds/` and Notion hold the per-feature ones.

## Rules

- The script's file list is the scope. If a reviewer's "Files read in full"
  lacks any of them, the review is incomplete: re-run on the missing files.
- A pattern that survives in a rendered file after an apply is a missed
  twin: send it back, do not tick. A pattern absent from a twin that never
  had the feature is correct; it is not a miss.
- Never edit UI from this skill; it only proves scope and coverage.
