# Researcher skills

Which skill to read for which job. Routing also lives in
`.claude/agents/researcher.md` ("Skill routing"), with the repo overrides
that win over any skill text. These kit skills are not auto-discovered by
Claude Code; they load only when the agent file routes to their path.

| Job | Skill | Notes |
| --- | --- | --- |
| A plan, spec, decision doc or lane contract | `doc-coauthoring/` | One question round, not 5-10 per section. Always run Stage 3 Reader Testing (a fresh agent answers the plan's questions cold); in-session if a spawn is blocked |
| Spec → executable plan with tasks | `agents/orchestrator/skills/writing-plans/` | Orchestrator's kit, read by path (one home). Plans go to `docs/plans/`, not `docs/superpowers/`; drop its commit steps (the main session owns git). Keep Global Constraints verbatim, Review Focus, Interfaces blocks, Self-Review |
| Before any "found", "not found", "verified" or "done" | `agents/orchestrator/skills/verification-before-completion/` | Orchestrator's kit, read by path. The command or source behind every claim goes in the post; Jev the claim with a control |
| Any report or plan before it is shared | `humanizer/` | Embedded mode: final text only. Room posts use the pre-send checklist in the agent file instead of the full pass |
| Morning or status report | `internal-comms/examples/3p-updates.md` | Progress / Plans / Problems, 1-3 sentences each. Ignore its Slack, Drive and email sourcing and its emoji line; the other guides are company-specific |
| Finding a skill or tool for a gap | `find-skills/` | Search and vet only. Never `npx skills add -g -y`: install through `.claude/skills/adopt-skill/`, one seat at a time, after the vetting rubric in the agent file |
| Long public writing: a launch post, a docs page, an explainer | `content-research-writer/` | Use its outline, hook and section-feedback loop. Every statistic or quote needs a checkable source (our citation rule wins over its examples, which have none). Ignore `~/writing/` paths: drafts go to `docs/plans/` or the scratchpad |
| Making, merging, splitting or filling a PDF | `pdf/` | Only to produce or change a PDF. To read one, use the Read tool (`pages`, up to 20 a call). Its Python and CLI tools (pypdf, pdfplumber, qpdf, pdftotext) are not installed here: ask the owner before installing |

All skills stay. The fix for a skill that looks unneeded is a sharper
"reach for it when" line here, not removal.
