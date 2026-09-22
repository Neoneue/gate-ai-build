READ-ONLY REVIEW. Edit no files. Deliverable is a report.

HARD REQUIREMENT: read every file in scope END TO END with the Read tool
(offset/limit chunks for long files). Grep is a supplement, never the pass.
End the report with "Files read in full" (path and line count, every file).
If a file was not finished, name it and the line you stopped at and mark the
Opinion Disclaimer; the orchestrator will re-run that scope.

Run the `<review-skill>` skill from
`agents/front-end-developer/skills/<review-skill>/SKILL.md` (read it and the
supporting files it links, in full) against:

<scope: one line per file or module, with line counts; name the twins that
are NOT in scope>

Project context so you do not re-flag decided things:
- design.md is the contract and wins on every conflict. Settled overrides:
  press 0.98 not 0.96; lucide stroke a global 1.75; radius is the Tailwind
  ladder 24 / 16 / 8 / 4; surfaces are `border-border` + `shadow-xs`; easing
  is the project `--ease-out`; durations 100 / 120 / 150 / 200 / 300ms; the
  transition property list excludes `filter`. Report a conflict with any of
  these ONCE in a "Conflicts with design.md" table, never per call site.
- Base UI primitives + tw-animate-css do enter / exit (`data-open:animate-in`,
  `data-closed:animate-out`, `data-closed:fill-mode-forwards`). Never Radix.
- `hover-fine:` is inert site-wide; note remaining uses as findings.
- <page-specific facts: decisions the user made this week, hidden features,
  known dimmed states>

Method: every interactive element, list hover / focus-visible / active /
disabled / loading / empty as defined in code; read every transition
property, duration and easing literally; check nested radius, icon stroke vs
text weight, unnamed transition properties, icon toggles by mount / unmount,
optical alignment of icon + text, stagger on any entrance.

Output a CHECKLIST, not a table, even if the skill defines a table format:
a `### Global` group first (shared primitives, tokens, anything reached from
more than one page), then one `### <Page>` group per page in scope; inside
each group severity HIGH > MEDIUM > LOW; one item per root cause; numbered
sequentially starting at <N> (the orchestrator gives you this), in this
exact shape:
`- [ ] **N. SEVERITY** \`<rule-slug>\` path:line, path:line` (slug = the skill
rule id or a short kebab name for the rule breached) then three sub-bullets
`  - Before: ...`, `  - After: ...`, `  - Why: ...` (cause first, then
consequence, one sentence each). Then one `Opinion:` line: Clean / Qualified /
Adverse / Disclaimer (Disclaimer = you did not read every file in scope; name
them). The user owns the final severity and opinion; propose, do not decide.
`After` is the exact class string or CSS value. Every sub-bullet is one line,
backticked inline, never a fenced block; if a fix needs more, name the pattern
and a precedent file:line instead of pasting code. Then "Not verified" (you have
no browser). Then "Compliant, checked and clean": one line per rule swept
that produced nothing. Do NOT list "checked, not a defect" notes as
numbered items; they belong under Compliant. End with "Files read in full".
Under 110 lines: reports over that truncate in transit.
