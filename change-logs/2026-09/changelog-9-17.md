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
