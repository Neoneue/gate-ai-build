# CLAUDE.md — Constellation Gate AI Dashboard

This file intentionally stays minimal to avoid duplicate prompt context.
It is the shared, committed project-instruction file; the per-area detail
lives in the reference docs linked below.

## Local reminders

- Work on `dev`, never push to `main` directly.
- Keep changes scoped to the literal request.
- Run `npx tsc -b` before any merge or promotion step.

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
