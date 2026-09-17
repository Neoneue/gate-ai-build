import { describe, expect, test } from "vitest";
import { BILLING_PERIOD_END_DATE, HISTORY_ROWS } from "@/data/billing-history";
import {
  freeInvoiceRows,
  PRO_SEAT_RATE_USD,
  proInvoiceRows,
  proPeriods,
} from "@/data/billing-pro";
import { MEMBER_ROWS } from "@/data/team-members";

// Pro is per seat on the billing anniversary (H1 "Subscription": charged on
// the billing anniversary; H2 §3: seat purchases). Free has no subscription,
// so its billing history is the PAYG receipts only (H1: PAYG is
// plan-independent). Both read the same engine as Enterprise.
describe("Pro and Free billing history", () => {
  test("Pro periods end on the renewal date and step back a month", () => {
    const periods = proPeriods();
    expect(periods).toHaveLength(2);
    expect(periods.at(-1)?.end.getTime()).toBe(
      BILLING_PERIOD_END_DATE.getTime()
    );
    for (const p of periods) {
      expect(p.start.getDate()).toBe(BILLING_PERIOD_END_DATE.getDate());
      expect(p.end.getDate()).toBe(BILLING_PERIOD_END_DATE.getDate());
    }
  });

  test("Pro history = anniversary seat charges + prorations + receipts", () => {
    const rows = proInvoiceRows();
    const receipts = HISTORY_ROWS.filter((r) => r.type === "Credits added");
    const monthly = rows.filter((r) => r.description === "Monthly seat charge");
    const prorated = rows.filter((r) =>
      r.description.startsWith("1 seat added")
    );
    expect(monthly).toHaveLength(2);
    expect(rows.filter((r) => r.seats === null)).toHaveLength(receipts.length);
    expect(rows).toHaveLength(
      monthly.length + prorated.length + receipts.length
    );
    for (const m of monthly) {
      expect(m.amount).toBe((m.seats ?? 0) * PRO_SEAT_RATE_USD);
    }
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].date.getTime()).toBeGreaterThanOrEqual(
        rows[i].date.getTime()
      );
    }
    // The current anniversary charge bills everyone present that day, which
    // is the roster minus this period's addition plus this period's leavers.
    expect(monthly[0].seats).toBe(MEMBER_ROWS.length - 1 + 2);
  });

  test("Free history is receipts only", () => {
    const rows = freeInvoiceRows();
    const receipts = HISTORY_ROWS.filter((r) => r.type === "Credits added");
    expect(rows).toHaveLength(receipts.length);
    expect(rows.every((r) => r.seats === null && r.status === "Paid")).toBe(
      true
    );
  });
});
