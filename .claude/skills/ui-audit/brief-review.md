READ-ONLY REVIEW. Edit no files. Deliverable is a report.

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
`- [ ] **N. SEVERITY** path:line, path:line` then three sub-bullets
`  - Rule: ...` (the design.md section, guideline or skill rule breached, one
clause), `  - Before: ...`, `  - After: ...`, `  - Why: ...` (cause first, then
consequence, one sentence each). Then one `Opinion:` line: Clean / Qualified /
Adverse / Disclaimer (Disclaimer = you did not read every file in scope; name
them). The user owns the final severity and opinion; propose, do not decide.
`After` is the exact class string or CSS value. Then "Not verified" (you have
no browser). End with the skill's verdict or closing line. Under 120 lines.
