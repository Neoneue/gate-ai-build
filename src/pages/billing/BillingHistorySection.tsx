import * as React from "react";
import { Badge } from "@/components/ui/badge";
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
import { Timestamp } from "@/components/ui/timestamp";
import type { InvoiceRow } from "@/data/billing-seats";
import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import { formatCurrency } from "@/lib/formatters";

/* ─────────────────────────────────────────────────────────────────────────
 * PlanChargesTable — the ENTERPRISE seat-charge table.
 *
 * Enterprise is billed by seat through its own Stripe configuration and has
 * no pay-as-you-go balance, so its history is a list of seat charges rather
 * than the running credit ledger Pro and Free show (`HistorySection.tsx`).
 * It is the "Plan" tab of the Enterprise Billing history card (2026-09-16);
 * the "Balance" tab renders `HistoryLedger` from `HistorySection.tsx`. The
 * card, its title and the per-tab description live on the page, so this
 * module is the table and its empty state alone.
 *
 * `seats` is null on a row with no seat count; the cell stays empty rather
 * than printing a zero that would read as "no seats billed". Sorting folds
 * null to 0 so those rows group together instead of dropping out of the
 * order.
 *
 * There is no per-row download. These rows are billing events; the
 * `Invoice portal` action, which sits in the Plan tab's header row, is where
 * an invoice document is fetched.
 * ───────────────────────────────────────────────────────────────────────── */

function invoiceSortValue(
  row: InvoiceRow,
  key: string
): string | number | null {
  switch (key) {
    case "date":
      return row.date.getTime();
    case "seats":
      return row.seats ?? 0;
    case "amount":
      return row.amount;
    case "status":
      return row.status;
    default:
      return null;
  }
}

const DEFAULT_EMPTY_BODY =
  "Your first seat charge will show up here once billing is set up.";

export function PlanChargesTable({
  rows,
  emptyBody = DEFAULT_EMPTY_BODY,
}: {
  rows: InvoiceRow[];
  emptyBody?: string;
}) {
  const { sort, toggle: toggleSort } = useTableSort();
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState("25");
  const sortedRows = React.useMemo(
    () => sortRows(rows, sort, invoiceSortValue),
    [rows, sort]
  );
  const perPage = resolveRowsPerPage(rowsPerPage, sortedRows.length);
  const pageRows = React.useMemo(
    () => sortedRows.slice((page - 1) * perPage, page * perPage),
    [sortedRows, page, perPage]
  );

  return (
    <>
      {sortedRows.length === 0 ? (
        <TableEmptyState body={emptyBody} title="No billing history yet" />
      ) : (
        /* `table-fixed` + a `w-[N%]` on every head, the Members table's
           recipe (Team.tsx:295), so Status lands flush against the table's
           right padding instead of floating mid-row. Shares sum to 100.
           `min-w-[860px]` is the other half of that recipe: the binding
           column is Status at 16%, whose sort trigger is capped at
           `max-w-1/2` of the cell and needs 55px for its label plus glyph.
           Measured floor is 860px; below it the head label spills past its
           own box instead of the table scrolling. */
        <Table className="min-w-[860px] table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <SortableTableHead
                className="w-[16%] whitespace-nowrap"
                onSort={toggleSort}
                sort={sort}
                sortKey="date"
              >
                Date
              </SortableTableHead>
              <TableHead className="w-[44%] whitespace-nowrap">
                Description
              </TableHead>
              <SortableTableHead
                className="w-[10%] whitespace-nowrap text-right"
                numeric
                onSort={toggleSort}
                sort={sort}
                sortKey="seats"
              >
                Seats
              </SortableTableHead>
              <SortableTableHead
                className="w-[14%] whitespace-nowrap text-right"
                numeric
                onSort={toggleSort}
                sort={sort}
                sortKey="amount"
              >
                Amount
              </SortableTableHead>
              <SortableTableHead
                className="w-[16%] whitespace-nowrap text-right"
                onSort={toggleSort}
                sort={sort}
                sortKey="status"
              >
                Status
              </SortableTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) => (
              <TableRow className="hover:bg-transparent" key={row.id}>
                <TableCell className="type-mono-14 whitespace-nowrap text-foreground">
                  <Timestamp date={row.date} format="dateNumeric" />
                </TableCell>
                <TableCell className="truncate whitespace-nowrap text-foreground">
                  {row.description}
                </TableCell>
                <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                  {row.seats ?? ""}
                </TableCell>
                <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                  {formatCurrency(row.amount)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right">
                  <Badge
                    variant={row.status === "Paid" ? "success" : "destructive"}
                  >
                    {row.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {sortedRows.length === 0 ? null : (
        <TablePaginationFooter
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
          page={page}
          rowsPerPage={rowsPerPage}
          total={sortedRows.length}
        />
      )}
    </>
  );
}
