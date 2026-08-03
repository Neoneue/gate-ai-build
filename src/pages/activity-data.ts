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
export const TOTAL_7D_BASE_DOLLARS = 238;
export const TOTAL_7D_BASE_REQUESTS = 63_793;
export const TOTAL_7D_BASE_TOKENS = 73_450_000;

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

/** ≤6 series per dimension. Model + provider stay fully enumerated (bounded
 * cardinality in MVP). API keys fall back to "top 5 + Other" since key
 * cardinality is unbounded — a 100-key workspace can't be stacked.
 *
 * `color` overrides the palette slot — Other recedes to neutral-300 so the
 * named series carry the visual weight. */
export const SPEND_SERIES: Record<
  Dimension,
  readonly { key: string; label: string; slot: number; color?: string }[]
> = {
  model: [
    { key: "sonnet", label: "Claude Sonnet 4.5", slot: 2 },
    { key: "gpt", label: "GPT-5.1", slot: 1 },
    { key: "gemini", label: "Gemini 3 Pro", slot: 4 },
    { key: "opus", label: "Claude Opus 4.7", slot: 7 },
    { key: "llama", label: "Llama 4.2 405B", slot: 6 },
    { key: "haiku", label: "Others", slot: 3 },
  ],
  // Gateway PROVIDERS — the upstream routes Gate dispatches to. NOT model
  // vendors: Anthropic/OpenAI/Google-the-vendor are reachable *through* these
  // routes, so listing them here double-counted the model dimension. Confirmed
  // against the production API 2026-08-03: exactly three routes, no Bedrock.
  //
  // Only three bands stack here, so the slots are picked for maximum hue AND
  // chroma separation rather than by index order: blue(255°) / orange(50°) /
  // green(145°) is the most evenly spread triad in the 8-slot palette, and
  // green is the highest-chroma of the three so Alibaba's thin ~8% band still
  // reads at small chart heights.
  provider: [
    { key: "openrouter", label: "OpenRouter", slot: 1 },
    { key: "vertex", label: "Google Vertex", slot: 2 },
    { key: "alibaba", label: "Alibaba", slot: 3 },
  ],
  apiKey: [
    { key: "prod-agent", label: "prod-agent", slot: 1 },
    { key: "prod-web", label: "prod-web", slot: 2 },
    { key: "design-agent", label: "design-agent", slot: 3 },
    { key: "atlas-eval", label: "atlas-eval", slot: 4 },
    { key: "development", label: "development", slot: 5 },
    { key: "ci-runner", label: "ci-runner", slot: 6 },
  ],
};

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
export const SPEND_BASE: Record<Dimension, Array<Record<string, number>>> = {
  // Gate-only — BYOK spend isn't tracked. Per-dimension 7d sums all land on
  // $238 (= TOTAL_7D_BASE_DOLLARS) so toggling Model / Provider / API key
  // keeps the same workspace total (and that total = the Total Spend KPI by
  // construction).
  model: [
    {
      sonnet: 6.68,
      gpt: 5.14,
      gemini: 3.34,
      opus: 8.73,
      llama: 2.31,
      haiku: 1.54,
    },
    {
      sonnet: 7.19,
      gpt: 5.39,
      gemini: 3.6,
      opus: 9.76,
      llama: 2.57,
      haiku: 1.54,
    },
    {
      sonnet: 7.7,
      gpt: 5.65,
      gemini: 3.85,
      opus: 10.53,
      llama: 2.57,
      haiku: 1.8,
    },
    {
      sonnet: 8.22,
      gpt: 5.91,
      gemini: 4.11,
      opus: 11.3,
      llama: 2.82,
      haiku: 1.8,
    },
    {
      sonnet: 8.73,
      gpt: 6.16,
      gemini: 4.37,
      opus: 12.07,
      llama: 2.82,
      haiku: 1.8,
    },
    {
      sonnet: 8.99,
      gpt: 6.68,
      gemini: 4.37,
      opus: 13.09,
      llama: 2.82,
      haiku: 2.05,
    },
    {
      sonnet: 9.5,
      gpt: 6.68,
      gemini: 4.62,
      opus: 14.12,
      llama: 3.08,
      haiku: 2.05,
    },
  ],
  // Routing split, day-for-day reconciled against the `model` rows above:
  // openrouter 68% / vertex 24% / alibaba 8%, with alibaba carrying the
  // rounding remainder so each day's three values sum EXACTLY to that day's
  // model total. Ordering + dominance come from production (OpenRouter 98.6%
  // of real spend); the gap is softened using catalog coverage (OpenRouter
  // 25/25 models, Vertex 23/25, Alibaba 3/25), which makes Vertex a genuine
  // second source. Prod's literal 98.6/1.4/0 renders as one bar with two
  // hairlines, so it is not the shape we chart. 7d: $161.87 / $57.13 / $19.05.
  provider: [
    {
      openrouter: 18.86,
      vertex: 6.66,
      alibaba: 2.22,
    },
    {
      openrouter: 20.43,
      vertex: 7.21,
      alibaba: 2.41,
    },
    {
      openrouter: 21.83,
      vertex: 7.7,
      alibaba: 2.57,
    },
    {
      openrouter: 23.23,
      vertex: 8.2,
      alibaba: 2.73,
    },
    {
      openrouter: 24.45,
      vertex: 8.63,
      alibaba: 2.87,
    },
    {
      openrouter: 25.84,
      vertex: 9.12,
      alibaba: 3.04,
    },
    {
      openrouter: 27.23,
      vertex: 9.61,
      alibaba: 3.21,
    },
  ],
  // Day-for-day reconciled against the `model` rows above (was drifting
  // -$0.90 to +$1.17 per day, grand total $237.95 vs $238.05). The four small
  // keys keep their authored step pattern untouched — the paired-day repeats
  // ARE their character — so the whole daily correction lands on prod-agent
  // and prod-web, split by their existing ratio, with prod-agent taking the
  // rounding remainder. Both stay monotonically rising; their 7d totals moved
  // +$0.06 / +$0.04, and no key's share of the workspace moved by more than
  // 0.01pp. Per-key 7d sums equal the Gate rows in API_KEY_ROWS exactly:
  // prod-agent 92.37, prod-web 90.04, design-agent 21.00, atlas-eval 20.00,
  // development 13.20, ci-runner 1.44. Total $238.05.
  apiKey: [
    {
      "prod-agent": 10.51,
      "prod-web": 10.44,
      "design-agent": 2.53,
      "atlas-eval": 2.38,
      development: 1.72,
      "ci-runner": 0.16,
    },
    {
      "prod-agent": 11.87,
      "prod-web": 11.39,
      "design-agent": 2.53,
      "atlas-eval": 2.38,
      development: 1.72,
      "ci-runner": 0.16,
    },
    {
      "prod-agent": 12.34,
      "prod-web": 12.12,
      "design-agent": 2.9,
      "atlas-eval": 2.86,
      development: 1.72,
      "ci-runner": 0.16,
    },
    {
      "prod-agent": 13.36,
      "prod-web": 13.16,
      "design-agent": 2.9,
      "atlas-eval": 2.86,
      development: 1.72,
      "ci-runner": 0.16,
    },
    {
      "prod-agent": 14.19,
      "prod-web": 13.76,
      "design-agent": 3.26,
      "atlas-eval": 2.86,
      development: 1.72,
      "ci-runner": 0.16,
    },
    {
      "prod-agent": 14.7,
      "prod-web": 14.09,
      "design-agent": 3.26,
      "atlas-eval": 3.33,
      development: 2.3,
      "ci-runner": 0.32,
    },
    {
      "prod-agent": 15.4,
      "prod-web": 15.08,
      "design-agent": 3.62,
      "atlas-eval": 3.33,
      development: 2.3,
      "ci-runner": 0.32,
    },
  ],
};

/** Per-series 7d totals, derived once from SPEND_BASE. These are the
 * canonical "how much did series X spend across the workspace 7d"
 * numbers; the chart distributes them across N buckets per range via
 * distributeSeries(). Sum across series = TOTAL_7D_BASE_DOLLARS = $238. */
export const SPEND_TOTALS_7D: Record<
  Dimension,
  Record<string, number>
> = Object.fromEntries(
  Object.entries(SPEND_BASE).map(([dim, rows]) => [
    dim,
    rows.reduce(
      (acc, row) => {
        for (const [k, v] of Object.entries(row)) {
          acc[k] = (acc[k] || 0) + v;
        }
        return acc;
      },
      {} as Record<string, number>
    ),
  ])
) as Record<Dimension, Record<string, number>>;

/** Scale a raw per-series split so it sums *exactly* to `target`, absorbing
 * the rounding remainder in the largest series. Used to anchor each
 * dimension's request totals to TOTAL_7D_BASE_REQUESTS — same single-
 * source-of-truth invariant the spend path gets from SPEND_BASE summing
 * to $238. */
function rescaleToTotal(
  raw: Record<string, number>,
  target: number
): Record<string, number> {
  const entries = Object.entries(raw);
  const rawSum = entries.reduce((a, [, v]) => a + v, 0) || 1;
  const scaled = entries.map(
    ([k, v]) => [k, Math.round((v * target) / rawSum)] as const
  );
  const scaledSum = scaled.reduce((a, [, v]) => a + v, 0);
  // Largest series absorbs the remainder so the total lands exactly.
  let maxIdx = 0;
  for (let i = 1; i < scaled.length; i++) {
    if (scaled[i]![1] > scaled[maxIdx]![1]) {
      maxIdx = i;
    }
  }
  const out: Record<string, number> = {};
  scaled.forEach(([k, v], i) => {
    out[k] = i === maxIdx ? v + (target - scaledSum) : v;
  });
  return out;
}

/** Per-series 7d *token* totals per dimension. Mirrors SPEND_TOTALS_7D
 * but for the tokens metric. Every dimension's totals sum to exactly
 * TOTAL_7D_BASE_TOKENS (= 24,500,000) via rescaleToTotal, so the chart-sum
 * = Tokens Used KPI invariant holds under any dimension.
 *
 * Splits are sourced from real per-entity token counts, NOT scaled from
 * spend — so the token distribution genuinely differs in shape:
 * • model → from MODEL_ROWS (tokensIn + tokensOut). Sonnet leads on
 * token volume; Opus, which leads on spend, is near the
 * bottom — high price per token vs. high token volume.
 * • apiKey → from API_KEY_ROWS (tokensIn + tokensOut) for the 6 charted
 * Gate keys.
 * • provider → the routing split, tilted toward volume: cheap tokens buy
 * more of them, so Vertex (Gemini) and Alibaba (Qwen) each
 * carry a larger share of TOKENS than of SPEND. */
export const TOKENS_TOTALS_7D: Record<Dimension, Record<string, number>> = {
  // 7d window token totals (independent from the workspace-lifetime numbers
  // in MODEL_ROWS — Llama's 7d rate and Opus' 7d rate are tuned for this
  // window only): sonnet 6_550_000, llama 4_840_000, haiku 4_460_000,
  // gemini 4_050_000, gpt 2_860_000, opus 1_340_000. Sonnet dominates on
  // token volume; Opus' high price-per-token keeps it near the bottom.
  model: rescaleToTotal(
    {
      sonnet: 6_550_000,
      gpt: 2_860_000,
      gemini: 4_050_000,
      opus: 1_340_000,
      llama: 4_840_000,
      haiku: 4_460_000,
    },
    TOTAL_7D_BASE_TOKENS
  ),
  // Provider token split = 62 / 27 / 11, vs the 68 / 24 / 8 SPEND split.
  // Same routing, different denominator: Vertex's Gemini and Alibaba's Qwen
  // models are materially cheaper per token, so both buy a bigger slice of
  // token volume than of dollars. Raw values already sum to
  // TOTAL_7D_BASE_TOKENS, so rescaleToTotal is a no-op pass-through here.
  provider: rescaleToTotal(
    {
      openrouter: 45_540_000,
      vertex: 19_830_000,
      alibaba: 8_080_000,
    },
    TOTAL_7D_BASE_TOKENS
  ),
  // API_KEY_ROWS (tokensIn + tokensOut) for the 6 charted Gate keys:
  // prod-web 18_000_000, prod-agent 16_000_000, design-agent 4_200_000,
  // atlas-eval 3_200_000, development 2_200_000, ci-runner 850_000.
  apiKey: rescaleToTotal(
    {
      "prod-agent": 16_000_000,
      "prod-web": 18_000_000,
      "design-agent": 4_200_000,
      "atlas-eval": 3_200_000,
      development: 2_200_000,
      "ci-runner": 850_000,
    },
    TOTAL_7D_BASE_TOKENS
  ),
};

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

export type ApiKeyRow = {
  key: string;
  label: string;
  owner: string;
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

/** Five workspace keys — matches the canonical set used on Requests
 *  (prod-web, prod-agent, development, byok-*) re-spun with the two BYOK slots
 *  given product names (openclaw, hermes-agent).
 *
 *  `spend` on the six Gate keys is the per-key 7d total of SPEND_BASE.apiKey,
 *  so the table's Spend column and the chart's breakdown panel cannot drift.
 *  The six sum to $238.05 = TOTAL_7D_BASE_DOLLARS; BYOK keys are $0 by
 *  definition (their spend lands on the user's own provider bill).
 *
 *  Resulting top-5 leaders (only 5 keys, so all show):
 *  Spend  → prod-agent, prod-web, openclaw, hermes-agent, development
 *  Requests  → prod-web, prod-agent, openclaw, development, hermes-agent
 *  Tokens  → prod-web, prod-agent, openclaw, hermes-agent, development */
export const API_KEY_ROWS: ApiKeyRow[] = [
  {
    key: "prod-web",
    label: "prod-web",
    owner: "Chad Ponticas",
    path: "Gate",
    requests: 60_000,
    tokensIn: 15_000_000,
    tokensOut: 3_000_000,
    spend: 90.04,
    savings: 0.2563,
  },
  {
    key: "prod-agent",
    label: "prod-agent",
    owner: "Chad Ponticas",
    path: "Gate",
    requests: 12_000,
    tokensIn: 15_384_615,
    tokensOut: 615_385,
    spend: 92.37,
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
    spend: 0.0,
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
    spend: 0.0,
    savings: 0.2,
  },
  {
    key: "development",
    label: "development",
    owner: "Jordan Lee",
    path: "Gate",
    requests: 15_000,
    tokensIn: 1_650_000,
    tokensOut: 550_000,
    spend: 13.2,
    savings: 0.235,
  },
  {
    key: "design-agent",
    label: "design-agent",
    owner: "Chad Ponticas",
    path: "Gate",
    requests: 13_000,
    tokensIn: 3_500_000,
    tokensOut: 700_000,
    spend: 21.0,
    savings: 0.25,
  },
  {
    key: "ci-runner",
    label: "ci-runner",
    owner: "Jordan Lee",
    path: "Gate",
    requests: 6500,
    tokensIn: 708_333,
    tokensOut: 141_667,
    spend: 1.44,
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
    spend: 0.0,
    savings: 0.225,
  },
  {
    key: "atlas-eval",
    label: "atlas-eval",
    owner: "Mateus Silva",
    path: "Gate",
    requests: 2000,
    tokensIn: 3_000_000,
    tokensOut: 200_000,
    spend: 20.0,
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
    spend: 0.0,
    savings: 0,
    revoked: true,
  },
];

/** Per-series 7d Total-saved rates for the trend chart's Savings lens —
 *  each series' OWN rate (what % of its tokens caching + compression save),
 *  NOT its share of anything. apiKey derives from API_KEY_ROWS.savings so
 *  the chart panel shows the same numbers as the table's Saved column;
 *  model / provider are authored data like the per-key rates (cache-heavy
 *  Haiku saves the most, long-context Opus the least). The chart normalizes
 *  per-series contributions (token share × rate) so the stack total stays
 *  anchored to savingsRateFor(range) regardless of these spreads. */
export const SAVINGS_RATES_7D: Record<Dimension, Record<string, number>> = {
  model: {
    sonnet: 0.25,
    gpt: 0.235,
    gemini: 0.215,
    opus: 0.19,
    llama: 0.205,
    haiku: 0.29,
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
    SPEND_SERIES.apiKey.map((s) => [
      s.key,
      API_KEY_ROWS.find((k) => k.label === s.key)?.savings ?? 0,
    ])
  ),
};

/** Chart metric lens — shared by the trend chart and the top-by-axis selectors. */
export type Metric = "tokens" | "spend";

export const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: "tokens", label: "Tokens" },
  { value: "spend", label: "Spend" },
];
