import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { CopyButton } from '@/components/ui/copy-button';
import {
  Download,
  ExternalLink,
  Search,
  TriangleAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogScrollBody,
  DialogScrollContent,
  DialogScrollFooter,
  DialogScrollHeader,
  DialogScrollSummary,
  DialogTitleBlock,
} from '@/components/ui/dialog';
import { DetailList, DetailRow } from '@/components/ui/detail-list';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Input } from '@/components/ui/input';
import { KpiRail as KpiRailShell } from '@/components/ui/kpi-rail';
import { RowActionButton } from '@/components/ui/row-action-button';
import { SegmentedPill } from '@/components/ui/segmented-pill';
import { TablePaginationFooter } from '@/components/ui/table-pagination-footer';
import { ToolResultCode } from '@/components/ui/tool-result-code';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusDot } from '@/components/ui/status-dot';
import { TextLink } from '@/components/ui/text-link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { VENDOR_META, VendorAvatar, type Vendor } from '@/components/icons/vendor-meta';
import { DeltaTag } from '@/components/ui/compact-kpi';
import { HeroNumeric } from '@/components/ui/hero-numeric';
import { MessageBlock, type MessageRole } from '@/components/ui/message-block';
import { PageTitle } from '@/components/ui/page-title';
import { DashboardChrome } from '@/layouts/DashboardChrome';

/* CMP-013 — Requests (Observability) */

export function Requests() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{ sidebarExpanded: boolean; toggleSidebar: () => void }>();

  return (
    <DashboardChrome
          breadcrumbCurrent="Requests"
          activeNavId="requests"
          sidebarExpanded={sidebarExpanded}
          onToggleSidebar={toggleSidebar}
          onNavigate={(path: string) => navigate(path)}
        >
          <PageHeader />
          <HeroMetricCard />
          <RequestsTableSection />
        </DashboardChrome>
  );
}

/* ─── Page header (eyebrow + title + actions) ────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex flex-col gap-2 max-w-1/2">
        {/* h2 — see CMP012 PageHeader note. */}
        <PageTitle>Requests</PageTitle>
        <p className="font-sans text-ink-500 text-base tracking-tight text-pretty m-0">
          Every generation routed through the gateway. Click any row to inspect prompts, security scans and the audit anchor.
        </p>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <Button variant="outline" size="default">
          <Download data-icon="inline-start" aria-hidden />
          Export CSV
        </Button>
      </div>
    </div>
  );
}

/* ─── Hero metric (REQUESTS / 1H + line chart + breakdown) ───────────────── */

// 61 minute-bucketed points spanning the trailing hour 13:30 → 14:30
// inclusive. Each point is the per-minute request count (NOT a running
// total). Shape: baseline drifts upward (~50/min → ~220/min) so the
// line rises diagonally across the hour; oscillation amplitude grows
// quadratically (t^1.5) so the first quarter reads almost smooth and
// the last quarter has visible 4-minute peaks/dips — matches the
// "ramp with growing wobble" reference. Sum is tuned to 8,241 so the
// headline number and breakdown rows reconcile.
const HERO_INCREMENTS = [
   50,  53,  55,  59,  62,  64,  66,  70,  74,  76,
   76,  81,  87,  87,  86,  93, 100,  98,  95, 104,
  113, 110, 105, 115, 127, 121, 114, 127, 140, 132,
  123, 138, 154, 144, 131, 149, 168, 155, 140, 161,
  182, 166, 148, 172, 192, 178, 157, 183, 211, 189,
  165, 195, 221, 200, 173, 206, 240, 212, 181, 217, 250,
];
const HERO_TOTAL = HERO_INCREMENTS.reduce((a, b) => a + b, 0);

const HERO_DATA = HERO_INCREMENTS.map((inc, i) => {
  // i=0 → 13:30, i=60 → 14:30 — labels printed `H:MM` (24h, no leading zero).
  const minute = 30 + i;
  const hh = Math.floor(13 + minute / 60);
  const mm = minute % 60;
  return {
    time: `${hh}:${mm.toString().padStart(2, '0')}`,
    requests: inc,
  };
});

const HERO_TICKS = ['13:30', '13:40', '13:50', '14:00', '14:10', '14:20', '14:30'];

const heroChartConfig = {
  requests: {
    label: 'Requests/min',
    color: 'var(--color-chart-1)',
  },
} satisfies ChartConfig;

function HeroMetricCard() {
  return (
    <div className="flex flex-col gap-4 rounded-md bg-white shadow-(--shadow-border) p-4">
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-2 shrink-0">
          <span className="font-mono uppercase tracking-[0.1em] text-xs font-medium text-ink-500">
            REQUESTS / 1H
          </span>
          <div className="flex items-baseline gap-3">
            <HeroNumeric size="lg">
              {HERO_TOTAL.toLocaleString()}
            </HeroNumeric>
            <DeltaTag delta="+12.8%" note="vs last hour" />
          </div>
        </div>

        {/* Right-aligned mono breakdown — grid (not stacked flex) so all
            three rows share the same label / dot / value column tracks.
            Each BreakdownRow returns three grid cells; the dot column is
            fixed-width so dots align across rows regardless of label or
            value length. */}
        <div className="grid grid-cols-[auto_auto_auto] items-center gap-x-2 gap-y-2 shrink-0">
          <BreakdownRow label="Success" value="8,182" tone="success" />
          <BreakdownRow label="Errors"  value="47"    tone="danger" />
          <BreakdownRow label={'Slow > 1s'} value="12" tone="warning" />
        </div>
      </div>

      {/* Full-width line chart with minute-ago axis + per-point tooltip */}
      <ChartContainer
        config={heroChartConfig}
        className="aspect-auto h-24 w-full"
      >
        <AreaChart
          data={HERO_DATA}
          margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
        >
          <defs>
            <linearGradient id="cmp013-hero-spark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* Domain ceiling 300 gives ~5px of headroom above the top peak (250/min)
              so the line doesn't clip the chart rect top. Per-minute counts, not
              cumulative — curve starts near 50 and ramps up to ~250 with growing
              oscillation. */}
          <YAxis
            width={0}
            tick={false}
            axisLine={false}
            tickLine={false}
            domain={[0, 300]}
            ticks={[0, 100, 200, 300]}
          />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            height={24}
            ticks={HERO_TICKS}
            interval={0}
            tick={(tickProps) => {
              const { x, y, payload } = tickProps as {
                x: number;
                y: number;
                payload: { value: string };
              };
              const value = payload.value;
              const anchor =
                value === HERO_TICKS[0]
                  ? 'start'
                  : value === HERO_TICKS[HERO_TICKS.length - 1]
                    ? 'end'
                    : 'middle';
              return (
                <text
                  x={x}
                  y={y}
                  dy="0.71em"
                  textAnchor={anchor}
                  fontSize={11}
                  fill="var(--color-ink-500)"
                >
                  {value}
                </text>
              );
            }}
          />
          <ChartTooltip
            cursor={{ stroke: 'var(--color-ink-400)', strokeDasharray: '2 3' }}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Area
            dataKey="requests"
            type="linear"
            stroke="var(--color-chart-1)"
            strokeWidth={1.5}
            fill="url(#cmp013-hero-spark)"
            isAnimationActive={false}
          />
          {/* ChartContainer is pinned to h-24 (96px); XAxis height=24 + margin top=4
              gives a drawing rect from y=4 to y=72 (68px tall). With domain [0, 300],
              gridlines at 0/100/200/300 land at y = 72, 49, 27, 4 respectively.
              Hardcoded because YAxis width={0} disables tick-driven grid generation. */}
          <CartesianGrid
            horizontal
            vertical={false}
            horizontalPoints={[4, 27, 49, 72]}
            stroke="var(--color-ink-300)"
            strokeDasharray="2 3"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'success' | 'danger' | 'warning';
}) {
  // Returns three grid cells (no wrapper element). Parent is a 3-col grid
  // so dots and values align across rows. `justify-self-end` right-aligns
  // text-flow cells within their tracks.
  return (
    <>
      <span className="font-sans text-xs font-medium text-ink-500 tracking-tight justify-self-end">
        {label}
      </span>
      <StatusDot kind={tone} size="md" />
      <span className="font-mono text-xs font-medium tabular-nums text-ink-900 justify-self-end">
        {value}
      </span>
    </>
  );
}

/* ─── Table section (toolbar + table in one card · pagination below) ─────
 *
 * Shape lifted from CMP-011.1 (SORTABLE TABLE):
 *   <div rounded-sm bg-white border …>      ← single card
 *     <toolbar>                              ← search · segmented · selects
 *     <Table>                                ← header + rows
 *   </div>
 *   <pagination footer>                      ← sibling, sits in the gray well
 *
 * Holding the toolbar and table together inside one rounded card keeps
 * the SORTABLE TABLE rhythm (same border, same divider between toolbar
 * and header). Pagination becomes a sibling so the gray well shows
 * through the rows-per-page / page-nav strip — matches the reference. */

const RANGE_OPTIONS = [
  { value: '1h',  label: '1H'  },
  { value: '7d',  label: '7D'  },
  { value: '30d', label: '30D' },
];

/* ─── Requests log table ─────────────────────────────────────────────────── */

type RequestStatus = 'success' | 'warn' | 'danger';

type RequestRow = {
  time: string;
  status: RequestStatus;
  code: string;
  vendor: Vendor;
  model: string;
  conversation: string;
  keyId: string;
  inTokens: string;
  outTokens: string;
  /** Latency in seconds. Stored as string with the `s` suffix already
   *  attached so we can render typographic emphasis on slow values. */
  latency: string;
  /** True when this request crossed the 1s "slow" threshold. */
  slow?: boolean;
  cost: string;
};

const REQUEST_ROWS: RequestRow[] = [
  { time: '14:30:14', status: 'success', code: '200', vendor: 'anthropic', model: 'claude-sonnet-4.8', conversation: 'cnv_aurora_42',  keyId: 'prod-web',   inTokens: '2,847', outTokens: '1,204', latency: '1.13s', slow: true,  cost: '$0.0284' },
  { time: '14:29:51', status: 'success', code: '200', vendor: 'openai',    model: 'gpt-5.1',             conversation: 'cnv_aurora_42',  keyId: 'prod-web',   inTokens: '1,892', outTokens: '955',   latency: '0.96s',             cost: '$0.0192' },
  { time: '14:29:23', status: 'success', code: '200', vendor: 'anthropic', model: 'claude-sonnet-4.8', conversation: 'cnv_skylark_18', keyId: 'prod-agent', inTokens: '1,420', outTokens: '2,008', latency: '2.14s', slow: true,  cost: '$0.0312' },
  { time: '14:28:48', status: 'success', code: '200', vendor: 'google',    model: 'gemini-3-pro',      conversation: 'cnv_skylark_18', keyId: 'prod-agent', inTokens: '1,204', outTokens: '688',   latency: '1.08s', slow: true,  cost: '$0.0091' },
  { time: '14:28:09', status: 'danger',  code: '500', vendor: 'anthropic', model: 'claude-opus-4.7',   conversation: 'cnv_meridian_07',keyId: 'prod-web',   inTokens: '—',     outTokens: '—',     latency: '—',                 cost: '—'       },
  { time: '14:27:42', status: 'success', code: '200', vendor: 'meta',      model: 'llama-4.2-405b',      conversation: 'cnv_orion_70',   keyId: 'dev',        inTokens: '5,024', outTokens: '2,612', latency: '1.95s', slow: true,  cost: '$0.0068' },
  { time: '14:27:11', status: 'success', code: '200', vendor: 'mistral',   model: 'mistral-large-3',   conversation: 'cnv_skylark_18', keyId: 'prod-agent', inTokens: '1,442', outTokens: '820',   latency: '0.91s',             cost: '$0.0072' },
  { time: '14:26:52', status: 'warn',    code: '429', vendor: 'openai',    model: 'gpt-5.1',             conversation: 'cnv_meridian_07',keyId: 'prod-web',   inTokens: '—',     outTokens: '—',     latency: '0.18s',             cost: '$0.0000' },
  { time: '14:26:14', status: 'success', code: '200', vendor: 'anthropic', model: 'claude-sonnet-4.8', conversation: 'cnv_skylark_18', keyId: 'prod-agent', inTokens: '3,104', outTokens: '1,420', latency: '1.31s', slow: true,  cost: '$0.0315' },
  { time: '14:25:47', status: 'success', code: '200', vendor: 'xai',       model: 'grok-4.1-fast',     conversation: 'cnv_polaris_55', keyId: 'prod-web',   inTokens: '6,204', outTokens: '3,109', latency: '0.42s',             cost: '$0.0184' },
  { time: '14:25:10', status: 'success', code: '200', vendor: 'google',    model: 'gemini-3-pro',      conversation: 'cnv_aurora_42',  keyId: 'prod-web',   inTokens: '942',   outTokens: '517',   latency: '0.74s',             cost: '$0.0062' },
  { time: '14:24:38', status: 'warn',    code: '408', vendor: 'meta',      model: 'llama-4.2-405b',      conversation: 'cnv_polaris_55', keyId: 'dev',        inTokens: '4,108', outTokens: '0',     latency: '8.04s', slow: true,  cost: '$0.0000' },
  { time: '14:24:02', status: 'success', code: '200', vendor: 'anthropic', model: 'claude-sonnet-4.8', conversation: 'cnv_orion_70',   keyId: 'prod-agent', inTokens: '1,712', outTokens: '904',   latency: '1.05s', slow: true,  cost: '$0.0167' },
  { time: '14:23:24', status: 'success', code: '200', vendor: 'mistral',   model: 'mistral-large-3',   conversation: 'cnv_aurora_42',  keyId: 'prod-web',   inTokens: '2,209', outTokens: '1,058', latency: '0.83s',             cost: '$0.0096' },
];

const STATUS_BADGE: Record<RequestStatus, {
  variant: 'success' | 'warning' | 'destructive';
  dot: 'success' | 'warning' | 'danger';
}> = {
  success: { variant: 'success',     dot: 'success' },
  warn:    { variant: 'warning',     dot: 'warning' },
  danger:  { variant: 'destructive', dot: 'danger'  },
};

// Synthetic total — held at module scope so the pagination math reconciles
// with the hero metric narrative. Bound to HERO_TOTAL so the headline and
// the pagination count stay in sync automatically if HERO_INCREMENTS shifts.
const REQUESTS_TOTAL = HERO_TOTAL;

function RequestsTableSection() {
  const [range, setRange] = useState('1h');
  const [model, setModel] = useState('all');
  const [keyId, setKeyId] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState('25');
  // Row-click drill-in. `selectedRow` doubles as the dialog's `open`
  // signal — `null` means closed, a row means open. Avoids carrying a
  // separate `open` flag.
  const [selectedRow, setSelectedRow] = useState<RequestRow | null>(null);

  return (
    <>
    <Card density="flush">
        {/* Toolbar — shape lifted from CMP-011.1. No flex-wrap: the
            sortable-table convention is single-row, and the filter set
            fits in the gray well at this width. */}
        <div className="flex items-center gap-2 p-4">
          <div className="relative w-72 min-w-0 shrink-0">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-ink-500"
              strokeWidth={1.75}
              aria-hidden
            />
            <Input
              size="sm"
              type="search"
              name="q"
              autoComplete="off"
              spellCheck={false}
              placeholder="Search request…"
              className="pl-8"
              aria-label="Search requests"
            />
          </div>

          <Select value={model} onValueChange={setModel}>
            <SelectTrigger
              size="sm"
              aria-label="Model"
              className="border-ink-200 bg-white text-ink-900 font-normal"
            >
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All models</SelectItem>
              <SelectItem value="claude-sonnet-4.8">claude-sonnet-4.8</SelectItem>
              <SelectItem value="gpt-5.1">gpt-5.1</SelectItem>
              <SelectItem value="gemini-3-pro">gemini-3-pro</SelectItem>
              <SelectItem value="llama-4.2-405b">llama-4.2-405b</SelectItem>
              <SelectItem value="grok-4.1-fast">grok-4.1-fast</SelectItem>
              <SelectItem value="mistral-large-3">mistral-large-3</SelectItem>
            </SelectContent>
          </Select>

          <Select value={keyId} onValueChange={setKeyId}>
            <SelectTrigger
              size="sm"
              aria-label="Key"
              className="border-ink-200 bg-white text-ink-900 font-normal"
            >
              <SelectValue placeholder="Key" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All keys</SelectItem>
              <SelectItem value="prod-web">prod-web</SelectItem>
              <SelectItem value="prod-agent">prod-agent</SelectItem>
              <SelectItem value="dev">dev</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger
              size="sm"
              aria-label="Status"
              className="border-ink-200 bg-white text-ink-900 font-normal"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="200">200 OK</SelectItem>
              <SelectItem value="4xx">4xx</SelectItem>
              <SelectItem value="5xx">5xx</SelectItem>
              <SelectItem value="slow">{'Slow > 1s'}</SelectItem>
            </SelectContent>
          </Select>

          <SegmentedPill
            className="ml-auto"
            size="sm"
            options={RANGE_OPTIONS}
            value={range}
            onValueChange={setRange}
          />
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="whitespace-nowrap">Time</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="whitespace-nowrap">Model</TableHead>
              <TableHead className="whitespace-nowrap">Conversation</TableHead>
              <TableHead className="whitespace-nowrap">Key</TableHead>
              <TableHead className="text-right whitespace-nowrap">In</TableHead>
              <TableHead className="text-right whitespace-nowrap">Out</TableHead>
              <TableHead className="text-right whitespace-nowrap">Latency</TableHead>
              <TableHead className="text-right whitespace-nowrap">Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {REQUEST_ROWS.map((row, i) => {
              const badge = STATUS_BADGE[row.status];
              const isMissing = row.inTokens === '—';
              const numericCls = isMissing
                ? 'text-right whitespace-nowrap font-mono tabular-nums text-ink-400'
                : 'text-right whitespace-nowrap font-mono tabular-nums text-ink-800';
              // Slow rows: leading amber TriangleAlert + ink-900 (one step
              // darker than the ink-800 default). Same weight as non-slow rows
              // so `tabular-nums` keeps the column tracks aligned — font-medium
              // would widen the digits and leave the column ragged. The icon
              // sits in a fixed-width slot reserved on every row (slow or not)
              // so the digit column stays anchored at the cell's right edge
              // regardless of slow state — value owns the alignment edge, icon
              // qualifies it from the left.
              const isSlow = row.slow && row.latency !== '—';
              const latencyTextCls =
                row.latency === '—'
                  ? 'text-ink-400'
                  : isSlow
                    ? 'text-ink-900'
                    : 'text-ink-800';
              return (
                <TableRow
                  key={`${row.time}-${i}`}
                  className="cursor-pointer transition-colors duration-150 ease-out motion-reduce:transition-none hover:bg-ink-50"
                  onClick={() => setSelectedRow(row)}
                >
                  <TableCell className="whitespace-nowrap font-mono tabular-nums tracking-tight text-ink-500">
                    {row.time}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant={badge.variant}>
                      {row.code}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[260px]">
                    <RowActionButton
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRow(row);
                      }}
                      aria-label={`Inspect ${row.code} request to ${row.model} at ${row.time}`}
                    >
                      <VendorAvatar vendor={row.vendor} />
                      <span
                        className="font-mono text-sm text-ink-900 tracking-tight truncate"
                        title={row.model}
                      >
                        {row.model}
                      </span>
                    </RowActionButton>
                  </TableCell>
                  <TableCell className="max-w-[200px] font-mono tabular-nums tracking-tight text-ink-800">
                    <span className="block truncate" title={row.conversation}>
                      {row.conversation}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[140px] font-mono text-ink-800 tracking-tight">
                    <span className="block truncate" title={row.keyId}>
                      {row.keyId}
                    </span>
                  </TableCell>
                  <TableCell className={numericCls}>{row.inTokens}</TableCell>
                  <TableCell className={numericCls}>{row.outTokens}</TableCell>
                  <TableCell className="text-right whitespace-nowrap font-mono tabular-nums">
                    <span className="inline-flex items-center justify-end gap-1">
                      {isSlow ? (
                        <TriangleAlert
                          className="size-3 shrink-0 text-warning-600"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                      ) : (
                        <span className="size-3 shrink-0" aria-hidden />
                      )}
                      {isSlow ? <span className="sr-only">slow</span> : null}
                      <span className={latencyTextCls}>{row.latency}</span>
                    </span>
                  </TableCell>
                  <TableCell className={numericCls}>{row.cost}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <TablePaginationFooter
          total={REQUESTS_TOTAL}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
        />
    </Card>
    <RequestDetailDialog
      row={selectedRow}
      onOpenChange={(open) => {
        if (!open) setSelectedRow(null);
      }}
    />
    </>
  );
}

/* ─── Request detail dialog ────────────────────────────────────────────────
 * Drill-in panel opened from a row click. Mirrors the table's per-row data
 * (model, vendor, key, latency, cost, tokens) and adds context the row
 * doesn't carry (provider name, endpoint, cache status).
 *
 * Centered modal (Dialog primitive) matching CMP-014's ConversationDetail
 * pattern. sm:max-w-3xl gives the tabbed body breathing room without
 * overpowering the dimmed page behind. max-h-[90vh] keeps the modal inside
 * the viewport on shorter screens; the tabbed area scrolls internally.
 * ────────────────────────────────────────────────────────────────────── */

function RequestDetailDialog({
  row,
  onOpenChange,
}: {
  row: RequestRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!row} onOpenChange={onOpenChange}>
      <DialogScrollContent className="sm:max-w-3xl">
        {row ? <RequestDetailBody row={row} /> : null}
      </DialogScrollContent>
    </Dialog>
  );
}

function RequestDetailBody({ row }: { row: RequestRow }) {
  const badge = STATUS_BADGE[row.status];
  const requestId = `req_${row.conversation.replace('cnv_', '').slice(0, 8)}${row.code}`;
  const provider = VENDOR_META[row.vendor].label;
  // Tabs is controlled so the panel footer can swap actions per active
  // tab (Audit gets Copy Proof / View on DE; everyone else gets Copy ID /
  // Open Conversation). Defaults to "messages" so the prompt/response is
  // visible on first open.
  const [activeTab, setActiveTab] = useState('messages');
  return (
    <>
      {/* Top section — canonical title block primitive (eyebrow + title +
          status badge + meta line). All type sizes / spacing live in
          DialogTitleBlock, so this surface stays in lock-step with every
          other modal header. */}
      <DialogScrollHeader>
        <DialogTitleBlock
          titleFont="mono"
          titleAriaLabel={`Request ${requestId}`}
          badge={
            <Badge variant={badge.variant}>
              {row.code}
            </Badge>
          }
          meta={
            <span className="font-mono tracking-snug">
              Apr 22, 2026 · {row.time} UTC · part of conversation{' '}
              <TextLink aria-label={`Open conversation ${row.conversation}`}>
                {row.conversation}
              </TextLink>
            </span>
          }
        >
          {requestId}
        </DialogTitleBlock>
      </DialogScrollHeader>

      {/* Persistent KPI rail — sits below the header, above the tabs. */}
      <DialogScrollSummary>
        <KpiRail row={row} />
      </DialogScrollSummary>

      {/* Scrollable tabbed body. */}
      <DialogScrollBody>
        {/* Tabs default to Messages so the prompt/response — the load-bearing
            content of any request inspection — is visible on first open. */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
          <TabsList>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="messages">
            <MessagesPanel />
          </TabsContent>

          <TabsContent value="details">
            <DetailList>
              <DetailRow
                label="Model"
                value={
                  <div className="flex items-center gap-2">
                    <VendorAvatar vendor={row.vendor} />
                    <span className="font-mono text-sm text-ink-900 tracking-tight">
                      {row.model}
                    </span>
                  </div>
                }
              />
              <DetailRow label="Provider" value={<span className="font-sans text-sm text-ink-900">{provider}</span>} />
              <DetailRow
                label="API Key"
                value={<span className="font-mono text-sm text-ink-900 tracking-tight">{row.keyId}</span>}
              />
              <DetailRow
                label="Endpoint"
                value={
                  <span className="font-mono text-sm text-ink-900 tracking-tight">
                    <span className="text-ink-500">POST</span> /v1/messages
                  </span>
                }
              />
              <DetailRow
                label="Cache"
                value={
                  <Badge variant="info">
                    miss
                  </Badge>
                }
              />
            </DetailList>
          </TabsContent>

          {/* Audit tab — runtime guardrail checks (did this request pass
              policy at runtime?). */}
          <TabsContent value="audit">
            <SecurityPanel row={row} />
          </TabsContent>
        </Tabs>
      </DialogScrollBody>

      <DialogScrollFooter>
        {activeTab === 'audit' ? (
          <>
            <CopyButton
              mode="label"
              size="sm"
              text="Copy Proof"
              value={`proof_${requestId}`}
              label="audit proof"
            />
            <Button variant="default" size="sm">
              View on DE
              <ExternalLink data-icon="inline-end" aria-hidden />
            </Button>
          </>
        ) : (
          <>
            <CopyButton
              mode="label"
              size="sm"
              text="Copy ID"
              value={requestId}
              label="request ID"
            />
            <Button variant="default" size="sm">
              Open Conversation
              <ExternalLink data-icon="inline-end" aria-hidden />
            </Button>
          </>
        )}
      </DialogScrollFooter>
    </>
  );
}

function KpiRail({ row }: { row: RequestRow }) {
  return (
    <KpiRailShell columns={4}>
      <KpiTile label="Latency" value={row.latency} />
      <KpiTile label="Cost" value={row.cost} />
      <KpiTile label="Tokens In" value={row.inTokens} />
      <KpiTile label="Tokens Out" value={row.outTokens} />
    </KpiRailShell>
  );
}

function KpiTile({ label, value }: { label: string; value: string }) {
  // Tile chrome (border, radius, bg) lives on the parent rail container;
  // each tile is just label + value at the locked 16px card-padding rule.
  return (
    <div className="flex flex-col gap-1 p-4">
      <Eyebrow>{label}</Eyebrow>
      <span className="font-mono text-lg font-medium tabular-nums -tracking-[0.5px] text-ink-900">
        {value}
      </span>
    </div>
  );
}

/* Sample turn-by-turn for the Messages tab. Treated as static demo data —
   the row type doesn't carry message payloads. Mirrors the routing-assistant
   scenario from the PM mockup so prompt / tool / response shape is visible.
   Tool function name uses snake_case lowercase to match the Anthropic /
   OpenAI tool-call API convention. */
const SAMPLE_MESSAGES: {
  role: MessageRole;
  tool?: string;
  body: React.ReactNode;
}[] = [
  {
    role: 'system',
    body: 'You are a routing assistant for the eu-payments service. Use the tools provided. Be concise.',
  },
  {
    role: 'user',
    body: 'Why was the SEPA transfer 0x4a3e flagged for review yesterday? Pull the audit reason and route the dispute to the right operator.',
  },
  {
    role: 'tool',
    tool: 'lookup_transfer',
    body: (
      <ToolResultCode>
        {'{"id":"0x4a3e","amount":"€2,840.12","status":"flagged","reason":"PEP_MATCH"}'}
      </ToolResultCode>
    ),
  },
  {
    role: 'assistant',
    body: 'The SEPA transfer 0x4a3e was flagged because the recipient matched a PEP watchlist entry (sanctioned official, IT). Routing the dispute to compliance-eu-tier2…',
  },
];

function MessagesPanel() {
  return (
    <div className="flex flex-col gap-4">
      {SAMPLE_MESSAGES.map((m, i) => (
        <MessageBlock key={i} role={m.role} tool={m.tool} body={m.body} />
      ))}
    </div>
  );
}

/* Security scan report — every gateway request runs the same set of
   guardrails (prompt-injection, PII, toxicity, model allowlist, spend cap).
   Status is hardcoded `pass` on this demo data; descriptions use live values
   from the row where possible (cost, model, key) so the panel doesn't read
   as decoupled from the selected request. */
function SecurityPanel({ row }: { row: RequestRow }) {
  const checks: {
    title: string;
    description: string;
    status: 'pass';
  }[] = [
    {
      title: 'Prompt injection scan',
      description: 'No injection patterns detected · 0/247 rules matched',
      status: 'pass',
    },
    {
      title: 'PII redaction',
      description: 'No PII detected',
      status: 'pass',
    },
    {
      title: 'Output toxicity',
      description: 'Below threshold (0.04 / 0.7)',
      status: 'pass',
    },
    {
      title: 'Model allowlist',
      description: `${row.model} approved for key ${row.keyId}`,
      status: 'pass',
    },
    {
      title: 'Spend cap',
      description: `Within daily cap · ${row.cost} of $50.00`,
      status: 'pass',
    },
  ];
  return (
    <div className="flex flex-col gap-2">
      {checks.map((check) => (
        <SecurityCheckRow key={check.title} {...check} />
      ))}
    </div>
  );
}

function SecurityCheckRow({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: 'pass';
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xs border border-ink-200 p-4">
      <div className="flex flex-col gap-1 min-w-0">
        <span className="font-sans text-sm font-medium text-ink-900">{title}</span>
        <span className="font-sans text-xs text-ink-500 text-pretty">{description}</span>
      </div>
      <Badge variant="success">
        {status}
      </Badge>
    </div>
  );
}

