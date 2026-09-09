# UI Changelog: 2026-09-09

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-9-8.md`](./changelog-9-8.md)

---

## Conventions

### Impeccable design skill updated to 4.3.1 `6093e0c`

Before: `.claude/skills/impeccable` was the 3.9.1 build with node hook
scripts (`scripts/hook.mjs`, `live/`, `detector/`) and the PostToolUse
design check ran through them. After: `npx impeccable update --project`
replaced the skill with the 4.x build: a shell launcher at
`scripts/impeccable`, a native engine under `scripts/bin/<platform>/`
(gitignored with `.impeccable/`; a fresh clone runs the update once to fetch
it), and four `impeccable-*` support agents in `.claude/agents/`. The hook in
`settings.local.json` now calls `scripts/impeccable hook` and skips when the
engine is absent. No dashboard pixels change; this is the design-quality
check every UI edit runs through.
