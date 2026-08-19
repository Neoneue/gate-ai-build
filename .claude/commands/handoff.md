---
description: Rewrite handoff.md so a fresh session can resume with zero context. Current state only, never an accumulating log.
argument-hint: [optional focus, e.g. "just the Messages table work"]
---

Rewrite **`handoff.md`** (repo root, gitignored, private) so a brand-new session
with no memory of this conversation can pick the work up immediately.

Optional focus for what matters most in this pass: $ARGUMENTS

## The one rule that makes this file useful

**It is CURRENT STATE, not a diary.** The file has a permanent preamble plus
exactly ONE `## LATEST — <date>` section. **REPLACE** that section wholesale
every time. Do not append a new dated section, do not keep the previous
session's threads, do not build up history — git and `change-logs/` already own
history. A handoff that accumulates becomes a file nobody reads.

If `handoff.md` does not exist, create it with the structure in "Shape" below.

## Rules

- **No em dashes.** Anywhere. This is the user's standing writing preference and
  it applies to private files too.
- **Facts over narrative.** Exact file paths, exact identifiers, exact measured
  numbers. "Widened the column" is useless; "`w-[13%]`, 205px, need 156px" is
  the point of the file.
- **State what is COMMITTED vs UNCOMMITTED**, the branch, and whether the tree
  is clean. A resuming session that assumes work is committed will lose it.
- **Record the verification state** as of right now: `npx tsc -b`,
  `npm exec -- ultracite check src`, `npm run lint:design`, `npm run lint:md`,
  and the vitest pass count. Run them if you are not certain.
- **Open questions are the most valuable content.** Anything awaiting the
  user's decision goes under `### OPEN / next` with enough context that it can
  be asked again without re-deriving it. Include the options already put to
  them and any recommendation already made.
- **Corrections belong in the file.** If something you reported earlier turned
  out wrong, or a doc/comment is now stale, say so explicitly. Stale beliefs
  carried into a fresh session are worse than no notes.
- **Keep the permanent sections permanent.** `## Working agreements` and
  `## Tooling gotchas` survive across sessions. Only add to them when you
  learned something durable (a real gotcha, an enforced protocol, a measurement
  method that cost time to discover), and FIX them when they go stale rather
  than leaving a contradiction.
- **~750 lines is a backstop, not a target.** If the LATEST section is getting
  long, it is probably narrating instead of stating.

## Shape

```markdown
# Handoff — <YYYY-MM-DD> (CT) — resume here

<one-paragraph preamble: what this file is, the no-em-dash rule, how the user
works (branch discipline, literal values, dislikes reflexive re-verification)>

## Working agreements (permanent)
## Tooling gotchas (permanent)

## LATEST — <YYYY-MM-DD> (CT)

<2-3 lines: what thread(s), committed or not, branch, tree state, verification
state, dev server port>

### Shipped this session (committed | uncommitted)
<grouped by page/area. Every entry names the file and the concrete value.>

### <Any measured tables worth preserving>
<If this session established numbers that were expensive to measure, put the
table here AND say where the same numbers live in the code.>

### OPEN / next
<decisions awaiting the user, work deliberately paused, stale docs to refresh>
```

## Steps

1. Read the existing `handoff.md` if there is one. Keep the preamble and both
   permanent sections; note anything in them that this session proved stale.
2. Establish real state: `git branch --show-current`, `git status --short`, and
   the verification commands above. Do not guess any of it.
3. Replace the `## LATEST` section entirely. Update the title date to today.
4. Fold any durable lesson into the permanent sections, and correct anything
   there that has gone stale.
5. Run `npm run lint:md` (handoff.md is excluded from the glob, but the run
   confirms you did not break a tracked doc while editing).
6. Report in one or two lines what the handoff now says is open, so the user
   can correct the framing before the session ends.
