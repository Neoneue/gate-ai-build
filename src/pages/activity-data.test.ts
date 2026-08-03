import { describe, expect, it } from "vitest";
import { CHART_PALETTE } from "@/lib/chart-palette";
import {
  API_KEY_ROWS,
  type Dimension,
  distributeSeries,
  OTHERS_COLOR,
  OTHERS_KEY,
  rankChartSeries,
  rankSeries,
  SERIES_CAP,
  SERIES_POOL,
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

// The bug this guards: the model dimension shipped a FIXED five named series
// plus a fixed `others`, so the legend was blind to both the workload and the
// metric. It named DeepSeek (8.72M tokens) and Opus (4.08M) while burying
// Haiku (12.52M) in the bucket — `others` came out ~92% one model and ranked
// 3rd, directly above a Top Models card that listed Haiku 3rd on its own. The
// rule is production's: rank DESC by the ACTIVE metric, drop zeros, cap at 6,
// and only synthesise an Others bucket when that cap actually overflows.
describe("rankSeries", () => {
  const keysOf = (dimension: Dimension, totals: Record<string, number>) =>
    rankSeries(dimension, totals).series.map((s) => s.key);

  it("names the top 5 models by tokens, Haiku among them", () => {
    expect(keysOf("model", TOKENS_TOTALS_7D.model)).toEqual([
      "anthropic/claude-sonnet-5",
      "qwen/qwen3-next-80b-a3b-instruct",
      "anthropic/claude-haiku-4-5",
      "google/gemini-3-1-pro-preview",
      "deepseek/deepseek-v4-pro",
      OTHERS_KEY,
    ]);
  });

  it("re-ranks the same models when the metric changes", () => {
    // Opus is 5.6% of tokens and 24.7% of spend, so no single ordering can be
    // right for both lenses. Qwen makes the opposite trip: 2nd by volume,
    // rolled into Others by money.
    //
    // DeepSeek takes the 5th slot on spend over Qwen on a settled tie — both
    // display $5.95, from $5.9483 and $5.9457 — which pool order preserves.
    expect(keysOf("model", SPEND_TOTALS_7D.model)).toEqual([
      "anthropic/claude-sonnet-5",
      "google/gemini-3-1-pro-preview",
      "anthropic/claude-opus-4-7",
      "anthropic/claude-haiku-4-5",
      "deepseek/deepseek-v4-pro",
      OTHERS_KEY,
    ]);
    expect(keysOf("model", SPEND_TOTALS_7D.model)).not.toEqual(
      keysOf("model", TOKENS_TOTALS_7D.model)
    );
  });

  it("leaves dimensions under the cap with no Others bucket at all", () => {
    // 3 routes and 5 Gate keys. Everything passes through; a 3-band stack must
    // not grow a 4th neutral band that stands for nothing.
    for (const [totals, dimension] of [
      [TOKENS_TOTALS_7D.provider, "provider"],
      [SPEND_TOTALS_7D.provider, "provider"],
      [TOKENS_TOTALS_7D.apiKey, "apiKey"],
      [SPEND_TOTALS_7D.apiKey, "apiKey"],
    ] as const) {
      const keys = keysOf(dimension, totals);
      expect(keys, dimension).not.toContain(OTHERS_KEY);
      expect(keys.length, dimension).toBe(SERIES_POOL[dimension].length);
      expect(keys.length, dimension).toBeLessThanOrEqual(SERIES_CAP);
    }
    // Both key dimensions still re-rank on the metric even without a rollup:
    // prod-web leads on volume, prod-agent on money (it takes most of the Opus).
    expect(keysOf("apiKey", TOKENS_TOTALS_7D.apiKey)[0]).toBe("prod-web");
    expect(keysOf("apiKey", SPEND_TOTALS_7D.apiKey)[0]).toBe("prod-agent");
  });

  it("never renders more than SERIES_CAP bands", () => {
    for (const dimension of ["model", "provider", "apiKey"] as const) {
      for (const totals of [TOKENS_TOTALS_7D, SPEND_TOTALS_7D]) {
        expect(keysOf(dimension, totals[dimension]).length).toBeLessThanOrEqual(
          SERIES_CAP
        );
      }
    }
  });

  it("drops series with no usage instead of charting a zero band", () => {
    const totals = { ...TOKENS_TOTALS_7D.apiKey, "ci-runner": 0 };
    expect(keysOf("apiKey", totals)).not.toContain("ci-runner");
    // Non-finite values are dropped the same way — a NaN band renders as a
    // gap in the stack, not as an error.
    expect(
      keysOf("apiKey", { ...TOKENS_TOTALS_7D.apiKey, "ci-runner": Number.NaN })
    ).not.toContain("ci-runner");
  });

  it("colors by rank, not by identity, and keeps Others out of the palette", () => {
    const { series } = rankSeries("model", TOKENS_TOTALS_7D.model);
    const named = series.filter((s) => s.key !== OTHERS_KEY);
    expect(named.map((s) => s.slot)).toEqual([1, 2, 3, 4, 5]);
    expect(named.every((s) => s.color === undefined)).toBe(true);
    expect(named.length).toBeLessThanOrEqual(CHART_PALETTE.length);

    const others = series.at(-1);
    expect(others?.key).toBe(OTHERS_KEY);
    expect(others?.slot).toBe(0);
    expect(others?.color).toBe(OTHERS_COLOR);
  });
});

// Others carries the whole remainder or the legend's percentages lie. This is
// the same reconciliation contract SPEND_BASE has, applied to the fold.
describe("rankChartSeries", () => {
  const dimensions = ["model", "provider", "apiKey"] as const;

  it("keeps the legend summing to the workspace total", () => {
    for (const dimension of dimensions) {
      for (const [totals, workspace] of [
        [TOKENS_TOTALS_7D[dimension], TOTAL_7D_BASE_TOKENS],
        [SPEND_TOTALS_7D[dimension], TOTAL_7D_BASE_DOLLARS],
      ] as const) {
        const ranked = rankChartSeries(dimension, totals, []);
        // Every ranked key has a total, and nothing else does.
        expect(Object.keys(ranked.totals).sort()).toEqual(
          ranked.series.map((s) => s.key).sort()
        );
        expect(
          sum(Object.values(ranked.totals)),
          `${dimension} legend total`
        ).toBeCloseTo(workspace, 2);
      }
    }
  });

  it("folds the overflow into Others without moving a bucket total", () => {
    // The cross-dimension invariant has to survive the fold: the rows the
    // chart stacks must still sum to the same per-bucket curve they did
    // before Others existed, in every dimension.
    const count = 30;
    const curves = dimensions.map((dimension) => {
      const totals = TOKENS_TOTALS_7D[dimension];
      const buckets = splitAcrossBuckets(totals, count, 77, 8.5);
      const rows = Array.from({ length: count }, (_, i) => {
        const row: Record<string, number | string> = { date: `d${i}` };
        for (const [key, series] of Object.entries(buckets)) {
          row[key] = series[i] ?? 0;
        }
        return row;
      });
      const ranked = rankChartSeries(dimension, totals, rows);
      // Sum ONLY the bands the chart draws — the folded keys are still on the
      // row and must not be double-counted.
      return ranked.rows.map((row) =>
        sum(ranked.series.map((s) => Number(row[s.key]) || 0))
      );
    });
    for (const curve of curves.slice(1)) {
      curve.forEach((v, i) => {
        expect(v, `bucket ${i}`).toBeCloseTo(curves[0]![i]!, 6);
      });
    }
  });

  it("gives Others exactly the sum of what it replaced", () => {
    const totals = TOKENS_TOTALS_7D.model;
    const { series, totals: folded } = rankChartSeries("model", totals, []);
    const named = new Set(series.map((s) => s.key));
    const dropped = Object.entries(totals).filter(([k]) => !named.has(k));
    expect(dropped.map(([k]) => k).sort()).toEqual([
      "anthropic/claude-opus-4-7",
      "moonshotai/kimi-k2-thinking",
    ]);
    expect(folded[OTHERS_KEY]).toBeCloseTo(sum(dropped.map(([, v]) => v)), 6);
    // And it must be smaller than every band above it, which is the property
    // the old fixed bucket violated: it held 92% one model and ranked 3rd.
    for (const s of series.filter((x) => x.key !== OTHERS_KEY)) {
      expect(folded[s.key], s.key).toBeGreaterThan(folded[OTHERS_KEY] ?? 0);
    }
  });

  it("passes rows through untouched when nothing overflows", () => {
    const rows = [{ date: "d0", openrouter: 1, vertex: 2, alibaba: 3 }];
    const ranked = rankChartSeries("provider", SPEND_TOTALS_7D.provider, rows);
    expect(ranked.rows).toBe(rows);
    expect(ranked.series.map((s) => s.key)).not.toContain(OTHERS_KEY);
  });
});
