# UI Changelog: 2026-10-07

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-10-6.md`](./changelog-10-6.md)

---

## Conventions

### Agent team: contracts, routing descriptions, effort, critic loop `3c12257`

No UI change; agent tooling only (`.claude/agents/*.md`, all 8 project
agents).

- **Contract section in every agent file.** Before: no stated brief or
  report shape for most agents. After: each file says what a brief gives it,
  what it returns and what "done" means.
- **Leads and helpers.** Before: seat personas did not build, and spawning
  a helper for one task was forbidden. After: the leads (orchestrator,
  researcher, architect, designer) work themselves or spawn helpers, their
  call. The helpers (front-end-developer, backend-engineer, tester,
  security-reviewer) report to the lead that spawned them.
- **Descriptions are routing rules.** Before: backend-engineer claimed
  "contracts in data-model.md" and pulled in architect work. After: each
  description says when to use the agent. Jev on a fresh blind holdout set:
  20/33 to 24/33 routed correctly.
- **Roles.** The architect owns site structure, project cleanliness and
  `data-model.md`. The researcher researches, relays findings and writes
  plans. The orchestrator owns edits to `.claude/rules/`, `CLAUDE.md` and
  `.claude/agents/`.
- **`effort:` per role** in frontmatter: high for six agents, medium for
  researcher and tester.
- **Critic loop** (`orchestrator.md` Workflow step 5). Every helper report
  is checked against its Contract, and its proving command is re-run. A
  FAIL goes back with numbered fixes. Three rounds max, then the best result
  goes up with the open objections.

### Seat personas: security review fixes `186e8ca`

No UI change; agent tooling only (`.claude/agents/` orchestrator,
researcher, architect, designer).

- **Seat descriptions.** Before: "do not spawn it as a subagent". After:
  "do not spawn it as a subagent or delegate to it automatically", in all
  four seat descriptions.
- **Spawned designer.** Before: no rule for a designer spawned as a
  subagent. After: a spawned copy never calls room tools, since it would
  post on its parent's seat (`designer.md`).
- **Orchestrator gated actions.** Before: commit, push, promote, deleting
  data, spending money, new dependencies. After: also edits to
  `.claude/rules/`, `CLAUDE.md`, `.claude/agents/`, `.claude/settings.json`
  and `scripts/`.
- **Jev in the critic loop.** Before: any claim audit could run Jev. After:
  Jev runs only from the orchestrator or researcher seat, and never with
  Constellation-only evidence (`orchestrator.md` Workflow step 5).
