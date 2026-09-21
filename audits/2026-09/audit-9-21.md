# Audit - 2026-09-21

Read-only reviews by the `front-end-developer` agent. Checklist: tick an
item when it is applied and verified, then append the commit hash to the
item's first line. Pick items by ID ("rams-3, wdg-7"). Paths are relative
to `src/`. Already decided, not re-flagged: see the settled table in
`.claude/skills/ui-audit/SKILL.md`.

## Summary

- Why: close the eight LOW react-best-practices items (seven applied, rbp-12 reverted and skipped) left open from audit-9-20, verified by the new test tiers.
- Tested: test-smoke after the rbp-3/4/6/8/9/10/13 apply pass (vitest 40 files / 548 cases, Playwright 8 flows) on the live dev server.
- Found: 0 items; 7 carried items from audit-9-20 applied and ticked there, rbp-12 skipped by decision (React Compiler lint).
- Opinion: Clean. No open item today.
- Next: lint-hook plan off the audit-9-20 Patterns tail (user to schedule); wdg-15 blur family still the user's call.

## Runs

| # | Time (CT) | Skill | Scope | Items | Applied |
| --- | --- | --- | --- | --- | --- |
| 1 | 12:33 | test-smoke (after rbp-3, 4, 6, 8, 9, 10, 13) | whole site | none | 0/0 |

## test-smoke

### Compliant, checked and clean

- vitest 40/548 green; Playwright 8/8 green; tsc, lint and lint:design clean after the seven-item apply pass; the pre-commit React Compiler lint caught the rbp-12 hoist, which was reverted. Zero `matchMedia("(prefers-reduced-motion")` reads left in `components/ui/`; all twelve animated icons read `REDUCE_MOTION`.

Verdict (run 1): Clean. The apply pass introduced no regression.

## Patterns

- none new today; see audit-9-20 for the day's classes.
