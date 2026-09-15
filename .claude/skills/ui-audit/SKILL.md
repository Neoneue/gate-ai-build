---
name: ui-audit
description: Run a UI review skill (better-ui, transitions-dev, transitions-polish, impeccable audit, rams) on a page or the whole project through the front-end-developer agent, relay the findings table, apply the items the user picks by number, and record settled skill-vs-design.md conflicts. Use when the user says "run <skill> on <page>", "audit the motion", "apply items 1-4", or "record that decision".
argument-hint: <review-skill> <scope>   e.g. "better-ui Models page" or "transitions-polish project"
---

# ui-audit

Orchestrator skill. It never edits UI itself; it writes briefs, spawns
`front-end-developer`, relays, and keeps the decision ledger. Three verbs.

Arguments: `$ARGUMENTS` = `<review-skill> <scope>`.

## 1. review

1. Resolve the skill file: `agents/front-end-developer/skills/<review-skill>/SKILL.md`.
   If the folder is missing, stop and say so (do not guess a path; the kit is
   the only home for design skills).
2. Resolve scope to files. A page name maps through `src/pages/` and the
   `.claude/rules/no-thrash.md` twins rule (Free / Default / Pro are separate
   files); "project" means `src/` with the blob exclusions.
3. Fill [brief-review.md](brief-review.md) and spawn
   `subagent_type: front-end-developer`. Do not add constraints the template
   already covers; the agent's standing rules handle gates and scope.
4. Relay the table verbatim in structure: severity or numbered list, one row
   per root cause, `path:line`, before, after, why. Then the verdict. Then a
   "Decision needed" list for every row that conflicts with design.md.
5. Stop. Applying is a separate user instruction.

## 2. apply

Trigger: the user names item numbers ("do the highs", "apply 1-4").

1. Fill [brief-apply.md](brief-apply.md) with only the named items, each with
   its exact file, line, before and after from the review table.
2. Spawn `front-end-developer` (or `SendMessage` the review agent if it is
   still alive and holds the files, to avoid two agents on one file).
3. Relay before / after per file and the gate results. Name anything the
   agent skipped and why.
4. Do not commit. The user asks for `/commit` separately, every time.

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
