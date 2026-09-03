import type { Vendor } from "@/components/icons/vendor-meta";
import { PROVIDER_META } from "@/components/icons/vendor-meta";
import { costOf, modelById, modelName, type ProviderId } from "@/data/models";
import { REQUEST_ROWS_ALL } from "@/data/requests";
import { CHART_PALETTE } from "@/lib/chart-palette";
import {
  type CustomRange,
  daysInRange,
  type PresetRange,
  type Range,
} from "@/lib/range";

export type Dimension = "model" | "provider" | "apiKey";

// Canonical 7d totals — single source of truth for each KPI. Every range's
// value AND sparkline shape are computed from these × effectiveScale, so
// the KPIs reconcile with the underlying data and the spark shapes reflect
// real per-bucket variation rather than hand-drawn arrays.
//
// Requests is the only one still authored: a request count is not a function
// of price. TOTAL_7D_BASE_DOLLARS and TOTAL_7D_BASE_TOKENS are DERIVED from
// the workload model further down and are exported from there.
export const TOTAL_7D_BASE_REQUESTS = 63_793;

// Reconciles with TokenSavings.tsx's "7d" window Total-saved rate (caching
// 0.18% + compression 14.0% ≈ 14.2%, both real product mechanisms, not a
// flat estimate). Overview's Tokens Saved tile derives its dollar figure
// from this rate × TOTAL_7D_BASE_DOLLARS so the two pages can't diverge.
// Activity's Savings surfaces intentionally do NOT use this — they run on
// the higher ACTIVITY_SAVINGS_* model below (product goal 20-25%), decoupled
// per the 2026-07-14 call; TokenSavings + Overview stay at 14.2% for now.
export const TOKEN_SAVINGS_RATE_7D = 0.142;

// Activity savings model — the maturation story the trend chart's Savings
// lens and the table's Saved column tell. Caching + compression matures
// from a ~10% cold start toward a ~25% plateau; steady-state (recent) sits
// near 24%. Per-range bounds drive a concave √ ramp (see savingsCurve): the
// window MEAN = floor + (ceiling - floor) × 2/3, which savingsRateFor returns
// so the Saved column and the chart reconcile.
const SAVINGS_CURVE_BOUNDS: Record<
  PresetRange,
  { floor: number; ceiling: number }
> = {
  "24h": { floor: 24, ceiling: 25 }, // recent, plateaued — mean 24.7%
  "7d": { floor: 23, ceiling: 25 }, // mean 24.3%
  "30d": { floor: 22, ceiling: 25 }, // last month, mostly matured — mean 24.0%
  all: { floor: 10, ceiling: 25 }, // full lifetime climb 10 → 25 — mean 20.0%
};

/** 7d reference rate for Activity's Saved column — the token-weighted mean of
 *  API_KEY_ROWS.savings, and the divisor the per-range scaling hangs off. */
export const ACTIVITY_SAVINGS_RATE_7D = 0.243;

const curveBounds = (
  range: Range,
  customRange: CustomRange | null
): { floor: number; ceiling: number } => {
  if (range === "custom" && customRange) {
    const days = daysInRange(customRange);
    if (days <= 1) {
      return SAVINGS_CURVE_BOUNDS["24h"];
    }
    if (days <= 7) {
      return SAVINGS_CURVE_BOUNDS["7d"];
    }
    if (days <= 30) {
      return SAVINGS_CURVE_BOUNDS["30d"];
    }
    return SAVINGS_CURVE_BOUNDS.all;
  }
  return SAVINGS_CURVE_BOUNDS[range === "custom" ? "7d" : range];
};

/** Workspace savings RATE (fraction) for the active range — the mean of the
 *  maturation curve for that window. Custom ranges resolve by day span. */
export function savingsRateFor(
  range: Range,
  customRange: CustomRange | null
): number {
  const { floor, ceiling } = curveBounds(range, customRange);
  return (floor + ((ceiling - floor) * 2) / 3) / 100;
}

/** Per-bucket saved % across the active range — a concave √ ramp from the
 *  window's floor to its ceiling (caching/compression maturing over time),
 *  with seeded jitter for organic variation, clamped under the 30% cap. The
 *  bucket mean equals savingsRateFor(range) × 100 by construction, so the
 *  chart's average reconciles with the Saved column. */
export function savingsCurve(
  range: Range,
  customRange: CustomRange | null,
  count: number,
  seed: number
): number[] {
  const { floor, ceiling } = curveBounds(range, customRange);
  let s = (seed * 2_654_435_769) >>> 0 || 1;
  const rand = () => {
    s = (s * 1_664_525 + 1_013_904_223) >>> 0;
    return s / 0xff_ff_ff_ff;
  };
  const span = ceiling - floor;
  return Array.from({ length: count }, (_, i) => {
    const t = count <= 1 ? 1 : i / (count - 1);
    const base = floor + span * Math.sqrt(t);
    // Jitter scales with the window span so flat recent windows stay tight
    // and the long "all" ramp reads organic. Never exceed the 30% cap.
    const jitter = (rand() - 0.5) * Math.min(span * 0.18, 2.2);
    return +Math.min(29.5, Math.max(0, base + jitter)).toFixed(2);
  });
}

/** Base (7d) chart data. Other ranges derive from this by scaling values and
 * relabeling the x-axis. Mock-realistic, not aggregated.
 *
 * INVARIANT (charts-must-reconcile): `model` is the reference dimension.
 * Every other dimension must sum to the SAME value as `model` on EVERY day,
 * not merely across the week — otherwise toggling the dimension selector
 * silently rewrites the daily bar heights while the KPI total holds still.
 * All three dimensions satisfy this exactly as of 2026-08-03: each day's
 * `provider` and `apiKey` values sum to that day's `model` total, and all
 * three weeks total $238.05.
 * If you change any row, verify the per-day sums still match `model`. */
/* ─── The 7d Gate-metered workload ────────────────────────────────────────
 *
 * Everything below this comment that is measured in dollars is DERIVED from
 * this block. Nothing here is money; it is tokens, plus the two routing splits
 * that say who ran them and where. `costOf` (data/models.ts) turns that into
 * spend at catalog rates.
 *
 * Why it works this way. Until 2026-08-03 this file authored ~110 dollar
 * values by hand — a 3 × 7 × N matrix of daily spend — and authored the token
 * splits separately. Both were internally consistent and neither agreed with
 * the price list: the Top Models card billed Qwen3 Next at 13× list and Gemini
 * 3.1 Pro at 0.47×, so a reader who divided the Spend column by the Tokens
 * column got a rate that appears nowhere in the catalog, on a page one click
 * from the Models table that prints the real one. The old header said, in as
 * many words, "do not try to reconcile spend ÷ tokens here against the
 * catalog's per-1M rates." That instruction is now obsolete: reconciling is
 * the point, and it is enforced by `pricing.test.ts`.
 *
 * The shape is a product form — per-model tokens × provider share × key share
 * — rather than a hand-written 3-way table. That is what makes all three
 * dimensions sum to the same totals on both metrics by construction rather
 * than by tuning, and it is why the cross-dimension invariant the charts rely
 * on is no longer something a future edit can quietly break.
 *
 * BYOK traffic is out of scope by definition: the customer's own provider
 * account is billed, so Gate meters no dollars for it. That is why Claude Opus
 * 4.8 (102 of the 153 request rows, all one BYOK session) does not appear
 * here, and why `design-agent` is not a charted key.
 */

/** One model's 7d Gate-metered volume, split the way the workload actually
 *  splits it. Output share is the expensive half of the bill — Opus at 45%
 *  output pays $14/M against a $5 sticker rate — so it is authored per model
 *  rather than assumed flat. Values carry over from MODEL_ROWS' own in/out
 *  ratios, which is where they were measured. */
type ModelUsage = {
  /** Canonical catalog id. `models-catalog.test.ts` pins it to a real row. */
  id: string;
  tokensIn: number;
  tokensOut: number;
};

/** The 7d workload, authored in groups.
 *
 *  These top-level keys are AUTHORING buckets, not chart series. Until
 *  2026-08-03 they were both, and that was the bug: `others` bundled Haiku 4.5
 *  (12.52M tokens, the workspace's 3rd-heaviest model) with Kimi K2, and the
 *  trend chart rendered the bundle as a named band while the Top Models card
 *  three inches below it listed Haiku 3rd on its own. Two surfaces on one page
 *  disagreed about the same workload.
 *
 *  The chart's series are now DERIVED — one per catalog model, ranked by
 *  whichever metric the reader is looking at (see `rankSeries`). Nothing
 *  selects a series by name any more, so this block can group its authoring
 *  however reads clearest without deciding what the legend says. */
export const MODEL_SERIES_7D: Record<string, ModelUsage[]> = {
  // 27.2% of tokens, 29.6% of spend — the workhorse, and the only series
  // whose two shares are close to each other.
  sonnet: [
    {
      id: "anthropic/claude-sonnet-5",
      tokensIn: 16_367_200,
      tokensOut: 3_592_800,
    },
  ],
  // 11.9% of tokens, 2.4% of spend. DeepSeek V4 Pro lists at $0.48/$0.96
  // after its 1.1 model markup, so a tenth of the traffic costs a fortieth
  // of the money.
  deepseek: [
    {
      id: "deepseek/deepseek-v4-pro",
      tokensIn: 5_668_000,
      tokensOut: 3_052_000,
    },
  ],
  // 16.8% of tokens, 26.2% of spend — the $12/M output rate does that.
  gemini: [
    {
      id: "google/gemini-3-1-pro-preview",
      tokensIn: 8_638_000,
      tokensOut: 3_702_000,
    },
  ],
  // 5.6% of tokens, 24.7% of spend. The single most useful fact this page
  // has, and it only reads as a fact because both numbers now come from the
  // same place.
  opus: [
    {
      id: "anthropic/claude-opus-4-7",
      tokensIn: 2_244_000,
      tokensOut: 1_836_000,
    },
  ],
  // 20.1% of tokens — second only to Sonnet — and 2.4% of spend, dead last.
  // Cheap tokens buy a lot of tokens.
  qwen: [
    {
      id: "qwen/qwen3-next-80b-a3b-instruct",
      tokensIn: 11_505_000,
      tokensOut: 3_245_000,
    },
  ],
  // The long tail as AUTHORED: high-volume short classification on Haiku,
  // plus a thin slice of Kimi reasoning. Both are ranked as their own series —
  // Haiku is 3rd by tokens and 4th by spend, and is named in both lenses.
  others: [
    {
      id: "anthropic/claude-haiku-4-5",
      tokensIn: 7_512_000,
      tokensOut: 5_008_000,
    },
    {
      id: "moonshotai/kimi-k2-thinking",
      tokensIn: 702_000,
      tokensOut: 378_000,
    },
  ],
};

/** How each model's tokens divide across the three gateway routes.
 *
 * Constrained by the catalog, not by taste: Alibaba serves only DeepSeek and
 * Qwen, Vertex serves everything except DeepSeek, and `pricing.test.ts` fails
 * on any pair the catalog does not list. Each model's shares sum to 1.
 *
 * This split is also where OpenRouter's +10% PAYG markup enters the bill —
 * read per (model, provider) off the catalog, never typed here — which is why
 * OpenRouter's share of dollars runs ahead of its share of tokens. */
export const PROVIDER_MIX_7D: Record<
  string,
  Partial<Record<ProviderId, number>>
> = {
  "anthropic/claude-sonnet-5": { openrouter: 0.66, vertex: 0.34 },
  "anthropic/claude-opus-4-7": { openrouter: 0.72, vertex: 0.28 },
  "anthropic/claude-haiku-4-5": { openrouter: 0.76, vertex: 0.24 },
  "moonshotai/kimi-k2-thinking": { openrouter: 0.7, vertex: 0.3 },
  "google/gemini-3-1-pro-preview": { openrouter: 0.5, vertex: 0.5 },
  "deepseek/deepseek-v4-pro": { openrouter: 0.56, alibaba: 0.44 },
  "qwen/qwen3-next-80b-a3b-instruct": {
    openrouter: 0.58,
    vertex: 0.13,
    alibaba: 0.29,
  },
};

/** How each model's tokens divide across the workspace's Gate keys.
 *
 * Read down a column, not across a row: each model's shares sum to 1. The
 * mixes carry the keys' jobs — `prod-web` is user-facing chat and leans
 * Sonnet, `prod-agent` is agentic and takes most of the Opus, `atlas-eval` is
 * an evaluation harness and buys the cheap models by the million. Only Gate
 * keys appear; BYOK keys bill the customer's own provider account. */
export const KEY_MIX_7D: Record<string, Record<string, number>> = {
  "anthropic/claude-sonnet-5": {
    "prod-agent": 0.34,
    "prod-web": 0.56,
    "atlas-eval": 0.03,
    development: 0.05,
    "ci-runner": 0.02,
  },
  "anthropic/claude-opus-4-7": {
    "prod-agent": 0.62,
    "prod-web": 0.28,
    "atlas-eval": 0.04,
    development: 0.05,
    "ci-runner": 0.01,
  },
  "google/gemini-3-1-pro-preview": {
    "prod-agent": 0.44,
    "prod-web": 0.42,
    "atlas-eval": 0.06,
    development: 0.06,
    "ci-runner": 0.02,
  },
  "deepseek/deepseek-v4-pro": {
    "prod-agent": 0.3,
    "prod-web": 0.42,
    "atlas-eval": 0.18,
    development: 0.07,
    "ci-runner": 0.03,
  },
  "qwen/qwen3-next-80b-a3b-instruct": {
    "prod-agent": 0.38,
    "prod-web": 0.38,
    "atlas-eval": 0.14,
    development: 0.07,
    "ci-runner": 0.03,
  },
  "anthropic/claude-haiku-4-5": {
    "prod-agent": 0.42,
    "prod-web": 0.44,
    "atlas-eval": 0.05,
    development: 0.05,
    "ci-runner": 0.04,
  },
  "moonshotai/kimi-k2-thinking": {
    "prod-agent": 0.4,
    "prod-web": 0.36,
    "atlas-eval": 0.14,
    development: 0.07,
    "ci-runner": 0.03,
  },
};

/** Gateway markup for one route, read off the catalog entry rather than
 *  restated here — OpenRouter's 1.1 lives in `data/models.ts` and the badge on
 *  the Models detail page reads the same field. An unlisted pair returns 1 and
 *  is caught by `pricing.test.ts`, which fails on routes the catalog does not
 *  serve. */
function routeMarkup(modelId: string, provider: ProviderId): number {
  return (
    modelById(modelId)?.providers.find((p) => p.id === provider)?.paygMarkup ??
    1
  );
}

/** Every (model, provider, key) atom of the 7d workload, with its tokens and
 *  what it cost. This is the one table; every total on this page is a
 *  `groupBy` over it, which is why the dimensions cannot disagree. */
export type UsageCell = {
  model: string;
  provider: ProviderId;
  apiKey: string;
  tokensIn: number;
  tokensOut: number;
  tokens: number;
  spend: number;
};

export const USAGE_7D: UsageCell[] = Object.values(MODEL_SERIES_7D).flatMap(
  (models) =>
    models.flatMap((m) => {
      const listCost = costOf(m.id, m.tokensIn, m.tokensOut);
      const tokens = m.tokensIn + m.tokensOut;
      return Object.entries(PROVIDER_MIX_7D[m.id] ?? {}).flatMap(
        ([provider, providerShare]) =>
          Object.entries(KEY_MIX_7D[m.id] ?? {}).map(([apiKey, keyShare]) => {
            const share = (providerShare ?? 0) * keyShare;
            return {
              model: m.id,
              provider: provider as ProviderId,
              apiKey,
              tokensIn: m.tokensIn * share,
              tokensOut: m.tokensOut * share,
              tokens: tokens * share,
              spend:
                listCost * share * routeMarkup(m.id, provider as ProviderId),
            };
          })
      );
    })
);

/** Group the workload by a dimension. `metric` picks tokens or dollars; both
 *  come off the same rows, so a series' spend and its tokens are two readings
 *  of one fact rather than two authored numbers that happen to sit together. */
function groupUsage(
  by: (cell: UsageCell) => string,
  metric: (cell: UsageCell) => number
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const cell of USAGE_7D) {
    out[by(cell)] = (out[by(cell)] ?? 0) + metric(cell);
  }
  return out;
}

const cellTokens = (c: UsageCell) => c.tokens;
const cellSpend = (c: UsageCell) => c.spend;
/** What one series IS, per dimension. `model` groups by catalog id — one
 *  series per model, no pre-bundled long tail. The chart's `Others` bucket is
 *  synthesised at render time from whatever ranks below the cap, so it can
 *  never contain a model that outranks a named one. */
const DIMENSION_KEY: Record<Dimension, (cell: UsageCell) => string> = {
  model: (c) => c.model,
  provider: (c) => c.provider,
  apiKey: (c) => c.apiKey,
};

/** The in/out split behind an entity's totals. The tables render both columns,
 *  and output tokens are where the money is (5× the input rate on every
 *  Anthropic model, 6× on Gemini 3.1 Pro), so a row whose in/out split did not
 *  match the split its cost was computed from would be lying twice over. */
export type TokenSplit = { tokensIn: number; tokensOut: number };

function splitBy(by: (cell: UsageCell) => string): Record<string, TokenSplit> {
  const out: Record<string, TokenSplit> = {};
  for (const cell of USAGE_7D) {
    const k = by(cell);
    const acc = out[k] ?? { tokensIn: 0, tokensOut: 0 };
    acc.tokensIn += cell.tokensIn;
    acc.tokensOut += cell.tokensOut;
    out[k] = acc;
  }
  return out;
}

const rounded = (s: TokenSplit): TokenSplit => ({
  tokensIn: Math.round(s.tokensIn),
  tokensOut: Math.round(s.tokensOut),
});

/** 7d in/out tokens per Gate key — what UsageByKey's Tokens In / Tokens Out
 *  columns show, and the exact tokens its Spend column was priced from. */
export const KEY_TOKENS_7D: Record<string, TokenSplit> = Object.fromEntries(
  Object.entries(splitBy((c) => c.apiKey)).map(([k, v]) => [k, rounded(v)])
);

/** 7d in/out tokens per catalog model — the Top Models card's two columns. */
export const MODEL_TOKENS_7D: Record<string, TokenSplit> = Object.fromEntries(
  Object.entries(splitBy((c) => c.model)).map(([k, v]) => [k, rounded(v)])
);

/** 7d spend per catalog model, routing markup included. Not simply
 *  `costOf(model, in, out)`: OpenRouter bills 10% over list, so what a model
 *  actually costs depends on where its traffic was sent. Grouping the same
 *  cells that produced MODEL_TOKENS_7D is what keeps the Spend column and the
 *  token columns beside it describing one transaction. */
export const MODEL_SPEND_7D: Record<string, number> = settle(
  groupUsage((c) => c.model, cellSpend),
  2
);

/** Per-series 7d totals in each unit, grouped out of USAGE_7D.
 *
 * These are the canonical "how much did series X spend / send across the
 * workspace in 7d" numbers; the chart distributes them across N buckets per
 * range via distributeSeries(). Both metrics come off the same rows, so every
 * dimension sums to the same workspace total in both units — the
 * charts-must-reconcile contract, now structural rather than tuned.
 *
 * Money is rounded to the cent and tokens to whole tokens, with the largest
 * series absorbing the remainder so the rounded parts still sum exactly to the
 * rounded whole. */
function settle(
  totals: Record<string, number>,
  decimals: number
): Record<string, number> {
  const scale = 10 ** decimals;
  const round = (n: number) => Math.round(n * scale) / scale;
  const entries = Object.entries(totals);
  const target = round(entries.reduce((a, [, v]) => a + v, 0));
  let biggest = entries[0]?.[0] ?? "";
  for (const [k, v] of entries) {
    if (v > (totals[biggest] ?? 0)) {
      biggest = k;
    }
  }
  const out: Record<string, number> = {};
  let rest = 0;
  for (const [k, v] of entries) {
    if (k !== biggest) {
      out[k] = round(v);
      rest += out[k];
    }
  }
  out[biggest] = round(target - rest);
  return out;
}

const byDimension = (metric: (cell: UsageCell) => number, decimals: number) =>
  Object.fromEntries(
    Object.entries(DIMENSION_KEY).map(([dim, key]) => [
      dim,
      settle(groupUsage(key, metric), decimals),
    ])
  ) as Record<Dimension, Record<string, number>>;

export const SPEND_TOTALS_7D: Record<
  Dimension,
  Record<string, number>
> = byDimension(cellSpend, 2);

/** Per-series 7d *token* totals per dimension. Mirrors SPEND_TOTALS_7D and
 * shares its source rows, which is the whole point: the token distribution
 * genuinely differs in shape from the spend distribution, and now it differs
 * for the reason the page claims rather than because two arrays were authored
 * independently.
 *
 * • model → Sonnet leads on volume (27%) and on spend (30%); Qwen3 Next is
 *   second on volume (20%) and last on spend (2%); Opus 4.7 is 6% of tokens
 *   and 25% of spend. Divide any pair and you get that model's blended rate
 *   at its own output share, which is what `blendedRate` returns.
 * • provider → cheap tokens buy more of them, so Alibaba (DeepSeek + Qwen
 *   only, per the catalog) carries 11% of tokens against under 2% of dollars.
 *   OpenRouter runs the other way: its +10% PAYG markup lifts its dollar
 *   share above its token share.
 * • apiKey → `atlas-eval` buys the cheap models by the million and lands far
 *   down the spend order; `prod-agent` takes most of the Opus and leads it. */
export const TOKENS_TOTALS_7D: Record<
  Dimension,
  Record<string, number>
> = byDimension(cellTokens, 0);

const sumValues = (r: Record<string, number>) =>
  Object.values(r).reduce((a, b) => a + b, 0);

/** Workspace 7d spend — the sum of what the catalog charges for the workload
 *  above, and the Total Spend KPI by construction. It was authored as a flat
 *  `238` until 2026-08-03; at real prices the same traffic costs ~$248, and
 *  the difference is no longer a number anyone gets to choose. */
export const TOTAL_7D_BASE_DOLLARS = +sumValues(SPEND_TOTALS_7D.model).toFixed(
  2
);

/** Workspace 7d tokens — the sum of MODEL_SERIES_7D. Unchanged at 73,450,000:
 *  tokens are the authored fact here, and this reconciliation deliberately did
 *  not move them. Only the dollars they imply changed. */
export const TOTAL_7D_BASE_TOKENS = sumValues(TOKENS_TOTALS_7D.model);

/** Relative weight of each of the 7 base days — the authored daily shape,
 *  carried over unchanged from the hand-written SPEND_BASE matrix this
 *  replaced. A workspace ramping up over the week. */
const DAY_SHAPE_7D = [27.74, 30.05, 32.1, 34.16, 35.95, 38.0, 40.05];

/** Base (7d) chart data: each series' 7d total spread over the 7 days on the
 * shared daily shape. Other ranges derive from this by scaling values and
 * relabeling the x-axis.
 *
 * INVARIANT (charts-must-reconcile): every dimension sums to the SAME value on
 * EVERY day, not merely across the week — otherwise toggling the dimension
 * selector silently rewrites the daily bar heights while the KPI total holds
 * still. That used to be a property of ~110 hand-tuned numbers and a test that
 * checked them. It is now a property of the arithmetic: every dimension has
 * the same grand total (they group the same rows) and every dimension uses the
 * same day shape, so day d is `round2(grand × shape[d] / Σshape)` in all
 * three. The test stays as a regression guard. */
export const SPEND_BASE: Record<
  Dimension,
  Array<Record<string, number>>
> = Object.fromEntries(
  Object.entries(SPEND_TOTALS_7D).map(([dim, totals]) => {
    const grand = sumValues(totals);
    const shapeSum = DAY_SHAPE_7D.reduce((a, b) => a + b, 0);
    let biggest = Object.keys(totals)[0] ?? "";
    for (const [k, v] of Object.entries(totals)) {
      if (v > (totals[biggest] ?? 0)) {
        biggest = k;
      }
    }
    return [
      dim,
      DAY_SHAPE_7D.map((weight) => {
        const dayTotal = +((grand * weight) / shapeSum).toFixed(2);
        const row: Record<string, number> = {};
        let rest = 0;
        for (const [k, v] of Object.entries(totals)) {
          if (k !== biggest) {
            row[k] = +((dayTotal * v) / grand).toFixed(2);
            rest += row[k];
          }
        }
        row[biggest] = +(dayTotal - rest).toFixed(2);
        return row;
      }),
    ];
  })
) as Record<Dimension, Array<Record<string, number>>>;

/** Distribute `total` across `count` buckets with a mild upward trend
 * (0.7 → 1.3) and per-bucket noise that mimics real time-series:
 * ~75% of buckets get moderate variation (±20% around trend)
 * ~15% spike upward (1.4–2.0×, e.g. a big batch job day)
 * ~10% dip downward (0.35–0.65×, e.g. a weekend or quiet hour)
 * Seeded LCG so the shape is deterministic across renders. Last bucket
 * absorbs floating-point remainder so per-series sum exactly equals
 * `total` — required for the chart-sum = KPI invariant. */
export function distributeSeries(
  total: number,
  count: number,
  seed: number
): number[] {
  let s = (seed * 2_654_435_769) >>> 0 || 1;
  const rand = () => {
    s = (s * 1_664_525 + 1_013_904_223) >>> 0;
    return s / 0xff_ff_ff_ff;
  };
  const weights: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const trend = 0.7 + 0.6 * t;
    const r = rand();
    let jitter: number;
    if (r > 0.85) {
      jitter = 1.4 + rand() * 0.6; // spike
    } else if (r < 0.1) {
      jitter = 0.35 + rand() * 0.3; // dip
    } else {
      jitter = 0.8 + rand() * 0.4; // normal ±20%
    }
    weights.push(trend * jitter);
  }
  const sumW = weights.reduce((a, b) => a + b, 0) || 1;
  const out: number[] = [];
  let accumulated = 0;
  for (let i = 0; i < count - 1; i++) {
    const v = +(total * (weights[i] / sumW)).toFixed(2);
    out.push(v);
    accumulated += v;
  }
  out.push(+(total - accumulated).toFixed(2));
  return out;
}

/** Split every series' total across `count` buckets for a stacked chart, so
 *  that BOTH axes reconcile: each bucket sums to one dimension-INDEPENDENT
 *  daily curve, and each series still sums to its own scaled total.
 *
 *  The daily curve comes from a SINGLE distributeSeries call on the workspace
 *  total, with no per-series seed. Seeding per series (what TrendCard and
 *  Dashboard both did before 2026-08-03) let the series COUNT change the
 *  summed shape: a 3-series provider stack drew seeds +1..+3 while a 6-series
 *  model stack drew +1..+6, so toggling the chart's dimension silently
 *  rewrote every bar height while the KPI total held still — up to 40px of
 *  drift on a 135px bar.
 *
 *  The cost is per-series daily texture: every series now moves in lockstep
 *  within a bucket. That is the more truthful reading — a heavy-traffic day
 *  genuinely lifts every model, provider and key together, whereas the
 *  independent jitter was asserting that some series FELL on a day the
 *  workspace rose. distributeSeries keeps its trend + spike/dip character on
 *  the workspace curve, so the chart still reads organic.
 *
 *  Exactness holds on two orthogonal axes:
 *  • bucket i sums to dayTotals[i] — the largest series takes the bucket's
 *    remainder rather than its own rounded share (the rescaleToTotal idiom)
 *  • series s sums to totals[s] × scale — the last bucket carries that
 *    series' remainder (the trick distributeSeries itself uses), left
 *    UNROUNDED because a 2dp round there costs up to 0.005 × seriesCount,
 *    which is exactly the count-dependent error this function removes. */
export function splitAcrossBuckets(
  totals: Record<string, number>,
  count: number,
  seed: number,
  scale = 1
): Record<string, number[]> {
  const entries = Object.entries(totals);
  const out: Record<string, number[]> = {};
  for (const [key] of entries) {
    out[key] = Array.from({ length: count }, () => 0);
  }
  const grandTotal = entries.reduce((sum, [, v]) => sum + v, 0);
  if (count <= 0 || grandTotal <= 0) {
    return out;
  }
  const dayTotals = distributeSeries(grandTotal * scale, count, seed);
  const maxKey = entries.reduce(
    (best, [key, total]) => (total > (totals[best] ?? 0) ? key : best),
    entries[0]![0]
  );
  for (let i = 0; i < count - 1; i++) {
    const day = dayTotals[i] ?? 0;
    let othersSum = 0;
    for (const [key, total] of entries) {
      if (key !== maxKey) {
        const v = +((day * total) / grandTotal).toFixed(2);
        out[key]![i] = v;
        othersSum += v;
      }
    }
    out[maxKey]![i] = day - othersSum;
  }
  // Every earlier bucket sums to dayTotals[i] and dayTotals sums to
  // grandTotal × scale, so the last bucket lands on dayTotals.at(-1) exactly.
  for (const [key, total] of entries) {
    let accumulated = 0;
    for (let i = 0; i < count - 1; i++) {
      accumulated += out[key]![i] ?? 0;
    }
    out[key]![count - 1] = total * scale - accumulated;
  }
  return out;
}

export function paletteColor(slot: number): string {
  return CHART_PALETTE[(slot - 1) % CHART_PALETTE.length]!;
}

export function seriesColor(s: { slot: number; color?: string }): string {
  return s.color ?? paletteColor(s.slot);
}

/** A user's DEFAULT device, as they themselves named it. The backend stores a
 *  device ID per request and resolves the user-authored name from it, so a
 *  person with two machines produces two device names under one owner. This
 *  map is the fallback for keys that do not name their own device; a key used
 *  from a second machine overrides it with `device` on its seed (see
 *  API_KEY_SEEDS). Owners mirror Team.tsx MEMBER_ROWS. */
const DEVICE_BY_OWNER: Record<string, string> = {
  "Chad Ponticas": "Macbook Pro",
  "Kira Tan": "Coding PC",
  "Mateus Silva": "Mac mini m4",
  "Jordan Lee": "OpenClaw PC",
};

/** Resolves an owner to their default device name. Unknown owners render an em
 *  dash rather than a plausible-looking guess. */
export function deviceFor(owner: string): string {
  return DEVICE_BY_OWNER[owner] ?? "—";
}

export type ApiKeyRow = {
  key: string;
  label: string;
  owner: string;
  /** The device this key is used from. Defaults to the owner's device via
   *  DEVICE_BY_OWNER; a seed may override it, which is how one person shows up
   *  on two machines (Chad's `prod-agent` runs from the Macbook Air while his
   *  other keys run from the Macbook Pro). Owner and device are therefore
   *  independent columns — do not derive one from the other at a call site. */
  device: string;
  /** Gateway PRD R4/R5: BYOK vs Gate is per-key. Material on this admin
   *  surface because the workspace owner reconciles prepaid balance vs.
   *  external provider charges across every user's keys. */
  path: "BYOK" | "Gate";
  requests: number;
  tokensIn: number;
  tokensOut: number;
  spend: number;
  /** 7d Total-saved rate for the key (caching + compression, fraction).
   *  Token-weighted mean across keys = ACTIVITY_SAVINGS_RATE_7D (24.3%), the
   *  steady-state Activity savings goal. The Saved column and the trend
   *  chart's Savings lens both hang off this; NOT tied to the TokenSavings
   *  page's 14.2% (decoupled 2026-07-14). */
  savings: number;
  /** Mirrors the Keys page status — greys the row and is hidden by the
   *  table's "Hide revoked" toggle when true. */
  revoked?: boolean;
};

/** The workspace's keys. Two kinds, and the difference is the whole reason
 *  this table has a Spend column at all:
 *
 *  Gate keys are metered by the gateway, so their `tokensIn` / `tokensOut` /
 *  `spend` are DERIVED — the same USAGE_7D cells the trend chart groups, read
 *  by key. The table's Spend column and the chart's breakdown panel are the
 *  same numbers, and the Spend column divided by the two token columns is the
 *  blended rate the catalog charges for that key's model mix. None of it is
 *  authored.
 *
 *  BYOK keys bill the customer's own provider account. Gate sees the traffic
 *  but never the invoice, so their tokens stay authored and their spend is $0
 *  by definition, not by omission.
 *
 *  `design-agent` moved from Gate to BYOK on 2026-08-03. It was charted with
 *  $21.00 of spend while all 102 of its request rows on the Messages page
 *  carry no cost, because the session is BYOK — the two pages disagreed about
 *  whether the gateway bills this key. The request rows are the primary
 *  evidence, so BYOK is what it is.
 *
 *  Resulting top-4 leaders:
 *  Spend    → prod-agent, prod-web, development, atlas-eval
 *  Requests → prod-web, nova-chat, design-agent, development
 *  Tokens   → prod-web, prod-agent, design-agent, openclaw */
type ApiKeySeed = Omit<
  ApiKeyRow,
  "tokensIn" | "tokensOut" | "spend" | "device"
> &
  Partial<TokenSplit> & {
    /** Overrides the owner's default device. Set only when a key is used from
     *  a different machine than that person's other keys. */
    device?: string;
  };

const API_KEY_SEEDS: ApiKeySeed[] = [
  {
    key: "prod-web",
    label: "prod-web",
    owner: "Chad Ponticas",
    path: "Gate",
    requests: 60_000,
    savings: 0.2563,
  },
  {
    key: "prod-agent",
    label: "prod-agent",
    owner: "Chad Ponticas",
    // Second machine: same person, same workspace, different device. The
    // Device column exists to make exactly this visible.
    device: "Macbook Air",
    path: "Gate",
    requests: 12_000,
    savings: 0.27,
  },
  {
    key: "openclaw",
    label: "openclaw",
    owner: "Kira Tan",
    path: "BYOK",
    requests: 8000,
    tokensIn: 10_096_154,
    tokensOut: 403_846,
    savings: 0.21,
  },
  {
    key: "hermes-agent",
    label: "hermes-agent",
    owner: "Mateus Silva",
    path: "BYOK",
    requests: 5500,
    tokensIn: 6_923_077,
    tokensOut: 276_923,
    savings: 0.2,
  },
  {
    key: "development",
    label: "development",
    owner: "Jordan Lee",
    path: "Gate",
    requests: 15_000,
    savings: 0.235,
  },
  // Tokens are the real counts off its own 102 request rows (conversation
  // cnv_7a3f9e2b), which is the session that makes this key BYOK.
  {
    key: "design-agent",
    label: "design-agent",
    owner: "Chad Ponticas",
    path: "BYOK",
    requests: 13_000,
    tokensIn: 19_386_869,
    tokensOut: 59_938,
    savings: 0.25,
  },
  {
    key: "ci-runner",
    label: "ci-runner",
    owner: "Jordan Lee",
    path: "Gate",
    requests: 6500,
    savings: 0.19,
    revoked: true,
  },
  {
    key: "nova-chat",
    label: "nova-chat",
    owner: "Kira Tan",
    path: "BYOK",
    requests: 18_000,
    tokensIn: 5_416_667,
    tokensOut: 1_083_333,
    savings: 0.225,
  },
  {
    key: "atlas-eval",
    label: "atlas-eval",
    owner: "Mateus Silva",
    path: "Gate",
    requests: 2000,
    savings: 0.285,
    revoked: true,
  },
  // Matches the Keys page's revoked test-key (sk-gw-…255e): never used, so
  // every usage figure is a real zero, not a scaled-down count.
  {
    key: "test-key",
    label: "test-key",
    owner: "Chad Ponticas",
    path: "BYOK",
    requests: 0,
    tokensIn: 0,
    tokensOut: 0,
    savings: 0,
    revoked: true,
  },
];

export const API_KEY_ROWS: ApiKeyRow[] = (() => {
  // Gate-key request counts are rescaled onto TOTAL_7D_BASE_REQUESTS so this
  // table sums to the same workspace the Top Models card and the KPI rail
  // describe. The authored shape (and so the leaderboard order) is preserved;
  // only the scale moves. BYOK keys keep their authored counts — they are not
  // part of the metered universe, which is the same reason their spend is $0.
  const gate = API_KEY_SEEDS.filter((s) => s.path === "Gate");
  const gateTotal = gate.reduce((a, s) => a + s.requests, 0) || 1;
  const requests = settle(
    Object.fromEntries(
      gate.map((s) => [
        s.key,
        (s.requests * TOTAL_7D_BASE_REQUESTS) / gateTotal,
      ])
    ),
    0
  );
  return API_KEY_SEEDS.map((seed) => {
    if (seed.path === "BYOK") {
      return {
        ...seed,
        device: seed.device ?? deviceFor(seed.owner),
        tokensIn: seed.tokensIn ?? 0,
        tokensOut: seed.tokensOut ?? 0,
        spend: 0,
      };
    }
    const tokens = KEY_TOKENS_7D[seed.key];
    return {
      ...seed,
      device: seed.device ?? deviceFor(seed.owner),
      requests: requests[seed.key] ?? 0,
      tokensIn: tokens?.tokensIn ?? 0,
      tokensOut: tokens?.tokensOut ?? 0,
      spend: SPEND_TOTALS_7D.apiKey[seed.key] ?? 0,
    };
  });
})();

export type ModelRow = {
  /** Canonical catalog id. The label is looked up from it, never authored. */
  key: string;
  vendor: Vendor;
  requests: number;
  tokensIn: number;
  tokensOut: number;
  spend: number;
};

/** The Top Models card. Seven catalog models, and only two of the four
 *  columns are authored.
 *
 *  `tokensIn` / `tokensOut` / `spend` are DERIVED from MODEL_SERIES_7D — the
 *  same cells the trend chart groups — so this card and the chart above it
 *  describe one workload rather than two. They did not before 2026-08-03:
 *  this card put Opus 4.7 at 13.4M tokens while the chart's token lens put it
 *  at 4.1M, and priced Qwen3 Next at $6.00 for volume the catalog charges
 *  $0.46 for. Spend includes routing markup, because OpenRouter bills 10% over
 *  list and where the traffic went is part of what it cost.
 *
 *  `requests` stays authored — a request count is not a function of price —
 *  but is rescaled onto TOTAL_7D_BASE_REQUESTS so the card sums to the KPI
 *  rail above it. The old comment here claimed that reconciliation and quoted
 *  "~$1,248 spend, ~48,293 requests, ~18.4M tokens", none of which were this
 *  table's totals by then.
 *
 *  Resulting top-4 leaders:
 *    Spend     → Sonnet 5, Gemini 3.1 Pro, Opus 4.7, Haiku 4.5
 *    Requests  → Haiku 4.5, Sonnet 5, Gemini 3.1 Pro, DeepSeek V4 Pro
 *    Tokens    → Sonnet 5, Qwen3 Next, Haiku 4.5, Gemini 3.1 Pro
 *
 *  Read the Spend and Tokens rows against each other: Qwen3 Next is second on
 *  volume and last on money, Opus 4.7 is second-to-last on volume and third on
 *  money. That contrast is the card's entire job, and it is only true because
 *  both columns now come from the catalog.
 *
 *  Labels are read from the catalog (`modelName`) off the canonical id, so
 *  this card can never re-spell a model the Models page names differently —
 *  the drift that had it advertising GPT-5.1, Llama 4.2 405B and Mistral
 *  Large 3 until 2026-08-03. Claude Opus 4.8 stays out for the same reason it
 *  is out of SPEND_SERIES: its 102 request rows are all the BYOK session,
 *  which Gate does not meter. */
const MODEL_ROW_SEEDS: {
  key: string;
  vendor: Vendor;
  /** Average call size for this model's workload, which is what actually
   *  determines how many requests its token volume represents. Authoring the
   *  call size instead of the request count is what keeps the two lenses of
   *  this card honest against each other: Haiku's 450-token classification
   *  calls and Opus' 9,000-token agentic runs are why one leads on requests
   *  and the other leads on spend. Authoring requests directly is how the
   *  table ended up implying 119-token Opus calls. */
  tokensPerRequest: number;
}[] = [
  {
    key: "anthropic/claude-opus-4-7",
    vendor: "anthropic",
    tokensPerRequest: 9000,
  },
  {
    key: "anthropic/claude-sonnet-5",
    vendor: "anthropic",
    tokensPerRequest: 1400,
  },
  {
    key: "anthropic/claude-haiku-4-5",
    vendor: "anthropic",
    tokensPerRequest: 450,
  },
  {
    key: "deepseek/deepseek-v4-pro",
    vendor: "deepseek",
    tokensPerRequest: 2500,
  },
  {
    key: "google/gemini-3-1-pro-preview",
    vendor: "google",
    tokensPerRequest: 2000,
  },
  {
    key: "qwen/qwen3-next-80b-a3b-instruct",
    vendor: "qwen",
    tokensPerRequest: 6000,
  },
  {
    key: "moonshotai/kimi-k2-thinking",
    vendor: "moonshotai",
    tokensPerRequest: 4500,
  },
];

export const MODEL_ROWS: ModelRow[] = (() => {
  const modelTokens = (key: string) => {
    const split = MODEL_TOKENS_7D[key];
    return (split?.tokensIn ?? 0) + (split?.tokensOut ?? 0);
  };
  const raw = Object.fromEntries(
    MODEL_ROW_SEEDS.map((s) => [s.key, modelTokens(s.key) / s.tokensPerRequest])
  );
  const rawTotal = Object.values(raw).reduce((a, b) => a + b, 0) || 1;
  const requests = settle(
    Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [
        k,
        (v * TOTAL_7D_BASE_REQUESTS) / rawTotal,
      ])
    ),
    0
  );
  return MODEL_ROW_SEEDS.map((seed) => ({
    key: seed.key,
    vendor: seed.vendor,
    requests: requests[seed.key] ?? 0,
    tokensIn: MODEL_TOKENS_7D[seed.key]?.tokensIn ?? 0,
    tokensOut: MODEL_TOKENS_7D[seed.key]?.tokensOut ?? 0,
    spend: MODEL_SPEND_7D[seed.key] ?? 0,
  }));
})();

/* ─── Chart series selection ──────────────────────────────────────────────
 *
 * Which series a stacked chart NAMES is derived, not authored. It is a
 * function of the workload and of the metric the reader is currently looking
 * at, and it changes when they toggle the lens.
 *
 * Until 2026-08-03 the model dimension shipped a fixed five plus a fixed
 * `others`, and the fixed set was wrong: it named DeepSeek (8.72M tokens) and
 * Opus (4.08M) while burying Haiku (12.52M) in the bucket. `Others` came out
 * ~92% one model and ranked 3rd in the legend, directly above a Top Models
 * card that correctly listed Haiku 3rd. The set was also metric-blind — Opus
 * is 5.6% of tokens and 24.7% of spend, so no single ordering can be right for
 * both lenses.
 *
 * The rule below is production's, verbatim (dashboard-web Activity.tsx):
 * rank DESC by the active metric, drop anything at or below zero, cap at 6
 * series total, and when that overflows keep the top 5 and roll the remainder
 * into one synthetic `Others`. Palette slots are POSITIONAL — a series' color
 * is its rank, not its identity — and `Others` sits outside the palette in a
 * neutral so it stays subordinate to the named bands.
 * ────────────────────────────────────────────────────────────────────────── */

/** A series as RENDERED: label resolved, palette slot assigned by rank. */
export type ChartSeries = {
  key: string;
  label: string;
  /** 1-based CHART_PALETTE slot = rank. 0 on `Others`, which uses `color`. */
  slot: number;
  /** Set only on `Others`; overrides the palette. */
  color?: string;
};

/** Max bands a stacked chart renders, `Others` included. Above six the stack
 *  stops reading as distinguishable bands and the legend stops fitting the
 *  panel beside it. */
export const SERIES_CAP = 6;

/** Synthetic key for the rollup. The double-underscore prefix keeps it from
 *  ever colliding with a catalog id, a route id, or a workspace key. */
export const OTHERS_KEY = "__other";
export const OTHERS_LABEL = "Others";

/** Neutral-300 — legible against the card but deliberately outside the
 *  saturated CHART_PALETTE, so the rollup never competes with a named series
 *  for attention the way a palette slot would. */
export const OTHERS_COLOR = "var(--color-neutral-300)";

/** Display label for one series key. Every dimension reads its label from the
 *  entity that owns it, so a chart can't re-spell a model the Models page
 *  names differently or a route the filter dropdown names differently. */
function seriesLabel(dimension: Dimension, key: string): string {
  if (dimension === "model") {
    return modelName(key);
  }
  if (dimension === "provider") {
    return PROVIDER_META[key as ProviderId]?.label ?? key;
  }
  return API_KEY_ROWS.find((k) => k.key === key)?.label ?? key;
}

/** Every series a dimension COULD name, in workload order.
 *
 *  Read straight off the grouped workload rather than listed by hand: the
 *  candidate pool is by construction exactly the set of entities that carry
 *  metered traffic. A model, route or key cannot be charted without appearing
 *  here, and cannot appear here without being in USAGE_7D. That is what makes
 *  the "which series exist" question unanswerable by an authored list — the
 *  bug this replaced.
 *
 *  Two consequences worth knowing rather than rediscovering:
 *  • Claude Opus 4.8 is not here. It is 102 of the 153 request rows, but every
 *    one belongs to the BYOK session cnv_7a3f9e2b, and Gate meters no dollars
 *    for BYOK. Same reason `design-agent` is not a candidate key.
 *  • Alibaba is a hairline on the SPEND lens (under 2%) because the catalog
 *    only lets it serve DeepSeek and Qwen, the two cheapest models in the
 *    fleet. Toggle to TOKENS and the same route is 11%. That contrast is the
 *    finding; do not "fix" it by inventing spend for it. */
export const SERIES_POOL: Record<Dimension, readonly string[]> = {
  model: Object.keys(TOKENS_TOTALS_7D.model),
  provider: Object.keys(TOKENS_TOTALS_7D.provider),
  apiKey: Object.keys(TOKENS_TOTALS_7D.apiKey),
};

/** Rank a dimension's series DESC by the active metric and cap the result.
 *
 *  `totals` is whatever the chart is actually plotting for the active range
 *  and lens — pass the aggregate it renders, not a 7d constant, so the legend
 *  can never describe a different selection than the bars.
 *
 *  Ties keep pool order (Array#sort is stable). Two series can tie after
 *  `settle` rounds them to the cent — DeepSeek and Qwen both land on $5.95 on
 *  the spend lens, from $5.9483 and $5.9457 — and pool order preserves the
 *  unrounded order in that case. */
export function rankSeries(
  dimension: Dimension,
  totals: Record<string, number>
): { series: ChartSeries[]; overflow: string[] } {
  const ranked = SERIES_POOL[dimension]
    .filter((key) => {
      const v = totals[key];
      return typeof v === "number" && Number.isFinite(v) && v > 0;
    })
    .sort((a, b) => (totals[b] ?? 0) - (totals[a] ?? 0));

  // Under the cap, everything passes through and there is no Others bucket at
  // all. Provider (3 routes) and apiKey (5 Gate keys) both land here.
  const named =
    ranked.length > SERIES_CAP ? ranked.slice(0, SERIES_CAP - 1) : ranked;
  const series: ChartSeries[] = named.map((key, i) => ({
    key,
    label: seriesLabel(dimension, key),
    slot: i + 1,
  }));
  const overflow = ranked.slice(named.length);
  if (overflow.length > 0) {
    series.push({
      key: OTHERS_KEY,
      label: OTHERS_LABEL,
      slot: 0,
      color: OTHERS_COLOR,
    });
  }
  return { series, overflow };
}

/** Rank, cap, and fold the overflow into `Others` — series, legend totals and
 *  chart rows in one pass, so the three can't describe different selections.
 *
 *  The fold is deliberately UNROUNDED. Every other value in this pipeline is
 *  (see splitAcrossBuckets' last-bucket note): rounding the rollup to 2dp
 *  costs up to 0.005 per bucket in whichever dimension happens to overflow,
 *  which is exactly the count-dependent cross-dimension drift the rest of the
 *  file exists to eliminate. */
export function rankChartSeries(
  dimension: Dimension,
  seriesTotals: Record<string, number>,
  rows: Array<Record<string, number | string>>
): {
  series: ChartSeries[];
  totals: Record<string, number>;
  rows: Array<Record<string, number | string>>;
} {
  const { series, overflow } = rankSeries(dimension, seriesTotals);
  if (overflow.length === 0) {
    const totals: Record<string, number> = {};
    for (const s of series) {
      totals[s.key] = seriesTotals[s.key] ?? 0;
    }
    return { series, totals, rows };
  }

  const totals: Record<string, number> = {};
  for (const s of series) {
    if (s.key !== OTHERS_KEY) {
      totals[s.key] = seriesTotals[s.key] ?? 0;
    }
  }
  totals[OTHERS_KEY] = overflow.reduce(
    (sum, key) => sum + (seriesTotals[key] ?? 0),
    0
  );

  return {
    series,
    totals,
    rows: rows.map((row) => ({
      ...row,
      [OTHERS_KEY]: overflow.reduce(
        (sum, key) => sum + (Number(row[key]) || 0),
        0
      ),
    })),
  };
}

/** Per-series 7d Total-saved rates for the trend chart's Savings lens —
 *  each series' OWN rate (what % of its tokens caching + compression save),
 *  NOT its share of anything. apiKey derives from API_KEY_ROWS.savings so
 *  the chart panel shows the same numbers as the table's Saved column;
 *  model / provider are authored data like the per-key rates (the cache-heavy
 *  short-prompt models save the most, long-context Opus the least).
 *  The chart normalizes per-series contributions (token share × rate) so the
 *  stack total stays anchored to savingsRateFor(range) regardless of these
 *  spreads. */
export const SAVINGS_RATES_7D: Record<Dimension, Record<string, number>> = {
  // Keyed by catalog id since 2026-08-03, when the model dimension stopped
  // pre-bundling its long tail. Haiku 4.5 and Kimi K2 Thinking inherit the
  // 0.29 that bucket carried, split by character — Haiku's short, highly
  // repetitive classification prompts are the best cache hit in the fleet,
  // Kimi's reasoning traces are not — at a token-weighted mean of 0.2898,
  // i.e. the aggregate the bucket asserted, preserved to 4dp.
  model: {
    "anthropic/claude-sonnet-5": 0.25,
    "deepseek/deepseek-v4-pro": 0.235,
    "google/gemini-3-1-pro-preview": 0.215,
    "anthropic/claude-opus-4-7": 0.19,
    "qwen/qwen3-next-80b-a3b-instruct": 0.205,
    "anthropic/claude-haiku-4-5": 0.295,
    "moonshotai/kimi-k2-thinking": 0.23,
  },
  // Per-route saved rate, in the same 0.20–0.26 band the model rates sit in.
  // The biggest route is deliberately not the best saver: OpenRouter's all-25
  // catalog mixes cache-friendly chat with long-context work; Vertex is
  // Gemini-heavy and long-context, so it compresses least (tracks the 0.215
  // gemini rate above); Alibaba's 3 Qwen models take short, highly repetitive
  // prompts and get the best cache hit rate.
  provider: {
    openrouter: 0.245,
    vertex: 0.22,
    alibaba: 0.26,
  },
  apiKey: Object.fromEntries(
    SERIES_POOL.apiKey.map((key) => [
      key,
      API_KEY_ROWS.find((k) => k.key === key)?.savings ?? 0,
    ])
  ),
};

/** Chart metric lens — shared by the trend chart and the top-by-axis selectors. */
export type Metric = "tokens" | "spend";

export const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: "tokens", label: "Tokens" },
  { value: "spend", label: "Spend" },
];

/* ─── Scoped usage (view-scope.ts) ────────────────────────────────────────
 * A Manager or Member reads the workload their OWN keys produced. Gate keys
 * already have cells in USAGE_7D. A BYOK key has none (the provider billed
 * it), but its 7d tokens are authored on API_KEY_ROWS and its model mix is on
 * record in the Messages rows it sent, so its cells are that mix applied to
 * those tokens at $0. Nothing is invented: every share comes from a real row.
 * BYOK traffic has no Gate route, so it contributes no provider series. */

export type UsageTotals = Record<Dimension, Record<string, number>>;

/** Not a Gate route: the customer's own provider account. */
const BYOK_PROVIDER = "byok" as ProviderId;

function byokCellsFor(key: string): UsageCell[] {
  const row = API_KEY_ROWS.find((r) => r.key === key);
  if (row?.path !== "BYOK") {
    return [];
  }
  const count = (v: string) =>
    Number.parseInt(v.replace(/[^0-9]/g, ""), 10) || 0;
  const perModel = new Map<string, { tokensIn: number; tokensOut: number }>();
  for (const r of REQUEST_ROWS_ALL) {
    if (r.keyId !== key) {
      continue;
    }
    const acc = perModel.get(r.model) ?? { tokensIn: 0, tokensOut: 0 };
    acc.tokensIn += count(r.inTokens);
    acc.tokensOut += count(r.outTokens);
    perModel.set(r.model, acc);
  }
  const sumIn = [...perModel.values()].reduce((a, m) => a + m.tokensIn, 0) || 1;
  const sumOut =
    [...perModel.values()].reduce((a, m) => a + m.tokensOut, 0) || 1;
  return [...perModel.entries()].map(([model, m]) => {
    const tokensIn = Math.round((row.tokensIn * m.tokensIn) / sumIn);
    const tokensOut = Math.round((row.tokensOut * m.tokensOut) / sumOut);
    return {
      model,
      provider: BYOK_PROVIDER,
      apiKey: key,
      tokensIn,
      tokensOut,
      tokens: tokensIn + tokensOut,
      spend: 0,
    };
  });
}

export function usageCellsFor(names: Set<string>): UsageCell[] {
  const gate = USAGE_7D.filter((c) => names.has(c.apiKey));
  const byok = [...names].flatMap(byokCellsFor);
  return [...gate, ...byok];
}

function totalsOf(
  cells: UsageCell[],
  metric: (cell: UsageCell) => number,
  decimals: number
): UsageTotals {
  return Object.fromEntries(
    Object.entries(DIMENSION_KEY).map(([dim, key]) => {
      const out: Record<string, number> = {};
      for (const cell of cells) {
        // BYOK cells carry no Gate route: they sit out of the provider series.
        if (dim === "provider" && cell.provider === BYOK_PROVIDER) {
          continue;
        }
        out[key(cell)] = (out[key(cell)] ?? 0) + metric(cell);
      }
      return [dim, Object.keys(out).length > 0 ? settle(out, decimals) : out];
    })
  ) as UsageTotals;
}

/** Spend and token totals per dimension for the keys in `names`; the org's
 *  own SPEND_TOTALS_7D / TOKENS_TOTALS_7D when `names` is null. */
export function scopedUsageTotals(names: Set<string> | null): {
  spend: UsageTotals;
  tokens: UsageTotals;
} {
  if (names === null) {
    return { spend: SPEND_TOTALS_7D, tokens: TOKENS_TOTALS_7D };
  }
  const cells = usageCellsFor(names);
  return {
    spend: totalsOf(cells, cellSpend, 2),
    tokens: totalsOf(cells, cellTokens, 0),
  };
}
