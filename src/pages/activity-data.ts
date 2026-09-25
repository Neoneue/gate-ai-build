import type { Vendor } from "@/components/icons/vendor-meta";
import { PROVIDER_META } from "@/components/icons/vendor-meta";
import { API_KEY_SEED_ROWS } from "@/data/api-keys";
import { MESSAGE_TOTALS, messageTotalFor } from "@/data/message-totals";
import { costOf, modelById, modelName, type ProviderId } from "@/data/models";
import { isByokKey, REQUEST_ROWS_ALL, requestDate } from "@/data/requests";
import { CHART_PALETTE } from "@/lib/chart-palette";
import {
  type CustomRange,
  daysInRange,
  type PresetRange,
  type Range,
  rangeWindow,
} from "@/lib/range";

export type Dimension = "model" | "provider" | "apiKey";

// Canonical 7d totals, one per KPI.
//
// Messages are not authored here. The count per range is MESSAGE_TOTALS
// (data/message-totals.ts), the Messages page hero, so Activity prints the
// same 4,860 / 468 / 48 the Messages page lists. This 7d figure is kept as a
// named export for the pages that read the week (Overview, Token savings).
// Spend and tokens are DERIVED from those messages and the real rows' cost
// and tokens per message (see "Messages, spend and tokens per key" below).
export const TOTAL_7D_BASE_REQUESTS = MESSAGE_TOTALS["7d"];

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

/** 7d reference rate for Activity's Saved column, and the divisor the
 *  per-range scaling hangs off. It was the token-weighted mean of
 *  API_KEY_ROWS.savings under the authored workload; with real-row tokens
 *  (design-agent is ~99% of them, at 0.25) that mean is ~25%, and this
 *  authored steady-state goal is kept so the Saved column does not move. */
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

/* ─── Messages, spend and tokens per key ────────────────────────────────────
 *
 * Both come off the real request rows, the same REQUEST_ROWS_ALL the Messages
 * page lists, so neither is authored here.
 *
 * Messages: a key's share of a range's MESSAGE_TOTALS is its share of those
 * rows (design-agent sent 102 of the 153, so it carries two thirds of every
 * range). Shares are settled per range so the per-key counts sum EXACTLY to
 * the range total. A key with no rows (ci-runner) sends 0, and so does a
 * revoked key in any window that opens after its last activity (the later of
 * its last real row and the Keys page's last-used date): a revoked key
 * cannot send today, so its share goes to the keys that could.
 *
 * Spend: messages times what that key's rows actually cost per message. A row
 * whose cost reads "—" is unmetered and sits out of the average. BYOK keys
 * are $0 by definition: the customer's own provider account is billed. A Gate
 * key with messages but no metered row would fall back to the workspace-wide
 * metered average; every Gate key with rows has metered rows today, so the
 * fallback is a guard, not a number anyone sees.
 *
 * Tokens: messages times the key's average tokens in and out per row, over
 * all its rows (a blocked row with "—" tokens counts as a message with none).
 * design-agent's long BYOK session averages ~190k tokens in per message, so
 * it carries almost all of the workspace's tokens.
 * ───────────────────────────────────────────────────────────────────────── */

type KeyRowStats = {
  rows: number;
  metered: number;
  cost: number;
  tokensIn: number;
  tokensOut: number;
};

/** Parse a row's token cell ("44,889"). "—" reads as 0. */
function rowTokens(cell: string): number {
  return Number.parseInt(cell.replace(/[^0-9]/g, ""), 10) || 0;
}

function sumOf(r: Record<string, number>): number {
  return Object.values(r).reduce((a, b) => a + b, 0);
}

/** Parse a row's cost cell ("$0.0120"). "—" (unmetered) returns null. */
function rowCost(cost: string): number | null {
  const n = Number.parseFloat(cost.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

const KEY_ROW_STATS: Record<string, KeyRowStats> = (() => {
  const out: Record<string, KeyRowStats> = {};
  for (const row of REQUEST_ROWS_ALL) {
    const acc = out[row.keyId] ?? {
      rows: 0,
      metered: 0,
      cost: 0,
      tokensIn: 0,
      tokensOut: 0,
    };
    acc.rows += 1;
    acc.tokensIn += rowTokens(row.inTokens);
    acc.tokensOut += rowTokens(row.outTokens);
    const cost = rowCost(row.cost);
    if (cost !== null) {
      acc.metered += 1;
      acc.cost += cost;
    }
    out[row.keyId] = acc;
  }
  return out;
})();

/** Workspace-wide average cost of one metered message, the fallback for a Gate
 *  key whose rows are all unmetered. */
const WORKSPACE_COST_PER_MESSAGE = (() => {
  const all = Object.values(KEY_ROW_STATS);
  const metered = all.reduce((a, s) => a + s.metered, 0);
  return metered > 0 ? all.reduce((a, s) => a + s.cost, 0) / metered : 0;
})();

/** What one message on `key` costs, from its own real rows. */
export function costPerMessage(key: string): number {
  if (isByokKey(key)) {
    return 0;
  }
  const stats = KEY_ROW_STATS[key];
  if (!stats || stats.metered === 0) {
    return WORKSPACE_COST_PER_MESSAGE;
  }
  return stats.cost / stats.metered;
}

export type KeyUsageAt = {
  /** Messages per key for the range; sums to messageTotalFor(range). */
  messages: Record<string, number>;
  /** Spend per key for the range: messages × costPerMessage, to the cent. */
  spend: Record<string, number>;
  /** Tokens per key for the range: messages × the key's rows' average. */
  tokensIn: Record<string, number>;
  tokensOut: Record<string, number>;
};

const KEY_USAGE_CACHE = new Map<string, KeyUsageAt>();

/** Last instant each key was active: its latest real row, or the Keys page's
 *  last-used date when that is later. */
const KEY_LAST_ACTIVE: Map<string, number> = (() => {
  const out = new Map<string, number>();
  for (const row of REQUEST_ROWS_ALL) {
    const t = requestDate(row).getTime();
    out.set(row.keyId, Math.max(out.get(row.keyId) ?? 0, t));
  }
  for (const k of API_KEY_SEED_ROWS) {
    if (k.lastUsed) {
      out.set(k.name, Math.max(out.get(k.name) ?? 0, k.lastUsed.getTime()));
    }
  }
  return out;
})();

/** True when `key` is revoked on the Keys page (the key's record) and went
 *  quiet before `from`. */
function keyRetiredBefore(key: string, from: Date): boolean {
  const record = API_KEY_SEED_ROWS.find((k) => k.name === key);
  return (
    record?.revoked === true && (KEY_LAST_ACTIVE.get(key) ?? 0) < from.getTime()
  );
}

/** Messages, spend and tokens per key for a range. Every Activity count,
 *  dollar and token reads this, so the KPIs, the key table and the
 *  breakdowns are one set of numbers. */
export function keyUsageAt(
  range: Range,
  customRange: CustomRange | null
): KeyUsageAt {
  const total = messageTotalFor(range, customRange);
  const window = rangeWindow(range, customRange);
  const cacheKey = `${total}|${window?.from.getTime() ?? "all"}`;
  const hit = KEY_USAGE_CACHE.get(cacheKey);
  if (hit) {
    return hit;
  }
  const live = Object.entries(KEY_ROW_STATS).filter(
    ([key]) => !(window && keyRetiredBefore(key, window.from))
  );
  const rowTotal = live.reduce((a, [, s]) => a + s.rows, 0) || 1;
  const messages = settle(
    Object.fromEntries(
      Object.entries(KEY_ROW_STATS).map(([key, s]) => [
        key,
        live.some(([k]) => k === key) ? (s.rows * total) / rowTotal : 0,
      ])
    ),
    0
  );
  const spend = Object.fromEntries(
    Object.entries(messages).map(([key, n]) => [
      key,
      Math.round(n * costPerMessage(key) * 100) / 100,
    ])
  );
  const perMessage = (key: string, side: "tokensIn" | "tokensOut") => {
    const s = KEY_ROW_STATS[key];
    return s && s.rows > 0 ? s[side] / s.rows : 0;
  };
  const tokens = (side: "tokensIn" | "tokensOut") =>
    Object.fromEntries(
      Object.entries(messages).map(([key, n]) => [
        key,
        Math.round(n * perMessage(key, side)),
      ])
    );
  const out = {
    messages,
    spend,
    tokensIn: tokens("tokensIn"),
    tokensOut: tokens("tokensOut"),
  };
  KEY_USAGE_CACHE.set(cacheKey, out);
  return out;
}

export type UsageAt = {
  messages: number;
  spend: number;
  tokensIn: number;
  tokensOut: number;
  tokens: number;
};

/** Messages, spend and tokens for a set of keys (null = the workspace). */
export function usageAt(
  range: Range,
  customRange: CustomRange | null,
  names: ReadonlySet<string> | null
): UsageAt {
  const at = keyUsageAt(range, customRange);
  let messages = 0;
  let spend = 0;
  let tokensIn = 0;
  let tokensOut = 0;
  for (const key of Object.keys(at.messages)) {
    if (names && !names.has(key)) {
      continue;
    }
    messages += at.messages[key] ?? 0;
    spend += at.spend[key] ?? 0;
    tokensIn += at.tokensIn[key] ?? 0;
    tokensOut += at.tokensOut[key] ?? 0;
  }
  return {
    messages,
    spend: Math.round(spend * 100) / 100,
    tokensIn,
    tokensOut,
    tokens: tokensIn + tokensOut,
  };
}

/** The real 7d week per key: what the workload below is rescaled onto. */
const KEY_WEEK = keyUsageAt("7d", null);
const KEY_SPEND_7D = KEY_WEEK.spend;

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
 * this block and the per-key spend above. Nothing here is money; it is tokens,
 * plus the two routing splits that say who ran them and where. `costOf`
 * (data/models.ts) prices that at catalog rates, and that pricing decides only
 * the SHAPE: how a key's dollars divide across models and routes. The size of
 * each key's bill is its real spend (KEY_SPEND_7D), so the catalog-priced
 * cells are rescaled per key onto it (USAGE_7D).
 *
 * Since 2026-09-25 the authored numbers here are SHAPE only. Each Gate
 * key's cells are rescaled onto that key's real week (KEY_WEEK): tokens in
 * and out by the authored token mix, spend by the catalog-priced mix. The
 * authored 73.45M Gate tokens and their $247.59 list price are gone from
 * every surface; the real rows put the Gate keys' week at ~0.49M tokens and
 * $2.38. Spend ÷ tokens per cell no longer equals the catalog per-1M rate,
 * because the two are rescaled separately.
 *
 * History. Until 2026-08-03 this file authored ~110 dollar values by hand, a
 * 3 × 7 × N matrix of daily spend, and authored the token splits separately.
 * The catalog pricing that replaced it still gives the relative costs:
 * Opus 4.7 is a small share of tokens and a large share of spend, Qwen3 Next
 * the reverse.
 *
 * The shape is a product form — per-model tokens × provider share × key share
 * — rather than a hand-written 3-way table. That is what makes all three
 * dimensions sum to the same totals on both metrics by construction rather
 * than by tuning, and it is why the cross-dimension invariant the charts rely
 * on is no longer something a future edit can quietly break.
 *
 * BYOK traffic is not in this block: the customer's own provider account is
 * billed, so Gate meters no dollars for it. Its tokens still count; they
 * enter as WORKSPACE_CELLS_7D (below) at $0, which is how Claude Opus 4.8
 * (102 of the 153 request rows, all one BYOK session) and `design-agent`
 * reach the token lens.
 */

/** One model's authored 7d Gate-metered volume, split the way the workload
 *  splits it. Only its proportions reach the page (USAGE_7D rescales each key
 *  onto its real week). Output share is the expensive half of the bill, so it
 *  is authored per model rather than assumed flat. Values carry over from
 *  MODEL_ROWS' own in/out ratios, which is where they were measured. */
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

/** The workload priced at catalog list rates (routing markup included). Only
 *  its SHAPE survives into USAGE_7D: how one key's dollars divide across
 *  models and routes. */
const CATALOG_CELLS_7D: UsageCell[] = Object.values(MODEL_SERIES_7D).flatMap(
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

/** The authored workload's 7d totals per key, the divisors that rescale each
 *  key onto its real week. */
const CATALOG_KEY_7D: Record<
  string,
  { spend: number; tokensIn: number; tokensOut: number }
> = (() => {
  const out: Record<
    string,
    { spend: number; tokensIn: number; tokensOut: number }
  > = {};
  for (const cell of CATALOG_CELLS_7D) {
    const acc = out[cell.apiKey] ?? { spend: 0, tokensIn: 0, tokensOut: 0 };
    acc.spend += cell.spend;
    acc.tokensIn += cell.tokensIn;
    acc.tokensOut += cell.tokensOut;
    out[cell.apiKey] = acc;
  }
  return out;
})();

const rescale = (value: number, real: number, authored: number) =>
  authored > 0 ? (value * real) / authored : 0;

/** Every (model, provider, key) atom of the Gate keys' 7d workload. Each
 *  key's REAL week (KEY_WEEK: its messages × its rows' averages) is spread
 *  across that key's cells in the authored proportions: tokens in and out by
 *  the authored token mix, spend by the catalog-priced mix. So a key's cells
 *  sum to what the key table shows, and the model and route splits keep the
 *  workload's shape and the catalog's relative prices. */
export const USAGE_7D: UsageCell[] = CATALOG_CELLS_7D.map((cell) => {
  const authored = CATALOG_KEY_7D[cell.apiKey];
  const tokensIn = rescale(
    cell.tokensIn,
    KEY_WEEK.tokensIn[cell.apiKey] ?? 0,
    authored?.tokensIn ?? 0
  );
  const tokensOut = rescale(
    cell.tokensOut,
    KEY_WEEK.tokensOut[cell.apiKey] ?? 0,
    authored?.tokensOut ?? 0
  );
  return {
    ...cell,
    tokensIn,
    tokensOut,
    tokens: tokensIn + tokensOut,
    spend: rescale(
      cell.spend,
      KEY_SPEND_7D[cell.apiKey] ?? 0,
      authored?.spend ?? 0
    ),
  };
});

/** Not a Gate route: the customer's own provider account. */
const BYOK_PROVIDER = "byok" as ProviderId;

/** A BYOK key's 7d cells. The provider billed it, so there are no Gate cells,
 *  but its real week is known (KEY_WEEK) and its model mix is on record in
 *  the Messages rows it sent, so its cells are that mix applied to those
 *  tokens at $0. BYOK traffic has no Gate route, so it sits out of the
 *  provider series. */
function byokCellsFor(key: string): UsageCell[] {
  if (!isByokKey(key)) {
    return [];
  }
  const perModel = new Map<string, { tokensIn: number; tokensOut: number }>();
  for (const r of REQUEST_ROWS_ALL) {
    if (r.keyId !== key) {
      continue;
    }
    const acc = perModel.get(r.model) ?? { tokensIn: 0, tokensOut: 0 };
    acc.tokensIn += rowTokens(r.inTokens);
    acc.tokensOut += rowTokens(r.outTokens);
    perModel.set(r.model, acc);
  }
  const sumIn = [...perModel.values()].reduce((a, m) => a + m.tokensIn, 0) || 1;
  const sumOut =
    [...perModel.values()].reduce((a, m) => a + m.tokensOut, 0) || 1;
  const keyIn = KEY_WEEK.tokensIn[key] ?? 0;
  const keyOut = KEY_WEEK.tokensOut[key] ?? 0;
  return [...perModel.entries()].map(([model, m]) => {
    const tokensIn = (keyIn * m.tokensIn) / sumIn;
    const tokensOut = (keyOut * m.tokensOut) / sumOut;
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

/** The whole workspace's 7d cells: the Gate workload plus every BYOK key's
 *  cells. Every per-dimension total groups THIS, so the Tokens KPI, the key
 *  table and the by-model breakdown all count the BYOK tokens the gateway
 *  proxied (design-agent's session is most of them). */
const WORKSPACE_CELLS_7D: UsageCell[] = [
  ...USAGE_7D,
  ...Object.keys(KEY_WEEK.messages).flatMap(byokCellsFor),
];

/** Group cells by a dimension. `metric` picks tokens or dollars; both come
 *  off the same cells, so a series' spend and its tokens are two readings of
 *  one fact rather than two authored numbers that happen to sit together.
 *  BYOK cells carry no Gate route, so the provider dimension skips them. */
function groupUsage(
  cells: UsageCell[],
  dimension: Dimension,
  metric: (cell: UsageCell) => number
): Record<string, number> {
  const by = DIMENSION_KEY[dimension];
  const out: Record<string, number> = {};
  for (const cell of cells) {
    if (dimension === "provider" && cell.provider === BYOK_PROVIDER) {
      continue;
    }
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

/** 7d in/out tokens per Gate-metered catalog model: MODEL_ROWS' two token
 *  columns. BYOK models are not in MODEL_ROWS (it is the metered card data). */
const MODEL_TOKENS_7D: Record<string, TokenSplit> = Object.fromEntries(
  Object.entries(splitBy((c) => c.model)).map(([k, v]) => [k, rounded(v)])
);

/** Workspace 7d INPUT tokens, every key: the prompt side of the Tokens KPI.
 *  The Token savings Summary reads the same per-key numbers for its window
 *  ("of the N input tokens you sent"): compression removes input tokens, so
 *  its rate applies to this, not to in + out. */
export const TOTAL_7D_BASE_INPUT_TOKENS = sumOf(KEY_WEEK.tokensIn);

/** 7d spend per catalog model, routing markup included. Not simply
 *  `costOf(model, in, out)`: OpenRouter bills 10% over list, so what a model
 *  actually costs depends on where its traffic was sent. Grouping the same
 *  cells that produced MODEL_TOKENS_7D is what keeps the Spend column and the
 *  token columns beside it describing one transaction. */
const MODEL_SPEND_7D: Record<string, number> = settle(
  groupUsage(USAGE_7D, "model", cellSpend),
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

const byDimension = (
  cells: UsageCell[],
  metric: (cell: UsageCell) => number,
  decimals: number
) =>
  Object.fromEntries(
    (Object.keys(DIMENSION_KEY) as Dimension[]).map((dim) => {
      const grouped = groupUsage(cells, dim, metric);
      return [
        dim,
        Object.keys(grouped).length > 0 ? settle(grouped, decimals) : grouped,
      ];
    })
  ) as Record<Dimension, Record<string, number>>;

export const SPEND_TOTALS_7D: Record<
  Dimension,
  Record<string, number>
> = byDimension(WORKSPACE_CELLS_7D, cellSpend, 2);

/** Per-series 7d *token* totals per dimension. Mirrors SPEND_TOTALS_7D and
 * shares its source rows, which is the whole point: the token distribution
 * genuinely differs in shape from the spend distribution, and now it differs
 * for the reason the page claims rather than because two arrays were authored
 * independently.
 *
 * • model → Claude Opus 4.8 (design-agent's BYOK session) is ~99% of tokens
 *   and $0 of spend. Among metered models Opus 4.7 leads both (prod-agent,
 *   the biggest real spender, sends most of it). The ratios follow catalog
 *   prices within each key; the levels are the real rows'.
 * • provider → Gate routes only (BYOK has none). Cheap tokens buy more of
 *   them, so Alibaba (DeepSeek + Qwen only, per the catalog) carries ~14% of
 *   Gate-routed tokens against about 2% of dollars.
 * • apiKey → design-agent leads tokens at $0; `prod-agent` leads spend. */
export const TOKENS_TOTALS_7D: Record<
  Dimension,
  Record<string, number>
> = byDimension(WORKSPACE_CELLS_7D, cellTokens, 0);

const sumValues = (r: Record<string, number>) =>
  Object.values(r).reduce((a, b) => a + b, 0);

/** Workspace 7d spend: the sum of every Gate key's real 7d spend (messages ×
 *  its rows' cost per message), and the 7D Total spend KPI by construction.
 *  Catalog pricing of the authored tokens put this at $247.59 until
 *  2026-09-25; the real rows bill the same week's messages far less. */
export const TOTAL_7D_BASE_DOLLARS = +sumValues(SPEND_TOTALS_7D.model).toFixed(
  2
);

/** Workspace 7d tokens, every key BYOK included: the 7D Tokens used KPI and
 *  the sum of the key table's token columns. MODEL_SERIES_7D authored
 *  73,450,000 Gate tokens until 2026-09-25; the real rows put the week at
 *  about 60M, almost all of it design-agent's BYOK session. */
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
  // Whole cents by largest remainder: floors first, then one cent to the
  // biggest fractional shares until the total is met. Rounding each bucket
  // on its own let small totals (a $0.07 day split 12 ways) overshoot and
  // leave the last bucket negative.
  const cents = Math.max(0, Math.round(total * 100));
  const quotas = weights.map((w) => (cents * w) / sumW);
  const alloc = quotas.map(Math.floor);
  let left = cents - alloc.reduce((a, b) => a + b, 0);
  const order = quotas
    .map((q, i) => ({ i, frac: q - Math.floor(q) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) {
    if (left <= 0) {
      break;
    }
    alloc[i] = (alloc[i] ?? 0) + 1;
    left -= 1;
  }
  const out = alloc.map((c) => c / 100);
  if (count < 1) {
    return [+total.toFixed(2)];
  }
  // The last bucket carries any sub-cent remainder, so the series sums to
  // `total` itself rather than to `total` rounded.
  let accumulated = 0;
  for (let i = 0; i < count - 1; i++) {
    accumulated += out[i] ?? 0;
  }
  out[count - 1] = +(total - accumulated).toFixed(2);
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

function paletteColor(slot: number): string {
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
function deviceFor(owner: string): string {
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
   *  ACTIVITY_SAVINGS_RATE_7D (24.3%) is the steady-state Activity savings
   *  goal these hang off. The Saved column and the trend
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
 *  `spend` are DERIVED: tokens from the USAGE_7D cells the trend chart
 *  groups, spend from the key's real rows (messages × cost per message,
 *  keyUsageAt), which the same cells carry. The table's Spend column and the
 *  chart's breakdown panel are the same numbers. None of it is authored.
 *
 *  Messages are derived for every key, BYOK included: the key's share of the
 *  real request rows, settled onto MESSAGE_TOTALS for the range.
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
 *  Resulting top-4 leaders (7d):
 *  Spend    → prod-agent, development, atlas-eval, prod-web
 *  Messages → design-agent, prod-agent, hermes-agent, then atlas-eval and
 *             nova-chat tied
 *  Tokens   → prod-web, prod-agent, design-agent, openclaw */
type ApiKeySeed = Omit<
  ApiKeyRow,
  "requests" | "tokensIn" | "tokensOut" | "spend" | "device"
> & {
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
    savings: 0.27,
  },
  {
    key: "openclaw",
    label: "openclaw",
    owner: "Kira Tan",
    path: "BYOK",
    savings: 0.21,
  },
  {
    key: "hermes-agent",
    label: "hermes-agent",
    owner: "Mateus Silva",
    path: "BYOK",
    savings: 0.2,
  },
  {
    key: "development",
    label: "development",
    owner: "Jordan Lee",
    path: "Gate",
    savings: 0.235,
  },
  // Its 102 request rows (conversation cnv_7a3f9e2b) are the session that
  // makes this key BYOK.
  {
    key: "design-agent",
    label: "design-agent",
    owner: "Chad Ponticas",
    path: "BYOK",
    savings: 0.25,
  },
  {
    // Revoked and never used, matching the Keys page: no Messages row
    // carries it, so every usage figure is a real zero.
    key: "ci-runner",
    label: "ci-runner",
    owner: "Jordan Lee",
    path: "Gate",
    savings: 0.19,
    revoked: true,
  },
  {
    key: "nova-chat",
    label: "nova-chat",
    owner: "Kira Tan",
    path: "BYOK",
    savings: 0.225,
  },
  {
    key: "atlas-eval",
    label: "atlas-eval",
    owner: "Mateus Silva",
    path: "Gate",
    savings: 0.285,
  },
  // Matches the Keys page's revoked test-key (sk-gw-…255e). It carries real
  // Messages rows, so it has lifetime usage; revoked, it reads 0 in any
  // window after its last row.
  {
    key: "test-key",
    label: "test-key",
    owner: "Chad Ponticas",
    path: "BYOK",
    savings: 0,
    revoked: true,
  },
];

export const API_KEY_ROWS: ApiKeyRow[] = (() => {
  // 7d messages, spend and tokens per key come from keyUsageAt (real rows,
  // settled onto MESSAGE_TOTALS["7d"]), BYOK included: the gateway proxied
  // every one of those messages even when the provider billed it. The columns
  // sum to the 7D KPIs. Other ranges read keyUsageAt directly rather than
  // scaling these.
  const week = keyUsageAt("7d", null);
  return API_KEY_SEEDS.map((seed) => ({
    ...seed,
    device: seed.device ?? deviceFor(seed.owner),
    requests: week.messages[seed.key] ?? 0,
    tokensIn: week.tokensIn[seed.key] ?? 0,
    tokensOut: week.tokensOut[seed.key] ?? 0,
    spend: seed.path === "BYOK" ? 0 : (SPEND_TOTALS_7D.apiKey[seed.key] ?? 0),
  }));
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
 *  `requests` is shaped by each model's authored call size and settled onto
 *  the Gate keys' real 7d messages (GATE_MESSAGES_7D), so the card sums to the
 *  metered part of the Total messages KPI. BYOK messages are not in this
 *  card, for the same reason BYOK spend is not.
 *
 *  Resulting top-4 leaders:
 *    Spend     → Opus 4.7, Gemini 3.1 Pro, Sonnet 5, Haiku 4.5
 *    Requests  → Haiku 4.5, Sonnet 5, Gemini 3.1 Pro, DeepSeek V4 Pro
 *    Tokens    → Sonnet 5, Qwen3 Next, Haiku 4.5, Gemini 3.1 Pro
 *
 *  Read the Spend and Tokens rows against each other: Qwen3 Next is second on
 *  volume and near the bottom on money, Opus 4.7 is second-to-last on volume
 *  and first on money. That contrast is the card's entire job; it comes from
 *  catalog prices splitting each key's real spend.
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

/** 7d messages on Gate keys only. The Top Models card covers metered
 *  traffic, so its requests settle onto this, not onto the BYOK-inclusive
 *  MESSAGE_TOTALS. */
const GATE_MESSAGES_7D = API_KEY_ROWS.filter((k) => k.path === "Gate").reduce(
  (a, k) => a + k.requests,
  0
);

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
        (v * GATE_MESSAGES_7D) / rawTotal,
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
 *  • BYOK keys and models are candidates (design-agent, Claude Opus 4.8 from
 *    the BYOK session cnv_7a3f9e2b). They lead the TOKEN lens and drop off
 *    the SPEND lens, where they are $0, like any zero series.
 *  • Alibaba is a hairline on the SPEND lens (about 2%) because the catalog
 *    only lets it serve DeepSeek and Qwen, the two cheapest models in the
 *    fleet. Toggle to TOKENS and the same route is ~14% of Gate-routed
 *    tokens. That contrast is the finding; do not "fix" it by inventing spend
 *    for it. */
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
 *  `settle` rounds them to the cent (DeepSeek and Qwen both land on $0.07 on
 *  the 7d spend lens), and pool order then decides. */
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
 * A Manager or Member reads the workload their OWN keys produced: the same
 * WORKSPACE_CELLS_7D the org totals group (Gate cells plus BYOK cells at $0),
 * filtered to their keys. */

export type UsageTotals = Record<Dimension, Record<string, number>>;

/** Spend and token totals per dimension for the keys in `names`; the org's
 *  own SPEND_TOTALS_7D / TOKENS_TOTALS_7D when `names` is null. */
export function scopedUsageTotals(names: Set<string> | null): {
  spend: UsageTotals;
  tokens: UsageTotals;
} {
  if (names === null) {
    return { spend: SPEND_TOTALS_7D, tokens: TOKENS_TOTALS_7D };
  }
  const cells = WORKSPACE_CELLS_7D.filter((c) => names.has(c.apiKey));
  return {
    spend: byDimension(cells, cellSpend, 2),
    tokens: byDimension(cells, cellTokens, 0),
  };
}

/** Spread `totals` onto `target` in proportion, rounded to `decimals`, with
 *  the largest series absorbing the rounding so the parts sum to `target`
 *  exactly. */
function settleOnto(
  totals: Record<string, number>,
  target: number,
  decimals: number
): Record<string, number> {
  const sum = sumValues(totals);
  if (sum <= 0 || target <= 0) {
    return Object.fromEntries(Object.keys(totals).map((k) => [k, 0]));
  }
  return settle(
    Object.fromEntries(
      Object.entries(totals).map(([k, v]) => [k, (v * target) / sum])
    ),
    decimals
  );
}

/** One metric's per-series totals for a range, in every dimension, for the
 *  keys in `names` (null = the workspace). `apiKey` is each key's own number
 *  for the range (keyUsageAt); `model` and `provider` keep the 7d cells'
 *  shape, settled onto the range total. Provider covers Gate routes only, so
 *  it settles onto the Gate keys' part (all of spend; tokens minus BYOK). */
function totalsAt(
  metric: "spend" | "tokens",
  range: Range,
  customRange: CustomRange | null,
  names: Set<string> | null
): UsageTotals {
  const at = keyUsageAt(range, customRange);
  const week = scopedUsageTotals(names)[metric];
  const decimals = metric === "spend" ? 2 : 0;
  const perKey = (key: string) =>
    metric === "spend"
      ? (at.spend[key] ?? 0)
      : (at.tokensIn[key] ?? 0) + (at.tokensOut[key] ?? 0);
  let total = 0;
  let gate = 0;
  for (const key of Object.keys(at.messages)) {
    if (names && !names.has(key)) {
      continue;
    }
    total += perKey(key);
    gate += isByokKey(key) ? 0 : perKey(key);
  }
  const round = (n: number) => +n.toFixed(decimals);
  return {
    model: settleOnto(week.model, round(total), decimals),
    provider: settleOnto(week.provider, round(gate), decimals),
    apiKey: Object.fromEntries(
      Object.keys(week.apiKey).map((k) => [k, perKey(k)])
    ),
  };
}

/** Spend per series for a range: sums to that range's Total spend KPI in
 *  every dimension, so the trend chart, its breakdown panel, the Top cards
 *  and the key table agree. */
export function spendTotalsAt(
  range: Range,
  customRange: CustomRange | null,
  names: Set<string> | null
): UsageTotals {
  return totalsAt("spend", range, customRange, names);
}

/** Tokens per series for a range: `model` and `apiKey` sum to that range's
 *  Tokens used KPI; `provider` sums to its Gate-routed part (BYOK tokens have
 *  no Gate route to chart). */
export function tokensTotalsAt(
  range: Range,
  customRange: CustomRange | null,
  names: Set<string> | null
): UsageTotals {
  return totalsAt("tokens", range, customRange, names);
}
