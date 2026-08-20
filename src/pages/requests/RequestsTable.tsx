import { CreditCard, Info, KeyRound, TriangleAlert } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { modelName } from "@/data/models";
import {
  isByokKey,
  keyLabel,
  REQUEST_ROWS_ALL,
  requestIdLabel,
  requestRowId,
} from "@/data/requests";
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
import { messagePreview } from "./message-preview";
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
  // Row-click drill-in navigates to the /messages-findings/:id page
  // (URL-addressable, shareable, multi-tab — the GitHub model).
  const navigate = useNavigate();
  const openRow = (row: RequestRow) =>
    navigate(`/messages-findings/${requestRowId(row)}`);

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
  // `message` is resolved here rather than inside requestSortValue so the
  // request-body module stays out of ./data — see message-preview.ts. Every
  // other key falls through to the shared accessor.
  const sortValue = useCallback((row: RequestRow, key: string) => {
    if (key === "message") {
      return messagePreview(row) ?? null;
    }
    return requestSortValue(row, key);
  }, []);
  const sortedRows = useMemo(
    () => sortRows(filteredRows, sort, sortValue),
    [filteredRows, sort, sortValue]
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
    <div className="mt-2 flex flex-col gap-4">
      {/* Recent requests — section header on the page background, mirroring
          AuditTrail's EventLog. The search + filter set live here as
          page-level section controls, so they always render (a query that
          returns zero results never hides them). isEmpty governs only the
          Card interior below. */}
      <div className="flex flex-col gap-4">
        <SectionTitle>Recent messages</SectionTitle>
        {/* Container queries, not viewport ones. The Ask AI panel narrows this
            column without touching the viewport, so `md:` kept all three
            controls on one line and crushed the search field (148px at a
            1024 viewport with the panel open). `<main>` declares `@container`,
            so `@2xl:` (672px inline-size) reads the column the toolbar
            actually lives in: below it the search takes row 1 and the two
            buttons split row 2 via `flex-1`. */}
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            ariaLabel="Search messages"
            className="@2xl:w-auto w-full min-w-0 @2xl:flex-1"
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
          <Dialog onOpenChange={setFiltersOpen} open={filtersOpen}>
            <DialogContent className="w-full gap-4 sm:max-w-[440px]">
              <DialogHeader>
                <DialogTitle className="type-heading-18 text-foreground">
                  Filters
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-2">
                <Label className="type-label-14 text-muted-foreground">
                  Model
                </Label>
                <Select onValueChange={setDraftModel} value={draftModel}>
                  <SelectTrigger
                    aria-label="Model"
                    className="w-full border-border bg-card text-foreground"
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
                <Label className="type-label-14 text-muted-foreground">
                  Key
                </Label>
                <Select onValueChange={setDraftKeyId} value={draftKeyId}>
                  <SelectTrigger
                    aria-label="Key"
                    className="w-full border-border bg-card text-foreground"
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
                <Label className="type-label-14 text-muted-foreground">
                  Response
                </Label>
                <Select
                  onValueChange={setDraftResponseFilter}
                  value={draftResponseFilter}
                >
                  <SelectTrigger
                    aria-label="Response"
                    className="w-full border-border bg-card text-foreground"
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
                <Label className="type-label-14 text-muted-foreground">
                  Guardrail
                </Label>
                <Select
                  onValueChange={setDraftGuardrailFilter}
                  value={draftGuardrailFilter}
                >
                  <SelectTrigger
                    aria-label="Guardrail"
                    className="w-full border-border bg-card text-foreground"
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

          <Button
            className="@2xl:ml-auto @2xl:flex-none flex-1"
            size="default"
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
            {/* Column widths are declared, not negotiated. This table once ran
                `table-auto` with no widths, so the browser sized every column
                from content and silently squeezed whichever ones had
                shrinkable text.

                MEASURED BASIS (2026-08-19, 25 rows). "Need" is the width at
                which nothing clips, padding included. Obtained by cloning the
                table, setting `table-layout:auto; width:max-content`, and
                stripping every clamp (max-width / overflow / text-overflow /
                fixed widths) plus the `sr-only` nodes — then cross-checked
                against an independent per-text-node probe. Both methods agree
                on every non-elastic column.

                `need` is the measurement and does not move. `%` and `px` are
                the current declaration, re-derived on 2026-08-20 after the
                four narrowing steps below; `px` is `% / 94 * 1484`, since the
                declared percentages sum to 94 (see the note under the
                history).

                  col            %      px    need   slack
                  Time          9.5    150    138     +12
                  Status        6.0     95     92      +3
                  Security      6.5    103    100      +3
                  Model        12.0    189    156     +33
                  Message      15.5    245   4501  elastic
                  Conversation 15.5    245    401  elastic
                  Key           8.5    134    125      +9
                  Tokens        8.5    134    121     +13
                  Latency       6.5    103     92     +11
                  Cost          5.5     87     74     +13

                DO NOT re-derive these by eye. Four separate measurement
                artifacts produced four wrong answers before the clone method:
                `th.scrollWidth` can never exceed its own box (reported Cost as
                0 slack), `block` children stretch to fill their container
                (reported Model and Tokens as 0), `sr-only` spans are 1px by
                design (reported Model and Latency as clipping), and
                `SortableTableHead`'s `max-w-1/2` clamps the live sort button
                (under-reports header need). Re-measure with the clone, or
                trust the table above.

                Message and Conversation are the only columns allowed to
                truncate — the only two whose content is unbounded. Message
                needs 4501px, which no layout satisfies. Conversation needs
                401px, so it is the one elastic column that COULD stop
                truncating if it were ever given the room.

                Tokens In/Out is HEADER-bound: its label needs ~97px against a
                widest value of ~68px, so the words size it, not the data.
                Shortening the header to "Tokens" would free ~44px, at the cost
                of not stating which stacked line is which.

                `min-w` history: 1440 -> 1780 (Message added) -> 1672 (Tokens
                In and Out merged into one stacked column) -> 1656 (~16px of
                slack off Key) -> 1580, halving the genuinely dead space the
                measurement exposed: Model carried 93px and Tokens 61px, and
                half of each came off the table width. -> 1564 (2026-08-20):
                another point off Tokens (9.5% -> 8.5%) and the same ~16px off
                the floor, so the other nine columns keep their pixel widths
                rather than absorbing the slack. Tokens lands at ~133px, still
                clear of the ~97px its header needs. -> 1532 (same day): a
                point off each of Message and Conversation (16.5% -> 15.5%)
                and ~32px off the floor, to cut side-scrolling further. Those
                two are the designated truncating columns, so the cost lands
                where it was always meant to: each drops ~16px, to ~245px.
                Conversation is now further from the 401px that would stop it
                truncating. -> 1516 (same day): half a point off Status
                (6.5% -> 6.0%) and Security (7.0% -> 6.5%). A FULL point was
                asked for and is not available — a point is ~15px at this
                floor against 11px of measured slack, so 1% off each would
                clip both by ~5px. Half a point takes 16px and leaves +3px on
                each, which is the tightest margin in the table. These two are
                now spent; the remaining dead space is Model (+49) and Cost
                (+29). -> 1484 (same day): a point off each of those two
                (Model 13% -> 12%, Cost 6.5% -> 5.5%) and the whole ~32px off
                the floor. 1484 is not a rounded guess: it is the floor at
                which a column that was NOT narrowed keeps its exact pixel
                width (Time is 9.5/94 * 1484 = 149.96px), and it lands on the
                4px grid. Model goes to 189px (+33) and Cost to 87px (+13),
                both still comfortable, and every other column is unmoved.

                The eight non-elastic columns need 898px in total, so at the
                1226px content column 328px remains for Message +
                Conversation — that, not tuning, is why this table
                side-scrolls. (This read 998px / 228px until 2026-08-20; the
                need column above sums to 898 and always did, so the old
                figure was an arithmetic slip, not a changed measurement.)

                The head percentages therefore sum to 94, not 100. That is
                deliberate and load-bearing: `table-fixed` hands the spare
                six points back proportionally, which is what keeps a column
                that was NOT narrowed at roughly its old pixel width as the
                floor comes down. Across all four steps Time held 150px and
                Tokens 134px, against a floor that fell 1580 -> 1484.

                No new breakpoints: the `overflow-x-auto` on the table
                container already side-scrolls below the floor. */}
            <Table className="min-w-[1484px] table-fixed">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <SortableTableHead
                    className="w-[9.5%] whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="time"
                  >
                    Time
                  </SortableTableHead>
                  <SortableTableHead
                    className="w-[6%] whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="status"
                  >
                    Status
                  </SortableTableHead>
                  <SortableTableHead
                    className="w-[6.5%] whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="guardrail"
                  >
                    Security
                  </SortableTableHead>
                  <SortableTableHead
                    className="w-[12%] whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="model"
                  >
                    Model
                  </SortableTableHead>
                  <SortableTableHead
                    className="w-[15.5%] whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="message"
                  >
                    Message
                  </SortableTableHead>
                  <SortableTableHead
                    className="w-[15.5%] whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="conversation"
                  >
                    Conversation
                  </SortableTableHead>
                  <SortableTableHead
                    className="w-[8.5%] whitespace-nowrap"
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="keyId"
                  >
                    Key
                  </SortableTableHead>
                  <SortableTableHead
                    className="w-[8.5%] whitespace-nowrap"
                    numeric
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="inTokens"
                  >
                    Tokens In/Out
                  </SortableTableHead>
                  <SortableTableHead
                    className="w-[6.5%] whitespace-nowrap"
                    numeric
                    onSort={toggleSort}
                    sort={sort}
                    sortKey="latency"
                  >
                    Latency
                  </SortableTableHead>
                  <TableHead className="w-[5.5%] whitespace-nowrap text-right">
                    <span className="inline-flex items-center justify-end gap-1">
                      Cost
                      <Tooltip>
                        <TooltipTrigger
                          render={(props) => (
                            <span
                              {...props}
                              aria-label="About the Cost column"
                              className="-m-1 inline-flex cursor-help rounded-sm p-1 text-muted-foreground hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
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
                              <span className="flex shrink-0 items-center text-muted-foreground leading-5">
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
                              <span className="flex shrink-0 items-center text-muted-foreground leading-5">
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
                    ? "type-mono-14 text-right whitespace-nowrap text-muted-foreground"
                    : "type-mono-14 text-right whitespace-nowrap text-foreground";
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
                      ? "text-muted-foreground"
                      : isSlow
                        ? "text-foreground"
                        : "text-foreground";
                  const conversationName = conversationTitle(row.conversation);
                  const messageText = messagePreview(row);
                  return (
                    <TableRow
                      className="cursor-pointer transition-[background-color] duration-150 ease-out hover-fine:bg-accent motion-reduce:transition-none"
                      key={`${row.time}-${i}`}
                      // Mouse-only convenience: the keyboard/AT target is the real
                      // <a href> drill-in in the model cell (RowActionButton href).
                      // A <tr> can't legally carry role="button"/tabIndex.
                      onClick={() => openRow(row)}
                    >
                      <TableCell className="whitespace-nowrap">
                        {/* Absolute timestamp is the primary scan target — relative
                        ("just now", "3h ago") doesn't scale once the table
                        holds hundreds of rows. The relative phrasing lives in
                        a hover tooltip for the moments it's actually useful
                        (recent activity glance). Column width comes from the
                        header's 10% under `table-fixed`; the old `w-48` here
                        was inert and is gone.

                        The DATE is sans, the CLOCK stays mono. A date is read
                        as a word ("Jun 6"), not scanned digit-by-digit, and
                        mono makes its month abbreviation unnecessarily wide.
                        The clock is scanned as a column of digits, which is
                        mono's job. `tabular-nums` on the date restores the
                        fixed-advance figures that mono was providing for
                        free, so the day numbers still stack in a straight
                        edge down the column. */}
                        <Tooltip>
                          <TooltipTrigger
                            render={(props) => (
                              <span {...props} className="text-foreground">
                                <span className="type-copy-14 tabular-nums">
                                  {row.day},
                                </span>{" "}
                                <span className="type-mono-14">{row.time}</span>
                              </span>
                            )}
                          />
                          <TooltipContent>{row.relative}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={responseVariant(row)}>
                          {responseLabel(row)}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={GUARDRAIL_BADGE[row.guardrail].variant}>
                          {row.guardrail}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <RowActionButton
                          aria-label={`Inspect ${row.code} message to ${modelName(row.model)} at ${row.time}`}
                          href={`/messages-findings/${requestRowId(row)}`}
                        >
                          <VendorAvatar vendor={row.vendor} />
                          {/* Name only. A canonical-id second line was added
                              here on 2026-08-03 and removed the same day —
                              the catalog reconciliation was a DATA change and
                              had no business restructuring this cell. */}
                          {/* Copy voice, not Label, even though this span is
                              the row's drill-in target: it is the row
                              IDENTIFIER, read alongside Message /
                              Conversation / Key, which all sit at 400. A
                              font-medium here made Model the one column that
                              shouted (2026-08-20). design-allow-copy-voice —
                              see design.md §3. */}
                          <span
                            className="type-copy-14 block truncate text-foreground"
                            title={modelName(row.model)}
                          >
                            {modelName(row.model)}
                          </span>
                        </RowActionButton>
                      </TableCell>
                      {/* Message — same two-line shape as Conversation, but
                          per-REQUEST rather than per-conversation: what this
                          request actually said on top, this row's own `req_*`
                          reference below. Conversation next to it repeats the
                          same title and `cnv_*` on every row of a session;
                          this is the column that tells two rows apart.

                          The text is the user's message, or for a tool row
                          the actual call ("Bash: grep -n …"), never the bare
                          tool name. See message-preview.ts for why `summary`
                          is the last resort. 51 of 153 rows have no body at
                          all and render the em dash + sr-only note rather
                          than a fabricated preview, matching Cost/BYOK. */}
                      <TableCell className="whitespace-nowrap">
                        {messageText ? (
                          <>
                            {/* Full text is reached by hover/focus, not by
                                opening the row — the PRD requires it stay
                                reachable FROM the row. Same Tooltip primitive
                                the Time cell uses; a native `title` was the
                                first pass and is worse (slow, no touch, no
                                keyboard). The trigger is the text span itself,
                                so it is not an extra tab stop: the row's only
                                keyboard target stays the drill-in link in the
                                Model cell. */}
                            <Tooltip>
                              <TooltipTrigger
                                render={(props) => (
                                  <span
                                    {...props}
                                    className="type-copy-14 block truncate text-foreground"
                                  >
                                    {messageText}
                                  </span>
                                )}
                              />
                              <TooltipContent className="max-w-sm text-left">
                                {messageText}
                              </TooltipContent>
                            </Tooltip>
                            <span className="type-mono-12 block text-muted-foreground">
                              {requestIdLabel(requestRowId(row))}
                            </span>
                          </>
                        ) : (
                          <>
                            <span
                              aria-hidden
                              className="type-copy-14 block text-muted-foreground"
                            >
                              —
                            </span>
                            <span className="sr-only">
                              No message preview recorded
                            </span>
                            <span className="type-mono-12 block text-muted-foreground">
                              {requestIdLabel(requestRowId(row))}
                            </span>
                          </>
                        )}
                      </TableCell>
                      {/* No `max-w` here — the column's 16% under
                          `table-fixed` is the cap now, and a second bound on
                          the cell would just be a stale number to maintain.
                          Message and Conversation are the two columns allowed
                          to truncate. */}
                      <TableCell className="whitespace-nowrap">
                        {conversationName ? (
                          <>
                            <span
                              className="type-copy-14 block truncate text-foreground"
                              title={conversationName}
                            >
                              {conversationName}
                            </span>
                            <span className="type-mono-12 block text-muted-foreground">
                              {row.conversation}
                            </span>
                          </>
                        ) : (
                          <span
                            className="type-mono-14 block max-w-full truncate text-foreground"
                            title={row.conversation}
                          >
                            {row.conversation}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="type-mono-14 whitespace-nowrap">
                        {/* Two bounds, both needed: `keyLabel` caps the string
                            at 20 characters, and `truncate` holds the column
                            edge — 20 mono characters are wider than the
                            column, so the cap alone would still spill into
                            Tokens. Full value on hover. */}
                        <Tooltip>
                          <TooltipTrigger
                            render={(props) => (
                              <span
                                {...props}
                                className="block truncate text-foreground"
                              >
                                {keyLabel(row.keyId)}
                              </span>
                            )}
                          />
                          <TooltipContent>{row.keyId}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                      {/* Tokens in and out share one column. Both were
                          HEADER-bound, not value-bound: "Tokens Out" needed
                          105px for its label while its widest value ("2,300")
                          needed 68px, so two columns were paying twice for
                          words rather than data. Stacked in-over-out in the
                          two-line shape Message and Conversation already use,
                          the pair costs ~124px instead of 232px. Row height is
                          unchanged — those cells were already two lines. */}
                      <TableCell className={numericCls}>
                        {row.inTokens}
                        <span className="type-mono-12 block text-muted-foreground">
                          {row.outTokens}
                        </span>
                      </TableCell>
                      <TableCell className="type-mono-14 whitespace-nowrap text-right">
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
                          <span className={latencyTextCls}>{row.latency}</span>
                        </span>
                      </TableCell>
                      <TableCell className="type-mono-14 whitespace-nowrap text-right">
                        {isByokKey(row.keyId) ? (
                          <span className="inline-flex items-center justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger
                                render={(props) => (
                                  <span
                                    {...props}
                                    aria-label="Billed by your provider (BYOK)"
                                    className="inline-flex cursor-help rounded-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
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
                            <span className="text-muted-foreground">—</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger
                                render={(props) => (
                                  <span
                                    {...props}
                                    aria-label="Billed by Gate (PAYG)"
                                    className="inline-flex cursor-help rounded-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
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
                                  ? "text-muted-foreground"
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
  );
}
