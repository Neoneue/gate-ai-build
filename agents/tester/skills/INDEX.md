# Skills index: tester

Seven test skills owned by the `tester` agent, plus two it reads from
elsewhere. This file says which one to reach for; each skill's `SKILL.md`
says how. The agent file's routing table carries the overrides for this
repo (versions, ports, the paused-clock pattern).

| Job | Skill |
| --- | --- |
| Drive a real browser, inspect a page, reproduce a runtime state | `playwright-cli` (run as `npx playwright cli`; the copy in `node_modules/playwright-core/lib/tools/skills/` matches our version) |
| Read a trace from a failed or retried test | `playwright-trace`, shipped in `node_modules/playwright-core/lib/tools/skills/` |
| Write, fix, or de-flake Playwright specs; CI sharding | `playwright-best-practices` |
| Unit tests, mocking, coverage with vitest | `vitest` (written for 5.x beta; we run 4.1.x) |
| Judge whether a test is any good: the break it catches, mocks, mutation check | `test-driven-development`, its `writing-good-tests.md` |
| Before any pass, fail or "fixed" verdict | `verification-before-completion`, in `agents/orchestrator/skills/` |
| Find the root cause of a failure or flaky test | `systematic-debugging` |
| Accessibility checks in a real browser (keyboard, aria snapshot, reduced motion) | `accessibility` |
| Security review of GitHub Actions workflows | `github-actions-hardening` |

CI triage and Vercel deploy checks have no vetted skill: use `gh run view
--log-failed`, `gh run download -n playwright-report`, and the read-only
`vercel inspect` / `vercel logs`.
