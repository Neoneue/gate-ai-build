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
