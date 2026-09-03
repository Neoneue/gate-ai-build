import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { SparkXAxisTick } from "@/components/ui/chart-axis-ticks";
import {
  CHART_X_AXIS_HEIGHT,
  CHART_X_TICK_MARGIN,
  SPARK_CHART_MARGIN,
} from "@/components/ui/chart-geometry";
import { DeltaTag } from "@/components/ui/compact-kpi";
import { HeroNumeric } from "@/components/ui/hero-numeric";
import { StatusDot } from "@/components/ui/status-dot";
import { formatCompactCount } from "@/lib/formatters";
import { useViewScope } from "@/pages/teams/view-scope";
import { buildCustomHeroView, HERO_VIEWS, scaleHeroView } from "./hero-data";
import { useCustomRange, useRange } from "./range-store";
import type { HeroView } from "./types";

export function HeroMetricCard() {
  const range = useRange();
  const customRange = useCustomRange();
  // Custom view is synthesized on the fly so the chart, headline number
  // and breakdown stay coherent with whatever range the user picked.
  // The four preset views remain static (cheap; no recompute on render).
  const customView = useMemo<HeroView>(
    () => buildCustomHeroView(customRange),
    [customRange]
  );
  const scope = useViewScope();
  const view = scaleHeroView(
    range === "custom" ? customView : HERO_VIEWS[range],
    scope.requestShare
  );
  const config = {
    requests: {
      label: view.bucketLabel,
      color: "var(--color-chart-1)",
    },
  } satisfies ChartConfig;

  return (
    <Card className="px-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex shrink-0 flex-col gap-2">
          <div className="flex flex-col gap-1">
            <HeroNumeric size="lg">
              {formatCompactCount(view.total)}
            </HeroNumeric>
            {scope.scoped ? null : (
              <DeltaTag delta={view.delta} note={view.deltaNote} size="md" />
            )}
          </div>
        </div>

        {/* Right-aligned mono breakdown — grid (not stacked flex) so the
            rows share the same label / dot / value column tracks. Each
            BreakdownRow returns three grid cells; the dot column is
            fixed-width so dots align across rows regardless of label or
            value length. Slow row removed 2026-05-20 per CTO direction:
            slow successes now roll into Success so Success + Errors =
            Total reconciles; surface for slow is the latency cell. */}
        <div className="grid shrink-0 grid-cols-[auto_auto_auto] items-center gap-x-2 gap-y-2">
          <BreakdownRow
            label="Success"
            tone="success"
            value={formatCompactCount(view.success)}
          />
          <BreakdownRow
            label="Errors"
            tone="danger"
            value={formatCompactCount(view.errors)}
          />
        </div>
      </div>

      {/* Full-width line chart with range-aware axis + per-point tooltip */}
      <div className="w-full">
        <ChartContainer className="aspect-auto h-24 w-full" config={config}>
          <AreaChart
            accessibilityLayer
            data={view.data}
            margin={SPARK_CHART_MARGIN}
          >
            <defs>
              <linearGradient
                id="cmp013-hero-spark"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="var(--color-chart-1)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-chart-1)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            {/* Dynamic domain: top is `max(values) + 1` so the tallest
              spike never touches the chart ceiling and the y-axis
              scales with whatever data the gateway is producing. */}
            <YAxis
              axisLine={false}
              domain={[0, view.domainTop]}
              tick={false}
              tickLine={false}
              width={0}
            />
            {/* Dashed horizontal gridlines — matches the Security events chart. */}
            <CartesianGrid
              horizontal
              stroke="var(--color-chart-grid)"
              strokeDasharray="8 5"
              vertical={false}
            />
            {/* Ticks are real data points (see deriveTicks in hero-data);
              interval="preserveStartEnd" + minTickGap lets recharts width-thin
              the labels natively (always keeping first + last), so narrow
              cards drop labels instead of overlapping — no custom JS hook.
              Tick renderer + type come from the shared chart geometry. */}
            <XAxis
              axisLine={false}
              dataKey="time"
              height={CHART_X_AXIS_HEIGHT}
              interval="preserveStartEnd"
              minTickGap={16}
              tick={SparkXAxisTick}
              tickLine={false}
              tickMargin={CHART_X_TICK_MARGIN}
              ticks={view.ticks}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="gap-1"
                  formatter={(value) => (
                    <span className="type-label-14 text-foreground">
                      {Number(value).toLocaleString("en-US")}
                    </span>
                  )}
                  hideIndicator
                  labelClassName="font-normal text-muted-foreground"
                  labelFormatter={(_label, items) =>
                    (items?.[0]?.payload as { label?: string } | undefined)
                      ?.label ?? ""
                  }
                />
              }
              cursor={{
                stroke: "var(--color-neutral-500)",
                strokeDasharray: "3 3",
              }}
            />
            <Area
              dataKey="requests"
              fill="url(#cmp013-hero-spark)"
              isAnimationActive={false}
              stroke="var(--color-chart-1)"
              strokeWidth={1.5}
              type="linear"
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </Card>
  );
}

function BreakdownRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "danger" | "warning";
}) {
  // Returns three grid cells (no wrapper element). Parent is a 3-col grid
  // so dots and values align across rows. `justify-self-end` right-aligns
  // text-flow cells within their tracks.
  return (
    <>
      <span className="type-label-12 justify-self-end text-muted-foreground tracking-tight">
        {label}
      </span>
      <StatusDot kind={tone} />
      <span className="type-mono-12 justify-self-end font-medium text-foreground">
        {value}
      </span>
    </>
  );
}
