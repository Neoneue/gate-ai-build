# Agents

Home for every agent kit in this repo. One folder per agent, named after the
agent it belongs to:

```
agents/<agent-name>/         the kit: contract, knowledge, skills, anything the agent reads by path
.claude/agents/<agent-name>.md   the one-file definition Claude Code requires for discovery
```

Skills are owned by agents and live only in `agents/<agent-name>/skills/`.
Nothing agent-owned goes in `.claude/skills/` (that folder is for general
skills no agent owns) and nothing goes in `.agents/` (the skills.sh installer
default; adopt into the owning agent and delete it).

Kits are not linted (`agents/**` is excluded in markdownlint, Biome and
ESLint) because most of their content is vendored. Per-machine binaries stay
gitignored; see `.gitignore` for the impeccable engine.

Current agents: `front-end-developer`.
