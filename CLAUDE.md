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

Detailed rules live in `.claude/rules/` and are auto-discovered. The design
ones (`design-tokens`, `no-hardcoding`, `no-handrolling`) are path-scoped to
`src/**` and load only when you touch code. `no-thrash` and
`token-efficient-reads` load always.

## Reference docs (repo root)

Read the relevant doc before working in its area. Do not re-inject on every prompt.

| Doc | What it is |
| --- | --- |
| [`design.md`](./design.md) | Design-system contract — tokens, radius/spacing tiers, typography voices, component specs, do/don't. Authoritative for all visual decisions. |
| [`data-model.md`](./data-model.md) | Dashboard architecture — routes, TypeScript types, mock-data model, entity relationships, deep-links, page inventory. |
| [`change-logs/`](./change-logs/) | Running UI change logs, one file per day, grouped by month (`change-logs/2026-07/changelog-7-6.md`). Append an entry for every UI change so devs/agents can diff against it. **Start at [`change-logs/INDEX.md`](./change-logs/INDEX.md)** — it lists every entry by date so you open one file, not thirty (~90k tokens if globbed). |
| [`docs/Presidio-findings.md`](./docs/Presidio-findings.md) | PII detection truth — built-in Presidio recognizers. Read before authoring any PII finding value. |
| [`docs/Credentials-findings.md`](./docs/Credentials-findings.md) | Credential/secret detection — regex + Shannon entropy (NOT Presidio). |
| [`docs/Injection-findings.md`](./docs/Injection-findings.md) | Prompt-injection detection — ML classifier (NOT Presidio/regex); §3 = the 10 verdict enums. |
| [`README.md`](./README.md) | Repo overview, stack, routes. |

The whole `docs/` folder is **local-only** (gitignored): the findings docs above,
the `message-script.md` / `request-trace.md` session
sources, staging captures, audit `.docx`. They resolve only on a machine that
already has them. `handoff.md` (repo root, also gitignored) holds the resume
notes. The committed, tracked UI change logs live in `change-logs/`.
