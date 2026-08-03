import { describe, expect, it } from "vitest";
import {
  API_KEY_ROWS,
  distributeSeries,
  SPEND_BASE,
  SPEND_TOTALS_7D,
  splitAcrossBuckets,
  TOKENS_TOTALS_7D,
  TOTAL_7D_BASE_DOLLARS,
  TOTAL_7D_BASE_TOKENS,
} from "@/pages/activity-data";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const rowSum = (row: Record<string, number>) => sum(Object.values(row));

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

// The bug this guards: SPEND_BASE's dimensions agreed on the WEEK but not on
// any single day, so switching the chart's dimension selector changed every
// daily bar height while the KPI total held still. `model` is the reference.
describe("SPEND_BASE per-day reconciliation", () => {
  const modelDays = SPEND_BASE.model.map(rowSum);

  it("every dimension matches model's total on every day", () => {
    for (const dimension of ["provider", "apiKey"] as const) {
      SPEND_BASE[dimension].forEach((row, day) => {
        expect(+rowSum(row).toFixed(2), `${dimension} day ${day}`).toBeCloseTo(
          +modelDays[day]!.toFixed(2),
          2
        );
      });
    }
  });

  it("every dimension has the same number of days", () => {
    for (const rows of Object.values(SPEND_BASE)) {
      expect(rows).toHaveLength(modelDays.length);
    }
  });

  it("the Gate keys' API_KEY_ROWS spend equals their charted 7d total", () => {
    for (const [key, charted] of Object.entries(SPEND_TOTALS_7D.apiKey)) {
      const row = API_KEY_ROWS.find((k) => k.key === key);
      expect(row?.spend, `key: ${key}`).toBeCloseTo(charted, 2);
    }
  });
});

// The bug this guards: each series used to get its own distributeSeries seed,
// so the series COUNT changed the summed daily shape. A 3-series provider
// stack and a 6-series model stack drew different curves off identical grand
// totals, and the bars moved when you toggled the dimension.
describe("splitAcrossBuckets", () => {
  const bucketTotals = (buckets: Record<string, number[]>, count: number) =>
    Array.from({ length: count }, (_, i) =>
      sum(Object.values(buckets).map((b) => b[i] ?? 0))
    );

  it("gives the same daily curve regardless of series count", () => {
    for (const [totals, count, scale] of [
      [SPEND_TOTALS_7D, 7, 1],
      [SPEND_TOTALS_7D, 30, 8.5],
      [TOKENS_TOTALS_7D, 12, 0.14],
      [TOKENS_TOTALS_7D, 30, 3.5],
    ] as const) {
      const curves = (["model", "provider", "apiKey"] as const).map((d) =>
        bucketTotals(splitAcrossBuckets(totals[d], count, 77, scale), count)
      );
      for (const curve of curves.slice(1)) {
        curve.forEach((v, i) => {
          expect(v, `count: ${count}, bucket ${i}`).toBeCloseTo(
            curves[0]![i]!,
            6
          );
        });
      }
    }
  });

  it("each series sums exactly to its own scaled total", () => {
    const scale = 8.5;
    const buckets = splitAcrossBuckets(SPEND_TOTALS_7D.model, 30, 77, scale);
    for (const [key, total] of Object.entries(SPEND_TOTALS_7D.model)) {
      expect(sum(buckets[key]!), `series: ${key}`).toBeCloseTo(
        total * scale,
        6
      );
    }
  });

  it("returns zeros rather than NaN when the grand total is zero", () => {
    const buckets = splitAcrossBuckets({ a: 0, b: 0 }, 5, 77);
    for (const series of Object.values(buckets)) {
      expect(series).toHaveLength(5);
      expect(series.every((v) => v === 0)).toBe(true);
    }
  });
});
