---
description: Update handoff.md so a fresh session can resume with zero context. Demotes the prior session to a digest instead of wiping it; OPEN items live across sessions.
argument-hint: [optional focus, e.g. "just the Messages table work"]
---

Update **`handoff.md`** (repo root, gitignored, private) so a brand-new session
with no memory of this conversation can pick the work up immediately.

Optional focus for what matters most in this pass: $ARGUMENTS

## The model that makes this file useful

**Current session in full, a little past as digests, open questions forever.**
The file holds exactly ONE `## LATEST` section (this session, full detail), a
`## RECENT` rolling window of at most THREE per-session digests, and a
top-level `## OPEN / next` that no rewrite may touch except to add, update, or
resolve items. History beyond that belongs to git and `change-logs/`. A
handoff that accumulates whole sessions becomes a file nobody reads; one that
wipes them loses 30-minutes-ago context that memory does not have. Demotion is
the middle path.

If `handoff.md` does not exist, create it with the structure in "Shape" below.

## Lifecycle (the wipe policy)

1. **Same-day re-run** (LATEST's date == today): update LATEST **in place**.
   No demotion; a 30-minute-old snapshot is not history.
2. **New session** (LATEST's date != today): **demote** the old LATEST into a
   `### <date>` digest at the TOP of `## RECENT`, then write a fresh LATEST.
3. **Demotion = compression.** The digest is 5-8 lines: commit hashes, one
   line per thread, and ONLY what a fresh session cannot recover from
   `git log` + `change-logs/` + `data-model.md` + memory. Hashes make detail
   recoverable; the digest keeps pointers plus the non-obvious why
   ("e7a08f5 narrowed the table 1580 -> 1484; Status/Security slack +3px,
   SPENT").
4. **RECENT keeps 3 digests.** Demoting a 4th drops the oldest. A digest may
   also compress to one line or drop early if everything in it is verifiably
   owned elsewhere by the time of a later run.
5. **The UNCOMMITTED guard:** a digest recording uncommitted work is NEVER
   dropped or compressed until a later run confirms the work was committed
   (name the hash) or deliberately abandoned (say so).
6. **OPEN items never expire.** An item leaves `## OPEN / next` only when
   resolved, and its removal names where the resolution landed (hash or doc).

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
  user's decision goes under `## OPEN / next` with enough context that it can
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
- **18KB (`wc -c` under 18000) and 500 lines are the hard caps.** Check both
  with `wc -c handoff.md; wc -l handoff.md` before finishing. The byte cap
  is what keeps the SessionStart hook from truncating the file to a 2KB
  preview. Over either cap, compress RECENT first, then LATEST narration
  (point at changelogs / git log instead of restating them), never OPEN. The file must hold the entire last session at the detail a
  fresh session needs to resume without the user filling anything in.
- **The RESUME PROTOCOL block stays at the very top and under 1KB.** The
  SessionStart hook truncates output over ~20KB to a 2KB preview, so this
  block is the only part guaranteed to arrive. It tells the next session to
  read the persisted path in full and to open its first reply with
  `I read the handoff doc (<date>). Top OPEN: <item>.` Refresh its "Top OPEN item
  right now" line on EVERY run to match the first item under `## OPEN / next`.

## Shape

```markdown
# Handoff - <YYYY-MM-DD> (CT) - resume here

## RESUME PROTOCOL (read this block first, every session)

<verbatim from the current file: hook truncation warning, read-in-full rule,
the `I read the handoff doc` opening line, the 18KB + 500-line caps and section order, then
"Top OPEN item right now: <first OPEN item>" refreshed this run>

<one-paragraph preamble: what this file is, the no-em-dash rule, how the user
works (branch discipline, literal values, dislikes reflexive re-verification)>

## OPEN / next

<decisions awaiting the user, work deliberately paused, stale docs to refresh.
Lives across sessions; items leave only when resolved, naming where the
resolution landed.>

## LATEST - <YYYY-MM-DD> (CT)

<2-3 lines: what thread(s), committed or not, branch, tree state, verification
state, dev server port>

### Shipped this session (committed | uncommitted)
<grouped by page/area. Every entry names the file and the concrete value.>

### <Any measured tables worth preserving>
<If this session established numbers that were expensive to measure, put the
table here AND say where the same numbers live in the code.>

## Working agreements (permanent)
## Tooling gotchas (permanent)

## RECENT - rolling digest (max 3, newest first)

### <YYYY-MM-DD> - <one-line theme>
<5-8 lines: hashes, one line per thread, non-derivable facts only.
Mark UNCOMMITTED work loudly; that mark pins the digest until resolved.>
```

## Steps

1. Read the existing `handoff.md` if there is one. Keep the RESUME PROTOCOL
   block, the preamble and both permanent sections; note anything in them
   that this session proved stale.
2. Establish real state: `git branch --show-current`, `git status --short`, and
   the verification commands above. Do not guess any of it.
3. Apply the lifecycle: same-day -> update LATEST in place; new day -> demote
   old LATEST to the top of RECENT (compressed per rule 3), drop the oldest
   digest past 3 (honoring the UNCOMMITTED guard), then write the fresh LATEST.
   Update the title date to today.
4. Update `## OPEN / next`: add new items, refresh context on standing ones,
   remove resolved ones with a pointer to where they landed.
5. Fold any durable lesson into the permanent sections, and correct anything
   there that has gone stale.
6. Refresh the "Top OPEN item right now" line in the RESUME PROTOCOL block
   and confirm `wc -c handoff.md` is under 18000 and `wc -l handoff.md` is
   500 or under.
7. Run `npm run lint:md` (handoff.md is excluded from the glob, but the run
   confirms you did not break a tracked doc while editing).
8. Report in one or two lines what the handoff now says is open, so the user
   can correct the framing before the session ends.
