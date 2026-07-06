import { CHART_PALETTE } from "@/lib/chart-palette";

export type Dimension = "model" | "provider" | "apiKey";

// Canonical 7d totals — single source of truth for each KPI. Every range's
// value AND sparkline shape are computed from these × effectiveScale, so
// the KPIs reconcile with the underlying data and the spark shapes reflect
// real per-bucket variation rather than hand-drawn arrays.
export const TOTAL_7D_BASE_DOLLARS = 238;
export const TOTAL_7D_BASE_REQUESTS = 63_793;
export const TOTAL_7D_BASE_TOKENS = 73_450_000;

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
    { key: "haiku", label: "Claude Haiku", slot: 3 },
  ],
  provider: [
    { key: "anthropic", label: "Anthropic", slot: 2 },
    { key: "openai", label: "OpenAI", slot: 1 },
    { key: "google", label: "Google", slot: 4 },
    { key: "bedrock", label: "Bedrock", slot: 7 },
    { key: "openrouter", label: "OpenRouter", slot: 6 },
  ],
  apiKey: [
    { key: "prod-agent", label: "prod-agent", slot: 1 },
    { key: "prod-web", label: "prod-web", slot: 2 },
    { key: "staging-web", label: "staging-web", slot: 3 },
    { key: "atlas-eval", label: "atlas-eval", slot: 4 },
    { key: "development", label: "development", slot: 5 },
    { key: "ci-runner", label: "ci-runner", slot: 6 },
  ],
};

/** Base (7d) chart data. Other ranges derive from this by scaling values and
 * relabeling the x-axis. Mock-realistic, not aggregated.
 *
 * INVARIANT: every dimension's 7d row sums equal $927 — this is the
 * canonical workspace 7d spend. The Total Spend KPI is computed from this
 * base × the active range's effectiveScale, so chart and KPI cannot drift.
 * If you change any row, verify the per-dimension total still equals 238. */
export const SPEND_BASE: Record<Dimension, Array<Record<string, number>>> = {
  // Gate-only — BYOK spend isn't tracked. Per-dimension 7d sums all equal
  // $238 so toggling Model / Provider / API key keeps the same workspace
  // total (and that total = the Total Spend KPI by construction).
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
  provider: [
    {
      anthropic: 12.84,
      openai: 4.88,
      google: 3.08,
      bedrock: 2.57,
      openrouter: 1.54,
    },
    {
      anthropic: 14.89,
      openai: 5.39,
      google: 3.59,
      bedrock: 2.82,
      openrouter: 1.8,
    },
    {
      anthropic: 15.92,
      openai: 5.91,
      google: 3.34,
      bedrock: 3.34,
      openrouter: 2.05,
    },
    {
      anthropic: 17.2,
      openai: 5.91,
      google: 4.11,
      bedrock: 3.59,
      openrouter: 2.57,
    },
    {
      anthropic: 18.74,
      openai: 6.68,
      google: 4.62,
      bedrock: 4.11,
      openrouter: 3.08,
    },
    {
      anthropic: 20.28,
      openai: 7.19,
      google: 4.88,
      bedrock: 4.62,
      openrouter: 3.34,
    },
    {
      anthropic: 21.31,
      openai: 7.45,
      google: 5.39,
      bedrock: 4.88,
      openrouter: 4.11,
    },
  ],
  // Per-key 7d sums match the Gate rows in API_KEY_ROWS:
  // prod-agent 92.31, prod-web 90.00, staging-web 21.00, atlas-eval 20.00,
  // dev 13.20, ci-runner 1.42. Total ≈ $238.
  apiKey: [
    {
      "prod-agent": 10.36,
      "prod-web": 10.29,
      "staging-web": 2.53,
      "atlas-eval": 2.38,
      dev: 1.72,
      "ci-runner": 0.16,
    },
    {
      "prod-agent": 11.93,
      "prod-web": 11.45,
      "staging-web": 2.53,
      "atlas-eval": 2.38,
      dev: 1.72,
      "ci-runner": 0.16,
    },
    {
      "prod-agent": 12.61,
      "prod-web": 12.39,
      "staging-web": 2.9,
      "atlas-eval": 2.86,
      dev: 1.72,
      "ci-runner": 0.16,
    },
    {
      "prod-agent": 13.06,
      "prod-web": 12.86,
      "staging-web": 2.9,
      "atlas-eval": 2.86,
      dev: 1.72,
      "ci-runner": 0.16,
    },
    {
      "prod-agent": 13.73,
      "prod-web": 13.32,
      "staging-web": 3.26,
      "atlas-eval": 2.86,
      dev: 1.72,
      "ci-runner": 0.16,
    },
    {
      "prod-agent": 14.63,
      "prod-web": 14.03,
      "staging-web": 3.26,
      "atlas-eval": 3.33,
      dev: 2.3,
      "ci-runner": 0.32,
    },
    {
      "prod-agent": 15.99,
      "prod-web": 15.66,
      "staging-web": 3.62,
      "atlas-eval": 3.33,
      dev: 2.3,
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
 * to $927. */
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
 * • provider → authored to mirror the model breakdown's vendor
 * groupings (anthropic carries opus+sonnet+haiku token
 * volume; openai/google/bedrock pick up the rest). */
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
  // Provider splits mirror MODEL_ROWS vendor groupings: anthropic =
  // opus+sonnet+haiku, openai = gpt, google = gemini, bedrock = llama,
  // openrouter gets a small residual slice.
  provider: rescaleToTotal(
    {
      anthropic: 12_350_000,
      openai: 2_860_000,
      google: 4_050_000,
      bedrock: 4_840_000,
      openrouter: 400_000,
    },
    TOTAL_7D_BASE_TOKENS
  ),
  // API_KEY_ROWS (tokensIn + tokensOut) for the 6 charted Gate keys:
  // prod-web 18_000_000, prod-agent 16_000_000, staging-web 4_200_000,
  // atlas-eval 3_200_000, dev 2_200_000, ci-runner 850_000.
  apiKey: rescaleToTotal(
    {
      "prod-agent": 16_000_000,
      "prod-web": 18_000_000,
      "staging-web": 4_200_000,
      "atlas-eval": 3_200_000,
      dev: 2_200_000,
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
};

/** Five workspace keys — matches the canonical set used on Requests
 *  (prod-web, prod-agent, dev, byok-*) re-spun with the two BYOK slots
 *  given product names (openclaw, hermes-agent). Sums reconcile with the
 *  7d KPI rail: $1,247.82 spend, 48,293 requests, 18.4M tokens.
 *
 *  Resulting top-5 leaders (only 5 keys, so all show):
 *  Spend  → prod-agent, prod-web, openclaw, hermes-agent, dev
 *  Requests  → prod-web, prod-agent, openclaw, dev, hermes-agent
 *  Tokens  → prod-web, prod-agent, openclaw, hermes-agent, dev */
export const API_KEY_ROWS: ApiKeyRow[] = [
  {
    key: "prod-web",
    label: "prod-web",
    owner: "Chad Ponticas",
    path: "Gate",
    requests: 60_000,
    tokensIn: 15_000_000,
    tokensOut: 3_000_000,
    spend: 90.0,
  },
  {
    key: "prod-agent",
    label: "prod-agent",
    owner: "Chad Ponticas",
    path: "Gate",
    requests: 12_000,
    tokensIn: 15_384_615,
    tokensOut: 615_385,
    spend: 92.31,
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
  },
  {
    key: "staging-web",
    label: "staging-web",
    owner: "Chad Ponticas",
    path: "Gate",
    requests: 13_000,
    tokensIn: 3_500_000,
    tokensOut: 700_000,
    spend: 21.0,
  },
  {
    key: "ci-runner",
    label: "ci-runner",
    owner: "Jordan Lee",
    path: "Gate",
    requests: 6500,
    tokensIn: 708_333,
    tokensOut: 141_667,
    spend: 1.42,
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
  },
  {
    key: "test-key",
    label: "test-key",
    owner: "Mateus Silva",
    path: "BYOK",
    requests: 2800,
    tokensIn: 4_571_429,
    tokensOut: 228_571,
    spend: 0.0,
  },
];

/** Chart metric lens — shared by the trend chart and the top-by-axis selectors. */
export type Metric = "tokens" | "spend";

export const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: "tokens", label: "Tokens" },
  { value: "spend", label: "Spend" },
];
