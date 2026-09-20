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
- [`audits/2026-09/audit-9-20.md`](../../audits/2026-09/audit-9-20.md)
  run 2: react-best-practices on the whole site, rbp-1 to rbp-13, verdict
  pass with fixes. rbp-1, 2, 5, 7, 11 applied (`244dad1`).
- Same file, run 3: test-smoke, smk-1 to smk-4. Four defects found by the
  new test tiers, all fixed the same day (`038545d`, `7e36271`).

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

### Focus ring, reduced motion, image dims: LOW sweep · [cc5b345]

- Ring recipe (`outline-none focus-visible:ring-2 focus-visible:ring-ring
  focus-visible:ring-offset-2 focus-visible:ring-offset-background`) on the
  message bubbles (`message-block.tsx`), code-card tabs (`code-card.tsx`)
  and findings cards (`RequestDetailBody.tsx`), so every pressable shows the
  same ring. Audit: wdg-2, wdg-3, wdg-24.
- `motion-reduce:transition-none` on 23 transitions that lacked it (badge,
  checkbox, radio, switch, segmented, mini-radio, option-tile, textarea,
  tabs, table, ask-ai-composer, Dashboard, DashboardDefault, Policies,
  PoliciesPane, SetupGateConnect, SetupManual); `ask-ai-composer` also gains
  `duration-150 ease-out`. `motion-reduce:animate-none` on the sonner and
  onboarding spinners. Audit: wdg-16, wdg-17.
- `width` / `height` on 15 logo and provider `<img>` tags (sidebar,
  DashboardChrome, Models, DashboardDefault, AuditRecordDialog); `size-*`
  marks match the class, `w-auto` marks carry real asset dimensions. Audit:
  wdg-14.
- Last live `hover-fine:` uses removed (feedback FAB now `hover:`, Messages
  row drops it). `body` gets `-webkit-tap-highlight-color: transparent`.
  Audit: wdg-18, wdg-21.
- Curly apostrophe in the workspace switcher; multi-select search
  `autoComplete="off" spellCheck={false}`; Conversations totals through
  `formatNumber`. Audit: wdg-20, wdg-22, wdg-26.

### `aria-hidden` on every decorative lucide icon · [b1db0b6]

- 75 icon tags in 34 files gain `aria-hidden`, matching the ~200 that
  already had it. Every icon-only control already carried an `aria-label`
  or `sr-only` text, so no accessible name was lost. Audit: wdg-13.

## Components

### Button-as-Link stops logging (`pages/pro-upgrade-card.tsx`, `pages/Notifications.tsx`) · [038545d]

- Before: the sidebar upgrade card and the Notifications "Change email"
  link rendered `Button render={<Link/>}` with Base UI's default
  `nativeButton`, logging a console error on nearly every page.
- After: `nativeButton={false}` at both call sites, matching the existing
  `AuditRecordDialog` precedent. No visual change.

### Animated icons seed their rest state (`components/ui/sliders-horizontal.tsx`, `components/ui/sparkles.tsx`) · [7e36271]

- Before: nine `m.line` and five `m.path` elements had `variants` with no
  `initial`, so the first hover wrote `undefined` to SVG attributes for one
  frame; 12 invalid-SVG errors when the Messages Filters button was clicked.
- After: `initial` set to each file's rest variant, which equals the static
  geometry, so nothing moves at mount. Six sibling icons animate transforms
  only and were left alone.

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

### Messages search box filters (`pages/requests/RequestsTable.tsx`) · [7e36271]

- Before: the toolbar `SearchInput` had no value or handler; typing did
  nothing and 25 rows stayed.
- After: case-insensitive substring over model label, key name, request id
  and message preview, ANDed with the four selects; page resets to 1 on a
  new query; zero matches show the existing "No messages" empty state.
  Same shape as the Security events search.

### Compression fallback prints one decimal (`pages/requests/RequestDetailBody.tsx`) · [7e36271]

- Before: rows without an authored compression value showed a rounded
  integer (`31%`).
- After: `toFixed(1)` (`31.4%`), per the one-decimal rule.

### Row keys and lookup maps, no visual change (`pages/requests/RequestsTable.tsx`, `pages/security/EventsTable.tsx`, `layouts/DashboardChrome.tsx`, `pages/Activity.tsx`, `pages/TeamDetailEnterprise.tsx`, `data/teams.ts`) · [244dad1]

- Rows key on `requestRowId` / `verdictKey` instead of time + index; the
  mobile drawer closes from the chrome's single breakpoint listener via a
  render-time adjust; `MODEL_BY_KEY`, `MEMBER_BY_ID`, `KEY_BY_ID` maps
  replace linear finds; the team roster and Full Request panel memoise
  their derivations. rbp-1, 2, 5, 7, 11.

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
