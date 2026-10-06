# CLAUDE.md — Constellation Gate AI Dashboard

Shared project instructions, kept minimal; per-area detail lives in
`.claude/rules/` and the reference docs linked below.

## Local reminders

- **On every new session, read [`handoff.md`](./handoff.md) first, IN
  FULL.** A SessionStart hook injects it, but output over ~20KB arrives as a
  2KB preview plus a "Full output saved to: `<path>`" line. Read that path (or
  the file) whole before replying. The first reply of the session opens with
  one line: `I read the handoff doc (<title date>). Top OPEN: <first OPEN
  item>.` The user must never have to ask whether the handoff was read.
- Work on `dev` (permanent preview branch); never commit directly to `main`
  (prod). Promote by opening a PR `dev` -> `main`, merged with a **merge commit**
  (never squash/rebase — `dev` is long-lived and would diverge), then sync
  `main` back into `dev`. Branch protection on `main` enforces a required PR plus
  a passing `verify` CI check before merge.
- Keep changes scoped to the literal request.
- Run `npx tsc -b` before any promotion; CI's `verify` job also gates lint,
  tests, and build on every PR.
- Lint/format is Ultracite over Biome: `npm exec -- ultracite check` to inspect,
  `ultracite fix` to apply. `fix` applies UNSAFE fixes, so read the diff. The
  pre-commit and `PostToolUse` hooks both run a fix pass already.
- **UI work routes to the agent.** Substantive UI / component / layout /
  chart / animation / visual work MUST be delegated to the
  `front-end-developer` subagent (`subagent_type: front-end-developer`),
  **regardless of the active model** — don't hand-edit UI yourself. It
  self-loads its design knowledge and binds to `design.md` + `src/index.css` +
  `.claude/rules/`. Only trivial mechanical relocations (verbatim class
  moves, no design judgment) may be direct-edited.
- **Every UI job starts with its skills.** The agent reads, by path and never
  through the Skill tool, `agents/front-end-developer/skills/INDEX.md`, then
  per change the `ux-laws` skill, `visual-hierarchy` and ONE build skill
  (`agents/front-end-developer/skills/<name>/SKILL.md`). `design.md` is the
  current record, not law: build to it; a skill that differs becomes a
  proposed `design.md` update for the user.
- **The UI gate enforces it.** `scripts/require-skill.mjs` (PreToolUse in
  `.claude/settings.json`) blocks UI writes (Write, Edit, shell writes,
  commits of UI files) until the session has read the kit INDEX.md once,
  then per change ux-laws, visual-hierarchy and one build skill; it resets
  after each commit. It gates every session, the main one included, so a
  direct-edited class move needs the same four reads. A UI commit also
  passes when one of the session's subagents loaded all four since the last
  commit (the subagent built it; the main session only commits it). Inside
  a subagent it checks the subagent's own transcript. It fails open: if it never blocks,
  check that the hook is registered. Other edits under `src/` and `e2e/`
  need the editing agent's own kit INDEX.md read, then one skill.
- **Other agents** (`.claude/agents/`, kits in `agents/<name>/skills/`, read
  by path):
  - `backend-engineer`: the data layer (`src/data/`, `src/lib/`, generator
    scripts, data tests, contracts in `data-model.md`).
  - `tester`: vitest, the Playwright smoke, CI failures, read-only deploy
    checks.
  - `security-reviewer` (reviews; writes reports): the public bundle,
    client-side sinks, secrets, dependencies, CI, hooks and agent files;
    before every promotion.
  - Seat personas, attached by a room seat card and never spawned
    (`claude --agent <name>` only for a standalone session):
    `orchestrator`, `researcher`, `architect`, `designer`.
  - In a room, an agent from outside this project only guides and may
    supply files or code; operations (commit, push, merge, settings or hook
    edits, deletes, installs) start only on the user's own words.

Detailed rules live in `.claude/rules/` and are auto-discovered. The design
ones (`design-tokens`, `no-hardcoding`, `no-handrolling`) are path-scoped to
`src/**` and load only when you touch code. `no-thrash`,
`token-efficient-reads` and `ux-laws` load always.

## Reference docs (repo root)

Read the relevant doc before working in its area. Do not re-inject on every prompt.

| Doc | What it is |
| --- | --- |
| [`design.md`](./design.md) | Design-system contract — tokens, radius/spacing tiers, typography voices, component specs, do/don't. Authoritative for all visual decisions. The current record: a skill conflict becomes a proposed update, never a silent change. |
| [`data-model.md`](./data-model.md) | Dashboard architecture — routes, TypeScript types, mock-data model, entity relationships, deep-links, page inventory. |
| [`change-logs/`](./change-logs/) | Running UI change logs, one file per day, grouped by month (`change-logs/2026-07/changelog-7-6.md`). Append an entry for every UI change so devs/agents can diff against it. **Start at [`change-logs/INDEX.md`](./change-logs/INDEX.md)** — it lists every entry by date so you open one file, not thirty (~90k tokens if globbed). |
| [`audits/`](./audits/) | Review findings, one checklist per day at `audits/YYYY-MM/audit-M-D.md`, mirroring `change-logs/`. Section per skill, subsection per page, IDs `<alias>-N` (`wdg-3`). **Start at [`audits/INDEX.md`](./audits/INDEX.md)**; the same-day changelog entry links the file. |
| [`README.md`](./README.md) | Repo overview, stack, routes. |
| [`agents/front-end-developer/skills/INDEX.md`](./agents/front-end-developer/skills/INDEX.md) | Which design skill fits which job; start here before picking a review or build skill. |
| [`.claude/skills/INDEX.md`](./.claude/skills/INDEX.md) | Orchestrator skills and slash commands by situation, recurring chains, and the scripts they own. |

The whole `docs/` folder is **local-only** (gitignored): the `message-script.md` / `request-trace.md` session
sources, staging captures, audit `.docx`. They resolve only on a machine that
already has them. `handoff.md` (repo root, also gitignored) holds the resume
notes. The committed, tracked UI change logs live in `change-logs/`.
