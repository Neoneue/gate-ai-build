# UI Changelog: 2026-09-16

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-9-15.md`](./changelog-9-15.md)

---

## Conventions

### Plan-tier colors: Pro indigo, Enterprise violet, Free grey `dd4b262`

- **Badge.** Before: every plan badge used a status variant (`info` blue for
  Pro and Enterprise, `success` green for Free and Default). After: two
  role-named variants in `src/components/ui/badge.tsx`, `pro` (`bg-indigo-100
  text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300`) and
  `enterprise` (`bg-violet-100 text-violet-700 dark:bg-violet-500/15
  dark:text-violet-300`); Free and Default use `neutral`. The shared `info`
  variant is unchanged. Only consumer: `workspace-switcher.tsx` (trigger,
  menu items, compact `ENT.`).
- **Card tone.** `Card` gains `tone="pro"` (`border-indigo-200
  dark:border-indigo-500/30`) and `tone="enterprise"` (`border-violet-200
  dark:border-violet-500/30`), edge only. Light stepped from `-300` to `-200`
  the same day: `-300` read heavier than the content. Free keeps `default`.
- **Plan title.** The `HeroNumeric` plan name on each Billing page takes its
  tier ink (`text-indigo-700 dark:text-indigo-300`, `text-violet-700
  dark:text-violet-300`); Free stays `text-foreground`.
- Measured contrast against the rendered backgrounds, light / dark: Pro badge
  6.57 / 7.71, Pro title 8.09 / 8.92, Enterprise badge 6.15 / 8.35, Enterprise
  title 7.30 / 9.66, Free badge 7.17 / 5.86. Every pairing clears 4.5:1.
  Documented in `design.md` §2 (plan-tier families) and §7 (Card tone).

### Focus ring: solid 2px brand blue, offset 2 `92f692d`

- Before: `focus-visible:ring-3 focus-visible:ring-ring/50` with `--ring` at
  neutral-400 light / neutral-500 dark, compositing to 1.54:1 light and
  1.87:1 dark against the page, under the 3:1 floor of WCAG 2.4.11. After:
  `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
  focus-visible:ring-offset-background`, with `--ring` moved to `blue-600`
  light / `blue-400` dark (`src/index.css`). Measured 7.11 / 7.01 against
  the page and 7.42 / 6.35 against cards. 53 sites in 36 files swept; the
  7 sites that already used `ring-inset` take `ring-2 ring-ring` with no
  offset. Recorded in `design.md` Focus block, Input, Card, TableRow and
  TextLink specs. Source: rams review of the Models page.

### Hover fill is accent-muted, accent is selected only `92f692d`

- Before: `hover:bg-accent` on interactive cards, table rows and 17 more
  sites; dark muted text on the hovered fill measured 4.01:1. After:
  `hover:bg-accent-muted` (5.42:1) on every hover, `bg-accent` kept for
  selected fills (`data-[state=selected]`, calendar ranges, active menu
  items). `card.tsx`, `table.tsx`, 13 call-site files. The Notifications
  bulk banner (`Notifications.tsx`) switches from a bare `bg-accent` class,
  which now loses to the hover rule, to the row's `data-state="selected"`
  hook. `design.md` 555 already named this split; lines 692, 1218 and 1282
  now agree with it.

### Page subtitles step up to Copy 18 `92f692d`

- Before: the subtitle under every `PageTitle` was `type-copy-16`, so the
  page header ran 32 / 16 and the section header 24 / 16 shared a body
  size. After: `type-copy-18` on the 33 page subtitles (32 files); section
  and card subtitles stay 16. Ladder is now 32 / 18 page, 24 / 16 section,
  20 / 14 block, 16 / 14 card.

### Plan-tier colors: Pro returns to blue `92f692d`

- Before (`dd4b262`, same day): Pro badge, card tone edge and plan title on
  the indigo ramp. After: the same rungs on the brand blue ramp,
  `bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300`
  (badge), `border-blue-200 dark:border-blue-500/30` (card tone),
  `text-blue-700 dark:text-blue-300` (Billing hero). Indigo read off-brand
  next to the blue nav. Enterprise stays violet. `badge.tsx`, `card.tsx`,
  `Billing.tsx`, `design.md` tier table.

## Components

### Billing history and shared billing cards `dd4b262`

- **`src/pages/billing/HistorySection.tsx`** (new, shared by Pro and Free):
  the live product's ledger. Title `History`, description "Past charges and
  credit top-ups. Gateway messages are grouped by day. Expand a day to see
  each message." Columns: expander · Date · Type · Amount · Balance after.
  Before: flat rows, one per gateway request. After: each day's gateway
  requests fold into one `Gateway messages (N)` row (Amount = day total)
  that expands via `IconActionButton` + rotating `ChevronDown`
  (`aria-expanded`); Credits added and Adjustment rows stay flat.
- **`src/pages/billing/BillingHistorySection.tsx`** (new, Enterprise only):
  `History` of seat charges, columns Date · Description · Seats · Amount ·
  Status badge, `Invoice portal` action, empty state. No per-row download:
  rows are billing events.
- **`CreditsCard.tsx`** and **`PaymentMethodCard.tsx`** moved verbatim out
  of `Billing.tsx` (955 to 177 lines) into `src/pages/billing/`;
  `CreditStatRow` exported from the Credits module.
- **`initialsOf`** lifted from `Team.tsx` to `monogram-types.ts` (two
  consumers).

### Monogram `sm` is 20px with a 12px letter `92f692d`

- Before: `size-4 text-[10px]`, a 16px circle whose single initial floated.
  After: `size-5 text-xs`, the same glyph size `md` uses. `monogram.tsx`;
  lands on Activity, Team detail member lists, Security overview and the
  team usage table.

## Sections

### Billing: Enterprise page, `/billing-enterprise` `dd4b262`

- Before: the route rendered the Pro `Billing` component (hero "Pro",
  Manage subscription with upgrade and downgrade, Credits with Stripe
  checkout, "1 seat × $20"). After: `src/pages/BillingEnterprise.tsx`, built
  from the ticket: Enterprise is Support-granted and billed by seat, no
  self-serve plan change.
- **Header.** Title, subtitle "Your Enterprise plan, seats, and invoices.",
  and a `Billing state` Select (mock affordance like "Viewing as") with
  Current / Upgraded to Enterprise / Billing being set up / Payment failed.
  It writes `?state=` (one-way, not stripped); each state is a shareable URL.
- **Plan card** (`tone="enterprise"`): hero `Enterprise` in violet;
  description "Everything in Pro, plus organization-wide compression and
  security settings for all of your teams. Billed per seat."; Seats sub-card
  (`type-label-16` title, subtitle, hairline, `dl` stat rows Seats · Price
  per seat `$50.00 / seat / month` · Current period · Next invoice); footer
  "Want to add seats or change your plan? Constellation Support can help."
  plus `Contact support` (lucide `Headset`, no-op in the mock).
- **Changes this period** table card: Member (Monogram + name + email) ·
  Seats `+1` / `-1` · Date · Amount (removals `$0.00`); widths 34 / 18 / 24
  / 24, `min-w-[480px]`.
- **History** of seat charges, six rows across three calendar months.
- **States.** Upgraded to Enterprise: welcome Callout dated today, period
  from today to month end, one `First seat charge, prorated…` invoice,
  empty Changes. Billing being set up: Callout, stat rows read `After billing
  is set up` / `Not started`, no Changes card, empty History. Payment failed:
  danger `role="alert"` "Payment failed. We couldn't collect $X on DATE.",
  newest charge `Failed`. Revoke: `/billing?state=revoked` renders a Callout
  on the Pro page.
- **Data.** `src/data/billing-seats.ts` (engine), `billing-enterprise.ts`
  (calendar months off the demo clock, `ENTERPRISE_SEAT_RATE_USD = 50`
  placeholder, `enterpriseBillingView(state)`), `billing-pro.ts`. Seat
  count is the member roster; `FORMER_MEMBER_ROWS` (Noor Haddad, Elena Ruiz)
  are mock departures. Tests: 13.
- Billing stays admin-only on every plan (chrome guard).

### Billing: Pro and Free plan cards adopt the stat-row sub-card `dd4b262`

- Before: Pro showed "Renews on … · $20 / month" plus a "1 seat × $20"
  inset; Free showed "Free plan — no renewal needed". After: Pro card
  (`tone="pro"`, indigo hero) has the Seats sub-card with Seats 4 · Price
  `$20.00 / user / month` (live string) · Renews on · Next invoice `$80.00`;
  Free has `Plan details` with Seats 1 · Price `$0.00 / month` · Renews on
  `No renewal`. `CardContent` is `gap-6`; hero + description sit in a
  `gap-3` block. The plan-comparison dialogs keep the live strings
  (`per user / month`, `$20/user/month after your 14-day trial ends`) via a
  `priceSuffix` field.

### Activity: Tokens in and out merged into one column `694eeda`

- Before: `Tokens in` and `Tokens out` as two numeric columns. After: one
  `Tokens In/Out` `SortableTableHead numeric` (`sortKey="tokensIn"`), cell
  = tokens in on the first line and tokens out beneath in `type-mono-12
  text-muted-foreground`, the Messages table recipe. Five numeric columns
  rebalance automatically (`table-fixed`, only the three text heads are
  explicit); `min-w` 1168 to 1152, which also removes a 14px horizontal
  scroll at 1440. Rows grow from 48 to about 61px. `src/pages/Activity.tsx`;
  Enterprise and Free routes share the component.

### Models: focus and screen-reader fixes from the rams review `92f692d`

- Search toolbar stays mounted when the filter empties, so the input keeps
  focus and its text; the empty state renders below it. The `+N`
  capability chip is `role="img"` so its label reaches assistive tech. The
  code sample and setup config scrollports are `role="region"
  tabIndex={0}` with the focus ring inset. Choosing a model focuses the
  detail's back link and announces "(model name) details" through a polite live
  region; back restores focus to the originating row via
  `data-model-row`. No route change. `src/pages/Models.tsx`; `/models` and
  `/models-enterprise` share it.

### Billing: flat plan card, no section subtitles, ledger polish `92f692d`

- **Plan card, all tiers.** Before: Seats / Plan details facts inside an
  inset `rounded-md border bg-card-muted p-4` sub-card with its own title.
  After: the one-sentence subtitle and the `dl` sit flat in `CardContent
  gap-3`, `dl` `mt-3 border-t pt-3`, the Credits card recipe. Enterprise
  `Current period` and Pro `Renews on` values are now mono like the rest
  of the list. Footer sentence is "Want to add seats or change your
  plan?" so it no longer repeats the `Contact support` button.
- **Section subtitles removed** under Plan, Credits and Billing history on
  Enterprise, Pro and Free; each card already carries its own
  description. Titles sit directly in the `gap-4` column, the Dashboard
  pattern. Page subtitle on Pro and Free is now "Everything you pay for
  Gate, in one place." (Enterprise: "your organization pays").
- **Credits hero** shows `$49.99`, matching the stat row beneath; the
  ledger keeps the five-decimal balance. `CreditsCard.tsx`.
- **Ledger.** Expanded child rows drop the `pl-8` on their Date cell so
  dates align under the day date; positive amounts add
  `dark:text-success-300`. `HistorySection.tsx`, shared by Pro, Free and
  the Enterprise Balance tab.
