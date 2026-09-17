import { describe, expect, test } from "vitest";
import {
  ENTERPRISE_BILLING_STATES,
  ENTERPRISE_CURRENT_PERIOD,
  ENTERPRISE_GRANTED_ON,
  ENTERPRISE_PERIOD_DAYS,
  ENTERPRISE_PERIOD_END,
  ENTERPRISE_PERIOD_START,
  ENTERPRISE_SEAT_RATE_USD,
  enterpriseBillingView,
  enterprisePeriods,
  enterprisePlanSeats,
  enterpriseSeatCount,
  nextInvoiceUsd,
  parseEnterpriseBillingState,
} from "@/data/billing-enterprise";
import { CREDIT_BALANCE_USD, HISTORY_ROWS } from "@/data/billing-history";
import { MEMBER_ROWS } from "@/data/team-members";
import { DEMO_TODAY } from "@/lib/demo-clock";

// Ticket acceptance: "shows seat count and the seat-based charge". Seats are
// a plan quantity, read as utilization (PM + user, call 2026-09-17): no
// proration, no per-member costing. A period is a calendar month.
describe("Enterprise billing seed", () => {
  test("periods are calendar months ending on the current one", () => {
    const periods = enterprisePeriods();
    expect(periods).toHaveLength(2);
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

  test("seats: every member uses one, the plan is fully used, the charge is plan seats at the rate", () => {
    expect(enterpriseSeatCount()).toBe(MEMBER_ROWS.length);
    expect(enterprisePlanSeats()).toBe(enterpriseSeatCount());
    expect(nextInvoiceUsd()).toBe(
      enterprisePlanSeats() * ENTERPRISE_SEAT_RATE_USD
    );
  });

  test("state parsing defaults to active", () => {
    expect(parseEnterpriseBillingState(null)).toBe("active");
    expect(parseEnterpriseBillingState("nonsense")).toBe("active");
    expect(parseEnterpriseBillingState("past-due")).toBe("past-due");
  });
});

describe("Enterprise billing view per state", () => {
  test("active: long-standing org, nothing failed", () => {
    const active = enterpriseBillingView("active");
    expect(active.grantedOn.getTime()).toBe(ENTERPRISE_GRANTED_ON.getTime());
    expect(active.period).toEqual(ENTERPRISE_CURRENT_PERIOD);
    expect(active.failedCharge).toBeNull();
    expect(active.creditBalance).toBe(HISTORY_ROWS[0].balanceAfter);
    expect(active.creditBalance).toBe(CREDIT_BALANCE_USD);
  });

  test("past-due: this month's seat charge failed on the 1st", () => {
    const view = enterpriseBillingView("past-due");
    expect(view.failedCharge?.amount).toBe(nextInvoiceUsd());
    expect(view.failedCharge?.date.getTime()).toBe(
      ENTERPRISE_CURRENT_PERIOD.start.getTime()
    );
  });

  test("granted and unprovisioned are day one: today to month end, nothing failed", () => {
    for (const state of ["granted", "unprovisioned"] as const) {
      const view = enterpriseBillingView(state);
      expect(view.grantedOn.getTime()).toBe(DEMO_TODAY.getTime());
      expect(view.period.start.getTime()).toBe(DEMO_TODAY.getTime());
      expect(view.period.end.getTime()).toBe(ENTERPRISE_PERIOD_END.getTime());
      expect(view.failedCharge).toBeNull();
    }
  });

  // One org in every state, on Pro before it was granted Enterprise (user
  // narrative 2026-09-17): credits are plan-independent, so the balance,
  // the last top-up, the card on file and the ledger never change with state.
  test("every state carries the same credit story", () => {
    for (const state of ENTERPRISE_BILLING_STATES) {
      const view = enterpriseBillingView(state);
      expect(view.creditBalance).toBe(CREDIT_BALANCE_USD);
      expect(view.lastTopUp).not.toBeNull();
      expect(view.hasCard).toBe(true);
      expect(view.ledgerRows).toEqual(HISTORY_ROWS);
    }
  });
});
