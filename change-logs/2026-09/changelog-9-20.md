# UI Changelog: 2026-09-20

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-9-18.md`](./changelog-9-18.md)

---

## Audits

- [`audits/2026-09/audit-9-20.md`](../../audits/2026-09/audit-9-20.md):
  web-design-guidelines on the whole site, 32 items, verdict fail. wdg-2,
  wdg-3, wdg-24 downgraded HIGH to LOW on review (browser default focus
  outline is present). wdg-1 and wdg-4 applied (`a2debd7`).
- [`audits/2026-09/audit-9-18.md`](../../audits/2026-09/audit-9-18.md):
  `ui-audit-9-18.md` and `color-audit-9-18.md` rolled into the daily shape.
  Original numbers kept behind aliases (`bui-`, `mifb-`, `rbp-`, `col-`).
- New [`audits/INDEX.md`](../../audits/INDEX.md), same job as the
  change-log index.

## Conventions

### One chart tooltip recipe (`components/ui/chart.tsx`, design.md "Chart tooltip & legend") · [3e1290b]

- Before: three drifted recipes across six charts. Security and Messages
  hero used the primitive's 10px `rounded-[2px]` square, gray date, mono
  12 values. Activity trend and Overview usage bars hand-drew rows through a
  JSX `formatter`: 8px `rounded-xs` swatch, `type-mono-14` values. Compact
  KPI sparks and the team security pane hand-drew sans `type-label-14`
  values with `gap-1`. Date strings came from each chart's own formatter
  ("Aug 14, 2026 06:30" vs "Sep 15").
- After: `ChartTooltipContent` owns the row. Date `type-label-12
  text-foreground`; indicator `size-2 rounded-full` coloured from config;
  name `type-copy-12 text-muted-foreground`; value `type-mono-12
  text-foreground`, `gap-6` from the name. New `valueFormatter` prop
  replaces JSX `formatter`, which is no longer honoured. `hideIndicator`
  also drops the name, so single-series sparks show the value alone under
  the date. Legend swatch is the same circle. Consumers stripped of
  `formatter`, `labelClassName`, `className="gap-1"`: Security,
  HeroMetric, TrendCard, Dashboard, compact-kpi, SecurityOverviewPane.
- Date shape: new `formatChartTooltipDate(date, granularity, range)` in
  `lib/formatters.ts`. Hourly "Aug 14, 06:30", daily "Sep 15", year only
  when the chart's range crosses a year boundary. Routed through
  events-data, hero-data, Dashboard, TrendCard, Activity,
  TeamDetailEnterprise, Conversations, token-savings-data.
  `formatSparkLabel` stays axis-only.
- Verify: hover the Overview usage bars, `/activity` trend, `/security`
  events, `/messages` hero, any KPI spark. Every dot is round, every date
  is foreground, every value is mono 12.

### Navigation renders as links (`components/ui/sidebar.tsx`, `text-link.tsx`, `back-link.tsx`) · [f54859b]

- Before: every sidebar nav item, the logomark, Account settings, both
  link primitives and two navigate-only Buttons were `<button>`s calling
  `navigate()`. Nav announced as buttons and lost Cmd-click, middle-click
  and copy-link.
- After: sidebar rows, logomark, brand and Account settings are react-router
  `<Link>`s with `aria-current="page"` on the active one; Theme, Docs and
  Sign out stay buttons. `BackLink` gains `href`, `TextLink` gains `to`
  (`as="a"` is now external-only since a plain anchor full-reloads the
  SPA). Converted: SignIn, SignUp, ConversationsTrace, RequestsFindings,
  onboarding-shared `SetupBackLink`, TeamDetailEnterprise, Conversations
  row drill-in (`RowActionButton href`), pro-upgrade-card and Notifications
  Buttons via `render={<Link />}`. Pages keep passing `onNavigate`; nav
  rows no longer call it, so one history push per click. Mobile Sheet
  closes via a new side-effect-only `onNavItemClick`.
- Audit: wdg-5, wdg-6, wdg-25, wdg-18 (Conversations line).

### Self-hosted Geist + Geist Mono (`src/index.css`) · [f54859b]

- Before: Google Fonts `@import` (render-blocking, third-party origin)
  supplied Geist and Geist Mono while `@fontsource-variable/geist` shipped a
  second copy of the sans.
- After: `@fontsource-variable/geist` + new `@fontsource-variable/geist-mono`,
  families `"Geist Variable"` / `"Geist Mono Variable"` in `--font-sans` /
  `--font-mono`. Zero requests to googleapis. Preload skipped: Vite hashes
  the woff2 path.
- Audit: wdg-11.

## Components

### Button base gains `touch-manipulation` (`components/ui/button.tsx`) · [f54859b]

- Removes the 300ms double-tap delay on touch for every Button. Audit: wdg-12.

### NavTableRow drops the `<tr>` link role (`components/ui/table.tsx`) · [a2debd7]

- Before: `<tr role="link" tabIndex={0}>` with Enter/Space activation and a
  focus ring on the row. Invalid ARIA (a `<tr>` carries only `role="row"`),
  which the repo's own `row-action-button.tsx` header had banned since
  2026-05-09.
- After: the `<tr>` keeps default semantics and `onClick` as a mouse-only
  convenience. The keyboard target is a `RowActionButton` in the identifier
  cell, rendered as a real `<a href>` on every consumer: Dashboard messages,
  conversations and security previews, Teams Enterprise active + archived
  rows, Notifications inbox. `aria-label` moves from the row to the button;
  the primitive's `Omit` now blocks `aria-label` on the `<tr>`.
- Notifications: the checkbox and archive `onKeyDown` stoppers were dead
  once the row stopped listening and are removed; `onClick` stoppers stay.
  Link click pushes one history entry (markRead + Link, no double navigate).
- Audit: wdg-1.

## Sections & surfaces

### Landmarks: top bar is a `<header>`, auth pages get a `<main>` (`layouts/DashboardChrome.tsx`, `layouts/AuthLayout.tsx`) · [f54859b]

- Same classes, semantic tags. Audit: wdg-8.

### Setup model search gets a name and a ring (`pages/SetupManual.tsx`) · [f54859b]

- Before: the popover search input had no label and `focus-visible:ring-0`,
  which never actually cancelled the ring (Tailwind v4 ring width is `0 +
  ring-offset`, and `ring-offset-2` leaked from the Input base), so it drew
  a stray 2px ring.
- After: `aria-label="Search models"`, `spellCheck={false}`,
  `focus-visible:ring-offset-0` on the input; the wrapper row carries
  `focus-within:ring-2 focus-within:ring-ring`.
- Verify: `/setup-manual?bill=payg`, open a model picker, Tab into search.
- Audit: wdg-31.

### Skip link on the dashboard shell (`layouts/DashboardChrome.tsx`) · [a2debd7]

- Before: no skip link; keyboard users tabbed the full rail and top bar on
  every route before reaching content. `<main>` had no `id`.
- After: "Skip to content" is the first tab stop, `sr-only` until focused,
  then `bg-card` + `border-border` + `shadow-xs` with the site ring recipe
  and `type-label-14`. `<main id="main-content" tabIndex={-1}>` so focus
  lands on the pane; `focus:outline-none` on `<main>` because the pane is
  not operable and Chrome otherwise paints a full-width ring.
- Verify: `/`, Tab once, Enter; next Tab lands inside the content.
- Audit: wdg-4.
