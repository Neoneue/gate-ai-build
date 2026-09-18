# UI Changelog: 2026-09-17

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-9-16.md`](./changelog-9-16.md)

---

## Conventions

### Focus ring goes inset on Tabs triggers and sortable table heads `4011cdf`

- Before: both took the site recipe `focus-visible:ring-2 ring-ring
  ring-offset-2 ring-offset-background`, and the offset ring was clipped by
  0.5 to 1.5px by the scrolling tab list and the table scrollport. After:
  `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset`,
  no offset. `src/components/ui/tabs.tsx` (TabsTrigger),
  `src/components/ui/table.tsx` (SortableTableHead button). Recorded in
  the `design.md` focus block as the two inset sites.

### Focus ring is neutral again `f02e853`

- Before (`92f692d`, 2026-09-16): `--ring` on the blue ramp. After:
  neutral-600 light / neutral-400 dark, measured 7.5:1 / 7.6:1 against the
  page and 7.8:1 / 6.9:1 against cards, still the solid 2px offset recipe
  (user direction: blue is not a primary colour on this site). One token in
  `src/index.css`, no class sweep. The seven controls that hovered with a
  ring-derived edge (`switch`, `checkbox`, `radio-group`, `textarea`,
  `message-block`, the Policies and PoliciesPane handles) now use
  `hover:border-border-hover`, the token `design.md` names for that role.
  The calendar "today" hairline follows the token back to neutral.
  `design.md` focus block, token table and the blue-roles sentences say the
  ring is neutral.

### Chart tooltip dots follow the config colour `f02e853`

- `ChartTooltipContent` (`src/components/ui/chart.tsx`) resolves a row's
  indicator as `color ?? config.color ?? payload.fill ?? series.color`,
  config before stroke. Audit: every chart config on the site already sets
  colour equal to its stroke, so only the Security Total row (blue dot, red
  trace) changes.

### Chart palette gets a chart-7 soft twin `9cffeda`

- `--chart-7-soft` added to `src/index.css` in both themes and the theme
  alias block, the same `color-mix(in oklch, var(--chart-7), white 20%)`
  derivation as slots 1 to 4. First consumer is the Token savings Summary's
  Compression bar (the Compression tile is chart-7). Documented in the
  `design.md` ramp block; the data-bar rule is unchanged.

### Transition lists name real CSS properties; presses tween again `533cdd3`

- Before: Button, Switch, OptionTile, SelectTrigger, Toggle and BackLink (plus
  four page copies in `DashboardDefault`, `SetupManual`, `Policies`,
  `PoliciesPane`) carried `transition-[colors,...]`. `colors` is a Tailwind
  shorthand, not a CSS property, so the compiled list never matched and every
  hover fill and ink change snapped while opacity / shadow / scale eased.
  After: `transition-[color,background-color,border-color,...]` with the
  remaining tokens unchanged. Zero `transition-[colors` left in `src`.
  `design.md` line 1136 now quotes the corrected Button string.
- Before: `IconActionButton`, the four sidebar buttons, the theme toggle and
  the sidebar collapse icons named `transform` while animating `scale-*`,
  which in Tailwind v4 is the standalone `scale` property, so the 0.98 press
  and the icon cross-scale had no tween. After: `scale` in each list. The two
  segmented controls keep `transform` (real inline translate).
- `src/lib/formatters.ts` reuses one `Intl.NumberFormat` / `DateTimeFormat`
  / `RelativeTimeFormat` per locale + options pair instead of constructing
  per call (measured 57x in Node). Public API unchanged; output identical.
- Source: `audit.md` (repo root), the 2026-09-17 better-ui /
  make-interfaces-feel-better / react-best-practices checklist; the four HIGH
  items plus two sweep follow-ups are ticked.

### Audit MEDIUM pass: Token savings, Models, Billing `751c216`

- **TextLink** (`text-link.tsx`) base recipe gains
  `transition-[color,text-decoration-color] duration-150 ease-out
  motion-reduce:transition-none`; the Models "Show more" label now eases
  with its chevron, whose list is `transition-[color,rotate]`.
- **TabsTrigger** (`tabs.tsx`) presses: `active:scale-[0.98]
  motion-reduce:active:scale-100`, list extended with `scale`.
- **CopyButton** label mode renders `CopyIconSwap` (both glyphs in the DOM,
  opacity cross-fade, success stays `text-success-600`) instead of swapping
  Copy for CircleCheck by mount; stroke 1.8 -> 1.75. `CopyIconSwap` forwards
  `data-icon` so Button's inline-start padding still matches.
- **Token savings:** inset option cards and the Summary card step to
  `rounded-xs` (redundant `border-border` dropped); the panel inside the
  option cards is also `rounded-xs`, the ladder floor. The lg Switch loses
  `mt-1` (was 6px below the label centre). The two h4 headings drop the
  `type-heading-16` override. Summary bars animate `width` over 200ms when
  Compression or Caching toggles.
- **Models:** the detail back link is the shared `BackLink` (press, 44px hit
  area, chevron nudge; accessible name "Models"). Capability filter options
  hoisted to a module constant; the filter and sort memos are split; search
  is deferred with `opacity-70` on the table while stale.
- **Billing:** the payment method inset steps to `rounded-xs` on Pro and
  Free; the Credits card default "Last top-up" label is a module constant.
- Source: `audit.md`, 20 rows ticked (14 chosen MEDIUM items plus their
  same-line companions).

### Raw type utilities are linted; every page text goes through a voice `876afb4`

- `lint:design` gains a `[raw-type]` check: a bare `font-medium` /
  `font-semibold` / `font-bold` or `text-xs`..`text-2xl` on a line in
  `src/pages` or `src/layouts` with no `type-*` voice fails the build.
  Per-site waiver: a `design-allow-raw-type` comment with a reason within 5
  lines above. `src/components` is exempt (primitive recipes are the voices).
  Documented in design.md ("How it's enforced") and
  `.claude/rules/design-tokens.md`.
- Sweep of the 40 lines it found (14 pages + the auth layout): 31 converted to
  the voice matching the element's role and size (`type-label-14` on value
  spans inside `type-copy-14` parents, `type-mono-14` / `type-mono-12` on
  mono data, `type-copy-16` on the Models detail description,
  `type-heading-56` on the login headline), 9 waived with a stated reason
  (inline figure emphasis in a voiced lede on the Summary card and the audit
  record dialog, the Gate Connect fluid clamp title, the 10px "Detected"
  pill, the login mono lede). Three menu-style rows move from 400 to 500
  because design.md lists menu items as Label: SetupManual select trigger
  (now matches `selectTriggerVariants`), SetupManual model list, Team role
  menu. Follow-up: the `menu.tsx` primitive still renders items at 400.
- Comment prose that named raw utilities ("text-xl/7", "font-medium") now
  names px or weight so the check does not read them as code.

### KPI values are always sans tabular; mono is for data `e2e62f6`

- Before: the Request and Conversation detail KPI rails rendered values in
  `font-medium font-mono text-lg` (18px mono), the only KPIs on the site not
  in `HeroNumeric`. After: both rails use `CompactKpi` (`flat`), so values
  are `HeroNumeric` = Geist sans 24px / 500 / tabular-nums like every other
  KPI tile. Tile height grows ~8px (32px line box, `gap-2`). The local
  `KpiTile` and `ConversationKpiTile` components are deleted.
- The request detail count pill (`CountChip`, a copy of `TabsCount`) is
  `TabsCount`: badge voice, mono 12 / 500. Two call sites drop from 14 to
  12px.
- `HeroNumeric` docblock and design.md principle 6 (line 450) no longer say
  "numerics under 20px stay mono"; they say every KPI value is
  `HeroNumeric` sans and mono is for table cells, IDs, badge and count
  contents.

## Sections

### Billing: one org across the four Enterprise states `4c39f0b`

- **Narrative.** Every preview state on `/billing-enterprise` is the same
  org, on Pro before it was granted Enterprise, so seats, the PAYG ledger,
  the credit balance and the card on file exist in all four. Only the
  seat-billing side differs. `data-model.md` records the four stories.
- **Current and Payment failed.** Before: Enterprise since Jul 1, a month
  before the org owner joined. After: since Aug 1, the first 1st after the
  owner's Jul 31 join (`HISTORY_MONTHS` 2 to 1 in
  `src/data/billing-enterprise.ts`). Plan tab now reads Aug 1 monthly for
  3 seats, two August prorations, Sep 1 monthly for 5, Jordan prorated
  Sep 16; five rows, not six.
- **Billing being set up.** Before: the shared Credits and Payment method
  cards rendered the seeded $49.99 balance under a banner saying nothing
  had been charged. After: the seat side is empty (deferred plan card
  values, empty Plan tab, no Changes card) while credits, card and the
  Balance ledger carry over like every other state. Banner copy: "We're
  still setting up seat billing, so no seat charge has been made yet. Your
  seat pricing and invoices will appear here shortly. Credits keep working
  as before."
- **Zero-state plumbing.** `CreditsCard` takes `balance` and
  `lastTopUp` (hero via `formatCurrency`, "None yet" muted when null),
  `PaymentMethodCard` takes `empty` (BillingFree's "No payment method on
  file" row and `Add card` footer, verbatim), `HistoryLedger` takes
  `rows` (empty state "No billing history yet" shared with the Plan tab
  via `BILLING_HISTORY_EMPTY_BODY`). Defaults reproduce the Pro page byte
  for byte. Nothing renders the zero state today; a fresh-org story is one
  data change away. `CREDIT_BALANCE_USD` and `lastTopUpLabel` moved to
  `src/data/billing-history.ts` so data and card share one derivation.
- **Tests.** Invoice counts and monthly seat sequences derive from the
  roster and periods, never literals: the demo clock shifts every authored
  date one day per real day and broke two literal counts overnight. New
  assertion: the owner joined before Enterprise started.

### Messages: hero eyebrow, inline delta, breakdown tooltip `f02e853`

- **Header.** Before: number over delta, no eyebrow. After: the Security
  events hero recipe verbatim, `Total messages` eyebrow, then
  `HeroNumeric` and `DeltaTag` on one baseline (`flex items-baseline
  gap-4`). Success / Errors breakdown unchanged. `src/pages/requests/HeroMetric.tsx`.
- **Tooltip.** Before: date and one number. After: `Total` / `Success` /
  `Errors` rows with legend-coloured dots. Every chart point carries its
  own split (`withBreakdown` in `hero-data.ts`: the view's error total
  spread over buckets by largest remainder, capped at the bucket's
  requests), so per-point errors sum exactly to the headline Errors on the
  four presets, custom ranges and Manager / Member scoped views; four tests.
  Rows come from two tooltip-only `Area` series (zero-width stroke, no
  fill, no active dot). The call site's `gap-1` override is gone (8px
  rhythm), `min-w-36` (144px), and `position={{ y: 0 }}` pins the box to
  the chart band so the card's `overflow-hidden` cannot clip it.

### Security events: breakdown tooltip `f02e853`

- Before: date and one number. After: `Total` / `Blocked` / `Flagged` /
  `Redacted` rows. `buildEventsChartView` already summed three per-type
  sparks, so each point now carries the three counts; a test asserts they
  sum to the point total and, across the series, to `splitEventMix`. Dots:
  Total chart-1 blue (matches Messages), Blocked danger-500 (the trace),
  Flagged warning-500 (the Action-types bars), Redacted neutral-400 (the
  bars share warning for Flagged and Redacted, a tooltip cannot). Same 144px
  width and 8px rhythm; `position={{ y: -9 }}` centres the 114px box on
  the 96px band, inside the card. `src/pages/Security.tsx`,
  `src/pages/security/events-data.ts`.

### Token savings: Summary card `9cffeda`

- **New card** between the Overview rail and Savings options on
  `/token-savings` (Pro and Free via `plan`) and `/token-savings-default`
  (no-traffic state). `src/pages/token-savings/SummaryCard.tsx`; every
  figure and sentence from `src/pages/token-savings-summary.ts`
  (`summaryFor`, `SUMMARY_COPY`). Ticket: parent "Token Savings Summary"
  plus the design ticket, local copy at `docs/tickets/token-savings-summary`.
- **Header:** `SectionTitle` "Summary" (peer of the Overview and Savings
  options titles) and one `type-copy-14` subtitle, "What Gate did to earn
  the rates above, over the period selected in Overview." No mono meta
  line, no epoch note (user, PM call 2026-09-17).
- **Lede** `type-copy-16` with the two figures in `font-medium
  tabular-nums`, period phrase from the Overview range.
- **Two figure cells**, always side by side (`grid-cols-2`), the Caching
  card's nested-cell recipe in the KpiTile composition: `Eyebrow` label,
  `HeroNumeric`, denominator caption ("13.7% of the 447.4M input tokens
  you sent" / "0.15% of 542,241 requests"). Off state names the switch.
- **Where the savings came from:** `SectionHeading as="h4"`, basis sentence
  "Share of Gate-attributed savings, as the Total saved tile reports it.",
  then two levels on that one basis: Compression and Gate cache hits as the
  two tile rates over Total saved, the compression mechanisms (the eight
  `BenefitList` names, Free = Basic four) nested under Compression with
  `ml-4 border-l pl-4`, a `my-3` hairline, then Gate cache hits. Security
  page meter grid, label track `w-72 pr-4` (nested `w-64`), fills
  `from-chart-7 to-chart-7-soft` / `from-chart-3 to-chart-3-soft`,
  `role="meter"` with a plain-language `aria-label`. An off mechanism
  shows `StatusBadge` OFF plus a sentence; both off is one sentence. Partial
  attribution is a note under the rows, no badge (removed on the call).
- **Footer:** `SectionHeading as="h4"` "What this figure leaves out" over
  the exclusion paragraph. No dollar amounts anywhere; nothing focusable.
- **Wiring:** the Compression and Caching switches lifted into
  `TokenSavings.tsx` (`SavingsSwitches`) so the card can name an off
  mechanism; `SavingsOptionsSection` takes them as optional controlled
  props. `activity-data.ts` exports `TOTAL_7D_BASE_INPUT_TOKENS`.
- **Open, waiting on the team:** bucket the eight compression mechanisms
  down to about four (Riley); the mechanism weights are an authored
  placeholder. Tests: `token-savings-summary.test.ts` (reconciliation with
  the tiles, shares sum to 100.0, states) and `SummaryCard.test.tsx`
  (renderToString per state, no "$").

### Billing: Enterprise seats read as plan utilization, single history `73e725d`

- **Seats stat** on the plan card reads "4 of 4": seats in use of seats on
  the plan (`enterprisePlanSeats`). Seats are a plan quantity changed
  through Support, not a headcount that follows joins and leaves (PM + user
  call 2026-09-17; dev confirmed an org can pay for more seats than it has
  members). Footer copy "Want to add or remove seats, or change your plan?"
- **Changes this period card REMOVED**, with its proration and per-member
  amounts. The table module `src/pages/billing/BillingHistorySection.tsx`
  (the Plan tab) is deleted; its empty-ledger sentence moved into
  `HistorySection.tsx`.
- **Billing history** is Pro's, verbatim: title left, Invoice portal right,
  one flush `Card` with `HistoryLedger`. No Plan / Balance tabs.
- **Banners:** granted drops "your first seat invoice is below";
  unprovisioned says seat pricing and next invoice appear shortly; payment
  failed reports this month's seat charge on the 1st (`failedCharge`).
- `src/data/billing-enterprise.ts` rewritten around the plan quantity
  (no `prorateSeat`, `seatChangesThisPeriod`, `firstSeatChargeRow`);
  `billing-seats.ts` engine kept for `seatCount` / `periodDays`. Test
  rewritten to match.

### Token savings: Summary breakdown from the gateway table, copy pass `e6a043f`

- **Compression rows** now come from the gateway's "Methods, ranked" table
  (30D, 85 methods, supplied by the user): Deferred tool definitions, Boost
  recoverable elide, Tool output compaction: Search (grep) output, and "All
  others" for the remaining 82. Four rows max (`BREAKDOWN_MAX_ROWS`), the
  catch-all always last; the grep label breaks before "Search" on purpose
  (`whitespace-pre-line`). Same rows on Free and Pro. Replaces the
  authored eight-pass weight table.
- **Mechanism rows** read "Compression" and "Caching" (the tile and option
  card names); the figure cell keeps "Cache hits" for the request count.
- **Partial state removed**: no badge (PM call) and no note (user). The
  acceptance criterion "mark the per-pass breakdown as partial" is recorded
  as open in `docs/tickets/token-savings-summary`.
- **Copy pass against the tickets:** subtitle "What Gate did to earn the
  rates above."; cache caption "0.15% of the 542,241 requests you sent";
  basis "Share of everything Gate saved, the Total saved rate above.";
  both-off and no-traffic lose their nudges; footer heading "What these
  savings leave out" over "These figures only count what Gate did. Any
  discount your provider gives for its own prompt caching is not included,
  even when Gate set it up. Requests that did not go through Gate are not
  included either." The All lede opens "Over this period" (no placeholder
  date).
- **8pt grid:** label track `w-72` + `gap-x-4` puts every bar origin at
  304px from the grid edge; the nested block indents exactly 32px with its
  hairline as a `before:` pseudo (no stray 1px) and a `w-64` track; the
  value track is a fixed `3.5rem` so mono-14 and mono-12 values share one
  right edge. Measured: all six bars 320 to 934px inside the card.

### Token savings Summary no longer follows the Savings options switches `d138ff4`

- Before (`9cffeda`): the two enable switches were lifted to the page and
  passed into `summaryFor`, so turning Compression off zeroed "Input tokens
  removed", replaced the Compression rows with an OFF badge and gave Caching
  100% of the breakdown. After: the switches govern future traffic and the
  card reports the selected window, so it reads range + plan only and
  nothing on it changes when a switch flips (user, 2026-09-17: "turning it
  off doesn't make everything zero"). `SavingsOptionsSection` owns its
  switch state again; the controlled props are gone.
- The off states remain in `summaryFor` as optional flags (default true)
  for a window in which a mechanism was off the whole period; no seeded
  window hits them. `TokenSavings.tsx`, `TokenSavingsDefault.tsx`,
  `token-savings-summary.ts`.

### Audit LOW pass: Token savings, Models, Billing `876afb4`

- Token savings headline: `HeroNumeric` renders at its own 24px (the
  `text-xl leading-none` override and the now-dead `valueClassName` prop are
  gone); `gap-y-0.5` -> `gap-y-1`. Dead `tracking-snug` removed from ten
  `type-copy-16/18` page subtitles (TokenSavings x3, Models x2, ModelShelves,
  FreeModels, Billing, BillingEnterprise, BillingFree) and from one
  `type-copy-12` line on Models where it was a live deviation.
- Models: the "+N%" markup Badge explains itself through the Tooltip recipe
  (keyboard reachable) instead of a native `title`; the detail page builds a
  Set for the capability filter like the list already does.
- SetupModels: model name cell `font-medium` -> `type-label-14`, matching the
  catalog and shelf tables.
- Billing: `type-copy-14` sits on the stat-row `dd` itself in all three
  `CreditStatRow` / `StatRow` copies, no longer inherited from the `dl`.
- `audit.md` gains a Status section: what is done, what was skipped by
  decision and why, what still needs a call, and the follow-on work above.

### Token savings Summary: off state removed `efffac8`

- Follows `d138ff4` (Summary decoupled from the switches). The OFF badge
  row, the two off cell notes, the both-off sentence, the
  `compressionOn` / `cachingOn` options and their four tests are deleted.
  The card has four states: loading, no traffic, low volume, normal. Every
  mechanism row always renders its meter. User rule: the toggle has no
  effect on the summary; a real off window would read 0 from the data, and
  the demo cannot make time pass.
