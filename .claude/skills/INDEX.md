# Skills and commands index: orchestrator

What lives in `.claude/skills/` (skills I load on my own when the task
matches) and `.claude/commands/` (slash commands the user types). Design
skills are not here; they belong to the `front-end-developer` agent and are
indexed at `agents/front-end-developer/skills/INDEX.md`.

## Pick by situation

| Situation | Use | Who triggers |
| --- | --- | --- |
| User says "run <skill> on <page>", "audit", "apply items", "record that decision" | `ui-audit` (review, apply, decide; day file, proof loop) | User, or me when a review is the right first step |
| About to brief any agent on a page, relay an "all twins" claim, or tick an applied item | `verify-twins` (`resolve-route.mjs`: route to rendered files, coverage table). "pattern absent" is a fact, not a to-do: tiers differ per feature; ask before adding UI to a tier | Me, always, unasked |
| About to propose or apply any user-facing copy, or `lint:copy` flags a string | `triage-copy` (lint, sort, PRD source top-down from Notion, cited proposal) | Me, always, unasked |
| User pastes `npx skills add ...` or says "install this skill" | `adopt-skill` (one home: agent kit or `.claude/skills`; ask which) | User |
| User asks "what should we improve", roadmap, tech debt, plans for another agent | `improve` (read-only survey, prioritised plans; never edits) | User |
| `/commit` | Commit current branch, stamp changelog and INDEX; no push | User |
| `/commit-push` | `/commit` then push the current branch only | User |
| `/promote` | dev to main: divergence check, test-merge, PR, merge commit, one CI watch, sync back | User; the only path that pushes main |
| `/handoff` | Rewrite `handoff.md` LATEST for the next session; OPEN items carry | User, end of session |
| `/end-session` | `/commit-push`, then `/promote` (only if commit passed), then `/handoff` (even if promote failed, so the failure is the first OPEN item); ends with one `SAFE TO /clear` line or `NOT SAFE` naming the step | User, end of session; the user clears by hand on the safe line |

## Chains that recur

- **Audit a page:** `verify-twins` (scope) -> `ui-audit review` (agent
  writes report, runs `check-report.mjs` to PASS) -> relay + day file same
  turn -> user picks -> `ui-audit apply` (same loop) -> `npm run smoke` ->
  tick -> `/commit` on the user's word.
- **Copy change:** `triage-copy` -> proposal with source -> user go ->
  edit -> `lint:copy` re-run -> `/commit`.
- **Ship:** `/commit-push` on dev -> user says promote -> `/promote`.
- **End of day:** `/end-session` (commit-push + handoff, never promotes) ->
  `SAFE TO /clear` -> user clears. Promotion to `main` stays manual.

## Scripts these skills own

| Script | Does |
| --- | --- |
| `.claude/skills/verify-twins/resolve-route.mjs [--pattern re] <routes>` | Rendered files per route; hit table for a pattern; "pattern absent" proof |
| `.claude/skills/ui-audit/check-report.mjs review\|apply <report> <routes>` | PASS / FAIL against the audit criteria; the agent runs it to PASS, I run it once |
| `scripts/check-design-tokens.mjs` (`npm run lint:design`) | Seven design-contract checks incl. chart tooltip portal; pre-commit and CI |
| `scripts/lint-copy.mjs` (`npm run lint:copy`) | Jev copy lint, opt-in, key in `.env.local` |
| `npm run smoke` | vitest then Playwright, one command, one Runs row |

## Rules of the road

- Commit, push, promote and handoff are separate asks; none implies another.
- Skills owned by an agent live only in that agent's kit; nothing
  agent-owned goes in `.claude/skills` (memory: `project_skill-locations`).
- A reviewer's report is a claim until `check-report.mjs` says PASS; I
  bounce FAILs back, three rounds, and never re-derive by hand.
