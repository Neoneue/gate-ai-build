import { useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { Activity, ArrowRight, ExternalLink, TriangleAlert, Wrench } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CompactKpi, CompactSpark } from '@/components/ui/compact-kpi';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { SearchInput } from '@/components/ui/search-input';
import { SegmentedPill } from '@/components/ui/segmented-pill';
import { KpiRail as KpiRailShell } from '@/components/ui/kpi-rail';
import { MessageBlock, type MessageRole } from '@/components/ui/message-block';
import { RowActionButton } from '@/components/ui/row-action-button';
import { TableEmptyState } from '@/components/ui/table-empty-state';
import { TablePaginationFooter } from '@/components/ui/table-pagination-footer';
import { ToolResultCode } from '@/components/ui/tool-result-code';
import { REQUEST_ROWS_RECENT } from './Requests';
import {
  Dialog,
  DialogScrollBody,
  DialogScrollContent,
  DialogScrollFooter,
  DialogScrollHeader,
  DialogScrollSummary,
  DialogTitleBlock,
} from '@/components/ui/dialog';
import { Eyebrow } from '@/components/ui/eyebrow';
import { PageTitle } from '@/components/ui/page-title';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { VENDOR_META, VendorAvatar, type Vendor } from '@/components/icons/vendor-meta';
import { DashboardChrome } from '@/layouts/DashboardChrome';
import { Timestamp } from '@/components/ui/timestamp';

const REDUCE_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─────────────────────────────────────────────────────────────────────────
 * CMP-014 — Conversations (Observability)
 *
 * Conversation-grouped view of gateway traffic. Each row is a chain of
 * requests sharing session context (agent runs, multi-turn chats, tool
 * loops). Production-shell chrome — sidebar + screen-head + topbar —
 * comes from `_shared/DashboardChrome` and is shared with CMP-012 /
 * CMP-013. This file owns the page-internal pieces only: PageHeader,
 * KpiRail, ConversationsTableSection.
 * ───────────────────────────────────────────────────────────────────────── */

type PresetRange = 'all' | '24h' | '7d' | '30d';
type Range = PresetRange | 'custom';
type CustomRange = { from: Date; to: Date };

const RANGE_OPTIONS: { value: PresetRange; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: '24h', label: '24H' },
  { value: '7d',  label: '7D'  },
  { value: '30d', label: '30D' },
];

const RANGE_SCALE: Record<PresetRange, number> = {
  '24h': 0.16,
  '7d':  1,
  '30d': 4.2,
  all:   8.5,
};

const SPARK: Record<Range, { conversations: number[]; avgTurns: number[]; avgCost: number[] }> = {
  all:    { conversations: [280,340,310,380,350,410,385,415,420], avgTurns: [11.2,12.8,11.6,13.4,12.9,14.1,13.5,14.0,14.2], avgCost: [0.101,0.095,0.098,0.091,0.093,0.087,0.089,0.083,0.082] },
  '30d':  { conversations: [348,368,382,371,395,383,408,398,420], avgTurns: [13.1,13.6,13.4,13.8,13.6,14.1,13.9,14.1,14.2], avgCost: [0.091,0.088,0.090,0.086,0.088,0.084,0.086,0.083,0.082] },
  '7d':   { conversations: [10,12,9,11,13,10,12,11,12],            avgTurns: [13.4,14.8,13.1,14.2,14.9,13.6,14.5,13.9,14.2], avgCost: [0.087,0.082,0.090,0.083,0.085,0.080,0.084,0.079,0.082] },
  '24h':  { conversations: [11,13,10,12,14,11,13,12,12],           avgTurns: [14.0,14.5,13.8,14.3,14.7,14.1,14.4,14.0,14.2], avgCost: [0.083,0.081,0.084,0.082,0.080,0.083,0.081,0.082,0.082] },
  custom: { conversations: [380,395,410,405,415,408,418,412,420],   avgTurns: [13.6,14.0,13.8,14.2,14.0,14.4,14.1,14.3,14.2], avgCost: [0.088,0.085,0.087,0.084,0.086,0.083,0.085,0.082,0.082] },
};

function daysInRange(r: CustomRange): number {
  return Math.max(1, Math.round((r.to.getTime() - r.from.getTime()) / 86_400_000) + 1);
}

function effectiveScale(range: Range, customRange: CustomRange | null): number {
  if (range === 'custom' && customRange) return daysInRange(customRange) / 7;
  return RANGE_SCALE[range === 'custom' ? '7d' : range];
}

export function Conversations() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{ sidebarExpanded: boolean; toggleSidebar: () => void }>();
  const [range, setRange] = useState<Range>('all');
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);

  return (
    <DashboardChrome
            activeNavId="conversations"
            sidebarExpanded={sidebarExpanded}
            onToggleSidebar={toggleSidebar}
            onNavigate={(path: string) => navigate(path)}
          >
            <PageHeader />
            <div className="flex flex-col gap-4">
              <OverviewBar
                range={range}
                customRange={customRange}
                onRangeChange={(r) => { setRange(r); setCustomRange(null); }}
                onCustomRangeChange={(r) => {
                  if (r) { setCustomRange(r); setRange('custom'); }
                  else   { setCustomRange(null); setRange('all'); }
                }}
              />
              <KpiRail range={range} customRange={customRange} />
            </div>
            <ConversationsTableSection range={range} customRange={customRange} />
          </DashboardChrome>
  );
}

/* ─── Overview bar — heading + range controls, label FOR the KPI rail ─────
 * Mirrors AuditTrail's OverviewBar verbatim. The range state lives in
 * Conversations(); the SegmentedPill + DateRangePicker are wired to the same
 * handlers, sized sm (32px) to sit tight above the rail. */
function OverviewBar({
  range,
  customRange,
  onRangeChange,
  onCustomRangeChange,
}: {
  range: Range;
  customRange: CustomRange | null;
  onRangeChange: (r: PresetRange) => void;
  onCustomRangeChange: (r: CustomRange | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h3 className="font-sans text-xl/7 font-medium text-neutral-900 m-0">Overview</h3>
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedPill
          size="sm"
          aria-label="Time range"
          options={RANGE_OPTIONS}
          value={range === 'custom' ? '' : range}
          onValueChange={(v) => onRangeChange(v as PresetRange)}
        />
        <DateRangePicker
          value={customRange}
          onChange={onCustomRangeChange}
          size="sm"
        />
      </div>
    </div>
  );
}

/* ─── Page header — eyebrow + title + description + actions ──────────────── */

function PageHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-2 max-w-1/2">
        {/* h2 — see CMP012 PageHeader note. */}
        <PageTitle>Conversations</PageTitle>
        <p className="font-sans text-neutral-500 text-base tracking-tight text-pretty m-0">
          A conversation is a chain of requests that share session context: agent runs, multi-turn chats, tool-calling loops. Click any row to see its message thread.
        </p>
      </div>
    </div>
  );
}

/* ─── KPI Rail (4 cards — Spend / 24h omitted per request) ────────────── */

function KpiRail({ range, customRange }: { range: Range; customRange: CustomRange | null }) {
  const conversationsValue = Math.round(100 * effectiveScale(range, customRange)).toLocaleString('en-US');
  const spark = SPARK[range];
  return (
    <KpiRailShell columns={3}>
      <CompactKpi
        flat
        title="Conversations"
        value={conversationsValue}
        delta="+6.4%"
        spark={<CompactSpark colorVar="var(--color-chart-7)" data={spark.conversations} />}
      />
      <CompactKpi
        flat
        title="Avg Turns"
        value="14.2"
        delta="+1.8"
        spark={<CompactSpark colorVar="var(--color-chart-3)" data={spark.avgTurns} />}
      />
      <CompactKpi
        flat
        title="Avg Cost / Conv"
        value="$0.082"
        delta="-3.1%"
        deltaInverted
        spark={<CompactSpark colorVar="var(--color-chart-1)" data={spark.avgCost} endDot />}
      />
    </KpiRailShell>
  );
}

/* ─── Conversations table section (toolbar + table + pagination) ─────── */

type ConversationStatus = 'active' | 'completed' | 'failed';


type ModelId =
  | 'claude-opus-4-7'
  | 'claude-sonnet-4-5'
  | 'claude-haiku-4-5'
  | 'gpt-5'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gemini-3-pro'
  | 'gemini-3-flash'
  | 'gemini-3-flash-lite'
  | 'llama-3-3-70b';

export type ConversationRow = {
  title: string;
  conversationId: string;
  initiator: string;
  turns: number;
  reqs: number;
  vendors: Vendor[];
  models: ModelId[];
  inTokens: string;
  outTokens: string;
  cost: string;
  status: ConversationStatus;
  updated: Date;
  /** Conversation duration ("3m 53s") — surfaced in the detail sheet KPI rail. */
  duration: string;
};

export const CONVERSATION_ROWS: ConversationRow[] = [
  { title: 'Why was the SEPA transfer 0x4a3e flagged for review yesterday?', conversationId: 'cnv_aurora_42',   initiator: 'prod-web',   turns:  3, reqs:  7, vendors: ['anthropic'],                      models: ['claude-sonnet-4-5'],                                 inTokens: '3,438',  outTokens: '613',    cost: '$0.1042', status: 'active',    updated: new Date(2026, 4, 12, 14, 28, 4),  duration: '3m 53s'  },
  { title: 'Draft a 4-step onboarding sequence for new fin clients',         conversationId: 'cnv_skylark_18', initiator: 'prod-agent', turns:  6, reqs: 11, vendors: ['anthropic', 'openai'],            models: ['claude-opus-4-7', 'gpt-4o'],                         inTokens: '6,897',  outTokens: '1,217',  cost: '$0.4218', status: 'active',    updated: new Date(2026, 4, 12, 14, 22, 11), duration: '5m 12s'  },
  { title: 'Classify the attached document and click KYC if needed',         conversationId: 'cnv_meridian_07',initiator: 'prod-agent', turns:  3, reqs:  4, vendors: ['google'],                         models: ['gemini-3-flash'],                                    inTokens: '1,788',  outTokens: '316',    cost: '$0.3104', status: 'active',    updated: new Date(2026, 4, 12, 14, 15, 22), duration: '0m 47s'  },
  { title: 'Investigate the variance in YOY revenue between segments',       conversationId: 'cnv_orion_70',   initiator: 'prod-web',   turns: 18, reqs: 38, vendors: ['anthropic', 'openai', 'mistral'], models: ['claude-opus-4-7', 'gpt-5', 'llama-3-3-70b'],         inTokens: '44,889', outTokens: '7,921',  cost: '$0.5841', status: 'completed', updated: new Date(2026, 4, 12, 14,  2, 48), duration: '14m 06s' },
  { title: 'Draft a postmortem for incident INC-2026-04-1107',               conversationId: 'cnv_polaris_55', initiator: 'prod-agent', turns:  4, reqs:  7, vendors: ['anthropic'],                      models: ['claude-haiku-4-5'],                                  inTokens: '2,892',  outTokens: '510',    cost: '$0.1102', status: 'active',    updated: new Date(2026, 4, 12, 13, 48, 33), duration: '2m 18s'  },
  { title: 'Customer requesting a refund on order ORD-89412',                conversationId: 'cnv_lyra_92',    initiator: 'prod-web',   turns: 14, reqs: 32, vendors: ['openai'],                         models: ['gpt-4o-mini'],                                       inTokens: '10,717', outTokens: '1,891',  cost: '$0.0812', status: 'failed',    updated: new Date(2026, 4, 12, 13, 36, 10), duration: '8m 41s'  },
  { title: 'Summarize Q1 2026 earnings call for top 10 holdings',            conversationId: 'cnv_vela_21',    initiator: 'test-key',   turns: 12, reqs: 26, vendors: ['anthropic'],                      models: ['claude-sonnet-4-5'],                                 inTokens: '86,735', outTokens: '15,306', cost: '$0.1402', status: 'completed', updated: new Date(2026, 4, 12, 13, 18, 55), duration: '11m 27s' },
];

// Synthetic total — held at module scope so pagination math reconciles
// with the KPI rail's "Conversations: 100" figure.
const CONVERSATIONS_TOTAL = 100;

function scaleTokenStr(s: string, scale: number): string {
  return Math.round(Number(s.replace(/,/g, '')) * scale).toLocaleString('en-US');
}
function scaleCostStr(s: string, scale: number): string {
  return '$' + (parseFloat(s.replace('$', '')) * scale).toFixed(4);
}

function ConversationsTableSection({ range, customRange }: { range: Range; customRange: CustomRange | null }) {
  const scale = effectiveScale(range, customRange);
  const [keyId, setKeyId] = useState('all');
  const [model, setModel] = useState('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState('25');
  const isFiltered = keyId !== 'all' || model !== 'all';
  const visibleRows = CONVERSATION_ROWS.filter((row) => {
    if (keyId !== 'all' && row.initiator !== keyId) return false;
    if (model !== 'all' && !row.models.includes(model as ModelId)) return false;
    return true;
  });
  const paginationTotal = isFiltered ? visibleRows.length : Math.round(CONVERSATIONS_TOTAL * scale);
  const isEmpty = visibleRows.length === 0;
  // Row-click drill-in. `selectedRow` doubles as the sheet's `open` signal —
  // null = closed, a row = open. Mirrors CMP-013's RequestDetailSheet.
  const [selectedRow, setSelectedRow] = useState<ConversationRow | null>(null);

  // Deep-link support: `?open=cnv_xxx` opens that conversation on mount.
  // Used by the Requests page to navigate here with a specific row pre-opened.
  // Closing the modal strips the param so the URL reflects state.
  //
  // The ref tracks the last openId we acted on. Without it, the close path
  // hits a reopen-loop: setSelectedRow(null) and setSearchParams() commit on
  // different renders, so for one frame selectedRow is null but openId still
  // points at the row — the effect would re-open the modal the user just
  // dismissed. Gating on lastProcessedOpenId makes the effect URL-driven
  // only, not state-driven.
  const [searchParams, setSearchParams] = useSearchParams();
  const openId = searchParams.get('open');
  const [prevOpenId, setPrevOpenId] = useState<string | null>(null);
  if (openId !== prevOpenId) {
    setPrevOpenId(openId);
    if (openId) {
      const match = CONVERSATION_ROWS.find((r) => r.conversationId === openId);
      if (match) setSelectedRow(match);
    }
  }

  return (
    <>
    <div className="mt-2 flex flex-col gap-4">
      {/* Recent conversations — section header on the page background,
          mirroring Requests' "Recent requests". The search + filter set
          live here as page-level section controls, so they always render
          (a query that returns zero results never hides them). isEmpty
          governs only the Card interior below. */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="font-sans text-xl/7 font-medium text-neutral-900 m-0">Recent conversations</h3>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <SearchInput placeholder="Search by id, prompt, user, key…" ariaLabel="Search conversations" surface="background" className="flex-1 min-w-0 shrink" />
          <Select value={keyId} onValueChange={setKeyId}>
            <SelectTrigger
              size="sm"
              aria-label="Key"
              className="border-border bg-card text-foreground font-normal"
            >
              <SelectValue placeholder="Key" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All keys</SelectItem>
              <SelectItem value="prod-web">prod-web</SelectItem>
              <SelectItem value="prod-agent">prod-agent</SelectItem>
              <SelectItem value="test-key">test-key</SelectItem>
            </SelectContent>
          </Select>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger
              size="sm"
              aria-label="Model"
              className="border-border bg-card text-foreground font-normal"
            >
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All models</SelectItem>
              <SelectItem value="claude-opus-4-7">Claude Opus 4.7</SelectItem>
              <SelectItem value="claude-sonnet-4-5">Claude Sonnet 4.5</SelectItem>
              <SelectItem value="claude-haiku-4-5">Claude Haiku 4.5</SelectItem>
              <SelectItem value="gpt-5">GPT-5</SelectItem>
              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
              <SelectItem value="gpt-4o-mini">GPT-4o-mini</SelectItem>
              <SelectItem value="gemini-3-pro">Gemini 3 Pro</SelectItem>
              <SelectItem value="gemini-3-flash">Gemini 3 Flash</SelectItem>
              <SelectItem value="gemini-3-flash-lite">Gemini 3 Flash Lite</SelectItem>
              <SelectItem value="llama-3-3-70b">Llama 3.3 70B</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card density="flush">

      {isEmpty ? (
        <TableEmptyState
          title="No conversations"
          body="Multi-turn conversations grouped by key and model will appear here as your workspace routes traffic."
        />
      ) : (
        <>
      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[24%] whitespace-nowrap">Conversation</TableHead>
            <TableHead className="w-[10%] whitespace-nowrap">Key</TableHead>
            <TableHead className="w-[5%] whitespace-nowrap">Models</TableHead>
            <TableHead className="w-[5%] text-right whitespace-nowrap">Turns</TableHead>
            <TableHead className="w-[5%] text-right whitespace-nowrap">Reqs</TableHead>
            <TableHead className="w-[9%] text-right whitespace-nowrap">Tokens in</TableHead>
            <TableHead className="w-[9%] text-right whitespace-nowrap">Tokens out</TableHead>
            <TableHead className="w-[8%] text-right whitespace-nowrap">Cost</TableHead>
            <TableHead className="w-[11%] text-right whitespace-nowrap">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleRows.map((row) => {
            return (
              <TableRow
                key={row.conversationId}
                onClick={() => setSelectedRow(row)}
                className="cursor-pointer transition-colors duration-150 ease-out motion-reduce:transition-none hover-fine:bg-neutral-50"
              >
                <TableCell className="whitespace-nowrap max-w-0">
                  <RowActionButton
                    layout="stack"
                    onClick={() => setSelectedRow(row)}
                    aria-label={`Inspect conversation ${row.title}`}
                  >
                    <span
                      title={row.title}
                      className="font-sans text-sm text-neutral-900 truncate"
                    >
                      {row.title}
                    </span>
                    <span className="font-mono text-xs text-neutral-500">
                      {row.conversationId}
                    </span>
                  </RowActionButton>
                </TableCell>
                <TableCell className="whitespace-nowrap font-mono text-sm">
                  <span className="text-neutral-800">{row.initiator}</span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <div
                    role="img"
                    aria-label={`Models: ${row.vendors.map((v) => VENDOR_META[v].label).join(', ')}`}
                    className="flex items-center gap-1"
                  >
                    {row.vendors.map((v) => (
                      <VendorAvatar key={v} vendor={v} decorative />
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap font-mono text-sm tabular-nums text-neutral-800">
                  {row.turns}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap font-mono text-sm tabular-nums text-neutral-800">
                  {row.reqs}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap font-mono text-sm tabular-nums text-neutral-800">
                  {scaleTokenStr(row.inTokens, scale)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap font-mono text-sm tabular-nums text-neutral-800">
                  {scaleTokenStr(row.outTokens, scale)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap font-mono text-sm tabular-nums text-neutral-800">
                  {scaleCostStr(row.cost, scale)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap font-mono text-sm tabular-nums text-neutral-800">
                  <Timestamp date={row.updated} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <TablePaginationFooter
        total={paginationTotal}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />
        </>
      )}
    </Card>
    </div>
    <ConversationDetailDialog
      row={selectedRow}
      onOpenChange={(open) => {
        if (!open) setSelectedRow(null);
      }}
      onOpenChangeComplete={(open) => {
        // Strip ?open= AFTER the exit animation finishes — stripping it
        // inside onOpenChange triggers a router re-render mid-animation,
        // which reads as a flicker. Base UI fires this once the close
        // transition has fully completed.
        if (!open && searchParams.has('open')) {
          const next = new URLSearchParams(searchParams);
          next.delete('open');
          setSearchParams(next, { replace: true });
        }
      }}
    />
    </>
  );
}

/* ─── Conversation detail modal ────────────────────────────────────────────
 * Centered modal (Dialog primitive) opened from a row title click. Started
 * as a right-docked Sheet mirroring CMP-013's pattern, but the conversation
 * scope adds a cross-link selection between Messages and Request Trace
 * that needs both panels visible simultaneously — sheets can't go wide
 * enough without crowding the page chrome behind them. Modal solves the
 * width problem and matches the original CTO mockup.
 *
 * Layout (top → bottom, fixed except where noted):
 *   header        eyebrow + title + meta + close
 *   identity row  status + cnv_id + initiator + Copy/Audit actions
 *   prompt quote  the user's opening message
 *   KPI rail      5 tiles (Requests / Turns / Tokens / Cost / Duration)
 *   body grid     Messages | Request Trace, side-by-side at lg, stacked
 *                 below — each panel scrolls internally
 *   footer        cross-link affordance copy + initiator/key/started meta
 *
 * Cross-link state (`activeRequestId`) is shared by both panels: clicking a
 * message bubble highlights the paired trace event and vice versa. State
 * persists if the user happens to be on a narrow viewport where the
 * panels stack — they can scroll between them without losing selection.
 * ────────────────────────────────────────────────────────────────────── */

function ConversationDetailDialog({
  row,
  onOpenChange,
  onOpenChangeComplete,
}: {
  row: ConversationRow | null;
  onOpenChange: (open: boolean) => void;
  onOpenChangeComplete: (open: boolean) => void;
}) {
  // Hold the last non-null row so the body stays rendered during the
  // close animation. Without this, the modal briefly renders empty chrome
  // between selectedRow → null and the unmount, which reads as a flicker.
  const [stickyRow, setStickyRow] = useState<ConversationRow | null>(row);
  const [prevRow, setPrevRow] = useState<ConversationRow | null>(row);
  if (row !== prevRow) {
    setPrevRow(row);
    if (row) setStickyRow(row);
  }
  return (
    <Dialog
      open={!!row}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={onOpenChangeComplete}
    >
      <DialogScrollContent
        // 900px — wide enough for the two-column body to breathe at
        // typical desktop viewports, narrow enough that the dimmed page
        // behind reads as context. The shared scroll-shell primitive
        // provides max-h-[90vh] / flex-col / overflow-hidden; the inner
        // panels scroll independently inside the body.
        className="sm:max-w-[860px] max-h-[calc(90vh-96px)] [@media(max-height:800px)]:max-h-[90vh]"
      >
        {stickyRow ? <ConversationDetailBody row={stickyRow} /> : null}
      </DialogScrollContent>
    </Dialog>
  );
}

function ConversationDetailBody({ row }: { row: ConversationRow }) {
  const navigate = useNavigate();
  // Cross-link selection state — clicking a message bubble or trace step
  // sets the active requestId; both panels paint the matching item with
  // the selection treatment (blue ring on the bubble, blue left-bar +
  // blue wash on the trace row). Click again to clear.
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  // Track which panel originated the selection so we only scroll the
  // counterpart panel into view (clicking a message in the Messages panel
  // shouldn't scroll the Messages panel itself — it was already where the
  // user clicked). `null` after a deselect or external mount.
  const [selectionSource, setSelectionSource] = useState<'messages' | 'trace' | null>(null);
  const selectFromMessages = (id: string | null) => {
    setActiveRequestId(id);
    setSelectionSource(id ? 'messages' : null);
  };
  const selectFromTrace = (id: string | null) => {
    setActiveRequestId(id);
    setSelectionSource(id ? 'trace' : null);
  };

  return (
    <>
      {/* Top section — header + identity row + prompt quote. Fixed (does
          not scroll); the body grid below carries the scrollable panels.
          `pr-12` lives on the title block only so it clears the absolute
          DialogClose X; the identity row + quote run flush to the modal's
          right padding so action buttons align with the KPI rail edge. */}
      <DialogScrollHeader>
        <DialogTitleBlock titleAriaLabel={`Conversation ${row.title}`}>
          Messages + request trace
        </DialogTitleBlock>

        {/* Identity row — cnv_id + initiator. Copy ID lives in the
            footer-right; the header carries identity only. */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-sm font-medium text-neutral-900">
            {row.conversationId}
          </span>
          <span className="font-mono text-xs text-neutral-500">
            {row.initiator}
          </span>
        </div>
      </DialogScrollHeader>

      {/* Persistent KPI rail — 5 tiles at the conversation scope. Same
          pattern as CMP-013's request rail but with one extra tile
          (Duration) and a `grid-cols-5` track. */}
      <DialogScrollSummary>
        <ConversationKpiRail row={row} />
      </DialogScrollSummary>

      {/* Body — two-panel grid where each panel scrolls independently.
          Override the body's default `overflow-y-auto` to `overflow-hidden`
          and add `flex flex-col` so the inner grid manages overflow per
          panel rather than scrolling the whole body. */}
      <DialogScrollBody className="pt-6 overflow-hidden flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0 overflow-hidden">
          <ConversationMessagesPanel
            activeRequestId={activeRequestId}
            selectionSource={selectionSource}
            onSelect={selectFromMessages}
          />
          <RequestTracePanel
            activeRequestId={activeRequestId}
            selectionSource={selectionSource}
            onSelect={selectFromTrace}
          />
        </div>
      </DialogScrollBody>

      {/* Footer — conversation provenance LEFT, Copy ID action RIGHT.
          Override the footer's default `justify-end` since this footer
          carries informational copy on the leading edge as well. */}
      <DialogScrollFooter className="justify-between flex-wrap">
        <span className="font-mono text-xs text-neutral-500">
          Key <span className="text-neutral-800">{row.initiator}</span>{' '}
          · started <Timestamp date={row.updated} className="text-neutral-800" />
        </span>
        <div className="flex items-center gap-2">
          <CopyButton
            mode="label"
            size="sm"
            text="Copy ID"
            value={row.conversationId}
            label="conversation ID"
          />
          <Button
            type="button"
            size="sm"
            onClick={() => {
              const linkedRequest = REQUEST_ROWS_RECENT.find(
                (r) => r.conversation === row.conversationId && !!r.requestId,
              );
              if (linkedRequest?.requestId) {
                navigate(`/requests?open=${linkedRequest.requestId}`);
              } else {
                navigate('/requests');
              }
            }}
          >
            View Request
            <ExternalLink data-icon="inline-end" aria-hidden />
          </Button>
        </div>
      </DialogScrollFooter>
    </>
  );
}

function ConversationKpiRail({ row }: { row: ConversationRow }) {
  return (
    <KpiRailShell columns={6}>
      <ConversationKpiTile label="Requests" value={String(row.reqs)} />
      <ConversationKpiTile label="Turns" value={String(row.turns)} />
      <ConversationKpiTile label="Tokens In" value={row.inTokens} />
      <ConversationKpiTile label="Tokens Out" value={row.outTokens} />
      <ConversationKpiTile label="Cost" value={row.cost} />
      <ConversationKpiTile label="Duration" value={row.duration} />
    </KpiRailShell>
  );
}

function ConversationKpiTile({ label, value }: { label: string; value: string }) {
  // Mono at text-lg (18px) — below the sans-hero threshold (≥24px), so
  // these stay in the data-tier mono register per the five-voice taxonomy.
  // Label uses plain sans (Title Case, not Eyebrow caps): KPI tiles inside
  // a modal sit closer to body metadata than to page eyebrows, so the
  // uppercase-tracked register from <Eyebrow> overweighted the label.
  // Padding `p-4` matches the 16px card-padding rule (CompactKpi / ModelKpiTile).
  return (
    <div className="flex flex-col gap-1 p-4">
      <Eyebrow>{label}</Eyebrow>
      <span className="font-mono text-lg font-medium tabular-nums tracking-snug text-neutral-900">
        {value}
      </span>
    </div>
  );
}

/* ─── Messages tab ───────────────────────────────────────────────────────
 * Conversation-scope dialogue (richer than CMP-013's per-request thread
 * since a conversation spans multiple turns + tool calls). Renders via the
 * shared <MessageBlock> primitive so the bubble treatment stays one source
 * of truth across the request and conversation sheets. */

/**
 * Conversation thread — eight turns mirroring the agent flow. RequestIds
 * on assistant + tool messages match SAMPLE_TRACE entries, enabling the
 * cross-link selection (click message → highlights paired trace event).
 * USER turn is human input — no gateway request, no requestId.
 */
const CONVERSATION_MESSAGES: {
  role: MessageRole;
  tool?: string;
  body: React.ReactNode;
  time: string;
  requestId?: string;
}[] = [
  {
    role: 'user',
    time: '14:24:11',
    body: 'Why was the SEPA transfer 0x4a3e flagged for review yesterday? Pull the audit reason and route the dispute to the right operator.',
  },
  {
    role: 'assistant',
    time: '14:24:14',
    requestId: 'req_92cf2a',
    body: 'Let me look that up. Calling lookup_transfer…',
  },
  {
    role: 'tool',
    tool: 'lookup_transfer',
    time: '14:24:38',
    requestId: 'req_70a48a',
    body: (
      <ToolResultCode>
        {'{"id":"0x4a3e","amount":"€2,840.12","status":"flagged","reason":"PEP_MATCH","recipient":"acc_88e2f"}'}
      </ToolResultCode>
    ),
  },
  {
    role: 'assistant',
    time: '14:24:54',
    requestId: 'req_2e1f9d',
    body: 'PEP_MATCH on the recipient — let me screen acc_88e2f against the watchlist.',
  },
  {
    role: 'tool',
    tool: 'pep_screen',
    time: '14:25:11',
    requestId: 'req_3a5fb8',
    body: (
      <ToolResultCode>
        {'{"hit":"ofac_pep","entity":"sanctioned_official_IT","confidence":0.96}'}
      </ToolResultCode>
    ),
  },
  {
    role: 'assistant',
    time: '14:25:34',
    requestId: 'req_7f0218',
    body: 'Confirmed — recipient acc_88e2f matches a PEP on the OFAC list (confidence 0.96). I’ll route this to compliance-eu-tier2 and write an audit entry.',
  },
  {
    role: 'tool',
    tool: 'route_dispute',
    time: '14:26:14',
    requestId: 'req_da46b8',
    body: (
      <ToolResultCode>
        {'{"queue":"compliance-eu-tier2","ticket":"DSP-2026-0418","sla":"4h"}'}
      </ToolResultCode>
    ),
  },
  {
    role: 'tool',
    tool: 'audit_write',
    time: '14:27:31',
    requestId: 'req_4c91a2',
    body: (
      <ToolResultCode>
        {'{"event_id":"e_7a3f9c2b","anchor":"0x7f3a91c4","block":18472911}'}
      </ToolResultCode>
    ),
  },
];

// Static derivation — computed once at module load from the fixed message list.
const ASSISTANT_TURN_COUNT = CONVERSATION_MESSAGES.filter((m) => m.role === 'assistant').length;

function ConversationMessagesPanel({
  activeRequestId,
  selectionSource,
  onSelect,
}: {
  activeRequestId: string | null;
  selectionSource: 'messages' | 'trace' | null;
  onSelect: (requestId: string | null) => void;
}) {
  // Count = assistant turns. Tool/user/system don't count as "turns" — a
  // turn is a model response. Mirrors the convention used in the table
  // (row.turns is assistant-only). Computed at module level (static data).

  // Auto-scroll the matching message into view ONLY when the selection
  // came from the counterpart (trace) panel. Selections that originated
  // here are already in view — scrolling would jump away from where the
  // user just clicked. `block: 'nearest'` is a no-op if the message is
  // already visible, so this is safe to fire on every cross-panel change.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!activeRequestId || !scrollRef.current) return;
    if (selectionSource === 'messages') return;
    const el = scrollRef.current.querySelector(
      `[data-request-id="${activeRequestId}"]`,
    );
    el?.scrollIntoView({ block: 'nearest', behavior: REDUCE_MOTION ? 'auto' : 'smooth' });
  }, [activeRequestId, selectionSource]);

  return (
    <div className="flex flex-col rounded-md border border-border overflow-hidden h-full min-h-0">
      {/* Header strip — bordered tinted band carrying the eyebrow + count.
          Matches the framing pattern in the trace panel. `flex-none` so
          it doesn't shrink when the body scrolls. */}
      <div className="flex-none flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <span id="conv-messages-eyebrow" className="font-sans text-sm font-medium text-neutral-900">Messages</span>
        <span className="font-mono text-xs text-neutral-500 tabular-nums">
          {ASSISTANT_TURN_COUNT} {ASSISTANT_TURN_COUNT === 1 ? 'turn' : 'turns'}
        </span>
      </div>
      <div
        ref={scrollRef}
        role="region"
        aria-labelledby="conv-messages-eyebrow"
        className="flex flex-col gap-4 p-4 overflow-y-auto overscroll-contain min-h-0 flex-1"
      >
        {CONVERSATION_MESSAGES.map((m, i) => {
          const selected = !!m.requestId && m.requestId === activeRequestId;
          // Bubble tone stays default regardless of trace status — warn
          // signals live in their narrowest carriers (the inline `pep`
          // badge inside the message body, the trace row's warnNote text,
          // and the slow-latency text). Tinting the whole bubble was an
          // artifact and overweighted the warn signal.
          return (
            <MessageBlock
              key={i}
              role={m.role}
              tool={m.tool}
              body={m.body}
              time={m.time}
              requestId={m.requestId}
              selected={selected}
              // Only assistant + tool turns participate in cross-link
              // selection — user input has no gateway request to pair with.
              onClick={
                m.requestId
                  ? () => onSelect(selected ? null : m.requestId ?? null)
                  : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
}

/* ─── Request Trace tab ──────────────────────────────────────────────────
 * Vertical timeline of model calls for the conversation. Each event = one
 * row in the gateway log (one call to /v1/messages). Status dot signals
 * pass/warn/fail; vendor avatar + model name identify the route; the
 * label below describes the agent step ("plan", "tool: lookup_transfer",
 * "reason"). Click a step (eventually) to drill into CMP-013's request
 * sheet for that specific call. */

type TraceStatus = 'success' | 'warn' | 'danger';

type TraceEvent = {
  id: string;
  vendor: Vendor;
  model: string;
  label: string;
  /** "tool" = wrench glyph in the timeline node; everything else gets the
   *  reasoning glyph (Activity wave). Drives icon choice only — status is
   *  separate. */
  kind: 'tool' | 'reason';
  status: TraceStatus;
  warnNote?: string;
  /** Tokens in (e.g. "1.2k"). Mono tabular when rendered. */
  inTokens: string;
  /** Tokens out (e.g. "184"). */
  outTokens: string;
  /** Wall-clock latency for this single request (e.g. "1240ms"). Slow rows
   *  (>1000ms) paint warning-tinted in the data line per the codified
   *  slow-row indicator policy. */
  latency: string;
  /** Per-request cost (e.g. "$0.0012"). Sums across the trace ≈ row.cost. */
  cost: string;
  time: string;
  requestId: string;
};

const SAMPLE_TRACE: TraceEvent[] = [
  { id: 't1', vendor: 'anthropic', model: 'claude-sonnet-4.8', label: 'plan',                  kind: 'reason', status: 'success', inTokens: '1.2k', outTokens: '184', latency: '1240ms', cost: '$0.0142', time: 'May 12, 14:24:14', requestId: 'req_92cf2a' },
  { id: 't2', vendor: 'openai',    model: 'gpt-5.1',           label: 'tool: lookup_transfer', kind: 'tool',   status: 'success', inTokens: '0.4k', outTokens: '92',  latency: '620ms',  cost: '$0.0008', time: 'May 12, 14:24:38', requestId: 'req_70a48a' },
  { id: 't3', vendor: 'anthropic', model: 'claude-sonnet-4.8', label: 'reason',                kind: 'reason', status: 'success', inTokens: '2.1k', outTokens: '312', latency: '1480ms', cost: '$0.0241', time: 'May 12, 14:24:54', requestId: 'req_2e1f9d' },
  { id: 't4', vendor: 'openai',    model: 'gpt-5.1',           label: 'tool: pep_screen',      kind: 'tool',   status: 'warn',    warnNote: 'pep', inTokens: '0.5k', outTokens: '142', latency: '940ms',  cost: '$0.0014', time: 'May 12, 14:25:11', requestId: 'req_3a5fb8' },
  { id: 't5', vendor: 'openai',    model: 'gpt-5.1',           label: 'reason',                kind: 'reason', status: 'success', inTokens: '1.8k', outTokens: '276', latency: '1160ms', cost: '$0.0184', time: 'May 12, 14:25:34', requestId: 'req_7f0218' },
  { id: 't6', vendor: 'anthropic', model: 'claude-sonnet-4.8', label: 'tool: route_dispute',   kind: 'tool',   status: 'success', inTokens: '2.4k', outTokens: '380', latency: '3120ms', cost: '$0.0260', time: 'May 12, 14:26:14', requestId: 'req_da46b8' },
  { id: 't7', vendor: 'openai',    model: 'gpt-5.1',           label: 'tool: audit_write',     kind: 'tool',   status: 'success', inTokens: '0.7k', outTokens: '104', latency: '720ms',  cost: '$0.0060', time: 'May 12, 14:27:31', requestId: 'req_4c91a2' },
];

// Status → border color for the timeline node ring. Mirrors StatusDot's
// fill convention (-600 saturated mid).
const TRACE_NODE_BORDER: Record<TraceStatus, string> = {
  success: 'border-success-600',
  warn:    'border-warning-600',
  danger:  'border-destructive',
};
const TRACE_NODE_ICON_TONE: Record<TraceStatus, string> = {
  success: 'text-success-700',
  warn:    'text-warning-700',
  danger:  'text-destructive',
};

function RequestTracePanel({
  activeRequestId,
  selectionSource,
  onSelect,
}: {
  activeRequestId: string | null;
  selectionSource: 'messages' | 'trace' | null;
  onSelect: (requestId: string | null) => void;
}) {
  // Auto-scroll the matching trace event into view ONLY when the selection
  // came from the counterpart (messages) panel. Selections that originated
  // here are already in view. Pairing the two effects gives one-way
  // counterpart scrolling: clicking a message reveals its trace event;
  // clicking a trace event reveals its message bubble — but neither
  // scrolls its own panel.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!activeRequestId || !scrollRef.current) return;
    if (selectionSource === 'trace') return;
    const el = scrollRef.current.querySelector(
      `[data-request-id="${activeRequestId}"]`,
    );
    el?.scrollIntoView({ block: 'nearest', behavior: REDUCE_MOTION ? 'auto' : 'smooth' });
  }, [activeRequestId, selectionSource]);

  return (
    <div className="flex flex-col rounded-md border border-border overflow-hidden h-full min-h-0">
      {/* Header strip — bordered tinted band carrying the eyebrow + count.
          Matches the framing pattern in the messages panel. `flex-none`
          so it doesn't shrink when the body scrolls. */}
      <div className="flex-none flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <span id="conv-trace-eyebrow" className="font-sans text-sm font-medium text-neutral-900">Request Trace</span>
        <span className="font-mono text-xs text-neutral-500 tabular-nums">
          {SAMPLE_TRACE.length} requests
        </span>
      </div>

      {/* Timeline track — vertical hairline running down the column at
          x=28px (16px panel padding + 12px = node centerline). The track
          sits BEHIND the nodes; each node's white interior visually masks
          the line where it crosses, giving the "beads on a string" effect.
          `inset-y-6` shortens the line so it terminates inside the first
          and last node centers, accounting for the row's vertical padding.
          The wrapper carries the scroll so long traces flow without
          forcing the modal itself to scroll. */}
      <div
        ref={scrollRef}
        role="region"
        aria-labelledby="conv-trace-eyebrow"
        className="px-4 py-2 overflow-y-auto overscroll-contain min-h-0 flex-1"
      >
        {/* Per-row track segments are rendered inside TraceItem (see
            below) so geometry stays correct regardless of row content
            height. First/last items truncate the segment at the node
            center; the node's bg-white masks the line where it crosses. */}
        <div className="flex flex-col">
          {SAMPLE_TRACE.map((event, i) => (
            <TraceItem
              key={event.id}
              event={event}
              selected={event.requestId === activeRequestId}
              isFirst={i === 0}
              isLast={i === SAMPLE_TRACE.length - 1}
              onSelect={() =>
                onSelect(
                  event.requestId === activeRequestId ? null : event.requestId,
                )
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TraceItem({
  event,
  selected,
  isFirst,
  isLast,
  onSelect,
}: {
  event: TraceEvent;
  selected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect: () => void;
}) {
  // Row bg signals selection only. Warn is conveyed via the warnNote
  // text + the pep badge inside the matching message — tinting the row
  // overweighted the signal and read as a stuck-state artifact.
  const rowBg = selected ? 'bg-blue-50' : '';

  // Slow-latency tone: codified policy — >1000ms paints warning-700 in the
  // data line; >2000ms also flips the timeline node ring to warning-600
  // so the slow step pre-scans at the timeline level (matches CTO's
  // orange-node treatment for the route_dispute that took 3120ms).
  const latencyMs = parseInt(event.latency, 10);
  const isSlowLatency = latencyMs > 1000;
  const isVerySlow = latencyMs > 2000;
  const latencyTone = isSlowLatency ? 'text-warning-700' : 'text-neutral-500';

  // Node ring color — slow takes priority over status-success. Warn/danger
  // status still wins (a slow warn step would still read as warn-amber on
  // both the node AND the row bg).
  const nodeBorder =
    event.status === 'success' && isVerySlow
      ? 'border-warning-600'
      : TRACE_NODE_BORDER[event.status];
  const nodeIconTone =
    event.status === 'success' && isVerySlow
      ? 'text-warning-700'
      : TRACE_NODE_ICON_TONE[event.status];

  // Step-type icon inside the node. Tool calls get Wrench (literal); every
  // other step gets Activity (the EKG wave — implies reasoning/processing).
  // Wrench's mass sits low; nudge -0.5px to optically center it inside
  // the node circle. Activity is balanced and stays at 0.
  const StepIcon = event.kind === 'tool' ? Wrench : Activity;
  const stepIconTransform = event.kind === 'tool' ? '-translate-y-[0.5px]' : '';

  // Per-row track segment — rendered behind the node circle (DOM order
  // puts node after, so its bg-white masks the line where it crosses).
  // Node center sits at y = py-3 (12px) + node-half (12px) = 24px = top-6.
  // First row: line starts at node center (top-6) and runs to row
  // bottom. Last row: line starts at row top and runs h-6 (24px) to
  // node center. Middle rows: line spans the full row height. Within
  // TraceItem padding box, node center is at x=24 (pl-3 + node-half);
  // for a 2px line to center on x=24, left = 23px.
  const trackSegment = isFirst
    ? 'top-6 bottom-0'
    : isLast
      ? 'top-0 h-6'
      : 'inset-y-0';

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      data-request-id={event.requestId}
      className={`relative flex gap-3 py-3 px-3 -mx-2 text-left outline-none transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
        selected ? '' : 'hover-fine:bg-neutral-50'
      } ${rowBg} before:absolute before:left-0 before:inset-y-1 before:w-[2px] before:bg-blue-500 before:rounded-full before:transition-opacity before:duration-150 motion-reduce:before:transition-none ${
        selected ? 'before:opacity-100' : 'before:opacity-0'
      }`}
    >
      {/* Per-row track segment — sits at x=23 inside TraceItem coords so
          the 2px line centers on the node centerline at x=24. Comes
          first in DOM so the node renders above and its bg-white masks
          the line where it crosses. */}
      <span
        aria-hidden
        className={`absolute left-[23px] w-[2px] bg-neutral-200 ${trackSegment}`}
      />
      {/* Timeline node — circular, status-bordered, white-filled so the
          track behind it reads as broken at the bead. Icon inside marks
          the step type. */}
      <div
        className={`relative size-6 shrink-0 rounded-full border-2 bg-card flex items-center justify-center ${nodeBorder}`}
      >
        <StepIcon
          className={`size-3 ${nodeIconTone} ${stepIconTransform}`}
          strokeWidth={2}
          aria-hidden
        />
      </div>

      {/* Content column — two stacked rows by default; warn events get a
          third row below for the warn badge (left-aligned). Model
          deprioritized — repeated across every step's row added scan
          noise without information.
          (1) step label + time as the primary identifier,
          (2) tokens · latency · cost + requestId on the right,
          (3) warn badge (only when status === 'warn'). */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        {/* Row 1 — primary. Agent step label takes the slot the model
            previously occupied; timestamp right-aligned. */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-sm text-neutral-900 truncate flex-1">
            {event.label}
          </span>
          <span className="font-mono text-xs text-neutral-500 tabular-nums shrink-0">
            {event.time}
          </span>
        </div>

        {/* Row 2 — per-step economics + requestId. `tokens-in → tokens-out ·
            latency · cost` on the left; requestId right-aligned. Latency
            turns warning-700 on slow rows. Cost renders at neutral-800 per the
            three-tier table ink policy. Separators drop to neutral-300 so they
            read as hairline scaffolding, not data. */}
        <div className="flex items-center gap-2 min-w-0 text-neutral-500">
          <span className="inline-flex items-center gap-1 font-mono text-xs tabular-nums">
            {event.inTokens}
            <ArrowRight className="size-3" strokeWidth={1.75} aria-hidden />
            {event.outTokens}
          </span>
          <span className="text-neutral-300" aria-hidden>·</span>
          <span className={`font-mono text-xs tabular-nums ${latencyTone}`}>
            {event.latency}
          </span>
          <span className="text-neutral-300" aria-hidden>·</span>
          <span className="font-mono text-xs tabular-nums text-neutral-800 flex-1">
            {event.cost}
          </span>
          <span className="font-mono text-xs text-neutral-500 shrink-0">
            {event.requestId}
          </span>
        </div>

        {/* Row 3 — warn badge, only when this step carries a policy warn.
            Left-aligned on its own row so the signal is unmissable without
            crowding the primary identifier line. */}
        {event.status === 'warn' && event.warnNote ? (
          <div className="flex items-center">
            <Badge variant="warning" aria-label={`Warning: ${event.warnNote} match`}>
              <TriangleAlert className="size-3" strokeWidth={1.75} aria-hidden />
              {event.warnNote}
            </Badge>
          </div>
        ) : null}
      </div>
    </button>
  );
}
