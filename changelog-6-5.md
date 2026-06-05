
# UI Changelog: 2026-06-05

Running log of UI changes made this day. Written for an agent/dev to **diff
against and replicate**: each entry states what changed, before → after, where,
and (for committed work) its commit hash.

Prior days: [`changelog-6-4.md`](./changelog-6-4.md).

**Using this log to make a change:**

- Each entry is tagged with its commit (`[abc1234]`) or `(uncommitted)`. For a
  committed entry, **`git show <hash>` is the exact diff** (the most reliable
  source; this prose is the summary).
- This file logs **deltas, not the full contract.** `design.md` is the
  authoritative design system (token + primitive rules, e.g. Badge's
  no-icons-inside); `data-model.md` is the architecture (routes, types, data).
  Check those before a "fix" so you don't break an unstated invariant.
- **Verify** edits with `npx tsc -b` (must exit 0) and the dev server at
  `localhost:3000`; per-surface deep-links are noted under each surface entry.

Organized by **scope**. Filing test: edit one primitive → **Components**; apply a
rule in N places → **Conventions**; rebuild one surface → **Sections**. Components
are alphabetical; Conventions and Sections are newest-first.

---

## Conventions & tokens

_No entries yet._

## Components

_No entries yet._

## Sections & surfaces

_No entries yet._
</content>
