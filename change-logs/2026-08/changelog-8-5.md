# UI Changelog: 2026-08-05

Running log of every UI change made to the dashboard. Written to diff against and replicate across surfaces.

Prior day: [`changelog-8-4.md`](./changelog-8-4.md)

---

## Conventions

### Destructive alpha ladder — 30 / 50 / 100 named, not modifier-typed `fd4e58b`

**`index.css`** · **`design.md`** · **`ui/card.tsx`**

The danger card border started as a raw `border-destructive/50`, softened to `/30`, and was then promoted to a real token rung so the alpha is a closed set rather than an ad-hoc modifier anyone can dial.

- **Three rungs, derived from one base.** `--destructive-subtle` (`color-mix` of `--destructive` at 30%), `--destructive-muted` (50%), and `--destructive` itself as the 100% base. Both derived rungs go through `color-mix(in oklab, var(--destructive) N%, transparent)`, so they flip with theme automatically — dark's rungs derive from danger-400, light's from danger-600, with no per-theme literal.
- **Named after the file's own precedent.** `--accent-muted` already means "accent at 50%", so `--destructive-muted` reads the same; `-subtle` is the quieter rung below it. There is no `--destructive-full` — 100% is the base token.
- **Aliased into `@theme inline`** as `--color-destructive-subtle` / `-muted`, which is what generates `border-`/`bg-`/`text-` utilities. `design.md` documents the ladder as the only sanctioned destructive alphas.

### Observed values never fabricate past the 7 days of real data `fd4e58b`

**`pages/alerts/data.ts`**

The alert wizard's "currently …" preview and every seeded firing derive from the real 7-day workload (`activity-data.ts`), the security range table (`events-data.ts`), and the request rows — there is no synthetic number anywhere. When a rule window exceeds what the data covers, the value degrades honestly instead of extrapolating.

- **`observedValue(condition, window)` returns a real figure only for windows ≤ 7 days-equivalent;** beyond that it signals insufficient history and the preview shows a "not enough history yet" line rather than a made-up number. This is realistic behavior for a fresh alert window, and it keeps the no-synthetic-data rule intact for month/year windows the mock cannot honestly fill.

---

## Components

### `Stepper` — new primitive for numbered in-dialog steps `fd4e58b`

**`ui/stepper.tsx`** *(new)* · **`design.md`**

Nothing in `ui/` did numbered vertical steps with a connector rail, so the alert-rule wizard needed one built rather than hand-rolled at the call site.

- **Compound API, state supplied by the consumer.** `Stepper` (`<ol>`) → `StepperItem {index, state}` → `StepperIndicator` + `StepperBody` → `StepperTitle {onClick?}` + `StepperPanel`. `state` (`upcoming | active | complete`) is the only visual axis; the primitive holds no step state so it can never disagree with the wizard that owns "which step am I on."
- **Complete steps collapse to a check and become revisitable;** the active step expands its panel; upcoming steps show a muted numeral. `size-6` circle, `type-mono-12` numeral, 1px `bg-border` rail hidden on the last item. Panels unmount when inactive, so Back preserves entered state as a property of the consumer.

### `Card` gains a `tone="danger"` edge `fd4e58b`

**`ui/card.tsx`** · **`design.md`**

`Card` had no way to carry a danger border, needed by the account-management teardown cards.

- **`tone: "default" | "danger"`** via a `data-tone` attribute; danger repoints the edge to `border-destructive-subtle` (the 30% rung above). Edge only — fill, ink, padding and rhythm are untouched, so the card stays a peer of Profile/Security and the destructive `Button` inside stays the loudest element. Never painted at a call site.

### `CancelPlanDialog` — shared controlled confirm, two entry points `fd4e58b`

**`pages/cancel-plan-dialog.tsx`** *(new)* · **`pages/Settings.tsx`** · **`pages/Billing.tsx`** · **`pages/plan-comparison-dialog-pro.tsx`**

The plan-cancellation confirm was extracted out of Settings into one controlled component so it can live at more than one entry point without the copy drifting.

- **Controlled (`open` / `onOpenChange`), optional `trigger` slot.** Settings passes its card button as the trigger; Billing opens it programmatically. Confirm behavior (close + "Plan cancellation scheduled" toast) is baked in, so the two entry points cannot diverge.
- **Billing wiring.** Manage subscription → the plan-comparison dialog's Free card CTA, renamed "Downgrade plan" → **"Cancel Pro plan"**, closes the comparison dialog and opens the cancel dialog through Base UI's `onOpenChangeComplete` — a timer-free handoff with no co-mounted second backdrop. The confirm button carries a trailing `ExternalLinkIcon` since it routes to Stripe.
- **500px, 24px footer gap, warning callout, no type-to-confirm** (that gate stays exclusive to the delete-account dialog). Shared `BILLING_PERIOD_END` constant kills what was a third copy of the renewal date.

---

## Sections

### Alerts — a new Manage surface for rules and firings `fd4e58b`

**`pages/Alerts.tsx`** *(new)* · **`pages/alerts/`** *(new module)* · **`layouts/nav-sections.ts`** · **`lib/plan.ts`** · **`App.tsx`**

New customer-facing Alerts experience: create/manage alert rules and triage their firings. Manage nav gains an "Alerts" item (BellRing) between Limits and Token Savings, with `/alerts`, `/alerts-default`, and `/alerts-free` twins wired through `lib/plan.ts` like every other tier-forked page.

- **Data model (`pages/alerts/`):** `types.ts` (AlertRule / AlertEvent / structured `AlertWindow`), `data.ts` (observedValue + seeds + templates + channel validators, all derived), `view.ts` (badge/icon maps, sort accessors), `glyphs.tsx`, plus the wizard and event dialog. 110 tests pass, including reconciliation of every observed value against its source constant.
- **Rules tab:** sortable/filterable table — Name · Condition · Threshold · Window · Severity · Channels · Last fired · Enabled · Actions. Severity badges tinted (info blue, warning amber, critical danger); channels show per-type glyphs with a read-only target popover; "Last fired" cross-links to the Events tab pre-filtered to that rule.
- **Create/edit wizard** in a centered Dialog (not a Sheet): `Stepper` with Choose condition → Configure rule → Notification channels. Condition and severity tiles carry inline 16px glyphs; selected severity tiles take the Policies-style tone (warning `flag`, critical `block`); the threshold row shows a live observed-value preview; **Window is a composed count + unit** (day/week/month/year) that degrades honestly past 7 days; channel rows validate email / `https` webhook / `#slack` inline.
- **Events tab:** firing table with status + severity + search filters, an open-count chip on the tab, a detail dialog with per-channel delivery dots, and acknowledge/resolve actions that update the row, the dialog, and the count in one move. Resolved rows show no menu (matching revoked keys). Both tables fit their card at the xl cap.

### Settings — Account management section `fd4e58b`

**`pages/Settings.tsx`** · **`pages/SettingsFree.tsx`** · **`App.tsx`**

Settings gains a third section under Profile and Security, following the same title-above-card rhythm.

- **Delete account and data** card: danger tone, Profile-style button footer, a warning callout listing the teardown consequences (30-day grace, purge, PAYG refund, retained fingerprinted proofs + billing records, sole-owner org teardown), and a "Delete my account" type-to-confirm that gates the destructive button.
- **Cancel plan** card: same danger/footer treatment, opens the shared `CancelPlanDialog`. Hidden on Pro for now behind a `showCancelPlan` prop (Pro route passes `false`; the Free/Default twins already omit it) — the code stays for when it is needed.
- Card titles use the 16px title voice; the existing Passkey title bumped to match.

---
