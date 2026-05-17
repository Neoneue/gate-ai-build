import { useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { CircleCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Eyebrow } from '@/components/ui/eyebrow';
import { HeroNumeric } from '@/components/ui/hero-numeric';
import { SearchInput } from '@/components/ui/search-input';
import { KpiRail } from '@/components/ui/kpi-rail';
import { PageTitle } from '@/components/ui/page-title';
import { SegmentedPill } from '@/components/ui/segmented-pill';
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
import { TableEmptyState } from '@/components/ui/table-empty-state';
import { TablePaginationFooter } from '@/components/ui/table-pagination-footer';
import { DashboardChrome } from '@/layouts/DashboardChrome';
import { AuditRecordDialog } from './AuditRecordDialog';

/* ─────────────────────────────────────────────────────────────────────────
 * AuditTrail page (route: /audit-trail, sidebar: "Audit Trail")
 *
 * Title + subtitle + range selector + KPI rail + event log table with
 * toolbar + pagination. Range selector wired to state but doesn't yet
 * filter the static mock data — when the real event stream lands, the KPI
 * tiles and event log will scope to the active range.
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

/** Anchor "now" to a fixed mock date so the relative times ("2d ago") and
 *  range filters don't go stale as wall-clock time passes. Mirror of the
 *  technique Activity / Conversations use for range scaling. */
const NOW = new Date(2026, 4, 16, 16, 0, 0); // 2026-05-16 16:00:00

const HOURS_PER_PRESET: Record<Exclude<PresetRange, 'all'>, number> = {
  '24h': 24,
  '7d':  24 * 7,
  '30d': 24 * 30,
};

function isWithinRange(at: Date, range: Range, customRange: CustomRange | null): boolean {
  if (range === 'all') return true;
  if (range === 'custom') {
    if (!customRange) return true;
    return at >= customRange.from && at <= customRange.to;
  }
  const cutoff = new Date(NOW.getTime() - HOURS_PER_PRESET[range] * 3600 * 1000);
  return at >= cutoff;
}

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const pad2 = (n: number) => String(n).padStart(2, '0');

export function fmtTime(d: Date): string {
  return `${MONTH_LABELS[d.getMonth()]} ${d.getDate()}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

export function fmtRelative(at: Date): string {
  const seconds = Math.max(0, Math.floor((NOW.getTime() - at.getTime()) / 1000));
  if (seconds < 60)      return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)      return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)        return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7)          return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5)         return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/** Truncates a hex string or UUID for display in a table cell.
 *  Uses three ASCII dots matching the glyph in the original seed data. */
export function truncateHex(s: string, start = 6, end = 6): string {
  if (s.length <= start + end + 3) return s;
  return `${s.slice(0, start)}...${s.slice(-end)}`;
}

export function AuditTrail() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  // Defaults to `all` on load per project rule (every page's time-range
  // selector should land on All).
  const [range, setRange] = useState<Range>('all');
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);

  // Range filter is the load-bearing pipe — both KPIs and EventLog read from
  // these range-scoped rows. EventLog further narrows by kind + query.
  const rangeRows = useMemo(
    () => EVENT_ROWS.filter((r) => isWithinRange(r.at, range, customRange)),
    [range, customRange],
  );

  return (
    <DashboardChrome
      activeNavId="audit-trail"
      sidebarExpanded={sidebarExpanded}
      onToggleSidebar={toggleSidebar}
      onNavigate={(path: string) => navigate(path)}
    >
      <PageHeader
        range={range}
        customRange={customRange}
        onRangeChange={(r) => { setRange(r); setCustomRange(null); }}
        onCustomRangeChange={(r) => {
          if (r) { setCustomRange(r); setRange('custom'); }
          else   { setCustomRange(null); setRange('all'); }
        }}
      />
      <KpiRailSection rows={rangeRows} />
      <EventLog rows={rangeRows} />
    </DashboardChrome>
  );
}

function PageHeader({
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
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-2 max-w-1/2">
        <PageTitle>Audit trail</PageTitle>
        <p className="font-sans text-muted-foreground text-base tracking-tight m-0">
          Every request, policy decision, and limit check is logged here. Each entry is hashed and anchored to Constellation's Digital Evidence layer, independently verifiable and tamper-evident by construction.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedPill
          options={RANGE_OPTIONS}
          value={range === 'custom' ? '' : range}
          onValueChange={(v) => onRangeChange(v as PresetRange)}
        />
        <DateRangePicker
          value={customRange}
          onChange={onCustomRangeChange}
          size="default"
        />
      </div>
    </div>
  );
}

/* ─── KPI rail ──────────────────────────────────────────────────────── */

function KpiRailSection({ rows }: { rows: EventRow[] }) {
  const eventsLogged = rows.length;
  const distinctAnchors = new Set(rows.map((r) => r.anchor)).size;
  const mostRecent = rows.reduce<Date | null>(
    (latest, r) => (!latest || r.at > latest ? r.at : latest),
    null,
  );
  // Every seeded row is verified in this mock — when real data lands, derive
  // from row.verified booleans. Empty-range state falls back to "—" so we
  // don't pretend to assert a rate over zero events.
  const verifiedRate = eventsLogged === 0 ? null : 100.0;

  return (
    <KpiRail columns={4}>
      <KpiTile title="Events logged" value={eventsLogged.toLocaleString()} />
      <KpiTile title="Anchors" value={distinctAnchors.toLocaleString()} />
      <KpiTile
        title="Verified rate"
        value={verifiedRate === null ? '—' : verifiedRate.toFixed(1)}
        valueSuffix={verifiedRate === null ? undefined : '%'}
      />
      <KpiTile title="Last anchor" value={mostRecent ? fmtRelative(mostRecent) : '—'} />
    </KpiRail>
  );
}

function KpiTile({
  title,
  value,
  valueSuffix,
}: {
  title: string;
  value: string;
  valueSuffix?: string;
}) {
  return (
    <div className="flex flex-col gap-2 bg-card p-4">
      <Eyebrow as="div">{title}</Eyebrow>
      <div className="flex items-baseline gap-2">
        <HeroNumeric>{value}</HeroNumeric>
        {valueSuffix ? (
          <span className="font-sans text-sm font-medium text-muted-foreground tracking-tight">
            {valueSuffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* ─── Event log table ───────────────────────────────────────────────── */

export type EventKind = 'AUDIT' | 'REQUEST' | 'POLICY' | 'EVENT' | 'LIMITS';

export type EventRow = {
  id: string;
  at: Date;
  eventId: string;
  kind: EventKind;
  description: string;
  member: string;
  anchor: string;
};

// 18 seed rows. `eventId` and `anchor` are now full strings; table cells
// render truncated via truncateHex(). Full values appear in the drill-in
// modal (AuditRecordDialog). Member names map to the canonical workspace
// roster (Team.tsx MEMBER_ROWS): Chad Ponticas owns key lifecycle, Jordan
// Lee runs dev request batches, Mateus Silva carries admin / inspect
// actions, Kira Tan is the newly-added member.
const EVENT_ROWS: EventRow[] = [
  {
    id: 'e-01',
    at: new Date(2026, 4, 14, 13, 42, 21),
    eventId: 'e_cc8ae185-a267-4b1c-ae7b-a618713b5cac',
    kind: 'AUDIT',
    description: 'API key "design-agent" created',
    member: 'Chad Ponticas',
    anchor: '9fa072b3c41d85e2f7a630d194bc58e07f2c9a1d3e46b05821f7893d04c62e23',
  },
  {
    id: 'e-02',
    at: new Date(2026, 4, 14, 9, 44, 58),
    eventId: 'e_ac2525f1-3b74-4d92-bf1e-9c03d78afe59',
    kind: 'REQUEST',
    description: 'Request error: Passthrough tokens require explicit X-Gate-Upstream-Url header. Set it to "https://api.anthropic.com" for Anthropic API keys, or to your custom upstream URL.',
    member: 'Chad Ponticas',
    anchor: 'ab40eb92c5f17d034a9b82e1c06d3f45b8712e9a4c0d56f873b2190a687f0b42',
  },
  {
    id: 'e-03',
    at: new Date(2026, 4, 14, 9, 43, 13),
    eventId: 'e_5ea003d8-c92f-4a17-b836-e501d4cbfc55',
    kind: 'REQUEST',
    description: 'Request error: Passthrough tokens require explicit X-Gate-Upstream-Url header. Set it to "https://api.anthropic.com" for Anthropic API keys, or to your custom upstream URL.',
    member: 'Chad Ponticas',
    anchor: 'a96fc5e214b873d0f591c4a82e3070b6d19f25c8a7e43d961b20847531d967a',
  },
  {
    id: 'e-04',
    at: new Date(2026, 4, 13, 7, 49, 6),
    eventId: 'e_5ec325a9-7b31-4e08-9d2f-c8413852a5f7',
    kind: 'REQUEST',
    description: 'Streaming proxy request completed: POST /v1/messages?beta=true',
    member: 'Jordan Lee',
    anchor: 'e5c4f2a10d738b2965f401c7e8920a3b56d14f8c7291e30b4d85762a01116544',
  },
  {
    id: 'e-05',
    at: new Date(2026, 4, 13, 7, 49, 2),
    eventId: 'e_f390ab62-1d4e-4c83-a075-b219e53b7abc2',
    kind: 'REQUEST',
    description: 'Streaming proxy request completed: POST /v1/messages?beta=true',
    member: 'Jordan Lee',
    anchor: 'e5c4f2a10d738b2965f401c7e8920a3b56d14f8c7291e30b4d85762a01116544',
  },
  {
    id: 'e-06',
    at: new Date(2026, 4, 13, 7, 48, 59),
    eventId: 'e_38508b47-9e2a-4f61-bc93-d72058c8a045',
    kind: 'REQUEST',
    description: 'Streaming proxy request completed: POST /v1/messages?beta=true',
    member: 'Jordan Lee',
    anchor: 'e5c4f2a10d738b2965f401c7e8920a3b56d14f8c7291e30b4d85762a01116544',
  },
  {
    id: 'e-07',
    at: new Date(2026, 4, 13, 7, 47, 29),
    eventId: 'e_7e0402c8-5a93-4b72-d81f-e046f3067e63',
    kind: 'REQUEST',
    description: 'Streaming proxy request completed: POST /v1/messages?beta=true',
    member: 'Jordan Lee',
    anchor: '36c1b2d7a4e95f0c8310b6274d82a93f15e6c4810d927b53f48120691012192cc',
  },
  {
    id: 'e-08',
    at: new Date(2026, 4, 12, 9, 23, 49),
    eventId: 'e_644008f2-2c57-4d1a-93be-7f10628581d9',
    kind: 'POLICY',
    description: 'Request blocked by security policy',
    member: 'Jordan Lee',
    anchor: '53b6a5c9f2e0178d4b3960a7c825e14f93d07b261f4a8e5d9c130247805cfd97',
  },
  {
    id: 'e-09',
    at: new Date(2026, 4, 12, 9, 21, 7),
    eventId: 'e_eccc67b1-8f4d-4e29-a153-c09715baba9',
    kind: 'REQUEST',
    description: 'Proxy request completed: POST /v1/messages',
    member: 'Jordan Lee',
    anchor: 'b8d5af3e76c2190d4b05f8a13e92c647d30f819a25b7e40c16834d09257dd92',
  },
  {
    id: 'e-10',
    at: new Date(2026, 4, 12, 9, 18, 12),
    eventId: 'e_e77116a3-d058-4b7f-9c21-e3a540b318ae',
    kind: 'AUDIT',
    description: 'API key 47b14b0a-43cc-4738-928d-b0fc94c635f2 revoked',
    member: 'Chad Ponticas',
    anchor: 'a0eb4a27f91c5083b6d24e17a39c850f72d68b14c30e9f5a28461b073d9fe5bf',
  },
  {
    id: 'e-11',
    at: new Date(2026, 4, 12, 9, 16, 57),
    eventId: 'e_9e0d73c4-6b12-4f85-a047-b83294cee5d1',
    kind: 'REQUEST',
    description: 'Proxy request completed: POST /v1/messages',
    member: 'Jordan Lee',
    anchor: 'eb81261c7d4a93f0b285e6c40917d58a32f0c19b674e20d83a95b047f1855ab1',
  },
  {
    id: 'e-12',
    at: new Date(2026, 4, 12, 9, 16, 11),
    eventId: 'e_a707dd59-3e8c-4a06-b172-940c51a3837b',
    kind: 'AUDIT',
    description: 'API key "test1" created',
    member: 'Chad Ponticas',
    anchor: 'daa135e72b4c09f1836d57a0e29b4c80f16a3d72e85c14b097f43621873735f',
  },
  {
    id: 'e-13',
    at: new Date(2026, 4, 12, 9, 13, 54),
    eventId: 'e_6a58e5d7-4b21-4f93-a860-c73921418752',
    kind: 'AUDIT',
    description: 'API key "test-key" created',
    member: 'Chad Ponticas',
    anchor: '7c1ddaf3b8260e94a15c072d38b91e450c2897f6a13d48b025e79c3041e2e8737',
  },
  {
    id: 'e-14',
    at: new Date(2026, 4, 12, 9, 8, 9),
    eventId: 'e_9bb46bf0-7c35-4d18-b092-5e1a3118a027',
    kind: 'AUDIT',
    description: 'Admin inspected workspace orgs',
    member: 'Mateus Silva',
    anchor: '8d4fa5c3b70e192d46a8f01e37c984b25d71f3609e2a58b1c04d376029388f8',
  },
  {
    id: 'e-15',
    at: new Date(2026, 4, 12, 9, 3, 22),
    eventId: 'e_6b544c2a-91f7-4e53-bc80-d4372aec522e',
    kind: 'AUDIT',
    description: 'Admin inspected workspace orgs',
    member: 'Mateus Silva',
    anchor: 'd00ed9f1b3a82c4075e96d31b87f05c29a4e16d30b72f58c19043a8750cf402',
  },
  {
    id: 'e-16',
    at: new Date(2026, 4, 12, 9, 1, 14),
    eventId: 'e_921bcd37-2e04-4c61-a895-f18360b4954e',
    kind: 'AUDIT',
    description: 'Admin inspected workspace orgs',
    member: 'Mateus Silva',
    anchor: '02d0e2c7f4b9310a58e72d46b01c93f85a17d24e6930b78c5f219a047016b025',
  },
  {
    id: 'e-17',
    at: new Date(2026, 4, 12, 9, 1, 4),
    eventId: 'e_4e92b8f6-c031-4d7a-b259-a07185479d54',
    kind: 'AUDIT',
    description: 'Admin inspected workspace orgs',
    member: 'Mateus Silva',
    anchor: '02d0e2c7f4b9310a58e72d46b01c93f85a17d24e6930b78c5f219a047016b025',
  },
  {
    id: 'e-18',
    at: new Date(2026, 4, 9, 15, 16, 13),
    eventId: 'e_a54fac81-b0d6-4e39-9c72-f83410a2636c',
    kind: 'EVENT',
    description: 'Kira Tan added to the workspace as a member',
    member: 'Kira Tan',
    anchor: '4f3382d6e91c07b2a543f08c7d25e3b94a10f6812c97d30e4b586291a12bec3',
  },
];

type FilterValue = '__all' | 'REQUEST' | 'POLICY' | 'LIMITS' | 'AUDIT';

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: '__all',   label: 'All' },
  { value: 'REQUEST', label: 'Requests' },
  { value: 'POLICY',  label: 'Policy' },
  { value: 'LIMITS',  label: 'Limits' },
  { value: 'AUDIT',   label: 'Audit' },
];

export const KIND_BADGE_VARIANT: Record<EventKind, 'warning' | 'info' | 'destructive' | 'secondary' | 'neutral'> = {
  AUDIT:   'warning',
  REQUEST: 'info',
  POLICY:  'destructive',
  LIMITS:  'secondary',
  EVENT:   'neutral',
};

function EventLog({ rows }: { rows: EventRow[] }) {
  const [filter, setFilter] = useState<FilterValue>('__all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState('25');
  const [selectedRow, setSelectedRow] = useState<EventRow | null>(null);

  // Reset to page 1 whenever the range-scoped row set, filter, or query
  // changes — render-time pattern, not useEffect (see Activity UsageByKey
  // for the canonical shape). `rows.length` stands in for the range
  // identity since the same range produces the same row count.
  const [prevResetKey, setPrevResetKey] = useState('');
  const resetKey = `${rows.length}|${filter}|${query}`;
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setPage(1);
  }

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter !== '__all' && row.kind !== filter) return false;
      if (!q) return true;
      const haystack = `${row.eventId} ${row.description} ${row.member} ${row.anchor}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, filter, query]);

  const perPage = parseInt(rowsPerPage, 10);
  const pageRows = useMemo(
    () => filteredRows.slice((page - 1) * perPage, page * perPage),
    [filteredRows, page, perPage],
  );

  const isEmpty = filteredRows.length === 0;

  return (
    <>
      <Card density="flush">
        {isEmpty ? null : (
        <div className="flex items-center gap-2 p-4">
          <SearchInput
            placeholder="Search events, users, hashes…"
            ariaLabel="Search audit events"
            value={query}
            onChange={setQuery}
          />
          <Select value={filter} onValueChange={(v: string) => setFilter(v as FilterValue)}>
            <SelectTrigger
              size="sm"
              aria-label="Filter by kind"
              className="border-border bg-card text-foreground font-normal"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        )}

        {isEmpty ? (
          <TableEmptyState
            title="No audit events"
            body="Requests, policy decisions, and limit checks will appear here as your workspace routes traffic."
          />
        ) : (
          <>
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {/* `table-fixed` + percentage widths is the canonical pattern
                  (Team, Guardrails, Activity). Description gets the largest
                  share since it's the wrap-tolerant column; the rest hold
                  their content. */}
              <TableHead className="w-[14%] whitespace-nowrap">Time</TableHead>
              <TableHead className="w-[13%] whitespace-nowrap">Event ID</TableHead>
              <TableHead className="w-[9%] whitespace-nowrap">Kind</TableHead>
              <TableHead className="w-[30%] whitespace-nowrap">Description</TableHead>
              <TableHead className="w-[16%] whitespace-nowrap">Member</TableHead>
              <TableHead className="w-[18%] whitespace-nowrap">Anchor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer [&_td]:align-top"
                tabIndex={0}
                onClick={() => setSelectedRow(row)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedRow(row);
                  }
                }}
              >
                <TableCell className="whitespace-nowrap text-ink-800">
                  {fmtTime(row.at)}
                </TableCell>
                <TableCell className="whitespace-nowrap font-mono text-ink-800">
                  {truncateHex(row.eventId)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge variant={KIND_BADGE_VARIANT[row.kind]}>{row.kind}</Badge>
                </TableCell>
                <TableCell className="text-ink-800">
                  <span className="line-clamp-2 break-words" title={row.description}>
                    {row.description}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap font-sans text-ink-800">
                  {row.member}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="inline-flex items-center gap-2">
                    <CircleCheck aria-hidden className="size-4 text-success-600" strokeWidth={1.75} />
                    <span className="sr-only">Verified anchor</span>
                    <span className="font-mono text-ink-800">{truncateHex(row.anchor)}</span>
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePaginationFooter
          total={filteredRows.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
        />
          </>
        )}
      </Card>

      <AuditRecordDialog
        row={selectedRow}
        open={!!selectedRow}
        onOpenChange={(open) => { if (!open) setSelectedRow(null); }}
      />
    </>
  );
}
