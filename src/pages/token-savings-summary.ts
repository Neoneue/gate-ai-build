// Token savings — the Summary card's model. One function turns the page's
// range + the two savings switches + the plan into every figure, share and
// state flag the card renders, so the card itself holds no arithmetic.
//
// Every number derives from data the rest of the site already shows:
//   • rates       — KPI_BY_RANGE (the three Overview tiles). Removed tokens =
//                   the Compression tile's rate × input tokens sent; requests
//                   answered from cache = the Caching tile's rate × requests.
//                   Dividing a figure by its denominator gives the tile back
//                   exactly, so the card and the rail cannot disagree.
//   • denominators — TOTAL_7D_BASE_INPUT_TOKENS and TOTAL_7D_BASE_REQUESTS
//                   (activity-data.ts) × RANGE_SCALE, the same scaling every
//                   other page uses for a window.
//   • the breakdown — two levels on ONE named basis, Gate-attributed savings
//                   as the Total saved tile reports it (Total = Caching +
//                   Compression, token-savings-data.ts). Compression and
//                   Gate cache hits are the two tile rates over the total;
//                   the compression mechanisms split compression's share, so
//                   every printed percentage in the block sums to 100.0%.
//                   Parent ticket: "compression against Gate cache hits, and
//                   the leading compression passes inside that".
//
// The ONE authored fiction, single-sourced here: how compression's removal
// splits across its mechanisms (PASS_WEIGHTS). PLACEHOLDER: the gateway
// measures this per org and the mock has no per-mechanism telemetry, so the
// split is a weight table over the names the Compression card already lists
// (BenefitList), awaiting a real source. Nothing else is hand-authored.

import { DEMO_TODAY } from "@/lib/demo-clock";
import { formatCompactCount, formatDate, formatNumber } from "@/lib/formatters";
import {
  type CustomRange,
  daysInRange,
  type PresetRange,
  RANGE_SCALE,
  type Range,
} from "@/lib/range";
import {
  TOTAL_7D_BASE_INPUT_TOKENS,
  TOTAL_7D_BASE_REQUESTS,
} from "@/pages/activity-data";
import { KPI_BY_RANGE } from "@/pages/token-savings-data";

export type SummaryPlan = "pro" | "free";

/* ─── Calendar constants ───────────────────────────────────────────────── */

/** Days each preset window covers. `all` is the mock workspace's lifetime:
 *  RANGE_SCALE.all is 8.5 weeks ≈ 60 days (lib/range.ts). */
const PRESET_DAYS: Record<PresetRange, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  all: Math.round(RANGE_SCALE.all * 7),
};

function daysBefore(anchor: Date, days: number): Date {
  const d = new Date(anchor);
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Comparability epoch: compression changed substantially on the first day
 *  of the lifetime window, so nothing earlier is comparable and the All range
 *  starts here. Derived from the demo clock like every other mock date. */
export const COMPARABILITY_EPOCH: Date = daysBefore(
  DEMO_TODAY,
  PRESET_DAYS.all - 1
);

/** Per-pass attribution start: from this day the gateway records WHICH pass
 *  removed each token. Windows that reach further back still have exact
 *  totals but only a partial per-pass breakdown. 25 days back sits inside the
 *  30D window, so All and 30D read partial and 7D / 24H read complete. */
export const ATTRIBUTION_START: Date = daysBefore(DEMO_TODAY, 25);

/** Below this many requests a per-pass split is noise; the card keeps the two
 *  mechanism bars and says why the passes are missing. */
export const LOW_VOLUME_REQUESTS = 1000;

/* ─── Pass weights (the authored fiction) ──────────────────────────────── */

export type PassId =
  | "dedup"
  | "tool-output"
  | "tool-def"
  | "prose"
  | "wrapper"
  | "json"
  | "lossless"
  | "blobs";

type PassSeed = {
  id: PassId;
  /** Exactly the title BenefitList shows on the Compression card. */
  label: string;
  /** Share of compression's removal, Pro plan. Sums to 1. */
  weight: number;
  tier: "pro" | "free";
};

const PASS_WEIGHTS: PassSeed[] = [
  {
    id: "dedup",
    label: "Cross-conversation de-duplication",
    weight: 0.46,
    tier: "pro",
  },
  {
    id: "tool-output",
    label: "Tool-output compaction",
    weight: 0.27,
    tier: "pro",
  },
  {
    id: "tool-def",
    label: "Tool-definition slimming",
    weight: 0.09,
    tier: "pro",
  },
  { id: "prose", label: "Prose trimming", weight: 0.06, tier: "pro" },
  {
    id: "wrapper",
    label: "Strips wrapper and clutter",
    weight: 0.05,
    tier: "free",
  },
  { id: "json", label: "JSON tidy", weight: 0.03, tier: "free" },
  { id: "lossless", label: "Lossless clean-up", weight: 0.03, tier: "free" },
  { id: "blobs", label: "Trims giant blobs", weight: 0.01, tier: "free" },
];

/** Passes the plan runs, weights renormalised so they sum to 1. Free runs the
 *  Basic lane only. */
export function passesForPlan(plan: SummaryPlan): PassSeed[] {
  const passes =
    plan === "pro"
      ? PASS_WEIGHTS
      : PASS_WEIGHTS.filter((p) => p.tier === "free");
  const total = passes.reduce((s, p) => s + p.weight, 0);
  return passes.map((p) => ({ ...p, weight: p.weight / total }));
}

/* ─── Window resolution ────────────────────────────────────────────────── */

export type SummaryWindow = {
  from: Date;
  to: Date;
  /** Multiplier on the 7d base totals (lib/range RANGE_SCALE semantics). */
  scale: number;
  /** The custom range began before the epoch and was cut to it. */
  clamped: boolean;
  /** The window lies entirely outside the data (before the epoch or after
   *  today): nothing passed through Gate in it. */
  empty: boolean;
  /** Which tile set the rates come from. Custom reads All, like Overview. */
  rateRange: PresetRange;
};

export function resolveWindow(
  range: Range,
  customRange: CustomRange | null
): SummaryWindow {
  if (range !== "custom" || !customRange) {
    const preset: PresetRange = range === "custom" ? "all" : range;
    return {
      from: daysBefore(DEMO_TODAY, PRESET_DAYS[preset] - 1),
      to: DEMO_TODAY,
      scale: RANGE_SCALE[preset],
      clamped: false,
      empty: false,
      rateRange: preset,
    };
  }
  const to = new Date(customRange.to);
  to.setHours(0, 0, 0, 0);
  const requested = new Date(customRange.from);
  requested.setHours(0, 0, 0, 0);
  const clamped = requested.getTime() < COMPARABILITY_EPOCH.getTime();
  const from = clamped ? COMPARABILITY_EPOCH : requested;
  const empty =
    to.getTime() < COMPARABILITY_EPOCH.getTime() ||
    requested.getTime() > DEMO_TODAY.getTime() ||
    from.getTime() > to.getTime();
  return {
    from,
    to,
    scale: empty ? 0 : daysInRange({ from, to }) / 7,
    clamped,
    empty,
    rateRange: "all",
  };
}

/* ─── Model ────────────────────────────────────────────────────────────── */

export type SummaryBar = {
  id: string;
  label: string;
  /** Share of the basis, one decimal, as the card prints it ("89.7%"). */
  shareLabel: string;
  /** Same share as a number 0–100, for the meter's aria-valuenow. */
  share: number;
  /** Tokens this bar stands for (the meter's plain-language alternative). */
  tokens: number;
};

export type SummaryMechanism = SummaryBar & {
  id: "compression" | "cache";
  /** Data-bar fill class per design.md "Data bars & meters". */
  fill: string;
  /** The mechanism's switch is off: no bar, the card names what is off. */
  off: boolean;
  /** Compression's mechanisms as shares of the same basis; empty for cache,
   *  when compression is off, or when the window is low volume. */
  passes: SummaryBar[];
};

export type SummaryModel = {
  plan: SummaryPlan;
  window: SummaryWindow;
  /** Header subtitle, prose: "All time" / "Last 7 days, Sep 10 to Sep 16, 2026". */
  periodLabel: string;
  /** Lede opener: "Since Jul 19, 2026" / "In the last 7 days" / "Between …". */
  periodPhrase: string;
  /** Nothing passed through Gate in the window. */
  noTraffic: boolean;
  compressionOff: boolean;
  cachingOff: boolean;
  /** Both switches off: nothing to attribute. */
  bothOff: boolean;
  /** Window reaches before ATTRIBUTION_START: passes are a partial reading. */
  partial: boolean;
  /** Under LOW_VOLUME_REQUESTS: mechanism bars only, passes hidden. */
  lowVolume: boolean;
  requests: number;
  inputTokensSent: number;
  inputTokensRemoved: number;
  cacheAnswered: number;
  /** Rate strings copied from the tiles, so the denominators reconcile. */
  compressionRateLabel: string;
  cachingRateLabel: string;
  /** Ranked by measured contribution: Compression and Gate cache hits as
   *  shares of Gate-attributed savings (the Total saved tile). */
  mechanisms: SummaryMechanism[];
};

/** Data-bar fills per design.md "Data bars & meters": each mechanism takes
 *  its own Overview tile's chart colour (KPI_COLORS, token-savings-data.ts). */
const MECHANISM_FILL = {
  compression: "bg-gradient-to-r from-chart-7 to-chart-7-soft",
  cache: "bg-gradient-to-r from-chart-3 to-chart-3-soft",
} as const;

/** Largest-remainder split of `totalTenths` across `weights`, so the parts
 *  printed at one decimal sum to the whole exactly. */
export function allocateTenths(
  totalTenths: number,
  weights: number[]
): number[] {
  const raw = weights.map((w) => totalTenths * w);
  const floors = raw.map(Math.floor);
  let remainder = totalTenths - floors.reduce((s, n) => s + n, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - floors[i] }))
    .sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (remainder <= 0) {
      break;
    }
    floors[i] += 1;
    remainder -= 1;
  }
  return floors;
}

const tenthsLabel = (tenths: number) => `${(tenths / 10).toFixed(1)}%`;

function periodCopy(
  range: Range,
  w: SummaryWindow
): { label: string; phrase: string } {
  // Prose, not data: the card prints this as a sentence in the copy voice.
  // On All and on a clamped custom range the epoch note supplies the date,
  // so the label does not repeat it.
  const span = `${formatDate(w.from, { month: "short", day: "numeric" })} to ${formatDate(w.to)}`;
  if (range === "all") {
    return { label: "All time", phrase: `Since ${formatDate(w.from)}` };
  }
  if (range === "24h") {
    return {
      label: `Last 24 hours, ${formatDate(w.to)}`,
      phrase: "In the last 24 hours",
    };
  }
  if (range === "7d" || range === "30d") {
    const days = PRESET_DAYS[range];
    return {
      label: `Last ${days} days, ${span}`,
      phrase: `In the last ${days} days`,
    };
  }
  return {
    label: span,
    phrase: `Between ${formatDate(w.from, { month: "short", day: "numeric" })} and ${formatDate(w.to)}`,
  };
}

export function summaryFor(
  range: Range,
  customRange: CustomRange | null,
  options: {
    compressionOn: boolean;
    cachingOn: boolean;
    plan: SummaryPlan;
    /** False for a workspace nothing has passed through yet (the Default
     *  twin): every window is then a no-traffic window. */
    hasTraffic?: boolean;
  }
): SummaryModel {
  const resolved = resolveWindow(range, customRange);
  const window: SummaryWindow =
    options.hasTraffic === false
      ? { ...resolved, scale: 0, empty: true }
      : resolved;
  const { label: periodLabel, phrase: periodPhrase } = periodCopy(
    range,
    window
  );

  const [totalTile, cachingTile, compressionTile] =
    KPI_BY_RANGE[window.rateRange];
  const compressionOff = !options.compressionOn;
  const cachingOff = !options.cachingOn;
  const compressionRate = compressionOff
    ? 0
    : Number(compressionTile.value) / 100;
  const cachingRate = cachingOff ? 0 : Number(cachingTile.value) / 100;

  const requests = Math.round(TOTAL_7D_BASE_REQUESTS * window.scale);
  const inputTokensSent = Math.round(TOTAL_7D_BASE_INPUT_TOKENS * window.scale);
  const inputTokensRemoved = Math.round(compressionRate * inputTokensSent);
  const cacheAnswered = Math.round(cachingRate * requests);

  const noTraffic = window.empty || requests === 0;
  const partial =
    !noTraffic && window.from.getTime() < ATTRIBUTION_START.getTime();
  const lowVolume = !noTraffic && requests < LOW_VOLUME_REQUESTS;

  // Level one: the two tile rates over the Total saved tile, in tenths so the
  // printed one-decimal shares sum to exactly 100.0. An off mechanism reads
  // 0 and the other takes the whole; both off is nothing to attribute.
  const compressionPoints = compressionOff ? 0 : Number(compressionTile.value);
  const cachingPoints = cachingOff ? 0 : Number(cachingTile.value);
  const totalPoints = compressionPoints + cachingPoints;
  const [compressionTenths, cacheTenths] =
    totalPoints > 0
      ? allocateTenths(1000, [
          compressionPoints / totalPoints,
          cachingPoints / totalPoints,
        ])
      : [0, 0];
  // Level two: compression's tenths split across its mechanisms, same basis.
  const seeds = passesForPlan(options.plan);
  const passTenths = allocateTenths(
    compressionTenths,
    seeds.map((p) => p.weight)
  );
  const passes: SummaryBar[] = seeds
    .map((p, i) => ({
      id: p.id,
      label: p.label,
      share: passTenths[i] / 10,
      shareLabel: tenthsLabel(passTenths[i]),
      tokens: Math.round(inputTokensRemoved * p.weight),
    }))
    .sort((a, b) => b.share - a.share);
  const compression: SummaryMechanism = {
    id: "compression",
    label: "Compression",
    share: compressionTenths / 10,
    shareLabel: tenthsLabel(compressionTenths),
    tokens: inputTokensRemoved,
    fill: MECHANISM_FILL.compression,
    off: compressionOff,
    passes: compressionOff || lowVolume ? [] : passes,
  };
  const cache: SummaryMechanism = {
    id: "cache",
    label: "Gate cache hits",
    share: cacheTenths / 10,
    shareLabel: tenthsLabel(cacheTenths),
    // Token magnitude of the cache share on the same basis as compression.
    tokens:
      totalPoints > 0
        ? Math.round(
            (inputTokensSent * Number(totalTile.value)) / 100 -
              inputTokensRemoved
          )
        : 0,
    fill: MECHANISM_FILL.cache,
    off: cachingOff,
    passes: [],
  };
  // Ranked by measured contribution; an off mechanism sinks to the bottom.
  const mechanisms = [compression, cache].sort((a, b) => b.share - a.share);

  return {
    plan: options.plan,
    window,
    periodLabel,
    periodPhrase,
    noTraffic,
    compressionOff,
    cachingOff,
    bothOff: compressionOff && cachingOff,
    partial,
    lowVolume,
    requests,
    inputTokensSent,
    inputTokensRemoved,
    cacheAnswered,
    compressionRateLabel: `${compressionTile.value}%`,
    cachingRateLabel: `${cachingTile.value}%`,
    mechanisms,
  };
}

/* ─── Copy ─────────────────────────────────────────────────────────────── */

/** Every sentence the card prints, so the copy lives in one place and the
 *  test can assert the ticket's wording. Tokens use the KPI compact form
 *  (41.2M); requests print in full. */
/** The lede split around its two figures, so the card can set them in
 *  `<strong>` without owning a word of the sentence. Joining the parts with
 *  no separator reproduces `SUMMARY_COPY.lede` exactly, which is how the
 *  string stays single-sourced: `[before, figure, middle, figure, after]`. */
export function ledeParts(
  m: SummaryModel
): [string, string, string, string, string] {
  return [
    `${m.periodPhrase}, Gate removed `,
    formatCompactCount(m.inputTokensRemoved),
    " input tokens from your prompts before they reached a provider and answered ",
    formatNumber(m.cacheAnswered),
    " requests from its own cache without calling one.",
  ];
}

export const SUMMARY_COPY = {
  title: "Summary",
  subtitle:
    "What Gate did to earn the rates above, over the period selected in Overview.",
  lede: (m: SummaryModel) => ledeParts(m).join(""),
  removed: {
    label: "Input tokens removed",
    denominator: (m: SummaryModel) =>
      `${m.compressionRateLabel} of the ${formatCompactCount(m.inputTokensSent)} input tokens you sent`,
    off: "Compression was off for this window, so nothing was removed.",
  },
  cached: {
    label: "Requests answered from Gate's cache",
    denominator: (m: SummaryModel) =>
      `${m.cachingRateLabel} of ${formatNumber(m.requests)} requests`,
    off: "Caching was off for this window, so every request went to a provider.",
  },
  breakdown: {
    title: "Where the savings came from",
    basis:
      "Share of Gate-attributed savings, as the Total saved tile reports it.",
    compressionOff:
      "Compression is off, so no tokens were removed in this window.",
    cachingOff:
      "Caching is off, so no requests were answered from Gate's cache in this window.",
    bothOff:
      "Both savings options are off, so nothing was saved in this window. Turn one on below and this breakdown fills in.",
    partial: `Gate began recording which mechanism removed each token on ${formatDate(ATTRIBUTION_START)}. Earlier traffic counts in the totals above but not in this breakdown.`,
    lowVolume: `Fewer than ${formatNumber(LOW_VOLUME_REQUESTS)} requests in this window, too few to break down.`,
    /** Plain-language alternative for a bar (aria-label): what it stands for. */
    barAlt: (bar: SummaryBar) =>
      `${bar.label}: ${bar.shareLabel} of Gate-attributed savings, about ${formatCompactCount(bar.tokens)} tokens`,
  },
  noTraffic: {
    title: "Nothing passed through Gate in this window",
    body: "There are no savings to report. Pick a longer range, or send a request through a Gate key.",
  },
  exclusion: {
    lead: "What this figure leaves out",
    body: "Discounts your provider grants for its own prompt caching are not counted here, whether or not Gate injected the cache markers that earned them, and neither is any traffic that did not route through Gate. This is only Gate's part.",
  },
} as const;
