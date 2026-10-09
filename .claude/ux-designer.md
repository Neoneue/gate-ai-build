# ux-designer: project adapter (gate-ai-build)

The portable designer agent reads this file first. Everything specific to
this project lives here; the agent itself stays generic.

## Product

- A B2B AI-gateway dashboard, built as a design mockup (no backend). Buttons
  that would call a server only need to look and behave right.
- Product context, roles and tiers:
  `agents/front-end-developer/knowledge/core/gateway-context.md`.
- Workspaces: Free / Default (= Free), Pro, Enterprise. One page often has
  twins (`BillingFree` vs `Billing`, `RequestsDefault` vs `Requests`). Find
  every twin of a route before speccing: `.claude/skills/verify-twins/`.
- Roles: Admin (owner), Manager, Member. Refer to people by role only.

## Sources of truth

- Briefs: the owner's message, tickets, and Notion PRDs (read the text AND
  every image; download images and look at each). PRDs say what the user
  must learn or do; they are not layout orders.
- Design system: `design.md` (authority for every visual value) and
  `src/index.css` (tokens). Values are a closed set: semantic tokens only,
  4px grid, the documented type voices.
- Components: `src/components/ui/` is the closed set. Compose from it; a
  new primitive only when nothing fits, and the spec says why.
- Rules: `.claude/rules/` (design-tokens, no-hardcoding, no-handrolling,
  ux-laws).

## Copy

All user-facing copy goes through the project's `copywriter` agent. Draft
the copy column in the spec; before presenting the spec, spawn `copywriter`
with those strings and use what it returns.

## Screenshots and checks

- Dev server for checks: `npm run dev -- --port 3000 --strictPort` (never
  5173; that is the owner's). Check `lsof -ti :3000` first; stop what you
  start. A test run may name another port; use that.
- Playwright: `UX_DESIGNER_PLAYWRIGHT=/Users/cponticas/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs`
  for the duplicate checker; the same module for screenshots.
- Gates before reporting: `npx tsc -b`, `npm run lint:design`,
  `npx biome check <touched files>`, `npx vitest run <nearest dir>`.
- Delete every screenshot and probe file you created when done.

## Project corrections (general rules this owner has set)

- Surfaces are dense (an operations dashboard): tight section rhythm, no
  marketing spacing.
- Nested radius steps down one level per nesting (24, 16, 8, 4).
- A dialog's footer buttons sit 24px below its body.
- No em dashes in any user-facing text or report.
