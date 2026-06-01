import { useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { BadgeCheck, CircleCheck, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { SearchInput } from '@/components/ui/search-input';
import { KpiRail } from '@/components/ui/kpi-rail';
import { KpiTile } from '@/components/ui/kpi-tile';
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
import { AuditRecordDialogMerkle } from './AuditRecordDialogMerkle';
// Event data, row type, and badge map are shared with the canonical
// /audit-trail page — single source of truth. Only the Merkle panel diverges.
import { EVENT_ROWS, KIND_BADGE_VARIANT, type EventRow } from './AuditTrail';
import { formatNumber } from '@/lib/formatters';
import { Timestamp } from '@/components/ui/timestamp';

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

// Trailing comparison copy for the KPI delta tags, tied to the active range.
const RANGE_DELTA_NOTE: Record<Range, string> = {
  all: 'All time',
  '24h': 'vs last 24hrs',
  '7d': 'vs last 7d',
  '30d': 'vs last 30d',
  custom: 'vs prior range',
};
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

/** Truncates a hex string or UUID for display in a table cell. Uses a
 *  single horizontal-ellipsis glyph (…, U+2026) so the middle reads as one
 *  character at any font weight; the prior ASCII ".." trio rendered as a
 *  spaced ".. ." in mono at certain sizes. */
export function truncateHex(s: string, start = 6, end = 6): string {
  if (s.length <= start + end + 1) return s;
  return `${s.slice(0, start)}…${s.slice(-end)}`;
}


export function AuditTrailMerkle() {
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
      <PageHeader />
      {/* Overview label + range controls group with the KPI rail (gap-4
          internal) rather than floating equidistant between sections — the
          chrome content pane spaces its direct children at gap-6, so wrapping
          the bar + rail in one tighter-gapped child reads the "Overview"
          heading as the label FOR the rail it sits above. */}
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
        <KpiRailSection rows={rangeRows} range={range} />
      </div>
      <EventLog rows={rangeRows} />
    </DashboardChrome>
  );
}

function PageHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-2 max-w-1/2">
        <PageTitle>Audit trail</PageTitle>
        <p className="font-sans text-muted-foreground text-base tracking-tight m-0">
          Every model call gets a cryptographic receipt. Receipts are anchored to Constellation's Digital Evidence layer on a public chain, so anyone can verify a record existed and was unmodified, including after retention. No trust in Constellation required.
        </p>
      </div>
      {/* TODO: wire page-level Verify / Export actions per the Audit Trail review doc.
          Verify-a-hash dialog and Export view are not built yet — no onClick handlers. */}
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="lg">
          <BadgeCheck />
          Verify a hash
        </Button>
        <Button type="button" variant="outline" size="lg">
          <Download />
          Export view
        </Button>
      </div>
    </div>
  );
}

/* ─── Overview bar (section label + range controls) ─────────────────────── */

/* Section label for the KPI rail on the left; range controls inline on the
 * right. PageTitle renders an h2, so this heading is h3 to keep the outline
 * valid (h1 = document title owned by DashboardChrome → h2 page title → h3
 * section). Visual size is text-xl/7 (20/28) — a section-label tier one step
 * under the design-system h2 "Section title" token (text-2xl/24) so it doesn't
 * match the 24px KPI hero values directly below — NOT the text-sm
 * `SectionHeading` primitive, whose tier is modal body-section labels. Range
 * state lives in AuditTrail(); the moved SegmentedPill + DateRangePicker are
 * wired verbatim to the same handlers the header used. */
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

/* ─── KPI rail ──────────────────────────────────────────────────────── */

function KpiRailSection({ rows, range }: { rows: EventRow[]; range: Range }) {
  const { eventsLogged, distinctAnchors, mostRecent } = useMemo(() => {
    const eventsLogged = rows.length;
    const distinctAnchors = new Set(rows.map((r) => r.anchor)).size;
    const mostRecent = rows.reduce<Date | null>(
      (latest, r) => (!latest || r.at > latest ? r.at : latest),
      null,
    );
    return { eventsLogged, distinctAnchors, mostRecent };
  }, [rows]);

  return (
    <KpiRail columns={4}>
      <KpiTile title="Events logged" value={formatNumber(eventsLogged)} delta="+12.4%" deltaNote={RANGE_DELTA_NOTE[range]} deltaRow />
      <KpiTile title="Anchors" value={formatNumber(distinctAnchors)} delta="+9.1%" deltaNote={RANGE_DELTA_NOTE[range]} deltaRow />
  {/* Hand-authored stat: every mock anchor verifies (derived = 100%); 92.4% is product-set. */}
  <KpiTile title="Verified rate" value="92.4%" delta="+0.6%" deltaNote={RANGE_DELTA_NOTE[range]} deltaRow />
      <KpiTile
        title="Last anchor"
        value={mostRecent ? fmtRelative(mostRecent) : '—'}
        href="https://digitalevidence.constellationnetwork.io/"
        linkLabel="Open in DE Explorer"
          deltaRow
      />
    </KpiRail>
  );
}

/* ─── Event log table ───────────────────────────────────────────────── */

type FilterValue = '__all' | 'REQUEST' | 'POLICY' | 'LIMITS' | 'AUDIT';

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: '__all',   label: 'All events' },
  { value: 'REQUEST', label: 'Requests' },
  { value: 'POLICY',  label: 'Policy' },
  { value: 'LIMITS',  label: 'Limits' },
  { value: 'AUDIT',   label: 'Audit' },
];


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
  const pageRows = filteredRows.slice((page - 1) * perPage, page * perPage);

  const isEmpty = filteredRows.length === 0;

  return (
    <>
      {/* "Audit events" section bar groups with the table Card (gap-4
          internal) the same way OverviewBar groups with the KPI rail above.
          PageTitle is the page h2, so this is h3 to keep the outline valid.
          Search + filter live here on the page background as page-level
          section-header controls — and therefore always render, so a query
          that returns zero results never hides the search box and traps the
          user (the prior FilterToolbar was gated on isEmpty inside the Card).
          isEmpty now governs only the Card interior. */}
      {/* mt-2 adds 8px on top of the chrome content pane's gap-6 (24px) so the
          Audit events section sits 32px below the KPI rail — a touch more air
          than the other inter-section gaps. */}
      <div className="mt-2 flex flex-col gap-4">
        {/* 12-col grid (md+) aligns the search cluster to the 3rd KPI column:
            the KpiRail is a gapless grid-cols-3, so the 3rd tile starts at 2/3
            of the content width. Title takes cols 1-8 (col-span-8); the search
            + "All events" filter share cols 9-12 (col-span-4) as a flex cluster
            (search flex-1, filter after, 8px gap), so the search's left edge
            lands on the 3rd KPI tile within ~one grid gap. Below md the
            controls drop onto their own row (grid-cols-1) so the row never
            crushes on narrow screens. */}
        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-12">
          <h3 className="font-sans text-xl/7 font-medium text-neutral-900 m-0 md:col-span-8">Recent events</h3>
          <div className="flex items-center gap-2 md:col-span-4">
            <SearchInput
              placeholder="Search events, users, hashes…"
              ariaLabel="Search audit events"
              value={query}
              onChange={setQuery}
              className="flex-1 min-w-0 shrink"
              surface="background"
            />
            <Select value={filter} onValueChange={(v: string) => setFilter(v as FilterValue)}>
              <SelectTrigger
                size="sm"
                aria-label="Filter by event type"
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
        </div>

        <Card density="flush">
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
                        (Team, Limits, Activity). Description gets the largest
                        share since it's the wrap-tolerant column; the rest hold
                        their content. */}
                    <TableHead className="w-[14%] whitespace-nowrap">Time</TableHead>
                    <TableHead className="w-[13%] whitespace-nowrap">Event ID</TableHead>
                    <TableHead className="w-[9%] whitespace-nowrap">Event type</TableHead>
                    <TableHead className="w-[30%] whitespace-nowrap">Description</TableHead>
                    <TableHead className="w-[16%] whitespace-nowrap">Member</TableHead>
                    <TableHead className="w-[18%] whitespace-nowrap">Anchor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((row) => (
                    <TableRow
                      key={row.id}
                      role="button"
                      className="cursor-pointer [&_td]:align-top focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      tabIndex={0}
                      onClick={() => setSelectedRow(row)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedRow(row);
                        }
                      }}
                    >
                      <TableCell className="whitespace-nowrap text-neutral-800">
                        <Timestamp date={row.at} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-neutral-800">
                        {truncateHex(row.eventId)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={KIND_BADGE_VARIANT[row.kind]}>{row.kind}</Badge>
                      </TableCell>
                      <TableCell className="text-neutral-800">
                        <span className="line-clamp-2 break-words" title={row.description}>
                          {row.description}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-sans text-neutral-800">
                        {row.member}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <CircleCheck aria-hidden className="size-4 text-success-600" strokeWidth={1.75} />
                          <span className="sr-only">Verified anchor</span>
                          <span className="font-mono text-neutral-800">{truncateHex(row.anchor, 4, 4)}</span>
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
      </div>

      <AuditRecordDialogMerkle
        row={selectedRow}
        open={!!selectedRow}
        onOpenChange={(open) => { if (!open) setSelectedRow(null); }}
      />
    </>
  );
}
