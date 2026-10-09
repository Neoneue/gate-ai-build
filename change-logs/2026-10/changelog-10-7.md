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

### Agent team: copywriter and animator agents `afda60d`

No UI change; agent tooling only (`.claude/agents/`, `agents/`,
`CLAUDE.md`, `scripts/check-design-tokens.mjs`).

- **New agents.** Before: the front-end-developer owned copy and motion.
  After: `copywriter` writes every user-facing string, grounded in the PRD
  (kit `agents/copywriter/`), and `animator` owns every animation: CSS,
  GSAP and `motion/react` icons (kit `agents/animator/`).
- **Routing.** Copy and motion requests route through the orchestrator
  (the main session only when no orchestrator runs); a helper lists the
  strings or motion it needs in its report (`CLAUDE.md`, `orchestrator.md`,
  `front-end-developer.md` task table).
- **Design-token lint scope.** Before: lint-staged passed vendored kit CSS
  to `check-design-tokens.mjs`, which flagged the animator kit's
  `transitions-dev/_root.css`. After: passed files are kept to `src/`.

### Agent team: own-kit skills and UX-first gate `1670cb1`

No UI change; agent tooling only (`scripts/require-skill.mjs` and its
test, `agents/front-end-developer/skills/ux-laws/`, `.claude/rules/ux-laws.md`,
`.claude/agents/`, `CLAUDE.md`).

- **UI gate order.** Before: kit INDEX once, then ux-laws,
  visual-hierarchy and one build skill. After: in order, kit INDEX,
  ux-laws, a written 8-line gate (Job, Path, Expectation, Objects, Actions,
  Laws, Patterns, Rejected), visual-hierarchy, one build skill; a step out
  of order does not count.
- **Every write picks a skill.** Before: only `src/` and `e2e/` edits
  needed a kit read. After: every Write or Edit in the project needs the
  writer's own kit INDEX (by `agent_type`) and then a skill it names; the
  pick resets per commit, `change-logs/` is exempt.
- **Actions on their container's object.** New ux-laws pattern: a card
  footer holds only actions on that card's own object; plan and account
  actions go in the page header or on their own surface. New reference
  `ux-laws/references/deciding-not-defaulting.md`.
- **Critic loop.** The orchestrator checks each built action against its
  container's object; the front-end-developer report quotes the gate and
  lists `action -> object -> container` per action.

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

### Settings: Data retention card and shorten dialog `d81cbaf`

Settings, new Data retention section between Security and Account
management (`src/pages/settings/DataRetentionCard.tsx`, AG-1021). Admin
only. Tier set by the `retentionTier` prop: `/settings` Pro,
`/settings-enterprise` Enterprise, `/settings-free` and
`/settings-default` Free.

- **Window field.** A responsive `Field` with a `w-20` days input. Free:
  fixed at 30 days, disabled, no footer, and the Free plan banner under
  the card. Pro: 0 to 90; above that, an inline `FieldError` naming the
  ceiling with a "move to Enterprise" link. Enterprise: 0 to the contract
  ceiling (365), with "contact support" as plain text. At 0 days an info
  `Callout` says what turns off.
- **Facts.** A `dl` under a hairline in the Teams budget fact grid (1 / 2
  / 4 columns): Oldest message, Messages in window, Next deletion run,
  Last change. Counts and dates derive from the Messages rows
  (`src/lib/retention.ts`, `settings/retention-data.ts`, with tests).
- **Footer.** Save changes is the one primary; an outline Cancel appears
  only while an edit is unsaved. Lengthening saves at once with a toast;
  shortening opens an AlertDialog (500px, `ConsequenceCallout`, Messages
  export link, destructive "Shorten to N days").
- **Free plan banner.** Before: private to `Policies.tsx`. After: shared
  `src/pages/free-plan-notice-banner.tsx`, taking the per-surface sentence
  as children; Policies (Free) and Data retention (Free) both use it.
- **Field primitive.** Before: an invalid `Field` turned its label red.
  After: only the control border and `FieldError` show the error
  (`src/components/ui/field.tsx`).
