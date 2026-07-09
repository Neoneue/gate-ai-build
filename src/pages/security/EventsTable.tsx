/* ─────────────────────────────────────────────────────────────────────────
 * Security — Recent events table + threat-event detail dialog
 *
 * Extracted from Security.tsx. Renders the sortable/paginated events table and
 * the threat-event detail dialog. Shared data/config comes from ./events-data;
 * only EventsTableSection is exported (the detail dialog is file-local).
 * ───────────────────────────────────────────────────────────────────────── */
import { ArrowLeftRight, FileText, Flag, ShieldCheck } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DetailList, DetailRow } from "@/components/ui/detail-list";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogScrollBody,
  DialogScrollContent,
  DialogScrollHeader,
  DialogTitle,
  DialogTitleBlock,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/ui/search-input";
import { SectionTitle } from "@/components/ui/section-title";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontalIcon } from "@/components/ui/sliders-horizontal";
import {
  SortableTableHead,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { TablePaginationFooter } from "@/components/ui/table-pagination-footer";
import { TextLink } from "@/components/ui/text-link";
import { Timestamp } from "@/components/ui/timestamp";
import { UploadIcon } from "@/components/ui/upload";
import { getEventFindingCopy } from "@/data/requests";
import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import type { CustomRange } from "@/lib/range";
import {
  DETECTION_CHECKS,
  EVENT_KEYS,
  type EventsRange,
  eventSortValue,
  eventsTotal,
  getEventDetail,
} from "@/pages/security/events-data";
import {
  ACTION_BADGE,
  EVENT_ROWS,
  type EventRow,
  parseEventTime,
  TYPE_META,
} from "@/pages/security-data";

export function EventsTableSection({
  range,
  customRange,
}: {
  range: EventsRange;
  customRange: CustomRange | null;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [keyFilter, setKeyFilter] = useState("all");
  const [action, setAction] = useState("all");
  // Filters Dialog — the three single-select event filters (Type / Action /
  // Key) collapsed off the toolbar into a modal, mirroring Requests. Each
  // <Select> moves verbatim (single value, single onValueChange); only the
  // chrome changes. filtersOpen drives the Dialog.
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Staged-Apply drafts. The modal's <Select>s bind to these, never to the
  // committed state below, so an abandoned draft (Cancel / X / Esc / overlay)
  // never leaks into a later open. Apply commits draft → committed; Cancel
  // closes without committing.
  const [draftType, setDraftType] = useState("all");
  const [draftKeyFilter, setDraftKeyFilter] = useState("all");
  const [draftAction, setDraftAction] = useState("all");
  const activeFilterCount = [type, action, keyFilter].filter(
    (v) => v !== "all"
  ).length;
  const draftActiveFilterCount = [
    draftType,
    draftAction,
    draftKeyFilter,
  ].filter((v) => v !== "all").length;
  // Seed draft ← committed in the open handler (opening is a user event, not
  // derived state). Committed filters can't change while the modal is open
  // (Apply closes it), so this is the only moment a re-seed is needed.
  const openFilters = useCallback(() => {
    setDraftType(type);
    setDraftAction(action);
    setDraftKeyFilter(keyFilter);
    setFiltersOpen(true);
  }, [type, action, keyFilter]);
  // Reset clears the DRAFT only (staged); committed state is untouched until
  // Apply.
  const resetFilters = useCallback(() => {
    setDraftType("all");
    setDraftAction("all");
    setDraftKeyFilter("all");
  }, []);
  const applyFilters = useCallback(() => {
    setType(draftType);
    setAction(draftAction);
    setKeyFilter(draftKeyFilter);
    setFiltersOpen(false);
  }, [draftType, draftAction, draftKeyFilter]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("25");
  // Row-click drill-in — selectedRow doubles as the dialog `open` signal.
  // Closing sets it back to null. Index carried alongside so the modal
  // can derive stable per-row variants (provider/model/tokens/latency).
  const [selectedRow, setSelectedRow] = useState<EventRow | null>(null);
  const { sort, toggle: toggleSort } = useTableSort();

  // Deep-link support: ?open=req_* opens the matching event's modal.
  const [searchParams, setSearchParams] = useSearchParams();
  const openId = searchParams.get("open");
  const [prevOpenId, setPrevOpenId] = useState<string | null>(null);
  if (openId !== prevOpenId) {
    setPrevOpenId(openId);
    if (openId) {
      const match = EVENT_ROWS.find((r) => r.requestId === openId);
      if (match) {
        setSelectedRow(match);
      }
    }
  }

  // Reset to page 1 whenever filters or range change — render-time pattern,
  // not useEffect (see Activity UsageByKey for the canonical shape).
  const [prevResetKey, setPrevResetKey] = useState("");
  const resetKey = `${range}|${customRange?.from}|${customRange?.to}|${query}|${type}|${keyFilter}|${action}`;
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EVENT_ROWS.filter((r) => {
      if (type !== "all" && r.type !== type) {
        return false;
      }
      if (keyFilter !== "all" && r.key !== keyFilter) {
        return false;
      }
      if (action !== "all" && r.action !== action) {
        return false;
      }
      if (!q) {
        return true;
      }
      return r.key.toLowerCase().includes(q);
    });
  }, [query, type, keyFilter, action]);

  // Sort after filter, before pagination. Default (key=null) preserves the
  // authored reverse-chronological order.
  const sortedRows = useMemo(
    () => sortRows(filtered, sort, eventSortValue),
    [filtered, sort]
  );

  const isEmpty = filtered.length === 0;

  // Page-1 row count caps to the 17-row sample (all timestamps inside the
  // ~40-min window of "now"). The pagination footer "of N" reconciles with
  // the hero "Total events" KPI: unfiltered, it's exactly the range total
  // (eventsTotal); with filters active it scales by the filtered fraction
  // of the sample. Rows past page 1 are the implied tail we don't render.
  const rangeTotal = eventsTotal(range, customRange);
  const scaledTotal = Math.round(
    rangeTotal * (filtered.length / EVENT_ROWS.length)
  );
  const perPage = Number(rowsPerPage);
  // Cap the rendered rows to `scaledTotal` — at low-volume ranges (e.g. 24H
  // ≈ 12 events) the 16-row sample is larger than the actual total, so an
  // uncapped slice would render more rows than the footer's "of N" claims.
  const pageRows = sortedRows
    .slice((page - 1) * perPage, page * perPage)
    .slice(0, Math.max(0, scaledTotal - (page - 1) * perPage));

  return (
    <>
      <div className="mt-2 flex flex-col gap-4">
        {/* Recent events — section header on the page background, mirroring
          Requests / AuditTrail. Search + filters + Export live here as
          page-level section controls, so they always render (a query that
          returns zero results never hides them). isEmpty governs only the
          Card interior below. */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionTitle>Recent events</SectionTitle>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SearchInput
              ariaLabel="Search events"
              className="min-w-0 flex-1 shrink"
              onChange={setQuery}
              placeholder="Search events…"
              surface="elevated"
              value={query}
            />

            {/* PROTOTYPE — three section-header filters (Type / Action /
                Key) collapsed into one modal Dialog to de-cram the toolbar
                row, mirroring Requests / AuditTrail. The single-select
                <Select>s are moved verbatim into the Dialog below (same
                value / onValueChange + option lists), each laid out as a
                labeled full-width row. Active-count badge on the trigger;
                Reset clears all three. Reversible: restore the inline
                <Select>s and delete this Dialog. */}
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
                  aria-hidden
                  className="h-4 min-w-4 justify-center px-1 leading-none"
                >
                  {activeFilterCount}
                </Badge>
              ) : null}
            </Button>

            <Button size="sm" type="button" variant="outline">
              <UploadIcon aria-hidden data-icon="inline-start" size={16} />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters Dialog — the three single-select event filters moved off
            the toolbar (Type / Action / Key, in that order). Drafts are
            edited here and committed only on Apply; Cancel / X / Esc /
            overlay discard. The committed type/action/keyFilter still drive
            filteredRows below. */}
        <Dialog onOpenChange={setFiltersOpen} open={filtersOpen}>
          <DialogContent className="w-full gap-4 sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle className="type-heading-18 text-foreground">
                Filters
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-2">
              <Label className="type-label-14 text-muted-foreground">
                Type
              </Label>
              <Select onValueChange={setDraftType} value={draftType}>
                <SelectTrigger
                  aria-label="Type"
                  className="w-full border-border bg-card font-normal text-foreground"
                  id="filter-type"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="injection">Injection</SelectItem>
                  <SelectItem value="pii">PII</SelectItem>
                  <SelectItem value="phi">PHI</SelectItem>
                  <SelectItem value="credential">Credential</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="type-label-14 text-muted-foreground">
                Action
              </Label>
              <Select onValueChange={setDraftAction} value={draftAction}>
                <SelectTrigger
                  aria-label="Action"
                  className="w-full border-border bg-card font-normal text-foreground"
                  id="filter-action"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                  <SelectItem value="redacted">Redacted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="type-label-14 text-muted-foreground">Key</Label>
              <Select onValueChange={setDraftKeyFilter} value={draftKeyFilter}>
                <SelectTrigger
                  aria-label="API key"
                  className="w-full border-border bg-card font-normal text-foreground"
                  id="filter-key"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All keys</SelectItem>
                  {EVENT_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button
                disabled={draftActiveFilterCount === 0}
                onClick={resetFilters}
                type="button"
                variant="ghost"
              >
                Reset
              </Button>
              <div className="flex items-center gap-2">
                <DialogClose
                  render={<Button type="button" variant="outline" />}
                >
                  Cancel
                </DialogClose>
                <Button onClick={applyFilters} type="button">
                  Apply
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card density="flush">
          {isEmpty ? (
            <TableEmptyState
              body="Prompt injection, PII, and credential leak events flagged by your policies will appear here."
              title="No security events"
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <SortableTableHead
                      className="whitespace-nowrap"
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="time"
                    >
                      Time
                    </SortableTableHead>
                    <SortableTableHead
                      className="whitespace-nowrap"
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="type"
                    >
                      Type
                    </SortableTableHead>
                    <SortableTableHead
                      className="whitespace-nowrap"
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="conversation"
                    >
                      Conversation
                    </SortableTableHead>
                    <SortableTableHead
                      className="whitespace-nowrap"
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="key"
                    >
                      Key
                    </SortableTableHead>
                    <SortableTableHead
                      className="whitespace-nowrap"
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="action"
                    >
                      Action
                    </SortableTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((row, i) => {
                    const typeMeta = TYPE_META[row.type];
                    const actionMeta = ACTION_BADGE[row.action];
                    const TypeIcon = typeMeta.Icon;
                    return (
                      <TableRow
                        className="cursor-pointer transition-colors duration-150 ease-out hover:bg-neutral-50 motion-reduce:transition-none"
                        key={`${row.time}-${i}`}
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
                        <TableCell className="whitespace-nowrap">
                          <Timestamp
                            className="font-mono text-foreground text-sm tabular-nums"
                            date={parseEventTime(row.time)}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap align-middle">
                          <span className="inline-flex items-center gap-2 align-middle">
                            <TypeIcon
                              aria-hidden
                              className="size-4 shrink-0"
                              strokeWidth={1.75}
                              style={{ color: typeMeta.color }}
                            />
                            <span className="type-copy-14 text-foreground">
                              {typeMeta.label}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[200px] whitespace-nowrap">
                          <span
                            className="block max-w-full truncate font-mono text-foreground text-sm tabular-nums"
                            title={row.conversationId}
                          >
                            {row.conversationId}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-mono">
                          <span className="text-foreground">
                            {row.key.split(" (")[0]}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant={actionMeta.variant}>
                            {actionMeta.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <TablePaginationFooter
                onPageChange={setPage}
                onRowsPerPageChange={setRowsPerPage}
                page={page}
                rowsPerPage={rowsPerPage}
                total={scaledTotal}
              />
            </>
          )}
        </Card>
      </div>
      <ThreatEventDetailDialog
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRow(null);
            if (searchParams.has("open")) {
              const next = new URLSearchParams(searchParams);
              next.delete("open");
              setSearchParams(next, { replace: true });
            }
          }
        }}
        selection={selectedRow}
      />
    </>
  );
}

/* ─── Threat event detail dialog ──────────────────────────────────────────
 * Aligned with the convergence pattern across Vercel AI Gateway / Helicone /
 * OpenRouter / Lakera Guard (researched 2026-05-11):
 *   - Read-only investigation surface — no remediation buttons in modal
 *     (revoke/suppress/false-positive live upstream in settings)
 *   - Identity + provenance in the header (Helicone)
 *   - Per-detector verdict + L1–L5 confidence scale (Lakera)
 *   - Prompt + response evidence side-by-side (Helicone)
 *   - KPI tile rail across the top (CMP-013 / CMP-014 pattern)
 * ────────────────────────────────────────────────────────────────────── */

function ThreatEventDetailDialog({
  selection,
  onOpenChange,
}: {
  selection: EventRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={!!selection}>
      <DialogScrollContent className="sm:max-w-[640px]">
        {selection ? <ThreatEventDetailBody row={selection} /> : null}
      </DialogScrollContent>
    </Dialog>
  );
}

function ThreatEventDetailBody({ row }: { row: EventRow }) {
  const navigate = useNavigate();
  const actionMeta = ACTION_BADGE[row.action];
  const detail = getEventDetail(row);
  const requestId = row.requestId;
  const conversationId = row.conversationId;
  const openConversation = () =>
    navigate(`/conversations?open=${conversationId}`);
  const openRequest = () => navigate(`/requests?open=${requestId}`);
  const flaggedSet = new Set(detail.flagged);

  // Reconcile against the matching Requests row so the message + detection
  // copy is identical to what the Requests findings panel shows for the same
  // request. Null when no request row matches (sparse mock) — falls back to
  // the standalone per-type copy in TYPE_DETAILS.
  const reconciled = getEventFindingCopy(requestId, row.type);

  // Marked state — flips the dialog badge to "Marked false" and converts
  // the footer button to a disabled "Event marked" confirmation in place.
  // State resets naturally on unmount when the dialog closes (selection →
  // null unmounts this component).
  const [marked, setMarked] = useState(false);

  return (
    <>
      <DialogScrollHeader>
        <DialogTitleBlock
          badge={
            marked ? (
              <Badge className="h-8 px-3" variant="secondary">
                Invalid
              </Badge>
            ) : (
              <button
                aria-label="Mark event invalid"
                className="type-label-12 group/mark relative inline-flex h-8 w-8 shrink-0 items-center overflow-hidden whitespace-nowrap rounded-sm border border-border bg-card text-foreground outline-none [transition:width_300ms_var(--ease-drawer),scale_150ms_var(--ease-out)] after:absolute after:-inset-2 after:content-[''] hover:w-30 hover:bg-neutral-50 focus-visible:w-30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
                onClick={() => {
                  setMarked(true);
                  toast.success("Event marked as invalid");
                }}
                type="button"
              >
                <span className="inline-flex size-8 shrink-0 items-center justify-center">
                  <Flag aria-hidden className="size-3.5" strokeWidth={1.75} />
                </span>
                <span className="pr-3 opacity-0 transition-opacity duration-200 ease-out group-hover/mark:opacity-100 group-focus-visible/mark:opacity-100">
                  Mark invalid
                </span>
              </button>
            )
          }
          titleAriaLabel={`Security event ${requestId}`}
        >
          Security event
        </DialogTitleBlock>
      </DialogScrollHeader>

      <DialogScrollBody>
        <div className="flex flex-col gap-4">
          {/* Message — prompt + response. Reading flow follows
              Lakera/Helicone: content first, then reasoning, then
              metadata. Plain labeled blocks rather than chat bubbles
              with role chrome — this is captured evidence, not a
              conversation. Per-block "User"/"Assistant" labels are
              extra noise at single-event-detail scale. */}
          <section className="flex flex-col gap-2">
            <h3 className="type-heading-16 m-0 text-foreground tracking-snug">
              <span className="inline-flex items-center gap-2">
                <FileText
                  aria-hidden
                  className="size-5 text-muted-foreground"
                  strokeWidth={1.75}
                />
                Message
              </span>
            </h3>
            <div className="flex flex-col gap-3">
              {reconciled ? (
                <div className="type-copy-14 max-h-[200px] overflow-y-auto overscroll-contain text-pretty rounded-md border border-border px-4 py-3 text-foreground">
                  {reconciled.evidence}
                </div>
              ) : (
                <>
                  <div className="type-copy-14 max-h-[200px] overflow-y-auto overscroll-contain text-pretty rounded-md border border-border px-4 py-3 text-foreground">
                    {detail.samplePrompt}
                  </div>
                  {detail.sampleResponse === null ? null : (
                    <div className="type-copy-14 text-pretty rounded-md border border-border px-4 py-3 text-foreground">
                      {detail.sampleResponse}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Detection — per-detector verdict list. Mirrors the Requests
              modal Security panel: each check is its own bordered card
              with title + description + verdict badge. */}
          <section className="flex flex-col gap-2">
            <h3 className="type-heading-16 m-0 text-foreground tracking-snug">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck
                  aria-hidden
                  className="size-5 text-muted-foreground"
                  strokeWidth={1.75}
                />
                Detection
              </span>
            </h3>
            <div className="flex flex-col gap-2">
              {DETECTION_CHECKS.map((check) => {
                const firing = check.keys.some((k) => flaggedSet.has(k));
                const badge = firing
                  ? actionMeta
                  : { variant: "success" as const, label: "pass" };
                // Firing-card border picks up the action tone (2-tier
                // severity): red = blocked, amber = flagged/redacted. The
                // action badge label carries the flag-vs-redact distinction.
                const borderClass = firing
                  ? row.action === "blocked"
                    ? "border-destructive"
                    : "border-warning-500"
                  : "border-border";
                return (
                  <div
                    className={`flex items-start justify-between gap-3 rounded-md border ${borderClass} p-4`}
                    key={check.keys.join("-")}
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="type-label-14 text-foreground">
                        {check.label}
                      </span>
                      <span className="type-copy-14-tight text-pretty font-normal text-muted-foreground">
                        {firing
                          ? (reconciled?.message ?? detail.reason)
                          : check.passText}
                      </span>
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Request — provenance of the event: when it happened, which
              conversation it belongs to, and which API key was in use.
              Per CTO direction (2026-05-13): "should we use that space
              for info about the request/conversation?" Model / Provider /
              Endpoint dropped — "the model provider has nothing to do
              with the prompt injection attempt." */}
          <section className="flex flex-col gap-2">
            <h3 className="type-heading-16 m-0 text-foreground tracking-snug">
              <span className="inline-flex items-center gap-2">
                <ArrowLeftRight
                  aria-hidden
                  className="size-5 text-muted-foreground"
                  strokeWidth={1.75}
                />
                Request
              </span>
            </h3>
            <DetailList>
              <DetailRow
                label="Timestamp"
                value={
                  <Timestamp
                    className="font-mono text-foreground tabular-nums"
                    date={parseEventTime(row.time)}
                  />
                }
              />
              <DetailRow
                label="API key"
                value={(() => {
                  const parenIdx = row.key.indexOf(" (");
                  return (
                    <span className="font-mono tabular-nums">
                      {parenIdx === -1 ? (
                        <span className="text-foreground">{row.key}</span>
                      ) : (
                        <>
                          <span className="text-foreground">
                            {row.key.slice(0, parenIdx)}
                          </span>
                          <span className="text-muted-foreground">
                            {row.key.slice(parenIdx)}
                          </span>
                        </>
                      )}
                    </span>
                  );
                })()}
              />
              <DetailRow
                label="Conversation"
                value={
                  <span className="font-mono tabular-nums">
                    <TextLink
                      aria-label={`Open conversation ${conversationId}`}
                      onClick={openConversation}
                    >
                      {conversationId}
                    </TextLink>
                  </span>
                }
              />
              <DetailRow
                label="Request"
                value={
                  <span className="font-mono tabular-nums">
                    <TextLink
                      aria-label={`Open request ${requestId}`}
                      onClick={openRequest}
                    >
                      {requestId}
                    </TextLink>
                  </span>
                }
              />
            </DetailList>
          </section>
        </div>
      </DialogScrollBody>
    </>
  );
}
