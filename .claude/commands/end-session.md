---
description: End the session in two steps: /commit-push, then /handoff, gated on the first passing. Does NOT promote; promotion to main is manual via /promote. Ends with a single "safe to /clear" line only when both steps are green.
argument-hint: none
---

Run the two end-of-session commands in order, the second only after the
first has fully passed. Typing this command is the user's explicit approval
for both.

**This command does NOT promote.** `dev` is pushed, nothing touches `main`.
Promotion is a separate, manual `/promote` whenever the user wants prod
updated (user, 2026-09-22: the CI watch inside promote made the chain take
about fifteen minutes, and most sessions do not need prod moved).

## Runs on Opus

The orchestrator delegates this whole chain to one `general-purpose` agent
with `model: opus`, briefed with the three command files, the facts the
commit messages, changelog and handoff need, and this approval. Never on the
orchestrator's own model.

## Rules

- **Sequential, gated.** Order is commit-push then handoff: nothing to
  record until committed, and the handoff last so it reports the final
  branch state. A `/commit-push` failure stops everything.
- **Never touch `main`.** No PR, no merge, no sync-back. If `dev` is ahead
  of `main`, the handoff says so as a fact, not as a failure.
- **Never clear early.** The chain cannot run `/clear` itself (it is a
  client command). It ends with exactly one line, `SAFE TO /clear`, and
  only when both steps passed and the tree is clean. If a step failed, the
  last line is `NOT SAFE TO /clear: <step> failed` followed by the failing
  output. The user clears by hand on the safe line.
- Every rule in the individual command files applies unchanged: no
  co-author trailer, handoff under 18KB and 500 lines and never committed.

## Steps

1. `/commit-push` per `.claude/commands/commit-push.md`. Evidence: feature
   and docs commit hashes, `dev` push range. Working tree must be clean
   after.
2. `/handoff` per `.claude/commands/handoff.md`. Evidence: `wc -c` and
   `wc -l` of `handoff.md`, both under the caps, and a branch line reading
   `dev = main = <hash>` when they match or `dev ahead of main by N commits,
   promote manually` when they do not. Tree clean (`handoff.md` is
   gitignored).
3. Final report, under 20 lines: the evidence per step, then the single
   closing line, `SAFE TO /clear` or `NOT SAFE TO /clear: <step> failed`.
