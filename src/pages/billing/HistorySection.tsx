import { ChevronDown } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { ReceiptIcon } from "@/components/ui/receipt";
import {
  SortableTableHead,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Timestamp } from "@/components/ui/timestamp";
import { HISTORY_ROWS, type HistoryRow } from "@/data/billing-history";
import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import { formatCurrency, formatDateNumeric } from "@/lib/formatters";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * HistorySection — the PAYG credit ledger, shared by Pro and Free.
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
        amount > 0 ? "text-success-700" : "text-foreground"
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
              {/* Child rows indent under the day they belong to. */}
              <TableCell className="type-mono-14 whitespace-nowrap pl-8 text-muted-foreground">
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

export function HistorySection() {
  const { sort, toggle: toggleSort } = useTableSort();
  const entries = React.useMemo(() => groupHistory(), []);
  const sortedRows = React.useMemo(
    () => sortRows(entries, sort, historySortValue),
    [entries, sort]
  );

  return (
    <Card density="flush">
      <CardHeader className="py-3">
        <CardTitle>History</CardTitle>
        <CardDescription>
          Past charges and credit top-ups. Gateway messages are grouped by day.
          Expand a day to see each message.
        </CardDescription>
        <CardAction>
          <Button size="sm" variant="outline">
            <ReceiptIcon aria-hidden data-icon="inline-start" size={16} />
            Invoice portal
          </Button>
        </CardAction>
      </CardHeader>
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
          {sortedRows.map((entry) => (
            <HistoryEntryRows entry={entry} key={entry.id} />
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
