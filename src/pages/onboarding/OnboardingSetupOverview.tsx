import { type ReactNode, useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { vendorLabel } from "@/components/icons/vendor-meta";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
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
import { KpiRail } from "@/components/ui/kpi-rail";
import { PageTitle } from "@/components/ui/page-title";
import { SectionTitle } from "@/components/ui/section-title";
import { SegmentedPill } from "@/components/ui/segmented-pill";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCompactCount,
  formatCurrency,
  formatNumber,
  formatTimestamp,
} from "@/lib/formatters";
import { type ChartSeries, seriesColor } from "@/pages/activity-data";
import { OnboardingChrome } from "@/pages/onboarding/onboarding-chrome";
import { PreviewCard } from "@/pages/onboarding/onboarding-mobile-parts";
import { ONBOARDING_ROUTES } from "@/pages/onboarding/onboarding-routes";
import {
  type SetupTraffic,
  setupCompression,
  setupTraffic,
  setupWeek,
  tokensOf,
} from "@/pages/onboarding/onboarding-setup-traffic";
import { useOnboarding } from "@/pages/onboarding/use-onboarding";
import { useSetupTraffic } from "@/pages/onboarding/use-setup-traffic";
import { GUARDRAIL_BADGE } from "@/pages/requests/data";
import { ACTION_BADGE, TYPE_META } from "@/pages/security-data";

/* ─── OnboardingSetupOverview ───────────────────────────────────────────────
 * `/overview-setup-onboarding`: the Overview after desktop setup (owner
 * 2026-10-13), reached from "Visit Overview" on the final page in the same
 * tab, so it reads this tab's setup state. A copy of the Pro Overview
 * (`Dashboard.tsx`, unchanged) per no-thrash's rule for a demo with data:
 * every section and control, fed by exactly the two step 3 messages
 * (`useSetupTraffic`: this tab's setup state, else the localStorage mirror a
 * new tab reads; the one source, so the tiles, chart and tables reconcile).
 * Every section shows data (owner 2026-10-13): Tokens saved is Gate's
 * compression over the two messages (`setupCompression`: 2 of 2,366 input
 * tokens, "0.1%", its spark the tokens saved per day), and Latest
 * conversations lists the one conversation of 2 turns both messages came
 * from (`traffic.conversation`). Rows open nothing and the preview cards
 * carry no "View all": no list or detail page holds these messages (the
 * phone Overview's precedent). Ask AI shows here (owner: once the demo is
 * done); the notifications bell stays hidden.
 * ───────────────────────────────────────────────────────────────────────── */

type Dimension = "model" | "provider" | "apiKey";
type Metric = "spend" | "tokens";

const OVERVIEW_METRIC_OPTIONS = [
  { value: "tokens", label: "Tokens" },
  { value: "spend", label: "Spend" },
];

/* Dashboard's formatters, verbatim. */
const fmtTokens = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(2)}M`
    : n >= 1000
      ? `${(n / 1000).toFixed(1)}K`
      : `${n}`;
const fmtSpend = (v: number) => formatCurrency(v, { minFrac: 0, maxFrac: 0 });
const fmtPct = (frac: number) => `${(frac * 100).toFixed(1)}%`;

/** "Oct 13 11:47:05": the Pro preview's day + time cell. */
const DAY_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});
const TIME_FORMAT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});
const timeLabel = (date: Date) =>
  `${DAY_FORMAT.format(date)} ${TIME_FORMAT.format(date)}`;

export function OnboardingSetupOverview() {
  const { improved } = useOnboarding();
  const traffic = useSetupTraffic();
  // Only after setup: before both step 3 messages passed, the final page's
  // guard sends the user to the step still due. This tab's own run also
  // needs the final page reached; a new tab (no flow state) has the mirror
  // only once step 3 passed.
  const inThisTab = setupTraffic(improved) !== null;
  if (!traffic || (inThisTab && !improved.finished)) {
    return <Navigate replace to={ONBOARDING_ROUTES.improvedComplete} />;
  }
  return (
    <OnboardingChrome showAskAi>
      <SetupOverview traffic={traffic} />
    </OnboardingChrome>
  );
}

function SetupOverview({ traffic }: { traffic: SetupTraffic }) {
  const week = useMemo(() => setupWeek(traffic), [traffic]);
  const threats = traffic.messages.filter((m) => m.guardrail === "block");
  const compression = setupCompression(traffic);
  return (
    <>
      <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
        <PageTitle>Overview</PageTitle>
        <p className="type-copy-18 m-0 text-pretty text-muted-foreground tracking-snug">
          Monitor request volume, token usage, spend, and security signals
          across your gateway.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <SectionTitle as="h2">Activity this week</SectionTitle>
        <KpiRail columns={3}>
          <CompactKpi
            flat
            spark={
              <CompactSpark
                colorVar="var(--color-blue-500)"
                data={week.days.map((day) => day.length)}
                labels={week.labels}
                tooltip
                valueFormatter={(v) =>
                  formatNumber(v, { maximumFractionDigits: 0 })
                }
              />
            }
            title="Messages"
            value={formatCompactCount(traffic.messages.length)}
          />
          <CompactKpi
            flat
            spark={
              <CompactSpark
                colorVar="var(--color-success-500)"
                data={week.days.map((day) =>
                  day.reduce((sum, m) => sum + m.savedTokens, 0)
                )}
                labels={week.labels}
                tooltip
                valueFormatter={(v) =>
                  formatNumber(v, { maximumFractionDigits: 0 })
                }
              />
            }
            title="Tokens saved"
            value={compression.percent}
          />
          <CompactKpi
            flat
            spark={
              <CompactSpark
                colorVar="var(--color-destructive)"
                data={week.days.map(
                  (day) => day.filter((m) => m.guardrail === "block").length
                )}
                labels={week.labels}
                tooltip
                valueFormatter={(v) =>
                  formatNumber(v, { maximumFractionDigits: 0 })
                }
              />
            }
            title="Threats detected"
            value={formatCompactCount(threats.length)}
          />
        </KpiRail>
        <UsageChart traffic={traffic} week={week} />
      </div>
      <div className="grid @4xl:grid-cols-3 grid-cols-1 gap-6">
        <PreviewCard title="Latest messages">
          <LatestMessagesTable traffic={traffic} />
        </PreviewCard>
        <PreviewCard title="Latest conversations">
          <LatestConversationsTable traffic={traffic} />
        </PreviewCard>
        <PreviewCard title="Latest security events">
          <SecurityEventsTable traffic={traffic} />
        </PreviewCard>
      </div>
    </>
  );
}

/* ─── Usage chart: Dashboard's OverviewUsageChart over the two messages ── */

function UsageChart({
  traffic,
  week,
}: {
  traffic: SetupTraffic;
  week: ReturnType<typeof setupWeek>;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [metric, setMetric] = useState<Metric>(
    searchParams.get("metric") === "spend" ? "spend" : "tokens"
  );
  const [dim, setDim] = useState<Dimension>(
    (["model", "provider", "apiKey"] as const).includes(
      searchParams.get("dim") as Dimension
    )
      ? (searchParams.get("dim") as Dimension)
      : "model"
  );
  const syncParam = (key: string, value: string) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(key, value);
        return next;
      },
      { replace: true }
    );

  // Both messages share one model, one provider and one caller, so every
  // dimension is one series: its label is what changes.
  const model = traffic.messages[0]?.model;
  const label =
    dim === "model"
      ? (model?.label ?? "")
      : dim === "provider"
        ? model
          ? vendorLabel(model.vendor)
          : ""
        : traffic.keyLabel;
  const series: ChartSeries[] = [{ key: "setup", label, slot: 1 }];
  const data = week.labels.map((date, index) => ({
    date,
    setup: (week.days[index] ?? []).reduce(
      (sum, m) => sum + (metric === "spend" ? m.costUsd : tokensOf(m)),
      0
    ),
  }));
  const total = data.reduce((sum, row) => sum + row.setup, 0);
  const yFormatter = metric === "spend" ? fmtSpend : fmtTokens;

  return (
    <Card>
      {/* Dashboard's header: title over controls below a 672px content
          column, inline at and above it. */}
      <CardHeader className="flex @2xl:grid flex-col gap-2 @2xl:gap-x-2 @2xl:gap-y-0">
        <CardTitle className="type-heading-20 @min-[638px]/card-header:type-heading-16">
          {metric === "spend" ? "Total spent" : "Tokens used"}
        </CardTitle>
        <CardAction className="@min-[638px]/card-header:my-0 my-1">
          <div className="flex items-center gap-2">
            <Select
              onValueChange={(v) => {
                setDim(v as Dimension);
                syncParam("dim", String(v));
              }}
              value={dim}
            >
              <SelectTrigger
                aria-label="Chart dimension"
                className="border-border bg-card text-foreground"
                size="sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="model">By model</SelectItem>
                <SelectItem value="provider">By provider</SelectItem>
                <SelectItem value="apiKey">By API key</SelectItem>
              </SelectContent>
            </Select>
            <SegmentedPill
              aria-label="Chart metric"
              onValueChange={(v) => {
                setMetric(v as Metric);
                syncParam("metric", v);
              }}
              options={OVERVIEW_METRIC_OPTIONS}
              size="sm"
              value={metric}
            />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="grid @4xl:grid-cols-12 grid-cols-1 gap-4">
        <div className="@4xl:col-span-8">
          <StackedChart data={data} series={series} yFormatter={yFormatter} />
        </div>
        <div className="@4xl:col-span-4 border-border border-t @4xl:border-t-0 @4xl:border-l @4xl:pt-0 pt-4 @4xl:pl-3">
          <div className="flex flex-col gap-1">
            {series.map((s) => (
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
                <div
                  className="type-mono-14 grid shrink-0 items-center gap-x-2"
                  style={{ gridTemplateColumns: "9ch min-content 4ch" }}
                >
                  <span className="text-right text-foreground">
                    {yFormatter(total)}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-right text-foreground">
                    {fmtPct(total > 0 ? 1 : 0)}
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

/** Dashboard's StackedKpiChart, verbatim but for the data source: the same
 *  chart geometry (`chart-geometry`) and column-width tick stride. */
function StackedChart({
  data,
  series,
  yFormatter,
}: {
  data: Array<Record<string, number | string>>;
  series: readonly ChartSeries[];
  yFormatter: (v: number) => string;
}) {
  const config: ChartConfig = Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: seriesColor(s) }])
  ) as ChartConfig;
  const [chartPaneRef, columnWidth] = useChartColumnWidth();
  const axisTicks = useMemo(
    () => getAxisTicks(data, columnWidth),
    [data, columnWidth]
  );
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
              stackId="s"
            />
          ))}
        </BarChart>
      </ChartContainer>
    </div>
  );
}

/* ─── Preview tables (Dashboard's columns) ─────────────────────────────── */

function PreviewTable({
  label,
  heads,
  children,
}: {
  label: string;
  heads: readonly string[];
  children: ReactNode;
}) {
  return (
    <Table aria-label={label}>
      <TableHeader>
        <TableRow>
          {heads.map((head) => (
            <TableHead key={head}>{head}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>{children}</TableBody>
    </Table>
  );
}

/** The two messages, newest first. A blocked message logs as an error with
 *  the block guardrail, the pairing every blocked row in the Messages data
 *  carries. */
function LatestMessagesTable({ traffic }: { traffic: SetupTraffic }) {
  return (
    <PreviewTable
      heads={["Time", "Model", "Status", "Security"]}
      label="Latest messages"
    >
      {traffic.messages.map((m) => {
        const status = m.guardrail === "block" ? "error" : "success";
        return (
          <TableRow className="h-12" key={m.id}>
            <TableCell className="type-mono-14 whitespace-nowrap">
              {timeLabel(m.sentAt)}
            </TableCell>
            <TableCell className="whitespace-nowrap">{m.model.label}</TableCell>
            <TableCell className="whitespace-nowrap">
              <Badge variant={status === "error" ? "destructive" : "success"}>
                {status}
              </Badge>
            </TableCell>
            <TableCell className="whitespace-nowrap">
              <Badge variant={GUARDRAIL_BADGE[m.guardrail].variant}>
                {m.guardrail}
              </Badge>
            </TableCell>
          </TableRow>
        );
      })}
    </PreviewTable>
  );
}

/** The one setup conversation: Dashboard's RecentConversationsTable columns.
 *  One request per turn, so Reqs equals Turns (the phone Conversations
 *  copy's precedent). The title truncates with its full text on hover. */
function LatestConversationsTable({ traffic }: { traffic: SetupTraffic }) {
  const { conversation } = traffic;
  return (
    <Table aria-label="Latest conversations">
      <TableHeader>
        <TableRow>
          <TableHead>Conversation</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="text-right">Turns</TableHead>
          <TableHead className="text-right">Reqs</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow className="h-12">
          <TableCell className="w-full max-w-0">
            <span className="block w-full truncate" title={conversation.title}>
              {conversation.title}
            </span>
          </TableCell>
          <TableCell className="type-mono-14 whitespace-nowrap">
            {formatTimestamp(conversation.updatedAt)}
          </TableCell>
          <TableCell className="type-mono-14 whitespace-nowrap text-right">
            {conversation.turns}
          </TableCell>
          <TableCell className="type-mono-14 whitespace-nowrap text-right">
            {conversation.turns}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

/** The blocked prompt injection: Dashboard's SecurityEventsTable columns,
 *  the key cut at " (" as it cuts its key cells. */
function SecurityEventsTable({ traffic }: { traffic: SetupTraffic }) {
  const injection = TYPE_META.injection;
  const TypeIcon = injection.Icon;
  const badge = ACTION_BADGE.blocked;
  return (
    <PreviewTable
      heads={["Time", "Type", "Action", "Key"]}
      label="Latest security events"
    >
      {traffic.messages
        .filter((m) => m.guardrail === "block")
        .map((m) => (
          <TableRow className="h-12" key={m.id}>
            <TableCell className="type-mono-14 whitespace-nowrap">
              {formatTimestamp(m.sentAt)}
            </TableCell>
            <TableCell className="whitespace-nowrap">
              <span className="inline-flex items-center gap-2 align-middle">
                <TypeIcon
                  aria-hidden
                  className="size-4 shrink-0"
                  strokeWidth={1.75}
                  style={{ color: injection.color }}
                />
                <span>{injection.label}</span>
              </span>
            </TableCell>
            <TableCell className="whitespace-nowrap">
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </TableCell>
            <TableCell className="type-mono-14 whitespace-nowrap text-muted-foreground">
              {traffic.keyLabel.split(" (")[0]}
            </TableCell>
          </TableRow>
        ))}
    </PreviewTable>
  );
}
