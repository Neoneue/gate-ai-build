import { ChevronDown } from "lucide-react";
import * as React from "react";
import { IconActionButton } from "@/components/ui/icon-action-button";
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
import { HISTORY_ROWS, type HistoryRow } from "@/data/billing-history";
import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import { formatCurrency, formatDateNumeric } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { BILLING_HISTORY_EMPTY_BODY } from "@/pages/billing/BillingHistorySection";

/* ─────────────────────────────────────────────────────────────────────────
 * HistorySection — the PAYG credit ledger, shared by Pro and Free.
 *
 * Card title is `Billing history`, not the live product's bare `History`
 * (user direction 2026-09-16: "history is too vague").
 *
 * Restored from the live product (screenshots 2026-09-16) after a short
 * detour through an invoice-only list: History is the running balance, and
 * per-request debits belong in it. Columns and copy are the live ones.
 *
 * Gateway requests are GROUPED per calendar day into one expandable row
 * ("Gateway messages (N)"), because a busy workspace writes one debit per
 * request and an ungrouped ledger is unreadable. The group's Amount is the
 * day's total; its Balance after is the balance following the day's LAST
 * request chronologically, so the column still reads as a running balance
 * whichever way the table is sorted. Credits added and Adjustments stay
 * flat rows — there is nothing to roll up.
 *
 * The disclosure is `IconActionButton` + a rotating `ChevronDown` with
 * `aria-expanded`, the precedent from Policies.tsx.
 *
 * Split 2026-09-16 into `HistoryLedger` (the table alone) and
 * `HistorySection` (Card + title + description + ledger). Pro and Free render
 * the Card; the Enterprise page renders `HistoryLedger` inside the Balance
 * tab of its own tabbed card. Pro/Free output is unchanged by the split.

 * ───────────────────────────────────────────────────────────────────────── */

const fmtAmount = (n: number) =>
  formatCurrency(n, { signDisplay: "exceptZero", maxFrac: 5 });
const fmtUsd = (n: number) => formatCurrency(n, { maxFrac: 5 });

type HistoryEntry = {
  id: string;
  date: Date;
  type: string;
  amount: number;
  balanceAfter: number;
  /** Present only on a grouped gateway day. */
  children?: HistoryRow[];
};

const dayKey = (d: Date): string =>
  `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** Fold each calendar day's gateway requests into one entry; everything
 *  else passes through untouched. Input is newest first. */
function groupHistory(rows: HistoryRow[] = HISTORY_ROWS): HistoryEntry[] {
  const entries: HistoryEntry[] = [];
  const groups = new Map<string, HistoryRow[]>();

  for (const row of rows) {
    if (row.type !== "Gateway request") {
      entries.push({ ...row, type: row.type });
      continue;
    }
    const key = dayKey(row.date);
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(row);
      continue;
    }
    const fresh = [row];
    groups.set(key, fresh);
    // Placeholder keeps the day in its ledger position; filled in below.
    entries.push({
      id: `gw-${key}`,
      date: row.date,
      type: "",
      amount: 0,
      balanceAfter: 0,
      children: fresh,
    });
  }

  for (const entry of entries) {
    if (!entry.children) {
      continue;
    }
    const kids = entry.children;
    const newest = kids.reduce((a, b) => (b.date > a.date ? b : a));
    entry.type = `Gateway messages (${kids.length})`;
    entry.amount = kids.reduce((sum, k) => sum + k.amount, 0);
    entry.balanceAfter = newest.balanceAfter;
    entry.date = newest.date;
  }
  return entries;
}

function historySortValue(
  row: HistoryEntry,
  key: string
): string | number | null {
  switch (key) {
    case "date":
      return row.date.getTime();
    case "type":
      return row.type;
    case "amount":
      return row.amount;
    case "balanceAfter":
      return row.balanceAfter;
    default:
      return null;
  }
}

function AmountCell({ amount }: { amount: number }) {
  return (
    <TableCell
      className={cn(
        "type-mono-14 whitespace-nowrap text-right",
        amount > 0
          ? "text-success-700 dark:text-success-300"
          : "text-foreground"
      )}
    >
      {fmtAmount(amount)}
    </TableCell>
  );
}

function HistoryEntryRows({ entry }: { entry: HistoryEntry }) {
  const [expanded, setExpanded] = React.useState(false);
  const kids = entry.children;

  return (
    <>
      <TableRow className="hover:bg-transparent">
        <TableCell className="w-12 whitespace-nowrap pr-0 pl-4">
          {kids ? (
            <IconActionButton
              aria-expanded={expanded}
              aria-label={`${expanded ? "Collapse" : "Expand"} gateway messages on ${formatDateNumeric(entry.date)}`}
              onClick={() => setExpanded((v) => !v)}
            >
              <ChevronDown
                aria-hidden
                className={cn(
                  "size-4 transition-transform duration-150 ease-out motion-reduce:transition-none",
                  expanded && "rotate-180"
                )}
                strokeWidth={1.75}
              />
            </IconActionButton>
          ) : null}
        </TableCell>
        <TableCell className="type-mono-14 whitespace-nowrap text-foreground">
          <Timestamp date={entry.date} />
        </TableCell>
        <TableCell className="whitespace-nowrap text-foreground">
          {entry.type}
        </TableCell>
        <AmountCell amount={entry.amount} />
        <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
          {fmtUsd(entry.balanceAfter)}
        </TableCell>
      </TableRow>

      {expanded && kids
        ? kids.map((kid) => (
            <TableRow className="hover:bg-transparent" key={kid.id}>
              <TableCell className="w-12 whitespace-nowrap pr-0 pl-4" />
              {/* Child dates sit flush under the day date, no extra indent. */}
              <TableCell className="type-mono-14 whitespace-nowrap text-muted-foreground">
                <Timestamp date={kid.date} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {kid.type}
              </TableCell>
              <AmountCell amount={kid.amount} />
              <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                {fmtUsd(kid.balanceAfter)}
              </TableCell>
            </TableRow>
          ))
        : null}
    </>
  );
}

/** The credit ledger's table alone: no Card, no title, no description. The
 *  Pro/Free `HistorySection` wraps it in the Card below; the Enterprise page
 *  renders it inside the Balance tab of its own tabbed card.
 *
 *  `rows` defaults to the live ledger, which is what Pro and Free always
 *  show. An org whose billing is not provisioned yet passes an empty array
 *  and gets the same `TableEmptyState` the Plan tab renders. */
export function HistoryLedger({
  rows = HISTORY_ROWS,
  emptyBody = BILLING_HISTORY_EMPTY_BODY,
}: {
  rows?: HistoryRow[];
  emptyBody?: string;
} = {}) {
  const { sort, toggle: toggleSort } = useTableSort();
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState("25");
  const entries = React.useMemo(() => groupHistory(rows), [rows]);
  const sortedRows = React.useMemo(
    () => sortRows(entries, sort, historySortValue),
    [entries, sort]
  );
  // Same shape as the Members table: resolve the select value against the
  // real total, then slice. A grouped gateway day counts as ONE row here,
  // which is what the footer's "Showing 1-N of N" reports.
  const perPage = resolveRowsPerPage(rowsPerPage, sortedRows.length);
  const pageRows = React.useMemo(
    () => sortedRows.slice((page - 1) * perPage, page * perPage),
    [sortedRows, page, perPage]
  );

  // Same branch the Plan tab takes: the empty state replaces the table AND
  // its pagination footer, so an empty tab has nothing to page through.
  if (sortedRows.length === 0) {
    return <TableEmptyState body={emptyBody} title="No billing history yet" />;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {/* Disclosure column — no label, the row action names itself. */}
            <TableHead className="w-12 whitespace-nowrap pr-0 pl-4" />
            <SortableTableHead
              className="whitespace-nowrap"
              onSort={toggleSort}
              sort={sort}
              sortKey="date"
            >
              Date
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
              numeric
              onSort={toggleSort}
              sort={sort}
              sortKey="amount"
            >
              Amount
            </SortableTableHead>
            <SortableTableHead
              className="whitespace-nowrap"
              numeric
              onSort={toggleSort}
              sort={sort}
              sortKey="balanceAfter"
            >
              Balance after
            </SortableTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((entry) => (
            <HistoryEntryRows entry={entry} key={entry.id} />
          ))}
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
  );
}
