# Orchestrator skills

Which skill to read for which job. Routing also lives in
`.claude/agents/orchestrator.md` ("Skill routing"), with the repo overrides
that win over any skill text.

| Job | Skill | Notes |
| --- | --- | --- |
| Rough idea → design before any plan | `brainstorming/` | Specs go to `docs/plans/` (local only), never `docs/superpowers/`; no commit |
| Spec → executable plan | `writing-plans/` | Run its Self-Review; Review Focus items each need an owning task |
| 2+ independent tasks → parallel lanes | `dispatching-parallel-agents/` | Disjoint files, claims posted in the room first; issue every Agent call in ONE turn (separate turns run in series) |
| Plan → subagents with two-stage review | `subagent-driven-development/` | Writing subagents get no nested worktree; commits via `/commit` only |
| Plan → do it yourself in-session | `executing-plans/` | Use when a subagent launch is blocked or the task is small |
| A lane needs its own working tree | `using-git-worktrees/` | Only when two writers would share this folder; `/promote` makes its own; never nest |
| Before any "done", "fixed", "passing" | `verification-before-completion/` | Paste the command and its output; Jev a load-bearing done claim with a control |

Sub-skills these reference: `test-driven-development` lives in the tester
kit (`agents/tester/skills/test-driven-development/`, by path; its RED
step only). Not installed: `requesting-code-review` (covered by the
two-stage review),
`finishing-a-development-branch` (replaced by `/commit`, `/commit-push`,
`/promote`).
