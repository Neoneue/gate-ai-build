# Gateway context: what you are designing, for whom, under which rules

> **When to load:** any brief that adds or reshapes a surface (new page, new
> section, new component, new empty state) or asks a UX question. Skip it for
> token swaps and literal class edits. Nothing here overrides `design.md`.

You design one product: the **Constellation Gate AI dashboard**. Gate is an
LLM gateway. A developer points an SDK or CLI at Gate with an API key; Gate
routes each request to a model at a provider, scans the prompt and the reply
for PII, credentials and prompt injection, compresses tokens where it can,
meters cost, and records everything. The dashboard is where the people who own
those keys watch, control and pay for that traffic.

## The three questions every screen answers

1. **What happened?** Requests, conversations, findings, cost, savings. The
   dashboard is a record of real traffic; every number on it derives from a
   real entity row in `src/data/`. Nothing is synthetic, nothing is a
   placeholder value.
2. **Is it safe?** Security events, guardrail verdicts, policies, limits,
   audit trail. Findings must be legible to a non-security engineer.
3. **Who can do what?** Keys, members, teams, budgets, roles, plan. This is
   where tiers and roles change the UI.

## Who is looking

Dashboard roles (Pro and Enterprise carry a "Viewing as" switch; Default and
Free are single-owner):

| Role | Fixture | Sees | Acts |
| --- | --- | --- | --- |
| Admin (org owner) | Chad | every page, whole org | everything, incl. owner-only actions (cancel plan, delete org, assign managers) |
| Manager | Kira Tan | own keys everywhere, plus ONE team's usage, budget, members, keys, security counts | team-scoped controls |
| Member | Mateus Silva | own keys only, no Teams surface | own settings |

A page a role cannot see is hidden from the sidebar AND blocked by URL. Prompt
content of other users stays hidden until AG-697 ships (not built, by design).

Devon (SDK/CLI), Olivia (dashboard defaults), Kate (enterprise org) and Ivan
(scan API) are ICP fixtures from the PRDs, not dashboard roles.

## Workspaces and tiers

Four workspace twins, each a separate page file (`Billing` vs `BillingFree`,
`Requests` vs `RequestsDefault`, ...). Confirm which twin renders before you
edit; a fix on the wrong twin looks identical to a fix that did nothing.

| Workspace | Meaning |
| --- | --- |
| **Default** | The Free plan rendered with its missing / not-yet-set-up states. The default landing. Enterprise-only features never render here. |
| **Free** | Free plan, set up. |
| **Pro** | Paid; roles switch on. |
| **Enterprise** | Roles plus forced settings (org Settings tab, team lock card, cascade, locked banners) gated by `isEnterpriseSurface`. |

Free-plan surfaces show one clear upgrade path, never a wall of locks.

## Product facts that shape layout

- **One user, long sessions.** One conversation has many requests; tokens-in
  grow monotonically across a conversation. Tables are the primary surface.
- **Status and Guardrail are two axes** on a request, five valid combinations,
  three security checks (PII, credentials, injection). Never collapse them into
  one badge.
- **Budgets** attribute key-first, then user. Soft default is warn + block.
  One team per user.
- **Compression and budget percentages** render with one decimal (22.4%).
- **Detail surfaces are pages, not modals**: `/messages-findings/:id`,
  `/conversations-trace/:id`, `/teams/:teamId`, each with tier twins. Links
  carry the tier suffix via `withTierOf`.
- **Charts reconcile.** One constant feeds the KPI, the bars and the copy.
  Column density steps DOWN as the container narrows, by container-width tier.
- **Featured model badges** are CMS seed data; never debate the wording.
- **Fingerprint** is the UI word; code keeps `anchor`.

## Standing UI laws (memory of past corrections)

These are settled. Apply them without being told; list a conflict, do not
resolve it yourself.

- Heading ladder: 32 page / 24 section and tab header / 20 block, table,
  dialog / 16 card title. Subtitles under a 24px heading are 16px copy.
- Spacing on the 4px grid; `px-2.5` is the only permitted half step.
- Radius steps down one rung per nesting level: 24 / 16 / 8 / 4.
- Table rows are 48px minimum (`TableRow` carries `h-12`). Every column gets
  `whitespace-nowrap`; numerics are `text-right`; no `truncate` without a
  width.
- Cards are `border-border` + `shadow-xs`. Tailwind shadow scale only
  (xs / sm / md / lg); never shadow-as-border.
- Press is `active:scale-[0.98]`; `lg` buttons are `px-4`; `Plus` icons are
  CSS `scale-110`. Lucide stroke is 1.75 globally, never keyed to text weight.
- `Eyebrow` is reserved for the nav rail and KPI tiles; card titles use
  `CardTitle`.
- Dialog footers sit 24px below the body. Dialog width needs an `!important`
  cap because the primitive default overrides the call site.
- Every value appears once in a detail surface; no duplication.
- Overview: 4 KPI tiles + 3 preview tables capped at 8 rows + workspace
  switcher.
- Range selectors default to "All". Revoked keys are never selectable.
- Motion: 150ms open / 100ms close for floating surfaces, Dialog 200 / 120,
  Sheet 300 / 200, 200ms ease-out for indicators. Dashboards do not animate on
  load: no mount stagger, no entrance fades. `motion-reduce:` opts out.
- Geist is the brand font; a font-overuse warning on Geist is a false
  positive.
- Base UI primitives only, never Radix. Calendar is react-day-picker v10.
  Add `data-closed:fill-mode-forwards` to popups and overlays against dismiss
  flicker.

## Where truth lives

| Question | Read |
| --- | --- |
| Any visual value, component spec, do / don't | `design.md` (repo root), then `src/index.css` |
| Routes, types, mock-data model, page inventory, entity relationships | `data-model.md` (repo root) |
| What a feature must do | `docs/prds/` and `docs/tickets/` (local only); Notion H1 + H2 hubs are the live spec |
| What a finding may say | the existing findings in `src/data/requests.ts` (shape, entity types, verdict enums) |
| What changed recently and why | `change-logs/INDEX.md`, then the day file |
| Hard rules that fail the build | `.claude/rules/` (`design-tokens`, `no-hardcoding`, `no-handrolling`, `no-thrash`, `token-efficient-reads`) |

The PRD and tickets are the only product truth. Where they are silent it is
our design call; never borrow a concept from another codebase or a person's
description of one. Every UI element maps to a PRD or ticket sentence;
behavioral requirements get no explanatory UI.
