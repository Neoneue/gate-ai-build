/* ─────────────────────────────────────────────────────────────────────────
 * Security — Recent events table + threat-event detail dialog
 *
 * Extracted from Security.tsx. Renders the sortable/paginated events table and
 * the threat-event detail dialog. Shared data/config comes from ./events-data;
 * only EventsTableSection is exported (the detail dialog is file-local).
 * ───────────────────────────────────────────────────────────────────────── */
import {
  ArrowLeftRight,
  FileText,
  NotebookPen,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
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
  DialogScrollFooter,
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { resolveRowsPerPage } from "@/components/ui/table-pagination";
import { TablePaginationFooter } from "@/components/ui/table-pagination-footer";
import { TextLink } from "@/components/ui/text-link";
import { Textarea } from "@/components/ui/textarea";
import { Timestamp } from "@/components/ui/timestamp";
import { UploadIcon } from "@/components/ui/upload";
import { API_KEY_SEED_ROWS } from "@/data/api-keys";
import { getEventFindingCopy } from "@/data/requests";
import { memberById } from "@/data/teams";
import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import type { CustomRange } from "@/lib/range";
import {
  DETECTION_CHECKS,
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
import {
  scopedSecurity,
  securityKeyNames,
} from "@/pages/teams/scoped-security";
import { useTeams } from "@/pages/teams/teams-store";
import { eventKeyName, useViewScope } from "@/pages/teams/view-scope";

/** Who owns the key an event ran on (MEMBER_ROWS id), for the Manager's
 *  by-user filter (PRD 8.4: "the event detail on the Security page filtered
 *  by user"). */
function eventOwnerId(row: EventRow): string | undefined {
  const name = eventKeyName(row.key);
  return API_KEY_SEED_ROWS.find((k) => k.name === name)?.ownerId;
}

/* Analyst verdict on a security event — one mutually exclusive state, not
 * three toggles. `unreviewed` is where every event starts. Declared here
 * rather than beside the dialog because the table's Status column reads the
 * same set. */
type EventVerdict = "unreviewed" | "confirmed" | "invalid";

const VERDICT_LABEL: Record<EventVerdict, string> = {
  unreviewed: "Unreviewed",
  confirmed: "Confirmed",
  invalid: "Invalid",
};

// Confirmation copy per verdict. `unreviewed` is a revert, so it's worded as
// one rather than as a fresh decision.
const VERDICT_TOAST: Record<EventVerdict, string> = {
  unreviewed: "Event returned to unreviewed",
  confirmed: "Event confirmed as a real threat",
  invalid: "Event marked as invalid",
};

// Badge variant per verdict — text comes from VERDICT_LABEL so the modal
// Select and the table column can never disagree on wording.
const VERDICT_BADGE: Record<EventVerdict, "neutral" | "success" | "warning"> = {
  unreviewed: "neutral",
  confirmed: "success",
  invalid: "warning",
};

/* Row identity for the verdict map. `requestId` alone is NOT unique — one
 * request can raise two events (req_8389e4 raises both a PII and a credential
 * event), so the type is part of the key. */
const verdictKey = (row: EventRow) => `${row.requestId}-${row.type}`;

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
  const [userFilter, setUserFilter] = useState("all");
  // Which events this viewer may see (scoped-security.ts): Admin all, a
  // Manager their team's users', a Member their own keys'.
  const scope = useViewScope();
  const teams = useTeams();
  const visibleKeyNames = securityKeyNames(scope);
  const scopedRows = useMemo(
    () =>
      visibleKeyNames
        ? EVENT_ROWS.filter((r) => visibleKeyNames.has(eventKeyName(r.key)))
        : EVENT_ROWS,
    [visibleKeyNames]
  );
  const keyOptions = useMemo(
    () => [...new Set(scopedRows.map((r) => r.key))],
    [scopedRows]
  );
  // Manager only: the team's members as a by-user filter.
  const userOptions = scope.managedTeam
    ? scope.managedTeam.memberIds
        .map((id) => memberById(id))
        .filter((m): m is NonNullable<typeof m> => m !== undefined)
    : [];
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
  const [draftUserFilter, setDraftUserFilter] = useState("all");
  const activeFilterCount = [type, action, keyFilter, userFilter].filter(
    (v) => v !== "all"
  ).length;
  const draftActiveFilterCount = [
    draftType,
    draftAction,
    draftKeyFilter,
    draftUserFilter,
  ].filter((v) => v !== "all").length;
  // Seed draft ← committed in the open handler (opening is a user event, not
  // derived state). Committed filters can't change while the modal is open
  // (Apply closes it), so this is the only moment a re-seed is needed.
  const openFilters = useCallback(() => {
    setDraftType(type);
    setDraftAction(action);
    setDraftKeyFilter(keyFilter);
    setDraftUserFilter(userFilter);
    setFiltersOpen(true);
  }, [type, action, keyFilter, userFilter]);
  // Reset clears the DRAFT only (staged); committed state is untouched until
  // Apply.
  const resetFilters = useCallback(() => {
    setDraftType("all");
    setDraftAction("all");
    setDraftKeyFilter("all");
    setDraftUserFilter("all");
  }, []);
  const applyFilters = useCallback(() => {
    setType(draftType);
    setAction(draftAction);
    setKeyFilter(draftKeyFilter);
    setUserFilter(draftUserFilter);
    setFiltersOpen(false);
  }, [draftType, draftAction, draftKeyFilter, draftUserFilter]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("25");
  // Row-click drill-in — selectedRow doubles as the dialog `open` signal.
  // Closing sets it back to null. Index carried alongside so the modal
  // can derive stable per-row variants (provider/model/tokens/latency).
  const [selectedRow, setSelectedRow] = useState<EventRow | null>(null);
  // Analyst verdicts, keyed by verdictKey(row). Owned HERE, not in the dialog
  // body, because the table's Status badge has to survive the dialog
  // unmounting — closing the modal sets selection → null, which would take
  // the verdict with it if the state lived inside. Mock UI: in-memory for this
  // component's session, no backend.
  const [verdicts, setVerdicts] = useState<Record<string, EventVerdict>>({});
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
  const resetKey = `${range}|${customRange?.from}|${customRange?.to}|${query}|${type}|${keyFilter}|${action}|${userFilter}`;
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scopedRows.filter((r) => {
      if (type !== "all" && r.type !== type) {
        return false;
      }
      if (keyFilter !== "all" && r.key !== keyFilter) {
        return false;
      }
      if (userFilter !== "all" && eventOwnerId(r) !== userFilter) {
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
  }, [query, type, keyFilter, action, userFilter, scopedRows]);

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
  const rangeTotal =
    scopedSecurity(scope, range, customRange, teams)?.findings ??
    eventsTotal(range, customRange);
  const scaledTotal =
    scopedRows.length === 0
      ? 0
      : Math.round(rangeTotal * (filtered.length / scopedRows.length));
  const perPage = resolveRowsPerPage(rowsPerPage, scaledTotal);
  // Cap the rendered rows to `scaledTotal` — at low-volume ranges (e.g. 24H
  // ≈ 12 events) the 16-row sample is larger than the actual total, so an
  // uncapped slice would render more rows than the footer's "of N" claims.
  const pageRows = sortedRows
    .slice((page - 1) * perPage, page * perPage)
    .slice(0, Math.max(0, scaledTotal - (page - 1) * perPage));

  return (
    <>
      <div className="mt-2 flex flex-col gap-4">
        {/* Recent security events — section header on the page background, mirroring
          Requests / AuditTrail. Search + filters + Export live here as
          page-level section controls, so they always render (a query that
          returns zero results never hides them). isEmpty governs only the
          Card interior below. */}
        <div className="flex flex-col gap-4">
          <SectionTitle>Recent security events</SectionTitle>
          {/* Container queries, not viewport ones — same conversion as
              RequestsTable. `<main>` declares `@container`, so `@2xl:`
              (672px inline-size) reads the column the toolbar lives in
              rather than the window, which the Ask AI panel narrows
              without touching. Below it: search full-width on row 1, the
              two buttons splitting row 2 evenly via `flex-1`. */}
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              ariaLabel="Search events"
              className="@2xl:w-auto w-full min-w-0 @2xl:flex-1"
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
              className="@2xl:flex-none flex-1 border-border bg-card text-foreground"
              onClick={openFilters}
              size="default"
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

            <Button
              className="@2xl:flex-none flex-1"
              size="default"
              type="button"
              variant="outline"
            >
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
              <DialogTitle className="type-heading-20 text-foreground">
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
                  className="w-full border-border bg-card text-foreground"
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
                  className="w-full border-border bg-card text-foreground"
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
                  className="w-full border-border bg-card text-foreground"
                  id="filter-key"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All keys</SelectItem>
                  {keyOptions.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {userOptions.length > 0 ? (
              <div className="flex flex-col gap-2">
                <Label className="type-label-14 text-muted-foreground">
                  User
                </Label>
                <Select
                  onValueChange={setDraftUserFilter}
                  value={draftUserFilter}
                >
                  <SelectTrigger
                    aria-label="User"
                    className="w-full border-border bg-card text-foreground"
                    id="filter-user"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All users</SelectItem>
                    {userOptions.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <DialogFooter className="flex-row items-center justify-between sm:justify-between">
              <Button
                disabled={draftActiveFilterCount === 0}
                onClick={resetFilters}
                size="default"
                type="button"
                variant="ghost"
              >
                Reset
              </Button>
              <div className="flex items-center gap-2">
                <DialogClose
                  render={
                    <Button size="default" type="button" variant="outline" />
                  }
                >
                  Cancel
                </DialogClose>
                <Button onClick={applyFilters} size="default" type="button">
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
                    {/* Status carries the analyst verdict, which is session
                        state rather than row data — there is no sort value for
                        it in eventSortValue, so it stays a plain head. */}
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((row, i) => {
                    const typeMeta = TYPE_META[row.type];
                    const actionMeta = ACTION_BADGE[row.action];
                    const TypeIcon = typeMeta.Icon;
                    const verdict = verdicts[verdictKey(row)] ?? "unreviewed";
                    return (
                      <TableRow
                        className="cursor-pointer transition-[background-color] duration-150 ease-out hover:bg-accent motion-reduce:transition-none"
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
                            className="type-mono-14 text-foreground"
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
                            className="type-mono-14 block max-w-full truncate text-foreground"
                            title={row.conversationId}
                          >
                            {row.conversationId}
                          </span>
                        </TableCell>
                        <TableCell className="type-mono-14 whitespace-nowrap">
                          <span className="text-foreground">
                            {row.key.split(" (")[0]}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant={actionMeta.variant}>
                            {actionMeta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant={VERDICT_BADGE[verdict]}>
                            {VERDICT_LABEL[verdict]}
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
        onVerdictChange={(value) => {
          if (selectedRow) {
            setVerdicts((prev) => ({
              ...prev,
              [verdictKey(selectedRow)]: value,
            }));
          }
        }}
        selection={selectedRow}
        verdict={
          selectedRow
            ? (verdicts[verdictKey(selectedRow)] ?? "unreviewed")
            : "unreviewed"
        }
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
  verdict,
  onVerdictChange,
}: {
  selection: EventRow | null;
  onOpenChange: (open: boolean) => void;
  verdict: EventVerdict;
  onVerdictChange: (value: EventVerdict) => void;
}) {
  // Base UI focuses the first tabbable descendant on open. In this modal that
  // is a TextLink near the BOTTOM of the scroll body, so the default would
  // scroll the body to its end before the user reads a word. Focus the popup
  // itself instead (it carries tabIndex={-1}); Base UI passes preventScroll
  // when the focus target IS the popup, so the body opens at the top.
  const popupRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog onOpenChange={onOpenChange} open={!!selection}>
      <DialogScrollContent
        className="sm:max-w-[640px]"
        initialFocus={popupRef}
        ref={popupRef}
      >
        {selection ? (
          <ThreatEventDetailBody
            onVerdictChange={onVerdictChange}
            row={selection}
            verdict={verdict}
          />
        ) : null}
      </DialogScrollContent>
    </Dialog>
  );
}

function ThreatEventDetailBody({
  row,
  verdict,
  onVerdictChange,
}: {
  row: EventRow;
  verdict: EventVerdict;
  onVerdictChange: (value: EventVerdict) => void;
}) {
  const navigate = useNavigate();
  const actionMeta = ACTION_BADGE[row.action];
  const detail = getEventDetail(row);
  const requestId = row.requestId;
  const conversationId = row.conversationId;
  const openConversation = () =>
    navigate(`/conversations?open=${conversationId}`);
  const openRequest = () => navigate(`/messages-findings/${requestId}`);
  const flaggedSet = new Set(detail.flagged);

  // Reconcile against the matching Requests row so the message + detection
  // copy is identical to what the Requests findings panel shows for the same
  // request. Null when no request row matches (sparse mock) — falls back to
  // the standalone per-type copy in TYPE_DETAILS.
  const reconciled = getEventFindingCopy(requestId, row.type);

  // Analyst verdict — one mutually exclusive state, owned by the footer
  // Select (replaces the former title-row flag button + "Invalid" badge,
  // 2026-07-29). Lifted to EventsTableSection so the table's Status badge
  // outlives this component: `unreviewed` is still the default, but the value
  // now arrives as a prop and persists across close/reopen.

  // Analyst note — a free-text annotation on the event, authored in a nested
  // dialog that opens OVER this one (the event detail stays behind it).
  // `note` is the committed value; `noteDraft` is what the textarea binds to,
  // so Close can discard an edit without touching what was saved. Mock UI:
  // there is no backend, and this state (unlike `verdict`) still unmounts with
  // the dialog.
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const noteDraftIsEmpty = noteDraft.trim().length === 0;

  // Both entry and exit reseed the draft from the committed note: opening
  // restores a previously saved note, closing discards an uncommitted edit.
  const handleNoteOpenChange = (open: boolean) => {
    setNoteDraft(note);
    setNoteOpen(open);
  };

  const handleSaveNote = () => {
    setNote(noteDraft);
    setNoteOpen(false);
    toast.success("Note added to security event.");
  };

  return (
    <>
      <DialogScrollHeader>
        <DialogTitleBlock titleAriaLabel={`Security event ${requestId}`}>
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
            <div className="flex flex-col gap-2">
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
              with title + verdict badge. Only a firing check adds a second
              line explaining why; a passing check is title + badge alone. */}
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
                      {firing && (
                        <span className="type-copy-14 text-pretty font-normal text-muted-foreground">
                          {reconciled?.message ?? detail.reason}
                        </span>
                      )}
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
                    className="type-mono-14 text-foreground"
                    date={parseEventTime(row.time)}
                  />
                }
              />
              <DetailRow
                label="API key"
                value={(() => {
                  const parenIdx = row.key.indexOf(" (");
                  return (
                    <span className="type-mono-14">
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
                  <span className="type-mono-14">
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
                  <span className="type-mono-14">
                    <TextLink
                      aria-label={`Open message ${requestId}`}
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

      <DialogScrollFooter className="justify-between">
        <Label className="type-label-14" htmlFor="event-verdict">
          Mark event
        </Label>
        <div className="flex items-center gap-3">
          {/* Note action — 32px (`sm`) so it matches the verdict trigger's own
              height. Both are `size="sm"`: since the 2026-08-10 Select realign
              (`lg` renamed to `default`, old 32px `default` deleted) the Select
              scale is sm 32 / default 36, matching Button exactly. `sm` is the
              only step that holds this pair at 32px. The trigger's type moved
              14px -> 12px with that step — height parity across a 12px-gap pair
              reads louder than the type delta, and the recipe is the recipe. */}
          <Button
            onClick={() => handleNoteOpenChange(true)}
            size="sm"
            type="button"
            variant="outline"
          >
            <NotebookPen
              aria-hidden
              data-icon="inline-start"
              strokeWidth={1.75}
            />
            Add note
          </Button>
          <Select
            onValueChange={(next) => {
              const value = next as EventVerdict;
              onVerdictChange(value);
              toast.success(VERDICT_TOAST[value]);
            }}
            value={verdict}
          >
            <SelectTrigger
              aria-label="Mark event"
              className="w-40"
              id="event-verdict"
              size="sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unreviewed">
                {VERDICT_LABEL.unreviewed}
              </SelectItem>
              <SelectItem value="confirmed">
                {VERDICT_LABEL.confirmed}
              </SelectItem>
              <SelectItem value="invalid">{VERDICT_LABEL.invalid}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </DialogScrollFooter>

      {/* Add a note — nested dialog. Opens over the event detail, which stays
          mounted and open behind it. `nestedBackdrop` is what dims and blurs
          that parent surface: Base UI's `Dialog.Backdrop` dedups when dialogs
          nest, so only the outermost one reaches the DOM and the inner dialog
          would otherwise open over an undimmed modal. Single-purpose surface
          holding one control, so it takes the compact (16px) density. */}
      <Dialog onOpenChange={handleNoteOpenChange} open={noteOpen}>
        <DialogContent className="sm:max-w-lg" density="compact" nestedBackdrop>
          <DialogHeader>
            <DialogTitle>Add a note</DialogTitle>
          </DialogHeader>

          {/* Fixed 140px well. The primitive ships `field-sizing-content` +
              `min-h-16`, which auto-grows with the text; `field-sizing-fixed`
              + `h-35` pin it and `overflow-y-auto` scrolls the overflow
              instead. Sizing utilities only — the surface, radius, and border
              stay the primitive's. */}
          <Textarea
            aria-label="Note"
            className="field-sizing-fixed h-35 resize-none overflow-y-auto"
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Write a note here about the event you marked."
            value={noteDraft}
          />

          <DialogFooter className="flex-row items-center justify-between sm:justify-between">
            <Button
              disabled={noteDraftIsEmpty}
              onClick={() => setNoteDraft("")}
              size="default"
              type="button"
              variant="ghost"
            >
              Clear
            </Button>
            <div className="flex items-center gap-2">
              <DialogClose
                render={
                  <Button size="default" type="button" variant="outline" />
                }
              >
                Close
              </DialogClose>
              <Button onClick={handleSaveNote} size="default" type="button">
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
