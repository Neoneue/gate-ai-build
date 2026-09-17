// Enterprise billing seed. Enterprise is a Support-granted entitlement billed
// BY SEAT (H2 PRD §3, §10): no checkout, upgrade, downgrade or cancel path,
// only a route to Constellation Support.
//
// The seat side is a PLAN, not a headcount (PM + user, call 2026-09-17):
// the org buys a number of seats, members use them, and the plan card reads
// utilization ("4 of 4"). Adding or removing seats happens on the plan via
// Support. There is no proration, no per-member charge and no mid-period
// costing anywhere on the page; the monthly charge is seats on the plan at
// the per-seat rate. Billing history is the one PAYG credit ledger Pro shows.
//
// A billing period is a CALENDAR MONTH (user direction 2026-09-16), anchored
// to the demo clock's current month.
//
// PLACEHOLDER, flagged 2026-09-16: the per-seat rate. The PRD gives no
// Enterprise price; the ticket says the value comes from the Enterprise
// Stripe configuration. $50 is a stand-in so the math on the page is real.

import {
  CREDIT_BALANCE_USD,
  HISTORY_ROWS,
  type HistoryRow,
  lastTopUpLabel,
} from "@/data/billing-history";
import {
  type BillingPeriod,
  periodDays,
  seatCount,
} from "@/data/billing-seats";
import { MEMBER_ROWS, type MemberRow } from "@/data/team-members";
import { authoredDate, DEMO_TODAY } from "@/lib/demo-clock";

export type EnterpriseBillingPeriod = BillingPeriod;

/* ─── Placeholder rate ─────────────────────────────────────────────────── */

/** PLACEHOLDER: USD per seat per month. See header. */
export const ENTERPRISE_SEAT_RATE_USD = 50;

/* ─── Billing calendar ─────────────────────────────────────────────────── */

const monthStart = (d: Date, offsetMonths = 0): Date =>
  new Date(d.getFullYear(), d.getMonth() + offsetMonths, 1);

/** Months of history before the current one. ONE (user narrative
 *  2026-09-17): the org owner joined on the last day of the month before
 *  that, so Enterprise starts on the first 1st after the org existed. */
const HISTORY_MONTHS = 1;

/** The current calendar month, from the 1st to the 1st of next month. */
export const ENTERPRISE_CURRENT_PERIOD: BillingPeriod = {
  start: monthStart(DEMO_TODAY),
  end: monthStart(DEMO_TODAY, 1),
};

export const ENTERPRISE_PERIOD_START: Date = ENTERPRISE_CURRENT_PERIOD.start;
export const ENTERPRISE_PERIOD_END: Date = ENTERPRISE_CURRENT_PERIOD.end;

/** Support granted the entitlement on the first day of the oldest month. */
export const ENTERPRISE_GRANTED_ON: Date = monthStart(
  DEMO_TODAY,
  -HISTORY_MONTHS
);

/** Seed date for the revoke transition notice (`/billing?state=revoked`):
 *  authored 2026-06-06, the demo "today". */
export const ENTERPRISE_REVOKED_ON: Date = authoredDate(2026, 5, 6);

/** Whole days in the current month. */
export const ENTERPRISE_PERIOD_DAYS = periodDays(ENTERPRISE_CURRENT_PERIOD);

/** Every period from the grant to the current one, oldest first. */
export function enterprisePeriods(): BillingPeriod[] {
  const periods: BillingPeriod[] = [];
  for (let m = -HISTORY_MONTHS; m <= 0; m++) {
    periods.push({
      start: monthStart(DEMO_TODAY, m),
      end: monthStart(DEMO_TODAY, m + 1),
    });
  }
  return periods;
}

/* ─── Seats ────────────────────────────────────────────────────────────── */

/** Seats in use: every member of the org holds one. */
export function enterpriseSeatCount(
  members: MemberRow[] = MEMBER_ROWS
): number {
  return seatCount(members);
}

/** Seats on the plan: the quantity Support set when the org was granted
 *  Enterprise. The mock org uses every seat it bought, so the plan card
 *  reads "4 of 4". */
export function enterprisePlanSeats(
  members: MemberRow[] = MEMBER_ROWS
): number {
  return seatCount(members);
}

/** The monthly charge: every seat on the plan at the per-seat rate. */
export function nextInvoiceUsd(members: MemberRow[] = MEMBER_ROWS): number {
  return enterprisePlanSeats(members) * ENTERPRISE_SEAT_RATE_USD;
}

/* ─── Page states ──────────────────────────────────────────────────────── */

/** Preview states the Enterprise Billing page renders off `?state=`.
 *  `active` is the default (param absent or unknown). `revoked` is NOT here:
 *  a revoked org is back on Pro, so that notice renders on `/billing`. */
export const ENTERPRISE_BILLING_STATES = [
  "active",
  "granted",
  "unprovisioned",
  "past-due",
] as const;

export type EnterpriseBillingState = (typeof ENTERPRISE_BILLING_STATES)[number];

export function parseEnterpriseBillingState(
  raw: string | null
): EnterpriseBillingState {
  return (ENTERPRISE_BILLING_STATES as readonly string[]).includes(raw ?? "")
    ? (raw as EnterpriseBillingState)
    : "active";
}

/** The seat charge that failed, for the past-due banner. */
export type FailedCharge = { amount: number; date: Date };

/** Everything the page renders for one preview state, coherent as a story:
 *  - `active` / `past-due`: an org on Enterprise since the oldest month;
 *    past-due is this month's seat charge failing on the 1st;
 *  - `granted`: DAY ONE. Support upgraded the org today; the period runs
 *    from today to the end of the month;
 *  - `unprovisioned`: granted today, seat billing not set up yet.
 *  ONE org in every state (user narrative 2026-09-17): it was on Pro before,
 *  so the credit balance, the card on file and the PAYG ledger exist in all
 *  four. Credits are plan-independent (H2 §10). */
export type EnterpriseBillingView = {
  state: EnterpriseBillingState;
  grantedOn: Date;
  /** Display period. Day-one states start on the grant day. */
  period: BillingPeriod;
  /** The charge the past-due banner reports; null outside `past-due`. */
  failedCharge: FailedCharge | null;
  /** PAYG credit balance behind the Credits card hero. */
  creditBalance: number;
  /** Formatted "Last top-up" value, null when there has never been one. */
  lastTopUp: string | null;
  /** Whether a card is on file (the Payment method card). */
  hasCard: boolean;
  /** PAYG ledger rows (Billing history), newest first. */
  ledgerRows: HistoryRow[];
};

export function enterpriseBillingView(
  state: EnterpriseBillingState,
  members: MemberRow[] = MEMBER_ROWS
): EnterpriseBillingView {
  const credits = {
    creditBalance: CREDIT_BALANCE_USD,
    lastTopUp: lastTopUpLabel(),
    hasCard: true,
    ledgerRows: HISTORY_ROWS,
  };
  if (state === "granted" || state === "unprovisioned") {
    return {
      state,
      grantedOn: DEMO_TODAY,
      period: { start: DEMO_TODAY, end: ENTERPRISE_CURRENT_PERIOD.end },
      failedCharge: null,
      ...credits,
    };
  }
  return {
    state,
    grantedOn: ENTERPRISE_GRANTED_ON,
    period: ENTERPRISE_CURRENT_PERIOD,
    failedCharge:
      state === "past-due"
        ? {
            amount: nextInvoiceUsd(members),
            date: ENTERPRISE_CURRENT_PERIOD.start,
          }
        : null,
    ...credits,
  };
}
