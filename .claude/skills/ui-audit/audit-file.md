# Daily audit file: shape and append rules

One file per day: `audits/YYYY-MM/audit-M-D.md`. Every review run that day
lands in it. Create it on the first run; append on every later run. Never
start a second file for the same day, never rewrite what an earlier run
wrote, never renumber.

## Shape

```markdown
# Audit - YYYY-MM-DD

Read-only reviews by the `front-end-developer` agent. Checklist: tick an
item when it is applied and verified, then append the commit hash to the
item's first line. Pick items by ID ("rams-3, wdg-7"). Paths are relative
to `src/`. Already decided, not re-flagged: see the settled table in
`.claude/skills/ui-audit/SKILL.md`.

## Runs

| # | Time (CT) | Skill | Scope | Items |
| --- | --- | --- | --- | --- |
| 1 | 09:40 | rams | Models (all twins) | rams-1 to rams-9 |
| 2 | 14:10 | rams | Teams | rams-10 to rams-15 |
| 3 | 16:05 | better-ui | Models | bui-1 to bui-6 |

## rams

### Global

- [ ] **rams-2 HIGH** components/ui/button.tsx:41
  - Before: ...
  - After: ...
  - Why: ...

### Models

- [ ] **rams-1 HIGH** pages/Models.tsx:88, pages/ModelsFree.tsx:70
  - Before: ...
  - After: ...
  - Why: ...
- [ ] **rams-3 MEDIUM** ...

### Teams

- [ ] **rams-10 HIGH** ...

### Decision needed

- rams-5: skill wants X, design.md says Y. Waiting on the user.

### Not verified

- rams-8: needs a browser (hover colour).

### Skipped by decision

- rams-4: churn only, no visible effect (2026-09-20).

## better-ui

### Global
...
```

## Rules

1. **Section = skill, subsection = page.** One `## <skill>` per skill (full
   name, not the alias), created
   the first time that skill runs that day. Inside it, an optional
   `### Scope and inventory` only when the Runs row cannot hold the scope,
   then `### Global` first
   (shared primitives, tokens, anything reached from more than one page),
   then one `### <Page>` per audited page in the order they were audited.
   Then the fixed tails, always in this order and only when non-empty:
   `### Decision needed`, `### Not verified`, `### Skipped by decision`,
   `### Compliant, checked and clean` (rules swept that produced nothing,
   one line each, so the next run of that skill can skip them). Each run
   ends its section with one `Verdict (run N):` line.
2. **IDs are `<alias>-N`.** The alias is the skill's short code from the
   table below; N is a per-skill counter for the day, starting at 1 and
   only ever going up. The next N is one more than the highest N
   already in that skill's section. An ID is never reused or renumbered,
   even when items move between subsections or get skipped. Uniqueness is
   what lets the user say "rams-3" tomorrow and mean the same thing.

   | Skill | Alias |
   | --- | --- |
   | better-ui | `bui` |
   | impeccable (audit) | `imp` |
   | make-interfaces-feel-better | `mifb` |
   | rams | `rams` |
   | react-best-practices | `rbp` |
   | transitions-dev | `tdev` |
   | transitions-polish | `tpol` |
   | web-design-guidelines | `wdg` |
   | composition-patterns | `comp` |
   | shadcn | `shad` |
   | brand | `brand` |
   | oklch-skill | `oklch` |
   | svg-animations | `svga` |
   | color-audit (manual token sweep) | `col` |

   A new skill gets its alias added here on its first run; section headings
   keep the full skill name (`## web-design-guidelines`).
3. **Severity order inside every subsection:** HIGH, then MEDIUM, then LOW.
   New items are inserted at the right severity position, so IDs will not be
   in numeric order inside a subsection. That is expected.
4. **Appending, same skill, new page:** add a `### <Page>` subsection at the
   end of the page list (before the fixed tails). Global findings from that
   run go into the existing `### Global` at their severity position.
5. **Appending, same skill, same page again:** insert into the existing
   subsection by severity. If the new run re-finds an open item, do not add
   a duplicate; leave the original.
6. **Appending, new skill:** add a new `## <skill>` section after the last
   one. Skills are in first-run order, never sorted.
7. **Runs table:** append one row per run with the ID range it produced. This
   is the only place time appears.
8. **Item lifecycle lives on the item.** Applied: tick the box and append the
   short commit hash to the first line. Skipped: leave unticked and add one
   line under `### Skipped by decision` with the reason and date.
   Re-severitied: change the severity word, move the item to its new
   severity position in the same subsection, and add a `- Severity:` sub
   bullet above `Before:` with the old value, the date and the reason.
   Nothing is ever deleted.
9. **Changelog:** on the first run of the day, add a line to the day's
   `change-logs/YYYY-MM/changelog-M-D.md` naming the audit path. Later runs
   the same day add nothing to the changelog; applying items does, per the
   normal changelog convention, and each applied entry cites the item ID.
10. **Cross-skill overlap** (two skills flag the same root cause): keep both
    items, and note the twin ID in each `Why:` line. Apply once, tick both.
    Follow-on work an audit triggered that is not an item, and overlap
    lists too long for `Why:` lines, go in one optional `## Cross-skill
    notes` section at the very end of the file.
11. **Index.** `audits/INDEX.md` lists every daily file newest first with
    one line per run (skill, scope, item range). Add the line when the run
    is written, the same moment the changelog line is added.
