# Plan 001: Move the design-token and markdown gates into pre-commit and CI

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat ef1af47..HEAD -- scripts/check-design-tokens.mjs .lintstagedrc.json .github/workflows/ci.yml .markdownlint-cli2.jsonc CLAUDE.md change-logs/ button-sizing-staging-handoff.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `ef1af47`, 2026-07-27

## Why this matters

This repo's central contract is its design system: `design.md` (1,133 lines), a
bespoke guard script (`scripts/check-design-tokens.mjs`), and three rule files
under `.claude/rules/`. Design-token violations are the single most likely
defect class here because visual iteration is the most common change type. Yet
the guard only runs on `npm run lint`, which developers hit at push time and CI
hits after that — the slowest possible feedback point for the most common
change. Markdown linting is worse: `markdownlint-cli2` is installed and
configured, `npm run lint:md` exists, and **nothing ever invokes it** — not
pre-commit, not CI. The repo gains a changelog file every working day and no
check ever reads one.

After this plan: a token violation fails in about a second at `git commit`
instead of minutes later in CI, and markdown is actually gated.

## Current state

### The four files you will modify

- `scripts/check-design-tokens.mjs` — the design-token guard. **Walks a
  hardcoded root and ignores its arguments.** This is the crux of the plan.
- `.lintstagedrc.json` — pre-commit tasks, run by husky via `npx lint-staged`.
- `.github/workflows/ci.yml` — the single `verify` job, required by branch
  protection on `main`.
- `.markdownlint-cli2.jsonc` — markdownlint ignore list.

### Critical fact: the guard script ignores `process.argv`

`scripts/check-design-tokens.mjs:21` and `:47`:

```js
const ROOT = "src";
// ...
for (const file of walk(ROOT)) {
```

There is no `process.argv` read anywhere in the file. `lint-staged` appends the
staged filenames to each command it runs, so wiring this script into
`.lintstagedrc.json` as-is would produce
`node scripts/check-design-tokens.mjs src/pages/Foo.tsx` — and the script would
**ignore that argument and re-scan all of `src/` anyway**. That is not merely
slow: it means a developer touching one file could have their commit blocked by
a pre-existing violation in a file they never opened. Step 1 fixes this by
teaching the script to accept file paths, falling back to the full walk when
given none (so `npm run lint:design` and CI keep their current behavior).

### Current backlog: verified, and smaller than it looks

Both numbers below were measured at commit `ef1af47`. Re-measure in Step 0.

- **`npm run lint:design` → exit 0, zero violations.** The design half of this
  plan adds a gate to an already-clean codebase. No backlog to clear.
- **`npm run lint:md` → 105 errors, but only 9 are in git-TRACKED files.** The
  other 96 live in `docs/**` and `handoff.md`, which are gitignored, local-only,
  and therefore absent from a CI checkout entirely.

The 9 tracked violations, which Step 3 fixes:

| File | Errors |
| --- | --- |
| `change-logs/changelog-6-16.md` | 5 |
| `change-logs/changelog-7-9.md` | 1 |
| `change-logs/changelog-6-23.md` | 1 |
| `button-sizing-staging-handoff.md` | 1 |
| `CLAUDE.md` | 1 |

### Current file contents

`.lintstagedrc.json` (complete file):

```json
{
  "*.{js,jsx,ts,tsx,json,jsonc,css,scss,md,mdx}": ["npx ultracite fix"],
  "*.{ts,tsx}": ["npx eslint --fix --max-warnings=0"]
}
```

`.markdownlint-cli2.jsonc` (complete file):

```jsonc
{
  "ignores": ["node_modules/**", ".claude/**", "dist/**", "build/**", ".git/**"]
}
```

`.github/workflows/ci.yml`, the steps of the `verify` job:

```yaml
      - name: Lint (eslint + biome)
        run: npm run lint

      - name: Test
        run: npm test

      - name: Build (tsc -b + vite)
        run: npm run build
```

`package.json` scripts, relevant entries:

```json
"lint": "eslint . && ultracite check && npm run lint:design",
"lint:design": "node scripts/check-design-tokens.mjs",
"lint:md": "markdownlint-cli2 \"**/*.md\"",
"lint:md:fix": "markdownlint-cli2 --fix \"**/*.md\"",
```

`.husky/pre-commit` (complete file):

```sh
#!/bin/sh
npx lint-staged
```

### Conventions to match

- **Node/ESM**: `scripts/check-design-tokens.mjs` is ESM with `node:`-prefixed
  imports (`import { readdirSync, readFileSync } from "node:fs";`). Keep that
  style; do not introduce CommonJS or a bundler.
- **Commit messages**: Conventional Commits, imperative, no em dashes, with a
  trailer. Example from `git log`:
  `chore(ci): ...` / `fix(ui): name the Overview chart select, align the Policies check bullet`
- **No changelog entry needed.** `change-logs/` is for **UI** changes only
  (see `CLAUDE.md`). This plan is tooling. Do not add a changelog entry.

## Commands you will need

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Design guard (full) | `npm run lint:design` | exit 0, `✓ design-token guard: no invented colors or type sizes.` |
| Design guard (scoped) | `node scripts/check-design-tokens.mjs src/pages/Dashboard.tsx` | exit 0 |
| Markdown lint | `npm run lint:md` | exit 0 after Step 3 |
| Markdown autofix | `npm run lint:md:fix` | exit 0 or fewer errors |
| Full lint | `npm run lint` | exit 0 |
| Typecheck + build | `npm run build` | exit 0 |
| Tests | `npm test` | all pass |
| Count tracked md errors | see Step 0 | 9 before, 0 after Step 3 |

## Scope

**In scope** (the only files you may modify):

- `scripts/check-design-tokens.mjs`
- `.lintstagedrc.json`
- `.markdownlint-cli2.jsonc`
- `.github/workflows/ci.yml`
- `change-logs/changelog-6-16.md`, `change-logs/changelog-7-9.md`,
  `change-logs/changelog-6-23.md` (markdown formatting fixes only)
- `button-sizing-staging-handoff.md` (markdown formatting fix only)
- `CLAUDE.md` (markdown formatting fix only)

**Out of scope** (do NOT touch, even though they look related):

- **Any file under `src/`.** This plan changes tooling, not application code.
  If the new gate reports a violation in `src/`, that is a STOP condition, not
  an invitation to fix it.
- **`docs/**` and `handoff.md`.** Gitignored and local-only. They will show
  markdown errors on your machine. Adding them to the ignore list is Step 2;
  editing their contents is forbidden.
- **`package.json` scripts.** `lint:design` and `lint:md` already exist and are
  correct. Do not rename or re-wire them.
- **`.husky/pre-commit`.** It correctly delegates to `lint-staged`; all
  pre-commit changes go in `.lintstagedrc.json`.
- **`eslint.config.js`, `biome.jsonc`.** Deliberately tuned. Not part of this.
- **The `FONT_ALLOW` allowlist** in the guard script (lines 28-31). Those two
  entries are documented pre-existing exceptions. Preserve them exactly.

## Git workflow

- Work on the branch you were given. Do NOT switch branches, and never commit
  to `main`.
- One commit per step is fine, or a single commit at the end. Conventional
  Commits style, e.g.
  `chore(tooling): scope the design guard to changed files and gate markdown`.
- Do NOT push and do NOT open a PR.

## Steps

### Step 0: Record the baseline

Before changing anything, capture the current numbers so you can prove your work
later.

```bash
npm run lint:design; echo "design exit: $?"
npm run lint:md 2>&1 | grep -oE "^[^ :]+\.md" | sort -u | while read -r f; do
  git ls-files --error-unmatch "$f" >/dev/null 2>&1 && echo "$f"
done | wc -l
```

**Verify**: design exits 0. The second command prints the number of **tracked**
files with markdown errors — expect `5`.

If design does NOT exit 0, STOP (see STOP conditions — the codebase drifted and
a backlog now exists that this plan did not budget for).

### Step 1: Teach the guard script to accept file paths

Edit `scripts/check-design-tokens.mjs`. Replace the hardcoded walk with an
argv-aware file list. Keep everything else — the regexes, `FONT_ALLOW`, the
error formatting, the exit codes — byte-identical.

Target shape (replace the `const ROOT = "src";` line at :21 and the
`for (const file of walk(ROOT))` line at :47):

```js
const ROOT = "src";

// ... walk() unchanged ...

// Accept explicit file paths (lint-staged passes staged filenames). With no
// arguments, fall back to a full `src` walk so `npm run lint:design` and CI
// keep scanning everything.
const argFiles = process.argv.slice(2).filter((f) => /\.(tsx?|css)$/.test(f));
const files = argFiles.length > 0 ? argFiles : walk(ROOT);

const violations = [];
for (const file of files) {
```

Two requirements:

1. The `.filter()` matters. `lint-staged` may pass paths this guard does not
   handle; silently skipping non-`.ts/.tsx/.css` files is correct.
2. Do not change the `walk` function, the regexes, or `FONT_ALLOW`.

**Verify**, all three must hold:

```bash
npm run lint:design                                        # exit 0, full-scan message
node scripts/check-design-tokens.mjs src/pages/Dashboard.tsx   # exit 0
node scripts/check-design-tokens.mjs README.md             # exit 0 (filtered out, scans nothing)
```

Then prove the guard still catches a real violation, using a temporary file you
delete immediately:

```bash
printf 'const a = "bg-[#ff0000]";\n' > src/__guard_probe.tsx
node scripts/check-design-tokens.mjs src/__guard_probe.tsx; echo "exit: $?"
rm src/__guard_probe.tsx
```

**Expected**: exit `1`, with a line containing `[color]` and `bg-[#`. If it
exits 0, your argv wiring is not reaching the scan loop — fix before moving on.
Confirm `src/__guard_probe.tsx` is deleted (`git status` must be clean of it).

### Step 2: Ignore untracked local-only markdown

Edit `.markdownlint-cli2.jsonc` to add `docs/**` and `handoff.md`. These are
gitignored, local-only working notes (documented in `CLAUDE.md`); they generate
96 of the 105 current errors and must never gate a commit.

```jsonc
{
  "ignores": [
    "node_modules/**",
    ".claude/**",
    "dist/**",
    "build/**",
    ".git/**",
    "docs/**",
    "handoff.md"
  ]
}
```

**Verify**: `npm run lint:md 2>&1 | grep -cE "^[^ ]+\.md:[0-9]+"` → prints `9`
(down from 105). Every remaining error is in a tracked file.

### Step 3: Fix the 9 markdown errors in tracked files

Run the autofixer first, then handle whatever it cannot fix:

```bash
npm run lint:md:fix
npm run lint:md
```

Fix any remainder by hand. These are formatting-only edits: list markers, code
spans, spacing, heading levels. **Do not change the meaning, wording, or
structure of any document** — in particular `CLAUDE.md` is the project's
agent-instruction file and its content is load-bearing.

**Verify**: `npm run lint:md` → exit 0, no error lines.

If a fix would require rewording prose rather than reformatting it, prefer
disabling that one rule for that one line with an inline
`<!-- markdownlint-disable-next-line MDxxx -->` comment, and note it in your
report.

### Step 4: Wire both gates into pre-commit

Edit `.lintstagedrc.json`. Add the design guard for source files and markdown
lint for markdown files. Order matters: the existing `ultracite fix` and
`eslint --fix` entries stay first so autofixers run before the guards check.

```json
{
  "*.{js,jsx,ts,tsx,json,jsonc,css,scss,md,mdx}": ["npx ultracite fix"],
  "*.{ts,tsx}": ["npx eslint --fix --max-warnings=0"],
  "*.{ts,tsx,css}": ["node scripts/check-design-tokens.mjs"],
  "*.md": ["npx markdownlint-cli2"]
}
```

**The markdown entry is check-only on purpose — do NOT add `--fix`.** This was
revised during execution after `markdownlint --fix` corrupted `CLAUDE.md`: it
read the wrapped conjunction in `binds to design.md + src/index.css + .claude/rules/`
as a `+`-style list bullet, rewrote it to `-`, and produced a sentence that
means something different while still passing lint. An autofixer that rewrites
English prose can produce a green check over wrong content. Check-only blocks
the commit and lets a human decide. This is safe because tracked markdown is at
zero violations after Step 3 and `docs/**` is ignored after Step 2.

Note also `markdownlint-cli2` rather than `npm run lint:md`: lint-staged appends
the staged file paths, and the npm script has a hardcoded `"**/*.md"` glob that
would fight them.

**Verify** with a real commit cycle on a throwaway change:

```bash
printf '\n' >> change-logs/changelog-7-27.md
git add change-logs/changelog-7-27.md
git commit -m "test: verify pre-commit gates"   # must SUCCEED
git reset --hard HEAD~1
```

Then verify the guard actually blocks a bad commit:

```bash
printf 'export const probe = "text-[13px]";\n' > src/__guard_probe.tsx
git add src/__guard_probe.tsx
git commit -m "test: guard should block this"   # must FAIL, non-zero exit
git reset HEAD src/__guard_probe.tsx && rm src/__guard_probe.tsx
```

**Expected**: the first commit succeeds; the second is rejected with the
design-token guard's `✖` message. Confirm `git status` is clean afterward and
`src/__guard_probe.tsx` no longer exists.

### Step 5: Add markdown lint to CI

Edit `.github/workflows/ci.yml`. Add one step after the existing lint step:

```yaml
      - name: Lint (eslint + biome)
        run: npm run lint

      - name: Lint (markdown)
        run: npm run lint:md

      - name: Test
        run: npm test
```

Do not touch the other steps, the `runs-on`, the Node version, or the triggers.
`npm run lint` already includes `lint:design`, so the design guard needs no CI
change.

**Verify**: `npm run lint && npm run lint:md && npm test && npm run build` → all
exit 0. This is the same sequence CI will run.

## Test plan

No unit tests. This plan changes build tooling, and the repo has no existing
test pattern for scripts (`vitest.config.ts` sets `include: ["src/**/*.test.{ts,tsx}"]`,
so a test under `scripts/` would not even be collected). The verification is
behavioral, via the probe commits in Steps 1 and 4, which assert both halves of
the gate: it passes clean input and rejects a known violation.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run lint` exits 0
- [ ] `npm run lint:md` exits 0
- [ ] `npm test` exits 0
- [ ] `npm run build` exits 0
- [ ] `node scripts/check-design-tokens.mjs src/pages/Dashboard.tsx` exits 0
- [ ] `grep -n "process.argv" scripts/check-design-tokens.mjs` returns a match
- [ ] `grep -c "check-design-tokens" .lintstagedrc.json` returns 1
- [ ] `grep -c "lint:md" .github/workflows/ci.yml` returns 1
- [ ] `grep -c "docs/\*\*" .markdownlint-cli2.jsonc` returns 1
- [ ] `git status --short` shows no modified file outside the "In scope" list,
      and no leftover `src/__guard_probe.tsx`
- [ ] `git diff --stat ef1af47..HEAD -- src/` shows **no** changes under `src/`
- [ ] `plans/README.md` status row for 001 updated

## STOP conditions

Stop and report back (do not improvise) if:

- **`npm run lint:design` does not exit 0 at Step 0.** The plan assumes a clean
  design baseline. A pre-existing backlog means wiring it into pre-commit will
  block unrelated commits, and the operator must decide whether to clear the
  backlog first. Report the violation list; do not fix `src/` files yourself.
- **The tracked-markdown-error count at Step 0 is materially above 9.** Report
  the new count and the files; a much larger backlog changes the effort.
- **`npm run lint:md:fix` rewrites prose rather than formatting**, or touches a
  file outside the in-scope list. Revert and report.
- **The Step 1 probe exits 0** (guard fails to flag `bg-[#ff0000]`) after one
  fix attempt. Your argv change broke the scan loop.
- **The Step 4 blocking probe succeeds in committing.** The lint-staged wiring
  is not running the guard; report rather than forcing it.
- Any step's verification fails twice after a reasonable fix attempt.
- The fix appears to require touching an out-of-scope file, especially anything
  under `src/`.

## Maintenance notes

For whoever owns this next:

- **Never put `--fix` on the markdown hook.** During execution,
  `markdownlint --fix` rewrote a wrapped `+` conjunction in `CLAUDE.md` into a
  `-`, silently changing the meaning of the project's agent-instruction file
  while leaving lint green. The hook is deliberately check-only. Verified after
  the fix: running `npx markdownlint-cli2 --fix CLAUDE.md` now produces zero
  changes, because the sentence was reflowed so no line begins with a list
  marker. If you ever reflow that paragraph again, keep the `+` at end-of-line.
- **The argv fallback is load-bearing.** `npm run lint:design` with no arguments
  must keep full-scanning `src/`, because CI depends on it via `npm run lint`.
  If someone later "simplifies" the script to require arguments, CI silently
  stops checking the whole tree while still reporting green.
- **`docs/**` is ignored by markdownlint deliberately**, not accidentally. It is
  gitignored local-only content (see `CLAUDE.md`). If `docs/` is ever committed,
  revisit that ignore.
- **What a reviewer should scrutinize**: that `src/` has zero changes in the
  diff, that `FONT_ALLOW` in the guard script is untouched, and that the
  markdown fixes are formatting-only (skim the `CLAUDE.md` diff especially — it
  is the agent-instruction file).
- **Deferred out of this plan**: adding `lint:design` to CI as its own step
  (unnecessary, `npm run lint` already chains it), and running `markdownlint`
  over `.claude/**` (deliberately ignored). Also deferred: giving the guard a
  `--staged` flag; the positional-args approach is simpler and needs no
  lint-staged config gymnastics.
