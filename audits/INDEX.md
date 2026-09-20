# Audit index

Every review run, newest first. One file per day, grouped by month. Each
file is a checklist: section per skill, subsection per page, items
`<alias>-N` ordered HIGH > MEDIUM > LOW, ticked with the commit hash when
applied. Rules and the alias table: `.claude/skills/ui-audit/audit-file.md`.

**Find the day, then open only that file.**

## September 2026

### [2026-09-20](./2026-09/audit-9-20.md)

- `wdg` web-design-guidelines, whole site: wdg-1 to wdg-32. Verdict fail;
  wdg-1, 4, 5, 6, 8, 11, 12, 25, 31 applied; ten items downgraded to LOW.

### [2026-09-18](./2026-09/audit-9-18.md)

- `bui` better-ui, Token savings + Models + Billing (all twins): bui-1 to
  bui-22. Reviewed 2026-09-17.
- `mifb` make-interfaces-feel-better, same set: mifb-1 to mifb-26.
- `rbp` react-best-practices, same set: rbp-1 to rbp-18.
- `col` color-audit (manual token sweep), all of `src`: col-1 to col-18.
  All closed.
