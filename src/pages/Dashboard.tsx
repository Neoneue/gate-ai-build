import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  BookOpen,
  ChevronRight,
  CircleCheck,
  Gauge,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CompactKpi, CompactSpark } from '@/components/ui/compact-kpi';
import { KpiRail as KpiRailShell } from '@/components/ui/kpi-rail';
import { PageTitle } from '@/components/ui/page-title';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VendorAvatar, VENDOR_META } from '@/components/icons/vendor-meta';
import {
  type EventRow,
  ACTION_BADGE,
  TYPE_META,
  EVENT_ROWS,
  formatEventTime,
  ThreatEventDetailDialog,
} from '@/pages/Security';
import { TOTAL_7D_BASE_DOLLARS, distributeSeries } from '@/pages/Activity';
import {
  EVENT_ROWS as AUDIT_EVENT_ROWS,
  type EventRow as AuditEventRow,
  KIND_BADGE_VARIANT as AUDIT_KIND_BADGE_VARIANT,
  fmtTime as fmtAuditTime,
  truncateHex,
} from '@/pages/AuditTrail';
import { AuditRecordDialog } from '@/pages/AuditRecordDialog';
import { CONVERSATION_ROWS, KEY_SUFFIX as CONVERSATION_KEY_SUFFIX, type ConversationRow } from '@/pages/Conversations';
import { formatCurrency, formatNumber, formatTimestamp } from '@/lib/formatters';
import { DashboardChrome } from '@/layouts/DashboardChrome';

// KPI-rail values derived from the canonical security + spend + audit seeds
// so the numbers reconcile with Security, Activity, and Audit Trail instead
// of drifting as separate constants. "Threats detected" is the count of
// security events (every event represents a blocked / flagged / redacted
// threat); "Events anchored" is the count of audit-trail entries (every
// entry is DE-anchored by the gateway pipeline). Deltas stay hand-authored
// — there's no historical mock data to derive trend from.
const THREATS_DETECTED_COUNT = EVENT_ROWS.length;
const ANCHORED_EVENTS_COUNT = AUDIT_EVENT_ROWS.length;
// "Monthly spend" reuses Activity's canonical 7d baseline scaled to 30d
// (Activity's internal scale for the '30d' preset is 4.2 — see the SCALE
// map at line ~110 of Activity.tsx). Keeping the multiplier inline
// reconciles the Overview tile with Activity for the same window. When
// real spend data lands, the constant evaporates.
const MONTHLY_SPEND_DOLLARS = TOTAL_7D_BASE_DOLLARS * 4.2;
// "Daily spend" is the 7d baseline averaged across days — single source of
// truth shared with Activity.
const DAILY_SPEND_DOLLARS = TOTAL_7D_BASE_DOLLARS / 7;

// Sparkline series for the KPI rail. All four derive from the tile's
// canonical total via Activity's distributeSeries() — the same generator the
// Spend over time chart uses. Bucket sums equal the KPI value by
// construction (single source of truth: total → spark → tile). Seeds are
// distinct primes so adjacent tiles don't share a shape. distributeSeries
// has a built-in upward trend so positive-delta tiles read visually
// consistent. When real historical mock data lands, swap for actual
// bucketed history and derive deltas from last-vs-prior period.
const DAILY_SPEND_SPARK = distributeSeries(DAILY_SPEND_DOLLARS * 7, 7, 101);
const MONTH_SPEND_SPARK = distributeSeries(MONTHLY_SPEND_DOLLARS, 30, 103);
const ANCHORED_EVENTS_SPARK = distributeSeries(ANCHORED_EVENTS_COUNT, 9, 109);
const THREATS_DETECTED_SPARK = distributeSeries(THREATS_DETECTED_COUNT, 9, 107);

/* ─────────────────────────────────────────────────────────────────────────
 * CMP-012 — Composed · Dashboard
 *
 * Production-shell surface composed entirely from primitives that already
 * exist elsewhere in the system:
 *   - KPI rail   →  CompactKpi pattern from CMP-008 (Stat cards)
 *   - Bar chart  →  ComposedChart pattern from CMP-009.1 (Spend trend)
 *   - Audit feed →  table treatment from CMP-010.1 (Data table)
 *
 * The shell itself (sidebar + screen-head) is bespoke to this surface — the
 * 64px icon sidebar isn't part of the system's reusable primitives, so it
 * stays local to this artboard.
 *
 * Color palette: only ink-* / blue-* / semantic vars from index.css.
 * Status pill colors (red/amber for 4xx / 5xx codes) use the destructive
 * and warning semantic vars at low alpha — same approach as CMP-003.
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
            <KpiRail />
            <QuickActionsRow />
            <RecentConversationsCard />
            <RecentSecurityEventsCard />
            <RecentAnchoredEventsCard />
          </DashboardChrome>
  );
}

/* ─── Page header (title + actions) ──────────────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex flex-col gap-2 max-w-1/2">
      {/* h2 (not h1) — the artboard's ArtboardHeader already emits the
          outer h1; this is the in-surface page title and reads as h2
          in the document outline so RecentRequestsCard h3 doesn't
          create a level skip. */}
      <PageTitle>Overview</PageTitle>
      <p className="font-sans text-neutral-500 text-base tracking-tight text-pretty m-0">
        Cost controls, inline security, and a tamper-evident audit trail. Anchored to Constellation's Digital Evidence layer.
      </p>
    </div>
  );
}

/* ─── KPI rail (3-up sparkline cards) ────────────────────────────────────── */

function KpiRail() {
  const navigate = useNavigate();
  return (
    <KpiRailShell columns={4}>
      {/* Tile order leads with cost-control (Olivia's #1 anxiety per
       *  Gate-AI-personas.md). Daily comes before Monthly so the actionable
       *  number sits left of the broader picture; Threats detected anchors
       *  the security side; Events anchored carries the H1 differentiator
       *  from Narrative & Positioning (DE-anchored audit) on the landing
       *  surface — closes the audit §1.1 gap that dropping it briefly
       *  opened. Avg Latency stays out (abstract for Olivia). */}
      <CompactKpi
        flat
        title="Daily spend"
        value={formatCurrency(DAILY_SPEND_DOLLARS)}
        delta="+6.2%"
        deltaNote="vs yesterday"
        deltaSize="md"
        onClick={() => navigate('/activity?range=24h')}
        ariaLabel="Daily spend — open Activity for the last 24 hours"
        spark={
          <CompactSpark
            colorVar="var(--color-success-600)"
            data={DAILY_SPEND_SPARK}
          />
        }
      />
      {/* Monthly spend: anchored to Activity's 30d window (no separate
       *  range picker on Overview). Delta tracks Activity's 30d delta so
       *  the two surfaces agree. */}
      <CompactKpi
        flat
        title="Monthly spend"
        value={formatCurrency(MONTHLY_SPEND_DOLLARS)}
        delta="+18.4%"
        deltaNote="vs last month"
        deltaSize="md"
        onClick={() => navigate('/activity?range=30d')}
        ariaLabel="Monthly spend — open Activity for the last 30 days"
        spark={
          <CompactSpark
            colorVar="var(--color-success-600)"
            data={MONTH_SPEND_SPARK}
          />
        }
      />
      <CompactKpi
        flat
        title="Threats detected"
        value={formatNumber(THREATS_DETECTED_COUNT)}
        delta="+12.4%"
        deltaNote="vs last week"
        deltaSize="md"
        onClick={() => navigate('/security')}
        ariaLabel="Threats detected — open the Security event log"
        spark={
          <CompactSpark
            colorVar="var(--color-chart-5)"
            data={THREATS_DETECTED_SPARK}
          />
        }
      />
      {/* Events anchored: count of audit-trail entries (every entry is
       *  DE-anchored by the gateway pipeline). Carries the H1 differentiator
       *  from Narrative & Positioning on the landing surface; click goes to
       *  the Audit Trail page so Grace + Devon can verify any record. */}
      <CompactKpi
        flat
        title="Events anchored"
        value={formatNumber(ANCHORED_EVENTS_COUNT)}
        delta="+8.7%"
        deltaNote="vs last week"
        deltaSize="md"
        onClick={() => navigate('/audit-trail')}
        ariaLabel="Events anchored — open the Audit Trail"
        spark={
          <CompactSpark
            colorVar="var(--color-chart-1)"
            data={ANCHORED_EVENTS_SPARK}
          />
        }
      />
    </KpiRailShell>
  );
}

/* ─── Recent Conversations (preview table) ───────────────────────────────
 *
 * Olivia's working surface promoted to Overview. Conversations are how she
 * thinks about agent work ("the Q2 report agent, 8 turns, $0.43"), so a
 * preview here turns the page from four numbers into a glanceable feed of
 * what her agents have been doing. Row click deep-links to
 * /conversations?open=<id> — the existing modal trigger on that page.
 * ───────────────────────────────────────────────────────────────────────── */

// Top 8 conversations descending by `updated`. Conversations source is
// canonical — single source of truth for "what's been happening" across
// Overview and the Conversations page itself. Preview tables on Overview
// are capped at 8 rows so the page reads as a glance, not a full log.
const RECENT_CONVERSATIONS: ConversationRow[] = [...CONVERSATION_ROWS]
  .sort((a, b) => b.updated.getTime() - a.updated.getTime())
  .slice(0, 8);

function RecentConversationsCard() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col w-full rounded-md overflow-hidden bg-card shadow-(--shadow-border)">
      <div className="flex items-center justify-between py-3 px-4">
        <h3 className="font-sans text-base/5 font-medium tracking-snug text-neutral-900 m-0">
          Recent conversations
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-neutral-500 hover:text-neutral-900 -mr-2"
          onClick={() => navigate('/conversations')}
        >
          View all
          <ChevronRight data-icon="inline-end" aria-hidden />
        </Button>
      </div>

      {/* Column widths mirror the Conversations page exactly so the two
       *  surfaces read as the same table at different scales. Auto layout
       *  (no table-fixed) — matches the source page's flex behavior. */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[24%] whitespace-nowrap">Conversation</TableHead>
            <TableHead className="w-[10%] whitespace-nowrap pr-2">Key</TableHead>
            <TableHead className="w-[5%]  whitespace-nowrap">Models</TableHead>
            <TableHead className="w-[5%]  text-right whitespace-nowrap">Turns</TableHead>
            <TableHead className="w-[5%]  text-right whitespace-nowrap">Reqs</TableHead>
            <TableHead className="w-[9%]  text-right whitespace-nowrap">Tokens in</TableHead>
            <TableHead className="w-[9%]  text-right whitespace-nowrap">Tokens out</TableHead>
            <TableHead className="w-[8%]  text-right whitespace-nowrap">Cost</TableHead>
            <TableHead className="w-[11%] text-right whitespace-nowrap">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {RECENT_CONVERSATIONS.map((row) => {
            const openRow = () => navigate(`/conversations?open=${row.conversationId}`);
            return (
              <TableRow
                key={row.conversationId}
                className="cursor-pointer hover-fine:bg-neutral-50 transition-colors duration-150 ease-out motion-reduce:transition-none"
                onClick={openRow}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openRow();
                  }
                }}
              >
                <TableCell className="whitespace-nowrap">
                  <span className="flex flex-col min-w-0">
                    <span
                      title={row.title}
                      className="font-sans text-sm text-neutral-900 truncate"
                    >
                      {row.title}
                    </span>
                    <span className="font-mono text-xs text-neutral-500">
                      {row.conversationId}
                    </span>
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap font-mono text-sm pr-2">
                  <span className="text-neutral-800">{row.initiator}</span>
                  {CONVERSATION_KEY_SUFFIX[row.initiator] ? (
                    <span className="text-neutral-600">
                      {' '}
                      ({CONVERSATION_KEY_SUFFIX[row.initiator]})
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {row.vendors[0] ? (
                    <div
                      role="img"
                      aria-label={`Model: ${VENDOR_META[row.vendors[0]].label}`}
                      className="flex items-center gap-1"
                    >
                      <VendorAvatar vendor={row.vendors[0]} decorative />
                    </div>
                  ) : null}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap font-mono text-sm tabular-nums text-neutral-800">
                  {row.turns}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap font-mono text-sm tabular-nums text-neutral-800">
                  {row.reqs}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap font-mono text-sm tabular-nums text-neutral-800">
                  {row.inTokens}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap font-mono text-sm tabular-nums text-neutral-800">
                  {row.outTokens}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap font-mono text-sm tabular-nums text-neutral-800">
                  {row.cost}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap font-mono text-sm tabular-nums text-neutral-800">
                  {formatTimestamp(row.updated)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/* ─── Recent Security Events (preview table) ─────────────────────────────── */

// Top 8 blocked events descending by time; fill with flagged if fewer than
// 8 blocked exist. EVENT_ROWS time format is 'YYYY-MM-DD HH:MM:SS' —
// lexicographic sort matches chronological order. Preview cap of 8 matches
// the rest of Overview's tables.
const RECENT_SECURITY_EVENTS: EventRow[] = (() => {
  const sorted = [...EVENT_ROWS].sort((a, b) => b.time.localeCompare(a.time));
  const blocked = sorted.filter((r) => r.action === 'blocked');
  if (blocked.length >= 8) return blocked.slice(0, 8);
  const flagged = sorted.filter((r) => r.action === 'flagged');
  return [...blocked, ...flagged].slice(0, 8);
})();

function RecentSecurityEventsCard() {
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState<EventRow | null>(null);

  return (
    <>
      <div className="flex flex-col w-full rounded-md overflow-hidden bg-card shadow-(--shadow-border)">
        <div className="flex items-center justify-between py-3 px-4">
          <h3 className="font-sans text-base/5 font-medium tracking-snug text-neutral-900 m-0">
            Recent security events
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-neutral-500 hover:text-neutral-900 -mr-2"
            onClick={() => navigate('/security')}
          >
            View all
            <ChevronRight data-icon="inline-end" aria-hidden />
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="whitespace-nowrap">Time</TableHead>
              <TableHead className="whitespace-nowrap">Type</TableHead>
              <TableHead className="whitespace-nowrap">Conversation</TableHead>
              <TableHead className="whitespace-nowrap">Key</TableHead>
              <TableHead className="whitespace-nowrap">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {RECENT_SECURITY_EVENTS.map((row, i) => {
              const typeMeta = TYPE_META[row.type];
              const actionMeta = ACTION_BADGE[row.action];
              const TypeIcon = typeMeta.Icon;
              return (
                <TableRow
                  key={`${row.time}-${i}`}
                  className="cursor-pointer hover-fine:bg-neutral-50 transition-colors duration-150 ease-out motion-reduce:transition-none"
                  onClick={() => setSelectedRow(row)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedRow(row);
                    }
                  }}
                >
                  <TableCell className="whitespace-nowrap">
                    <Tooltip>
                      <TooltipTrigger
                        render={(props) => (
                          <span
                            {...props}
                            className="font-mono text-sm tabular-nums text-neutral-800"
                          >
                            {formatEventTime(row.time)}
                          </span>
                        )}
                      />
                      <TooltipContent>{row.relative}</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <TypeIcon
                        className="size-4 shrink-0"
                        style={{ color: typeMeta.color }}
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      <span className="font-sans text-sm text-neutral-800">{typeMeta.label}</span>
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap max-w-[200px]">
                    <span
                      title={row.conversationId}
                      className="font-mono text-sm tabular-nums text-neutral-800 truncate block max-w-full"
                    >
                      {row.conversationId}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono">
                    {(() => {
                      const parenIdx = row.key.indexOf(' (');
                      if (parenIdx === -1) return <span className="text-neutral-800">{row.key}</span>;
                      return (
                        <>
                          <span className="text-neutral-800">{row.key.slice(0, parenIdx)}</span>
                          <span className="text-neutral-600">{row.key.slice(parenIdx)}</span>
                        </>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant={actionMeta.variant}>{actionMeta.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <ThreatEventDetailDialog
        selection={selectedRow}
        onOpenChange={(open) => {
          if (!open) setSelectedRow(null);
        }}
      />
    </>
  );
}

/* ─── Recent Anchored Events (preview table) ───────────────────────────────
 *
 * The third feed on Overview, alongside Recent Conversations and Recent
 * Security Events. Surfaces the H1 differentiator (DE-anchored audit) on the
 * landing surface so Grace's "tamper-evident audit trail" claim has a live
 * ledger backing it. Rows mirror the AuditTrail page's columns; click opens
 * the AuditRecordDialog directly. View all → /audit-trail.
 * ───────────────────────────────────────────────────────────────────────── */

const RECENT_ANCHORED_EVENTS: AuditEventRow[] = [...AUDIT_EVENT_ROWS]
  .sort((a, b) => b.at.getTime() - a.at.getTime())
  .slice(0, 8);

function RecentAnchoredEventsCard() {
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState<AuditEventRow | null>(null);

  return (
    <>
      <div className="flex flex-col w-full rounded-md overflow-hidden bg-card shadow-(--shadow-border)">
        <div className="flex items-center justify-between py-3 px-4">
          <h3 className="font-sans text-base/5 font-medium tracking-snug text-neutral-900 m-0">
            Recent anchored events
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-neutral-500 hover:text-neutral-900 -mr-2"
            onClick={() => navigate('/audit-trail')}
          >
            View all
            <ChevronRight data-icon="inline-end" aria-hidden />
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="whitespace-nowrap">Time</TableHead>
              <TableHead className="whitespace-nowrap">Event ID</TableHead>
              <TableHead className="whitespace-nowrap">Event type</TableHead>
              <TableHead className="whitespace-nowrap">Description</TableHead>
              <TableHead className="whitespace-nowrap">Member</TableHead>
              <TableHead className="whitespace-nowrap">Anchor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {RECENT_ANCHORED_EVENTS.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover-fine:bg-neutral-50 transition-colors duration-150 ease-out motion-reduce:transition-none"
                onClick={() => setSelectedRow(row)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedRow(row);
                  }
                }}
              >
                <TableCell className="whitespace-nowrap font-mono text-sm tabular-nums text-neutral-800">
                  {fmtAuditTime(row.at)}
                </TableCell>
                <TableCell className="whitespace-nowrap font-mono text-sm text-neutral-800">
                  {truncateHex(row.eventId)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge variant={AUDIT_KIND_BADGE_VARIANT[row.kind]}>{row.kind}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap max-w-[360px] text-sm text-neutral-800">
                  <span className="truncate block max-w-full" title={row.description}>
                    {row.description}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap font-sans text-sm text-neutral-800">
                  {row.member}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="inline-flex items-center gap-2">
                    <CircleCheck aria-hidden className="size-4 text-success-600" strokeWidth={1.75} />
                    <span className="sr-only">Verified anchor</span>
                    <span className="font-mono text-sm text-neutral-800">{truncateHex(row.anchor, 4, 4)}</span>
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <AuditRecordDialog
        row={selectedRow}
        open={!!selectedRow}
        onOpenChange={(open) => { if (!open) setSelectedRow(null); }}
      />
    </>
  );
}

/* ─── Quick Actions card ─────────────────────────────────────────────────
 * Single bordered card with a "Quick actions" header and 4 task items
 * inside, divided by hairline `before:` pseudo-elements (same pattern
 * as the consolidated KPI rail). One unified section instead of 4
 * floating cards. */

type QuickAction = {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  subtitle: string;
  /** Internal route for the action. When set, clicking the tile navigates
   *  via react-router; tiles without `href` stay as visual placeholders
   *  until their workflow lands. */
  href?: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  { icon: Gauge,      title: 'Set a spend limit',      subtitle: 'Cap runaway costs',          href: '/guardrails?create=1' },
  { icon: Shield,     title: 'Review Security Events', subtitle: '3 events in the last hour' },
  { icon: RefreshCw,  title: 'Rotate API Key',         subtitle: 'Last rotated 6 days ago' },
  { icon: BookOpen,   title: 'Read Integration Guide', subtitle: 'SDK quickstart' },
];

function QuickActionsRow() {
  const navigate = useNavigate();
  // Inset divider — hairline doesn't reach top/bottom edges; reads
  // lighter than a `divide-x`. Matches the KPI rail treatment. `z-10` on
  // the pseudo-element keeps the line above the button's `bg-card`
  // (the button creates a stacking context via its `relative`).
  const dividerCls =
    'relative before:absolute before:left-0 before:inset-y-4 before:w-px before:bg-border before:z-10 before:pointer-events-none';
  const onAction = (action: QuickAction) =>
    action.href ? () => navigate(action.href!) : undefined;
  return (
    <Card density="flush">
      <div className="flex items-center py-3 px-4 border-b border-border">
        <h3 className="font-sans text-base/5 font-medium tracking-snug text-neutral-900 m-0">
          Quick actions
        </h3>
      </div>
      <div className="grid grid-cols-4">
        <QuickActionItem {...QUICK_ACTIONS[0]} onClick={onAction(QUICK_ACTIONS[0])} />
        <div className={dividerCls}>
          <QuickActionItem {...QUICK_ACTIONS[1]} onClick={onAction(QUICK_ACTIONS[1])} />
        </div>
        <div className={dividerCls}>
          <QuickActionItem {...QUICK_ACTIONS[2]} onClick={onAction(QUICK_ACTIONS[2])} />
        </div>
        <div className={dividerCls}>
          <QuickActionItem {...QUICK_ACTIONS[3]} onClick={onAction(QUICK_ACTIONS[3])} />
        </div>
      </div>
    </Card>
  );
}

function QuickActionItem({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: QuickAction & { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full flex items-center gap-3 p-4 text-left outline-none touch-manipulation transition-[background-color,transform,box-shadow] duration-150 ease-out focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset active:translate-y-px motion-reduce:transition-none motion-reduce:active:translate-y-0 bg-card hover:bg-neutral-100"
    >
      <span className="shrink-0 size-8 inline-flex items-center justify-center rounded-xs bg-muted text-neutral-700">
        <Icon className="size-4" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="font-sans text-sm font-medium text-neutral-900 truncate">
          {title}
        </span>
        <span className="font-sans text-xs text-neutral-500 truncate">
          {subtitle}
        </span>
      </div>
      <ChevronRight className="shrink-0 size-4 text-neutral-500" strokeWidth={1.75} aria-hidden />
    </button>
  );
}
