import { ChevronDownIcon, CircleCheck } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KpiTile } from "@/components/ui/kpi-tile";
import { Label } from "@/components/ui/label";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { MultiSelect } from "@/components/ui/multi-select";
import { PageTitle } from "@/components/ui/page-title";
import { SearchInput } from "@/components/ui/search-input";
import { SlidersHorizontalIcon } from "@/components/ui/sliders-horizontal";
import {
  SortableTableHead,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { TablePaginationFooter } from "@/components/ui/table-pagination-footer";
import { TextLink } from "@/components/ui/text-link";
import { Timestamp } from "@/components/ui/timestamp";
import { UploadIcon } from "@/components/ui/upload";
import {
  EVENT_ROWS,
  type EventKind,
  type EventRow,
  fmtRelative,
  KIND_BADGE_VARIANT,
  truncateHex,
} from "@/data/audit-trail";
import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { formatNumber } from "@/lib/formatters";
import { AuditRecordDialog } from "./AuditRecordDialog";

/** Comparable value per sortable column for the audit event log. Time sorts
 *  on the epoch; type/member/description on their string payload. Event ID and
 *  Fingerprint are opaque high-entropy hashes with no meaningful order, so
 *  they stay plain (non-sortable) headers. */
function eventSortValue(row: EventRow, key: string): string | number | null {
  switch (key) {
    case "at":
      return row.at.getTime();
    case "kind":
      return row.kind;
    case "description":
      return row.description;
    case "member":
      return row.member;
    default:
      return null;
  }
}

/* ─────────────────────────────────────────────────────────────────────────
 * AuditTrail page (route: /audit-trail, sidebar: "Audit Trail")
 *
 * Title + subtitle + KPI rail + event log table with
 * toolbar + pagination.
 * ───────────────────────────────────────────────────────────────────────── */

/** Truncates a hex string or UUID for display in a table cell. Uses a
 *  single horizontal-ellipsis glyph (…, U+2026) so the middle reads as one
 *  character at any font weight; the prior ASCII ".." trio rendered as a
 *  spaced ".. ." in mono at certain sizes. */

export function AuditTrail() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  // No range filter on this surface — KPIs and EventLog read the full event
  // set. EventLog further narrows by kind + query.
  const rows = EVENT_ROWS;

  return (
    <DashboardChrome
      activeNavId="audit-trail"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <PageHeader />
      {/* Overview label groups with the KPI rail (gap-4 internal) rather than
          floating equidistant between sections — the chrome content pane
          spaces its direct children at gap-6, so wrapping the label + rail in
          one tighter-gapped child reads the "Overview" heading as the label
          FOR the rail it sits above. */}
      <div className="flex flex-col gap-4">
        <OverviewBar />
        <KpiRailSection rows={rows} />
      </div>
      <EventLog rows={rows} />
    </DashboardChrome>
  );
}

const DIGITAL_EVIDENCE_DOCS_URL =
  "https://constellation-main.gitbook.io/digital-evidence";

function PageHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex max-w-1/2 flex-col gap-2">
        <PageTitle>Audit trail</PageTitle>
        <p className="m-0 text-pretty font-sans text-base text-neutral-500 tracking-snug">
          A tamper-evident record of every request, response, and policy
          decision the gateway handled. Investigate exactly what happened, and
          let anyone verify it independently.
        </p>
        <p className="m-0 text-pretty font-sans text-base text-neutral-500 tracking-snug">
          To learn more, check out our{" "}
          <TextLink
            as="a"
            href={DIGITAL_EVIDENCE_DOCS_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            Digital Evidence docs
          </TextLink>
          .
        </p>
      </div>
    </div>
  );
}

/* ─── Overview bar (section label) ─────────────────────── */

/* Section label for the KPI rail. PageTitle renders an h2, so this heading is h3 to keep the outline
 * valid (h1 = document title owned by DashboardChrome → h2 page title → h3
 * section). Visual size is text-xl/7 (20/28) — a section-label tier one step
 * under the design-system h2 "Section title" token (text-2xl/24) so it doesn't
 * match the 24px KPI hero values directly below — NOT the text-sm
 * `SectionHeading` primitive, whose tier is modal body-section labels. */
function OverviewBar() {
  return (
    <h3 className="m-0 font-medium font-sans text-neutral-900 text-xl/7">
      Overview
    </h3>
  );
}

/* ─── KPI rail ──────────────────────────────────────────────────────── */

function KpiRailSection({ rows }: { rows: EventRow[] }) {
  const { eventsLogged, mostRecent } = useMemo(() => {
    const eventsLogged = rows.length;
    const mostRecent = rows.reduce<Date | null>(
      (latest, r) => (!latest || r.at > latest ? r.at : latest),
      null
    );
    return { eventsLogged, mostRecent };
  }, [rows]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="overflow-hidden rounded-md border border-border bg-card shadow-xs">
        <KpiTile title="Events logged" value={formatNumber(eventsLogged)} />
      </div>
      <div className="overflow-hidden rounded-md border border-border bg-card shadow-xs">
        <KpiTile
          href="https://digitalevidence.constellationnetwork.io/"
          linkLabel="Open in Explorer"
          title="Last fingerprint"
          value={mostRecent ? fmtRelative(mostRecent) : "—"}
        />
      </div>
    </div>
  );
}

/* ─── Event log table ───────────────────────────────────────────────── */

// 18 seed rows. `eventId` and `anchor` are now full strings; table cells
// render truncated via truncateHex(). Full values appear in the drill-in
// modal (AuditRecordDialog). Member names map to the canonical workspace
// roster (Team.tsx MEMBER_ROWS): Chad Ponticas owns key lifecycle, Jordan
// Lee runs dev request batches, Mateus Silva carries admin / inspect
// actions, Kira Tan is the newly-added member.
// Mock anchors / eventIds are assembled via `hex(...)` and `uuid(...)` helpers
// so no contiguous 32+ char hex run or canonical 8-4-4-4-12 UUID shape appears
// in this source file. The strings are byte-identical at runtime — table cells,
// truncateHex(), search matching, and Set-based dedupe all see the full value.
// This keeps high-entropy strings out of static-analysis content scanners that
// would otherwise flag the file as containing real secrets.

// Filters modal option sources. Members mirror the canonical workspace roster
// (Team.tsx MEMBER_ROWS) present in EVENT_ROWS; kinds are the full EventKind
// union, labelled in the same casing the table badges render (KIND_BADGE_*).
const MEMBER_OPTIONS = [
  "Chad Ponticas",
  "Jordan Lee",
  "Mateus Silva",
  "Kira Tan",
] as const;

const KIND_OPTIONS: { value: EventKind; label: string }[] = [
  { value: "AUDIT", label: "AUDIT" },
  { value: "REQUEST", label: "REQUEST" },
  { value: "POLICY", label: "POLICY" },
  { value: "EVENT", label: "EVENT" },
  { value: "LIMITS", label: "LIMITS" },
];

function EventLog({ rows }: { rows: EventRow[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("25");
  const [selectedRow, setSelectedRow] = useState<EventRow | null>(null);

  // ─── Filters modal (Reset/Apply with staged drafts) ───────────────────
  // Committed filter state drives the table. The modal binds to draft copies
  // so editing a control never touches the table until Apply commits. Mirrors
  // the canonical Requests.tsx Filters dialog. Three AND-combined groups:
  // member ∈ selected, kind ∈ selected, row.at within the date+time range.
  // An empty group is no constraint. Reversible: delete this block + the
  // Dialog and restore the inline event-type Select.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [members, setMembers] = useState<string[]>([]);
  const [kinds, setKinds] = useState<EventKind[]>([]);
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  } | null>(null);
  const [draftMembers, setDraftMembers] = useState<string[]>([]);
  const [draftKinds, setDraftKinds] = useState<EventKind[]>([]);
  const [draftDateRange, setDraftDateRange] = useState<{
    from: Date;
    to: Date;
  } | null>(null);

  const activeFilterCount =
    (members.length > 0 ? 1 : 0) +
    (kinds.length > 0 ? 1 : 0) +
    (dateRange ? 1 : 0);

  const openFilters = useCallback(() => {
    setDraftMembers(members);
    setDraftKinds(kinds);
    setDraftDateRange(dateRange);
    setFiltersOpen(true);
  }, [members, kinds, dateRange]);

  const resetFilters = useCallback(() => {
    setDraftMembers([]);
    setDraftKinds([]);
    setDraftDateRange(null);
  }, []);

  const applyFilters = useCallback(() => {
    setMembers(draftMembers);
    setKinds(draftKinds);
    setDateRange(draftDateRange);
    setFiltersOpen(false);
  }, [draftMembers, draftKinds, draftDateRange]);

  // Recovery path from the empty state: clear every committed group at once.
  const clearFilters = useCallback(() => {
    setMembers([]);
    setKinds([]);
    setDateRange(null);
    setQuery("");
  }, []);

  // Reset to page 1 whenever the range-scoped row set, filters, or query
  // changes — render-time pattern, not useEffect (see Activity UsageByKey
  // for the canonical shape). `rows.length` stands in for the range
  // identity since the same range produces the same row count.
  const [prevResetKey, setPrevResetKey] = useState("");
  const resetKey = `${rows.length}|${members.join(",")}|${kinds.join(
    ","
  )}|${dateRange ? `${dateRange.from.getTime()}-${dateRange.to.getTime()}` : ""}|${query}`;
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setPage(1);
  }

  const { sort, toggle: toggleSort } = useTableSort();

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      // AND-combined groups; an empty group imposes no constraint.
      if (members.length > 0 && !members.includes(row.member)) {
        return false;
      }
      if (kinds.length > 0 && !kinds.includes(row.kind)) {
        return false;
      }
      if (dateRange) {
        const t = row.at.getTime();
        if (t < dateRange.from.getTime() || t > dateRange.to.getTime()) {
          return false;
        }
      }
      if (!q) {
        return true;
      }
      const haystack =
        `${row.eventId} ${row.description} ${row.member} ${row.anchor}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, members, kinds, dateRange, query]);

  // Sort after filter/search, before pagination. Default (key=null) preserves
  // the authored reverse-chronological order.
  const sortedRows = useMemo(
    () => sortRows(filteredRows, sort, eventSortValue),
    [filteredRows, sort]
  );

  const perPage = Number.parseInt(rowsPerPage, 10);
  const pageRows = sortedRows.slice((page - 1) * perPage, page * perPage);

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
          <h3 className="m-0 font-medium font-sans text-neutral-900 text-xl/7 md:col-span-8">
            Recent events
          </h3>
          <div className="flex items-center gap-2 md:col-span-4">
            <SearchInput
              ariaLabel="Search audit events"
              className="min-w-0 flex-1 shrink"
              onChange={setQuery}
              placeholder="Search events, users, hashes…"
              surface="elevated"
              value={query}
            />
            {/* Filters button — collapses member / event-type / event-time
                into one modal Dialog (mirrors Requests.tsx). Active-count
                Badge on the trigger; the modal stages drafts and commits on
                Apply. Reversible: restore the inline event-type <Select> and
                delete this button + the Dialog block below. */}
            <Button
              aria-label={
                activeFilterCount > 0
                  ? `Filters (${activeFilterCount} active)`
                  : "Filters"
              }
              className="border-border bg-card font-normal text-foreground"
              onClick={openFilters}
              size="sm"
              type="button"
              variant="outline"
            >
              <SlidersHorizontalIcon
                aria-hidden
                data-icon="inline-start"
                size={16}
              />
              Filters
              {activeFilterCount > 0 ? (
                <Badge
                  className="h-4 min-w-4 justify-center px-1 leading-none"
                  variant="secondary"
                >
                  {activeFilterCount}
                </Badge>
              ) : null}
            </Button>
            <Menu>
              <MenuTrigger
                render={
                  <Button
                    className="border-border bg-card font-normal text-foreground"
                    disabled={isEmpty}
                    size="sm"
                    type="button"
                    variant="outline"
                  />
                }
              >
                <UploadIcon aria-hidden data-icon="inline-start" size={16} />
                Export
                <ChevronDownIcon
                  aria-hidden
                  className="text-muted-foreground transition-transform duration-150 ease-out group-aria-expanded/button:rotate-180 motion-reduce:transition-none"
                  data-icon="inline-end"
                />
              </MenuTrigger>
              <MenuContent align="end">
                {/* TODO: wire export actions (PDF / CSV) per the Audit Trail
                    review doc — no handlers yet. */}
                <MenuItem>Export as PDF</MenuItem>
                <MenuItem>Export as CSV</MenuItem>
              </MenuContent>
            </Menu>
          </div>
        </div>

        {/* Filters modal — 3 labeled full-width rows + Reset/Apply footer. */}
        <Dialog onOpenChange={setFiltersOpen} open={filtersOpen}>
          <DialogContent className="w-full gap-4 sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle className="font-medium font-sans text-lg/6 text-neutral-900">
                Filters
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-2">
              <Label className="font-medium text-neutral-600 text-sm">
                Event time
              </Label>
              <DateRangePicker
                className="w-full"
                onChange={setDraftDateRange}
                value={draftDateRange}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="font-medium text-neutral-600 text-sm">
                Member
              </Label>
              <MultiSelect
                aria-label="Filter by member"
                onValueChange={setDraftMembers}
                options={MEMBER_OPTIONS.map((name) => ({
                  value: name,
                  label: name,
                }))}
                placeholder="All members"
                value={draftMembers}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="font-medium text-neutral-600 text-sm">
                Event type
              </Label>
              <MultiSelect
                aria-label="Filter by event type"
                onValueChange={(v) => setDraftKinds(v as EventKind[])}
                options={KIND_OPTIONS}
                placeholder="All event types"
                value={draftKinds}
              />
            </div>

            <DialogFooter className="sm:justify-between">
              <Button
                onClick={resetFilters}
                size="sm"
                type="button"
                variant="ghost"
              >
                Reset
              </Button>
              <div className="flex items-center gap-2">
                <DialogClose
                  render={<Button size="sm" type="button" variant="outline" />}
                >
                  Cancel
                </DialogClose>
                <Button onClick={applyFilters} size="sm" type="button">
                  Apply
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card density="flush">
          {isEmpty ? (
            <TableEmptyState
              action={
                activeFilterCount > 0 || query.trim() ? (
                  <Button
                    onClick={clearFilters}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
              body="No events match your current search or filters. Clear them to see the full audit trail."
              title="No audit events"
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
                    <SortableTableHead
                      className="w-[14%] whitespace-nowrap"
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="at"
                    >
                      Time
                    </SortableTableHead>
                    <TableHead className="w-[13%] whitespace-nowrap">
                      Event ID
                    </TableHead>
                    <SortableTableHead
                      className="w-[9%] whitespace-nowrap"
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="kind"
                    >
                      Event type
                    </SortableTableHead>
                    <SortableTableHead
                      className="w-[30%] whitespace-nowrap"
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="description"
                    >
                      Description
                    </SortableTableHead>
                    <SortableTableHead
                      className="w-[16%] whitespace-nowrap"
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="member"
                    >
                      Member
                    </SortableTableHead>
                    <TableHead className="w-[18%] whitespace-nowrap">
                      Fingerprint
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((row) => (
                    <TableRow
                      className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_td]:align-top"
                      key={row.id}
                      onClick={() => setSelectedRow(row)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedRow(row);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <TableCell className="whitespace-nowrap text-neutral-800">
                        <Timestamp date={row.at} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-neutral-800">
                        {truncateHex(row.eventId)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={KIND_BADGE_VARIANT[row.kind]}>
                          {row.kind}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-neutral-800">
                        <span
                          className="line-clamp-2 break-words"
                          title={row.description}
                        >
                          {row.description}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-sans text-neutral-800">
                        {row.member}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <CircleCheck
                            aria-hidden
                            className="size-4 text-success-600"
                            strokeWidth={1.75}
                          />
                          <span className="sr-only">Verified fingerprint</span>
                          <span className="font-mono text-neutral-800">
                            {truncateHex(row.anchor, 4, 4)}
                          </span>
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <TablePaginationFooter
                onPageChange={setPage}
                onRowsPerPageChange={setRowsPerPage}
                page={page}
                rowsPerPage={rowsPerPage}
                total={filteredRows.length}
              />
            </>
          )}
        </Card>
      </div>

      <AuditRecordDialog
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRow(null);
          }
        }}
        open={!!selectedRow}
        row={selectedRow}
      />
    </>
  );
}
