# CLAUDE.md — Constellation Gate AI Dashboard

This file intentionally stays minimal to avoid duplicate prompt context.
It is the shared, committed project-instruction file; the per-area detail
lives in the reference docs linked below.

## Local reminders

- Work on `dev` (permanent preview branch); never commit directly to `main`
  (prod). Promote by opening a PR `dev` -> `main`, merged with a **merge commit**
  (never squash/rebase — `dev` is long-lived and would diverge), then sync
  `main` back into `dev`. Branch protection on `main` enforces a required PR plus
  a passing `verify` CI check before merge.
- Keep changes scoped to the literal request.
- Run `npx tsc -b` before any promotion; CI's `verify` job also gates lint,
  tests, and build on every PR.
- **UI work routes to the agent.** Substantive UI / component / layout /
  chart / animation / visual work MUST be delegated to the
  `front-end-developer` subagent (`subagent_type: front-end-developer`),
  **regardless of the active model** — don't hand-edit UI yourself. It
  self-loads its design knowledge and binds to `design.md` + `src/index.css` +
  `.claude/rules/`. Only trivial mechanical relocations (verbatim class
  moves, no design judgment) may be direct-edited.
- **Visual values are a closed set.** Never invent a color, type size, or
  tracking — map every value to a token/voice in `design.md`, or stop and ask.
  Enforced by `npm run lint:design`. Full rule: @.claude/rules/design-tokens.md
- **Never hardcode a color. Tokenize by intent.** Every color in UI code
  references a SEMANTIC token that flips with the theme. A raw ramp step
  (`var(--neutral-900)`, `bg-neutral-100`, `text-blue-700`) used for a
  semantic role is still hardcoding: it will not flip and is a defect.
  Literals live ONLY in the token-definition layer. No hand-rolling, no
  ad-hoc values. Full rule: @.claude/rules/no-hardcoding.md
- **Never hand-roll a component. Compose the primitives.** The components in
  `src/components/ui/` are a closed set, like the tokens. Never write a raw
  `<button>` when `Button` exists; never re-specify what a `variant` already
  gives you; never override a primitive's typography. A `className` on a
  primitive is for LAYOUT ONLY (`flex-1`, `w-full`, `md:ml-auto`) — colors,
  borders, radius, and font weight belong to the component. **All button
  labels are `font-medium` (500)**, no exceptions. If a primitive doesn't fit,
  change the primitive and document it in `design.md` — don't patch the call
  site. Full rule: @.claude/rules/no-handrolling.md
- **Don't thrash.** When the user says something "isn't working" / "still the
  same", PIN the surface (which route → which file) and confirm BEFORE editing
  or measuring. Revert failed fixes instead of patching forward. Full gate:
  @.claude/rules/no-thrash.md
- **Never load capture data whole.** `src/data/request-bodies.ts` (~450 KB of
  verbatim transcripts) is runtime lookup data — don't Read it; exclude it from
  greps; answer questions about it with code, not reads. Scoped reads
  everywhere. Full rule: @.claude/rules/token-efficient-reads.md

## Reference docs (repo root)

Read the relevant doc before working in its area. Do not re-inject on every prompt.

| Doc | What it is |
| --- | --- |
| [`design.md`](./design.md) | Design-system contract — tokens, radius/spacing tiers, typography voices, component specs, do/don't. Authoritative for all visual decisions. |
| [`data-model.md`](./data-model.md) | Dashboard architecture — routes, TypeScript types, mock-data model, entity relationships, deep-links, page inventory. |
| [`change-logs/`](./change-logs/) | Running UI change logs (one file per stretch of days, e.g. `change-logs/changelog-6-6.md`). Append an entry for every UI change so devs/agents can diff against it. |
| [`docs/Presidio-findings.md`](./docs/Presidio-findings.md) | PII detection truth — built-in Presidio recognizers. Read before authoring any PII finding value. |
| [`docs/Credentials-findings.md`](./docs/Credentials-findings.md) | Credential/secret detection — regex + Shannon entropy (NOT Presidio). |
| [`docs/Injection-findings.md`](./docs/Injection-findings.md) | Prompt-injection detection — ML classifier (NOT Presidio/regex); §3 = the 10 verdict enums. |
| [`PRODUCT.md`](./PRODUCT.md) | Product context / register. |
| [`README.md`](./README.md) | Repo overview, stack, routes. |

The whole `docs/` folder is **local-only** (gitignored): the findings docs above,
`handoff.md` resume notes, the `message-script.md` / `request-trace.md` session
sources, staging captures, audit `.docx`. They resolve only on a machine that
already has them. The committed, tracked UI change logs live in `change-logs/`.
