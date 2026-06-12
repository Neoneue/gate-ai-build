# UI Changelog: 2026-06-11

Running log of UI changes for 06-11. Written for an agent/dev to **diff against
and replicate**: each entry states what changed, before → after, where, and (for
committed work) its commit hash.

Prior day: [`changelog-6-10.md`](./changelog-6-10.md).

**Using this log to make a change:**

- Each entry is tagged with its commit (`[abc1234]`) or `(uncommitted)`. For a
  committed entry, **`git show <hash>` is the exact diff**.
- This file logs **deltas, not the full contract.** `design.md` is the
  authoritative design system; `data-model.md` is the architecture.
- **Verify** edits with `npx tsc -b` (must exit 0), `npm exec -- ultracite check`,
  and the dev server at `localhost:3000`.

All of today's work is the **Billing Free/Pro split**: `/billing` became the
Pro-plan surface, `/billing-free` is the Free-plan surface, and the
Compare-plans modal was forked so the two pages can diverge.

---

## Sections

### Billing modal split — Free vs Pro instances `[2fe643d]`

- **Before:** one shared `plan-comparison-dialog.tsx` (`PlanComparisonDialog`)
  used by `/billing`, `/billing-free`, `/events-default`, and the pro-upgrade card.
- **After:** forked into two instances:
  - `plan-comparison-dialog.tsx` — **Free** instance. Still used by
    `/billing-free`, `SecurityDefault`, `pro-upgrade-card`.
  - `plan-comparison-dialog-pro.tsx` — new **Pro** instance
    (`PlanComparisonDialogPro`). Used **only** by `/billing`.
- Both pages now have an independent modal so the Pro one can be customized
  without affecting Free.

### `/billing` — Pro-plan page (`Billing.tsx`)

- **Plan card → Pro** `[2fe643d]`: hero `Free` → `Pro`; card title `Plan` →
  `Your plan`; removed the old upsell copy + "Upgrade to Pro" footer button.
  Added a `Renews on Jun 12, 2026 · $29 / user / month` sub-line, a **Seats**
  inset panel, and an **Auto-renew** inset panel with a `Switch` (local state,
  default on). Footer CTA → `Manage subscription` (opens `PlanComparisonDialogPro`).
- **Seats copy tightened** (uncommitted): "Billed per user — a seat is added
  when an invite is accepted (prorated for the rest of the period); removed
  seats stop billing at the next cycle." → **"Billed per seat. Accepting an
  invite adds a prorated seat; removed seats stop billing next cycle."**
- **Page subtitle** (uncommitted): "Plan, credits, and transaction history." →
  **"Manage your plan, track credit usage, and review every gateway transaction."**
  (also applied to `/billing-free`).
- **Payment method card added** (uncommitted): new full-width middle card
  between the Plan/Credits row and History. Title "Payment method", subtitle
  "Charged for subscription renewals and credit top-ups.", an inset panel with a
  `VISA` chip + `•••• 4242` / `Expires 01/27`, and an outline-then-primary
  `Update card` footer button (`CreditCard` icon).
- **History updates** (uncommitted): added subtitle "Past charges and credit
  top-ups." and an `Invoice portal` button (`Download` icon, `CardAction`).
  Added two `Adjustment` rows (`+$0.00529` → `$24.99238`, `+$0.00709` →
  `$24.98709`) above the existing three. New `"Adjustment"` member on the
  `HistoryRow` type. Amount/balance formatters now `maxFrac: 5` so round rows
  stay 2-decimal and adjustment rows show full precision.
- **Credits hero reconciled** (uncommitted): `$24.98` → **`$24.99238`** to match
  the new History top balance (single-source-of-truth rule). JSDoc updated.

### `/billing-free` — Free-plan page (`BillingFree.tsx`) `[2fe643d]` + (uncommitted)

- New route `/billing-free` + lazy import in `App.tsx`; page is a duplicate of
  `Billing` exporting `BillingFree`.
- Card title `Plan` → `Your plan`; footer CTA → `Manage subscription`; the
  "Upgrade to Pro" footer button removed (Plan card description still mentions
  upgrading — that's copy, not a button).
- Free-plan line: "Free plan — no renewal" → **"Free plan — no renewal needed"**.
- **Credits zeroed** (uncommitted): hero `$24.98` → `$0.00`; "Used this month"
  `$0.02` → `$0.00`; "Last top-up" date → **"Never"** (removed `LAST_TOPUP_DATE`).

---

## Components / Conventions

- **Card footers → 8px vertical padding** (uncommitted): `CardFooter` on the
  Billing/BillingFree Plan, Credits, and Payment-method cards gained `py-2`
  (8px top/bottom, 16px sides preserved).
- **Buttons → 32px (`size="sm"`)** (uncommitted): all page buttons (Manage
  subscription, Auto-recharge, Add credits, Update card, Invoice portal) and all
  dialog footer/CTA buttons (Add credits, Auto-recharge, Manage subscription
  modals) set to `size="sm"`.
- **Button icons** (uncommitted): `Manage subscription` → `ArrowUpCircle`,
  `Auto-recharge` → `RefreshCw`, `Add credits` → `Plus`, `Invoice portal` →
  `Receipt` (Billing), `Update card` → `CreditCard` (Billing), `Add card` →
  `Plus` (BillingFree). All via `data-icon="inline-start"`.
- **Button variants** (uncommitted): all card/dialog CTAs are outline + 32px,
  EXCEPT primary: `Add credits` (both pages) and `Add card` (BillingFree).
  `Manage subscription` / `Update card` were briefly primary then reverted to
  outline.
- **VISA/CARD chip** (uncommitted): bordered chip, **40px** height (`h-10`), 8px
  left/right padding (`px-2`), text-only label. On `/billing` it reads `VISA`
  with `•••• 4242` / `Expires 01/27`; on `/billing-free` it reads `CARD` with
  `No payment method on file` and no expiry. (A `/icons/providers/visa.svg` logo
  slot was prototyped then removed.)
- **Billing Credits values** (uncommitted, `/billing` only): "Used this month"
  → `$0.02 / $24.99`; "Last top-up" → `May 12, 2026 · $25` (was a `Timestamp`).
- **Top-bar workspace badge** `[2fe643d]`: `WorkspaceSwitcher` badge
  `Free` → `Pro` in `sidebar.tsx`. NOTE: this badge is global, so `/billing-free`
  also shows `PRO` — known inconsistency, not yet route-aware.
- **`/billing-free` Payment method card** (uncommitted): added as a standalone
  local copy (not the shared component) so it can diverge. Free treatment:
  `CARD` chip, "No payment method on file", no expiry, primary `Add card` CTA.
- **`/billing-free` History → EmptyState** (uncommitted): replaced the whole
  History card (header + table) with the default `<EmptyState>` primitive —
  `History` icon chip + "No history yet" + body copy, no header/table/CTA (same
  pattern as ApiKeysDefault). Removed the now-dead `HistoryRow`, `HISTORY_ROWS`,
  sort helpers, formatters, and table imports from the file.

### Pro modal (`plan-comparison-dialog-pro.tsx`)

- Plan titles `text-xl` → **`text-lg`**; plan badges hidden `[2fe643d]`.
- Modal title → **"Manage subscription"** `[2fe643d]`.
- CTAs swapped for the Pro context `[2fe643d]`: Free card → active
  **"Downgrade plan"** (outline); Pro card → disabled **"Your current plan"**
  (outline). Removed the Sparkles icon from the CTA.
- Price `$30` → **`$29`** (+ caption) to match the Pro page (uncommitted).
- Featured-card outline `border-blue-600/30 ring-blue-600/20` →
  **`border-primary/30 ring-primary/20`** (uncommitted).
- `DialogContent` padding `p-4` → **`p-6`** (24px) (uncommitted).

---

## Open / flagged (not done)

- Top-bar badge shows **PRO on `/billing-free`** (global badge, not route-aware).
- `/billing` History **dates show time** (`May 29, 14:30:00`) vs date-only in the
  latest mock.
- `/billing-free` modal (Free instance) did **not** receive the Pro modal's
  outline-primary / 24px-padding / `$29` changes.
