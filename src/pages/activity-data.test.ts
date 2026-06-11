import { describe, expect, it } from "vitest";
import {
  distributeSeries,
  SPEND_TOTALS_7D,
  TOKENS_TOTALS_7D,
  TOTAL_7D_BASE_DOLLARS,
  TOTAL_7D_BASE_TOKENS,
} from "@/pages/activity-data";

// The charts-must-reconcile contract: every per-dimension breakdown derives
// from (and must sum back to) the single TOTAL_7D_BASE_* source of truth.
describe("activity KPI reconciliation", () => {
  it("SPEND_TOTALS_7D sums to TOTAL_7D_BASE_DOLLARS in every dimension", () => {
    for (const [dimension, totals] of Object.entries(SPEND_TOTALS_7D)) {
      const sum = Object.values(totals).reduce((a, b) => a + b, 0);
      expect(sum, `dimension: ${dimension}`).toBeCloseTo(
        TOTAL_7D_BASE_DOLLARS,
        0
      );
    }
  });

  it("TOKENS_TOTALS_7D sums to TOTAL_7D_BASE_TOKENS in every dimension", () => {
    for (const [dimension, totals] of Object.entries(TOKENS_TOTALS_7D)) {
      const sum = Object.values(totals).reduce((a, b) => a + b, 0);
      const drift = Math.abs(sum - TOTAL_7D_BASE_TOKENS) / TOTAL_7D_BASE_TOKENS;
      expect(drift, `dimension: ${dimension}`).toBeLessThan(0.001);
    }
  });
});

describe("distributeSeries", () => {
  it("buckets sum exactly to the requested total", () => {
    for (const [total, count, seed] of [
      [238, 47, 1],
      [63_793, 99, 7],
      [1000, 1, 3],
    ] as const) {
      const buckets = distributeSeries(total, count, seed);
      expect(buckets).toHaveLength(count);
      const sum = buckets.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(total, 6);
    }
  });

  it("is deterministic for the same seed", () => {
    expect(distributeSeries(500, 20, 42)).toEqual(
      distributeSeries(500, 20, 42)
    );
  });
});
