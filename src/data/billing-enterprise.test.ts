import { describe, expect, test } from "vitest";
import {
  ENTERPRISE_CURRENT_PERIOD,
  ENTERPRISE_GRANTED_ON,
  ENTERPRISE_PERIOD_DAYS,
  ENTERPRISE_PERIOD_END,
  ENTERPRISE_PERIOD_START,
  ENTERPRISE_SEAT_RATE_USD,
  enterpriseBillingView,
  enterpriseInvoiceRows,
  enterprisePeriods,
  enterpriseSeatCount,
  FORMER_MEMBER_ROWS,
  invoicesForState,
  nextInvoiceUsd,
  parseEnterpriseBillingState,
  prorateSeat,
  seatChangesThisPeriod,
  seatsAtPeriodStart,
} from "@/data/billing-enterprise";
import { MEMBER_ROWS } from "@/data/team-members";
import { DEMO_TODAY } from "@/lib/demo-clock";

// Ticket acceptance: "shows seat count and the seat-based charge" and "a
// seat-count change is reflected in what the org sees, consistent with what
// Stripe bills". A period is a calendar month (user, 2026-09-16). Seat count
// is the member roster; the current month's changes are the member who
// joined (prorated) and the former members who left (no charge, off the next
// monthly charge); every monthly charge bills exactly the people present on
// the 1st; invoice rows never include a removal.
describe("Enterprise billing seed", () => {
  test("periods are calendar months ending on the current one", () => {
    const periods = enterprisePeriods();
    expect(periods).toHaveLength(3);
    for (const p of periods) {
      expect(p.start.getDate()).toBe(1);
      expect(p.end.getDate()).toBe(1);
      expect(p.end.getMonth()).toBe((p.start.getMonth() + 1) % 12);
    }
    expect(periods[0].start.getTime()).toBe(ENTERPRISE_GRANTED_ON.getTime());
    expect(ENTERPRISE_PERIOD_START.getMonth()).toBe(DEMO_TODAY.getMonth());
    expect(ENTERPRISE_PERIOD_END.getTime()).toBe(
      ENTERPRISE_CURRENT_PERIOD.end.getTime()
    );
    expect([28, 29, 30, 31]).toContain(ENTERPRISE_PERIOD_DAYS);
  });

  test("seat count is the org member roster", () => {
    expect(enterpriseSeatCount()).toBe(MEMBER_ROWS.length);
    expect(nextInvoiceUsd()).toBe(
      MEMBER_ROWS.length * ENTERPRISE_SEAT_RATE_USD
    );
  });

  test("current month: one addition (Jordan) and two removals, newest first", () => {
    const changes = seatChangesThisPeriod();
    expect(changes.map((c) => c.id)).toEqual([
      "add-usr_jordan",
      "rem-usr_elena",
      "rem-usr_noor",
    ]);
    const jordan = changes[0];
    expect(jordan.proratedUsd).toBe(
      prorateSeat(jordan.daysRemaining, ENTERPRISE_PERIOD_DAYS)
    );
    expect(jordan.proratedUsd).toBe(
      Math.round(
        (ENTERPRISE_SEAT_RATE_USD * jordan.daysRemaining * 100) /
          ENTERPRISE_PERIOD_DAYS
      ) / 100
    );
    for (const removal of changes.slice(1)) {
      expect(removal.kind).toBe("removed");
      expect(removal.proratedUsd).toBe(0);
    }
    expect(changes[1].date).toBe(FORMER_MEMBER_ROWS[1].left);
    expect(changes[2].date).toBe(FORMER_MEMBER_ROWS[0].left);
  });

  test("this month's charge bills roster minus additions plus removals", () => {
    const changes = seatChangesThisPeriod();
    const added = changes.filter((c) => c.kind === "added").length;
    const removed = changes.filter((c) => c.kind === "removed").length;
    expect(seatsAtPeriodStart()).toBe(MEMBER_ROWS.length - added + removed);
    expect(seatsAtPeriodStart()).toBe(5);
  });

  test("six invoice rows: three monthly charges plus three prorated additions", () => {
    const rows = enterpriseInvoiceRows();
    expect(rows).toHaveLength(6);
    const monthly = rows.filter((r) => r.description === "Monthly seat charge");
    expect(monthly).toHaveLength(3);
    for (const m of monthly) {
      expect(m.date.getDate()).toBe(1);
      expect(m.amount).toBe((m.seats ?? 0) * ENTERPRISE_SEAT_RATE_USD);
    }
    // Newest first, and the newest row is Jordan's proration this month.
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].date.getTime()).toBeGreaterThanOrEqual(
        rows[i].date.getTime()
      );
    }
    expect(rows[0].id).toBe("inv-seat-add-usr_jordan");
    // No removal ever produces a row.
    expect(rows.some((r) => r.id.startsWith("inv-seat-rem-"))).toBe(false);
    // Consecutive monthly charges differ by exactly the prior month's
    // net seat change (additions billed prorated, removals drop off).
    const oldestFirst = [...monthly].reverse();
    expect(oldestFirst.map((m) => m.seats)).toEqual([2, 4, 5]);
  });

  test("state parsing defaults to active", () => {
    expect(parseEnterpriseBillingState(null)).toBe("active");
    expect(parseEnterpriseBillingState("nonsense")).toBe("active");
    expect(parseEnterpriseBillingState("past-due")).toBe("past-due");
  });

  test("state-specific invoice lists", () => {
    expect(invoicesForState("unprovisioned")).toEqual([]);
    const pastDue = invoicesForState("past-due");
    expect(pastDue[0].status).toBe("Failed");
    expect(pastDue.slice(1).every((r) => r.status === "Paid")).toBe(true);
    expect(invoicesForState("active").every((r) => r.status === "Paid")).toBe(
      true
    );
  });
});

// Each preview state tells a coherent story: a long-standing org for active
// and past-due, day one for granted (upgraded today, one prorated first
// charge, no seat changes yet), nothing billed for unprovisioned.
describe("Enterprise billing view per state", () => {
  test("active and past-due carry the full history", () => {
    const active = enterpriseBillingView("active");
    expect(active.grantedOn.getTime()).toBe(ENTERPRISE_GRANTED_ON.getTime());
    expect(active.period).toEqual(ENTERPRISE_CURRENT_PERIOD);
    expect(active.changes).toHaveLength(3);
    // Seat invoices only: no PRD sentence gives Enterprise a PAYG balance,
    // so no top-up receipts appear here (open question for review).
    expect(active.invoices).toHaveLength(6);
    expect(active.invoices.every((r) => r.seats !== null)).toBe(true);
    for (let i = 1; i < active.invoices.length; i++) {
      expect(active.invoices[i - 1].date.getTime()).toBeGreaterThanOrEqual(
        active.invoices[i].date.getTime()
      );
    }
    expect(active.failedInvoice).toBeNull();
    expect(active.showChanges).toBe(true);
    const pastDue = enterpriseBillingView("past-due");
    expect(pastDue.failedInvoice?.status).toBe("Failed");
    expect(pastDue.failedInvoice?.seats).not.toBeNull();
    expect(pastDue.invoices.filter((r) => r.status === "Failed")).toHaveLength(
      1
    );
  });

  test("granted is day one: today, one prorated first charge, no changes", () => {
    const view = enterpriseBillingView("granted");
    expect(view.grantedOn.getTime()).toBe(DEMO_TODAY.getTime());
    expect(view.period.start.getTime()).toBe(DEMO_TODAY.getTime());
    expect(view.period.end.getTime()).toBe(ENTERPRISE_PERIOD_END.getTime());
    expect(view.changes).toEqual([]);
    expect(view.showChanges).toBe(true);
    expect(view.invoices).toHaveLength(1);
    const first = view.invoices[0];
    expect(first.description.startsWith("First seat charge")).toBe(true);
    expect(first.seats).toBe(MEMBER_ROWS.length);
    const daysRemaining = Math.round(
      (ENTERPRISE_PERIOD_END.getTime() - DEMO_TODAY.getTime()) / 86_400_000
    );
    expect(first.amount).toBeCloseTo(
      MEMBER_ROWS.length * prorateSeat(daysRemaining, ENTERPRISE_PERIOD_DAYS),
      2
    );
    expect(first.amount).toBeLessThan(nextInvoiceUsd());
  });

  test("unprovisioned bills nothing and hides seat changes", () => {
    const view = enterpriseBillingView("unprovisioned");
    expect(view.invoices).toEqual([]);
    expect(view.changes).toEqual([]);
    expect(view.showChanges).toBe(false);
    expect(view.grantedOn.getTime()).toBe(DEMO_TODAY.getTime());
  });
});
