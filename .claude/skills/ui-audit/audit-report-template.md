# Audit - YYYY-MM-DD

Read-only reviews by the review agent. Checklist: tick an item when it is
applied and verified, then append the commit hash to the item's first line.
Pick items by ID ("rams-3, wdg-7"). Paths are relative to `src/`. Already
decided, not re-flagged: see the settled table in the audit skill.

## Summary

- Why: <one clause: what prompted today's audits>
- Tested: <skills run and their scope, one clause each>
- Found: <N> items, <H> HIGH / <M> MEDIUM / <L> LOW; <A> applied, <S> skipped by decision, <O> open.
- Opinion: <Clean | Qualified | Adverse | Disclaimer>. <one clause on the worst open item>
- Next: <open decisions with owner and date; what feeds the lint plan>

## Runs

| # | Time | Skill | Scope | Items | Applied |
| --- | --- | --- | --- | --- | --- |
| 1 | 09:40 | <skill> | <pages or "whole site", exclusions> | <alias>-1 to <alias>-N | 0/N |

## <skill full name>

### Global

- [ ] **<alias>-1 HIGH** `<rule-slug>` path/file.tsx:41, path/other.tsx:12
  - Before: `<the offending value, one line>`
  - After: `<the exact replacement value, one line>`
  - Why: <cause>, so <consequence>.

### <Page>

- [ ] **<alias>-2 MEDIUM** `<rule-slug>` path/Page.tsx:88
  - Before: ...
  - After: ...
  - Why: ...
- [ ] **<alias>-3 LOW** `<rule-slug>` path/Page.tsx:120
  - Before: ...
  - After: ...
  - Why: ...

### Decision needed

- <alias>-N: skill wants X, the design contract says Y (<owner>, by <date>).

### Not verified

- <alias>-N: needs a browser or profiler (<what>).

### Skipped by decision

- <alias>-N: <reason> (<date>).

### Compliant, checked and clean

- <rule swept that produced nothing, one line each>

Verdict (run 1): <Clean | Qualified | Adverse | Disclaimer>. <one sentence>

## test-smoke

### <Page>

- [ ] **smk-1 HIGH** `<rule-slug>` path/file.tsx:12
  - Before: <what the failing test observed>
  - After: <the fix>
  - Why: <assertion text>; found by `<test file>` "<test name>".

### Compliant, checked and clean

- vitest <files>/<cases> green; Playwright <flows> green.

Verdict (run 2): <opinion>. <one sentence>

## Patterns

- `<rule-slug>`: <alias>-1, <alias>-4. <lint rule or hook that would catch it, or "review-time">

<!--
Rules (full text lives with the audit skill; this is the short form):

- One file per day. First run creates it, later runs append. Never a second
  file, never a rewrite of an earlier run, never a renumber.
- Section = skill, subsection = page, `### Global` first. Fixed tails in
  order, only when non-empty: Decision needed, Not verified, Skipped by
  decision, Compliant. One `Verdict (run N): <Opinion>.` line per run.
- IDs `<alias>-N`, per-skill counter for the day, only ever up.
- Severity order HIGH > MEDIUM > LOW inside every subsection.
  HIGH = visible or logged on the demo path, a shared primitive, or a
  WCAG A/AA failure. MEDIUM = reachable by a normal action, one surface,
  or a contract breach with no visible effect yet. LOW = consistency,
  churn, or an edge no demo reaches. Reviewer proposes; the user owns the
  final tier and the opinion.
- Opinion: Clean (nothing found), Qualified (findings, none blocking),
  Adverse (a HIGH blocks promotion), Disclaimer (scope not fully read;
  name what was skipped). Never "pass" or "fail".
- Item is four lines: id + severity + rule slug + file:line, then Before,
  After, Why (cause first). Sub-bullets are one line, inline backticks,
  never a fenced block; if more is needed, name the pattern and a
  precedent file:line.
- Lifecycle lives on the item: tick + hash when applied; Skipped line with
  date; re-severity = change word, move, add `- Severity:` sub-bullet.
  Nothing is deleted.
- Summary is five bullets rewritten in place after every run and apply
  pass. Patterns is the last section, twelve lines max, keyed by slug.
  Nothing else at day level.
- test-smoke: run the suites on their own or after every apply batch; each
  failure is an smk item; a green run is one Compliant line.
- Relay findings in chat before writing; quality gate before saving:
  every item has a slug and file:line, Summary counts match, opinion
  matches the worst open item, Patterns covers every cause seen twice.
-->
