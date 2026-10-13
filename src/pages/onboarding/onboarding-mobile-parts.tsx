import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
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
import { PageTitle } from "@/components/ui/page-title";
import { seriesColor } from "@/pages/activity-data";

/* ─── Mobile A page parts ───────────────────────────────────────────────────
 * Shared by the Mobile A copies of Overview, Activity and Messages
 * (`/<page>-mobile-onboarding`). Copies of the Default and Pro pages' own
 * blocks, so the desktop pages never change for the phone demo (owner
 * 2026-10-11, no-thrash.md).
 * ───────────────────────────────────────────────────────────────────────── */

/** The page column: OnboardingChatLayout gives no outlet context, so the
 *  page renders its own `<main>` (DashboardChrome's content pane classes). */
export function MobilePageMain({ children }: { children: ReactNode }) {
  return (
    <main
      className="@container flex max-w-[1920px] flex-col gap-6 px-4 pt-6 pb-8 focus:outline-none sm:px-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto [&>*]:shrink-0"
      id="main-content"
    >
      {children}
    </main>
  );
}

/** The Default and Pro pages' title + description block. */
export function MobilePageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
      <PageTitle>{title}</PageTitle>
      <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
        {description}
      </p>
    </div>
  );
}

/** The muted icon chip every Default empty state leads with. */
export function IconChip({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div
      aria-hidden
      className="flex size-12 items-center justify-center rounded-md bg-muted"
    >
      <Icon
        aria-hidden
        className="size-5 text-muted-foreground"
        strokeWidth={1.75}
      />
    </div>
  );
}

/** TokenSavingsDefault's placeholder tile: icon chip over one muted line. */
export function EmptyKpiTile({
  icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 bg-card p-4">
      <IconChip icon={icon} />
      <span className="type-copy-14 text-muted-foreground">{label}</span>
    </div>
  );
}

/** The Default pages' empty chart card: icon chip over one muted line. */
export function EmptyChartCard({
  icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <IconChip icon={icon} />
          <span className="type-copy-14 text-muted-foreground">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}

/** Dashboard's PreviewCard shell without "View all": the phone demo has no
 *  full list or detail page behind it. */
export function PreviewCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden" density="flush">
      <div className="flex shrink-0 items-center px-4 py-3">
        <CardTitle>{title}</CardTitle>
      </div>
      {children}
    </Card>
  );
}

/** Dashboard's StackedKpiChart, stacked by model: each demo model's daily
 *  value, the newest bar on the right. Same geometry source as the Overview
 *  and Activity charts (`chart-geometry`); same stacking and top-only radius
 *  as Activity's TrendCard. */
export function DemoUsageChart({
  data,
  series,
  yFormatter,
}: {
  data: Array<Record<string, number | string>>;
  /** One per model, in first-use order; `slot` is its palette slot. */
  series: ReadonlyArray<{ key: string; label: string; slot: number }>;
  yFormatter: (v: number) => string;
}) {
  const config: ChartConfig = Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: seriesColor(s) }])
  );
  const [chartPaneRef, columnWidth] = useChartColumnWidth();
  const axisTicks = getAxisTicks(data, columnWidth);

  return (
    <div ref={chartPaneRef}>
      <ChartContainer className="aspect-auto h-[184px] w-full" config={config}>
        <BarChart
          accessibilityLayer
          barCategoryGap="20%"
          data={data}
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
            interval={0}
            tick={ChartXAxisTick}
            tickLine={false}
            tickMargin={CHART_X_TICK_MARGIN}
            ticks={axisTicks}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tick={ChartYAxisTick}
            tickFormatter={yFormatter}
            tickLine={false}
            width={CHART_Y_AXIS_WIDTH}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                indicator="dot"
                valueFormatter={yFormatter}
              />
            }
            cursor={false}
          />
          {series.map((s, i) => (
            <Bar
              dataKey={s.key}
              fill={seriesColor(s)}
              isAnimationActive={false}
              key={s.key}
              radius={i === series.length - 1 ? [1, 1, 0, 0] : undefined}
              stackId="usage"
            />
          ))}
        </BarChart>
      </ChartContainer>
    </div>
  );
}
