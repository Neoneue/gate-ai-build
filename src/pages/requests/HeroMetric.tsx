import { useCallback, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { DeltaTag } from "@/components/ui/compact-kpi";
import { HeroNumeric } from "@/components/ui/hero-numeric";
import { StatusDot } from "@/components/ui/status-dot";
import { buildCustomHeroView, HERO_VIEWS } from "./hero-data";
import { useCustomRange, useRange } from "./range-store";
import type { HeroView } from "./types";

function ChartXAxisTick(props: {
  x: string | number;
  y: string | number;
  payload: { value: string };
  firstTick: string;
  lastTick: string;
}) {
  const { x, y, payload, firstTick, lastTick } = props;
  const value = payload.value;
  const spaceIdx = value.indexOf(" ");
  const display =
    spaceIdx === -1 ? value : value.slice(0, value.lastIndexOf(" "));
  const anchor =
    value === firstTick ? "start" : value === lastTick ? "end" : "middle";
  return (
    <text
      dy="0.71em"
      fill="var(--color-neutral-500)"
      fontSize={11}
      textAnchor={anchor}
      x={x}
      y={y}
    >
      {display}
    </text>
  );
}

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
  const view = range === "custom" ? customView : HERO_VIEWS[range];
  const config = {
    requests: {
      label: view.bucketLabel,
      color: "var(--color-chart-1)",
    },
  } satisfies ChartConfig;
  const firstTick = view.ticks[0];
  const lastTick = view.ticks[view.ticks.length - 1];
  const renderTick = useCallback(
    (tickProps: {
      x: string | number;
      y: string | number;
      payload: { value: string };
    }) => (
      <ChartXAxisTick
        {...tickProps}
        firstTick={firstTick}
        lastTick={lastTick}
      />
    ),
    [firstTick, lastTick]
  );

  return (
    <Card className="px-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex shrink-0 flex-col gap-2">
          <div className="flex items-baseline gap-3">
            <HeroNumeric size="lg">{view.total.toLocaleString()}</HeroNumeric>
            <DeltaTag delta={view.delta} note={view.deltaNote} size="md" />
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
            value={view.success.toLocaleString()}
          />
          <BreakdownRow
            label="Errors"
            tone="danger"
            value={view.errors.toLocaleString()}
          />
        </div>
      </div>

      {/* Full-width line chart with range-aware axis + per-point tooltip */}
      <ChartContainer className="aspect-auto h-24 w-full" config={config}>
        <AreaChart
          accessibilityLayer
          data={view.data}
          margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
        >
          <defs>
            <linearGradient id="cmp013-hero-spark" x1="0" x2="0" y1="0" y2="1">
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
            stroke="var(--color-neutral-200)"
            strokeDasharray="8 3"
            vertical={false}
          />
          <XAxis
            axisLine={false}
            dataKey="time"
            height={24}
            interval={0}
            tick={renderTick}
            tickLine={false}
            tickMargin={8}
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
      <span className="justify-self-end font-medium font-mono text-foreground text-xs tabular-nums">
        {value}
      </span>
    </>
  );
}
