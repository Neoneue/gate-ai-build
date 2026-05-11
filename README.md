# Constellation Gate AI · App

The live web application for Constellation Gate AI. Forked from the `mvp` design lab — same React + TypeScript + Vite stack, same design system primitives in `src/components/ui/`, but stripped of the artboard explorer chrome and spec sheets. This repo builds and deploys the production product surface, nothing else.

## Routes

| Path             | Page          |
| ---------------- | ------------- |
| `/`              | Dashboard     |
| `/requests`      | Requests      |
| `/conversations` | Conversations |
| `/models`        | Models        |
| `/security`      | Security      |
| `/activity`      | Activity      |
| `/team`          | Team          |
| `/settings`      | Settings      |

## Layout

```
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
