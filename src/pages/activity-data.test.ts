import { describe, expect, it } from "vitest";
import { MESSAGE_TOTALS } from "@/data/message-totals";
import { isByokKey, REQUEST_ROWS_ALL } from "@/data/requests";
import { CHART_PALETTE } from "@/lib/chart-palette";
import type { PresetRange } from "@/lib/range";
import {
  API_KEY_ROWS,
  type Dimension,
  distributeSeries,
  keyUsageAt,
  OTHERS_COLOR,
  OTHERS_KEY,
  rankChartSeries,
  rankSeries,
  SERIES_CAP,
  SERIES_POOL,
  SPEND_BASE,
  SPEND_TOTALS_7D,
  spendTotalsAt,
  splitAcrossBuckets,
  TOKENS_TOTALS_7D,
  TOTAL_7D_BASE_DOLLARS,
  TOTAL_7D_BASE_TOKENS,
  tokensTotalsAt,
  usageAt,
} from "@/pages/activity-data";
import { HERO_VIEWS } from "@/pages/requests/hero-data";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const rowSum = (row: Record<string, number>) => sum(Object.values(row));

/** Tokens on Gate keys: what the provider dimension can chart. BYOK tokens
 *  have no Gate route, so they sit out of it (and nothing else). */
const GATE_TOKENS_7D = sum(
  API_KEY_ROWS.filter((k) => k.path === "Gate").map(
    (k) => k.tokensIn + k.tokensOut
  )
);
/** What each dimension of TOKENS_TOTALS_7D sums to. */
const tokenWorkspace = (dimension: Dimension) =>
  dimension === "provider" ? GATE_TOKENS_7D : TOTAL_7D_BASE_TOKENS;

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

  it("TOKENS_TOTALS_7D sums to TOTAL_7D_BASE_TOKENS by model and key, Gate tokens by route", () => {
    for (const [dimension, totals] of Object.entries(TOKENS_TOTALS_7D)) {
      const want = tokenWorkspace(dimension as Dimension);
      const drift = Math.abs(rowSum(totals) - want) / want;
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
    // Tokens compare model with apiKey only: the provider dimension covers
    // Gate-routed tokens, a different (smaller) total.
    for (const [totals, count, scale, dims] of [
      [SPEND_TOTALS_7D, 7, 1, ["model", "provider", "apiKey"]],
      [SPEND_TOTALS_7D, 30, 8.5, ["model", "provider", "apiKey"]],
      [TOKENS_TOTALS_7D, 12, 0.14, ["model", "apiKey"]],
      [TOKENS_TOTALS_7D, 30, 3.5, ["model", "apiKey"]],
    ] as const) {
      const curves = dims.map((d) =>
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

  it("names the top 5 models by tokens, the BYOK session's Opus 4.8 first", () => {
    // Tokens follow the real rows: design-agent's BYOK session (Opus 4.8,
    // ~190k tokens in per message) is almost all of the week's tokens.
    expect(keysOf("model", TOKENS_TOTALS_7D.model)).toEqual([
      "anthropic/claude-opus-4-8",
      "anthropic/claude-opus-4-7",
      "google/gemini-3-1-pro-preview",
      "anthropic/claude-sonnet-5",
      "qwen/qwen3-next-80b-a3b-instruct",
      OTHERS_KEY,
    ]);
  });

  it("re-ranks the same models when the metric changes", () => {
    // Opus is 5.6% of tokens and leads spend, so no single ordering can be
    // right for both lenses. Qwen makes the opposite trip: 2nd by volume,
    // rolled into Others by money.
    //
    // DeepSeek takes the 5th slot on spend over Qwen on a settled tie (both
    // display $0.07), which pool order decides.
    expect(keysOf("model", SPEND_TOTALS_7D.model)).toEqual([
      "anthropic/claude-opus-4-7",
      "google/gemini-3-1-pro-preview",
      "anthropic/claude-sonnet-5",
      "anthropic/claude-haiku-4-5",
      "deepseek/deepseek-v4-pro",
      OTHERS_KEY,
    ]);
    expect(keysOf("model", SPEND_TOTALS_7D.model)).not.toEqual(
      keysOf("model", TOKENS_TOTALS_7D.model)
    );
  });

  it("leaves dimensions under the cap with no Others bucket at all", () => {
    // 3 routes; everything passes through, and a 3-band stack must not grow a
    // 4th neutral band that stands for nothing. The spend lens on keys draws
    // the 4 metered keys with messages (ci-runner has no request rows, so no
    // messages and $0; BYOK keys bill $0). The token lens on keys charts every
    // key with traffic, BYOK included, so it overflows into Others.
    for (const [totals, dimension, drawn] of [
      [TOKENS_TOTALS_7D.provider, "provider", 3],
      [SPEND_TOTALS_7D.provider, "provider", 3],
      [SPEND_TOTALS_7D.apiKey, "apiKey", 4],
    ] as const) {
      const keys = keysOf(dimension, totals);
      expect(keys, dimension).not.toContain(OTHERS_KEY);
      expect(keys.length, dimension).toBe(drawn);
      expect(keys.length, dimension).toBeLessThanOrEqual(
        SERIES_POOL[dimension].length
      );
      expect(keys.length, dimension).toBeLessThanOrEqual(SERIES_CAP);
    }
    // Both key lenses re-rank on the metric: design-agent leads on volume
    // (BYOK, $0), prod-agent on money.
    expect(keysOf("apiKey", TOKENS_TOTALS_7D.apiKey)[0]).toBe("design-agent");
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
        [TOKENS_TOTALS_7D[dimension], tokenWorkspace(dimension)],
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
    // Model and apiKey share the workspace token total; provider charts the
    // Gate-routed part, so it is not on the same curve.
    const curves = (["model", "apiKey"] as const).map((dimension) => {
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
      "anthropic/claude-haiku-4-5",
      "deepseek/deepseek-v4-pro",
      "moonshotai/kimi-k2-thinking",
    ]);
    expect(folded[OTHERS_KEY]).toBeCloseTo(sum(dropped.map(([, v]) => v)), 6);
    // Every folded model is smaller than every named band, which is the
    // property the old fixed bucket violated: it held 92% one model and
    // ranked 3rd.
    const smallestNamed = Math.min(
      ...series
        .filter((x) => x.key !== OTHERS_KEY)
        .map((s) => folded[s.key] ?? 0)
    );
    for (const [key, value] of dropped) {
      expect(value, key).toBeLessThan(smallestNamed);
    }
  });

  it("passes rows through untouched when nothing overflows", () => {
    const rows = [{ date: "d0", openrouter: 1, vertex: 2, alibaba: 3 }];
    const ranked = rankChartSeries("provider", SPEND_TOTALS_7D.provider, rows);
    expect(ranked.rows).toBe(rows);
    expect(ranked.series.map((s) => s.key)).not.toContain(OTHERS_KEY);
  });
});

// One message count per range, and spend that follows it. The bug this guards:
// Activity scaled its own 63,793-a-week figure and printed 112x to 213x the
// messages the Messages page lists, and its key table summed to ~872k because
// BYOK keys kept authored counts while Gate keys were rescaled.
describe("Activity reconciles with the Messages page", () => {
  const PRESETS: PresetRange[] = ["all", "24h", "7d", "30d"];
  const round2 = (n: number) => Math.round(n * 100) / 100;

  /** Each key's real-row average cost per message, computed here from the
   *  rows themselves ("—" = unmetered) rather than through activity-data. */
  const rowAverage = (key: string): number => {
    if (isByokKey(key)) {
      return 0;
    }
    const costs = REQUEST_ROWS_ALL.filter(
      (r) => r.keyId === key && r.cost !== "—"
    ).map((r) => Number.parseFloat(r.cost.replace(/[^0-9.]/g, "")));
    return costs.length > 0 ? sum(costs) / costs.length : 0;
  };

  for (const range of PRESETS) {
    it(`${range}: Total messages KPI === Messages hero === key table column`, () => {
      const kpi = usageAt(range, null, null).messages;
      const at = keyUsageAt(range, null);
      const column = sum(API_KEY_ROWS.map((k) => at.messages[k.key] ?? 0));
      expect(kpi).toBe(MESSAGE_TOTALS[range]);
      expect(kpi).toBe(HERO_VIEWS[range].total);
      expect(column).toBe(kpi);
    });

    it(`${range}: Total spend KPI === key table Spend column === every breakdown`, () => {
      const kpi = usageAt(range, null, null).spend;
      const at = keyUsageAt(range, null);
      const column = round2(sum(API_KEY_ROWS.map((k) => at.spend[k.key] ?? 0)));
      expect(column).toBeCloseTo(kpi, 2);
      const breakdown = spendTotalsAt(range, null, null);
      for (const dimension of ["model", "provider", "apiKey"] as const) {
        expect(
          round2(rowSum(breakdown[dimension])),
          `${range} ${dimension}`
        ).toBeCloseTo(kpi, 2);
      }
    });

    it(`${range}: Tokens used KPI === key table tokens === by-model and by-key breakdowns`, () => {
      const kpi = usageAt(range, null, null);
      const at = keyUsageAt(range, null);
      const column = sum(
        API_KEY_ROWS.map(
          (k) => (at.tokensIn[k.key] ?? 0) + (at.tokensOut[k.key] ?? 0)
        )
      );
      expect(column).toBe(kpi.tokens);
      const breakdown = tokensTotalsAt(range, null, null);
      expect(rowSum(breakdown.model), `${range} model`).toBe(kpi.tokens);
      expect(rowSum(breakdown.apiKey), `${range} apiKey`).toBe(kpi.tokens);
      // Routes chart Gate traffic only: the Gate keys' tokens.
      const gate = sum(
        API_KEY_ROWS.filter((k) => k.path === "Gate").map(
          (k) => (at.tokensIn[k.key] ?? 0) + (at.tokensOut[k.key] ?? 0)
        )
      );
      expect(rowSum(breakdown.provider), `${range} provider`).toBe(gate);
    });

    it(`${range}: each key's tokens ÷ messages are its real rows' averages`, () => {
      const at = keyUsageAt(range, null);
      for (const k of API_KEY_ROWS) {
        const rows = REQUEST_ROWS_ALL.filter((r) => r.keyId === k.key);
        const avg = (side: "inTokens" | "outTokens") =>
          rows.length > 0
            ? sum(
                rows.map(
                  (r) =>
                    Number.parseInt(r[side].replace(/[^0-9]/g, ""), 10) || 0
                )
              ) / rows.length
            : 0;
        const messages = at.messages[k.key] ?? 0;
        // Whole tokens: messages × average, rounded once.
        expect(
          Math.abs((at.tokensIn[k.key] ?? 0) - messages * avg("inTokens")),
          `${range} ${k.key} in`
        ).toBeLessThanOrEqual(0.5);
        expect(
          Math.abs((at.tokensOut[k.key] ?? 0) - messages * avg("outTokens")),
          `${range} ${k.key} out`
        ).toBeLessThanOrEqual(0.5);
      }
    });

    it(`${range}: each key's spend ÷ messages is its real rows' average`, () => {
      const at = keyUsageAt(range, null);
      for (const k of API_KEY_ROWS) {
        const messages = at.messages[k.key] ?? 0;
        const spend = at.spend[k.key] ?? 0;
        // To the cent: spend is messages × average, rounded once.
        expect(spend, `${range} ${k.key}`).toBeCloseTo(
          messages * rowAverage(k.key),
          2
        );
        if (k.path === "BYOK") {
          expect(spend, `${range} ${k.key}`).toBe(0);
        }
      }
    });
  }

  it("splits messages by the keys' real row counts; a key with no rows sends 0", () => {
    const at = keyUsageAt("all", null);
    for (const k of API_KEY_ROWS) {
      const rows = REQUEST_ROWS_ALL.filter((r) => r.keyId === k.key).length;
      const share = (rows / REQUEST_ROWS_ALL.length) * MESSAGE_TOTALS.all;
      // Every key rounds its share; the largest (design-agent) absorbs the
      // few messages of rounding so the column still sums to the total.
      expect(Math.abs((at.messages[k.key] ?? 0) - share), k.key).toBeLessThan(
        k.key === "design-agent" ? 5 : 1
      );
    }
    expect(REQUEST_ROWS_ALL.some((r) => r.keyId === "ci-runner")).toBe(false);
    expect(at.messages["ci-runner"] ?? 0).toBe(0);
  });

  it("a scoped reader's KPI is the sum of their own keys' rows", () => {
    const own = new Set(["openclaw", "nova-chat", "atlas-eval"]);
    for (const range of PRESETS) {
      const at = keyUsageAt(range, null);
      const scoped = usageAt(range, null, own);
      expect(scoped.messages).toBe(
        sum([...own].map((k) => at.messages[k] ?? 0))
      );
      expect(scoped.spend).toBeCloseTo(
        sum([...own].map((k) => at.spend[k] ?? 0)),
        2
      );
    }
  });
});
