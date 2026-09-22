---
description: End the session in one chain: /commit-push, then /promote, then /handoff, each gated on the previous one passing. Ends with a single "safe to /clear" line only when every step is green; any failure stops the chain and reports where.
argument-hint: [optional PR title hint]
---

Run the three end-of-session commands in order, each one only after the
previous one has fully passed. Typing this command is the user's explicit
approval for all three, including the push to `main` that `/promote` does.

Optional PR title hint (passed to /promote): $ARGUMENTS

## Runs on Opus

The orchestrator delegates this whole chain to one `general-purpose` agent
with `model: opus`, briefed with the four command files, the facts the
commit messages, changelog and handoff need, and this approval. Never on the
orchestrator's own model.

## Rules

- **Sequential, gated.** Order is commit-push, promote, handoff: nothing to
  promote until committed, and handoff last so it records the final branch
  state instead of going stale when the merge lands. `/promote` runs only
  if `/commit-push` passed. `/handoff` runs if `/commit-push` passed, even
  when `/promote` failed, so the next session opens on the failure as its
  first OPEN item rather than on a stale picture. A `/commit-push` failure
  stops everything.
- **Never clear early.** The chain cannot run `/clear` itself (it is a
  client command). It ends with exactly one line, `SAFE TO /clear`, and
  only when all three steps passed and the tree is clean. If any step
  failed, the last line is `NOT SAFE TO /clear: <step> failed` followed by
  the failing output. The user clears by hand on the safe line.
- Every rule in the individual command files applies unchanged: no
  co-author trailer, merge commit only, no CI sleep-poll, sync-back
  mandatory, handoff under 18KB and 500 lines and never committed.

## Steps

1. `/commit-push` per `.claude/commands/commit-push.md`. Evidence: feature
   and docs commit hashes, `dev` push range. Working tree must be clean
   after.
2. `/promote` per `.claude/commands/promote.md`, with the PR title hint.
   Evidence: PR number and URL, merge commit on `main`, sync-back push
   range, `git log --oneline dev..origin/main` empty.
3. `/handoff` per `.claude/commands/handoff.md`, whether or not step 2
   passed. Evidence: `wc -c` and `wc -l` of `handoff.md`, both under the
   caps, branch line reads `dev = main = <merge commit>` on success or
   `dev ahead of main, promote failed: <reason>` as the first OPEN item on
   failure, tree clean (`handoff.md` is gitignored).
4. Final report, under 25 lines: the evidence per step, then the single
   closing line, `SAFE TO /clear` or `NOT SAFE TO /clear: <step> failed`.
