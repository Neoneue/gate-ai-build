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
          Every model call across your gateway, captured as it happens. Kept for debugging and audit.
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
          <BreakdownRow label={'Slow > 10s'} value="4" tone="warning" />
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
  { value: '24h', label: '24H' },
  { value: '7d',  label: '7D'  },
  { value: '30d', label: '30D' },
];

/* ─── Requests log table ─────────────────────────────────────────────────── */

/** Gateway-action statuses (CTO direction, Marcus 2026-05-12). Each
 *  value names what the gateway DID with the request, not the HTTP code:
 *    success  — passed guardrails, model responded
 *    flagged  — guardrail flagged content (advisory) but allowed it through
 *    redacted — gateway stripped PII before sending; call succeeded
 *    blocked  — guardrail rejected, request never hit the model
 *    error    — provider 4xx/5xx or upstream failure */
type RequestStatus = 'success' | 'flagged' | 'redacted' | 'blocked' | 'error';

/** Which guardrail check fired for non-`success` rows. Maps 1:1 to the
 *  five runtime checks rendered in the modal's Audit tab so the row's
 *  status and the failing/flagging check stay in lock-step. */
type GuardrailReason = 'injection' | 'pii' | 'allowlist' | 'spend' | 'toxicity';

type RequestRow = {
  /** Compact month/day for the cell ("May 12"); modal pairs it with 2026
   *  for the full header. Per-row so 24H/7D/30D ranges that span multiple
   *  days render the correct date next to each timestamp. */
  day: string;
  time: string;
  /** Human-friendly relative time ("just now", "2m ago"). The cell renders
   *  this as the primary scan target above the absolute date+time. */
  relative: string;
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
  /** Which guardrail check fired. Set for `blocked`, `flagged`, and
   *  `redacted` rows; absent for plain `success` and `error`. Drives the
   *  matching check state on the modal's Audit tab so the row and the
   *  modal stay in lock-step. */
  guardrailReason?: GuardrailReason;
};

const REQUEST_ROWS_1H: RequestRow[] = [
  { day: 'May 12', time: '14:30:14', relative: 'just now', status: 'success', code: '200', vendor: 'anthropic', model: 'claude-sonnet-4.8', conversation: 'cnv_aurora_42',  keyId: 'prod-web',   inTokens: '2,847', outTokens: '1,204', latency: '4.20s',              cost: '$0.0284' },
  { day: 'May 12', time: '14:29:51', relative: '1m ago',   status: 'success', code: '200', vendor: 'openai',    model: 'gpt-5.1',             conversation: 'cnv_aurora_42',  keyId: 'prod-web',   inTokens: '1,892', outTokens: '955',   latency: '3.80s',              cost: '$0.0192' },
  { day: 'May 12', time: '14:29:23', relative: '1m ago',   status: 'success', code: '200', vendor: 'anthropic', model: 'claude-sonnet-4.8', conversation: 'cnv_skylark_18', keyId: 'prod-agent', inTokens: '1,420', outTokens: '2,008', latency: '14.20s', slow: true, cost: '$0.0312' },
  { day: 'May 12', time: '14:28:48', relative: '2m ago',   status: 'redacted',code: '200', vendor: 'google',    model: 'gemini-3-pro',      conversation: 'cnv_skylark_18', keyId: 'prod-agent', inTokens: '1,204', outTokens: '688',   latency: '5.40s',              cost: '$0.0091', guardrailReason: 'pii' },
  { day: 'May 12', time: '14:28:09', relative: '2m ago',   status: 'error',  code: '500', vendor: 'anthropic', model: 'claude-opus-4.7',   conversation: 'cnv_meridian_07',keyId: 'prod-web',   inTokens: '—',     outTokens: '—',     latency: '—',                  cost: '—'       },
  { day: 'May 12', time: '14:27:42', relative: '3m ago',   status: 'success', code: '200', vendor: 'meta',      model: 'llama-4.2-405b',      conversation: 'cnv_orion_70',   keyId: 'dev',        inTokens: '5,024', outTokens: '2,612', latency: '13.40s', slow: true, cost: '$0.0068' },
  { day: 'May 12', time: '14:27:11', relative: '3m ago',   status: 'success', code: '200', vendor: 'mistral',   model: 'mistral-large-3',   conversation: 'cnv_skylark_18', keyId: 'prod-agent', inTokens: '1,442', outTokens: '820',   latency: '3.20s',              cost: '$0.0072' },
  { day: 'May 12', time: '14:26:52', relative: '4m ago',   status: 'error',    code: '429', vendor: 'openai',    model: 'gpt-5.1',             conversation: 'cnv_meridian_07',keyId: 'prod-web',   inTokens: '—',     outTokens: '—',     latency: '2.10s',              cost: '$0.0000' },
  { day: 'May 12', time: '14:26:31', relative: '4m ago',   status: 'blocked', code: '403', vendor: 'openai',    model: 'gpt-5.1',             conversation: 'cnv_lyra_92',    keyId: 'prod-web',   inTokens: '—',     outTokens: '—',     latency: '2.05s',              cost: '$0.0000', guardrailReason: 'injection' },
  { day: 'May 12', time: '14:26:14', relative: '4m ago',   status: 'success', code: '200', vendor: 'anthropic', model: 'claude-sonnet-4.8', conversation: 'cnv_skylark_18', keyId: 'prod-agent', inTokens: '3,104', outTokens: '1,420', latency: '4.10s',              cost: '$0.0315' },
  { day: 'May 12', time: '14:25:47', relative: '5m ago',   status: 'flagged', code: '200', vendor: 'xai',       model: 'grok-4.1-fast',     conversation: 'cnv_polaris_55', keyId: 'prod-web',   inTokens: '6,204', outTokens: '3,109', latency: '7.20s',              cost: '$0.0184', guardrailReason: 'toxicity' },
  { day: 'May 12', time: '14:25:10', relative: '5m ago',   status: 'success', code: '200', vendor: 'google',    model: 'gemini-3-pro',      conversation: 'cnv_aurora_42',  keyId: 'prod-web',   inTokens: '942',   outTokens: '517',   latency: '11.60s', slow: true, cost: '$0.0062' },
  { day: 'May 12', time: '14:24:38', relative: '6m ago',   status: 'error',    code: '408', vendor: 'meta',      model: 'llama-4.2-405b',      conversation: 'cnv_polaris_55', keyId: 'dev',        inTokens: '4,108', outTokens: '0',     latency: '18.20s', slow: true, cost: '$0.0000' },
  { day: 'May 12', time: '14:24:02', relative: '6m ago',   status: 'success', code: '200', vendor: 'anthropic', model: 'claude-sonnet-4.8', conversation: 'cnv_orion_70',   keyId: 'prod-agent', inTokens: '1,712', outTokens: '904',   latency: '4.80s',              cost: '$0.0167' },
  { day: 'May 12', time: '14:23:24', relative: '7m ago',   status: 'success', code: '200', vendor: 'mistral',   model: 'mistral-large-3',   conversation: 'cnv_aurora_42',  keyId: 'prod-web',   inTokens: '2,209', outTokens: '1,058', latency: '3.40s',              cost: '$0.0096' },
];

// 24H view — hour-to-multiple-hours spaced; spans yesterday → now.
const REQUEST_ROWS_24H: RequestRow[] = [
  { day: 'May 12', time: '14:30:14', relative: 'just now',  status: 'success', code: '200', vendor: 'anthropic', model: 'claude-sonnet-4.8', conversation: 'cnv_aurora_42',  keyId: 'prod-web',   inTokens: '2,847', outTokens: '1,204', latency: '4.20s',              cost: '$0.0284' },
  { day: 'May 12', time: '13:18:42', relative: '1h ago',    status: 'success', code: '200', vendor: 'openai',    model: 'gpt-5.1',           conversation: 'cnv_lyra_92',    keyId: 'prod-web',   inTokens: '3,402', outTokens: '1,718', latency: '3.80s',              cost: '$0.0346' },
  { day: 'May 12', time: '11:42:08', relative: '3h ago',    status: 'success', code: '200', vendor: 'anthropic', model: 'claude-opus-4.7',   conversation: 'cnv_vela_21',    keyId: 'prod-agent', inTokens: '8,210', outTokens: '4,512', latency: '14.80s', slow: true, cost: '$0.1842' },
  { day: 'May 12', time: '09:55:31', relative: '5h ago',    status: 'success', code: '200', vendor: 'google',    model: 'gemini-3-pro',      conversation: 'cnv_orion_70',   keyId: 'prod-web',   inTokens: '1,604', outTokens: '722',   latency: '5.10s',              cost: '$0.0124' },
  { day: 'May 12', time: '08:11:04', relative: '6h ago',    status: 'error',  code: '503', vendor: 'meta',      model: 'llama-4.2-405b',    conversation: 'cnv_meridian_07',keyId: 'dev',        inTokens: '—',     outTokens: '—',     latency: '—',                  cost: '—'       },
  { day: 'May 12', time: '06:38:19', relative: '8h ago',    status: 'flagged', code: '200', vendor: 'mistral',   model: 'mistral-large-3',   conversation: 'cnv_skylark_18', keyId: 'prod-agent', inTokens: '942',   outTokens: '481',   latency: '6.40s',              cost: '$0.0058', guardrailReason: 'toxicity' },
  { day: 'May 12', time: '04:20:48', relative: '10h ago',   status: 'success', code: '200', vendor: 'xai',       model: 'grok-4.1-fast',     conversation: 'cnv_polaris_55', keyId: 'prod-web',   inTokens: '5,810', outTokens: '2,944', latency: '7.80s',              cost: '$0.0172' },
  { day: 'May 12', time: '03:42:11', relative: '11h ago',   status: 'blocked', code: '403', vendor: 'anthropic', model: 'claude-opus-4.7',   conversation: 'cnv_meridian_07',keyId: 'dev',        inTokens: '—',     outTokens: '—',     latency: '2.10s',              cost: '$0.0000', guardrailReason: 'allowlist' },
  { day: 'May 12', time: '02:04:11', relative: '12h ago',   status: 'redacted',code: '200', vendor: 'anthropic', model: 'claude-sonnet-4.8', conversation: 'cnv_aurora_42',  keyId: 'prod-web',   inTokens: '2,108', outTokens: '1,012', latency: '4.50s',              cost: '$0.0241', guardrailReason: 'pii' },
  { day: 'May 11', time: '23:52:09', relative: '14h ago',   status: 'error',    code: '429', vendor: 'openai',    model: 'gpt-5.1',           conversation: 'cnv_meridian_07',keyId: 'prod-web',   inTokens: '—',     outTokens: '—',     latency: '2.20s',              cost: '$0.0000' },
  { day: 'May 11', time: '21:14:46', relative: '17h ago',   status: 'success', code: '200', vendor: 'anthropic', model: 'claude-sonnet-4.8', conversation: 'cnv_vela_21',    keyId: 'prod-agent', inTokens: '4,208', outTokens: '2,104', latency: '5.90s',              cost: '$0.0512' },
  { day: 'May 11', time: '18:43:22', relative: '20h ago',   status: 'success', code: '200', vendor: 'google',    model: 'gemini-3-pro',      conversation: 'cnv_lyra_92',    keyId: 'prod-web',   inTokens: '1,318', outTokens: '602',   latency: '3.40s',              cost: '$0.0094' },
  { day: 'May 11', time: '16:08:55', relative: '22h ago',   status: 'success', code: '200', vendor: 'meta',      model: 'llama-4.2-405b',    conversation: 'cnv_orion_70',   keyId: 'dev',        inTokens: '7,440', outTokens: '3,820', latency: '6.20s',              cost: '$0.0098' },
];

// 7D view — day-to-half-day spaced; spans the past week.
const REQUEST_ROWS_7D: RequestRow[] = [
  { day: 'May 12', time: '14:30:14', relative: 'just now',  status: 'success', code: '200', vendor: 'anthropic', model: 'claude-sonnet-4.8', conversation: 'cnv_aurora_42',  keyId: 'prod-web',   inTokens: '2,847', outTokens: '1,204', latency: '4.20s',              cost: '$0.0284' },
  { day: 'May 12', time: '08:14:02', relative: '6h ago',    status: 'success', code: '200', vendor: 'openai',    model: 'gpt-5.1',           conversation: 'cnv_vela_21',    keyId: 'prod-web',   inTokens: '4,108', outTokens: '2,094', latency: '3.80s',              cost: '$0.0418' },
  { day: 'May 11', time: '19:42:38', relative: 'yesterday', status: 'success', code: '200', vendor: 'anthropic', model: 'claude-opus-4.7',   conversation: 'cnv_orion_70',   keyId: 'prod-agent', inTokens: '12,408',outTokens: '6,820', latency: '12.30s', slow: true, cost: '$0.2104' },
  { day: 'May 10', time: '14:08:21', relative: '2d ago',    status: 'flagged', code: '200', vendor: 'google',    model: 'gemini-3-pro',      conversation: 'cnv_polaris_55', keyId: 'prod-web',   inTokens: '2,012', outTokens: '988',   latency: '5.20s',              cost: '$0.0148', guardrailReason: 'toxicity' },
  { day: 'May 10', time: '03:51:09', relative: '2d ago',    status: 'error',  code: '500', vendor: 'meta',      model: 'llama-4.2-405b',    conversation: 'cnv_meridian_07',keyId: 'dev',        inTokens: '—',     outTokens: '—',     latency: '—',                  cost: '—'       },
  { day: 'May 9',  time: '21:24:48', relative: '3d ago',    status: 'success', code: '200', vendor: 'mistral',   model: 'mistral-large-3',   conversation: 'cnv_skylark_18', keyId: 'prod-agent', inTokens: '1,628', outTokens: '742',   latency: '4.10s',              cost: '$0.0086' },
  { day: 'May 9',  time: '16:08:42', relative: '3d ago',    status: 'blocked', code: '403', vendor: 'openai',    model: 'gpt-5.1',           conversation: 'cnv_orion_70',   keyId: 'prod-web',   inTokens: '—',     outTokens: '—',     latency: '2.10s',              cost: '$0.0000', guardrailReason: 'pii' },
  { day: 'May 9',  time: '09:18:32', relative: '3d ago',    status: 'success', code: '200', vendor: 'xai',       model: 'grok-4.1-fast',     conversation: 'cnv_lyra_92',    keyId: 'prod-web',   inTokens: '8,442', outTokens: '4,210', latency: '6.80s',              cost: '$0.0228' },
  { day: 'May 8',  time: '15:42:51', relative: '4d ago',    status: 'success', code: '200', vendor: 'anthropic', model: 'claude-sonnet-4.8', conversation: 'cnv_aurora_42',  keyId: 'prod-web',   inTokens: '3,118', outTokens: '1,564', latency: '3.50s',              cost: '$0.0382' },
  { day: 'May 8',  time: '04:08:11', relative: '4d ago',    status: 'error',    code: '429', vendor: 'openai',    model: 'gpt-5.1',           conversation: 'cnv_meridian_07',keyId: 'prod-web',   inTokens: '—',     outTokens: '—',     latency: '2.20s',              cost: '$0.0000' },
  { day: 'May 7',  time: '08:42:18', relative: '5d ago',    status: 'blocked', code: '403', vendor: 'anthropic', model: 'claude-sonnet-4.8', conversation: 'cnv_aurora_42',  keyId: 'prod-web',   inTokens: '—',     outTokens: '—',     latency: '2.10s',              cost: '$0.0000', guardrailReason: 'spend' },
  { day: 'May 7',  time: '17:31:22', relative: '5d ago',    status: 'redacted',code: '200', vendor: 'google',    model: 'gemini-3-pro',      conversation: 'cnv_orion_70',   keyId: 'prod-web',   inTokens: '1,448', outTokens: '702',   latency: '5.40s',              cost: '$0.0118', guardrailReason: 'pii' },
  { day: 'May 6',  time: '23:14:08', relative: '6d ago',    status: 'success', code: '200', vendor: 'meta',      model: 'llama-4.2-405b',    conversation: 'cnv_vela_21',    keyId: 'dev',        inTokens: '6,210', outTokens: '3,108', latency: '7.20s',              cost: '$0.0084' },
  { day: 'May 6',  time: '09:14:42', relative: '6d ago',    status: 'success', code: '200', vendor: 'anthropic', model: 'claude-sonnet-4.8', conversation: 'cnv_polaris_55', keyId: 'prod-agent', inTokens: '2,514', outTokens: '1,248', latency: '3.80s',              cost: '$0.0298' },
];

// 30D view — multi-day spaced; spans the past month.
const REQUEST_ROWS_30D: RequestRow[] = [
  { day: 'May 12', time: '14:30:14', relative: 'just now',  status: 'success', code: '200', vendor: 'anthropic', model: 'claude-sonnet-4.8', conversation: 'cnv_aurora_42',  keyId: 'prod-web',   inTokens: '2,847', outTokens: '1,204', latency: '4.20s',              cost: '$0.0284' },
  { day: 'May 11', time: '18:42:08', relative: 'yesterday', status: 'success', code: '200', vendor: 'openai',    model: 'gpt-5.1',           conversation: 'cnv_lyra_92',    keyId: 'prod-web',   inTokens: '3,608', outTokens: '1,812', latency: '3.80s',              cost: '$0.0368' },
  { day: 'May 9',  time: '12:14:42', relative: '3d ago',    status: 'success', code: '200', vendor: 'anthropic', model: 'claude-opus-4.7',   conversation: 'cnv_orion_70',   keyId: 'prod-agent', inTokens: '14,208',outTokens: '7,420', latency: '22.40s', slow: true, cost: '$0.2418' },
  { day: 'May 6',  time: '09:18:31', relative: '6d ago',    status: 'redacted',code: '200', vendor: 'google',    model: 'gemini-3-pro',      conversation: 'cnv_polaris_55', keyId: 'prod-web',   inTokens: '2,108', outTokens: '1,042', latency: '5.40s',              cost: '$0.0158', guardrailReason: 'pii' },
  { day: 'May 2',  time: '21:08:14', relative: '10d ago',   status: 'error',  code: '500', vendor: 'meta',      model: 'llama-4.2-405b',    conversation: 'cnv_meridian_07',keyId: 'dev',        inTokens: '—',     outTokens: '—',     latency: '—',                  cost: '—'       },
  { day: 'Apr 30', time: '11:32:48', relative: '12d ago',   status: 'blocked', code: '403', vendor: 'openai',    model: 'gpt-5.1',           conversation: 'cnv_skylark_18', keyId: 'prod-agent', inTokens: '—',     outTokens: '—',     latency: '2.10s',              cost: '$0.0000', guardrailReason: 'injection' },
  { day: 'Apr 28', time: '15:42:51', relative: '14d ago',   status: 'success', code: '200', vendor: 'mistral',   model: 'mistral-large-3',   conversation: 'cnv_skylark_18', keyId: 'prod-agent', inTokens: '1,808', outTokens: '892',   latency: '4.80s',              cost: '$0.0098' },
  { day: 'Apr 25', time: '08:14:22', relative: '17d ago',   status: 'success', code: '200', vendor: 'xai',       model: 'grok-4.1-fast',     conversation: 'cnv_lyra_92',    keyId: 'prod-web',   inTokens: '9,442', outTokens: '4,820', latency: '7.20s',              cost: '$0.0264' },
  { day: 'Apr 22', time: '14:18:08', relative: '20d ago',   status: 'flagged', code: '200', vendor: 'anthropic', model: 'claude-sonnet-4.8', conversation: 'cnv_aurora_42',  keyId: 'prod-web',   inTokens: '3,408', outTokens: '1,718', latency: '3.90s',              cost: '$0.0418', guardrailReason: 'toxicity' },
  { day: 'Apr 21', time: '09:14:32', relative: '21d ago',   status: 'blocked', code: '403', vendor: 'google',    model: 'gemini-3-pro',      conversation: 'cnv_lyra_92',    keyId: 'prod-web',   inTokens: '—',     outTokens: '—',     latency: '2.10s',              cost: '$0.0000', guardrailReason: 'pii' },
  { day: 'Apr 20', time: '03:52:41', relative: '22d ago',   status: 'error',    code: '429', vendor: 'openai',    model: 'gpt-5.1',           conversation: 'cnv_meridian_07',keyId: 'prod-web',   inTokens: '—',     outTokens: '—',     latency: '2.20s',              cost: '$0.0000' },
  { day: 'Apr 17', time: '17:31:14', relative: '25d ago',   status: 'success', code: '200', vendor: 'google',    model: 'gemini-3-pro',      conversation: 'cnv_orion_70',   keyId: 'prod-web',   inTokens: '1,548', outTokens: '742',   latency: '5.40s',              cost: '$0.0128' },
  { day: 'Apr 15', time: '11:14:08', relative: '27d ago',   status: 'success', code: '200', vendor: 'meta',      model: 'llama-4.2-405b',    conversation: 'cnv_vela_21',    keyId: 'dev',        inTokens: '6,810', outTokens: '3,408', latency: '11.80s', slow: true, cost: '$0.0094' },
  { day: 'Apr 13', time: '22:48:42', relative: '29d ago',   status: 'success', code: '200', vendor: 'anthropic', model: 'claude-sonnet-4.8', conversation: 'cnv_polaris_55', keyId: 'prod-agent', inTokens: '2,814', outTokens: '1,408', latency: '6.10s',              cost: '$0.0342' },
];

const STATUS_BADGE: Record<RequestStatus, {
  variant: 'success' | 'warning' | 'destructive' | 'neutral';
}> = {
  success:  { variant: 'success'     },
  flagged:  { variant: 'warning'     },
  redacted: { variant: 'neutral'     },
  blocked:  { variant: 'destructive' },
  error:    { variant: 'destructive' },
};

/** Per-CTO direction (Marcus, 2026-05-12): row Status badge shows the
 *  semantic gateway action — success/flagged/redacted/blocked/error —
 *  not the HTTP code. The raw HTTP code still lives on `row.code` and
 *  surfaces in the modal Details tab. Lowercase here, the Badge
 *  primitive's `capitalize` rule renders the visual case. */
const STATUS_MESSAGE: Record<RequestStatus, string> = {
  success:  'success',
  flagged:  'flagged',
  redacted: 'redacted',
  blocked:  'blocked',
  error:    'error',
};

function statusLabel(row: RequestRow) {
  if (row.slow) return 'slow';
  return STATUS_MESSAGE[row.status];
}

/** Slow short-circuits the row's underlying status in the badge. The
 *  raw `row.status` still drives the modal Audit tab so investigators
 *  can see whether the slow request also blocked / errored / etc. */
function statusVariant(row: RequestRow): 'success' | 'warning' | 'destructive' | 'neutral' {
  if (row.slow) return 'warning';
  return STATUS_BADGE[row.status].variant;
}

// Per-range row set + pagination total. Pill drives both — total reflects
// the headline volume for the window (1H ties to HERO_TOTAL; 24H/7D/30D
// scale up plausibly). Rows shown are the head of the range; pagination
// represents the full count.
const RANGE_ROWS: Record<string, RequestRow[]> = {
  '1h':  REQUEST_ROWS_1H,
  '24h': REQUEST_ROWS_24H,
  '7d':  REQUEST_ROWS_7D,
  '30d': REQUEST_ROWS_30D,
};

const RANGE_TOTALS: Record<string, number> = {
  '1h':  HERO_TOTAL,
  '24h': 197_580,
  '7d':  1_387_612,
  '30d': 5_948_304,
};

function RequestsTableSection() {
  const navigate = useNavigate();
  const [range, setRange] = useState('1h');
  // Looked up per render. Pill change → new rows + new total; page resets
  // so a deep-paged 30D state doesn't carry over into a 1H view that
  // doesn't have those pages.
  const rows = RANGE_ROWS[range] ?? REQUEST_ROWS_1H;
  const total = RANGE_TOTALS[range] ?? HERO_TOTAL;
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
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
              <SelectItem value="redacted">Redacted</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="slow">{'Slow > 10s'}</SelectItem>
            </SelectContent>
          </Select>

          <SegmentedPill
            className="ml-auto"
            size="sm"
            options={RANGE_OPTIONS}
            value={range}
            onValueChange={(next) => {
              setRange(next);
              setPage(1);
            }}
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
            {rows.map((row, i) => {
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
                  <TableCell className="whitespace-nowrap py-2">
                    {/* Two-tier timestamp: relative (sans, ink-800) leads as
                        the scan target; absolute (mono tabular, ink-500)
                        qualifies for forensic alignment across rows. py-2
                        trims 8px off the default py-3 so the dual-line cell
                        doesn't bloat row height. `gap-0` lets the natural
                        line-heights own the vertical rhythm — we keep the
                        codebase on the 4px grid and don't drift to gap-0.5. */}
                    <div className="flex flex-col gap-0">
                      <span className="font-sans text-sm text-ink-800">
                        {row.relative}
                      </span>
                      <span className="font-mono text-xs tabular-nums tracking-tight text-ink-500">
                        {row.day}, {row.time}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant={statusVariant(row)}>
                      {statusLabel(row)}
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
                  <TableCell className="max-w-[200px]">
                    <TextLink
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/conversations?open=${row.conversation}`);
                      }}
                      title={row.conversation}
                      aria-label={`Open conversation ${row.conversation}`}
                      className="font-mono text-sm tabular-nums tracking-tight truncate block max-w-full text-left"
                    >
                      {row.conversation}
                    </TextLink>
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
          total={total}
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
  const navigate = useNavigate();
  const openConversation = () =>
    navigate(`/conversations?open=${row.conversation}`);
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
            <Badge variant={statusVariant(row)}>
              {statusLabel(row)}
            </Badge>
          }
          meta={
            <span className="font-mono tracking-snug">
              {row.day}, 2026 · {row.time} UTC · part of conversation{' '}
              <TextLink
                onClick={openConversation}
                aria-label={`Open conversation ${row.conversation}`}
              >
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
                label="HTTP status"
                value={<Badge variant={badge.variant}>{row.code}</Badge>}
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
            <Button variant="default" size="sm" onClick={openConversation}>
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
   The check state is driven by `row.status` + `row.guardrailReason`:
     - `blocked` row → matching check renders as `block` (destructive)
     - `flagged` row → matching check renders as `flag` (warning)
     - `redacted` row → matching check renders as `redact` (info)
     - anything else → all five checks `pass`
   Descriptions use live row values so the panel doesn't read as decoupled
   from the selected request. */
type CheckStatus = 'pass' | 'flag' | 'redact' | 'block';
type CheckKey = 'injection' | 'pii' | 'toxicity' | 'allowlist' | 'spend';

/** Maps a row's overall status to the check-level state that should
 *  render for its matching guardrail. `success`/`error` rows pass all
 *  checks (errors come from the provider, not from policy). */
function rowActionToCheckStatus(status: RequestStatus): CheckStatus {
  switch (status) {
    case 'blocked':  return 'block';
    case 'flagged':  return 'flag';
    case 'redacted': return 'redact';
    default:         return 'pass';
  }
}

function SecurityPanel({ row }: { row: RequestRow }) {
  const reason = row.guardrailReason;
  const matchState = rowActionToCheckStatus(row.status);
  const stateFor = (key: CheckKey): CheckStatus =>
    reason === key && matchState !== 'pass' ? matchState : 'pass';
  const checks: {
    key: CheckKey;
    title: string;
    description: string;
    status: CheckStatus;
  }[] = [
    {
      key: 'injection',
      title: 'Prompt injection scan',
      description:
        stateFor('injection') === 'block'
          ? 'Injection pattern matched · request rejected before model call'
          : stateFor('injection') === 'flag'
            ? 'Injection signal detected · request allowed but flagged'
            : 'No injection patterns detected · 0/247 rules matched',
      status: stateFor('injection'),
    },
    {
      key: 'pii',
      title: 'PII redaction',
      description:
        stateFor('pii') === 'block'
          ? 'PII detected in outbound payload · request rejected before model call'
          : stateFor('pii') === 'redact'
            ? 'PII redacted from outbound payload before model call'
            : stateFor('pii') === 'flag'
              ? 'PII detected · request allowed but flagged'
              : 'No PII detected',
      status: stateFor('pii'),
    },
    {
      key: 'toxicity',
      title: 'Output toxicity',
      description:
        stateFor('toxicity') === 'block'
          ? 'Toxicity score above threshold · request rejected before model call'
          : stateFor('toxicity') === 'flag'
            ? 'Toxicity score above flag threshold · request allowed but flagged'
            : 'Below threshold (0.04 / 0.7)',
      status: stateFor('toxicity'),
    },
    {
      key: 'allowlist',
      title: 'Model allowlist',
      description:
        stateFor('allowlist') === 'block'
          ? `${row.model} not in allowlist for key ${row.keyId}`
          : `${row.model} approved for key ${row.keyId}`,
      status: stateFor('allowlist'),
    },
    {
      key: 'spend',
      title: 'Spend cap',
      description:
        stateFor('spend') === 'block'
          ? `Daily cap exceeded · $50.00 of $50.00 used`
          : `Within daily cap · ${row.cost} of $50.00`,
      status: stateFor('spend'),
    },
  ];
  return (
    <div className="flex flex-col gap-2">
      {checks.map((check) => (
        <SecurityCheckRow key={check.key} {...check} />
      ))}
    </div>
  );
}

const CHECK_BADGE_VARIANT: Record<CheckStatus, 'success' | 'warning' | 'destructive' | 'neutral'> = {
  pass:   'success',
  flag:   'warning',
  redact: 'neutral',
  block:  'destructive',
};

function SecurityCheckRow({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: CheckStatus;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xs border border-ink-200 p-4">
      <div className="flex flex-col gap-1 min-w-0">
        <span className="font-sans text-sm font-medium text-ink-900">{title}</span>
        <span className="font-sans text-xs text-ink-500 text-pretty">{description}</span>
      </div>
      <Badge variant={CHECK_BADGE_VARIANT[status]}>
        {status}
      </Badge>
    </div>
  );
}

