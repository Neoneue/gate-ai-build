---
name: ui-audit
description: Run a UI review skill (better-ui, transitions-dev, transitions-polish, impeccable audit, rams) on a page or the whole project through the front-end-developer agent, relay the findings table, apply the items the user picks by number, and record settled skill-vs-design.md conflicts. Use when the user says "run <skill> on <page>", "audit the motion", "apply items 1-4", or "record that decision".
argument-hint: <review-skill> <scope>   e.g. "better-ui Models page" or "transitions-polish project"
---

# ui-audit

Orchestrator skill. It never edits UI itself; it writes briefs, spawns
`front-end-developer`, relays, and keeps the decision ledger. Three verbs.

**Day file first, every time.** Before any verb, check whether
`audits/YYYY-MM/audit-M-D.md` exists for today. If not, create it from
[audit-report-template.md](audit-report-template.md) (portable: copy it to a
new project's audit skill as the starting shape). If it does, append to it;
never start a second file for the day. Rules for both cases live in
[audit-file.md](audit-file.md); the template's trailing comment is the short
form.

Arguments: `$ARGUMENTS` = `<review-skill> <scope>`.

## 1. review

1. Resolve the skill file: `agents/front-end-developer/skills/<review-skill>/SKILL.md`.
   Exception: `<review-skill>` = `test-smoke` (alias `smk`) has no skill
   file. It means: run `npm run smoke` (vitest then Playwright) against the
   live dev server (`lsof -ti :3000` first, never a second Vite), and file
   every failing case as an item under `## test-smoke`, page = the surface
   the test drives, slug = the rule the failure breaks, `Why:` = the
   assertion text. A green run is a Clean opinion with one Compliant line
   naming the counts. No agent spawn; the orchestrator runs it directly.
   If the folder is missing, stop and say so (do not guess a path; the kit is
   the only home for design skills).
2. Resolve scope to files. A page name maps through `src/pages/` and the
   `.claude/rules/no-thrash.md` twins rule (Free / Default / Pro are separate
   files); "project" means `src/` with the blob exclusions.
3. Fill [brief-review.md](brief-review.md) and spawn
   `subagent_type: front-end-developer`. Model by scope (user 2026-09-21,
   "do what you would change"): **Opus** when the scope holds shared
   primitives (`components/ui`, `layouts`), tokens, or any design.md table
   judgment (wash ladder, radius, motion); **Sonnet** for page sweeps under
   `src/pages`. The 2026-09-21 rams run lost one HIGH to a Sonnet misread of
   the wash ladder and one page set to a grep-only pass. The orchestrator
   runs on whatever model the user set.
   Scope resolution is by route (step 3b), so a page brief lists every
   file that renders on the route, including panes mounted from other
   folders, with line counts.
   Scope cap: about 10k lines per agent; split a bigger scope into parallel
   agents by area, each numbering from 1, and renumber into one `<alias>-N`
   sequence BEFORE writing (renumbering is forbidden only after the file
   holds the IDs). Every review must end with a "Files read in full" list;
   a report that grepped instead of reading, or returns Disclaimer, is
   re-run at once on a smaller scope, never written up as-is. Do not add
   constraints the template already covers.
3b. **Orchestrator verification, before any relay.** A reviewer's report
   is a claim, not a result. Before relaying, the orchestrator itself:
   - resolves scope by ROUTE with the `verify-twins` skill:
     `node .claude/skills/verify-twins/resolve-route.mjs <routes>` lists
     every file that renders on each route, including panes mounted from
     `teams/`. That list is the brief's scope, and any file it holds that
     the reviewer's "Files read in full" lacks means the report is
     incomplete: re-run it on the missing files before writing.
   - spot-checks every HIGH, and any item whose `Why:` cites a
     design.md table, against source and design.md (`sed -n` the cited
     lines). A miss becomes a re-run or a dropped item, never a relayed one.
   - for any item that says "all twins" or "every site", runs
     `resolve-route.mjs --pattern '<Before>' <routes>` and pastes the
     coverage table into the item's proof. The reviewer's count is not used.
   - re-runs the PROOF each item carries (the brief requires one: a grep,
     a design.md line, a DOM measurement). An item whose proof does not
     reproduce is dropped; an item with no proof is sent back. The relay
     and the day file carry only items whose proof the orchestrator ran.
   This step exists because on 2026-09-21 a reviewer misread the wash
   ladder (rams-1) and two reviewers missed the Enterprise Token Savings
   pane (imp-9, imp-16); the user found both and should not have had to.
4. Relay FIRST, then write, in the SAME turn. The relay is for the user to
   read; it is not a gate. Do not wait for confirmation before writing the
   day file (2026-09-21: waiting cost a round trip and the user asked why
   the audit was not in the doc). Corrections after the fact use rule 9
   (re-severity, skip) or, on the user's word, deletion. Relay in chat: the
   new items as a CHECKLIST,
   never a table (user rule 2026-09-17), each `- [ ] **<skill>-N SEVERITY**
   `rule-slug` path:line` with `Before:`, `After:`, `Why:` sub-bullets; the
   opinion; then "Decision needed" for every item that conflicts with
   design.md. The user confirms facts and severities before anything is
   formal. Then write the findings into the day's audit file,
   `audits/YYYY-MM/audit-M-D.md`, following [audit-file.md](audit-file.md)
   exactly: create the file on the first run of the day, append on every
   later run; section per skill, subsection per page with `### Global`
   first; IDs `<alias>-N` (alias table in audit-file.md) from a per-skill
   counter that never resets or
   renumbers; HIGH > MEDIUM > LOW inside every subsection; one row in the
   Runs table per run. Before writing, read the existing file and compute
   the next N. First run of the day also adds one changelog line naming the
   audit path.
   Before saving, run the quality gate: every item has a rule slug, a
   file:line and a proof the orchestrator re-ran; figures in the Summary match the item counts; the opinion
   word matches the worst open item; Patterns has a line for every root
   cause seen twice or more.
5. Stop. Applying is a separate user instruction.

## 2. apply

Trigger: the user names item IDs ("do the highs", "apply rams-1 to rams-4").

1. Fill [brief-apply.md](brief-apply.md) with only the named items (by ID,
   e.g. `rams-3`, `wdg-7`), each with its exact file, line, before and after from
   the audit file.
2. Spawn a fresh `front-end-developer` on its default model (Opus: design,
   development and testing always run on Opus). Never `SendMessage` the
   Sonnet review agent to apply; it is read-only by brief and on the wrong
   model.
3. Same proof loop as review: the brief names a report path and routes;
   the agent runs `check-report.mjs apply <report> <routes>` until PASS
   (it proves every quoted `Before:` pattern is absent from every rendered
   file, the twin sweep table has no blank cell, and the gates carry
   counts); the orchestrator runs it once and bounces on FAIL, three
   rounds maximum. Never tick on a FAIL.
4. Verify with the suites before ticking: `npm run smoke` (one command,
   one Runs row). Any new failure is filed as an `smk-N` item in the
   same day file (same shape as a test-smoke run, with the apply item's ID
   in `Why:`) and the apply item stays unticked until it is green. Add the
   run to the Runs table as `test-smoke (after <ids>)` with the counts.
5. Tick each applied item in the audit file and append the short commit
   hash once the user commits. Changelog entries for applied items cite the
   item ID.
6. Do not commit. The user asks for `/commit` separately, every time.

## 3. decide

Trigger: the user settles a skill-vs-design.md conflict ("0.98 is what I
want", "keep 1.75").

1. Write the decision where the next audit will look first:
   design.md, in the section that owns the value (Motion table, Iconography
   line, Material ladder), as one row or one sentence with the date and the
   rejected alternative.
2. Add it to the settled-overrides clause of that skill's routing row in
   `.claude/agents/front-end-developer.md` so the agent stops re-flagging it.
3. If the decision was reached by research, one line on the strongest reason;
   the full survey stays in chat.
4. `cp design.md design.md.bak` before editing, `rm` it after; `npm run lint:md`.

## Settled decisions (do not re-open, do not re-flag)

| Skill rule | Project value | Where recorded |
| --- | --- | --- |
| press scale 0.96 | `active:scale-[0.98]` | design.md Motion table |
| concentric radius arithmetic | Tailwind ladder 24 / 16 / 8 / 4 | design.md Material ladder |
| stroke keyed to text weight | lucide `1.75` global | design.md Iconography |
| shadow-as-border ring | `border-border` + `shadow-xs` | design.md Material ladder |
| skill easing curves | `--ease-out cubic-bezier(0.23, 1, 0.32, 1)` | `src/index.css` @theme |
| skill duration / scale ladders | 100 / 120 / 150 / 200 / 300ms; flat `zoom-95` | design.md Motion table |
| blur family | none; `filter` is not a permitted transition property | OPEN, see handoff |
