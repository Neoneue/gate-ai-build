// Enterprise binding of the seat-billing engine (`billing-seats.ts`).
// Enterprise is a Support-granted entitlement billed BY SEAT through its own
// Stripe configuration (H2 PRD §3, §10): no checkout, upgrade, downgrade or
// cancel path, only a route to Constellation Support.
//
// A billing period is a CALENDAR MONTH (user direction 2026-09-16), anchored
// to the demo clock's current month, so the page always reads "this month"
// and the months before it.
//
// PLACEHOLDER, flagged 2026-09-16: the per-seat rate. The PRD gives no
// Enterprise price; the ticket says the value comes from the Enterprise
// Stripe configuration. $50 is a stand-in so the math on the page is real.
// Replace `ENTERPRISE_SEAT_RATE_USD` when Constellation Support supplies it.

import {
  type BillingPeriod,
  daysBetween,
  type FormerMemberRow,
  type InvoiceRow,
  periodDays,
  prorateSeat as prorateSeatAt,
  FORMER_MEMBER_ROWS as SEAT_FORMER_MEMBER_ROWS,
  type SeatChange as SeatChangeRow,
  seatChangesForPeriod,
  seatCount,
  seatInvoiceRows,
  seatsAtPeriodStart as seatsAtStartOf,
} from "@/data/billing-seats";
import { MEMBER_ROWS, type MemberRow } from "@/data/team-members";
import { authoredDate, DEMO_TODAY } from "@/lib/demo-clock";

// Local aliases (not re-exports: Biome's noBarrelFile) so the page and the
// tests keep one import path.
export type EnterpriseBillingPeriod = BillingPeriod;
export type SeatChange = SeatChangeRow;
export const FORMER_MEMBER_ROWS = SEAT_FORMER_MEMBER_ROWS;

export type EnterpriseInvoiceRow = InvoiceRow;
export type EnterpriseInvoiceStatus = InvoiceRow["status"];

/* ─── Placeholder rate ─────────────────────────────────────────────────── */

/** PLACEHOLDER: USD per seat per month. See header. */
export const ENTERPRISE_SEAT_RATE_USD = 50;

/* ─── Billing calendar ─────────────────────────────────────────────────── */

const monthStart = (d: Date, offsetMonths = 0): Date =>
  new Date(d.getFullYear(), d.getMonth() + offsetMonths, 1);

/** Months of history shown before the current one. */
const HISTORY_MONTHS = 2;

/** The current calendar month, from the 1st to the 1st of next month. */
export const ENTERPRISE_CURRENT_PERIOD: BillingPeriod = {
  start: monthStart(DEMO_TODAY),
  end: monthStart(DEMO_TODAY, 1),
};

export const ENTERPRISE_PERIOD_START: Date = ENTERPRISE_CURRENT_PERIOD.start;
export const ENTERPRISE_PERIOD_END: Date = ENTERPRISE_CURRENT_PERIOD.end;

/** Support granted the entitlement and provisioned Stripe billing on the
 *  first day of the oldest month shown. */
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

/* ─── Seats (Enterprise-bound wrappers) ────────────────────────────────── */

export function enterpriseSeatCount(
  members: MemberRow[] = MEMBER_ROWS
): number {
  return seatCount(members);
}

export function seatsAtPeriodStart(
  period: BillingPeriod = ENTERPRISE_CURRENT_PERIOD,
  members: MemberRow[] = MEMBER_ROWS,
  former: FormerMemberRow[] = FORMER_MEMBER_ROWS
): number {
  return seatsAtStartOf(period, members, former);
}

/** What the next monthly charge bills: every current seat at the full rate. */
export function nextInvoiceUsd(members: MemberRow[] = MEMBER_ROWS): number {
  return enterpriseSeatCount(members) * ENTERPRISE_SEAT_RATE_USD;
}

export function prorateSeat(
  daysRemaining: number,
  days: number = ENTERPRISE_PERIOD_DAYS
): number {
  return prorateSeatAt(ENTERPRISE_SEAT_RATE_USD, daysRemaining, days);
}

/** The current month's changes, what the Changes this period table shows. */
export function seatChangesThisPeriod(
  members: MemberRow[] = MEMBER_ROWS,
  former: FormerMemberRow[] = FORMER_MEMBER_ROWS
): SeatChangeRow[] {
  return seatChangesForPeriod(
    ENTERPRISE_CURRENT_PERIOD,
    ENTERPRISE_SEAT_RATE_USD,
    members,
    former
  );
}

/** Seat invoices for every month since the grant, newest first. */
export function enterpriseInvoiceRows(
  members: MemberRow[] = MEMBER_ROWS,
  former: FormerMemberRow[] = FORMER_MEMBER_ROWS
): EnterpriseInvoiceRow[] {
  return seatInvoiceRows(
    enterprisePeriods(),
    ENTERPRISE_SEAT_RATE_USD,
    members,
    former
  );
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

/** Seat invoices per state; in the past-due preview the newest seat invoice
 *  is the one that failed. */
export function invoicesForState(
  state: EnterpriseBillingState,
  members: MemberRow[] = MEMBER_ROWS
): EnterpriseInvoiceRow[] {
  if (state === "unprovisioned") {
    return [];
  }
  const rows = enterpriseInvoiceRows(members);
  if (state === "past-due" && rows.length > 0) {
    return [{ ...rows[0], status: "Failed" }, ...rows.slice(1)];
  }
  return rows;
}

/* ─── State-aware view ─────────────────────────────────────────────────── */

/** Everything the page renders for one preview state, coherent as a story:
 *  - `active` / `past-due`: an org on Enterprise since the oldest month
 *    shown, with the seat-invoice history (the PAYG ledger is the Balance
 *    tab, fed by `HISTORY_ROWS`);
 *  - `granted`: DAY ONE. Support upgraded the org today; the period runs
 *    from today to the end of the month, the only invoice is the prorated
 *    first seat charge, and there are no seat changes yet;
 *  - `unprovisioned`: granted today, billing not set up, nothing billed. */
export type EnterpriseBillingView = {
  state: EnterpriseBillingState;
  grantedOn: Date;
  /** Display period. Day-one states start on the grant day. */
  period: BillingPeriod;
  changes: SeatChangeRow[];
  /** Whether the Changes this period card renders at all. */
  showChanges: boolean;
  /** Seat invoices (the Plan tab), newest first. */
  invoices: EnterpriseInvoiceRow[];
  /** The invoice the past-due banner reports; null outside `past-due`. */
  failedInvoice: EnterpriseInvoiceRow | null;
};

/** The prorated first charge Stripe raises when a seat subscription starts
 *  mid-month: every current seat for the days left, priced against the
 *  full calendar month. */
export function firstSeatChargeRow(
  grantedOn: Date,
  period: BillingPeriod,
  members: MemberRow[] = MEMBER_ROWS
): EnterpriseInvoiceRow {
  const daysRemaining = daysBetween(grantedOn, period.end);
  const seats = enterpriseSeatCount(members);
  return {
    id: "inv-first",
    date: grantedOn,
    description: `First seat charge, prorated for the remaining ${daysRemaining} days`,
    seats,
    amount:
      seats *
      prorateSeatAt(
        ENTERPRISE_SEAT_RATE_USD,
        daysRemaining,
        periodDays(ENTERPRISE_CURRENT_PERIOD)
      ),
    status: "Paid",
  };
}

export function enterpriseBillingView(
  state: EnterpriseBillingState,
  members: MemberRow[] = MEMBER_ROWS,
  former: FormerMemberRow[] = FORMER_MEMBER_ROWS
): EnterpriseBillingView {
  if (state === "granted" || state === "unprovisioned") {
    const period: BillingPeriod = {
      start: DEMO_TODAY,
      end: ENTERPRISE_CURRENT_PERIOD.end,
    };
    return {
      state,
      grantedOn: DEMO_TODAY,
      period,
      changes: [],
      showChanges: state === "granted",
      invoices:
        state === "granted"
          ? [firstSeatChargeRow(DEMO_TODAY, period, members)]
          : [],
      failedInvoice: null,
    };
  }
  const seatInvoices = invoicesForState(state, members);
  // The Billing history card is tabbed (user 2026-09-16): Plan = these seat
  // invoices; Balance = the PAYG ledger (`HISTORY_ROWS`), rendered by the
  // shared HistorySection. Receipts therefore do not merge in here.
  return {
    state,
    grantedOn: ENTERPRISE_GRANTED_ON,
    period: ENTERPRISE_CURRENT_PERIOD,
    changes: seatChangesThisPeriod(members, former),
    showChanges: true,
    invoices: seatInvoices,
    failedInvoice: seatInvoices.find((r) => r.status === "Failed") ?? null,
  };
}
