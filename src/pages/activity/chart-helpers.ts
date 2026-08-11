/**
 * Shared chart helpers for the Activity page: bucket/axis math for the trend
 * chart's x-axis, and the compact number formatters. Used by both Activity
 * (KPI rail + top-by-axis tables) and TrendCard.
 *
 * Layout geometry — margin, Y-axis reserve, tick type, pane/plot width and the
 * X-label stride — is NOT here: it lives in `@/components/ui/chart-geometry`,
 * because Overview's chart card has to read exactly the same numbers. This
 * file owns what is genuinely Activity's: how many buckets a range has, how
 * they fold as the column narrows, and how they are labelled.
 */
import {
  CHART_MARGIN,
  CHART_Y_AXIS_WIDTH,
  getChartPlotWidth,
} from "@/components/ui/chart-geometry";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatTime,
} from "@/lib/formatters";
import {
  type CustomRange,
  daysInRange,
  type PresetRange,
  type Range,
} from "@/lib/range";

export const BUCKET_COUNTS: Record<PresetRange, number> = {
  "24h": 12,
  "7d": 7,
  "30d": 30,
  all: 30,
};

export function getBucketCount(
  range: Range,
  customRange: CustomRange | null
): number {
  if (range === "custom" && customRange) {
    const days = daysInRange(customRange);
    return Math.max(7, Math.min(30, days));
  }
  return BUCKET_COUNTS[range === "custom" ? "7d" : range];
}

/** Bar-density ladder, keyed to the CONTENT COLUMN's inline size — the same
 *  number the `@` container variants read, so these thresholds line up with
 *  the `@2xl` / `@4xl` breakpoints already used in TrendCard's markup.
 *
 *  The rule is deliberately SUBLINEAR: as the column narrows the bar count
 *  drops faster than the width does, so each step down is visibly chunkier
 *  rather than merely proportional. A fixed pitch ÷ width divide would hold
 *  density constant and only vary the count, which is not what a narrow
 *  column wants.
 *
 *  Ordered widest-first; the first tier whose `minWidth` the column clears
 *  wins. `maxBars: Infinity` means "no ladder cap — draw every bucket".
 *
 *  INVARIANT: bar count is monotonically non-decreasing in column width. A
 *  narrower column must never render more bars than a wider one. Asserted
 *  over a full width sweep in chart-helpers.test.ts. */
export const BAR_DENSITY_TIERS: readonly {
  minWidth: number;
  maxBars: number;
}[] = [
  // Full detail. 1024 rather than a tighter bound so the two states that must
  // stay byte-identical — 1440 and 1920 with the Ask AI panel closed, whose
  // columns measure 1156px and 1636px — clear it with room to spare instead
  // of by a few pixels of sidebar state.
  { minWidth: 1024, maxBars: Number.POSITIVE_INFINITY },
  // Roomy but not full: the panel-open desktop band and the widest tablets.
  { minWidth: 672, maxBars: 15 },
  // Narrow column — the mobile header treatment starts here too (@2xl).
  { minWidth: 448, maxBars: 10 },
  // Tightest column we render: the Ask AI panel open at a 1024 viewport.
  // 7 is load-bearing in both directions. Downward: it folds the 30-bucket
  // ranges by 5 (→ 6 equal bars) and the 12-bucket 24h range by 2 (→ 6),
  // both EVEN, so no group is short and no final bar draws a cliff that is
  // not in the data. Upward: the 7-bucket 7d range clears it untouched — 7
  // bars are already legible in any column we render, and folding them to 4
  // would be aggregation for its own sake.
  { minWidth: 0, maxBars: 7 },
];

/** Legibility backstop only (invariant 4): the ladder above is the primary
 *  rule, and this just catches pathological columns the ladder never
 *  anticipated. Smallest horizontal slot (px) one bar may occupy — plotted
 *  width ÷ bar count.
 *
 *  19 is the pitch the design already ships at its thinnest desktop state
 *  (1280 with the panel closed, where the two-pane split leaves the chart
 *  578px across 30 bars). With the current ladder this never binds above a
 *  ~370px column; it exists so an unforeseen layout cannot produce a picket
 *  fence. */
export const MIN_BAR_PITCH = 19;

/** Horizontal chrome (px) the chart spends before it can plot a bar: the
 *  BarChart's right margin plus the fixed YAxis reserve. Exact rather than
 *  measured now that both are constants — the YAxis no longer auto-sizes to
 *  whichever tick strings the current metric happens to produce.
 *
 *  Only the backstop consumes this. The ladder keys off the column, never the
 *  plotted area, and that is deliberate: a rule that fed the plot back in
 *  would oscillate. */
export const CHART_CHROME_PX = CHART_Y_AXIS_WIDTH + CHART_MARGIN.right;

/** How many adjacent buckets to fold into one bar in a content column
 *  `columnWidth` wide. 1 means "draw every bucket".
 *
 *  Returns a group SIZE rather than a target count so the reduction is a true
 *  aggregation — callers sum (or, for a rate lens, average) each group of
 *  adjacent buckets. Nothing is sampled or dropped, so the stacked totals
 *  still reconcile to the range total. */
export function getBucketGroupSize(
  columnWidth: number,
  fullCount: number
): number {
  // Pre-measurement (0) renders full detail; the ResizeObserver publishes a
  // real width before first paint, so this value is never painted.
  if (columnWidth <= 0 || fullCount <= 1) {
    return 1;
  }
  const tier =
    BAR_DENSITY_TIERS.find((t) => columnWidth >= t.minWidth) ??
    BAR_DENSITY_TIERS.at(-1);
  // Two bars is the fewest that still reads as a comparison.
  const backstop = Math.max(
    2,
    Math.floor(getChartPlotWidth(columnWidth) / MIN_BAR_PITCH)
  );
  const maxBars = Math.min(tier?.maxBars ?? fullCount, backstop);
  if (maxBars >= fullCount) {
    return 1;
  }
  return Math.min(fullCount, Math.ceil(fullCount / maxBars));
}

/** Bars actually drawn for a bucket count folded at `groupSize`. */
export function getRenderedBarCount(
  fullCount: number,
  groupSize: number
): number {
  return Math.ceil(fullCount / Math.max(1, groupSize));
}

/** One plotted bucket: an x-axis `date` label plus a numeric value per
 *  series. */
export type ChartRow = Record<string, number | string>;

/** Fold every `groupSize` adjacent buckets into one wider bucket, so a narrow
 *  column draws fewer, fatter bars instead of a picket fence.
 *
 *  Aggregation, never sampling: each group carries the FULL contents of the
 *  buckets it replaces, so a 3-day bar is literally the sum of its 3 days and
 *  the range total is untouched — dropping buckets would make the stacked
 *  totals lie. The group keeps its FIRST bucket's label, matching the
 *  bucket-start convention getRangeLabels already uses.
 *
 *  `mean` is the rate lens: under Savings a bucket's stack total IS the %
 *  saved for that bucket, and percentages average rather than sum — summing
 *  three of them would push a 25% bar to 75% and off the 0–30 axis. */
export function aggregateBuckets(
  rows: ChartRow[],
  groupSize: number,
  mean: boolean
): ChartRow[] {
  if (groupSize <= 1) {
    return rows;
  }
  const out: ChartRow[] = [];
  for (let start = 0; start < rows.length; start += groupSize) {
    const group = rows.slice(start, start + groupSize);
    const folded: ChartRow = { date: group[0]?.date ?? "" };
    for (const row of group) {
      for (const [key, value] of Object.entries(row)) {
        if (key !== "date") {
          folded[key] = (Number(folded[key]) || 0) + (Number(value) || 0);
        }
      }
    }
    if (mean) {
      for (const key of Object.keys(folded)) {
        if (key !== "date") {
          folded[key] = Number(folded[key]) / group.length;
        }
      }
    }
    out.push(folded);
  }
  return out;
}

/** Bucket width shown in the card description. `groupSize` is the bucket
 *  aggregation applied for the current column width (see getBucketGroupSize);
 *  at 1 this returns exactly what it always has, so the wide/desktop
 *  description is unchanged. A chart drawing 3-day bars must not say
 *  "per day". */
export function getBucketLabel(
  range: Range,
  customRange: CustomRange | null,
  groupSize = 1
): string {
  const g = Math.max(1, Math.round(groupSize));
  if (range === "custom" && customRange) {
    const days = daysInRange(customRange);
    const count = getBucketCount(range, customRange);
    const perBucketDays = Math.max(1, Math.round(days / count)) * g;
    return perBucketDays === 1 ? "per day" : `per ~${perBucketDays} days`;
  }
  if (range === "24h") {
    return `per ${2 * g} hours`;
  }
  if (range === "7d" || range === "30d" || range === "all") {
    return g === 1 ? "per day" : `per ${g} days`;
  }
  return "per bucket";
}

export function getRangeDates(
  range: Range,
  customRange: CustomRange | null
): Date[] {
  const count = getBucketCount(range, customRange);
  if (range === "custom" && customRange) {
    const span = customRange.to.getTime() - customRange.from.getTime();
    return Array.from(
      { length: count },
      (_, i) => new Date(customRange.from.getTime() + (span * i) / (count - 1))
    );
  }
  if (range === "all") {
    const lastDay = new Date(2026, 3, 27);
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(lastDay);
      d.setDate(d.getDate() - Math.round(((29 - i) * 59) / 29));
      return d;
    });
  }
  if (range === "24h") {
    const anchor = new Date(2026, 3, 27, 0, 0);
    const dates = Array.from(
      { length: 11 },
      (_, i) => new Date(anchor.getTime() + i * 2 * 60 * 60 * 1000)
    );
    dates.push(new Date(2026, 3, 27, 14, 30));
    return dates;
  }
  if (range === "7d") {
    const anchor = new Date(2026, 3, 27);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(anchor);
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
  }
  const lastDay = new Date(2026, 3, 27);
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(lastDay);
    d.setDate(d.getDate() - (29 - i));
    return d;
  });
}

export function getRangeLabels(
  range: Range,
  customRange: CustomRange | null
): string[] {
  const count = getBucketCount(range, customRange);
  if (range === "custom" && customRange) {
    const labels: string[] = [];
    const span = customRange.to.getTime() - customRange.from.getTime();
    for (let i = 0; i < count; i++) {
      const d = new Date(customRange.from.getTime() + (span * i) / (count - 1));
      labels.push(formatDate(d, { month: "short", day: "numeric" }));
    }
    return labels;
  }
  if (range === "all") {
    // Lifetime cumulative window — 30 buckets spanning the ~60 days of mock
    // history, ending today (Apr 27, per existing fixtures). Each bucket
    // covers ~2 days; labels are the explicit date at the bucket start.
    const labels: string[] = [];
    const lastDay = new Date(2026, 3, 27);
    for (let i = 0; i < 30; i++) {
      const d = new Date(lastDay);
      d.setDate(d.getDate() - Math.round(((29 - i) * 59) / 29));
      labels.push(formatDate(d, { month: "short", day: "numeric" }));
    }
    return labels;
  }
  if (range === "24h") {
    // 12 buckets at 2-hour intervals on the calendar day. Trailing bucket
    // labeled "Now" since it ends at the anchor 14:30 rather than 14:00.
    const anchor = new Date(2026, 3, 27, 0, 0);
    const labels: string[] = [];
    for (let i = 0; i < 11; i++) {
      const d = new Date(anchor.getTime() + i * 2 * 60 * 60 * 1000);
      labels.push(
        formatTime(d, { hour: "2-digit", minute: "2-digit", hour12: false })
      );
    }
    labels.push("Now");
    return labels;
  }
  if (range === "7d") {
    // 7 daily buckets ending Apr 27. Going back 6 days from the anchor.
    const anchor = new Date(2026, 3, 27);
    const labels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(anchor);
      d.setDate(d.getDate() - i);
      labels.push(formatDate(d, { month: "short", day: "numeric" }));
    }
    return labels;
  }
  // 30D — 30 daily labels ending Apr 27 (today, per existing fixtures).
  // Going back 29 days: Mar 29 → Apr 27 inclusive. Last label is the
  // explicit date (matching 7D's pattern, not 1H/24H's "Now").
  const labels: string[] = [];
  const lastDay = new Date(2026, 3, 27);
  for (let i = 0; i < 30; i++) {
    const d = new Date(lastDay);
    d.setDate(d.getDate() - (29 - i));
    labels.push(formatDate(d, { month: "short", day: "numeric" }));
  }
  return labels;
}

export const fmtUsd = (n: number) => formatCurrency(n);

export const fmtInt = (n: number) => formatNumber(n);

export const fmtTokens = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(2)}M`
    : n >= 1000
      ? `${(n / 1000).toFixed(1)}K`
      : `${n}`;
