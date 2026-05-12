import { useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Activity, ArrowRight, Download, Search, TriangleAlert, Wrench } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CompactKpi, CompactSpark } from '@/components/ui/compact-kpi';
import { Input } from '@/components/ui/input';
import { KpiRail as KpiRailShell } from '@/components/ui/kpi-rail';
import { MessageBlock, type MessageRole } from '@/components/ui/message-block';
import { RowActionButton } from '@/components/ui/row-action-button';
import { TablePaginationFooter } from '@/components/ui/table-pagination-footer';
import { ToolResultCode } from '@/components/ui/tool-result-code';
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

export function Conversations() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{ sidebarExpanded: boolean; toggleSidebar: () => void }>();

  return (
    <DashboardChrome
            breadcrumbCurrent="Conversations"
            activeNavId="conversations"
            sidebarExpanded={sidebarExpanded}
            onToggleSidebar={toggleSidebar}
            onNavigate={(path: string) => navigate(path)}
          >
            <PageHeader />
            <KpiRail />
            <ConversationsTableSection />
          </DashboardChrome>
  );
}

/* ─── Page header — eyebrow + title + description + actions ──────────────── */

function PageHeader() {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex flex-col gap-2 max-w-1/2">
        {/* h2 — see CMP012 PageHeader note. */}
        <PageTitle>Conversations</PageTitle>
        <p className="font-sans text-ink-500 text-base tracking-tight text-pretty m-0">
          A conversation is a chain of requests that share session context — agent runs, multi-turn chats, tool-calling loops. Click any row to see its message thread.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="default">
          <Download data-icon="inline-start" aria-hidden />
          Export
        </Button>
      </div>
    </div>
  );
}

/* ─── KPI Rail (4 cards — Spend / 24h omitted per request) ────────────── */

function KpiRail() {
  return (
    <KpiRailShell columns={4}>
      <CompactKpi
        flat
        title="Active Now"
        value="247"
        delta="+12"
        spark={
          <CompactSpark
            colorVar="var(--color-ink-500)"
            data={[238, 252, 230, 244, 256, 234, 248, 240, 247]}
          />
        }
      />
      <CompactKpi
        flat
        title="Conversations"
        value="18,210"
        delta="+6.4%"
        spark={
          <CompactSpark
            colorVar="var(--color-chart-7)"
            data={[1740, 2120, 1680, 2040, 2380, 1820, 2240, 1960, 2230]}
          />
        }
      />
      <CompactKpi
        flat
        title="Avg Turns"
        value="14.2"
        delta="+1.8"
        spark={
          <CompactSpark
            colorVar="var(--color-chart-3)"
            data={[13.4, 14.8, 13.1, 14.2, 14.9, 13.6, 14.5, 13.9, 14.2]}
          />
        }
      />
      <CompactKpi
        flat
        title="Avg Cost / Conv"
        value="$0.082"
        delta="-3.1%"
        deltaInverted
        spark={
          <CompactSpark
            colorVar="var(--color-chart-1)"
            data={[0.087, 0.082, 0.090, 0.083, 0.085, 0.080, 0.084, 0.079, 0.082]}
            endDot
          />
        }
      />
    </KpiRailShell>
  );
}

/* ─── Conversations table section (toolbar + table + pagination) ─────── */

type ConversationStatus = 'active' | 'completed' | 'failed';

const STATUS_BADGE: Record<
  ConversationStatus,
  { variant: 'success' | 'destructive' | 'info'; dot: 'success' | 'danger' | 'info'; label: string }
> = {
  active:    { variant: 'success',     dot: 'success', label: 'active' },
  completed: { variant: 'info',        dot: 'info',    label: 'completed' },
  failed:    { variant: 'destructive', dot: 'danger',  label: 'failed' },
};

type ConversationRow = {
  title: string;
  conversationId: string;
  initiator: string;
  turns: number;
  reqs: number;
  vendors: Vendor[];
  tokens: string;
  cost: string;
  status: ConversationStatus;
  updated: string;
  /** Conversation duration ("3m 53s") — surfaced in the detail sheet KPI rail. */
  duration: string;
};

const CONVERSATION_ROWS: ConversationRow[] = [
  { title: 'Why was the SEPA transfer 0x4a3e flagged for review yesterday?', conversationId: 'cnv_aurora_42',   initiator: 'service-eu-payments',  turns:  3, reqs:  7, vendors: ['anthropic'],                      tokens: '4,051',   cost: '$0.1042', status: 'active',    updated: '14:28:04', duration: '3m 53s'  },
  { title: 'Draft a 4-step onboarding sequence for new fin clients',         conversationId: 'cnv_skylark_18', initiator: 'kira.tan@acme.io',     turns:  6, reqs: 11, vendors: ['anthropic', 'openai'],            tokens: '8,114',   cost: '$0.4218', status: 'active',    updated: '14:22:11', duration: '5m 12s'  },
  { title: 'Classify the attached document and click KYC if needed',         conversationId: 'cnv_meridian_07',initiator: 'service-kyc-bot',      turns:  3, reqs:  4, vendors: ['google'],                         tokens: '2,104',   cost: '$0.3104', status: 'active',    updated: '14:15:22', duration: '0m 47s'  },
  { title: 'Investigate the variance in YOY revenue between segments',       conversationId: 'cnv_orion_70',   initiator: 'mateus.silva@ebux.com',turns: 18, reqs: 38, vendors: ['anthropic', 'openai', 'mistral'], tokens: '52,810',  cost: '$0.5841', status: 'completed', updated: '14:02:48', duration: '14m 06s' },
  { title: 'Draft a postmortem for incident INC-2026-04-1107',               conversationId: 'cnv_polaris_55', initiator: 'service.incident-bot', turns:  4, reqs:  7, vendors: ['anthropic'],                      tokens: '3,402',   cost: '$0.1102', status: 'active',    updated: '13:48:33', duration: '2m 18s'  },
  { title: 'Customer requesting a refund on order ORD-89412',                conversationId: 'cnv_lyra_92',    initiator: 'service-support-bot',  turns: 14, reqs: 32, vendors: ['openai'],                         tokens: '12,608',  cost: '$0.0812', status: 'failed',    updated: '13:36:10', duration: '8m 41s'  },
  { title: 'Summarize Q1 2026 earnings call for top 10 holdings',            conversationId: 'cnv_vela_21',    initiator: 'pulja.shah@acme.io',   turns: 12, reqs: 26, vendors: ['anthropic'],                      tokens: '102,041', cost: '$0.1402', status: 'completed', updated: '13:18:55', duration: '11m 27s' },
];

// Synthetic total — held at module scope so pagination math reconciles
// with the KPI rail's "Conversations: 18,210" figure.
const CONVERSATIONS_TOTAL = 18210;

function ConversationsTableSection() {
  const [scope, setScope] = useState('all');
  const [user, setUser] = useState('all');
  const [keyId, setKeyId] = useState('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState('25');
  // Row-click drill-in. `selectedRow` doubles as the sheet's `open` signal —
  // null = closed, a row = open. Mirrors CMP-013's RequestDetailSheet.
  const [selectedRow, setSelectedRow] = useState<ConversationRow | null>(null);

  return (
    <>
    <Card density="flush">
      {/* Toolbar */}
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
            placeholder="Search by id, prompt, user, key…"
            aria-label="Search conversations"
            className="pl-8 placeholder:text-ink-500"
          />
        </div>
        <Select value={scope} onValueChange={setScope}>
          <SelectTrigger
            size="sm"
            aria-label="Conversation scope"
            className="border-ink-200 bg-white text-ink-900 font-normal"
          >
            <SelectValue placeholder="Scope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All conversations</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={user} onValueChange={setUser}>
          <SelectTrigger
            size="sm"
            aria-label="User"
            className="border-ink-200 bg-white text-ink-900 font-normal"
          >
            <SelectValue placeholder="User" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            <SelectItem value="service-eu-payments">service-eu-payments</SelectItem>
            <SelectItem value="kira.tan@acme.io">kira.tan@acme.io</SelectItem>
            <SelectItem value="mateus.silva@ebux.com">mateus.silva@ebux.com</SelectItem>
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
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="whitespace-nowrap">Conversation</TableHead>
            <TableHead className="whitespace-nowrap">Initiator</TableHead>
            <TableHead className="text-right whitespace-nowrap">Turns</TableHead>
            <TableHead className="text-right whitespace-nowrap">Reqs</TableHead>
            <TableHead className="whitespace-nowrap">Models</TableHead>
            <TableHead className="text-right whitespace-nowrap">Tokens</TableHead>
            <TableHead className="text-right whitespace-nowrap">Cost</TableHead>
            <TableHead className="whitespace-nowrap">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {CONVERSATION_ROWS.map((row) => {
            return (
              <TableRow
                key={row.conversationId}
                onClick={() => setSelectedRow(row)}
                className="cursor-pointer transition-colors duration-150 ease-out motion-reduce:transition-none hover:bg-ink-50"
              >
                <TableCell className="max-w-[360px]">
                  <RowActionButton
                    layout="stack"
                    onClick={() => setSelectedRow(row)}
                    aria-label={`Inspect conversation ${row.title}`}
                  >
                    <span
                      title={row.title}
                      className="font-sans text-sm text-ink-900 -tracking-[0.14px] truncate"
                    >
                      {row.title}
                    </span>
                    <span className="font-mono text-xs text-ink-500 -tracking-[0.01em]">
                      {row.conversationId}
                    </span>
                  </RowActionButton>
                </TableCell>
                <TableCell className="max-w-[220px] font-mono text-sm text-ink-800 -tracking-[0.14px]">
                  <span className="block truncate" title={row.initiator}>
                    {row.initiator}
                  </span>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap font-mono text-sm tabular-nums text-ink-800">
                  {row.turns}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap font-mono text-sm tabular-nums text-ink-800">
                  {row.reqs}
                </TableCell>
                <TableCell>
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
                <TableCell className="text-right whitespace-nowrap font-mono text-sm tabular-nums text-ink-800">
                  {row.tokens}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap font-mono text-sm tabular-nums text-ink-800">
                  {row.cost}
                </TableCell>
                <TableCell className="whitespace-nowrap font-mono text-sm tabular-nums text-ink-500 -tracking-[0.14px]">
                  {row.updated}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <TablePaginationFooter
        total={CONVERSATIONS_TOTAL}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />
    </Card>
    <ConversationDetailDialog
      row={selectedRow}
      onOpenChange={(open) => {
        if (!open) setSelectedRow(null);
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
}: {
  row: ConversationRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!row} onOpenChange={onOpenChange}>
      <DialogScrollContent
        // sm:max-w-5xl ≈ 1024px — wide enough for the two-column body to
        // breathe at typical desktop viewports, narrow enough that the
        // dimmed page behind reads as context. The shared scroll-shell
        // primitive provides max-h-[90vh] / flex-col / overflow-hidden;
        // the inner panels scroll independently inside the body.
        className="sm:max-w-5xl"
      >
        {row ? <ConversationDetailBody row={row} /> : null}
      </DialogScrollContent>
    </Dialog>
  );
}

function ConversationDetailBody({ row }: { row: ConversationRow }) {
  const badge = STATUS_BADGE[row.status];
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

        {/* Identity row — status + cnv_id + initiator on the left, action
            buttons (Copy ID / Audit anchor) on the right. Sits as a sibling
            of the title block; the parent header's gap-3 provides rhythm.
            Wraps on narrow viewports so the actions drop below the
            identity instead of colliding with the close button. */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant={badge.variant}>
            {badge.label}
          </Badge>
          <span className="font-mono text-sm font-medium text-ink-900 -tracking-[0.2px]">
            {row.conversationId}
          </span>
          <span className="font-mono text-xs text-ink-500 -tracking-[0.01em]">
            {row.initiator}
          </span>
          <CopyButton
            mode="label"
            size="sm"
            text="Copy ID"
            value={row.conversationId}
            label="conversation ID"
            className="ml-auto"
          />
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
      <DialogScrollBody className="overflow-hidden flex flex-col">
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

      {/* Footer — cross-link affordance hint LEFT, conversation
          provenance RIGHT. Both ambient at ink-400 so they read as
          modal chrome, not heading-weight content. Override the
          footer's default `justify-end` since this footer carries
          informational copy on both edges, not just trailing actions. */}
      <DialogScrollFooter className="justify-between flex-wrap">
        <span className="font-mono text-xs text-ink-500 -tracking-[0.01em]">
          Click a message or trace step — they’re linked.
        </span>
        <span className="font-mono text-xs text-ink-500 -tracking-[0.01em]">
          Key <span className="text-ink-800">prod-web</span>{' '}
          · started <span className="text-ink-800">{row.updated}</span>
        </span>
      </DialogScrollFooter>
    </>
  );
}

function ConversationKpiRail({ row }: { row: ConversationRow }) {
  return (
    <KpiRailShell columns={5}>
      <ConversationKpiTile label="Requests" value={String(row.reqs)} />
      <ConversationKpiTile label="Turns" value={String(row.turns)} />
      <ConversationKpiTile label="Tokens" value={row.tokens} />
      <ConversationKpiTile label="Cost" value={row.cost} />
      <ConversationKpiTile label="Duration" value={row.duration} />
    </KpiRailShell>
  );
}

function ConversationKpiTile({ label, value }: { label: string; value: string }) {
  // Mono at text-lg (18px) — below the sans-hero threshold (≥24px), so
  // these stay in the data-tier mono register per the five-voice taxonomy.
  // Padding `p-4` matches the 16px card-padding rule (CompactKpi / ModelKpiTile).
  return (
    <div className="flex flex-col gap-1 p-4">
      <Eyebrow>
        {label}
      </Eyebrow>
      <span className="font-mono text-lg font-medium tabular-nums -tracking-[0.5px] text-ink-900">
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
  // (row.turns is assistant-only).
  const turnCount = CONVERSATION_MESSAGES.filter((m) => m.role === 'assistant').length;

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
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [activeRequestId, selectionSource]);

  return (
    <div className="flex flex-col rounded-sm border border-ink-200 overflow-hidden h-full min-h-0">
      {/* Header strip — bordered tinted band carrying the eyebrow + count.
          Matches the framing pattern in the trace panel. `flex-none` so
          it doesn't shrink when the body scrolls. */}
      <div className="flex-none flex items-center justify-between px-4 py-3 bg-ink-50 border-b border-ink-200">
        <Eyebrow id="conv-messages-eyebrow">
          Messages
        </Eyebrow>
        <span className="font-mono text-xs text-ink-500 tabular-nums -tracking-[0.01em]">
          {turnCount} {turnCount === 1 ? 'turn' : 'turns'}
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
  { id: 't1', vendor: 'anthropic', model: 'claude-sonnet-4.8', label: 'plan',                  kind: 'reason', status: 'success', inTokens: '1.2k', outTokens: '184', latency: '1240ms', cost: '$0.0142', time: '14:24:14', requestId: 'req_92cf2a' },
  { id: 't2', vendor: 'openai',    model: 'gpt-5.1',           label: 'tool: lookup_transfer', kind: 'tool',   status: 'success', inTokens: '0.4k', outTokens: '92',  latency: '620ms',  cost: '$0.0008', time: '14:24:38', requestId: 'req_70a48a' },
  { id: 't3', vendor: 'anthropic', model: 'claude-sonnet-4.8', label: 'reason',                kind: 'reason', status: 'success', inTokens: '2.1k', outTokens: '312', latency: '1480ms', cost: '$0.0241', time: '14:24:54', requestId: 'req_2e1f9d' },
  { id: 't4', vendor: 'openai',    model: 'gpt-5.1',           label: 'tool: pep_screen',      kind: 'tool',   status: 'warn',    warnNote: 'pep', inTokens: '0.5k', outTokens: '142', latency: '940ms',  cost: '$0.0014', time: '14:25:11', requestId: 'req_3a5fb8' },
  { id: 't5', vendor: 'openai',    model: 'gpt-5.1',           label: 'reason',                kind: 'reason', status: 'success', inTokens: '1.8k', outTokens: '276', latency: '1160ms', cost: '$0.0184', time: '14:25:34', requestId: 'req_7f0218' },
  { id: 't6', vendor: 'anthropic', model: 'claude-sonnet-4.8', label: 'tool: route_dispute',   kind: 'tool',   status: 'success', inTokens: '2.4k', outTokens: '380', latency: '3120ms', cost: '$0.0260', time: '14:26:14', requestId: 'req_da46b8' },
  { id: 't7', vendor: 'openai',    model: 'gpt-5.1',           label: 'tool: audit_write',     kind: 'tool',   status: 'success', inTokens: '0.7k', outTokens: '104', latency: '720ms',  cost: '$0.0060', time: '14:27:31', requestId: 'req_4c91a2' },
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
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [activeRequestId, selectionSource]);

  return (
    <div className="flex flex-col rounded-sm border border-ink-200 overflow-hidden h-full min-h-0">
      {/* Header strip — bordered tinted band carrying the eyebrow + count.
          Matches the framing pattern in the messages panel. `flex-none`
          so it doesn't shrink when the body scrolls. */}
      <div className="flex-none flex items-center justify-between px-4 py-3 bg-ink-50 border-b border-ink-200">
        <Eyebrow id="conv-trace-eyebrow">
          Request Trace
        </Eyebrow>
        <span className="font-mono text-xs text-ink-500 tabular-nums -tracking-[0.01em]">
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
  const latencyTone = isSlowLatency ? 'text-warning-700' : 'text-ink-500';

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
      className={`relative flex gap-3 py-3 px-3 -mx-2 text-left outline-none transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-ink-400 focus-visible:ring-inset ${
        selected ? '' : 'hover:bg-ink-50'
      } ${rowBg} before:absolute before:left-0 before:inset-y-1 before:w-0.5 before:bg-blue-500 before:rounded-full before:transition-opacity before:duration-150 motion-reduce:before:transition-none ${
        selected ? 'before:opacity-100' : 'before:opacity-0'
      }`}
    >
      {/* Per-row track segment — sits at x=23 inside TraceItem coords so
          the 2px line centers on the node centerline at x=24. Comes
          first in DOM so the node renders above and its bg-white masks
          the line where it crosses. */}
      <span
        aria-hidden
        className={`absolute left-[23px] w-0.5 bg-ink-200 ${trackSegment}`}
      />
      {/* Timeline node — circular, status-bordered, white-filled so the
          track behind it reads as broken at the bead. Icon inside marks
          the step type. */}
      <div
        className={`relative size-6 shrink-0 rounded-full border-2 bg-white flex items-center justify-center ${nodeBorder}`}
      >
        <StepIcon
          className={`size-3 ${nodeIconTone} ${stepIconTransform}`}
          strokeWidth={2}
          aria-hidden
        />
      </div>

      {/* Content column — three stacked rows: (1) vendor + model + time,
          (2) label + warn badge + requestId, (3) tokens · latency · cost. */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        {/* Row 1 — primary identity. Vendor avatar + model name on the left;
            timestamp right-aligned. */}
        <div className="flex items-center gap-2 min-w-0">
          <VendorAvatar vendor={event.vendor} />
          <span className="font-mono text-sm text-ink-900 -tracking-[0.2px] truncate flex-1">
            {event.model}
          </span>
          <span className="font-mono text-xs text-ink-500 tabular-nums -tracking-[0.01em] shrink-0">
            {event.time}
          </span>
        </div>

        {/* Row 2 — agent step label + optional warn badge + requestId. */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs text-ink-500 -tracking-[0.01em] truncate flex-1">
            {event.label}
          </span>
          {event.status === 'warn' && event.warnNote ? (
            <Badge variant="warning" aria-label={`Warning: ${event.warnNote} match`}>
              <TriangleAlert className="size-3" strokeWidth={1.75} aria-hidden />
              {event.warnNote}
            </Badge>
          ) : null}
          <span className="font-mono text-xs text-ink-500 -tracking-[0.01em] shrink-0">
            {event.requestId}
          </span>
        </div>

        {/* Row 3 — per-step economics. `tokens-in → tokens-out · latency ·
            cost`. Latency turns warning-700 on slow rows. Cost renders at
            ink-800 per the three-tier table ink policy — same body-data
            weight as the other carriers in the row. */}
        <div className="flex items-center gap-2 min-w-0 text-ink-500">
          <span className="inline-flex items-center gap-1 font-mono text-xs tabular-nums -tracking-[0.01em]">
            {event.inTokens}
            <ArrowRight className="size-3" strokeWidth={1.75} aria-hidden />
            {event.outTokens}
          </span>
          <span className="text-ink-400" aria-hidden>·</span>
          <span className={`font-mono text-xs tabular-nums -tracking-[0.01em] ${latencyTone}`}>
            {event.latency}
          </span>
          <span className="text-ink-400" aria-hidden>·</span>
          <span className="font-mono text-xs tabular-nums -tracking-[0.01em] text-ink-800">
            {event.cost}
          </span>
        </div>
      </div>
    </button>
  );
}
