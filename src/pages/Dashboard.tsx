import { useState, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PageTitle } from '@/components/ui/page-title';
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SegmentedPill } from '@/components/ui/segmented-pill';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import {
  TOTAL_7D_BASE_REQUESTS,
  TOTAL_7D_BASE_TOKENS,
  distributeSeries,
  SPEND_BASE,
  SPEND_SERIES,
  TOKENS_TOTALS_7D,
  seriesColor,
} from '@/pages/Activity';
import { formatCurrency, formatNumber, formatTimestamp } from '@/lib/formatters';
import { DashboardChrome } from '@/layouts/DashboardChrome';
import { REQUEST_ROWS_RECENT, type RequestRow } from '@/pages/Requests';
import { CONVERSATION_ROWS, type ConversationRow } from '@/pages/Conversations';
import { EVENT_ROWS, ACTION_BADGE, TYPE_META, type EventRow, parseEventTime } from '@/pages/Security';

const THREATS_DETECTED_COUNT = 117; // Security 7d total: 77 blocked + 35 flagged + 5 redacted

type Dimension = 'model' | 'provider' | 'apiKey';

const OTHERS_KEY = '__others';
const OTHERS_COLOR = 'var(--color-neutral-300)';

/** Cap a series list + data to ≤6 entries, collapsing overflow into an
 *  "__others" rollup. Sorts by descending total across all rows. Top 5
 *  stay named; remainder collapse into Others. If ≤6 series, returns
 *  unchanged. Mirrors the pattern Activity.tsx uses for its trend chart. */
function capWithOthers(
  series: StackedSeries,
  data: Array<Record<string, number | string>>,
): { series: StackedSeries; data: Array<Record<string, number | string>> } {
  if (series.length <= 6) return { series, data };

  // Sum each series key across all rows.
  const totals: Record<string, number> = {};
  for (const s of series) {
    totals[s.key] = data.reduce((acc, row) => acc + (Number(row[s.key]) || 0), 0);
  }

  // Sort descending by total; keep top 5, collapse rest.
  const sorted = [...series].sort((a, b) => (totals[b.key] ?? 0) - (totals[a.key] ?? 0));
  const top5 = sorted.slice(0, 5);
  const rest = sorted.slice(5);

  const cappedData = data.map((row) => {
    const newRow: Record<string, number | string> = { date: row['date'] ?? '' };
    for (const s of top5) newRow[s.key] = row[s.key] ?? 0;
    newRow[OTHERS_KEY] = rest.reduce((acc, s) => acc + (Number(row[s.key]) || 0), 0);
    return newRow;
  });

  const cappedSeries: StackedSeries = [
    ...top5,
    { key: OTHERS_KEY, label: 'Others', slot: 0, color: OTHERS_COLOR },
  ];

  return { series: cappedSeries, data: cappedData };
}

export const fmtTokens = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000   ? `${(n / 1_000).toFixed(1)}K`
  : `${n}`;

export const REQUEST_STATUS_SERIES = [
  { key: 'success', label: 'Success',   slot: 0, color: 'var(--color-success-500)' },
  { key: 'errors',  label: 'Errors',    slot: 1, color: 'var(--color-danger-500)'  },
  { key: 'slow',    label: 'Slow >10s', slot: 2, color: 'var(--color-warning-500)' },
] as const satisfies StackedSeries;

export const THREATS_STATUS_SERIES = [
  { key: 'blocked',  label: 'Blocked',  slot: 0, color: 'var(--color-danger-500)'  },
  { key: 'flagged',  label: 'Flagged',  slot: 1, color: 'var(--color-warning-500)' },
  { key: 'redacted', label: 'Redacted', slot: 2, color: 'var(--color-blue-500)'    },
] as const satisfies StackedSeries;

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
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{ sidebarExpanded: boolean; toggleSidebar: () => void }>();

  return (
    <DashboardChrome
      activeNavId="overview"
      sidebarExpanded={sidebarExpanded}
      onToggleSidebar={toggleSidebar}
      onNavigate={(path: string) => navigate(path)}
    >
      <PageHeader />
      <div className="flex flex-col gap-4">
        <h3 className="font-sans text-lg/6 font-medium tracking-snug text-neutral-900 m-0">
          Activity this week{' '}
          <span className="text-neutral-400 font-normal">(May 17–23, 2026)</span>
        </h3>
        <OverviewUsageChart />
      </div>
      <div className="grid grid-cols-3 gap-6">
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
    <div className="flex flex-col gap-2 max-w-1/2">
      <PageTitle>Overview</PageTitle>
      <p className="font-sans text-neutral-500 text-base tracking-tight text-pretty m-0">
        Cost controls, inline security, and a tamper-evident audit trail. Anchored to Constellation's Digital Evidence layer.
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
    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  return labels;
}

const KPI_7D_LABELS = make7dLabels();

export function makeStackedSpendRows(dim: Dimension): Array<Record<string, number | string>> {
  return SPEND_BASE[dim].map((row, i) => ({
    date: KPI_7D_LABELS[i] ?? '',
    ...row,
  }));
}

export function makeStackedTokenRows(dim: Dimension): Array<Record<string, number | string>> {
  const dimSeries = SPEND_SERIES[dim];
  const totals = TOKENS_TOTALS_7D[dim];
  const buckets: Record<string, number[]> = {};
  let seed = 0;
  for (const s of dimSeries) {
    seed++;
    buckets[s.key] = distributeSeries(totals[s.key] ?? 0, 7, 77 * 31 + seed + 200);
  }
  return Array.from({ length: 7 }, (_, i) => {
    const row: Record<string, number | string> = { date: KPI_7D_LABELS[i] ?? '' };
    for (const s of dimSeries) row[s.key] = buckets[s.key]?.[i] ?? 0;
    return row;
  });
}

export function makeStackedThreatsRows(): Array<Record<string, number | string>> {
  const buckets = {
    blocked:  distributeSeries(77, 7, 141),
    flagged:  distributeSeries(35, 7, 142),
    redacted: distributeSeries(5,  7, 143),
  };
  return Array.from({ length: 7 }, (_, i) => ({
    date:     KPI_7D_LABELS[i] ?? '',
    blocked:  buckets.blocked[i]  ?? 0,
    flagged:  buckets.flagged[i]  ?? 0,
    redacted: buckets.redacted[i] ?? 0,
  }));
}

export function makeStackedRequestRows(): Array<Record<string, number | string>> {
  const errors  = Math.round(TOTAL_7D_BASE_REQUESTS * 0.01);
  const slow    = Math.round(TOTAL_7D_BASE_REQUESTS * 0.45);
  const success = TOTAL_7D_BASE_REQUESTS - errors - slow;
  const buckets = {
    success: distributeSeries(success, 7, 131),
    errors:  distributeSeries(errors,  7, 132),
    slow:    distributeSeries(slow,    7, 133),
  };
  return Array.from({ length: 7 }, (_, i) => ({
    date:    KPI_7D_LABELS[i] ?? '',
    success: buckets.success[i] ?? 0,
    errors:  buckets.errors[i]  ?? 0,
    slow:    buckets.slow[i]    ?? 0,
  }));
}

/** Stacked-by-model bar chart used in the Spend and Tokens tiles. */
const STACKED_CHART_MARGIN = { top: 8, right: 8, left: 0, bottom: 0 } as const;
const STACKED_CHART_TICK = { fontSize: 10 } as const;

type StackedSeries = readonly { key: string; label: string; slot: number; color?: string }[];

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
    series.map((s) => [s.key, { label: s.label, color: seriesColor(s) }]),
  ) as ChartConfig;

  return (
    <ChartContainer config={config} className={className ?? 'h-[180px] w-full'}>
      <BarChart data={data} margin={STACKED_CHART_MARGIN} barCategoryGap="20%">
        <CartesianGrid horizontal vertical={false} stroke="var(--color-neutral-200)" strokeDasharray="8 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          height={24}
          tick={STACKED_CHART_TICK}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tick={STACKED_CHART_TICK}
          tickFormatter={yFormatter}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="dot"
              formatter={(value, name) => {
                const cfg = config[name as string];
                return (
                  <div className="flex w-full items-center justify-between gap-3">
                    <span className="flex items-center gap-1">
                      <span
                        aria-hidden
                        className="size-2 rounded-xs shrink-0"
                        style={{ backgroundColor: cfg?.color }}
                      />
                      <span className="text-muted-foreground">{cfg?.label ?? name}</span>
                    </span>
                    <span className="font-mono tabular-nums text-foreground">
                      {yFormatter(Number(value))}
                    </span>
                  </div>
                );
              }}
            />
          }
        />
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            stackId="s"
            fill={seriesColor(s)}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

/** Horizontal color key — dots + series names; breakdown lives in the tooltip. */
export function HorizontalLegend({ series }: { series: StackedSeries }) {
  return (
    <div className="px-4 pb-5 flex items-center justify-center gap-4 flex-wrap">
      {series.slice(0, 6).map((s) => (
        <div key={s.key} className="flex items-center gap-2">
          <span
            aria-hidden
            className="size-2 rounded-full shrink-0 inline-flex"
            style={{ backgroundColor: seriesColor(s) }}
          />
          <span className="text-xs text-neutral-500">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// Pre-compute static chart data for the outcome tiles (never change dimension).
export const REQUESTS_STACKED_ROWS = makeStackedRequestRows();
export const THREATS_STACKED_ROWS  = makeStackedThreatsRows();

type Metric = 'spend' | 'tokens' | 'requests';

function DimSelector({ dim, onDimChange }: { dim: Dimension; onDimChange: (d: Dimension) => void }) {
  return (
    <Select value={dim} onValueChange={(v) => onDimChange(v as Dimension)}>
      <SelectTrigger size="sm" className="border-border bg-card text-foreground font-normal">
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
  { value: 'tokens',   label: 'Tokens'   },
  { value: 'requests', label: 'Requests' },
  { value: 'spend',    label: 'Spend'    },
];


const fmtSpend = (v: number) => formatCurrency(v, { minFrac: 0, maxFrac: 0 });

const fmtPct = (frac: number) => `${(frac * 100).toFixed(1)}%`;

function OverviewUsageChart() {
  const [metric, setMetric] = useState<Metric>('tokens');
  const [dim, setDim] = useState<Dimension>('model');

  const { series, data } = useMemo(() => {
    if (metric === 'requests') {
      return { series: REQUEST_STATUS_SERIES as StackedSeries, data: REQUESTS_STACKED_ROWS };
    }
    const rawSeries = SPEND_SERIES[dim];
    const rawData = metric === 'spend' ? makeStackedSpendRows(dim) : makeStackedTokenRows(dim);
    return capWithOthers(rawSeries, rawData);
  }, [metric, dim]);

  const yFormatter = metric === 'spend' ? fmtSpend : metric === 'tokens' ? fmtTokens : formatNumber;

  const title =
    metric === 'spend'    ? 'Total spent'    :
    metric === 'tokens'   ? 'Tokens used'    :
                            'Requests sent';

  const seriesTotals = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const row of data) {
      for (const s of series) {
        acc[s.key] = (acc[s.key] ?? 0) + (Number(row[s.key]) || 0);
      }
    }
    return acc;
  }, [data, series]);

  const grandTotal = Object.values(seriesTotals).reduce((a, b) => a + b, 0) || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <div className="flex items-center gap-2">
            {metric !== 'requests' && <DimSelector dim={dim} onDimChange={setDim} />}
            <SegmentedPill
              size="sm"
              options={OVERVIEW_METRIC_OPTIONS}
              value={metric}
              onValueChange={(v) => setMetric(v as Metric)}
            />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-12">
        {/* chart — col-span-8 */}
        <div className="md:col-span-8">
          <StackedKpiChart data={data} series={series} yFormatter={yFormatter} className="aspect-auto h-[184px] w-full" />
        </div>
        {/* breakdown panel — col-span-4 */}
        <div className="md:col-span-4 md:border-l md:border-border md:pl-3">
          <div className="flex flex-col gap-1">
            {series.map((s) => {
              const total = seriesTotals[s.key] ?? 0;
              const pctStr = fmtPct(total / grandTotal);
              const color = s.key === OTHERS_KEY ? OTHERS_COLOR : seriesColor(s);
              return (
                <div key={s.key} className="flex items-center gap-2 py-1 px-2 rounded-xs min-w-0">
                  <span aria-hidden className="size-2 rounded-xs shrink-0" style={{ backgroundColor: color }} />
                  <span className="font-sans text-sm text-foreground truncate min-w-0 flex-1">{s.label}</span>
                  <div
                    className="font-mono tabular-nums text-sm shrink-0 grid items-center gap-x-2"
                    style={{ gridTemplateColumns: '9ch min-content 4ch' }}
                  >
                    <span className="text-foreground text-right">{yFormatter(total)}</span>
                    <span className="text-neutral-400">·</span>
                    <span className="text-foreground text-right">{pctStr}</span>
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

/* ─── Shared pill helper ─────────────────────────────────────────────────── */


const GUARDRAIL_BADGE: Record<
  'allow' | 'flagged' | 'redacted' | 'block',
  { variant: 'neutral' | 'warning' | 'info' | 'destructive' }
> = {
  allow:    { variant: 'neutral'     },
  flagged:  { variant: 'warning'     },
  redacted: { variant: 'info'        },
  block:    { variant: 'destructive' },
};

/* ─── Latest Requests preview table ─────────────────────────────────────── */

function LatestRequestsTable() {
  const navigate = useNavigate();
  const rows: RequestRow[] = REQUEST_ROWS_RECENT.slice(0, 5);

  return (
    <div className="flex flex-col rounded-md border border-border bg-card shadow-xs overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-medium text-neutral-900">Latest requests</span>
        <button
          type="button"
          onClick={() => navigate('/requests')}
          className="text-xs text-neutral-500 hover:text-neutral-700 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm"
        >
          View all →
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-neutral-50">
            <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium text-neutral-500">Time</th>
            <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium text-neutral-500">Model</th>
            <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium text-neutral-500">Status</th>
            <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium text-neutral-500">Security</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => (
            <tr
              key={i}
              className="h-12 cursor-pointer hover:bg-neutral-50 transition-colors duration-100"
              onClick={() => row.requestId && navigate(`/requests?open=${row.requestId}`)}
            >
              <td className="whitespace-nowrap px-4 py-2.5 text-xs text-neutral-800 font-mono">{row.day} {row.time}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-xs text-neutral-800">{row.model}</td>
              <td className="whitespace-nowrap px-4 py-2.5">
                <Badge variant={row.slow ? 'warning' : row.status === 'success' ? 'success' : 'destructive'}>
                  {row.slow ? 'slow' : row.status}
                </Badge>
              </td>
              <td className="whitespace-nowrap px-4 py-2.5">
                <Badge variant={GUARDRAIL_BADGE[row.guardrail].variant}>{row.guardrail}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Recent Conversations preview table ────────────────────────────────── */

function RecentConversationsTable() {
  const navigate = useNavigate();
  const rows: ConversationRow[] = CONVERSATION_ROWS.slice(0, 5);

  return (
    <div className="flex flex-col rounded-md border border-border bg-card shadow-xs overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-medium text-neutral-900">Recent conversations</span>
        <button
          type="button"
          onClick={() => navigate('/conversations')}
          className="text-xs text-neutral-500 hover:text-neutral-700 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm"
        >
          View all →
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-neutral-50">
            <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500">Conversation</th>
            <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium text-neutral-500">Updated</th>
            <th className="whitespace-nowrap px-4 py-2 text-right text-xs font-medium text-neutral-500">Turns</th>
            <th className="whitespace-nowrap px-4 py-2 text-right text-xs font-medium text-neutral-500">Reqs</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr
              key={row.conversationId}
              className="h-12 cursor-pointer hover:bg-neutral-50 transition-colors duration-100"
              onClick={() => navigate(`/conversations?open=${row.conversationId}`)}
            >
              <td className="px-4 py-2.5 overflow-hidden max-w-0 w-full">
                <span className="block truncate text-xs text-neutral-800">{row.title}</span>
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-neutral-800">{formatTimestamp(row.updated)}</td>
              <td className="whitespace-nowrap px-4 py-2.5 font-mono text-right text-xs text-neutral-800">{row.turns}</td>
              <td className="whitespace-nowrap px-4 py-2.5 font-mono text-right text-xs text-neutral-800">{row.reqs}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Security Events preview table ─────────────────────────────────────── */


function SecurityEventsTable() {
  const navigate = useNavigate();
  const rows: EventRow[] = EVENT_ROWS.slice(0, 5);

  return (
    <div className="flex flex-col rounded-md border border-border bg-card shadow-xs overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-medium text-neutral-900">Security events</span>
        <button
          type="button"
          onClick={() => navigate('/security')}
          className="text-xs text-neutral-500 hover:text-neutral-700 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm"
        >
          View all →
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-neutral-50">
            <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium text-neutral-500">Time</th>
            <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium text-neutral-500">Type</th>
            <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium text-neutral-500">Action</th>
            <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium text-neutral-500">Key</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => {
            const badge = ACTION_BADGE[row.action];
            const typeMeta = TYPE_META[row.type];
            const TypeIcon = typeMeta.Icon;
            return (
              <tr
                key={i}
                className="h-12 cursor-pointer hover:bg-neutral-50 transition-colors duration-100"
                onClick={() => navigate(`/security?open=${row.requestId}`)}
              >
                <td className="whitespace-nowrap px-4 py-2.5 text-xs text-neutral-800 font-mono">{formatTimestamp(parseEventTime(row.time))}</td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <span className="inline-flex items-center gap-2">
                    <TypeIcon className="size-4 shrink-0" style={{ color: typeMeta.color }} strokeWidth={1.75} aria-hidden />
                    <span className="text-xs text-neutral-800">{typeMeta.label}</span>
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-xs text-neutral-500 font-mono">{row.key.split(' (')[0]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Retain these exports — used by future Tokens/Requests/Security tiles.
export {
  TOTAL_7D_BASE_REQUESTS,
  TOTAL_7D_BASE_TOKENS,
  THREATS_DETECTED_COUNT,
  formatNumber,
};
