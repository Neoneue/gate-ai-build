# Audit index

Every review run, newest first. One file per day, grouped by month. Each
file is a checklist: section per skill, subsection per page, items
`<alias>-N` ordered HIGH > MEDIUM > LOW, ticked with the commit hash when
applied. Rules and the alias table: `.claude/skills/ui-audit/audit-file.md`.

**Find the day, then open only that file.**

## September 2026

### [2026-09-20](./2026-09/audit-9-20.md)

- `wdg` web-design-guidelines, whole site: wdg-1 to wdg-32. Verdict fail;
  21 of 32 applied; wdg-15 kept by decision; the other ten skipped as mobile-only or redundant.

### [2026-09-18](./2026-09/audit-9-18.md)

- `bui` better-ui, Token savings + Models + Billing (all twins): bui-1 to
  bui-22. Reviewed 2026-09-17.
- `mifb` make-interfaces-feel-better, same set: mifb-1 to mifb-26.
- `rbp` react-best-practices, same set: rbp-1 to rbp-18.
- `col` color-audit (manual token sweep), all of `src`: col-1 to col-18.
  All closed.
