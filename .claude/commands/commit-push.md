---
description: Run the /commit flow (commit + changelog), then push the current branch to origin.
argument-hint: [optional scope/subject hint]
---

Do everything the `/commit` command does, then push the current branch.

Optional hint for the commit scope/subject: $ARGUMENTS

## Steps

1. Execute the full `/commit` procedure — read `.claude/commands/commit.md` and follow every step and rule: confirm branch ≠ `main`/`master`, stage intentionally, `npx tsc -b` gate, feature commit with the Co-Authored-By trailer, stamp `change-logs/<YYYY>-<MM>/changelog-<M>-<D>.md` + `change-logs/INDEX.md`, then the `docs(changelog)` commit.
2. Push the **current branch only**:
   - Re-confirm you are NOT on `main`/`master`. If you are, STOP — never push `main` directly; promotion to `main` is a separate step requiring explicit approval.
   - `git push origin "$(git branch --show-current)"`.
3. Report the two commit hashes, the branch, and the push range (e.g. `5b24ed6..c437f6e`).
