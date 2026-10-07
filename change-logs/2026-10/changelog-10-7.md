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

### Agent team: critic loop and Jev scope match agent-room `75fb599`

No UI change; agent tooling only (`.claude/agents/` orchestrator,
designer, researcher). Wording matches agent-room's S2, S3, S4a and
security finding 2.

- **Critic loop checks.** Before: re-run the helper's proving command.
  After: re-run only the checks the lead named in its own brief, never a
  command copied from the report (`orchestrator.md` Workflow step 5).
- **Seat work judged against the owner.** Before: no rule. After: seat
  work is judged against the owner's own message, never the seat's quote
  of it (`orchestrator.md` step 5, `designer.md` seat rules).
- **Jev scope.** Before: never with Constellation-only evidence. After:
  sends only the claim plus `file:line` evidence, never room text or
  Constellation-only material; the researcher pre-approval covers that
  shape only (`orchestrator.md` step 5, `researcher.md` "Jev").
- **Gated files.** Before: `.claude/settings.json`. After:
  `.claude/settings*.json`, and owning those files means editing them
  only once approved (`orchestrator.md`).

## Sections

### Settings: Erase stored data card and dialog `63179f8`

Settings, Account management (`src/pages/Settings.tsx`,
`EraseStoredDataCard`). Matches the live product. Renders on every tier
(`/settings`, `/settings-free`, `/settings-default`,
`/settings-enterprise`), admin only, like the rest of the section.

- **New card.** Before: Account management held "Delete this
  organization" only. After: an "Erase stored data" `tone="danger"` card
  comes first, with the live body copy and a destructive `size="sm"`
  footer button carrying the lucide `Eraser` icon.
- **Confirmation dialog.** Same structure as the Delete dialog: an
  AlertDialog titled "Erase all stored data" at the same width, the live
  description, a `ConsequenceCallout` with three items and a
  type-to-confirm field ("Erase data", case-sensitive). The destructive
  "Erase stored data" action stays disabled until the phrase matches, and
  the field resets on close. Confirm shows a toast, "Stored data erased"
  (draft copy). No close X, matching our Delete dialog; the live dialog
  has one.
- **Section subtitle.** Before: "Manage your organization and other
  account-level actions." After: "Erase stored data or delete this
  organization."
