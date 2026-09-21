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

## Summary

- Why: pre-promotion sweep of Models and Teams after the token migration.
- Tested: rams on Models (all twins) and Teams; better-ui on Models.
- Found: 2 HIGH, 6 MEDIUM, 7 LOW across 15 items; 9 applied.
- Opinion: Qualified. One open HIGH (rams-2) on a shared primitive.
- Next: user decides rams-5 by 2026-09-22; apply rams-2.

## Runs

| # | Time (CT) | Skill | Scope | Items | Applied |
| --- | --- | --- | --- | --- | --- |
| 1 | 09:40 | rams | Models (all twins) | rams-1 to rams-9 | 6/9 |
| 2 | 14:10 | rams | Teams | rams-10 to rams-15 | 3/6 |
| 3 | 16:05 | better-ui | Models | bui-1 to bui-6 | 0/6 |

## rams

### Global

- [ ] **rams-2 HIGH** `press-scale` components/ui/button.tsx:41
  - Before: ...
  - After: ...
  - Why: <cause first>, then the consequence.

### Models

- [ ] **rams-1 HIGH** `icon-stroke` pages/Models.tsx:88, pages/ModelsFree.tsx:70
  - Before: ...
  - After: ...
  - Why: ...
- [ ] **rams-3 MEDIUM** ...

### Teams

- [ ] **rams-10 HIGH** ...

### Decision needed

- rams-5: skill wants X, design.md says Y (user, by 2026-09-22).

### Not verified

- rams-8: needs a browser (hover colour).

### Skipped by decision

- rams-4: churn only, no visible effect (2026-09-20).

Verdict (run 1): Qualified. <one sentence>

## better-ui

### Global
...

## Patterns

- `index-as-key`: rams-3, bui-2, bui-5. Lint candidate `react/no-array-index-key`.
- `raw-color`: rams-7, rams-9. Token gap, not a lint.
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
   ends its section with one `Verdict (run N): <Opinion>.` line, where
   Opinion is one of **Clean** (nothing found), **Qualified** (findings,
   none blocking), **Adverse** (a HIGH blocks promotion), **Disclaimer**
   (scope not fully read; say what was skipped). Never "pass" or "fail".
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
   | test-smoke (vitest + Playwright; a run on its own, or the verify step after every apply pass) | `smk` |

   A new skill gets its alias added here on its first run; section headings
   keep the full skill name (`## web-design-guidelines`).
3. **Severity order inside every subsection:** HIGH, then MEDIUM, then LOW.
   New items are inserted at the right severity position, so IDs will not be
   in numeric order inside a subsection. That is expected. Severity is
   likelihood x impact for a design mockup, judged once against this table
   and changed only per rule 8:

   | Tier | Means |
   | --- | --- |
   | HIGH | Visible or logged on the demo path, or a shared primitive, or a WCAG A/AA failure. |
   | MEDIUM | Reachable by a normal user action, one surface, or a design.md rule breach with no user-visible effect yet. |
   | LOW | Consistency, churn, or an edge no demo reaches. |

   The reviewing agent proposes a tier; the user owns the final tier and the
   opinion.
4. **Appending, same skill, new page:** add a `### <Page>` subsection at the
   end of the page list (before the fixed tails). Global findings from that
   run go into the existing `### Global` at their severity position.
5. **Appending, same skill, same page again:** insert into the existing
   subsection by severity. If the new run re-finds an open item, do not add
   a duplicate; leave the original.
6. **Appending, new skill:** add a new `## <skill>` section after the last
   one. Skills are in first-run order, never sorted.
7. **Runs table:** append one row per run with the ID range it produced and
   an `Applied` cell (`applied/total`) updated on every apply pass. This is
   the only place time appears.
8. **Item shape is four lines.** First line `- [ ] **<id> SEVERITY** \`<rule>\`
   path:line`, where `<rule>` is a short kebab slug naming the rule breached
   (a skill rule id like `index-as-key`, or a project slug like
   `motion-reduce`, `focus-visible`, `input-type`). Reuse an existing slug
   before coining one; the slug is what `## Patterns` groups by. Then
   `Before:`, `After:` (exact value), `Why:` (cause first, then consequence,
   one sentence each). Each sub-bullet is ONE line: the offending class
   string, prop or expression in backticks, never a fenced code block and
   never more than one statement. If the fix needs more than a line to
   show, name the pattern and the precedent file instead ("mirror
   EventsTable.tsx:136"). No other sub-bullets except `Severity:` per rule 9.
   Open items under `### Decision needed` end with `(owner, by date)`.
9. **Item lifecycle lives on the item.** Applied: tick the box and append the
   short commit hash to the first line. Skipped: leave unticked and add one
   line under `### Skipped by decision` with the reason and date.
   Re-severitied: change the severity word, move the item to its new
   severity position in the same subsection, and add a `- Severity:` sub
   bullet above `Before:` with the old value, the date and the reason.
   Nothing is ever deleted.
10. **Changelog:** on the first run of the day, add a line to the day's
   `change-logs/YYYY-MM/changelog-M-D.md` naming the audit path. Later runs
   the same day add nothing to the changelog; applying items does, per the
   normal changelog convention, and each applied entry cites the item ID.
11. **Cross-skill overlap** (two skills flag the same root cause): keep both
    items, and note the twin ID in each `Why:` line. Apply once, tick both.
    Follow-on work an audit triggered that is not an item, and overlap
    lists too long for `Why:` lines, go in one optional `## Cross-skill
    notes` section at the very end of the file.
12. **Index.** `audits/INDEX.md` lists every daily file newest first with
    one line per run (skill, scope, item range, applied/total). Add the line
    when the run is written, the same moment the changelog line is added.
13. **Summary and Patterns are the only day-level sections, and both are
    capped.** `## Summary` sits under the title: five bullets, Why / Tested /
    Found (counts by severity, applied count) / Opinion (the worst opinion
    across the day's runs) / Next (open decisions with owner and date).
    Rewritten in place after every run and every apply pass, never
    appended. `## Patterns` is the last section: one line per root-cause
    class (keyed by its rule slug) seen that day with its item IDs and, where
    one exists, the lint rule or hook that would catch it. Twelve lines maximum; a class with a
    line already gets IDs added to it. Nothing else may be added at day
    level, so a day file grows by the summary and the patterns and no more.
