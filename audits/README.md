# Audits

Review findings from the `ui-audit` skill, one file per day, grouped by
month to mirror `change-logs/`. **Start at [`INDEX.md`](./INDEX.md)**: it
lists every day and every run so you open one file, not the folder.

- `YYYY-MM/audit-M-D.md`: the daily file. Section per review skill,
  subsection per page (`Global` first), items `<alias>-N` (`wdg-3`, `rams-1`; alias table in the rules file) ordered HIGH >
  MEDIUM > LOW. Runs later the same day append; nothing is renumbered or
  deleted. Ticked items carry the commit hash that applied them.

The full shape and append rules: `.claude/skills/ui-audit/audit-file.md`.
