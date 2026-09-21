# Audit index

Every review run, newest first. One file per day, grouped by month. Each
file is a checklist: section per skill, subsection per page, items
`<alias>-N` ordered HIGH > MEDIUM > LOW, ticked with the commit hash when
applied. Rules and the alias table: `.claude/skills/ui-audit/audit-file.md`.

**Find the day, then open only that file.**

## September 2026

### [2026-09-21](./2026-09/audit-9-21.md)

- `smk` test-smoke after applying rbp-3/4/6/8/9/10/13: 0 items. Clean. rbp-12 skipped.

### [2026-09-20](./2026-09/audit-9-20.md)

- `wdg` web-design-guidelines, whole site: wdg-1 to wdg-32, 21/32 applied.
  Qualified; wdg-15 kept by decision; the other ten skipped as mobile-only or redundant.
- `rbp` react-best-practices, whole site: rbp-1 to rbp-13, 12/13 applied (seven more 2026-09-21, rbp-12 skipped).
  Clean after apply; 2 HIGH (table index keys, TeamDetail roster), 3 MEDIUM, 8 LOW.
- `smk` test-smoke, Playwright 8 flows + route smoke: smk-1 to smk-4, 4/4 applied.
  Clean after apply; 4 live defects found and fixed the same day.

### [2026-09-18](./2026-09/audit-9-18.md)

- `bui` better-ui, Token savings + Models + Billing (all twins): bui-1 to
  bui-22. Reviewed 2026-09-17.
- `mifb` make-interfaces-feel-better, same set: mifb-1 to mifb-26.
- `rbp` react-best-practices, same set: rbp-1 to rbp-18.
- `col` color-audit (manual token sweep), all of `src`: col-1 to col-18.
  All closed.
