# Audit - 2026-09-20

Read-only reviews by the `front-end-developer` agent. Checklist: tick an
item when it is applied and verified, then append the commit hash to the
item's first line. Pick items by ID ("wdg-1, wdg-4"). Paths are relative
to `src/`. Already decided, not re-flagged: see the settled table in
`.claude/skills/ui-audit/SKILL.md`.

## Runs

| # | Time (CT) | Skill | Scope | Items |
| --- | --- | --- | --- | --- |
| 1 | 11:11 | web-design-guidelines | whole site (196 `.tsx`, `src/data` excluded) | wdg-1 to wdg-32 |
| 2 | 15:36 | react-best-practices | whole site (271 `.ts`/`.tsx`, 71.8k lines, three parallel reviewers; blobs + tests excluded) | rbp-1 to rbp-13 |
| 3 | 16:20 | test-smoke (Playwright 8 flows + vitest 144 route cases) | whole site | smk-1 to smk-2 |

## web-design-guidelines

### Global

- [x] **wdg-1 HIGH** (applied 2026-09-20, `a2debd7`; also converted the third `NavTableRow` in Dashboard.tsx:876 (security preview) and added `aria-label` to the primitive's Omit so no call site can name the `<tr>`) components/ui/table.tsx:184, components/ui/table.tsx:185
  - Before: `NavTableRow` renders `<TableRow role="link" tabIndex={0}>`, a `<tr>` with its row role overwritten. Consumers: pages/Notifications.tsx:1121, pages/Dashboard.tsx, pages/TeamsEnterprise.tsx.
  - After: drop `role="link"` and `tabIndex={0}` from the `<tr>`; move the keyboard target into the row's primary cell via the existing `RowActionButton href=` (the pattern codified in components/ui/row-action-button.tsx:10), keeping `onClick={onActivate}` on the `<tr>` as mouse-only convenience.
  - Why: `<tr>` legally carries only `role="row"`; overriding it removes the row and every cell from the table's grid structure for assistive tech, so column headers stop being announced. The repo documents this rule in row-action-button.tsx and contradicts it here.
- [x] **wdg-4 HIGH** (applied 2026-09-20, `a2debd7`; `<main>` also took `tabIndex={-1}` so focus lands after activation, and `focus:outline-none` since the pane is not operable; skip link uses the design.md ring recipe + `type-label-14`) layouts/DashboardChrome.tsx:265
  - Before: `<main className="@container flex max-w-[1920px] …" ref={mainRef}>` with no `id`, and no skip link anywhere in the app.
  - After: `<main id="main-content" …>` plus, as the first child of the chrome root, `<a className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-sm focus:bg-card focus:px-3 focus:py-2 focus:ring-2 focus:ring-ring" href="#main-content">Skip to content</a>`.
  - Why: a keyboard user tabs the full sidebar (2 rail/nav groups, 4 account rows, top bar) on every route before reaching content. WCAG 2.4.1.
- [x] **wdg-5 MEDIUM** (applied 2026-09-20, `f54859b`; nav rows, logomark, brand and Account settings are `<Link>`; Theme / Docs / Sign out stay buttons; `onNavItemClick` added so the mobile Sheet still closes) components/ui/sidebar.tsx:187, components/ui/sidebar.tsx:312, components/ui/sidebar.tsx:439, components/ui/sidebar.tsx:457, components/ui/sidebar.tsx:468, components/ui/sidebar.tsx:476, layouts/DashboardChrome.tsx:402
  - Before: every primary nav target is `<button type="button" onClick={() => onNavigate?.(item.pageId)}>`; each page wires `onNavigate={(path) => navigate(path)}` (35 call sites, e.g. pages/ApiKeys.tsx:143).
  - After: render `<Link to={item.pageId} className={isActive ? NAV_ROW_ACTIVE : NAV_ROW} aria-current={isActive ? "page" : undefined}>` (react-router `Link` is already imported in components/ui/row-action-button.tsx); keep `<button>` only for the theme toggle and Sign out.
  - Why: the whole nav loses Cmd/Ctrl-click, middle-click, "Copy link address", and announces as "button" instead of "link". Skill rule "Links use `<a>`/`<Link>`".
- [x] **wdg-6 MEDIUM** (applied 2026-09-20, `f54859b`; `BackLink href`, `TextLink to` (a plain `as="a"` full-reloads, now external-only); Button sites use `render={<Link />}`) components/ui/text-link.tsx:64, components/ui/back-link.tsx:37
  - Before: both primitives render `<button type="button">`; navigation call sites pass `onClick={() => navigate(...)}`: pages/SignIn.tsx:132, pages/SignUp.tsx:109, pages/ConversationsTrace.tsx:53, pages/RequestsFindings.tsx:57, pages/onboarding-shared.tsx:172, pages/TeamDetailEnterprise.tsx:290, pages/pro-upgrade-card.tsx:25, pages/Notifications.tsx:623.
  - After: `TextLink` already has an `as="a"` branch (text-link.tsx:57); add an `href`/`to` prop to `BackLink` that renders `<Link to={…} className={cn(BACK_LINK_BASE, className)}>`, and switch those 8 sites from `onClick={() => navigate(x)}` to `href={x}`.
  - Why: same rule as wdg-5; these are route changes rendered as buttons.
- [x] **wdg-8 MEDIUM** (applied 2026-09-20, `f54859b`) layouts/DashboardChrome.tsx:359, layouts/AuthLayout.tsx:258
  - Before: the top bar returns `<div className="sticky top-0 z-40 flex h-16 …">`; `AuthLayout` renders `<Outlet />` inside plain `<div>`s with no `<main>`.
  - After: `<header className="sticky top-0 z-40 flex h-16 …">` in DashboardChrome; wrap the AuthLayout outlet as `<main className="…"><Outlet /></main>`.
  - Why: SignIn and SignUp have no main landmark, and the dashboard has no banner landmark. Skill rule "Use semantic HTML before ARIA". The `<aside aria-label="Primary navigation">` and `<nav>` in sidebar.tsx:94,300 are correct.
- [x] **wdg-11 MEDIUM** (applied 2026-09-20, `f54859b`; `@fontsource-variable/geist-mono` added, families renamed to `Geist Variable` / `Geist Mono Variable`; preload skipped, Vite hashes the asset) src/index.css:2, src/index.css:6
  - Before: `@import url("https://fonts.googleapis.com/css2?family=Geist…&display=swap");` followed by `@import "@fontsource-variable/geist";`. Geist is fetched twice, once from a third-party origin, and index.html has no `preconnect` or `preload`.
  - After: drop the Google Fonts `@import` (line 2), keep the self-hosted `@fontsource-variable/geist`, and add `<link rel="preload" as="font" type="font/woff2" crossorigin href="/…/geist-latin-wght-normal.woff2">` to index.html.
  - Why: a CSS `@import` to fonts.googleapis.com is render-blocking on a domain never preconnected, and the second copy is dead bytes. Skill rules "preconnect for CDN domains" and "critical fonts preload".
- [x] **wdg-12 MEDIUM** (applied 2026-09-20, `f54859b`) components/ui/button.tsx:14
  - Before: base string `"group/button inline-flex shrink-0 select-none items-center … will-change-transform focus-visible:… active:not-aria-[haspopup]:scale-[0.98] …"` has no `touch-manipulation`. Only components/ui/icon-action-button.tsx:30 sets it.
  - After: insert `touch-manipulation` into the Button base string, next to `select-none`.
  - Why: every Button on the site carries the 300ms double-tap-zoom delay on touch. Skill rule "`touch-action: manipulation`".
- [ ] **wdg-7 LOW** components/ui/card.tsx:123
  - Severity: was MEDIUM, downgraded 2026-09-20. Heading-level skips are best practice, not a WCAG failure, and flipping the default to h2 would silently change hierarchy on every card including ones nested under an existing h2.
  - Before: `function CardTitle({ as: Tag = "h3", … })`; pages render `PageTitle` (`<h1>`, page-title.tsx:32) then jump straight to `<h3>`. Only 1 call site overrides `as=`, and 18 `<h2>` exist across 196 files.
  - After: default `CardTitle` to `as: Tag = "h2"`, and keep `h3` for cards nested inside a section that already has an `h2`.
  - Why: heading levels must not skip; "h1 then h3" is the shape on most pages. Skill rule "Headings hierarchical `<h1>` to `<h6>`".
- [ ] **wdg-9 LOW** pages/requests/RequestsTable.tsx:326, pages/requests/RequestsTable.tsx:349, pages/requests/RequestsTable.tsx:371, pages/requests/RequestsTable.tsx:394, pages/security/EventsTable.tsx:386, pages/security/EventsTable.tsx:408, pages/security/EventsTable.tsx:429, pages/security/EventsTable.tsx:451, pages/AuditTrail.tsx:472, pages/AuditTrail.tsx:486, pages/AuditTrail.tsx:503, pages/teams/dialogs.tsx:417, pages/teams/dialogs.tsx:728
  - Severity: was MEDIUM, downgraded 2026-09-20. The triggers already carry `aria-label`, so the accessible name exists; the gain is a clickable label on 13 filter fields.
  - Before: `<Label className="type-label-14 text-muted-foreground">Model</Label>` above a `<SelectTrigger id="filter-model" aria-label="Model">`; the label has no `htmlFor`.
  - After: `<Label className="type-label-14 text-muted-foreground" htmlFor="filter-model">Model</Label>` and drop the now-duplicated `aria-label` from the trigger.
  - Why: the visible label is not a click target and is not programmatically associated; the name is duplicated in two places that can drift. Skill rules "Labels clickable" and "Form controls need `<label>`".
- [ ] **wdg-10 LOW** index.html:6
  - Severity: was MEDIUM, downgraded 2026-09-20. Mobile browser chrome tint only; not needed for this mockup.
  - Before: `<meta name="viewport" content="width=device-width, initial-scale=1.0">` and no `theme-color` meta, while the app sets light/dark before paint (index.html:13-23).
  - After: add `<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">` and `<meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)">` matching `--background` in src/index.css:199 and :764.
  - Why: mobile browser chrome renders the wrong colour band above and below a dark dashboard. Skill rule "`theme-color` matches page background".
- [x] **wdg-2 LOW** (applied 2026-09-20, `cc5b345`) components/ui/message-block.tsx:185, components/ui/message-block.tsx:214
  - Severity: was HIGH, downgraded 2026-09-20. No `outline-none` on these buttons and the base layer applies `outline-ring/50`, so the browser default focus-visible outline shows. Ring-recipe consistency, not WCAG 2.4.7.
  - Before: `bubbleClasses` = `"max-h-[200px] overflow-y-auto overscroll-contain rounded-md border p-4 transition-[box-shadow,border-color] …"`; `<Bubble>` renders as `<button type="button">` whenever `onClick` is set.
  - After: append `outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background` to the `bubbleClasses` base string.
  - Why: every message bubble in the conversation trace is a focusable button with no visible focus indicator. WCAG 2.4.7. This is the primary cross-link selection control on that surface.
- [x] **wdg-3 LOW** (applied 2026-09-20, `cc5b345`) components/ui/code-card.tsx:167, components/ui/code-card.tsx:177
  - Severity: was HIGH, downgraded 2026-09-20. No `outline-none` on these buttons and the base layer applies `outline-ring/50`, so the browser default focus-visible outline shows. Ring-recipe consistency, not WCAG 2.4.7.
  - Before: `sharedClass` = `"inline-flex h-6 items-center rounded-xs px-3 font-sans text-sm transition-colors duration-150 ease-out"`, applied to a real `<button aria-pressed>`.
  - After: `"inline-flex h-6 items-center rounded-xs px-3 font-sans text-sm outline-none transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"`.
  - Why: the code-card language and tab toggles are keyboard-reachable with no focus ring and no reduced-motion opt-out.
- [x] **wdg-13 LOW** (applied 2026-09-20, `b1db0b6`; 75 icons in 34 files, one more than counted) components/ui/pagination.tsx:82, components/ui/pagination.tsx:98, components/ui/pagination.tsx:122, components/ui/select.tsx:139, components/ui/select.tsx:228, components/ui/select.tsx:260, components/ui/select.tsx:278, components/ui/dialog.tsx:124, components/ui/dialog.tsx:217, components/ui/sheet.tsx:139, components/ui/table.tsx:282, components/ui/table.tsx:290, components/ui/table.tsx:298, components/ui/sonner.tsx:17-21, components/ui/multi-select.tsx:251, components/ui/multi-select.tsx:266, components/ui/sidebar.tsx:445, components/ui/sidebar.tsx:450, components/ui/sidebar.tsx:462, components/ui/sidebar.tsx:470, components/ui/sidebar.tsx:522, components/ui/table-empty-state.tsx:63, components/ui/notifications-menu-body.tsx:339
  - Before: decorative lucide glyphs rendered with no `aria-hidden` (74 sites total; the 51 page-level ones include pages/ActivityDefault.tsx:42-111, pages/RequestsDefault.tsx:42,65, pages/ConversationsDefault.tsx:43-93, pages/TokenSavingsDefault.tsx:46-74, pages/AuditTrailDefault.tsx:59-98, pages/SecurityDefault.tsx:46,69, pages/ApiKeys.tsx:183,277, pages/requests/RequestDetailBody.tsx:762,772).
  - After: add `aria-hidden` to each, e.g. `<ChevronDownIcon aria-hidden className="size-4 …" />`.
  - Why: the repo's own convention (used correctly on about 200 other icons) is `aria-hidden` on decorative glyphs; without it assistive tech may announce a bare graphic next to the already-correct accessible name.
- [x] **wdg-14 LOW** (applied 2026-09-20, `cc5b345`; 15 sites, the extra is the second logo mark in sidebar.tsx; `w-auto` marks took real asset dimensions) components/ui/sidebar.tsx:167, components/ui/sidebar.tsx:375, components/ui/sidebar.tsx:381, layouts/DashboardChrome.tsx:407, pages/Models.tsx:1020, pages/Models.tsx:1029, pages/Models.tsx:1038, pages/Models.tsx:1460, pages/DashboardDefault.tsx:438, pages/DashboardDefault.tsx:698, pages/DashboardDefault.tsx:819, pages/DashboardDefault.tsx:837, pages/DashboardDefault.tsx:858, pages/AuditRecordDialog.tsx:35
  - Before: `<img alt="" aria-hidden className="size-6" src={p.icon} />`; size comes only from the class.
  - After: add intrinsic dimensions, e.g. `<img alt="" aria-hidden className="size-6" height={24} src={p.icon} width={24} />` (layouts/AuthLayout.tsx:202 already does this).
  - Why: no intrinsic ratio means a layout shift between markup parse and CSS apply on slow first paint. Skill rule "`<img>` needs explicit `width` and `height`".
- [ ] **wdg-15 LOW** (skipped by decision 2026-09-20: keep the blur for now, the blur-family row stays OPEN in the settled table) components/ui/theme-toggle.tsx:32, components/ui/theme-toggle.tsx:42, layouts/DashboardChrome.tsx:378, layouts/DashboardChrome.tsx:388
  - Before: `"absolute size-4 transition-[opacity,scale,filter] duration-300 … motion-reduce:transition-none"` with `blur-[1px]` / `blur-0` as the animated endpoints.
  - After: `"absolute size-4 transition-[opacity,scale] duration-300 …"` and drop `blur-[1px]` / `blur-0` from both branches.
  - Why: `filter` is not compositor-friendly (skill: "Animate `transform`/`opacity` only") and `filter` is excluded from design.md's transition property list, so this violates both. Relates to the OPEN blur-family row in the settled table.
- [x] **wdg-16 LOW** (applied 2026-09-20, `cc5b345`) components/ui/badge.tsx:26, components/ui/checkbox.tsx:41, components/ui/radio-group.tsx:25, components/ui/switch.tsx:17, components/ui/segmented.tsx:61, components/ui/segmented.tsx:195, components/ui/mini-radio-group.tsx:55, components/ui/option-tile.tsx:24, components/ui/textarea.tsx:10, components/ui/tabs.tsx:103, components/ui/table.tsx:265, components/ui/ask-ai-composer.tsx:105, pages/Dashboard.tsx:722, pages/DashboardDefault.tsx:463, pages/DashboardDefault.tsx:707, pages/Policies.tsx:721, pages/teams/PoliciesPane.tsx:510, pages/SetupGateConnect.tsx:142, pages/SetupManual.tsx:209, pages/SetupManual.tsx:255, pages/SetupManual.tsx:267, pages/SetupManual.tsx:291, pages/SetupManual.tsx:391
  - Before: a `transition-colors` / `transition-opacity` / `transition-[…]` declaration with no reduced-motion opt-out in the same class string.
  - After: append `motion-reduce:transition-none` to each (the shape used in components/ui/button.tsx:14 and components/ui/table.tsx:148).
  - Why: design.md requires `motion-reduce:` on every transition; skill rule "Honor `prefers-reduced-motion`". components/ui/ask-ai-composer.tsx:105 also has no `duration-*` or `ease-*`, so it falls back to the browser default curve.
- [x] **wdg-17 LOW** (applied 2026-09-20, `cc5b345`) components/ui/sonner.tsx:21, pages/onboarding-shared.tsx:210
  - Before: `loading: <Loader2Icon className="size-4 animate-spin" />` and `"animate-spin text-blue-600 dark:text-blue-400"`.
  - After: `"size-4 animate-spin motion-reduce:animate-none"` and `"animate-spin motion-reduce:animate-none text-blue-600 dark:text-blue-400"` (components/ui/skeleton.tsx:28 is the precedent).
  - Why: an unbounded spin is the motion `prefers-reduced-motion` users most often cite; skeleton already guards, these two do not.
- [x] **wdg-18 LOW** (applied 2026-09-20: Conversations line `f54859b`, feedback-fab + RequestsTable `cc5b345`; zero live `hover-fine:` left in `src`) components/ui/feedback-fab.tsx:101, pages/Conversations.tsx:670, pages/requests/RequestsTable.tsx:719
  - Before: `hover-fine:-translate-y-px` / `hover-fine:bg-accent`, against `@custom-variant hover-fine` at src/index.css:9, which the repo documents as emitting invalid CSS (components/ui/card.tsx:82-87).
  - After: use `hover:` and pair with the existing pointer guard, e.g. `hover:bg-accent` on the row (components/ui/table.tsx:148 already supplies row hover from the primitive, so the two table lines can drop the class entirely).
  - Why: these three rules are silently dead; the hover feedback never paints. Flagged per brief as remaining `hover-fine:` uses.
- [ ] **wdg-19 LOW** components/ui/feedback-fab.tsx:81, index.html:6
  - Before: `"fixed right-4 bottom-4 z-40 sm:right-6 sm:bottom-6"` on the 48px FAB, with no `env(safe-area-inset-*)` anywhere in the repo and no `viewport-fit=cover`.
  - After: `content="width=device-width, initial-scale=1.0, viewport-fit=cover"` in index.html, and `"fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 sm:right-6 sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))]"`.
  - Why: on a notched iPhone the FAB sits under the home indicator. Skill rule "Full-bleed layouts need `env(safe-area-inset-*)`".
- [x] **wdg-20 LOW** (applied 2026-09-20, `cc5b345`) components/ui/workspace-switcher.tsx:55, components/ui/workspace-switcher.tsx:75, components/ui/workspace-switcher.tsx:84, components/ui/workspace-switcher.tsx:96, components/ui/workspace-switcher.tsx:108
  - Before: `<span className="truncate">Chad's workspace</span>` with a straight apostrophe.
  - After: `<span className="truncate">Chad’s workspace</span>`.
  - Why: the only user-facing straight apostrophes left in the app (every other hit is inside a code comment). Skill rule "Curly quotes".
- [x] **wdg-21 LOW** (applied 2026-09-20, `cc5b345`) src/index.css:9
  - Before: no `-webkit-tap-highlight-color` declared anywhere, so iOS paints its default grey flash over every row, nav item and Button.
  - After: add `-webkit-tap-highlight-color: transparent;` to the `body` (or `:root`) rule in src/index.css, since every interactive surface already ships its own `active:` state.
  - Why: skill rule "`-webkit-tap-highlight-color` set intentionally"; the default flash fights the `active:scale-[0.98]` press.
- [x] **wdg-22 LOW** (applied 2026-09-20, `cc5b345`) components/ui/multi-select.tsx:269
  - Before: `<input aria-label="Search options" className="…" onChange={…} placeholder="Search options…" type="text" value={query} />`.
  - After: add `autoComplete="off"` and `spellCheck={false}` (components/ui/search-input.tsx:61 is the precedent and sets both).
  - Why: the only filter field in the app that can raise a password-manager or spellcheck overlay inside a popover.
- [ ] **wdg-23 LOW** components/ui/feedback-fab.tsx:229
  - Before: `<Input … type="email" />` with no `inputMode`.
  - After: add `inputMode="email"`.
  - Why: skill rule "Use correct `type` and `inputmode`"; the mobile keyboard does not surface the `@` row.

### Requests

- [x] **wdg-24 LOW** (applied 2026-09-20, `cc5b345`) pages/requests/RequestDetailBody.tsx:584, pages/requests/RequestDetailBody.tsx:617
  - Severity: was HIGH, downgraded 2026-09-20. No `outline-none` on these buttons and the base layer applies `outline-ring/50`, so the browser default focus-visible outline shows. Ring-recipe consistency, not WCAG 2.4.7.
  - Before: `const base = "flex-col gap-2 rounded-xs border px-4 py-3 text-left shadow-xs";` applied to `<button aria-pressed={selected} …>` with only `select-none transition-colors duration-150 ease-out motion-reduce:transition-none` added.
  - After: `const base = "flex-col gap-2 rounded-xs border px-4 py-3 text-left shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";`
  - Why: the findings cards are the selection control for the evidence pane and have no visible focus. WCAG 2.4.7.

### Conversations

- [x] **wdg-25 MEDIUM** (applied 2026-09-20, `f54859b`; also removed the dead `hover-fine:` on that row (wdg-18 Conversations line)) pages/Conversations.tsx:672, pages/Conversations.tsx:675
  - Before: `<RowActionButton aria-label={…} layout="stack" onClick={() => navigate(tracePath(row.conversationId))}>`; the drill-in renders as a `<button>` even though the target is URL-addressable.
  - After: `<RowActionButton aria-label={…} href={tracePath(row.conversationId)} layout="stack">` (the `href` branch exists at row-action-button.tsx:22-27, and pages/requests/RequestsTable.tsx uses it).
  - Why: same primitive, two tables, two behaviours. Messages supports Cmd-click to a new tab, Conversations does not.
- [x] **wdg-26 LOW** (applied 2026-09-20, `cc5b345`) pages/Conversations.tsx:339, pages/Conversations.tsx:422
  - Before: `Math.round(v).toLocaleString("en-US")` with the locale pinned.
  - After: route through `src/lib/formatters.ts`, which deliberately leaves the locale undefined (formatters.ts:1) so `Intl.*` follows `navigator.language`.
  - Why: the only two hardcoded locales in the app; everything else uses the shared formatter. Skill rule "Numbers/currency: use `Intl.NumberFormat`".

### Limits

- [ ] **wdg-27 LOW** pages/Limits.tsx:798, pages/LimitsFree.tsx:583
  - Before: number-entry `<Input>` for the threshold with no `inputMode`.
  - After: add `inputMode="decimal"`.
  - Why: mobile users get the full alpha keyboard for a numeric budget field.

### Teams

- [ ] **wdg-28 LOW** pages/teams/dialogs.tsx:571, pages/teams/dialogs.tsx:616, pages/Team.tsx:698
  - Severity: was MEDIUM, downgraded 2026-09-20. `type="email"` already gives the email keyboard and `type="number"` already gives a numeric one on iOS and Android; `inputMode` only trims a few keys.
  - Before: `<Input type="number" min={1} max={100} … />` (warn / block thresholds) and `<Input type="email" autoComplete="off" … placeholder="teammate@example.com" />`; none set `inputMode`.
  - After: `inputMode="decimal"` on the two number fields, `inputMode="email"` on the invite field.
  - Why: skill rule "Use correct `type` and `inputmode`".

### Billing

- [ ] **wdg-29 LOW** pages/billing/CreditsCard.tsx:467, pages/billing/CreditsCard.tsx:510, pages/billing/CreditsCard.tsx:555, pages/BillingFree.tsx:595, pages/BillingFree.tsx:638, pages/BillingFree.tsx:683
  - Severity: was MEDIUM, downgraded 2026-09-20. `type="number"` already gives a numeric keyboard; `inputMode="decimal"` only trims a few keys.
  - Before: `<Input className="type-mono-14 pl-7 …" placeholder="0" type="number" />`, the auto-reload dollar fields, no `inputMode`.
  - After: add `inputMode="decimal"`.
  - Why: currency entry on mobile without a numeric keypad. `CreditsCard` is shared by the Billing twins, so one edit covers Pro and Enterprise; `BillingFree` needs its own.

### Settings

- [ ] **wdg-30 LOW** pages/Settings.tsx:221
  - Severity: was MEDIUM, downgraded 2026-09-20. `type="email"` already gives the email keyboard; `inputMode="email"` adds nothing.
  - Before: `<Input autoComplete="email" id=… spellCheck={false} type="email" />` with no `inputMode`.
  - After: add `inputMode="email"`.
  - Why: same rule as wdg-23 and -28; this is the account email field.

### Onboarding

- [x] **wdg-31 MEDIUM** (applied 2026-09-20, `f54859b`; `focus-visible:ring-0` never cancelled the ring (ring-offset-2 leaked), so `ring-offset-0` added on the input and the ring lives on the wrapper) pages/SetupManual.tsx:417
  - Before: `<Input className="h-7 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" onChange={…} placeholder="Search models…" ref={searchRef} type="search" value={query} />`: no label, no `aria-label`, and `focus-visible:ring-0` removes the ring (the wrapping row at :411 has no `focus-within:` replacement).
  - After: add `aria-label="Search models"` and `spellCheck={false}`; either drop `focus-visible:ring-0` or add `focus-within:ring-2 focus-within:ring-ring` to the wrapper div at pages/SetupManual.tsx:411.
  - Why: the only unlabelled input in the app, and the only field whose focus ring is cancelled with no replacement. Skill rules "Form inputs without labels" and "Never `outline-none` without focus replacement".
- [ ] **wdg-32 LOW** pages/SignIn.tsx:55, pages/SignUp.tsx:50
  - Severity: was MEDIUM, downgraded 2026-09-20. `type="email"` already gives the email keyboard; `inputMode="email"` adds nothing.
  - Before: `<Input autoComplete="email" id="email" placeholder="you@company.com" type="email" />` with no `inputMode`.
  - After: add `inputMode="email"`.
  - Why: the two highest-traffic email fields on the site.

### Decision needed

- Button and heading capitalisation: the skill requires Title Case (Chicago style). design.md:1744 and design.md:1761 mandate sentence case for titles, labels, buttons and tabs and retire the earlier Title Case rule. design.md wins, no items raised. Table header cells stay Title Case per design.md:1386. Recorded so a later pass does not re-flag it.

### Not verified

- Anything needing a browser: real focus-ring visibility against each surface, reflow at 390px, iOS safe-area behaviour, and whether the `hover-fine` variant emits invalid CSS in the current Tailwind build (asserted from the repo's note at components/ui/card.tsx:82-87, not compiled).
- Runtime assistive-tech behaviour of `role="link"` on `<tr>` (wdg-1): the violation is static, the announcement is not.
- `scroll-margin-top` on heading anchors: not applicable, the app has no in-page `href="#…"` anchors.

### Skipped by decision

- wdg-15: keep the theme-toggle blur cross-fade for now (user, 2026-09-20). Re-open only with the blur-family decision.
- wdg-7, wdg-9, wdg-10, wdg-19, wdg-23, wdg-27, wdg-28, wdg-29, wdg-30, wdg-32: mobile-only or redundant with the `type` attribute; not worth the churn on this mockup (2026-09-20).

### Compliant, checked and clean

- `transition: all`: 0 matches site-wide.
- `onPaste` + `preventDefault`: 0 matches. `user-scalable=no` / `maximum-scale`: absent.
- `autoFocus`: 0 matches; the Input primitive documents the deliberate `autoComplete="off"` default (input.tsx:48-51).
- Icon-only buttons: every one carries `aria-label` or an `sr-only` label (dialog.tsx:126, sheet.tsx:141, sidebar.tsx:518, Team.tsx:830, TeamsEnterprise.tsx:695, DashboardDefault.tsx:392).
- `<img>` `alt`: present on all 15, with `alt="" aria-hidden` on decorative marks.
- `overscroll-contain` on every scrollable overlay: dialog.tsx:270, sheet.tsx:77, multi-select.tsx:297, message-block.tsx:186.
- Layout reads (`getBoundingClientRect`, `offsetHeight`, `scrollTop`) are all inside effects or callback refs, none in render.
- Large lists are paginated via `TablePaginationFooter` (11 surfaces) and empty-guarded via `TableEmptyState` (17 surfaces); pages/Dashboard.tsx, pages/SetupModels.tsx and pages/models/ModelShelves.tsx lack a guard but render fixed non-empty seed arrays.
- `Intl.*` centralised in src/lib/formatters.ts with locale intentionally undefined; no native `<select>` anywhere (Base UI Select only).
- `color-scheme` set for both themes (index.css:199, :764) with a pre-paint theme script (index.html:8-24).
- Focus rings present on all other native `<button>`s: sidebar NAV_ROW / NAV_ROW_ACTIVE / ACCOUNT_ROW, back-link, text-link, icon-action-button, option-tile, row-action-button, button.tsx base.
- `tabular-nums` (42 sites) and `text-balance` / `text-pretty` (163 sites) applied broadly; no `...` literals in user-facing copy.
- URL state: `useSearchParams` on 14 surfaces.
- Destructive actions are confirmed: ApiKeys revoke goes through `pendingRevoke` (ApiKeys.tsx:482), plus AlertDialog in Settings and cancel-plan-dialog.

Verdict (run 1): fail. 4 HIGH items (invalid `<tr>` role on a shared primitive, two missing focus rings in shared primitives, one on a detail page, and no skip link) block a clean pass. 12 of the 32 items land in `components/ui/**` or `layouts/**` and fix every page at once.

## react-best-practices

Vite + React 19 SPA, so the Next.js-only rule families (`server-*`,
`async-api-routes`, hydration) do not apply; `bundle-dynamic-imports` reads
as `React.lazy`. Items rbp-1 to rbp-18 in `audit-9-18.md` (Token savings,
Models, Billing) were excluded and are not re-flagged.

### Global

- [x] **rbp-1 HIGH** (applied 2026-09-20) `index-as-key` pages/requests/RequestsTable.tsx:720, pages/security/EventsTable.tsx:569
  - Before: `key={`${row.time}-${i}`}` on `<TableRow>` inside `.map((row, i) => ...)` in both tables.
  - After: `key={requestRowId(row)}` in RequestsTable, `key={verdictKey(row)}` in EventsTable; both ids are already computed in the same scope (RequestsTable.tsx:206, EventsTable.tsx:565).
  - Why: `time` repeats across rows and `i` shifts on sort, filter and page, so React can carry hover, focus and verdict state to the wrong row.
- [x] **rbp-2 MEDIUM** (applied 2026-09-20) `client-event-listeners` layouts/DashboardChrome.tsx:176-182, layouts/DashboardChrome.tsx:548-557
  - Before: `DashboardChrome` subscribes `window.matchMedia("(min-width: 1024px)")` for `isDesktop`; `MobileNav` in the same file, always mounted, subscribes the identical query again to auto-close the drawer.
  - After: pass `isDesktop` into `MobileNav` as a prop and close the drawer in an effect keyed on it, or extract one `useMediaQuery(query)` hook used once per query string.
  - Why: two live listeners fire on every crossing of the same breakpoint for one piece of state; deduplicate global listeners.
- [ ] **rbp-3 LOW** `js-cache-function-results` components/ui/bell.tsx:58, calendar-days.tsx, credit-card.tsx, download.tsx:55, external-link.tsx, logout.tsx, receipt.tsx:82, refresh-cw.tsx:41 +4 more (sliders-horizontal, sparkles, square-arrow-up, upload)
  - Before: each animated icon runs `window.matchMedia("(prefers-reduced-motion: reduce)").matches` inside its mount effect.
  - After: `import { REDUCE_MOTION } from "@/lib/reduce-motion"` and `if (REDUCE_MOTION) return;`; the module-level snapshot already exists and is used by Notifications and Conversations.
  - Why: twelve copies of one query on every icon mount, and one shared constant already owns that read.
- [ ] **rbp-4 LOW** `index-as-key` components/ui/field.tsx:202
  - Before: `uniqueErrors.map((error, index) => (<li key={index}>{error.message}</li>))`
  - After: `uniqueErrors.map((error) => (<li key={error?.message ?? String(error)}>{error.message}</li>))`
  - Why: `uniqueErrors` is already deduped by `message`, so the message is a stable unique key.

### Activity

- [x] **rbp-5 MEDIUM** (applied 2026-09-20) `js-index-maps` pages/Activity.tsx:502
  - Before: `MODEL_ROWS.find((m) => m.key === key)?.vendor ?? ...` inside a `.map()` over the scoped keys, itself inside a `useMemo` that reruns on every `scope` / `modelMetric` change.
  - After: `const byKey = new Map(MODEL_ROWS.map((m) => [m.key, m]))` once at module scope, then `byKey.get(key)?.vendor`.
  - Why: O(keys x MODEL_ROWS) per recompute where a Map lookup is O(1).

### Models

- [ ] **rbp-6 LOW** `js-index-maps` pages/Models.tsx:800-802
  - Before: `PROVIDER_ORDER.filter((id) => providers.some((p) => p.id === id)).map((id) => providers.find((p) => p.id === id))`
  - After: `const byId = new Map(providers.map((p) => [p.id, p])); PROVIDER_ORDER.filter((id) => byId.has(id)).map((id) => byId.get(id) as ModelProvider)`
  - Why: two scans of `providers` per call, and `ProviderStack` renders once per catalog row (Models.tsx:672) and per shelf card (models/ModelShelves.tsx:449); `providers` is 2 to 3 long so the cost is small, the fix is free.

### Teams

- [x] **rbp-7 HIGH** (applied 2026-09-20) `rerender-derived-state` + `js-index-maps` pages/TeamDetailEnterprise.tsx:1414-1435, pages/TeamDetailEnterprise.tsx:541, pages/TeamDetailEnterprise.tsx:844, data/teams.ts:306
  - Before: `const rows = team.memberIds.map((id) => memberById(id)).filter(...)` and `visible = rows.filter(...)` run inline in the roster component that also owns `query` / `roleFilter` state, so both rerun on every keystroke; `memberById` is `MEMBER_ROWS.find(...)`, O(n) per call, at three sites.
  - After: `useMemo(() => team.memberIds.map(memberById).filter(...), [team.memberIds])` for `rows`, `useMemo(() => rows.filter(...), [rows, query, roleFilter])` for `visible`; back `memberById` with a module-level `Map` in `data/teams.ts` (same shape as `MODEL_BY_ID` in `data/models.ts`).
  - Why: every keystroke in the roster search does O(members x MEMBER_ROWS) work that does not depend on the query. Same root pattern as audit-9-18 rbp-2.

### Conversations

- [ ] **rbp-8 LOW** `js-min-max-loop` pages/Conversations.tsx:414
  - Before: `row.vendors.map((v) => VENDOR_META[v].label).sort()[0] ?? null` inside `conversationSortValue`, the accessor passed to `sortRows`.
  - After: `row.vendors.reduce<string | null>((min, v) => { const l = VENDOR_META[v].label; return min === null || l < min ? l : min; }, null)`
  - Why: allocates and sorts a throwaway array to read index 0, once per comparison during the sort.
- [ ] **rbp-9 LOW** `index-as-key` pages/conversations/ConversationDetail.tsx:793
  - Before: `(messages ?? []).map((m, i) => <MessageBlock ... key={i} />)` inside `ConversationMessagesPanel`; `ConversationMessage` has no id field, only optional `requestId` and `time`.
  - After: `key={`${m.requestId ?? "user"}-${i}`}`, or add a stable `id` to `ConversationMessage` in `conversations/types.ts`.
  - Why: three tab panels each mount a differently filtered `messages` array; low risk today because tabs never reorder, but the key should not rely on that.
- [ ] **rbp-10 LOW** `js-cache-function-results` pages/conversations/data.ts:20-32, data/conversationDetail.ts:101-109
  - Before: the `MODEL_FILTER_OPTIONS` IIFE calls `getConversationView(seed, REQUEST_ROWS_ALL)` per conversation at import; `Conversations.tsx` and `ConversationDetail.tsx` call it again for the same conversations, each running the ~150-row `getConversationRequests` filter.
  - After: memoize `getConversationRequests` per `conversationId` in a module-level `Map`, or compute the view once in `data/conversations.ts` and export it.
  - Why: three call sites re-filter the same rows with no shared cache; cheap at today's size, flagged so it does not move into a render loop.

### Requests

- [x] **rbp-11 MEDIUM** (applied 2026-09-20) `rerender-memo` pages/requests/RequestDetailBody.tsx:1599-1615
  - Before: `FullRequestCollapsible` recomputes `lines` (`rawBody.split("\n").map(...)` or `buildRequestBodyLines(row)`) and `requestPayload` (`JSON.stringify(...)`) on every render, including while the panel is closed (`Collapsible.Panel` stays mounted).
  - After: `const { lines, requestPayload } = useMemo(() => { ... }, [row]);`
  - Why: both are pure functions of `row`; a JSON.stringify plus string split runs on every tab switch, finding click and evidence reveal while the content is hidden.
- [ ] **rbp-12 LOW** `rendering-hoist-jsx` (static data) pages/requests/RequestsTable.tsx:112-122
  - Before: `keyOptions = scope.keyNames ? [...scope.keyNames] : ["prod-web", "prod-agent", "development", "openclaw", "hermes-agent", "nova-chat", "test-key"]`, the fallback literal recreated every render.
  - After: hoist to module scope `const DEFAULT_KEY_OPTIONS = [...] as const` and reference it.
  - Why: static list allocated per render, and an unstable identity if it ever enters a `useMemo` dep list.
- [ ] **rbp-13 LOW** `index-as-key` pages/requests/RequestDetailBody.tsx:414
  - Before: `<FindingCard finding={f} key={idx} />` inside `findings.map((f, idx) => ...)`, while the sibling `FindingSwitcherCard` branch two lines up keys on `f.category`.
  - After: `key={f.category}`; categories are unique among the single-occurrence findings that reach this branch.
  - Why: consistency with the adjacent branch; the one remaining index key in the file.

### Not verified

- Re-render counts and flame graphs for `DashboardChrome`, the roster in `TeamDetailEnterprise`, and the chart primitives; a profiler run would size rbp-2, rbp-7 and rbp-11.
- Whether the React Compiler (referenced in comments at pages/Security.tsx:88-91) is enabled; if it is, the memo halves of rbp-7 and rbp-11 are already handled at build time and only the Map / key halves stand.
- Bundle impact of the per-icon `motion/react` imports across the 11 animated icons; needs a bundle analyzer.

### Compliant, checked and clean

- Routing: every routed page in `App.tsx` (~70 routes) is `lazy(() => import(...))`.
- Hooks: `use-stick-to-bottom`, `use-theme`, `use-ask-ai-thread`, `use-table-sort`, `use-copy-feedback`, `use-is-truncated`, `use-scroll-overflow`, `use-scroll-restoration`, `ask-ai-thread-provider`: timer and observer cleanup correct, guarded setState, precise deps.
- Stores: `data/notifications-store.ts`, `data/audit-trail-store.ts` use `useSyncExternalStore` with a stable snapshot and a server-snapshot argument. `data/models.ts` hoists `MODEL_BY_ID` at module load.
- Lazy state init: `BillingFree.tsx:243`, `Notifications.tsx:305`, `App.tsx:271` read localStorage inside a `useState` initialiser. `AuditTrail.tsx:330-337` resets page during render, not in an effect.
- `Models.tsx:227-234` already pairs `useDeferredValue(search)` with split filter / sort memos. `activity/TrendCard.tsx` memoizes every derivation with a hoisted `SAVINGS_DOMAIN`.
- Positional index keys on lists that never reorder are correct and were left alone: `kpi-rail.tsx:83-85` (children), `code-panel.tsx:92` and `code-card.tsx:278` (code lines), `lib/dotmatrix-core.tsx:845,1352` (grid dots).
- No inline component definitions inside render, no `new RegExp` in render, no non-passive scroll or touch listeners, no `&&` on a numeric `.length` in JSX, no derived-state effects on any page.
- All 11 lucide-animated icons share one correct `forwardRef` + `useAnimation` + listener-cleanup shape.
- Every folder under `pages/teams`, `pages/models`, `pages/billing`, `pages/security`, `pages/activity`, `pages/token-savings`, `pages/site-map`, `pages/policies` and every `src/data` helper module read in full with no new finding.

Verdict (run 2): pass with fixes. 2 HIGH (index keys on the two largest tables, an unmemoized O(n^2) roster), 3 MEDIUM, 8 LOW. The codebase already follows the expensive rules (route-level lazy loading, external stores, deferred search, hoisted lookup maps); the remaining items are a handful of index keys and repeated linear lookups, all one-file fixes.

## test-smoke

Findings surfaced by the new test tiers (Playwright `e2e/smoke.spec.ts`,
vitest `src/test/routes.smoke.test.tsx`). Every flow fails on any
`console.error` or `pageerror`, nothing filtered, so each item below is an
error the browser already logs on the live site today.

### Global

- [ ] **smk-1 HIGH** `Button render={<Link/>}` components/ui/button.tsx:163, pages/Notifications.tsx:657, pages/pro-upgrade-card.tsx:20
  - Before: Base UI `Button` defaults `nativeButton: true`; rendering it as an anchor logs a console.error on every page that mounts either call site. Fails 7 vitest route cases (`/limits-default`, `/limits-free`, all four `/notifications*`, plus the Enterprise admin case) and Playwright flow b.
  - After: `nativeButton={false}` on both call sites, or have the `Button` primitive set it whenever `render` is passed an anchor / `Link`.
  - Why: a logged error on nearly every page; fails Playwright flow b (sidebar walk).

### Messages

- [ ] **smk-2 MEDIUM** recharts `<line>` `x1`/`x2` "undefined" pages/requests/HeroMetric.tsx:104
  - Before: apply Filters -> Key -> Apply on `/messages`; the hero `AreaChart` re-renders on the narrowed series and logs 12 invalid-SVG errors (5 rows remain).
  - After: guard the hero series so a narrowed range still yields numeric x coordinates (empty or single-point series is the likely cause; reproduce with the 5-row key).
  - Why: invalid SVG attributes on a live interaction; fails Playwright flow d.

### Compliant, checked and clean

- vitest route smoke: 137 of 144 cases pass (84 routes, 19 Enterprise routes x 3 roles, 2 redirects); the 7 failures are all smk-1.
- Playwright flows a, c, e, f, g, h pass: root redirect, Enterprise role switch + URL guard, team roster search, Billing `?state=` previews, theme persistence across reload, mobile drawer closes at 1024px.

Verdict (run 3): fail. Two live console errors, one on nearly every page.
