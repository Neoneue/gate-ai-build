# Architect skills

| Job | Skill | Notes |
| --- | --- | --- |
| A change to anything already shipped: a type or field, an enum value, a route, a deep-link param | `deprecation-and-migration/` | Expand, migrate, contract. Every twin, chart, filter and data test reads the old shape, so the expand step is mandatory and the contract step waits for every reader |
| Writing down why a contract is the way it is | `documentation-and-adrs/` | Record in `data-model.md` with the PRD or ticket sentence, or the owner's decision, and the date. Its `docs/decisions/` default needs the owner's yes. Never quote chat lines |

Routed from other kits (read by path): `api-and-interface-design`,
`redis-core`, `build-mcp-server`, `property-based-testing`
(backend-engineer; the Redis and MCP skills apply once a backend exists),
`security-threat-model` (security-reviewer), `doc-coauthoring`
(researcher). Full table: `.claude/agents/architect.md`.
