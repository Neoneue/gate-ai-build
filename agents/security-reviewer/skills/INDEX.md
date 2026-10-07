# Skills index: security-reviewer

Security skills owned by the `security-reviewer` agent. This file says which
one to reach for; each skill's `SKILL.md` says how. The agent file
(`.claude/agents/security-reviewer.md`) holds the triggers ("When to run
what") and the overrides that win over any skill text. These kit skills are
not registered with the Skill tool: read them by path.

| Job | Skill |
| --- | --- |
| General OWASP code review | `security-review` |
| Headers, browser storage, secrets; the default process spine | `security-and-hardening` |
| Threat model for a feature or boundary | `security-threat-model` |
| Security review of a diff | `differential-review` |
| Misuse-prone in-repo helpers (empty means all, string matching) | `sharp-edges` |
| Dependency and maintainer risk (gated: reads the gh token) | `supply-chain-risk-auditor` |
| Agent configs, hooks, prompt-injection surfaces, exfiltration paths | `agent-security-audit` |
| Secrets in files, mock data and git history (manual patterns) | `secrets-scan` |
| MCP server code (MCP-01 to MCP-05); applies when an MCP server exists | `mcp-implementation-security-review` |
| OAuth 2.0 and OIDC review (RFC 9700); applies when a real sign-in exists | `secure-oauth-oidc` |

Read by path from other kits:

| Job | Skill |
| --- | --- |
| CI workflow hardening | `agents/tester/skills/github-actions-hardening/` |
| Property or fuzz tests to hand off | `agents/backend-engineer/skills/property-based-testing/` |

The two OWASP skills (CC-BY-4.0) reference `plays/` and `templates/` files
that were not copied; their `SKILL.md` steps are the procedure.
