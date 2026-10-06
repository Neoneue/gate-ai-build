# Skills index: backend-engineer

Eight skills owned by the `backend-engineer` agent. This file says which one
to reach for; each skill's `SKILL.md` says how. gate-ai-build is a design
mockup with no server: the data layer (`src/data/`, `src/lib/`) is the
backend stand-in, so five of these apply only once a backend exists.

| Job | Skill |
| --- | --- |
| Typing records, entity shapes and derived values | `typescript-advanced-types` |
| Designing an API contract, errors, status codes | `api-and-interface-design` |
| Property tests and invariants (fast-check is not a dependency) | `property-based-testing` |
| MCP server tools, transport, sessions (when a backend exists) | `build-mcp-server` |
| An MCP tool's shape, or an eval that agents can use the tools (when a backend exists; never run its `evaluation.py`: paid API) | `mcp-builder` |
| Redis commands, Lua scripts, TTLs, pipelines (when a backend exists) | `upstash-redis-js` |
| Rate limiting (when a backend exists) | `upstash-ratelimit-js` |
| Choosing Redis data structures and key names (when a backend exists) | `redis-core` |

Read by path from other kits (one home each):

| Job | Skill |
| --- | --- |
| Root-cause a failure or flake before fixing | `agents/tester/skills/systematic-debugging/` |
| Write or judge a test | `agents/tester/skills/test-driven-development/writing-good-tests.md` |
| Before any done, fixed or passing claim | `agents/orchestrator/skills/verification-before-completion/` |
