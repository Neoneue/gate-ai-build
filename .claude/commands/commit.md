---
description: Commit the working tree to the current branch, then stamp the day's changelog. Does NOT push.
argument-hint: [optional scope/subject hint, e.g. "billing modal width"]
---

Commit the current work to the **current branch** and update the changelog. Do **not** push.

Optional hint for the commit scope/subject (use as guidance, not verbatim): $ARGUMENTS

## Rules

- **Current branch only.** Run `git branch --show-current`. If it is `main` or `master`, STOP and tell the user — iteration happens on `dev`.
- **Stage intentionally.** Inspect `git status --short` and `git diff`. Stage only the files that make up this change. Never `git add -A`. Never stage untracked non-source files (e.g. `gate-ai-build.code-workspace`) unless they are clearly part of the work.
- **Type-check gate.** Run `npx tsc -b`. If it exits non-zero, STOP and report the errors — do not commit a broken tree.
- **Message style.** Conventional Commits — `feat|fix|refactor|docs|chore(scope): subject` — imperative mood, derived from the actual diff and this session's context. No em dashes. End every commit message with the trailer:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- The pre-commit hook (lint-staged: `ultracite fix` + `eslint --fix`) auto-fixes staged files — let it run; don't fight it.

## Steps

1. Confirm the branch is not `main`/`master` (abort if it is).
2. Review `git status --short` + `git diff`; choose the files to stage.
3. `npx tsc -b` — must be clean (exit 0). Abort on error.
4. Stage the chosen files and commit with a Conventional Commit message + the Co-Authored-By trailer. Capture the short hash (`git rev-parse --short HEAD`).
5. Stamp the day's changelog at **`change-logs/<YYYY>-<MM>/changelog-<M>-<D>.md`** for **today** (local date). The MONTH FOLDER is zero-padded (`2026-07/`); the filename's month/day are NOT (`changelog-7-6.md`). Files were grouped into month folders on 2026-07-29 — never write a changelog to `change-logs/` directly.
   - If the month folder does not exist, create it.
   - If the file does not exist, create it: a `# UI Changelog: YYYY-MM-DD` title, the standard "Running log … written to diff against and replicate …" intro, a `Prior day: [\`changelog-<prev>.md\`](./changelog-<prev>.md)` link to the most recent existing changelog, then a `---` rule. **If the previous day sits in a different month folder, the link is `../<YYYY>-<MM>/changelog-<prev>.md`** — that is the one link that breaks silently.
   - Append a `### <short title> \`<hash>\`` entry under the right `##` section (`Conventions`, `Components`, or `Sections`). The body states: what changed, before → after, and where (file / component), stamped with the feature hash from step 4. Match the voice of existing entries.
6. Add the new entries to **`change-logs/INDEX.md`** — a `### [<date>](./<YYYY>-<MM>/<file>)` block with one bullet per `###` heading (title only, no hash), newest first. The index is how anyone finds a change without globbing ~30 files.
7. Commit the changelog + index together: `docs(changelog): <summary> (<hash>)` + the Co-Authored-By trailer.
8. Report the two commit hashes with one-line summaries. **Do not push.**
