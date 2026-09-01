# Constellation Gate AI · App

The live web application for Constellation Gate AI. Forked from the `mvp` design lab — same React + TypeScript + Vite stack, same design system primitives in `src/components/ui/`, but stripped of the artboard explorer chrome and spec sheets. This repo builds and deploys the production product surface, nothing else.

## Routes

`/` and unknown paths redirect to `/overview`. Full specs per page live in
[`data-model.md`](./data-model.md) §6.

### Core (sidebar)

| Path | Page |
| --- | --- |
| `/overview` | Overview (`Dashboard.tsx`) |
| `/requests` | Requests |
| `/conversations` | Conversations |
| `/models` | Models |
| `/token-savings` | Token Savings |
| `/limits` | Limits |
| `/security` | Security events |
| `/policies` | Policies |
| `/audit-trail` | Audit Trail |
| `/activity` | Activity |
| `/members` | Team |
| `/billing` | Billing |
| `/api-keys` | API Keys |
| `/settings` | Settings |

### Detail / route-only

| Path | Page |
| --- | --- |
| `/requests-findings/:requestId` | Request findings detail |
| `/conversations-trace/:conversationId` | Conversation trace detail |
| `/upgrade` | Plan upgrade |

### Tier / onboarding variants

| Path | Page |
| --- | --- |
| `/overview-default` | Overview, empty-workspace variant |
| `/api-keys-default` | API Keys, empty-workspace variant |
| `/limits-default` | Limits, Pro-upsell variant |
| `/events-default` | Security, Pro-upsell variant |
| `/token-savings-free` | Token Savings, free-tier variant |
| `/limits-free` | Limits, free-tier variant |
| `/security-free` | Security, free-tier variant |

### Auth

| Path | Page |
| --- | --- |
| `/sign-in` | Sign in |
| `/sign-up` | Sign up |

Deep-link query params: `?open=<id>` (Conversations/Requests detail modal),
`?create=1` (Limits create flow), `?range=<key>` (Activity range).

## Layout

```text
src/
  App.tsx           — react-router routes
  main.tsx          — entry
  layouts/
    DashboardChrome.tsx   — production shell (header, sidebar, breadcrumb)
    nav-sections.ts       — sidebar nav data
  pages/             — one file per route, each renders DashboardChrome + body
  components/ui/     — design system primitives (Card, Badge, Select, Table, ...)
  components/icons/  — vendor avatars
  lib/               — utils (cn, chart palette)
design.md            — canonical design spec
```

## Develop

```bash
npm install
npm run dev      # vite dev server with HMR
npm run build    # tsc -b && vite build → dist/
npm run preview  # serve dist/ locally
npm run lint     # eslint
```

## Updating from the design lab

The design system primitives in `src/components/ui/` originate in the `mvp` repo and are copied here manually. When a primitive changes upstream, port it by hand — no monorepo workspace or published package today.

## Stack

- React 19 + TypeScript
- Vite (build) + Tailwind v4 (styling, tokens in `src/index.css`)
- react-router-dom (routing)
- Base UI (`@base-ui/react`) — primitive layer under most UI components
- Recharts (charts)
- Lucide (icons)
- Sonner (toasts)
