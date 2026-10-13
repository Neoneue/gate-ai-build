import {
  ArrowLeftRight,
  BarChart2,
  Key,
  type LucideIcon,
  Zap,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { VendorAvatar } from "@/components/icons/vendor-avatar";
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
import { KpiRail } from "@/components/ui/kpi-rail";
import { Monogram } from "@/components/ui/monogram";
import { SectionTitle } from "@/components/ui/section-title";
import { SegmentedPill } from "@/components/ui/segmented-pill";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { MEMBER_ROWS } from "@/data/team-members";
import {
  formatChartTooltipDate,
  formatCompactCount,
  formatDate,
  formatTime,
} from "@/lib/formatters";
import {
  type CustomRange,
  type PresetRange,
  RANGE_OPTIONS,
  type Range,
} from "@/lib/range";
import {
  aggregateBuckets,
  fmtInt,
  fmtTokens,
  fmtUsd,
  getBucketCount,
  getBucketGroupSize,
  getBucketLabel,
} from "@/pages/activity/chart-helpers";
import {
  METRIC_OPTIONS,
  type Metric,
  seriesColor,
} from "@/pages/activity-data";
import { formatExactUsd } from "@/pages/chat/chat-data";
import {
  type OnboardingDemoMessage,
  type OnboardingDemoModel,
  type OnboardingDemoTraffic,
  totalCostUsd,
  totalTokens,
  useOnboardingDemoTraffic,
} from "@/pages/onboarding/onboarding-demo-traffic";
import {
  EmptyChartCard,
  EmptyKpiTile,
  IconChip,
  MobilePageHeader,
  MobilePageMain,
} from "@/pages/onboarding/onboarding-mobile-parts";
import { ATTACK_MIX } from "@/pages/security/events-data";
import { TYPE_META } from "@/pages/security-data";

/* ─── OnboardingMobileActivity ──────────────────────────────────────────────
 * `/activity-mobile-onboarding`: the Mobile A demo's Activity.
 *
 * Before the first Gate Chat message: the `ActivityDefault` copy, unchanged
 * (owner 2026-10-12: "Default is fine for default").
 *
 * After it: a copy of the Pro page (`Activity.tsx`: control row :133, KpiRail
 * :287, TopByAxisRow :472, UsageByKey :719; `activity/TrendCard.tsx`) fed by
 * every demo message instead of mock traffic (owner 2026-10-12,
 * `useOnboardingDemoTraffic`):
 *   - Total spend (the free models' $0.00), the message count and the token
 *     sum for the range. No delta: there is no prior period.
 *   - Tokens over time: stacked by the models the demo used (the Qwen free
 *     model, plus the free GLM if it was picked). The Savings lens and the
 *     model / provider / API key Select are cut: no savings data exists, the
 *     free models' provider is unknown and no API key carried a message, so
 *     only "By model" would be true.
 *   - Top models: each model used. Top users: the person who signed up, with
 *     every message. Top API keys: empty, no key is set up. Top attack types:
 *     the Pro card's own rows at 0, none logged.
 *   - Recent key usage stays the Default empty state: a Gate Chat message is
 *     sent from the signed-in session, not an API key.
 * Range state is LOCAL: the desktop page never sees it. Buckets anchor on the
 * newest message's real send time, not the demo clock the mock charts use.
 * Mobile only (owner 2026-10-11, no-thrash.md).
 * ───────────────────────────────────────────────────────────────────────── */

export function OnboardingMobileActivity() {
  const traffic = useOnboardingDemoTraffic();
  return traffic ? (
    <ActivityAfterFirstMessage traffic={traffic} />
  ) : (
    <ActivityBeforeFirstMessage />
  );
}

const PAGE_DESCRIPTION =
  "Cost, request volume, and token usage by model, API key, and team member.";

/** `ActivityDefault`, as it was before the first message. */
function ActivityBeforeFirstMessage() {
  return (
    <MobilePageMain>
      <MobilePageHeader description={PAGE_DESCRIPTION} title="Activity" />
      <div className="flex flex-col gap-4">
        <SectionTitle>Overview</SectionTitle>
        <KpiRail columns={3}>
          <EmptyKpiTile icon={BarChart2} label="No spend yet" />
          <EmptyKpiTile icon={ArrowLeftRight} label="No messages yet" />
          <EmptyKpiTile icon={Zap} label="No tokens yet" />
        </KpiRail>
        <EmptyChartCard icon={Zap} label="No tokens used" />
      </div>
      <RecentKeyUsage />
    </MobilePageMain>
  );
}

/** The Pro page's sections, in the Pro order. */
function ActivityAfterFirstMessage({
  traffic,
}: {
  traffic: OnboardingDemoTraffic;
}) {
  // Pro defaults to "all" (Activity.tsx :118); never the shared range store.
  const [range, setRange] = useState<Range>("all");
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);
  // The newest message anchors the window (messages are newest first).
  const anchor = traffic.messages[0]?.sentAt ?? null;
  const demo = useMemo(
    () =>
      anchor
        ? windowOf(buildBuckets(range, customRange, anchor), traffic.messages)
        : null,
    [range, customRange, anchor, traffic.messages]
  );
  if (!demo) {
    return <ActivityBeforeFirstMessage />;
  }

  return (
    <MobilePageMain>
      <MobilePageHeader description={PAGE_DESCRIPTION} title="Activity" />
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
        <DemoKpiRail demo={demo} />
        <DemoTrendCard
          customRange={customRange}
          demo={demo}
          models={traffic.models}
          range={range}
        />
      </div>
      <DemoTopRow demo={demo} models={traffic.models} />
      <RecentKeyUsage />
    </MobilePageMain>
  );
}

/* ─── Buckets: the Pro geometry, anchored on the newest send ───────────── */

type Buckets = {
  /** Bucket instants, same count and stepping as `getRangeDates`. */
  dates: Date[];
  /** Short x-axis labels, same shapes as `getRangeLabels`. */
  labels: string[];
  /** Full tooltip date per bucket (`formatChartTooltipDate`). */
  tooltips: string[];
  /** Where each bucket starts, for placing a message: bucket i holds a send
   *  from `starts[i]` up to the next start, the last one up to `end`. */
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
    // A trailing 24 hours: eleven 2-hour buckets on the even hours, then the
    // bucket the newest message landed in, labelled "Now" like Pro's.
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

  const span = {
    start: dates[0] ?? anchor,
    end: dates.at(-1) ?? anchor,
  };
  const granularity = range === "24h" ? "hour" : "day";
  return {
    dates,
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

/** One range's view of the demo traffic: the messages the window holds,
 *  each placed in its bucket. Every tile, bar and Top row below reads this,
 *  so the rail, the chart and the lists reconcile. */
type DemoWindow = {
  buckets: Buckets;
  /** Per bucket, the messages sent in it. */
  perBucket: OnboardingDemoMessage[][];
  /** Every message in the window. */
  messages: OnboardingDemoMessage[];
};

function windowOf(
  buckets: Buckets,
  messages: readonly OnboardingDemoMessage[]
): DemoWindow {
  const perBucket: OnboardingDemoMessage[][] = buckets.dates.map(() => []);
  const inWindow: OnboardingDemoMessage[] = [];
  for (const message of messages) {
    const index = bucketIndexOf(buckets, message.sentAt);
    if (index !== null) {
      perBucket[index]?.push(message);
      inWindow.push(message);
    }
  }
  return { buckets, perBucket, messages: inWindow };
}

/** A per-bucket series of one measure. */
function seriesOf(
  demo: DemoWindow,
  measure: (messages: readonly OnboardingDemoMessage[]) => number
): number[] {
  return demo.perBucket.map(measure);
}

const messageCount = (messages: readonly OnboardingDemoMessage[]) =>
  messages.length;

/* ─── KPI rail: Pro's three tiles, no delta (no prior period) ───────────── */

function DemoKpiRail({ demo }: { demo: DemoWindow }) {
  const { buckets, messages } = demo;
  return (
    <KpiRail columns={3}>
      <CompactKpi
        flat
        spark={
          <CompactSpark
            colorVar="var(--color-chart-1)"
            data={seriesOf(demo, totalCostUsd)}
            labels={buckets.tooltips}
            tooltip
            valueFormatter={(v) => fmtUsd(v)}
          />
        }
        title="Total spend"
        // The free models cost nothing: $0.00, the figure the chat reply
        // and the Messages Cost cells show.
        value={formatExactUsd(totalCostUsd(messages))}
      />
      <CompactKpi
        flat
        spark={
          <CompactSpark
            colorVar="var(--color-neutral-500)"
            data={seriesOf(demo, messageCount)}
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
            data={seriesOf(demo, totalTokens)}
            labels={buckets.tooltips}
            tooltip
            valueFormatter={(v) => fmtTokens(Math.round(v))}
          />
        }
        title="Tokens used"
        value={formatCompactCount(totalTokens(messages))}
      />
    </KpiRail>
  );
}

/* ─── Tokens over time: TrendCard stacked by the models used ───────────── */

/** Spend is $0 on every bucket (the free models), and recharts draws no tick
 *  at all for an all-zero series: pin one "$0" tick on the baseline instead.
 *  Hoisted so recharts sees a stable prop. */
const SPEND_DOMAIN = [0, 1] as const;
const SPEND_TICKS = [0];

const TREND_TITLE: Record<Metric, string> = {
  tokens: "Tokens over time",
  spend: "Spend over time",
};

function DemoTrendCard({
  demo,
  models,
  range,
  customRange,
}: {
  demo: DemoWindow;
  models: readonly OnboardingDemoModel[];
  range: Range;
  customRange: CustomRange | null;
}) {
  const [metric, setMetric] = useState<Metric>("tokens");
  const isSpend = metric === "spend";
  const { buckets } = demo;
  const measure = isSpend ? totalCostUsd : totalTokens;
  // TrendBreakdownPanel's order: the biggest model first, every model the
  // demo used listed (a model with nothing in this window reads 0).
  const breakdown = models
    .map((model) => ({
      model,
      value: measure(demo.messages.filter((m) => m.modelId === model.id)),
    }))
    .toSorted((a, b) => b.value - a.value);
  const total = breakdown.reduce((sum, row) => sum + row.value, 0);

  // Same density ladder as TrendCard: fold buckets to what the column draws.
  const [chartPaneRef, columnWidth] = useChartColumnWidth();
  const groupSize = getBucketGroupSize(columnWidth, buckets.dates.length);
  const data = useMemo(() => {
    const rows = buckets.labels.map((date, i) => {
      const inBucket = demo.perBucket[i] ?? [];
      const row: Record<string, number | string> = { date };
      for (const model of models) {
        row[model.id] = measure(inBucket.filter((m) => m.modelId === model.id));
      }
      return row;
    });
    return aggregateBuckets(rows, groupSize, false);
  }, [buckets, demo, models, measure, groupSize]);
  const axisTicks = useMemo(
    () => getAxisTicks(data, columnWidth),
    [data, columnWidth]
  );
  const tooltipDates = useMemo(
    () => new Map(buckets.labels.map((l, i) => [l, buckets.tooltips[i] ?? l])),
    [buckets]
  );
  const chartConfig: ChartConfig = Object.fromEntries(
    models.map((m) => [m.id, { label: m.label, color: seriesColor(m) }])
  );
  const valueFormatter = (v: number) =>
    isSpend ? fmtUsd(v) : fmtTokens(Math.round(v));
  // Pro's `|| 1` guard: a $0 lens reads 0.0% on every row.
  const shareOf = (value: number) => (value / (total || 1)) * 100;
  // Every bar is $0 on the spend lens (the free models): pin the "$0" tick.
  const spendIsZero = isSpend && total === 0;

  return (
    <Card>
      <CardHeader className="flex @2xl:grid flex-col gap-2 @2xl:gap-x-2 @2xl:gap-y-0">
        <CardTitle>{TREND_TITLE[metric]}</CardTitle>
        <CardDescription>
          Stacked by model{" · "}
          {getBucketLabel(range, customRange, groupSize)}
        </CardDescription>
        <CardAction className="@min-[638px]/card-header:my-0 my-1">
          <SegmentedPill
            aria-label="Chart metric"
            onValueChange={(v) => setMetric(v as Metric)}
            options={METRIC_OPTIONS}
            size="sm"
            value={metric}
          />
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
                allowDecimals={false}
                axisLine={false}
                domain={spendIsZero ? SPEND_DOMAIN : undefined}
                tick={ChartYAxisTick}
                tickFormatter={(value: number) =>
                  isSpend ? `$${value}` : fmtTokens(value)
                }
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
              {models.map((model, i) => (
                <Bar
                  dataKey={model.id}
                  fill={seriesColor(model)}
                  isAnimationActive={false}
                  key={model.id}
                  radius={i === models.length - 1 ? [1, 1, 0, 0] : undefined}
                  stackId="usage"
                />
              ))}
            </BarChart>
          </ChartContainer>
        </div>
        <div className="@4xl:col-span-4 border-border border-t @4xl:border-t-0 @4xl:border-l @4xl:pt-0 pt-4 @4xl:pl-3">
          <div className="flex flex-col gap-1">
            {breakdown.map(({ model, value }) => (
              <div
                className="flex min-w-0 items-center gap-2 rounded-xs px-2 py-1"
                key={model.id}
              >
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-xs"
                  style={{ backgroundColor: seriesColor(model) }}
                />
                <span className="type-copy-14 min-w-0 flex-1 truncate text-foreground">
                  {model.label}
                </span>
                {/* TrendBreakdownPanel's value · share cluster; the share
                    column is 6ch here (not 4ch) so "100.0%" fits. */}
                <div
                  className="type-mono-14 grid shrink-0 items-center gap-x-2"
                  style={{ gridTemplateColumns: "9ch min-content 6ch" }}
                >
                  <span className="text-right text-foreground">
                    {valueFormatter(value)}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-right text-foreground">
                    {`${shareOf(value).toFixed(1)}%`}
                  </span>
                </div>
              </div>
            ))}
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
              className="type-copy-14 min-w-0 flex-1 truncate text-foreground"
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

/** A Top card with nothing to rank: the TopList header without the subtitle
 *  and metric pill (nothing to sort), over the Default pages' empty body,
 *  an icon chip over one muted line (`EmptyChartCard`). */
function TopEmptyCard({
  title,
  icon,
  label,
}: {
  title: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Card density="flush">
      <div className="flex items-start justify-between gap-2 p-4">
        <h3 className="type-heading-16 m-0 text-foreground leading-snug">
          {title}
        </h3>
      </div>
      <div className="flex flex-col items-center justify-center gap-3 px-4 pb-8">
        <IconChip icon={icon} />
        <span className="type-copy-14 text-muted-foreground">{label}</span>
      </div>
    </Card>
  );
}

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
function lensValue(
  metric: Metric,
  messages: readonly OnboardingDemoMessage[]
): { sort: number; label: string } {
  return metric === "spend"
    ? { sort: totalCostUsd(messages), label: fmtUsd(totalCostUsd(messages)) }
    : { sort: totalTokens(messages), label: fmtTokens(totalTokens(messages)) };
}

function DemoTopRow({
  demo,
  models,
}: {
  demo: DemoWindow;
  models: readonly OnboardingDemoModel[];
}) {
  const [modelMetric, setModelMetric] = useState<Metric>("tokens");
  const [userMetric, setUserMetric] = useState<Metric>("tokens");
  const [attackMetric, setAttackMetric] = useState<AttackMetric>("amount");
  const subtitleFor = (m: Metric) =>
    m === "spend" ? "By total spend" : "By total tokens used";

  // Each model the demo used, biggest first on the chosen lens.
  const modelRows: TopRow[] = models
    .map((model) => ({
      model,
      value: lensValue(
        modelMetric,
        demo.messages.filter((m) => m.modelId === model.id)
      ),
    }))
    .toSorted((a, b) => b.value.sort - a.value.sort)
    .map(({ model, value }) => ({
      rowKey: model.id,
      label: model.label,
      value: value.label,
      avatar: <VendorAvatar vendor={model.vendor} />,
    }));

  // The one user is the signed-in account owner (owner 2026-10-12: "I
  // would be a top user"; 2026-10-13: the same avatar and name as the
  // desktop page): the workspace's owner member, as the sidebar's account
  // row shows them. They sent every demo message, so their row holds the
  // window's whole total; Pro's Monogram, first initial, in their tone.
  const owner = MEMBER_ROWS.find((member) => member.role === "owner");
  const userName = owner?.name ?? "";
  const userRows: TopRow[] = [
    {
      rowKey: "signup-user",
      label: userName,
      value: lensValue(userMetric, demo.messages).label,
      avatar: (
        <Monogram
          initials={(userName.split(/\s+/)[0]?.[0] ?? "?").toUpperCase()}
          size="sm"
          tone={owner?.avatarTone ?? "ink"}
        />
      ),
    },
  ];

  // Pro's rows, at 0: Gate is not set up on a desktop, so nothing was
  // logged. Percent keeps Pro's `|| 1` guard, so each type reads 0.0%.
  const attackRows: TopRow[] = ATTACK_MIX.map((c) => ({
    rowKey: c.key,
    label: c.label,
    value: attackMetric === "percent" ? `${(0).toFixed(1)}%` : fmtInt(0),
    avatar: attackAvatar(c.key),
  }));

  return (
    // Activity.tsx TopByAxisRow's grid: 1-up on a phone.
    <div className="grid @3xl:grid-cols-2 @7xl:grid-cols-4 grid-cols-1 gap-4">
      <TopList
        metric={modelMetric}
        onMetricChange={setModelMetric}
        options={METRIC_OPTIONS}
        rows={modelRows}
        subtitle={subtitleFor(modelMetric)}
        title="Top models"
      />
      <TopEmptyCard icon={Key} label="No API keys yet" title="Top API keys" />
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

/* ─── Recent key usage: the Default empty state, before and after ───────── */

function RecentKeyUsage() {
  return (
    <div className="mt-2 flex flex-col gap-4">
      <SectionTitle>Recent key usage</SectionTitle>
      <Card density="flush">
        <TableEmptyState
          body="Per-key usage across messages, tokens, and spend will appear here as your workspace routes traffic."
          icon={<IconChip icon={Key} />}
          title="No usage yet"
        />
      </Card>
    </div>
  );
}
