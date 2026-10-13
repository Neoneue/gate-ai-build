import type { ComponentProps } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  ChartXAxisTick,
  ChartYAxisTick,
  SparkXAxisTick,
} from "@/components/ui/chart-axis-ticks";
import {
  CHART_MARGIN,
  CHART_X_AXIS_HEIGHT,
  CHART_X_TICK_MARGIN,
  CHART_Y_AXIS_WIDTH,
  SPARK_CHART_MARGIN,
} from "@/components/ui/chart-geometry";
import type { CanvasGroup } from "@/pages/component-canvas/canvas-types";
import { SAMPLE_SERIES } from "@/pages/component-canvas/sample-data";

/* Charts (design.md "Chart tooltip & legend", "Charts"). One stacked bar
 * chart built the way Dashboard.tsx builds it; each example changes one
 * ChartTooltipContent or legend prop. Hover a bar for the tooltip. */

const CONFIG: ChartConfig = {
  allowed: { label: "Allowed", color: "var(--color-chart-1)" },
  blocked: { label: "Blocked", color: "var(--color-chart-5)" },
};

/** Per-theme series colours: `ChartStyle` writes a light and a `.dark`
 *  rule for each key. */
const THEMED_CONFIG: ChartConfig = {
  allowed: {
    label: "Allowed",
    theme: { light: "var(--color-chart-1)", dark: "var(--color-chart-6)" },
  },
  blocked: {
    label: "Blocked",
    theme: { light: "var(--color-chart-5)", dark: "var(--color-chart-2)" },
  },
};

type TooltipProps = ComponentProps<typeof ChartTooltipContent>;

function barChart({
  tooltip = {},
  legend = false,
  config = CONFIG,
}: {
  tooltip?: Partial<TooltipProps>;
  legend?: boolean;
  config?: ChartConfig;
}) {
  return (
    <ChartContainer className="h-[180px] w-full" config={config}>
      <BarChart
        accessibilityLayer
        barCategoryGap="20%"
        data={SAMPLE_SERIES}
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
          tick={ChartXAxisTick}
          tickLine={false}
          tickMargin={CHART_X_TICK_MARGIN}
        />
        <YAxis
          axisLine={false}
          tick={ChartYAxisTick}
          tickLine={false}
          width={CHART_Y_AXIS_WIDTH}
        />
        <ChartTooltip
          content={<ChartTooltipContent indicator="dot" {...tooltip} />}
          cursor={false}
        />
        {legend ? <ChartLegend content={<ChartLegendContent />} /> : null}
        <Bar
          dataKey="allowed"
          fill="var(--color-allowed)"
          isAnimationActive={false}
          stackId="s"
        />
        <Bar
          dataKey="blocked"
          fill="var(--color-blocked)"
          isAnimationActive={false}
          radius={[1, 1, 0, 0]}
          stackId="s"
        />
      </BarChart>
    </ChartContainer>
  );
}

const chart: CanvasGroup = {
  id: "chart",
  title: "Chart",
  files: ["chart.tsx"],
  columns: 2,
  examples: [
    {
      label: 'ChartTooltipContent indicator="dot" (default)',
      render: () => barChart({}),
    },
    {
      label: 'indicator="line"',
      render: () => barChart({ tooltip: { indicator: "line" } }),
    },
    {
      label: 'indicator="dashed"',
      render: () => barChart({ tooltip: { indicator: "dashed" } }),
    },
    {
      label: "hideLabel",
      render: () => barChart({ tooltip: { hideLabel: true } }),
    },
    {
      label: "hideIndicator",
      render: () => barChart({ tooltip: { hideIndicator: true } }),
    },
    {
      label: "ChartLegend + ChartLegendContent",
      render: () => barChart({ legend: true }),
    },
    {
      label: "config theme (ChartStyle light / dark)",
      render: () => barChart({ config: THEMED_CONFIG, legend: true }),
    },
  ],
};

const chartAxisTicks: CanvasGroup = {
  id: "chart-axis-ticks",
  title: "Chart axis ticks",
  files: ["chart-axis-ticks.tsx"],
  columns: 2,
  examples: [
    {
      label: "ChartXAxisTick + ChartYAxisTick",
      render: () => barChart({}),
    },
    {
      label:
        "SparkXAxisTick (Security.tsx axis: drops the time, anchors the ends)",
      render: () => (
        <ChartContainer className="h-[96px] w-full" config={CONFIG}>
          <AreaChart data={SAMPLE_SERIES} margin={SPARK_CHART_MARGIN}>
            <XAxis
              axisLine={false}
              dataKey="time"
              height={CHART_X_AXIS_HEIGHT}
              interval="preserveStartEnd"
              minTickGap={16}
              tick={SparkXAxisTick}
              tickLine={false}
              tickMargin={CHART_X_TICK_MARGIN}
            />
            <Area
              dataKey="allowed"
              fill="var(--color-allowed)"
              fillOpacity={0.15}
              isAnimationActive={false}
              stroke="var(--color-allowed)"
              type="linear"
            />
          </AreaChart>
        </ChartContainer>
      ),
    },
  ],
};

export const CHART_GROUPS: CanvasGroup[] = [chart, chartAxisTicks];
