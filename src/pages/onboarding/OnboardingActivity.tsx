import { Key } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { VendorAvatar } from "@/components/icons/vendor-avatar";
import { Button } from "@/components/ui/button";
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
import { CompactKpi, CompactSpark } from "@/components/ui/compact-kpi";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { KpiRail as KpiRailShell } from "@/components/ui/kpi-rail";
import { Monogram } from "@/components/ui/monogram";
import { PageTitle } from "@/components/ui/page-title";
import { SearchInput } from "@/components/ui/search-input";
import { SectionTitle } from "@/components/ui/section-title";
import { SegmentedPill } from "@/components/ui/segmented-pill";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  SortableTableHead,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { resolveRowsPerPage } from "@/components/ui/table-pagination";
import { TablePaginationFooter } from "@/components/ui/table-pagination-footer";
import { UploadIcon } from "@/components/ui/upload";
import { MEMBER_ROWS } from "@/data/team-members";
import { parseNumeric, sortRows, useTableSort } from "@/hooks/use-table-sort";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import {
  formatChartTooltipDate,
  formatCompactCount,
  formatCurrency,
  formatDate,
  formatTime,
} from "@/lib/formatters";
import { keepInOnboarding } from "@/lib/plan";
import {
  type CustomRange,
  type PresetRange,
  RANGE_OPTIONS,
  type Range,
} from "@/lib/range";
import { ActivityDefault } from "@/pages/ActivityDefault";
import {
  fmtInt,
  fmtTokens,
  getBucketCount,
  getBucketGroupSize,
  getBucketLabel,
} from "@/pages/activity/chart-helpers";
import {
  type ChartSeries,
  type Dimension,
  METRIC_OPTIONS,
  type Metric,
  seriesColor,
} from "@/pages/activity-data";
import {
  tokensOf,
  type WorkspaceMessage,
  type WorkspaceTraffic,
  workspaceGroups,
} from "@/pages/onboarding/onboarding-workspace-traffic";
import { useWorkspaceTraffic } from "@/pages/onboarding/use-workspace-traffic";
import { ATTACK_MIX } from "@/pages/security/events-data";
import { TYPE_META } from "@/pages/security-data";

/* ─── OnboardingActivity ────────────────────────────────────────────────────
 * The desktop onboarding workspace's Activity (owner 2026-10-13).
 *
 * Before the first message (`useWorkspaceTraffic()` null): `ActivityDefault`,
 * unchanged. Then the messages land one at a time (the test message, then
 * the blocked demo); with the test message alone, every count below reads
 * it and the attack types read 0 (the phone Activity's precedent).
 *
 * After it: a COPY of the Free page (`ActivityFree` renders `Activity.tsx`:
 * control row :133, KpiRail :287, TopByAxisRow :472, UsageByKey :719; plus
 * `activity/TrendCard.tsx`), every section and control kept, fed by exactly
 * the step 3 messages and every Gate Chat reply of the run, from any tab
 * (owner 2026-10-14, `useWorkspaceTraffic`, the one source, so the tiles,
 * the chart, the Top cards and the key table reconcile):
 *   - KPI rail: total spend (sum of costUsd), the message count, the token
 *     sum. No delta: there is no prior period.
 *   - Trend card: a series per model, provider or key (`workspaceGroups`),
 *     on Tokens, Spend and Savings (Gate's compression: saved over input
 *     tokens, one decimal; Pro's stack, so a bucket's bars sum to its rate
 *     and the panel shows each series' own rate).
 *   - Top models: a row per model. Top API keys: a row per key. Top users:
 *     the account owner, named as the phone copy names them
 *     (the workspace's owner member, as the sidebar's account row shows). Top attack types: Pro's three
 *     rows, prompt injection 1 (the blocked demo), the rest 0, biggest first.
 *   - Recent key usage: a row per key the messages used. Messages and
 *     tokens are the sums, Alerts the blocked count, Saved the compression
 *     rate, Spend the cost sum. Device has no source for these messages, so
 *     it reads "—", Pro's own value for an unknown device (activity-data.ts
 *     `deviceFor`).
 * Spend reads in the phone copy's exact-dollar format (2 to 6 decimals), so a
 * pay-as-you-go list price under a cent does not round to $0.00.
 * Range state is LOCAL (never the shared range store); buckets anchor on the
 * newest message's real send time, not the demo clock the mock charts use
 * (the phone precedent, OnboardingMobileActivity.tsx). MOCK: no Gate record
 * exists for these messages, so nothing opens a detail page.
 * ───────────────────────────────────────────────────────────────────────── */

export function OnboardingActivity() {
  const traffic = useWorkspaceTraffic();
  return traffic ? (
    <ActivityWithTraffic traffic={traffic} />
  ) : (
    <ActivityDefault />
  );
}

function ActivityWithTraffic({ traffic }: { traffic: WorkspaceTraffic }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  // Pro's one-way `?range=` deep link, defaulting to "all".
  const [searchParams] = useSearchParams();
  const [range, setRange] = useState<Range>(() => {
    const r = searchParams.get("range");
    return r === "24h" || r === "7d" || r === "30d" || r === "all" ? r : "all";
  });
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);

  // The newest message anchors the window (messages are newest first).
  const anchor = traffic.messages[0]?.sentAt ?? null;
  const setup = useMemo(
    () =>
      anchor
        ? windowOf(buildBuckets(range, customRange, anchor), traffic.messages)
        : null,
    [range, customRange, anchor, traffic.messages]
  );
  if (!setup) {
    return <ActivityDefault />;
  }

  return (
    <DashboardChrome
      activeNavId="activity"
      onNavigate={(path: string) => navigate(keepInOnboarding(pathname, path))}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <PageHeader />
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionTitle>Overview</SectionTitle>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedPill
              aria-label="Time range"
              onValueChange={(v) => {
                setRange(v as PresetRange);
                setCustomRange(null);
              }}
              options={RANGE_OPTIONS}
              size="sm"
              value={range === "custom" ? "" : range}
            />
            <DateRangePicker
              onChange={(r) => {
                if (r) {
                  setCustomRange(r);
                  setRange("custom");
                } else {
                  setCustomRange(null);
                  setRange("all");
                }
              }}
              size="sm"
              value={customRange}
            />
          </div>
        </div>
        <KpiRail setup={setup} />
        <TrendCard
          customRange={customRange}
          range={range}
          setup={setup}
          traffic={traffic}
        />
      </div>
      <TopByAxisRow setup={setup} />
      <UsageByKey setup={setup} />
    </DashboardChrome>
  );
}

/* ─── Page header: Activity.tsx `PageHeader`, verbatim ──────────────────── */

function PageHeader() {
  return (
    <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
      <PageTitle>Activity</PageTitle>
      <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
        Cost, request volume, and token usage by model, API key, and team
        member.
      </p>
    </div>
  );
}

/* ─── Measures over the setup messages ─────────────────────────────────── */

/** The phone copy's exact-dollar format (`formatExactUsd`): 2 to 6 decimals. */
const fmtSpend = (usd: number) =>
  formatCurrency(usd, { minFrac: 2, maxFrac: 6 });

const sumOf = (
  messages: readonly WorkspaceMessage[],
  pick: (m: WorkspaceMessage) => number
) => messages.reduce((sum, m) => sum + pick(m), 0);

const spendOf = (messages: readonly WorkspaceMessage[]) =>
  sumOf(messages, (m) => m.costUsd);
const tokensOfAll = (messages: readonly WorkspaceMessage[]) =>
  sumOf(messages, tokensOf);
const inTokensOf = (messages: readonly WorkspaceMessage[]) =>
  sumOf(messages, (m) => m.inTokens);
const outTokensOf = (messages: readonly WorkspaceMessage[]) =>
  sumOf(messages, (m) => m.outTokens);
/** Gate's compression as a display percentage (14.7 -> "14.7%"), the
 *  `setupCompression` arithmetic over just these messages. */
const savedPctOf = (messages: readonly WorkspaceMessage[]) => {
  const inTokens = inTokensOf(messages);
  return inTokens === 0
    ? 0
    : (sumOf(messages, (m) => m.savedTokens) / inTokens) * 100;
};
const blockedOf = (messages: readonly WorkspaceMessage[]) =>
  messages.filter((m) => m.guardrail === "block").length;

/* ─── Buckets: Pro's geometry, anchored on the newest send ─────────────── */

type Buckets = {
  /** Short x-axis labels, same shapes as `getRangeLabels`. */
  labels: string[];
  /** Full tooltip date per bucket (`formatChartTooltipDate`). */
  tooltips: string[];
  /** Bucket i holds a send from `starts[i]` up to the next start, the last
   *  one up to `end`. */
  starts: number[];
  /** The window's last instant (inclusive). */
  end: number;
};

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

function daysBefore(anchor: Date, days: number): Date {
  const d = new Date(anchor);
  d.setDate(d.getDate() - days);
  return d;
}

function dayLabel(d: Date): string {
  return formatDate(d, { month: "short", day: "numeric" });
}

/** OnboardingMobileActivity.tsx `buildBuckets`: the Pro bucket count and
 *  stepping per range, ending at the newest message. */
function buildBuckets(
  range: Range,
  customRange: CustomRange | null,
  anchor: Date
): Buckets {
  let dates: Date[];
  let labels: string[];
  let starts: number[];
  let end: number;

  if (range === "custom" && customRange) {
    const count = getBucketCount(range, customRange);
    const from = customRange.from.getTime();
    const span = customRange.to.getTime() - from;
    dates = Array.from(
      { length: count },
      (_, i) => new Date(from + (span * i) / (count - 1))
    );
    labels = dates.map(dayLabel);
    starts = dates.map((d) => d.getTime());
    end = customRange.to.getTime();
  } else if (range === "24h") {
    // Eleven 2-hour buckets on the even hours, then the bucket the newest
    // message landed in, labelled "Now" like Pro's.
    const nowBucket = new Date(anchor);
    nowBucket.setMinutes(0, 0, 0);
    nowBucket.setHours(nowBucket.getHours() - (nowBucket.getHours() % 2));
    dates = Array.from(
      { length: 11 },
      (_, i) => new Date(nowBucket.getTime() - (11 - i) * TWO_HOURS_MS)
    );
    labels = dates.map((d) =>
      formatTime(d, { hour: "2-digit", minute: "2-digit", hour12: false })
    );
    starts = [...dates.map((d) => d.getTime()), nowBucket.getTime()];
    dates.push(new Date(anchor));
    labels.push("Now");
    end = anchor.getTime();
  } else {
    const today = new Date(anchor);
    today.setHours(0, 0, 0, 0);
    if (range === "7d") {
      dates = Array.from({ length: 7 }, (_, i) => daysBefore(today, 6 - i));
    } else if (range === "all") {
      // Pro's lifetime window: 30 buckets over ~60 days, ending today.
      dates = Array.from({ length: 30 }, (_, i) =>
        daysBefore(today, Math.round(((29 - i) * 59) / 29))
      );
    } else {
      dates = Array.from({ length: 30 }, (_, i) => daysBefore(today, 29 - i));
    }
    labels = dates.map(dayLabel);
    starts = dates.map((d) => d.getTime());
    end = daysBefore(today, -1).getTime() - 1;
  }

  const span = { start: dates[0] ?? anchor, end: dates.at(-1) ?? anchor };
  const granularity = range === "24h" ? "hour" : "day";
  return {
    labels,
    tooltips: dates.map((d) => formatChartTooltipDate(d, granularity, span)),
    starts,
    end,
  };
}

/** The bucket a send falls in, or null when the window excludes it. */
function bucketIndexOf(buckets: Buckets, sentAt: Date): number | null {
  const t = sentAt.getTime();
  if (t < (buckets.starts[0] ?? 0) || t > buckets.end) {
    return null;
  }
  let index = 0;
  buckets.starts.forEach((start, i) => {
    if (start <= t) {
      index = i;
    }
  });
  return index;
}

/** One range's view of the setup messages: the messages the window holds,
 *  each placed in its bucket. Every tile, bar, Top row and table cell reads
 *  this, so they reconcile. */
type SetupWindow = {
  buckets: Buckets;
  /** Per bucket, the messages sent in it. */
  perBucket: WorkspaceMessage[][];
  /** Every message in the window. */
  messages: WorkspaceMessage[];
};

function windowOf(
  buckets: Buckets,
  messages: readonly WorkspaceMessage[]
): SetupWindow {
  const perBucket: WorkspaceMessage[][] = buckets.labels.map(() => []);
  const inWindow: WorkspaceMessage[] = [];
  for (const message of messages) {
    const index = bucketIndexOf(buckets, message.sentAt);
    if (index !== null) {
      perBucket[index]?.push(message);
      inWindow.push(message);
    }
  }
  return { buckets, perBucket, messages: inWindow };
}

/* ─── KPI rail: Pro's three tiles, no delta (no prior period) ───────────── */

function KpiRail({ setup }: { setup: SetupWindow }) {
  const { buckets, messages, perBucket } = setup;
  return (
    <KpiRailShell columns={3}>
      <CompactKpi
        flat
        spark={
          <CompactSpark
            colorVar="var(--color-chart-1)"
            data={perBucket.map(spendOf)}
            labels={buckets.tooltips}
            tooltip
            valueFormatter={fmtSpend}
          />
        }
        title="Total spend"
        value={fmtSpend(spendOf(messages))}
      />
      <CompactKpi
        flat
        spark={
          <CompactSpark
            colorVar="var(--color-neutral-500)"
            data={perBucket.map((b) => b.length)}
            labels={buckets.tooltips}
            tooltip
            valueFormatter={(v) => fmtInt(Math.round(v))}
          />
        }
        title="Total messages"
        value={formatCompactCount(messages.length)}
      />
      <CompactKpi
        flat
        spark={
          <CompactSpark
            colorVar="var(--color-chart-3)"
            data={perBucket.map(tokensOfAll)}
            labels={buckets.tooltips}
            tooltip
            valueFormatter={(v) => fmtTokens(Math.round(v))}
          />
        }
        title="Tokens used"
        value={formatCompactCount(tokensOfAll(messages))}
      />
    </KpiRailShell>
  );
}

/* ─── Trend card: TrendCard over the setup messages ─────────────────────── */

/** TrendCard's authored Select nouns, verbatim. */
const DIMENSION_OPTIONS: { value: Dimension; noun: string }[] = [
  { value: "model", noun: "model" },
  { value: "provider", noun: "provider" },
  { value: "apiKey", noun: "API key" },
];

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

/** TrendCard's savings domain: % saved tops out at 30. */
const SAVINGS_DOMAIN = [0, 30] as const;
/** The phone copy's all-$0 spend axis: recharts draws no tick for an all-zero
 *  series, so one "$0" tick is pinned on the baseline. */
const SPEND_DOMAIN = [0, 1] as const;
const SPEND_TICKS = [0];

/** TrendCard `fmtPct`, verbatim. */
const fmtPct = (frac: number) => {
  const pct = frac * 100;
  return pct < 10 ? `${pct.toFixed(1)}%` : `${Math.round(pct)}%`;
};

/** The one series key: both messages share one model, provider and key. */
/** A series' part of one bar. Under Savings: its saved tokens over ALL the
 *  bar's input tokens, so the stack sums to the bar's rate (Pro's stack). */
function segmentOf(
  metric: TrendMetric,
  own: readonly WorkspaceMessage[],
  all: readonly WorkspaceMessage[]
): number {
  if (metric !== "savings") {
    return metric === "spend" ? spendOf(own) : tokensOfAll(own);
  }
  const inTokens = inTokensOf(all);
  return inTokens === 0
    ? 0
    : (sumOf(own, (m) => m.savedTokens) / inTokens) * 100;
}

function TrendCard({
  setup,
  traffic,
  range,
  customRange,
}: {
  setup: SetupWindow;
  traffic: WorkspaceTraffic;
  range: Range;
  customRange: CustomRange | null;
}) {
  const [dimension, setDimension] = useState<Dimension>("model");
  const [metric, setMetric] = useState<TrendMetric>("tokens");
  const isSpend = metric === "spend";
  const isSavings = metric === "savings";
  const { buckets } = setup;

  // A series per model, provider or key, slotted by first use over all the
  // traffic so a series keeps its colour across ranges.
  const groups = useMemo(
    () => workspaceGroups(traffic.messages, dimension),
    [traffic.messages, dimension]
  );
  const seriesList: ChartSeries[] = groups.map((g) => ({
    key: g.key,
    label: g.label,
    slot: g.slot,
  }));
  const groupOf = useMemo(
    () => new Map(groups.flatMap((g) => g.messages.map((m) => [m.id, g.key]))),
    [groups]
  );
  const ofSeries = (key: string, messages: readonly WorkspaceMessage[]) =>
    messages.filter((m) => groupOf.get(m.id) === key);
  const measure = isSavings ? savedPctOf : isSpend ? spendOf : tokensOfAll;

  // TrendCard's density ladder: fold buckets to what the column can draw. A
  // folded bar measures its whole group's messages, so Savings stays a true
  // rate rather than a mean over empty buckets.
  const [chartPaneRef, columnWidth] = useChartColumnWidth();
  const groupSize = getBucketGroupSize(columnWidth, buckets.labels.length);
  const data = useMemo(() => {
    const rows: Record<string, number | string>[] = [];
    for (let start = 0; start < buckets.labels.length; start += groupSize) {
      const inGroup = setup.perBucket.slice(start, start + groupSize).flat();
      const row: Record<string, number | string> = {
        date: buckets.labels[start] ?? "",
      };
      for (const g of groups) {
        row[g.key] = segmentOf(
          metric,
          inGroup.filter((m) => groupOf.get(m.id) === g.key),
          inGroup
        );
      }
      rows.push(row);
    }
    return rows;
  }, [buckets, setup, groupSize, groups, groupOf, metric]);
  const axisTicks = useMemo(
    () => getAxisTicks(data, columnWidth),
    [data, columnWidth]
  );
  const tooltipDates = useMemo(
    () => new Map(buckets.labels.map((l, i) => [l, buckets.tooltips[i] ?? l])),
    [buckets]
  );
  const chartConfig: ChartConfig = Object.fromEntries(
    seriesList.map((s) => [s.key, { label: s.label, color: seriesColor(s) }])
  );

  const total = measure(setup.messages);
  const valueFormatter = (v: number) => {
    if (isSavings) {
      return `${v.toFixed(1)}%`;
    }
    return isSpend ? fmtSpend(v) : fmtTokens(Math.round(v));
  };
  const spendIsZero = isSpend && total === 0;

  return (
    <Card>
      <CardHeader className="flex @2xl:grid flex-col gap-2 @2xl:gap-x-2 @2xl:gap-y-0">
        <CardTitle>{TREND_TITLE[metric]}</CardTitle>
        <CardDescription>
          Stacked by{" "}
          {DIMENSION_OPTIONS.find((d) => d.value === dimension)?.noun}
          {" · "}
          {getBucketLabel(range, customRange, groupSize)}
        </CardDescription>
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
      <CardContent className="grid @4xl:grid-cols-12 grid-cols-1 gap-4">
        <div className="@4xl:col-span-8" ref={chartPaneRef}>
          <ChartContainer
            className="aspect-auto h-[184px] w-full"
            config={chartConfig}
          >
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
                axisLine={false}
                domain={
                  isSavings
                    ? SAVINGS_DOMAIN
                    : spendIsZero
                      ? SPEND_DOMAIN
                      : undefined
                }
                tick={ChartYAxisTick}
                tickFormatter={(value: number) => {
                  if (isSavings) {
                    return `${value}%`;
                  }
                  return isSpend ? `$${value}` : fmtTokens(value);
                }}
                tickLine={false}
                ticks={spendIsZero ? SPEND_TICKS : undefined}
                width={CHART_Y_AXIS_WIDTH}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(_, payload) => {
                      const axisLabel = String(
                        payload?.[0]?.payload?.date ?? ""
                      );
                      return tooltipDates.get(axisLabel) ?? axisLabel;
                    }}
                    valueFormatter={valueFormatter}
                  />
                }
                cursor={false}
              />
              {seriesList.map((s, i) => (
                <Bar
                  dataKey={s.key}
                  fill={seriesColor(s)}
                  isAnimationActive={false}
                  key={s.key}
                  radius={
                    i === seriesList.length - 1 ? [1, 1, 0, 0] : undefined
                  }
                  stackId="spend"
                />
              ))}
            </BarChart>
          </ChartContainer>
        </div>
        {/* TrendBreakdownPanel: each series, its value and share (the
            series' own saved rate under Savings). */}
        <div className="@4xl:col-span-4 border-border border-t @4xl:border-t-0 @4xl:border-l @4xl:pt-0 pt-4 @4xl:pl-3">
          <div className="flex flex-col gap-1">
            {seriesList.map((s) => {
              const value = measure(ofSeries(s.key, setup.messages));
              return (
                <div
                  className="flex min-w-0 items-center gap-2 rounded-xs px-2 py-1"
                  key={s.key}
                >
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-xs"
                    style={{ backgroundColor: seriesColor(s) }}
                  />
                  <span className="type-copy-14 min-w-0 flex-1 truncate text-foreground">
                    {s.label}
                  </span>
                  {isSavings ? (
                    <span className="type-mono-14 shrink-0 text-right text-foreground">
                      {`${value.toFixed(1)}%`}
                    </span>
                  ) : (
                    <div
                      className="type-mono-14 grid shrink-0 items-center gap-x-2"
                      style={{ gridTemplateColumns: "9ch min-content 4ch" }}
                    >
                      <span className="text-right text-foreground">
                        {valueFormatter(value)}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-right text-foreground">
                        {fmtPct(total > 0 ? value / total : 0)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Top-by-axis row: models, API keys, users, attack types ────────────── */

type TopRow = {
  rowKey: string;
  label: string;
  labelClassName?: string;
  value: string;
  avatar: ReactNode;
};

/** Activity.tsx `TopList`, verbatim. */
function TopList<T extends string>({
  title,
  subtitle,
  rows,
  metric,
  options,
  onMetricChange,
}: {
  title: string;
  subtitle: string;
  rows: TopRow[];
  metric: T;
  options: { value: T; label: string }[];
  onMetricChange: (m: T) => void;
}) {
  return (
    <Card density="flush">
      <div className="flex items-start justify-between gap-2 p-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="type-heading-16 m-0 text-foreground leading-snug">
            {title}
          </h3>
          <p className="type-copy-14 m-0 text-muted-foreground">{subtitle}</p>
        </div>
        <SegmentedPill
          aria-label="Chart metric"
          onValueChange={(v) => onMetricChange(v as T)}
          options={options}
          size="sm"
          value={metric}
        />
      </div>
      <div className="flex flex-col gap-3 px-4 pb-4">
        {rows.map((row) => (
          <div className="flex min-w-0 items-center gap-2" key={row.rowKey}>
            {row.avatar}
            <span
              className={`type-copy-14 min-w-0 flex-1 truncate text-foreground ${row.labelClassName ?? ""}`}
              title={row.label}
            >
              {row.label}
            </span>
            <span className="type-mono-14 whitespace-nowrap text-foreground">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Activity.tsx `KEY_AVATAR`, verbatim. */
const KEY_AVATAR = (
  <Key
    aria-hidden
    className="size-4 shrink-0 text-muted-foreground"
    strokeWidth={2}
  />
);

type AttackMetric = "amount" | "percent";

const ATTACK_METRIC_OPTIONS: { value: AttackMetric; label: string }[] = [
  { value: "amount", label: "Amount" },
  { value: "percent", label: "Percent" },
];

/** Activity.tsx `attackAvatar`: icon + color from the Security TYPE_META. */
const attackAvatar = (kind: "pii" | "injection" | "credential") => {
  const { Icon, color } = TYPE_META[kind];
  return (
    <Icon
      aria-hidden
      className="size-4 shrink-0"
      strokeWidth={1.75}
      style={{ color }}
    />
  );
};

/** A Top row's figure on the chosen lens, in TopList's formats. */
const lensValue = (metric: Metric, messages: readonly WorkspaceMessage[]) =>
  metric === "spend"
    ? fmtSpend(spendOf(messages))
    : fmtTokens(tokensOfAll(messages));

/** The signed-in account owner, the person the sidebar's account row shows
 *  (owner 2026-10-13): the workspace's owner member, with its avatar tone. */
const OWNER = MEMBER_ROWS.find((member) => member.role === "owner");
const ownerName = () => OWNER?.name ?? "";

function TopByAxisRow({ setup }: { setup: SetupWindow }) {
  const [modelMetric, setModelMetric] = useState<Metric>("tokens");
  const [keyMetric, setKeyMetric] = useState<Metric>("tokens");
  const [userMetric, setUserMetric] = useState<Metric>("tokens");
  const [attackMetric, setAttackMetric] = useState<AttackMetric>("amount");
  const subtitleFor = (m: Metric) =>
    m === "spend" ? "By total spend" : "By total tokens used";

  // A row per model and per key in the window, biggest first on the lens.
  const byLens = (metric: Metric) => (g: { messages: WorkspaceMessage[] }) =>
    metric === "spend" ? spendOf(g.messages) : tokensOfAll(g.messages);
  const modelRows: TopRow[] = workspaceGroups(setup.messages, "model")
    .toSorted((a, b) => byLens(modelMetric)(b) - byLens(modelMetric)(a))
    .map((g) => ({
      rowKey: g.id,
      label: g.label,
      value: lensValue(modelMetric, g.messages),
      avatar: g.vendor ? <VendorAvatar vendor={g.vendor} /> : null,
    }));

  const keyRows: TopRow[] = workspaceGroups(setup.messages, "apiKey")
    .toSorted((a, b) => byLens(keyMetric)(b) - byLens(keyMetric)(a))
    .map((g) => ({
      rowKey: g.id,
      label: g.label,
      labelClassName: "font-mono",
      value: lensValue(keyMetric, g.messages),
      avatar: KEY_AVATAR,
    }));

  const userName = ownerName();
  const userRows: TopRow[] = [
    {
      rowKey: "account-owner",
      label: userName,
      value: lensValue(userMetric, setup.messages),
      avatar: (
        <Monogram
          initials={(userName.trim().split(/\s+/)[0]?.[0] ?? "?").toUpperCase()}
          size="sm"
          tone={OWNER?.avatarTone ?? "ink"}
        />
      ),
    },
  ];

  // Pro's three attack types: the blocked demo is a prompt injection, the
  // other two logged none. Biggest first, the order Pro's mix carries; the
  // percent keeps Pro's `|| 1` guard.
  const blocked = blockedOf(setup.messages);
  const counts = ATTACK_MIX.map((c) => ({
    key: c.key,
    label: c.label,
    count: c.key === "injection" ? blocked : 0,
  })).toSorted((a, b) => b.count - a.count);
  const totalCount = counts.reduce((a, c) => a + c.count, 0) || 1;
  const attackRows: TopRow[] = counts.map((c) => ({
    rowKey: c.key,
    label: c.label,
    value:
      attackMetric === "percent"
        ? `${((100 * c.count) / totalCount).toFixed(1)}%`
        : fmtInt(c.count),
    avatar: attackAvatar(c.key),
  }));

  return (
    <div className="grid @3xl:grid-cols-2 @7xl:grid-cols-4 grid-cols-1 gap-4">
      <TopList
        metric={modelMetric}
        onMetricChange={setModelMetric}
        options={METRIC_OPTIONS}
        rows={modelRows}
        subtitle={subtitleFor(modelMetric)}
        title="Top models"
      />
      <TopList
        metric={keyMetric}
        onMetricChange={setKeyMetric}
        options={METRIC_OPTIONS}
        rows={keyRows}
        subtitle={subtitleFor(keyMetric)}
        title="Top API keys"
      />
      <TopList
        metric={userMetric}
        onMetricChange={setUserMetric}
        options={METRIC_OPTIONS}
        rows={userRows}
        subtitle={subtitleFor(userMetric)}
        title="Top users"
      />
      <TopList
        metric={attackMetric}
        onMetricChange={setAttackMetric}
        options={ATTACK_METRIC_OPTIONS}
        rows={attackRows}
        subtitle={
          attackMetric === "percent"
            ? "By total attack percentage"
            : "By total attack amount"
        }
        title="Top attack types"
      />
    </div>
  );
}

/* ─── Recent key usage: UsageByKey over the one key ─────────────────────── */

type KeyRow = {
  key: string;
  label: string;
  owner: string;
  device: string;
  requests: number;
  alerts: number;
  tokensIn: number;
  tokensOut: number;
  /** Display percentage, one decimal (0.1 -> "0.1%"). */
  saved: number;
  spend: number;
};

function keySortValue(row: KeyRow, key: string): string | number | null {
  switch (key) {
    case "label":
      return row.label;
    case "owner":
      return row.owner;
    case "device":
      return row.device;
    case "requests":
      return parseNumeric(row.requests);
    case "alerts":
      return parseNumeric(row.alerts);
    case "tokensIn":
      return parseNumeric(row.tokensIn);
    case "spend":
      return parseNumeric(row.spend);
    case "saved":
      return row.saved;
    default:
      return null;
  }
}

function UsageByKey({ setup }: { setup: SetupWindow }) {
  const { sort, toggle: toggleSort } = useTableSort();
  const [query, setQuery] = useState("");
  const [hideRevoked, setHideRevoked] = useState(true);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("25");

  // Pro's reset: back to page 1 when the ordering or the window changes.
  const [prevResetKey, setPrevResetKey] = useState("");
  const resetKey = `${setup.buckets.starts[0]}|${setup.buckets.end}|${sort.key}|${sort.dir}|${query}|${hideRevoked}`;
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setPage(1);
  }

  // A row per key the messages used (setup's and Gate Chat's caller; one
  // row when setup ran on Gate Connect). None is ever revoked, so "Hide
  // revoked" keeps them.
  const rows = useMemo<KeyRow[]>(
    () =>
      workspaceGroups(setup.messages, "apiKey").map((g) => ({
        key: g.id,
        label: g.label,
        owner: ownerName(),
        device: "—",
        requests: g.messages.length,
        alerts: blockedOf(g.messages),
        tokensIn: inTokensOf(g.messages),
        tokensOut: outTokensOf(g.messages),
        saved: savedPctOf(g.messages),
        spend: spendOf(g.messages),
      })),
    [setup.messages]
  );

  const searchedRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return rows;
    }
    return rows.filter(
      (r) =>
        r.label.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q)
    );
  }, [rows, query]);

  const filteredRows = useMemo(
    () => sortRows(searchedRows, sort, keySortValue),
    [searchedRows, sort]
  );

  const perPage = resolveRowsPerPage(rowsPerPage, filteredRows.length);
  const pageRows = useMemo(
    () => filteredRows.slice((page - 1) * perPage, page * perPage),
    [filteredRows, page, perPage]
  );

  const isEmpty = filteredRows.length === 0;

  return (
    <div className="mt-2 flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <SectionTitle>Recent key usage</SectionTitle>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            ariaLabel="Search keys"
            className="@2xl:w-auto w-full min-w-0 @2xl:flex-1"
            onChange={setQuery}
            placeholder="Search key or member…"
            surface="elevated"
            value={query}
          />
          <Button
            className="@2xl:flex-none grow basis-1/3"
            size="default"
            type="button"
            variant="outline"
          >
            <UploadIcon aria-hidden data-icon="inline-start" size={16} />
            Export CSV
          </Button>
          <span className="flex @2xl:flex-none grow basis-1/3 items-center justify-end gap-2">
            <span
              className="type-label-14 whitespace-nowrap text-muted-foreground"
              id="hide-revoked-label"
            >
              Hide revoked
            </span>
            <Switch
              aria-labelledby="hide-revoked-label"
              checked={hideRevoked}
              onCheckedChange={setHideRevoked}
            />
          </span>
        </div>
      </div>
      <Card density="flush" id="usage-by-key">
        {isEmpty ? (
          <TableEmptyState
            body="No keys match your search or filter. Try a different name or clear the filter."
            title="No keys match"
          />
        ) : (
          <>
            {/* Activity.tsx's floor and column split, verbatim. */}
            <Table className="min-w-[1152px] table-fixed">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <SortableTableHead
                    className="w-[14%] whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="label"
                  >
                    Key
                  </SortableTableHead>
                  <SortableTableHead
                    className="w-[14%] whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="owner"
                  >
                    Users
                  </SortableTableHead>
                  <SortableTableHead
                    className="w-[14%] whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="device"
                  >
                    Device name
                  </SortableTableHead>
                  <SortableTableHead
                    className="whitespace-nowrap"
                    numeric
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="requests"
                  >
                    Messages
                  </SortableTableHead>
                  <SortableTableHead
                    className="whitespace-nowrap"
                    numeric
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="alerts"
                  >
                    Alerts
                  </SortableTableHead>
                  <SortableTableHead
                    className="whitespace-nowrap"
                    numeric
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="tokensIn"
                  >
                    Tokens In/Out
                  </SortableTableHead>
                  <SortableTableHead
                    className="whitespace-nowrap"
                    numeric
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="saved"
                  >
                    Saved
                  </SortableTableHead>
                  <SortableTableHead
                    className="whitespace-nowrap"
                    numeric
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="spend"
                  >
                    Spend
                  </SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((row) => (
                  <TableRow className="hover:bg-transparent" key={row.key}>
                    <TableCell className="type-mono-14 whitespace-nowrap">
                      <span className="inline-flex max-w-full items-center gap-2">
                        <span
                          className="min-w-0 max-w-[20ch] truncate text-foreground"
                          title={row.label}
                        >
                          {row.label}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span
                        className="type-copy-14 block max-w-[20ch] truncate text-foreground"
                        title={row.owner}
                      >
                        {row.owner}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span
                        className="type-copy-14 block max-w-[20ch] truncate text-foreground"
                        title={row.device}
                      >
                        {row.device}
                      </span>
                    </TableCell>
                    <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                      {fmtInt(row.requests)}
                    </TableCell>
                    <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                      {fmtInt(row.alerts)}
                    </TableCell>
                    <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                      {fmtTokens(row.tokensIn)}
                      <span className="type-mono-12 block text-muted-foreground">
                        {fmtTokens(row.tokensOut)}
                      </span>
                    </TableCell>
                    <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                      {`${row.saved.toFixed(1)}%`}
                    </TableCell>
                    <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                      {fmtSpend(row.spend)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePaginationFooter
              minRowsPerPage={25}
              onPageChange={setPage}
              onRowsPerPageChange={setRowsPerPage}
              page={page}
              rowsPerPage={rowsPerPage}
              total={filteredRows.length}
            />
          </>
        )}
      </Card>
    </div>
  );
}
