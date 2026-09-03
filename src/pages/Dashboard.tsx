import { type ReactNode, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
  NavTableRow,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CONVERSATION_ROWS } from "@/data/conversations";
import { modelName } from "@/data/models";
import {
  REQUEST_ROWS_ALL,
  REQUEST_ROWS_RECENT,
  requestDayLabel,
} from "@/data/requests";
import { usageForTeam } from "@/data/teams";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { DEMO_TODAY } from "@/lib/demo-clock";
import {
  formatCompactCount,
  formatCurrency,
  formatNumber,
  formatTimestamp,
} from "@/lib/formatters";
import {
  ACTIVITY_SAVINGS_RATE_7D,
  API_KEY_ROWS,
  type ChartSeries,
  distributeSeries,
  OTHERS_COLOR,
  OTHERS_KEY,
  rankChartSeries,
  SPEND_BASE,
  scopedUsageTotals,
  seriesColor,
  splitAcrossBuckets,
  TOKEN_SAVINGS_RATE_7D,
  TOTAL_7D_BASE_DOLLARS,
  TOTAL_7D_BASE_REQUESTS,
  type UsageTotals,
} from "@/pages/activity-data";
import type { ConversationRow } from "@/pages/conversations/types";
import type { RequestRow } from "@/pages/Requests";
import {
  ACTION_BADGE,
  EVENT_ROWS,
  type EventRow,
  parseEventTime,
  TYPE_META,
} from "@/pages/security-data";
import { scopedSecurity } from "@/pages/teams/scoped-security";
import { useTeams } from "@/pages/teams/teams-store";
import {
  eventKeyName,
  inScope,
  useViewScope,
  type ViewScope,
} from "@/pages/teams/view-scope";

const THREATS_DETECTED_COUNT = 117; // Security 7d total: 77 blocked + 35 flagged + 5 redacted

/* ─── Token savings — derived from 7d spend + token totals ───────────────
 * Rate comes from TOKEN_SAVINGS_RATE_7D (activity-data.ts), the same
 * caching+compression rate TokenSavings.tsx shows for its "7d" window —
 * not a locally-guessed constant. Dollar equivalent derives from the
 * canonical spend baseline so Overview and Token Savings reconcile. */

const DOLLARS_SAVED_7D = Math.round(
  TOKEN_SAVINGS_RATE_7D * TOTAL_7D_BASE_DOLLARS
);
// Per-day averages derived from the same seeds the Activity KPI rail uses,
// so the sparkline reflects real daily variation rather than seeded noise.
const _REQUESTS_7D_SERIES = distributeSeries(
  TOTAL_7D_BASE_REQUESTS,
  7,
  77 * 31 + 2
);
const SAVINGS_SPARK = distributeSeries(DOLLARS_SAVED_7D, 7, 211);

const THREATS_SPARK = distributeSeries(THREATS_DETECTED_COUNT, 7, 144);

type Dimension = "model" | "provider" | "apiKey";

const fmtTokens = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(2)}M`
    : n >= 1000
      ? `${(n / 1000).toFixed(1)}K`
      : `${n}`;

/* ─────────────────────────────────────────────────────────────────────────
 * CMP-012 — Composed · Dashboard
 *
 * Production-shell surface composed entirely from primitives that already
 * exist elsewhere in the system:
 *   - KPI rail   →  CompactKpi pattern from CMP-008 (Stat cards)
 *   - Bar chart  →  ComposedChart pattern from CMP-009.1 (Spend trend)
 *   - Preview tables → plain table treatment from CMP-010.1 (Data table)
 * ───────────────────────────────────────────────────────────────────────── */

export function Dashboard() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  return (
    <DashboardChrome
      activeNavId="overview"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <PageHeader />
      <div className="flex flex-col gap-4">
        <SectionTitle as="h2">Activity this week</SectionTitle>
        <TokenSavingsStrip />
        <OverviewUsageChart />
      </div>
      <div className="grid @4xl:grid-cols-3 grid-cols-1 gap-6">
        <LatestRequestsTable />
        <RecentConversationsTable />
        <SecurityEventsTable />
      </div>
    </DashboardChrome>
  );
}

/* ─── Page header (title + actions) ──────────────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
      <PageTitle>Overview</PageTitle>
      <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
        Monitor request volume, token usage, spend, and security signals across
        your gateway.
      </p>
    </div>
  );
}

/* ─── KPI rail helpers ───────────────────────────────────────────────────── */

/** Generate 7 daily labels ending on the demo clock's today (real
 *  yesterday), the same anchor the Activity charts use. */
function make7dLabels(): string[] {
  const anchor = new Date(DEMO_TODAY);
  const labels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(anchor);
    d.setDate(d.getDate() - i);
    labels.push(
      d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    );
  }
  return labels;
}

const KPI_7D_LABELS = make7dLabels();

function makeStackedSpendRows(
  dim: Dimension,
  scopedSpend: UsageTotals | null
): Array<Record<string, number | string>> {
  // Scoped users have no authored daily spend shape; their 7 buckets are
  // synthesised from their own totals the way the token rows already are.
  if (scopedSpend) {
    const buckets = splitAcrossBuckets(scopedSpend[dim], 7, 77 * 31 + 100);
    return Array.from({ length: 7 }, (_, i) => {
      const row: Record<string, number | string> = {
        date: KPI_7D_LABELS[i] ?? "",
      };
      for (const [key, series] of Object.entries(buckets)) {
        row[key] = series[i] ?? 0;
      }
      return row;
    });
  }
  return SPEND_BASE[dim].map((row, i) => ({
    date: KPI_7D_LABELS[i] ?? "",
    ...row,
  }));
}

/** Token rows for the Overview stacked chart. Unlike the spend rows, which
 *  read SPEND_BASE's authored daily values directly, tokens only have 7d
 *  per-series totals — so the 7 buckets are synthesised. That synthesis goes
 *  through splitAcrossBuckets, NOT one distributeSeries call per series:
 *  per-series seeding made the series COUNT change the summed daily shape, so
 *  switching the dimension selector rewrote every bar height while the KPI
 *  total held still. Fixed 2026-08-03, same as Activity's TrendCard. */
function makeStackedTokenRows(
  dim: Dimension,
  tokenTotals: UsageTotals
): Array<Record<string, number | string>> {
  const buckets = splitAcrossBuckets(tokenTotals[dim], 7, 77 * 31 + 200);
  return Array.from({ length: 7 }, (_, i) => {
    const row: Record<string, number | string> = {
      date: KPI_7D_LABELS[i] ?? "",
    };
    for (const [key, series] of Object.entries(buckets)) {
      row[key] = series[i] ?? 0;
    }
    return row;
  });
}

/** Stacked-by-model bar chart used in the Spend and Tokens tiles. Margin,
 *  Y-axis reserve, tick type and both tick renderers come from
 *  `@/components/ui/chart-geometry` — the single source Activity's TrendCard
 *  reads too, so the two cards line up when they sit side by side. */
type StackedSeries = readonly ChartSeries[];

function StackedKpiChart({
  data,
  series,
  yFormatter,
  className,
}: {
  data: Array<Record<string, number | string>>;
  series: StackedSeries;
  yFormatter: (v: number) => string;
  className?: string;
}) {
  const config: ChartConfig = Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: seriesColor(s) }])
  ) as ChartConfig;

  /** Same content-column measurement TrendCard runs, for the same reason: the
   *  X-label stride is a function of the plotted width, and the Ask AI panel
   *  and the collapsing nav rail both change it without touching the viewport.
   *  recharts' own `preserveStartEnd` thinning cannot be used here — it drops
   *  interior ticks opportunistically, so the two cards would label their bars
   *  at different, uneven strides at the same width. */
  const [chartPaneRef, columnWidth] = useChartColumnWidth();
  const axisTicks = useMemo(
    () => getAxisTicks(data, columnWidth),
    [data, columnWidth]
  );

  return (
    <div ref={chartPaneRef}>
      <ChartContainer
        className={className ?? "h-[180px] w-full"}
        config={config}
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
            tick={ChartYAxisTick}
            tickFormatter={yFormatter}
            tickLine={false}
            width={CHART_Y_AXIS_WIDTH}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => {
                  const cfg = config[name as string];
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
                        {yFormatter(Number(value))}
                      </span>
                    </div>
                  );
                }}
                indicator="dot"
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

/** Horizontal color key — dots + series names; breakdown lives in the tooltip. */
export function HorizontalLegend({ series }: { series: StackedSeries }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 px-4 pb-5">
      {series.slice(0, 6).map((s) => (
        <div className="flex items-center gap-2" key={s.key}>
          <span
            aria-hidden
            className="inline-flex size-2 shrink-0 rounded-full"
            style={{ backgroundColor: seriesColor(s) }}
          />
          <span className="type-copy-12 text-muted-foreground">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

type Metric = "spend" | "tokens";

function DimSelector({
  dim,
  onDimChange,
}: {
  dim: Dimension;
  onDimChange: (d: Dimension) => void;
}) {
  return (
    <Select onValueChange={(v) => onDimChange(v as Dimension)} value={dim}>
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
  );
}

/* ─── Overview usage chart (full-width) ──────────────────────────────────── */

const OVERVIEW_METRIC_OPTIONS = [
  { value: "tokens", label: "Tokens" },
  { value: "spend", label: "Spend" },
];

const fmtSpend = (v: number) => formatCurrency(v, { minFrac: 0, maxFrac: 0 });

const fmtPct = (frac: number) => `${(frac * 100).toFixed(1)}%`;

function OverviewUsageChart() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [metric, setMetric] = useState<Metric>(
    (["tokens", "spend"] as const).includes(
      searchParams.get("metric") as Metric
    )
      ? (searchParams.get("metric") as Metric)
      : "tokens"
  );
  const [dim, setDim] = useState<Dimension>(
    (["model", "provider", "apiKey"] as const).includes(
      searchParams.get("dim") as Dimension
    )
      ? (searchParams.get("dim") as Dimension)
      : "model"
  );

  const handleMetricChange = (v: Metric) => {
    setMetric(v);
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.set("metric", v);
        return n;
      },
      { replace: true }
    );
  };
  const handleDimChange = (d: Dimension) => {
    setDim(d);
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.set("dim", d);
        return n;
      },
      { replace: true }
    );
  };

  /** Rank by the ACTIVE metric, cap at 6, roll the remainder into Others —
   *  the same selection rule Activity's TrendCard runs, so the two charts
   *  never name different series for the same workload. */
  const scope = useViewScope();
  const { series, data, seriesTotals } = useMemo(() => {
    const totals = scopedUsageTotals(scope.keyNames);
    const rows =
      metric === "spend"
        ? makeStackedSpendRows(dim, scope.keyNames ? totals.spend : null)
        : makeStackedTokenRows(dim, totals.tokens);
    const rowTotals: Record<string, number> = {};
    for (const row of rows) {
      for (const [key, value] of Object.entries(row)) {
        if (key !== "date") {
          rowTotals[key] = (rowTotals[key] ?? 0) + (Number(value) || 0);
        }
      }
    }
    const ranked = rankChartSeries(dim, rowTotals, rows);
    return {
      series: ranked.series,
      data: ranked.rows,
      seriesTotals: ranked.totals,
    };
  }, [metric, dim, scope]);

  const yFormatter = metric === "spend" ? fmtSpend : fmtTokens;

  const title = metric === "spend" ? "Total spent" : "Tokens used";

  const grandTotal =
    Object.values(seriesTotals).reduce((a, b) => a + b, 0) || 1;

  return (
    <Card>
      {/* Same header treatment as Activity's TrendCard, at the same
          threshold: below a 672px CONTENT COLUMN (`@2xl`, resolved against
          <main> — CardHeader's own `@container/card-header` only serves its
          descendants) the title takes a row of its own and the controls drop
          beneath it; at/above it they sit inline right. It previously used
          `xs:`, a 450px VIEWPORT breakpoint, which is true on every desktop —
          so the header was permanently inline and crammed at the exact narrow
          columns TrendCard stacks at. */}
      <CardHeader className="flex @2xl:grid flex-col gap-2 @2xl:gap-x-2 @2xl:gap-y-0">
        {/* NOTE: `type-heading-16` is a hand-written class in
            `@layer utilities`, not a registered `@utility`, so Tailwind has
            never generated a variant for it — this is inert, and kept (rather
            than deleted) so the intent survives if the type scale is ever
            registered properly. The threshold is written as 638px because
            these query `card-header`, whose inline size is the content column
            minus 34px of card chrome (1px border each side + CardHeader's
            px-4): 672 − 34 = 638. Same number, same intent, as TrendCard's
            CardAction below. */}
        <CardTitle className="type-heading-18 @min-[638px]/card-header:type-heading-16">
          {title}
        </CardTitle>
        {/* +4px above and below the button row while it is stacked, inert once
            the header goes inline — matching TrendCard exactly. */}
        <CardAction className="@min-[638px]/card-header:my-0 my-1">
          <div className="flex items-center gap-2">
            <DimSelector dim={dim} onDimChange={handleDimChange} />
            <SegmentedPill
              aria-label="Chart metric"
              onValueChange={(v) => handleMetricChange(v as Metric)}
              options={OVERVIEW_METRIC_OPTIONS}
              size="sm"
              value={metric}
            />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="grid @4xl:grid-cols-12 grid-cols-1 gap-4">
        {/* chart — col-span-8 */}
        <div className="@4xl:col-span-8">
          <StackedKpiChart
            className="aspect-auto h-[184px] w-full"
            data={data}
            series={series}
            yFormatter={yFormatter}
          />
        </div>
        {/* breakdown panel — col-span-4 */}
        <div className="@4xl:col-span-4 border-border border-t @4xl:border-t-0 @4xl:border-l @4xl:pt-0 pt-4 @4xl:pl-3">
          <div className="flex flex-col gap-1">
            {series.map((s) => {
              const total = seriesTotals[s.key] ?? 0;
              const pctStr = fmtPct(total / grandTotal);
              const color =
                s.key === OTHERS_KEY ? OTHERS_COLOR : seriesColor(s);
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
                    className="type-mono-14 grid shrink-0 items-center gap-x-2"
                    style={{ gridTemplateColumns: "9ch min-content 4ch" }}
                  >
                    <span className="text-right text-foreground">
                      {yFormatter(total)}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-right text-foreground">{pctStr}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Token savings strip ────────────────────────────────────────────────── */

/** A scoped user's three Overview numbers, from the same derivations the
 *  team pages use over their one-person team (view-scope.ts). Saved % is the
 *  Overview canon rate scaled by how the user's keys save against the org
 *  Activity rate, the way teamSavingsFactors scales a team. */
function scopedStrip(scope: ViewScope, teams: ReturnType<typeof useTeams>) {
  if (!(scope.ownTeam && scope.keyNames)) {
    return null;
  }
  const usage = usageForTeam(scope.ownTeam);
  const own = API_KEY_ROWS.filter((k) => scope.keyNames?.has(k.key));
  const tokens = own.reduce((a, k) => a + k.tokensIn + k.tokensOut, 0);
  const weighted = own.reduce(
    (a, k) => a + k.savings * (k.tokensIn + k.tokensOut),
    0
  );
  const factor = tokens > 0 ? weighted / tokens / ACTIVITY_SAVINGS_RATE_7D : 0;
  const threats = scopedSecurity(scope, "7d", null, teams)?.findings ?? 0;
  return {
    requests: usage.requests,
    savedRate: TOKEN_SAVINGS_RATE_7D * factor,
    savedDollars: Math.round(TOKEN_SAVINGS_RATE_7D * factor * usage.spend),
    threats,
  };
}

function TokenSavingsStrip() {
  const scope = useViewScope();
  const teams = useTeams();
  const own = scopedStrip(scope, teams);
  const requests = own ? own.requests : TOTAL_7D_BASE_REQUESTS;
  const savedRate = own ? own.savedRate : TOKEN_SAVINGS_RATE_7D;
  const savedDollars = own ? own.savedDollars : DOLLARS_SAVED_7D;
  const threats = own ? own.threats : THREATS_DETECTED_COUNT;
  const requestsSpark = own
    ? distributeSeries(requests, 7, 77 * 31 + 2)
    : _REQUESTS_7D_SERIES;
  const savingsSpark = own
    ? distributeSeries(savedDollars, 7, 211)
    : SAVINGS_SPARK;
  const threatsSpark = own ? distributeSeries(threats, 7, 144) : THREATS_SPARK;
  return (
    <KpiRail columns={3}>
      <CompactKpi
        delta="+8.2%"
        deltaNote="vs last week"
        flat
        spark={
          <CompactSpark
            colorVar="var(--color-blue-500)"
            data={requestsSpark}
            labels={KPI_7D_LABELS}
            tooltip
            valueFormatter={(v) =>
              formatNumber(v, { maximumFractionDigits: 0 })
            }
          />
        }
        title="Messages"
        value={formatCompactCount(requests)}
      />
      <CompactKpi
        delta="+8.7%"
        deltaNote="vs last week"
        flat
        spark={
          <CompactSpark
            colorVar="var(--color-success-500)"
            data={savingsSpark}
            labels={KPI_7D_LABELS}
            tooltip
            valueFormatter={(v) => formatCurrency(v)}
          />
        }
        title="Tokens saved"
        value={`${(savedRate * 100).toFixed(1)}%`}
      />
      <CompactKpi
        delta="+22.4%"
        deltaInverted
        deltaNote="vs last week"
        flat
        spark={
          <CompactSpark
            colorVar="var(--color-destructive)"
            data={threatsSpark}
            labels={KPI_7D_LABELS}
            tooltip
            valueFormatter={(v) =>
              formatNumber(v, { maximumFractionDigits: 0 })
            }
          />
        }
        title="Threats detected"
        value={formatCompactCount(threats)}
      />
    </KpiRail>
  );
}

/* ─── Shared pill helper ─────────────────────────────────────────────────── */

const GUARDRAIL_BADGE: Record<
  "allow" | "flagged" | "redacted" | "block",
  { variant: "neutral" | "warning" | "info" | "destructive" }
> = {
  allow: { variant: "neutral" },
  flagged: { variant: "warning" },
  redacted: { variant: "warning" },
  block: { variant: "destructive" },
};

/* ─── Overview preview cards ─────────────────────────────────────────────
 * The three "Latest …" tables share one shell: a flush Card with a title +
 * "View all" header, then a shared <Table>. The Table sits as the Card's
 * second child, so its header row picks up the top hairline automatically
 * (the separator under the title); no border on the header div itself. */

function PreviewCard({
  title,
  viewAllTo,
  children,
}: {
  title: string;
  viewAllTo: string;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden" density="flush">
      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <CardTitle>{title}</CardTitle>
        <Link
          className="type-label-12 -mx-2 -my-2 rounded-sm px-2 py-2 text-muted-foreground outline-none transition-colors duration-100 ease-out hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          to={viewAllTo}
        >
          View all →
        </Link>
      </div>
      {children}
    </Card>
  );
}

function LatestRequestsTable() {
  const navigate = useNavigate();
  const scope = useViewScope();
  // Admin: the trailing-hour anchor rows. A scoped user: their own latest
  // messages, which may sit further back than the last hour.
  const rows: RequestRow[] = (
    scope.scoped
      ? REQUEST_ROWS_ALL.filter((r) => inScope(scope, r.keyId))
      : REQUEST_ROWS_RECENT
  ).slice(0, 5);

  return (
    <PreviewCard title="Latest messages" viewAllTo="/messages">
      <Table aria-label="Latest messages">
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Security</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <NavTableRow
              aria-label={
                row.requestId ? `Open message ${row.requestId}` : "Open message"
              }
              className="h-12"
              key={row.requestId ?? i}
              onActivate={() => {
                if (row.requestId) {
                  navigate(`/messages-findings/${row.requestId}`);
                }
              }}
            >
              <TableCell className="type-mono-14 whitespace-nowrap">
                {requestDayLabel(row)} {row.time}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {modelName(row.model)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <Badge
                  variant={
                    row.slow
                      ? "warning"
                      : row.status === "success"
                        ? "success"
                        : "destructive"
                  }
                >
                  {row.slow ? "slow" : row.status}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <Badge variant={GUARDRAIL_BADGE[row.guardrail].variant}>
                  {row.guardrail}
                </Badge>
              </TableCell>
            </NavTableRow>
          ))}
        </TableBody>
      </Table>
    </PreviewCard>
  );
}

function RecentConversationsTable() {
  const navigate = useNavigate();
  const scope = useViewScope();
  const rows: ConversationRow[] = CONVERSATION_ROWS.filter((c) =>
    inScope(scope, c.initiator)
  ).slice(0, 5);

  return (
    <PreviewCard title="Latest conversations" viewAllTo="/conversations">
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
          {rows.map((row) => (
            <NavTableRow
              aria-label={`Open conversation: ${row.title}`}
              className="h-12"
              key={row.conversationId}
              onActivate={() =>
                navigate(`/conversations?open=${row.conversationId}`)
              }
            >
              <TableCell className="w-full max-w-0">
                <span className="block truncate">{row.title}</span>
              </TableCell>
              <TableCell className="type-mono-14 whitespace-nowrap">
                {formatTimestamp(row.updated)}
              </TableCell>
              <TableCell className="type-mono-14 whitespace-nowrap text-right">
                {row.turns}
              </TableCell>
              <TableCell className="type-mono-14 whitespace-nowrap text-right">
                {row.reqs}
              </TableCell>
            </NavTableRow>
          ))}
        </TableBody>
      </Table>
    </PreviewCard>
  );
}

function SecurityEventsTable() {
  const navigate = useNavigate();
  const scope = useViewScope();
  const rows: EventRow[] = EVENT_ROWS.filter((e) =>
    inScope(scope, eventKeyName(e.key))
  ).slice(0, 5);

  return (
    <PreviewCard title="Latest security events" viewAllTo="/security">
      <Table aria-label="Latest security events">
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Key</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => {
            const badge = ACTION_BADGE[row.action];
            const typeMeta = TYPE_META[row.type];
            const TypeIcon = typeMeta.Icon;
            return (
              <NavTableRow
                aria-label={
                  row.requestId
                    ? `View security event ${row.requestId}`
                    : "View security event"
                }
                className="h-12"
                key={`${row.requestId}-${i}`}
                onActivate={() => navigate(`/security?open=${row.requestId}`)}
              >
                <TableCell className="type-mono-14 whitespace-nowrap">
                  {formatTimestamp(parseEventTime(row.time))}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="inline-flex items-center gap-2 align-middle">
                    <TypeIcon
                      aria-hidden
                      className="size-4 shrink-0"
                      strokeWidth={1.75}
                      style={{ color: typeMeta.color }}
                    />
                    <span>{typeMeta.label}</span>
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </TableCell>
                <TableCell className="type-mono-14 whitespace-nowrap text-muted-foreground">
                  {row.key.split(" (")[0]}
                </TableCell>
              </NavTableRow>
            );
          })}
        </TableBody>
      </Table>
    </PreviewCard>
  );
}
