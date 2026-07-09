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
import { REQUEST_ROWS_RECENT } from "@/data/requests";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import {
  formatCurrency,
  formatNumber,
  formatTimestamp,
} from "@/lib/formatters";
import {
  distributeSeries,
  SPEND_BASE,
  SPEND_SERIES,
  seriesColor,
  TOKENS_TOTALS_7D,
  TOTAL_7D_BASE_DOLLARS,
  TOTAL_7D_BASE_REQUESTS,
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

const THREATS_DETECTED_COUNT = 117; // Security 7d total: 77 blocked + 35 flagged + 5 redacted

/* ─── Token savings — derived from 7d spend + token totals ───────────────
 * Rates are fixed product constants (what the gateway achieved via caching
 * and compression). Dollar equivalent derives from the canonical spend
 * baseline so Overview, Activity, and the strip all reconcile. */

const TOTAL_SAVED_RATE = 0.23; // slight overlap between the two mechanisms
const DOLLARS_SAVED_7D = Math.round(TOTAL_SAVED_RATE * TOTAL_7D_BASE_DOLLARS);
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

const OTHERS_KEY = "__others";
const OTHERS_COLOR = "var(--color-neutral-300)";

/** Cap a series list + data to ≤6 entries, collapsing overflow into an
 *  "__others" rollup. Sorts by descending total across all rows. Top 5
 *  stay named; remainder collapse into Others. If ≤6 series, returns
 *  unchanged. Mirrors the pattern Activity.tsx uses for its trend chart. */
function capWithOthers(
  series: StackedSeries,
  data: Array<Record<string, number | string>>
): { series: StackedSeries; data: Array<Record<string, number | string>> } {
  if (series.length <= 6) {
    return { series, data };
  }

  // Sum each series key across all rows.
  const totals: Record<string, number> = {};
  for (const s of series) {
    totals[s.key] = data.reduce(
      (acc, row) => acc + (Number(row[s.key]) || 0),
      0
    );
  }

  // Sort descending by total; keep top 5, collapse rest.
  const sorted = [...series].sort(
    (a, b) => (totals[b.key] ?? 0) - (totals[a.key] ?? 0)
  );
  const top5 = sorted.slice(0, 5);
  const rest = sorted.slice(5);

  const cappedData = data.map((row) => {
    const newRow: Record<string, number | string> = { date: row["date"] ?? "" };
    for (const s of top5) {
      newRow[s.key] = row[s.key] ?? 0;
    }
    newRow[OTHERS_KEY] = rest.reduce(
      (acc, s) => acc + (Number(row[s.key]) || 0),
      0
    );
    return newRow;
  });

  const cappedSeries: StackedSeries = [
    ...top5,
    { key: OTHERS_KEY, label: "Others", slot: 0, color: OTHERS_COLOR },
  ];

  return { series: cappedSeries, data: cappedData };
}

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
        <SectionTitle as="h2">Activity This Week</SectionTitle>
        <TokenSavingsStrip />
        <OverviewUsageChart />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
    <div className="flex max-w-1/2 flex-col gap-2">
      <PageTitle>Overview</PageTitle>
      <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
        Monitor request volume, token usage, spend, and security signals across
        your gateway.
      </p>
    </div>
  );
}

/* ─── KPI rail helpers ───────────────────────────────────────────────────── */

/** Generate 7 daily labels ending Apr 27 — matches Activity.tsx's anchor. */
function make7dLabels(): string[] {
  const anchor = new Date(2026, 3, 27);
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
  dim: Dimension
): Array<Record<string, number | string>> {
  return SPEND_BASE[dim].map((row, i) => ({
    date: KPI_7D_LABELS[i] ?? "",
    ...row,
  }));
}

function makeStackedTokenRows(
  dim: Dimension
): Array<Record<string, number | string>> {
  const dimSeries = SPEND_SERIES[dim];
  const totals = TOKENS_TOTALS_7D[dim];
  const buckets: Record<string, number[]> = {};
  let seed = 0;
  for (const s of dimSeries) {
    seed++;
    buckets[s.key] = distributeSeries(
      totals[s.key] ?? 0,
      7,
      77 * 31 + seed + 200
    );
  }
  return Array.from({ length: 7 }, (_, i) => {
    const row: Record<string, number | string> = {
      date: KPI_7D_LABELS[i] ?? "",
    };
    for (const s of dimSeries) {
      row[s.key] = buckets[s.key]?.[i] ?? 0;
    }
    return row;
  });
}

/** Stacked-by-model bar chart used in the Spend and Tokens tiles. */
const STACKED_CHART_MARGIN = { top: 8, right: 8, left: 0, bottom: 0 } as const;
const STACKED_CHART_TICK = { fontSize: 10 } as const;

type StackedSeries = readonly {
  key: string;
  label: string;
  slot: number;
  color?: string;
}[];

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

  return (
    <ChartContainer className={className ?? "h-[180px] w-full"} config={config}>
      <BarChart
        accessibilityLayer
        barCategoryGap="20%"
        data={data}
        margin={STACKED_CHART_MARGIN}
      >
        <CartesianGrid
          horizontal
          stroke="var(--color-neutral-200)"
          strokeDasharray="8 3"
          vertical={false}
        />
        <XAxis
          axisLine={false}
          dataKey="date"
          height={24}
          interval="preserveStartEnd"
          tick={STACKED_CHART_TICK}
          tickLine={false}
        />
        <YAxis
          axisLine={false}
          tick={STACKED_CHART_TICK}
          tickFormatter={yFormatter}
          tickLine={false}
          width={44}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => {
                const cfg = config[name as string];
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
        {series.map((s) => (
          <Bar
            dataKey={s.key}
            fill={seriesColor(s)}
            isAnimationActive={false}
            key={s.key}
            stackId="s"
          />
        ))}
      </BarChart>
    </ChartContainer>
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
        className="border-border bg-card font-normal text-foreground"
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

  const { series, data } = useMemo(() => {
    const rawSeries = SPEND_SERIES[dim];
    const rawData =
      metric === "spend"
        ? makeStackedSpendRows(dim)
        : makeStackedTokenRows(dim);
    return capWithOthers(rawSeries, rawData);
  }, [metric, dim]);

  const yFormatter = metric === "spend" ? fmtSpend : fmtTokens;

  const title = metric === "spend" ? "Total spent" : "Tokens used";

  const seriesTotals = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const row of data) {
      for (const s of series) {
        acc[s.key] = (acc[s.key] ?? 0) + (Number(row[s.key]) || 0);
      }
    }
    return acc;
  }, [data, series]);

  const grandTotal =
    Object.values(seriesTotals).reduce((a, b) => a + b, 0) || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <div className="flex items-center gap-2">
            <DimSelector dim={dim} onDimChange={handleDimChange} />
            <SegmentedPill
              onValueChange={(v) => handleMetricChange(v as Metric)}
              options={OVERVIEW_METRIC_OPTIONS}
              size="sm"
              value={metric}
            />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-12">
        {/* chart — col-span-8 */}
        <div className="md:col-span-8">
          <StackedKpiChart
            className="aspect-auto h-[184px] w-full"
            data={data}
            series={series}
            yFormatter={yFormatter}
          />
        </div>
        {/* breakdown panel — col-span-4 */}
        <div className="md:col-span-4 md:border-border md:border-l md:pl-3">
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
                    className="grid shrink-0 items-center gap-x-2 font-mono text-sm tabular-nums"
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

function TokenSavingsStrip() {
  return (
    <KpiRail columns={3}>
      <CompactKpi
        delta="+8.2%"
        deltaNote="vs last week"
        flat
        spark={
          <CompactSpark
            colorVar="var(--color-blue-500)"
            data={_REQUESTS_7D_SERIES}
          />
        }
        title="Requests"
        value={formatNumber(TOTAL_7D_BASE_REQUESTS, {
          notation: "compact",
          maximumFractionDigits: 1,
        })}
      />
      <CompactKpi
        delta="+8.7%"
        deltaNote="vs last week"
        flat
        spark={
          <CompactSpark
            colorVar="var(--color-success-500)"
            data={SAVINGS_SPARK}
          />
        }
        title="Tokens saved"
        value={`${(TOTAL_SAVED_RATE * 100).toFixed(0)}%`}
      />
      <CompactKpi
        delta="+22.4%"
        deltaInverted
        deltaNote="vs last week"
        flat
        spark={
          <CompactSpark
            colorVar="var(--color-destructive)"
            data={THREATS_SPARK}
          />
        }
        title="Threats detected"
        value={formatNumber(THREATS_DETECTED_COUNT)}
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
          className="type-copy-12 -mx-2 -my-2 rounded-sm px-2 py-2 text-muted-foreground outline-none transition-colors duration-100 ease-out hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
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
  const rows: RequestRow[] = REQUEST_ROWS_RECENT.slice(0, 5);

  return (
    <PreviewCard title="Latest requests" viewAllTo="/messages">
      <Table aria-label="Latest requests">
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
                row.requestId ? `Open request ${row.requestId}` : "Open request"
              }
              key={row.requestId ?? i}
              onActivate={() => {
                if (row.requestId) {
                  navigate(`/requests?open=${row.requestId}`);
                }
              }}
            >
              <TableCell className="whitespace-nowrap font-mono">
                {row.day} {row.time}
              </TableCell>
              <TableCell className="whitespace-nowrap">{row.model}</TableCell>
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
  const rows: ConversationRow[] = CONVERSATION_ROWS.slice(0, 5);

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
              key={row.conversationId}
              onActivate={() =>
                navigate(`/conversations?open=${row.conversationId}`)
              }
            >
              <TableCell className="w-full max-w-0">
                <span className="block truncate">{row.title}</span>
              </TableCell>
              <TableCell className="whitespace-nowrap font-mono">
                {formatTimestamp(row.updated)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right font-mono">
                {row.turns}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right font-mono">
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
  const rows: EventRow[] = EVENT_ROWS.slice(0, 5);

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
                key={row.requestId ?? i}
                onActivate={() => navigate(`/security?open=${row.requestId}`)}
              >
                <TableCell className="whitespace-nowrap font-mono">
                  {formatTimestamp(parseEventTime(row.time))}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="inline-flex items-center gap-2">
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
                <TableCell className="whitespace-nowrap font-mono text-muted-foreground">
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
