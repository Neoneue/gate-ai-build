import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  ChartXAxisTick,
  ChartYAxisTick,
} from "@/components/ui/chart-axis-ticks";
import {
  CHART_MARGIN,
  CHART_X_AXIS_HEIGHT,
  CHART_X_TICK_MARGIN,
  CHART_Y_AXIS_WIDTH,
  getAxisTicks,
  useChartColumnWidth,
} from "@/components/ui/chart-geometry";
import { SegmentedPill } from "@/components/ui/segmented-pill";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type CustomRange, effectiveScale, type Range } from "@/lib/range";
import {
  ACTIVITY_SAVINGS_RATE_7D,
  type ChartSeries,
  type Dimension,
  METRIC_OPTIONS,
  type Metric,
  OTHERS_COLOR,
  OTHERS_KEY,
  rankChartSeries,
  SAVINGS_RATES_7D,
  SPEND_TOTALS_7D,
  savingsCurve,
  savingsRateFor,
  seriesColor,
  splitAcrossBuckets,
  TOKENS_TOTALS_7D,
} from "@/pages/activity-data";
import {
  aggregateBuckets,
  fmtTokens,
  fmtUsd,
  getBucketCount,
  getBucketGroupSize,
  getBucketLabel,
  getRangeLabels,
} from "./chart-helpers";

/* ─── Spend trend — stacked bars, Model / Provider / API key toggle ─────── */

/** `noun` is the authored phrasing shared by the Select option ("By …") and
 *  the card description ("Stacked by …"). Authored rather than derived from a
 *  Title Case label because `"API key".toLowerCase()` renders "api key", which
 *  had shipped in both places. */
const DIMENSION_OPTIONS: { value: Dimension; noun: string }[] = [
  { value: "model", noun: "model" },
  { value: "provider", noun: "provider" },
  { value: "apiKey", noun: "API key" },
];

/** Bar count per range. The Spend over time chart distributes each
 *  series's 7d total across this many buckets, so 24H = 12 bars at 2h
 *  each, 30D = 30 daily bars, etc. Custom range derives count from the
 *  span (daily up to 30 days, then capped). */

/** Human-readable bucket period for the SpendTrendCard description.
 *  Tells the reader what one bar covers so they can reconcile sum(bars)
 *  against the Total Spend KPI without doing the arithmetic. */

/** Generate N evenly-spaced labels for the chart x-axis. Each preset has
 *  its own anchoring (1H → minute marks ending at "Now"; 24H → 2-hour
 *  marks on the calendar; 7D → daily; 30D → daily ending today). */
/** Bucket start dates per range: re-anchored on the demo clock (daily ranges
 *  end on `DEMO_TODAY`; 24H's trailing bucket is `DEMO_NOW`). Kept in lockstep
 *  with getRangeLabels (same anchor + stepping); getRangeLabels renders the
 *  short axis labels, the KPI rail renders these via formatSparkLabel. */

/** Margin, Y-axis reserve, tick type and both tick renderers come from
 *  `@/components/ui/chart-geometry` (+ its `chart-axis-ticks` sibling) — the
 *  single source Overview's chart reads too, so the two cards cannot drift
 *  apart again. What stays local is what only this chart has: the savings
 *  lens's fixed domain. Hoisted because recharts treats an inline object as a
 *  new prop each render and re-runs layout work it could otherwise skip. */
/** Hoisted YAxis domain for the savings lens — % saved tops out at 30. */
const SAVINGS_DOMAIN = [0, 30] as const;

/** Trend-chart-only lens: the shared Tokens | Spend pair plus Savings —
 *  percentage of tokens saved (caching + compression) over time. The Top
 *  cards keep the plain Tokens | Spend METRIC_OPTIONS. */
type TrendMetric = Metric | "savings";

const TREND_METRIC_OPTIONS: { value: TrendMetric; label: string }[] = [
  ...METRIC_OPTIONS,
  { value: "savings", label: "Savings" },
];

const TREND_TITLE: Record<TrendMetric, string> = {
  tokens: "Tokens over time",
  spend: "Spend over time",
  savings: "Savings over time",
};

/** Right-panel breakdown: renders the ranked series `rankChartSeries` picked,
 *  Others included, in rank order. */
function TrendBreakdownPanel({
  metric,
  series,
  seriesTotals,
  savingsRates,
}: {
  metric: TrendMetric;
  series: readonly ChartSeries[];
  /** Aggregated totals for this range — keyed by series key. Under the
   *  savings lens these only drive the sort order; the displayed value
   *  comes from savingsRates. */
  seriesTotals: Record<string, number>;
  /** Savings lens only: each series' OWN saved rate for the range, as a
   *  display percentage (14.7 -> "14.7%"). Same numbers as the table's
   *  Saved column for the apiKey dimension. */
  savingsRates?: Record<string, number>;
}) {
  const isSpend = metric === "spend";
  const grandTotal =
    Object.values(seriesTotals).reduce((a, b) => a + b, 0) || 1;
  const fmtValue = isSpend ? fmtUsd : (n: number) => fmtTokens(Math.round(n));

  return (
    <div className="flex flex-col gap-1">
      {series.map((s) => {
        const total = seriesTotals[s.key] ?? 0;
        const pctStr = fmtPct(total / grandTotal);
        const color = s.key === OTHERS_KEY ? OTHERS_COLOR : seriesColor(s);

        // Right-side value cluster: cumulative value · pct. Tokens in/out
        // live in the UsageByKey table below — duplicating the split here
        // adds noise without information. Single shape for tokens/spend so
        // toggling those lenses doesn't reflow the panel. Savings shows the
        // series' own saved rate alone — a share column here would just
        // echo the token split.
        return (
          <div
            className="flex min-w-0 items-center gap-2 rounded-xs px-2 py-1"
            key={s.key}
          >
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-xs"
              style={{ backgroundColor: color }}
            />
            <span className="type-copy-14 min-w-0 flex-1 truncate text-foreground">
              {s.label}
            </span>
            {metric === "savings" ? (
              <span className="type-mono-14 shrink-0 text-right text-foreground">
                {`${(savingsRates?.[s.key] ?? 0).toFixed(1)}%`}
              </span>
            ) : (
              <div
                className="type-mono-14 grid shrink-0 items-center gap-x-2"
                style={{ gridTemplateColumns: "9ch min-content 4ch" }}
              >
                <span className="text-right text-foreground">
                  {fmtValue(total)}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-right text-foreground">{pctStr}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function TrendCard({
  range,
  customRange,
}: {
  range: Range;
  customRange: CustomRange | null;
}) {
  const [dimension, setDimension] = useState<Dimension>("model");
  // Local metric lens — independent from the other three surfaces.
  const [metric, setMetric] = useState<TrendMetric>("tokens");
  const isSpend = metric === "spend";
  const isSavings = metric === "savings";

  /** Bar density keys off the CONTENT COLUMN's width, not the viewport: the
   *  Ask AI panel and the nav rail both narrow this column while the viewport
   *  stays wide, which is exactly the state a media query cannot see. The
   *  column is `<main>`'s content box — the same inline size the `@` container
   *  variants read — so the density tiers line up with the `@2xl` / `@4xl`
   *  thresholds in the markup below. The ref goes on the chart pane; the hook
   *  walks up to `<main>` from there. */
  const [chartPaneRef, columnWidth] = useChartColumnWidth();

  const fullCount = getBucketCount(range, customRange);
  const groupSize = getBucketGroupSize(columnWidth, fullCount);

  /** Every bucket in the range, at full resolution. Aggregation into what the
   *  column can actually draw happens in `data` below, so the generator's
   *  per-range shape never depends on how wide the card happens to be. */
  const fullRows = useMemo(() => {
    const count = fullCount;
    const labels = getRangeLabels(range, customRange);
    const scale = effectiveScale(range, customRange);
    const totals = (isSpend ? SPEND_TOTALS_7D : TOKENS_TOTALS_7D)[dimension];

    // Range-aware base seed so ranges with matching bucket counts don't
    // produce identical shapes. Deliberately NOT combined with a per-series
    // offset — see the daily-curve block below for why.
    const rangeSeed =
      range === "all"
        ? 11
        : range === "24h"
          ? 47
          : range === "7d"
            ? 77
            : range === "30d"
              ? 303
              : 99;
    const seriesBuckets: Record<string, number[]> = {};

    // Savings lens: the stack total per bucket IS the workspace % saved for
    // that bucket, following the maturation curve (savingsCurve) — a concave
    // climb from the window's floor to its ~25% ceiling as caching/
    // compression mature. Each series' segment is weighted by token share ×
    // its OWN saved rate (SAVINGS_RATES_7D), normalized so segments still sum
    // to the bucket total — a high-saving series carries more of the stack
    // than its token share alone.
    if (isSavings) {
      const tokenTotals = TOKENS_TOTALS_7D[dimension];
      const rates = SAVINGS_RATES_7D[dimension];
      const weights: Record<string, number> = {};
      for (const [key, tokens7d] of Object.entries(tokenTotals)) {
        weights[key] = tokens7d * (rates[key] ?? 0);
      }
      const weightSum = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
      const pctBuckets = savingsCurve(
        range,
        customRange,
        count,
        rangeSeed * 31
      );
      for (const [key, weight] of Object.entries(weights)) {
        seriesBuckets[key] = pctBuckets.map(
          (pct) => (pct * weight) / weightSum
        );
      }
      return Array.from({ length: count }, (_, i) => {
        const row: Record<string, number | string> = { date: labels[i] ?? "" };
        for (const [key, buckets] of Object.entries(seriesBuckets)) {
          row[key] = buckets[i] ?? 0;
        }
        return row;
      });
    }

    // One dimension-independent daily curve, then a fixed per-series share of
    // every bucket. See splitAcrossBuckets for why this must not be seeded per
    // series and what the lockstep tradeoff buys.
    Object.assign(
      seriesBuckets,
      splitAcrossBuckets(totals, count, rangeSeed, scale)
    );

    // Per-bucket sum equals scaled 7d total by construction (distributeSeries
    // sums each series exactly, then sums across series).
    return Array.from({ length: count }, (_, i) => {
      const row: Record<string, number | string> = { date: labels[i] ?? "" };
      for (const [key, buckets] of Object.entries(seriesBuckets)) {
        row[key] = buckets[i] ?? 0;
      }
      return row;
    });
  }, [dimension, range, customRange, isSpend, isSavings, fullCount]);

  /** What the chart actually draws: `fullRows` folded down to the bar count
   *  this column width can render legibly. `groupSize === 1` returns fullRows
   *  untouched, so every state with room for the whole range is unchanged. */
  const data = useMemo(
    () => aggregateBuckets(fullRows, groupSize, isSavings),
    [fullRows, groupSize, isSavings]
  );

  /** Aggregate every plotted series across all buckets in the active range.
   *  Read off `data`'s own keys rather than an authored series list, so the
   *  totals describe exactly what the chart holds. */
  const rawSeriesTotals = useMemo<Record<string, number>>(() => {
    const acc: Record<string, number> = {};
    for (const row of data) {
      for (const [key, value] of Object.entries(row)) {
        if (key !== "date") {
          acc[key] = (acc[key] ?? 0) + (Number(value) || 0);
        }
      }
    }
    return acc;
  }, [data]);

  /** Rank by the ACTIVE metric, cap at 6, roll the remainder into Others.
   *  Single source of truth for the chart render loop and the breakdown
   *  panel. The named set is metric-dependent by design: Opus is 5.6% of
   *  tokens and 24.7% of spend, so toggling the lens re-ranks the legend. */
  const {
    series: cappedSeries,
    totals: cappedTotals,
    rows: dataWithOthers,
  } = useMemo(
    () => rankChartSeries(dimension, rawSeriesTotals, data),
    [dimension, rawSeriesTotals, data]
  );

  const bucketLabel = getBucketLabel(range, customRange, groupSize);

  /** The exact subset of dates the X axis labels. Handed to recharts as an
   *  explicit `ticks` array alongside `interval={0}` so it renders precisely
   *  these and hides nothing of its own accord — a numeric `interval` would
   *  give the same uniform stride but always starts its own count at index 0
   *  and can never be told to land on the final bar. Same call, same geometry,
   *  on Overview's chart. */
  const axisTicks = useMemo(
    () => getAxisTicks(data, columnWidth),
    [data, columnWidth]
  );

  const chartConfig: ChartConfig = useMemo(
    () =>
      Object.fromEntries(
        cappedSeries.map((s) => [
          s.key,
          {
            label: s.label,
            color: s.key === OTHERS_KEY ? OTHERS_COLOR : seriesColor(s),
          },
        ])
      ) as ChartConfig,
    [cappedSeries]
  );

  // Panel display under Savings: each series' OWN saved rate for the
  // active range (same range scaling as the table's Saved column, so the
  // apiKey dimension shows identical numbers). Others = token-weighted
  // mean of the overflow keys it aggregates.
  const savingsRates = useMemo<Record<string, number> | undefined>(() => {
    if (!isSavings) {
      return;
    }
    const factor =
      (savingsRateFor(range, customRange) / ACTIVITY_SAVINGS_RATE_7D) * 100;
    const rates = SAVINGS_RATES_7D[dimension];
    const tokenTotals = TOKENS_TOTALS_7D[dimension];
    const named = new Set(cappedSeries.map((s) => s.key));
    const out: Record<string, number> = {};
    let overflowTokens = 0;
    let overflowWeighted = 0;
    for (const [key, tokens7d] of Object.entries(tokenTotals)) {
      if (named.has(key)) {
        out[key] = (rates[key] ?? 0) * factor;
      } else {
        overflowTokens += tokens7d;
        overflowWeighted += tokens7d * (rates[key] ?? 0);
      }
    }
    if (named.has(OTHERS_KEY) && overflowTokens > 0) {
      out[OTHERS_KEY] = (overflowWeighted / overflowTokens) * factor;
    }
    return out;
  }, [isSavings, dimension, range, customRange, cappedSeries]);

  // Metric-aware value formatter — drives the tooltip rows. YAxis ticks
  // use fmtTokens directly under the tokens metric so the axis reads in
  // "1 M" / "5 M" units that match the tooltip; savings reads in "N.N%".
  const valueFormatter = (v: number) => {
    if (isSavings) {
      return `${v.toFixed(1)}%`;
    }
    return isSpend ? fmtUsd(v) : fmtTokens(Math.round(v));
  };

  return (
    <Card>
      {/* Threshold is the CONTENT COLUMN's width, not the viewport: the Ask AI
          panel and the nav rail narrow this card while the viewport stays
          wide, so a `md:` breakpoint kept the grid header alive at 370–630px
          and broke the title onto three lines. Below @2xl (672px of column)
          the header is the mobile treatment — title and subtitle full-width,
          the Select + metric pill left-aligned on their own row beneath them.
          672px stacks the whole panel-open band with ~100px still to spare,
          so the controls are never squeezed on the way there. At @2xl+ the
          grid header returns and the controls sit inline on the right. */}
      <CardHeader className="flex @2xl:grid flex-col gap-2 @2xl:gap-x-2 @2xl:gap-y-0">
        <CardTitle>{TREND_TITLE[metric]}</CardTitle>
        <CardDescription>
          Stacked by{" "}
          {DIMENSION_OPTIONS.find((d) => d.value === dimension)?.noun}
          {" · "}
          {bucketLabel}
        </CardDescription>
        {/* +4px above and below the button row while it is stacked (ruled in
            7af5fb8), inert once the header goes inline. This one keys off the
            header's OWN container rather than the content column, because an
            unnamed `@` variant here would resolve to CardHeader (the nearest
            container) and not to <main>. 638px is the same flip point as the
            @2xl above expressed in header-content width: 672 − 34, where 34 is
            the Card's 1px border either side plus CardHeader's px-4. */}
        <CardAction className="@min-[638px]/card-header:my-0 my-1">
          <div className="flex items-center gap-2">
            <Select
              onValueChange={(v: string) => setDimension(v as Dimension)}
              value={dimension}
            >
              <SelectTrigger
                aria-label="Group spend by"
                className="border-border bg-card text-foreground"
                size="sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIMENSION_OPTIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    By {d.noun}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <SegmentedPill
              aria-label="Chart metric"
              onValueChange={(v) => setMetric(v as TrendMetric)}
              options={TREND_METRIC_OPTIONS}
              size="sm"
              value={metric}
            />
          </div>
        </CardAction>
      </CardHeader>

      {/* Two-pane layout: chart left (8/12 cols), breakdown panel right (4/12 cols).
          Collapses to single column below md breakpoint (panel below chart). */}
      <CardContent className="grid @4xl:grid-cols-12 grid-cols-1 gap-4">
        {/* Left pane — chart. The bar-density ResizeObserver above walks up
            from this ref to <main> to read the content column's width. */}
        <div className="@4xl:col-span-8" ref={chartPaneRef}>
          {/* 184px gives the stacked layers enough vertical room to read as
              distinct bands without the chart taking over the page. YAxis
              ticks are left-anchored at the card's content edge (shared
              ChartYAxisTick) so they share their left edge with the title. */}
          <ChartContainer
            className="aspect-auto h-[184px] w-full"
            config={chartConfig}
          >
            <BarChart
              accessibilityLayer
              barCategoryGap="20%"
              data={dataWithOthers}
              margin={CHART_MARGIN}
            >
              <CartesianGrid
                horizontal
                stroke="var(--color-chart-grid)"
                strokeDasharray="8 5"
                vertical={false}
              />
              <XAxis
                axisLine={false}
                dataKey="date"
                height={CHART_X_AXIS_HEIGHT}
                // interval={0} + an explicit `ticks` array: recharts renders
                // exactly the subset we computed and applies no hiding or
                // end-clamping of its own. `preserveStartEnd` used to force
                // the first and last tick in and then INSET them to fit the
                // plot box, which slid "Feb 27" right into "Mar 5"; its
                // companion minTickGap dropped interior ticks opportunistically
                // and left a dead gap mid-axis. Both are gone — see
                // getAxisTickStride for how the stride is derived.
                interval={0}
                tick={ChartXAxisTick}
                tickLine={false}
                tickMargin={CHART_X_TICK_MARGIN}
                ticks={axisTicks}
              />
              <YAxis
                axisLine={false}
                // Savings caps the axis at 30% with `%` ticks; spend ticks
                // get a `$` prefix; token ticks use fmtTokens (compact
                // "M"/"k") so the axis matches the tooltip rows.
                domain={isSavings ? SAVINGS_DOMAIN : undefined}
                tick={ChartYAxisTick}
                tickFormatter={(value: number) => {
                  if (isSavings) {
                    return `${value}%`;
                  }
                  return isSpend ? `$${value}` : fmtTokens(value);
                }}
                tickLine={false}
                // Fixed, NOT `width="auto"`: an auto width moves the plot with
                // the tick strings, so the same chart under a different metric
                // — and the other chart card entirely — landed its number
                // column at a different x. The shared reserve fits the widest
                // label any chart can produce.
                width={CHART_Y_AXIS_WIDTH}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      const cfg = chartConfig[name as string];
                      return (
                        <div className="flex w-full items-center justify-between gap-6">
                          <span className="flex items-center gap-1">
                            <span
                              aria-hidden
                              className="size-2 shrink-0 rounded-xs"
                              style={{ backgroundColor: cfg?.color }}
                            />
                            <span className="text-muted-foreground">
                              {cfg?.label ?? name}
                            </span>
                          </span>
                          <span className="type-mono-14 text-foreground">
                            {valueFormatter(Number(value))}
                          </span>
                        </div>
                      );
                    }}
                    indicator="dot"
                    labelFormatter={(_, payload) =>
                      String(payload?.[0]?.payload?.date ?? "")
                    }
                  />
                }
                cursor={false}
              />
              {cappedSeries.map((s, i) => {
                const color =
                  s.key === OTHERS_KEY ? OTHERS_COLOR : seriesColor(s);
                return (
                  <Bar
                    dataKey={s.key}
                    fill={color}
                    isAnimationActive={false}
                    key={s.key}
                    radius={
                      i === cappedSeries.length - 1 ? [1, 1, 0, 0] : undefined
                    }
                    stackId="spend"
                  />
                );
              })}
            </BarChart>
          </ChartContainer>
        </div>

        {/* Right pane — breakdown panel. Mobile: divider above the key
            (chart stacks above it); md+: vertical left divider instead. */}
        <div className="@4xl:col-span-4 border-border border-t @4xl:border-t-0 @4xl:border-l @4xl:pt-0 pt-4 @4xl:pl-3">
          <TrendBreakdownPanel
            metric={metric}
            savingsRates={savingsRates}
            series={cappedSeries}
            seriesTotals={cappedTotals}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Top X models — 3-up, one card per axis (no sort dropdown) ─────────── */

const fmtPct = (frac: number) => {
  const pct = frac * 100;
  return pct < 10 ? `${pct.toFixed(1)}%` : `${Math.round(pct)}%`;
};
