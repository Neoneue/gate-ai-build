// Seat-billing engine shared by the Enterprise and Pro Billing pages.
// One set of rules, two bindings (rate + billing calendar), so a plan change
// reads as the same surface with different values and the numbers on every
// tier reconcile with the Members page.
//
// Rules (Stripe licensed-seat subscriptions, H1 Billing PRD + H2 §3, §10):
//   - a seat is an accepted member of the org (`MEMBER_ROWS`); pending
//     invitations are not seats until accepted;
//   - each period start raises a seat charge for everyone present that day
//     (roster joined on or before it, plus former members still present);
//   - a member who joins mid-period is a prorated addition (Stripe: a
//     `proration: true` line item) billed for the days left;
//   - a member who leaves mid-period stays billed through the period and
//     comes off the next charge: no credit, no invoice row;
//   - PAYG top-ups are plan-independent (H1: the balance is a capability
//     flag) and their receipts are listed with the invoices.
//
// `FORMER_MEMBER_ROWS` are mock departed members (added 2026-09-16) so the
// pages show departures and a fuller history.

import type { AvatarTone } from "@/components/ui/monogram-types";
import { HISTORY_ROWS } from "@/data/billing-history";
import { MEMBER_ROWS, type MemberRow } from "@/data/team-members";
import { authoredDate } from "@/lib/demo-clock";

/* ─── Calendar helpers ─────────────────────────────────────────────────── */

export type BillingPeriod = { start: Date; end: Date };

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const daysBetween = (a: Date, b: Date): number =>
  Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);

export const periodDays = (p: BillingPeriod): number =>
  daysBetween(p.start, p.end);

/** Same day-of-month, `n` months away (n may be negative). */
export const addMonths = (d: Date, n: number): Date =>
  new Date(d.getFullYear(), d.getMonth() + n, d.getDate());

/** `count` consecutive periods ending at `end`, oldest first. */
export function periodsEndingAt(end: Date, count: number): BillingPeriod[] {
  const periods: BillingPeriod[] = [];
  for (let i = count; i >= 1; i--) {
    periods.push({ start: addMonths(end, -i), end: addMonths(end, -i + 1) });
  }
  return periods;
}

/* ─── Former members ───────────────────────────────────────────────────── */

export type FormerMemberRow = {
  id: string;
  name: string;
  email: string;
  avatarTone: AvatarTone;
  joined: Date;
  /** The day the member was removed from the org. */
  left: Date;
};

/** Mock departed members. Authored 2026-03-15 / 03-20 joins (late June,
 *  shifted) and 05-25 / 05-28 departures (early September). */
export const FORMER_MEMBER_ROWS: FormerMemberRow[] = [
  {
    id: "usr_noor",
    name: "Noor Haddad",
    email: "noor.haddad@acme.io",
    avatarTone: "ink",
    joined: authoredDate(2026, 2, 15),
    left: authoredDate(2026, 4, 25),
  },
  {
    id: "usr_elena",
    name: "Elena Ruiz",
    email: "elena.ruiz@acme.io",
    avatarTone: "rose",
    joined: authoredDate(2026, 2, 20),
    left: authoredDate(2026, 4, 28),
  },
];

/* ─── Seats ────────────────────────────────────────────────────────────── */

/** A seat is an accepted member of the org. */
export function seatCount(members: MemberRow[] = MEMBER_ROWS): number {
  return members.length;
}

/** Everyone present on the period start day. Former members count while
 *  `joined <= start < left`. */
export function seatsAtPeriodStart(
  period: BillingPeriod,
  members: MemberRow[] = MEMBER_ROWS,
  former: FormerMemberRow[] = FORMER_MEMBER_ROWS
): number {
  const present = members.filter((m) => m.joined <= period.start).length;
  const formerPresent = former.filter(
    (f) => f.joined <= period.start && f.left > period.start
  ).length;
  return present + formerPresent;
}

/** Prorated seat price for `daysRemaining` of a `days`-day period at `rate`,
 *  rounded to the cent the way Stripe bills it. */
export function prorateSeat(
  rate: number,
  daysRemaining: number,
  days: number
): number {
  return Math.round((rate * daysRemaining * 100) / days) / 100;
}

export type SeatChangeKind = "added" | "removed";

export type SeatChange = {
  id: string;
  kind: SeatChangeKind;
  name: string;
  email: string;
  avatarTone: AvatarTone;
  /** Join date for an addition, removal date for a departure. */
  date: Date;
  /** Days from the change to the period end. */
  daysRemaining: number;
  /** Prorated charge for an addition; 0 for a removal (stops next charge). */
  proratedUsd: number;
};

/** Joined strictly after the period start and before its end: an addition.
 *  Joining ON the start day is billed on that period's charge instead. */
const joinedMidPeriod = (d: Date, p: BillingPeriod): boolean =>
  d > p.start && d < p.end;

const leftInPeriod = (d: Date, p: BillingPeriod): boolean =>
  d > p.start && d <= p.end;

type Person = Pick<FormerMemberRow, "id" | "name" | "email" | "avatarTone">;

/** Every seat change inside a period, newest first. */
export function seatChangesForPeriod(
  period: BillingPeriod,
  rate: number,
  members: MemberRow[] = MEMBER_ROWS,
  former: FormerMemberRow[] = FORMER_MEMBER_ROWS
): SeatChange[] {
  const addition = (p: Person, joined: Date): SeatChange => {
    const daysRemaining = daysBetween(joined, period.end);
    return {
      id: `add-${p.id}`,
      kind: "added",
      name: p.name,
      email: p.email,
      avatarTone: p.avatarTone,
      date: joined,
      daysRemaining,
      proratedUsd: prorateSeat(rate, daysRemaining, periodDays(period)),
    };
  };
  const added = [
    ...members
      .filter((m) => joinedMidPeriod(m.joined, period))
      .map((m) => addition(m, m.joined)),
    ...former
      .filter((f) => joinedMidPeriod(f.joined, period))
      .map((f) => addition(f, f.joined)),
  ];
  const removed = former
    .filter((f) => leftInPeriod(f.left, period))
    .map<SeatChange>((f) => ({
      id: `rem-${f.id}`,
      kind: "removed",
      name: f.name,
      email: f.email,
      avatarTone: f.avatarTone,
      date: f.left,
      daysRemaining: daysBetween(f.left, period.end),
      proratedUsd: 0,
    }));
  return [...added, ...removed].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );
}

/* ─── Invoices ─────────────────────────────────────────────────────────── */

export type InvoiceStatus = "Paid" | "Failed";

export type InvoiceRow = {
  id: string;
  date: Date;
  description: string;
  /** Seat count for seat charges; null for a credit top-up receipt. */
  seats: number | null;
  amount: number;
  status: InvoiceStatus;
};

/** One seat charge per period start plus one prorated row per mid-period
 *  addition, newest first. Removals create no row. */
export function seatInvoiceRows(
  periods: BillingPeriod[],
  rate: number,
  members: MemberRow[] = MEMBER_ROWS,
  former: FormerMemberRow[] = FORMER_MEMBER_ROWS
): InvoiceRow[] {
  const rows: InvoiceRow[] = [];
  for (const period of periods) {
    const seats = seatsAtPeriodStart(period, members, former);
    rows.push({
      id: `inv-period-${period.start.getTime()}`,
      date: period.start,
      description: "Monthly seat charge",
      seats,
      amount: seats * rate,
      status: "Paid",
    });
    for (const c of seatChangesForPeriod(period, rate, members, former)) {
      if (c.kind === "added") {
        rows.push({
          id: `inv-seat-${c.id}`,
          date: c.date,
          description: `1 seat added, prorated for the remaining ${c.daysRemaining} days`,
          seats: 1,
          amount: c.proratedUsd,
          status: "Paid",
        });
      }
    }
  }
  return rows.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/** PAYG top-up receipts, read from the same `HISTORY_ROWS` the Credits card
 *  and the notifications feed use. Plan-independent. */
export function creditReceiptRows(): InvoiceRow[] {
  return HISTORY_ROWS.filter((r) => r.type === "Credits added").map((r) => ({
    id: `receipt-${r.id}`,
    date: r.date,
    description: "Credits added",
    seats: null,
    amount: r.amount,
    status: "Paid",
  }));
}

export const byDateDesc = (a: InvoiceRow, b: InvoiceRow): number =>
  b.date.getTime() - a.date.getTime();
