import { CreditCard, Info, KeyRound, TriangleAlert } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { VendorAvatar } from "@/components/icons/vendor-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RowActionButton } from "@/components/ui/row-action-button";
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
import { TablePaginationFooter } from "@/components/ui/table-pagination-footer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UploadIcon } from "@/components/ui/upload";
import { isByokKey, REQUEST_ROWS_ALL, requestRowId } from "@/data/requests";
import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import {
  conversationTitle,
  GUARDRAIL_BADGE,
  MODEL_FILTER_OPTIONS,
  RANGE_ROWS,
  requestSortValue,
  responseLabel,
  responseVariant,
} from "./data";
import { RequestDetailDialog } from "./RequestDetailModal";
import type { CustomRange, RangeKey, RequestRow } from "./types";

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

/* ─── Requests log table ─────────────────────────────────────────────────── */

export function RequestsTableSection({
  range,
  customRange,
}: {
  range: RangeKey;
  customRange: CustomRange | null;
}) {
  // Looked up per render. Pill change → new rows + new total; page resets
  // so a deep-paged All state doesn't carry over into a 24H view that
  // doesn't have those pages. When the user picks a custom range, the
  // total comes from buildCustomHeroView so the pagination footer stays
  // in lock-step with the hero card's headline number.
  const rows = RANGE_ROWS[range] ?? REQUEST_ROWS_ALL;
  const [model, setModel] = useState("all");
  const [keyId, setKeyId] = useState("all");
  // Response + guardrail filters are independent (split out of the single
  // status filter per CTO direction). 'slow' in the response filter is an
  // alias for `row.slow === true` rather than a status value.
  const [responseFilter, setResponseFilter] = useState("all");
  const [guardrailFilter, setGuardrailFilter] = useState("all");
  // PROTOTYPE — Filters dialog. Collapses the four section-header
  // dropdowns (Model/Key/Response/Guardrail) into one modal Dialog to
  // de-cram the toolbar row; the modal gives each Select room to breathe.
  // Reversible: drop this state, restore the inline <Select>s, remove the
  // Filters Dialog block and the SlidersHorizontalIcon import.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = [
    model,
    keyId,
    responseFilter,
    guardrailFilter,
  ].filter((v) => v !== "all").length;
  // Staged-Apply drafts. The modal's <Select>s bind to these, never to the
  // committed state, so changing a select doesn't touch the table. Drafts
  // re-sync from committed every time the modal opens (see effect below), so
  // an abandoned draft (Cancel / X / Esc / overlay) never leaks into a later
  // open. Apply commits draft → committed; Cancel just closes.
  const [draftModel, setDraftModel] = useState("all");
  const [draftKeyId, setDraftKeyId] = useState("all");
  const [draftResponseFilter, setDraftResponseFilter] = useState("all");
  const [draftGuardrailFilter, setDraftGuardrailFilter] = useState("all");
  const draftActiveFilterCount = [
    draftModel,
    draftKeyId,
    draftResponseFilter,
    draftGuardrailFilter,
  ].filter((v) => v !== "all").length;
  // Seed draft ← committed in the open handler (opening is a user event, not
  // derived state). Committed filters can't change while the modal is open
  // (Apply closes it), so this is the only moment a re-seed is needed —
  // avoids the redundant double-render an effect would cause on every open.
  const openFilters = useCallback(() => {
    setDraftModel(model);
    setDraftKeyId(keyId);
    setDraftResponseFilter(responseFilter);
    setDraftGuardrailFilter(guardrailFilter);
    setFiltersOpen(true);
  }, [model, keyId, responseFilter, guardrailFilter]);
  // Reset clears the DRAFT only (staged); committed state is untouched until
  // Apply.
  const resetFilters = useCallback(() => {
    setDraftModel("all");
    setDraftKeyId("all");
    setDraftResponseFilter("all");
    setDraftGuardrailFilter("all");
  }, []);
  const applyFilters = useCallback(() => {
    setModel(draftModel);
    setKeyId(draftKeyId);
    setResponseFilter(draftResponseFilter);
    setGuardrailFilter(draftGuardrailFilter);
    setFiltersOpen(false);
  }, [draftModel, draftKeyId, draftResponseFilter, draftGuardrailFilter]);
  const [rowsPerPage, setRowsPerPage] = useState("25");
  const pageScopeKey =
    range === "custom"
      ? `${range}:${customRange?.from.getTime() ?? "none"}:${customRange?.to.getTime() ?? "none"}`
      : range;
  const [paging, setPaging] = useState<{ scopeKey: string; page: number }>(
    () => ({
      scopeKey: pageScopeKey,
      page: 1,
    })
  );
  const page = paging.scopeKey === pageScopeKey ? paging.page : 1;
  const setPage = useCallback(
    (next: number) => {
      setPaging({ scopeKey: pageScopeKey, page: next });
    },
    [pageScopeKey]
  );
  // Row-click drill-in now navigates to the /messages-findings/:id page
  // (URL-addressable, shareable, multi-tab — the GitHub model). The modal
  // below is kept for `?open=` deep-links (e.g. Security events) but is no
  // longer the row-click target.
  const navigate = useNavigate();
  const openRow = (row: RequestRow) =>
    navigate(`/messages-findings/${requestRowId(row)}`);

  // `selectedRow` still drives the (stored) modal for `?open=` deep-links.
  const [selectedRow, setSelectedRow] = useState<RequestRow | null>(null);

  // Deep-link support: ?open=req_* opens the matching row's modal. Mirrors
  // the Conversations page pattern — a useState guard (prevOpenId) gates the
  // sync so the effect is URL-driven, not state-driven. Without the guard,
  // closing the modal (which clears selectedRow) and the URL strip (which
  // happens in onOpenChangeComplete) race on different renders and the modal
  // re-opens itself.
  const [searchParams, setSearchParams] = useSearchParams();
  const openId = searchParams.get("open");
  const [prevOpenId, setPrevOpenId] = useState<string | null>(null);
  if (openId !== prevOpenId) {
    setPrevOpenId(openId);
    if (openId) {
      const match = REQUEST_ROWS_ALL.find((r) => r.requestId === openId);
      if (match) {
        setSelectedRow(match);
      }
    }
  }

  // Two independent filters, ANDed. `slow` in the response filter is the
  // facet alias (matches `row.slow === true`); the other values match
  // `row.status` directly. Guardrail filter matches `row.guardrail`.
  const filteredRows = useMemo(
    () =>
      rows.filter((r) => {
        const matchesResponse =
          responseFilter === "all"
            ? true
            : responseFilter === "slow"
              ? r.slow === true
              : r.status === responseFilter;
        const matchesGuardrail =
          guardrailFilter === "all" ? true : r.guardrail === guardrailFilter;
        const matchesModel = model === "all" ? true : r.model === model;
        const matchesKey = keyId === "all" ? true : r.keyId === keyId;
        return (
          matchesResponse && matchesGuardrail && matchesModel && matchesKey
        );
      }),
    [rows, responseFilter, guardrailFilter, model, keyId]
  );

  // Click-to-sort on column headers. No sort by default → rows stay in their
  // authored (chronological) order; picking a column sorts client-side.
  const { sort, toggle: toggleSort } = useTableSort();
  const sortedRows = useMemo(
    () => sortRows(filteredRows, sort, requestSortValue),
    [filteredRows, sort]
  );

  // Page the visible rows by the footer's rows-per-page selector. Without this
  // the table rendered every row and the 10/25/50/100 control did nothing.
  const perPage = Number(rowsPerPage) || sortedRows.length || 1;
  const pagedRows = useMemo(
    () =>
      sortedRows.slice((page - 1) * perPage, (page - 1) * perPage + perPage),
    [sortedRows, page, perPage]
  );

  const isEmpty = filteredRows.length === 0;

  return (
    <>
      <div className="mt-2 flex flex-col gap-4">
        {/* Recent requests — section header on the page background, mirroring
          AuditTrail's EventLog. The search + filter set live here as
          page-level section controls, so they always render (a query that
          returns zero results never hides them). isEmpty governs only the
          Card interior below. */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionTitle>Recent messages</SectionTitle>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SearchInput
              ariaLabel="Search messages"
              className="min-w-0 flex-1 shrink"
              placeholder="Search message…"
              surface="elevated"
            />

            {/* PROTOTYPE — four section-header filters collapsed into one
              modal Dialog to de-cram the toolbar row. The <Select>s are
              moved verbatim (same value/onValueChange + option lists), each
              laid out as a labeled full-width row with room to breathe.
              Active-count badge on the trigger; Reset clears all four.
              Reversible: restore the inline <Select>s and delete this Dialog. */}
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
            <Dialog onOpenChange={setFiltersOpen} open={filtersOpen}>
              <DialogContent className="w-full gap-4 sm:max-w-[440px]">
                <DialogHeader>
                  <DialogTitle className="type-heading-18 text-foreground">
                    Filters
                  </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-2">
                  <Label className="type-label-14 text-neutral-600">
                    Model
                  </Label>
                  <Select onValueChange={setDraftModel} value={draftModel}>
                    <SelectTrigger
                      aria-label="Model"
                      className="w-full border-border bg-card font-normal text-foreground"
                      id="filter-model"
                    >
                      <SelectValue placeholder="Model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All models</SelectItem>
                      {MODEL_FILTER_OPTIONS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          <VendorAvatar decorative vendor={m.vendor} />
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="type-label-14 text-neutral-600">Key</Label>
                  <Select onValueChange={setDraftKeyId} value={draftKeyId}>
                    <SelectTrigger
                      aria-label="Key"
                      className="w-full border-border bg-card font-normal text-foreground"
                      id="filter-key"
                    >
                      <SelectValue placeholder="Key" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All keys</SelectItem>
                      <SelectItem value="prod-web">prod-web</SelectItem>
                      <SelectItem value="prod-agent">prod-agent</SelectItem>
                      <SelectItem value="development">development</SelectItem>
                      <SelectItem value="openclaw">openclaw</SelectItem>
                      <SelectItem value="hermes-agent">hermes-agent</SelectItem>
                      <SelectItem value="nova-chat">nova-chat</SelectItem>
                      <SelectItem value="test-key">test-key</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="type-label-14 text-neutral-600">
                    Response
                  </Label>
                  <Select
                    onValueChange={setDraftResponseFilter}
                    value={draftResponseFilter}
                  >
                    <SelectTrigger
                      aria-label="Response"
                      className="w-full border-border bg-card font-normal text-foreground"
                      id="filter-response"
                    >
                      <SelectValue placeholder="Response" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All responses</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="slow">{"Slow > 10s"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="type-label-14 text-neutral-600">
                    Guardrail
                  </Label>
                  <Select
                    onValueChange={setDraftGuardrailFilter}
                    value={draftGuardrailFilter}
                  >
                    <SelectTrigger
                      aria-label="Guardrail"
                      className="w-full border-border bg-card font-normal text-foreground"
                      id="filter-guardrail"
                    >
                      <SelectValue placeholder="Guardrail" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All guardrails</SelectItem>
                      <SelectItem value="allow">Allow</SelectItem>
                      <SelectItem value="flagged">Flagged</SelectItem>
                      <SelectItem value="redacted">Redacted</SelectItem>
                      <SelectItem value="block">Block</SelectItem>
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

            <Button
              className="ml-auto"
              size="sm"
              type="button"
              variant="outline"
            >
              <UploadIcon aria-hidden data-icon="inline-start" size={16} />
              Export CSV
            </Button>
          </div>
        </div>

        <Card density="flush">
          {isEmpty ? (
            <TableEmptyState
              body="Individual messages routed through the gateway will appear here."
              title="No messages"
            />
          ) : (
            <>
              {/* Table */}
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
                      sortKey="status"
                    >
                      Status
                    </SortableTableHead>
                    <SortableTableHead
                      className="whitespace-nowrap"
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="guardrail"
                    >
                      Security
                    </SortableTableHead>
                    <SortableTableHead
                      className="whitespace-nowrap"
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="model"
                    >
                      Model
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
                      sortKey="keyId"
                    >
                      Key
                    </SortableTableHead>
                    <SortableTableHead
                      className="whitespace-nowrap"
                      numeric
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="inTokens"
                    >
                      In
                    </SortableTableHead>
                    <SortableTableHead
                      className="whitespace-nowrap"
                      numeric
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="outTokens"
                    >
                      Out
                    </SortableTableHead>
                    <SortableTableHead
                      className="whitespace-nowrap"
                      numeric
                      onSort={toggleSort}
                      sort={sort}
                      sortKey="latency"
                    >
                      Latency
                    </SortableTableHead>
                    <TableHead className="whitespace-nowrap text-right">
                      <span className="inline-flex items-center justify-end gap-1">
                        Cost
                        <Tooltip>
                          <TooltipTrigger
                            render={(props) => (
                              <span
                                {...props}
                                aria-label="About the Cost column"
                                className="-m-1 inline-flex cursor-help rounded-sm p-1 text-muted-foreground hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                              >
                                <Info
                                  aria-hidden
                                  className="size-4"
                                  strokeWidth={1.75}
                                />
                              </span>
                            )}
                          />
                          <TooltipContent className="max-w-sm p-2 text-left">
                            <span className="flex flex-col gap-2">
                              <span className="flex items-start gap-2">
                                <span className="flex shrink-0 items-center text-neutral-400 leading-5">
                                  <CreditCard
                                    aria-hidden
                                    className="size-3.5 shrink-0"
                                    strokeWidth={1.75}
                                  />
                                </span>
                                <span>
                                  <span className="font-medium">Gateway</span> -
                                  Billed by Gate AI; shows the exact charge.
                                </span>
                              </span>
                              <span className="flex items-start gap-2">
                                <span className="flex shrink-0 items-center text-neutral-400 leading-5">
                                  <KeyRound
                                    aria-hidden
                                    className="size-3.5 shrink-0"
                                    strokeWidth={1.75}
                                  />
                                </span>
                                <span>
                                  <span className="font-medium">BYOK</span>{" "}
                                  (Bring-your-own-key) - Billed directly by your
                                  provider.
                                </span>
                              </span>
                            </span>
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedRows.map((row, i) => {
                    const isMissing = row.inTokens === "—";
                    const numericCls = isMissing
                      ? "text-right whitespace-nowrap font-mono tabular-nums text-neutral-400"
                      : "text-right whitespace-nowrap font-mono tabular-nums text-foreground";
                    // Slow rows: leading amber TriangleAlert + neutral-900 (one step
                    // darker than the neutral-800 default). Same weight as non-slow rows
                    // so `tabular-nums` keeps the column tracks aligned — font-medium
                    // would widen the digits and leave the column ragged. The icon
                    // sits in a fixed-width slot reserved on every row (slow or not)
                    // so the digit column stays anchored at the cell's right edge
                    // regardless of slow state — value owns the alignment edge, icon
                    // qualifies it from the left.
                    const isSlow = row.slow && row.latency !== "—";
                    const latencyTextCls =
                      row.latency === "—"
                        ? "text-neutral-400"
                        : isSlow
                          ? "text-foreground"
                          : "text-foreground";
                    const conversationName = conversationTitle(
                      row.conversation
                    );
                    return (
                      <TableRow
                        className="cursor-pointer transition-colors duration-150 ease-out hover-fine:bg-neutral-50 motion-reduce:transition-none"
                        key={`${row.time}-${i}`}
                        // Mouse-only convenience: the keyboard/AT target is the real
                        // <a href> drill-in in the model cell (RowActionButton href).
                        // A <tr> can't legally carry role="button"/tabIndex.
                        onClick={() => openRow(row)}
                      >
                        <TableCell className="w-48 whitespace-nowrap">
                          {/* Absolute timestamp is the primary scan target — relative
                        ("just now", "3h ago") doesn't scale once the table
                        holds hundreds of rows. The relative phrasing lives in
                        a hover tooltip for the moments it's actually useful
                        (recent activity glance). `w-px` is the table-shrink-fit
                        idiom — the cell collapses to the content's intrinsic
                        width and the surrounding columns absorb the freed
                        space; without it the browser pads the column. */}
                          <Tooltip>
                            <TooltipTrigger
                              render={(props) => (
                                <span
                                  {...props}
                                  className="font-mono text-foreground text-sm tabular-nums"
                                >
                                  {row.day}, {row.time}
                                </span>
                              )}
                            />
                            <TooltipContent>{row.relative}</TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="w-28 whitespace-nowrap">
                          <Badge variant={responseVariant(row)}>
                            {responseLabel(row)}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-28 whitespace-nowrap">
                          <Badge
                            variant={GUARDRAIL_BADGE[row.guardrail].variant}
                          >
                            {row.guardrail}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-60 whitespace-nowrap">
                          <RowActionButton
                            aria-label={`Inspect ${row.code} message to ${row.model} at ${row.time}`}
                            href={`/messages-findings/${requestRowId(row)}`}
                          >
                            <VendorAvatar vendor={row.vendor} />
                            <span
                              className="truncate font-mono text-foreground text-sm"
                              title={row.model}
                            >
                              {row.model}
                            </span>
                          </RowActionButton>
                        </TableCell>
                        <TableCell className="max-w-[320px] whitespace-nowrap">
                          {conversationName ? (
                            <>
                              <span
                                className="type-copy-14 block truncate text-foreground"
                                title={conversationName}
                              >
                                {conversationName}
                              </span>
                              <span className="block font-mono text-muted-foreground text-xs">
                                {row.conversation}
                              </span>
                            </>
                          ) : (
                            <span
                              className="block max-w-full truncate font-mono text-foreground text-sm tabular-nums"
                              title={row.conversation}
                            >
                              {row.conversation}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-mono">
                          <span className="text-foreground">{row.keyId}</span>
                        </TableCell>
                        <TableCell className={numericCls}>
                          {row.inTokens}
                        </TableCell>
                        <TableCell className={numericCls}>
                          {row.outTokens}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-mono tabular-nums">
                          <span className="inline-flex items-center justify-end gap-1">
                            {isSlow ? (
                              <TriangleAlert
                                aria-hidden
                                className="size-3.5 shrink-0 text-warning-600"
                                strokeWidth={1.75}
                              />
                            ) : (
                              <span aria-hidden className="size-3.5 shrink-0" />
                            )}
                            {isSlow ? (
                              <span className="sr-only">slow</span>
                            ) : null}
                            <span className={latencyTextCls}>
                              {row.latency}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-mono tabular-nums">
                          {isByokKey(row.keyId) ? (
                            <span className="inline-flex items-center justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger
                                  render={(props) => (
                                    <span
                                      {...props}
                                      aria-label="Billed by your provider (BYOK)"
                                      className="inline-flex cursor-help rounded-sm text-neutral-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                                    >
                                      <KeyRound
                                        aria-hidden
                                        className="size-3.5 shrink-0"
                                        strokeWidth={1.75}
                                      />
                                    </span>
                                  )}
                                />
                                <TooltipContent>
                                  Billed by your provider (BYOK)
                                </TooltipContent>
                              </Tooltip>
                              <span className="text-neutral-400">—</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger
                                  render={(props) => (
                                    <span
                                      {...props}
                                      aria-label="Billed by Gate (PAYG)"
                                      className="inline-flex cursor-help rounded-sm text-neutral-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                                    >
                                      <CreditCard
                                        aria-hidden
                                        className="size-3.5 shrink-0"
                                        strokeWidth={1.75}
                                      />
                                    </span>
                                  )}
                                />
                                <TooltipContent>
                                  Billed by Gate (PAYG)
                                </TooltipContent>
                              </Tooltip>
                              <span
                                className={
                                  isMissing
                                    ? "text-neutral-400"
                                    : "text-foreground"
                                }
                              >
                                {row.cost}
                              </span>
                            </span>
                          )}
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
                total={sortedRows.length}
              />
            </>
          )}
        </Card>
      </div>
      <RequestDetailDialog
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRow(null);
          }
        }}
        onOpenChangeComplete={(open) => {
          // Strip ?open= AFTER the exit animation finishes — stripping it
          // inside onOpenChange triggers a router re-render mid-animation,
          // which reads as a flicker. Base UI fires this once the close
          // transition has fully completed. Same pattern as Conversations.
          if (!open && searchParams.has("open")) {
            const next = new URLSearchParams(searchParams);
            next.delete("open");
            setSearchParams(next, { replace: true });
          }
        }}
        row={selectedRow}
      />
    </>
  );
}
