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
  type Dimension,
  distributeSeries,
  METRIC_OPTIONS,
  type Metric,
  SPEND_SERIES,
  SPEND_TOTALS_7D,
  seriesColor,
  TOKENS_TOTALS_7D,
} from "@/pages/activity-data";
import {
  fmtTokens,
  fmtUsd,
  getBucketCount,
  getBucketLabel,
  getRangeLabels,
} from "./chart-helpers";

/* ─── Spend trend — stacked bars, Model / Provider / API key toggle ─────── */

const DIMENSION_OPTIONS: { value: Dimension; label: string }[] = [
  { value: "model", label: "Model" },
  { value: "provider", label: "Provider" },
  { value: "apiKey", label: "API key" },
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
/** Bucket start dates per range — anchored at the mock "today" (Apr 27, 2026);
 *  24H's trailing bucket is the 14:30 anchor. Kept in lockstep with
 *  getRangeLabels below (same anchor + stepping); getRangeLabels renders the
 *  short axis labels, the KPI rail renders these via formatSparkLabel. */

/** Synthetic key used for the "Others" rollup series when a dimension has
 *  more than 6 real series. This value must never collide with a real series
 *  key — the double-underscore prefix keeps it isolated from any workspace
 *  entity key. */
const OTHERS_KEY = "__others";

/** Ink-300 — visually subordinate to the saturated CHART_PALETTE slots but
 *  still clearly distinguishable from the card background. Used for the
 *  Others rollup bar segment and panel swatch. */
const OTHERS_COLOR = "var(--color-neutral-300)";

/** Hoisted BarChart prop literals. Recharts treats inline objects as new
 *  props each render and re-runs layout/style work it could otherwise skip.
 *  Module-level constants keep referential identity stable across renders. */
const TREND_CHART_MARGIN = { top: 8, right: 8, left: 0, bottom: 0 } as const;
const TREND_CHART_TICK = {
  fontSize: 11,
  fill: "var(--muted-foreground)",
} as const;

/** Right-panel breakdown: renders up to 6 pre-sorted rows. Caller is
 *  responsible for sorting and injecting the synthetic "Others" entry. */
function TrendBreakdownPanel({
  metric,
  series,
  seriesTotals,
}: {
  metric: Metric;
  series: readonly {
    key: string;
    label: string;
    slot: number;
    color?: string;
  }[];
  /** Aggregated totals for this range — keyed by series key. */
  seriesTotals: Record<string, number>;
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
        // adds noise without information. Single shape for both metrics so
        // toggling the lens doesn't reflow the panel.
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
            <div
              className="grid shrink-0 items-center gap-x-2 font-mono text-sm tabular-nums"
              style={{ gridTemplateColumns: "9ch min-content 4ch" }}
            >
              <span className="text-right text-foreground">
                {fmtValue(total)}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-right text-foreground">{pctStr}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Maximum number of individually-named series in the trend chart/panel.
 *  When a dimension has more entries, the remainder collapse into "Others". */
const TREND_SERIES_CAP = 6;

export function TrendCard({
  range,
  customRange,
}: {
  range: Range;
  customRange: CustomRange | null;
}) {
  const [dimension, setDimension] = useState<Dimension>("model");
  // Local metric lens — independent from the other three surfaces.
  const [metric, setMetric] = useState<Metric>("tokens");
  const rawSeries = SPEND_SERIES[dimension];
  const isSpend = metric === "spend";

  const data = useMemo(() => {
    const count = getBucketCount(range, customRange);
    const labels = getRangeLabels(range, customRange);
    const scale = effectiveScale(range, customRange);
    const totals = (isSpend ? SPEND_TOTALS_7D : TOKENS_TOTALS_7D)[dimension];

    // Distribute each series's range-scaled total across N buckets via
    // distributeSeries (trend + spike/dip noise). Each series gets its
    // own seed so adjacent series don't sync into matching ripples —
    // keeps stacked bars looking organic. Range-aware base seed so ranges
    // with matching bucket counts don't produce identical shapes.
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
    let seedOffset = 0;
    for (const [key, total7d] of Object.entries(totals)) {
      seedOffset++;
      seriesBuckets[key] = distributeSeries(
        total7d * scale,
        count,
        rangeSeed * 31 + seedOffset
      );
    }

    // Per-bucket sum equals scaled 7d total by construction (distributeSeries
    // sums each series exactly, then sums across series).
    return Array.from({ length: count }, (_, i) => {
      const row: Record<string, number | string> = { date: labels[i] ?? "" };
      for (const [key, buckets] of Object.entries(seriesBuckets)) {
        row[key] = buckets[i] ?? 0;
      }
      return row;
    });
  }, [dimension, range, customRange, isSpend]);

  /** Aggregate each raw series's total across all buckets in the active range.
   *  Derived from `data` so it's always in sync with what the chart shows. */
  const rawSeriesTotals = useMemo<Record<string, number>>(() => {
    const acc: Record<string, number> = {};
    for (const row of data) {
      for (const s of rawSeries) {
        acc[s.key] = (acc[s.key] ?? 0) + (Number(row[s.key]) || 0);
      }
    }
    return acc;
  }, [data, rawSeries]);

  /** Sort raw series desc by aggregate total, then apply the 6-series cap.
   *  This is the single source of truth for both the chart render loop and
   *  the breakdown panel. When rawSeries.length > TREND_SERIES_CAP:
   *    - visible = top (TREND_SERIES_CAP - 1) real series
   *    - 6th entry = synthetic __others rollup
   *  Otherwise all real series pass through unchanged. */
  const { cappedSeries, cappedTotals, dataWithOthers } = useMemo(() => {
    // Sort desc by aggregate total in the active metric.
    const sorted = [...rawSeries].sort(
      (a, b) => (rawSeriesTotals[b.key] ?? 0) - (rawSeriesTotals[a.key] ?? 0)
    );

    if (sorted.length <= TREND_SERIES_CAP) {
      return {
        cappedSeries: sorted,
        cappedTotals: rawSeriesTotals,
        dataWithOthers: data,
      };
    }

    // Split: top (CAP-1) named + everything else rolls into Others.
    const namedCount = TREND_SERIES_CAP - 1;
    const named = sorted.slice(0, namedCount);
    const overflow = sorted.slice(namedCount);

    // Synthetic Others entry — no slot (uses OTHERS_COLOR directly).
    const othersSeries = {
      key: OTHERS_KEY,
      label: "Others",
      slot: 0,
      color: OTHERS_COLOR,
    } as const;
    const series = [...named, othersSeries];

    // Totals: named keys unchanged; __others = sum of overflow keys.
    const totals: Record<string, number> = {};
    for (const s of named) {
      totals[s.key] = rawSeriesTotals[s.key] ?? 0;
    }
    totals[OTHERS_KEY] = overflow.reduce(
      (sum, s) => sum + (rawSeriesTotals[s.key] ?? 0),
      0
    );

    // Project __others into each data row = sum of overflow series values.
    const overflowKeys = overflow.map((s) => s.key);
    const projected = data.map((row) => {
      const othersVal = overflowKeys.reduce(
        (sum, k) => sum + (Number(row[k]) || 0),
        0
      );
      return { ...row, [OTHERS_KEY]: +othersVal.toFixed(2) };
    });

    return {
      cappedSeries: series,
      cappedTotals: totals,
      dataWithOthers: projected,
    };
  }, [rawSeries, rawSeriesTotals, data]);

  const bucketLabel = getBucketLabel(range, customRange);

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

  // Metric-aware value formatter — drives the tooltip rows. YAxis ticks
  // use fmtTokens directly under the tokens metric so the axis reads in
  // "1 M" / "5 M" units that match the tooltip.
  const valueFormatter = (v: number) =>
    isSpend ? fmtUsd(v) : fmtTokens(Math.round(v));

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isSpend ? "Spend over time" : "Tokens over time"}
        </CardTitle>
        <CardDescription>
          Stacked by{" "}
          {DIMENSION_OPTIONS.find(
            (d) => d.value === dimension
          )?.label.toLowerCase()}
          {" · "}
          {bucketLabel}
        </CardDescription>
        <CardAction>
          <div className="flex items-center gap-2">
            <Select
              onValueChange={(v: string) => setDimension(v as Dimension)}
              value={dimension}
            >
              <SelectTrigger
                aria-label="Group spend by"
                className="border-border bg-card font-normal text-foreground"
                size="sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIMENSION_OPTIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    By {d.label.toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <SegmentedPill
              onValueChange={(v) => setMetric(v as Metric)}
              options={METRIC_OPTIONS}
              size="sm"
              value={metric}
            />
          </div>
        </CardAction>
      </CardHeader>

      {/* Two-pane layout: chart left (8/12 cols), breakdown panel right (4/12 cols).
          Collapses to single column below md breakpoint (panel below chart). */}
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-12">
        {/* Left pane — chart */}
        <div className="md:col-span-8">
          {/* 184px gives the stacked layers enough vertical room to read as
              distinct bands without the chart taking over the page. YAxis
              ticks are left-aligned (custom tick renderer below) so they
              share their left edge with the title. */}
          <ChartContainer
            className="aspect-auto h-[184px] w-full"
            config={chartConfig}
          >
            <BarChart
              accessibilityLayer
              barCategoryGap="20%"
              data={dataWithOthers}
              margin={TREND_CHART_MARGIN}
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
                height={24}
                // Target ~7 visible labels regardless of bucket count:
                //   7 bars  → interval 0 (show all)
                //   12 bars → interval 1 (every other, ~6 visible)
                //   30 bars → interval 4 (every 5th, ~6 visible)
                interval={Math.max(0, Math.ceil(data.length / 7) - 1)}
                tick={TREND_CHART_TICK}
                tickLine={false}
                tickMargin={8}
              />
              <YAxis
                axisLine={false}
                // Spend ticks get a `$` prefix; token ticks use fmtTokens
                // (compact "M"/"k") so the axis matches the tooltip rows.
                tick={TREND_CHART_TICK}
                tickFormatter={(value: number) =>
                  isSpend ? `$${value}` : fmtTokens(value)
                }
                tickLine={false}
                tickMargin={4}
                width={44}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      const cfg = chartConfig[name as string];
                      return (
                        <div className="flex w-full items-center justify-between gap-3">
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
                          <span className="font-mono text-foreground tabular-nums">
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
                      i === cappedSeries.length - 1 ? [2, 2, 0, 0] : undefined
                    }
                    stackId="spend"
                  />
                );
              })}
            </BarChart>
          </ChartContainer>
        </div>

        {/* Right pane — breakdown panel */}
        <div className="md:col-span-4 md:border-border md:border-l md:pl-3">
          <TrendBreakdownPanel
            metric={metric}
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
