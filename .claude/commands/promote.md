---
description: Promote dev to main: divergence check, throwaway test-merge + tsc, PR with a merge commit, one CI watch, then sync main back into dev. Never squash, never sleep-poll, never push main without the user's explicit go.
argument-hint: [optional PR title hint]
---

Promote the `dev` preview branch to `main` (prod, Vercel deploys `origin/main`).
This command is the ONLY path that pushes `main`. Running it is the user's
explicit approval for the promotion; nothing else is.

Optional PR title hint: $ARGUMENTS

## Runs on Opus

The orchestrator delegates this whole command to one `general-purpose` agent with `model: opus`, briefed with this file, the facts it needs, and the approval the user gave. Never run the git or docs steps on the orchestrator's own model (user, 2026-09-21).

## Rules

- `dev` is permanent. `main` is prod. Never commit on `main`, never rebase or
  squash the promotion, never force-push either branch, never delete `dev`.
- Merge method is ALWAYS a merge commit (`gh pr merge --merge`). Squash or
  rebase mints new SHAs and makes long-lived `dev` diverge instantly.
- Never wait on CI with a foreground sleep loop (user, 2026-09-04, twice).
  One `gh run watch <id> --exit-status` or one `gh pr checks` read, then act.
- The sync-back (step 7) is mandatory. Skipping it is what grew `dev..main` to
  116 commits on 2026-07-16.
- Any non-zero gate stops the command. Report the output; do not work around it.

## Steps

1. `git branch --show-current` must be `dev`; `git status --short` must be
   empty; `git fetch origin`.
2. Divergence: `git log --oneline --no-merges dev..origin/main`. Non-empty
   means `main` holds work `dev` lacks: STOP, show the list, ask whether to
   merge `main` into `dev` first (that is the usual answer), and end the turn.
3. Local gates on `dev`: `npx tsc -b`, `npm exec -- ultracite check`,
   `npm run lint:design`, `npm run lint:md`. CI runs vitest and build in
   `verify`; run `npm run smoke` here only if the promotion touches runtime
   code and the user has not seen a green run this session.
4. Test-merge when `origin/main` is NOT a strict ancestor of `dev`
   (`git merge-base --is-ancestor origin/main dev` non-zero): in a
   throwaway worktree `git worktree add --detach <scratchpad>/promote origin/main`,
   `git merge dev`, symlink `node_modules`, `npx tsc -b` on the merged tree,
   then `git worktree remove --force`. Textual-clean is not build-clean.
   When `origin/main` IS an ancestor, the merged tree equals `dev`; skip.
5. PR: `gh pr create --base main --head dev --title "<hint or summary of the
   commits since main>" --body "<one bullet per feature commit, taken from
   git log main..dev --no-merges>"`. The body ends with the attribution line
   the session requires, if any; commits never carry a co-author trailer.
6. CI, once: `gh pr checks <n> --watch --fail-fast` (single call, no loop).
   Green: `gh pr merge <n> --merge` (auto-merge is disabled on this repo).
   Red: report the failing job's log and STOP.
7. Sync back, same turn: `git fetch origin && git merge --ff-only origin/main
   && git push origin dev`. If `--ff-only` refuses, `git merge --no-ff
   origin/main -m "Sync main back into dev"` and push. Confirm
   `git log --oneline dev..origin/main` is empty.
8. Report: PR number and URL, the merge commit on `main`, the `dev` push
   range, and `dev..main` = 0. Then update `handoff.md`'s branch line only
   if the user asks for a handoff.
