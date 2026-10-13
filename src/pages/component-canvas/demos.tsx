import { type ReactNode, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { AskAiSurface } from "@/components/ui/ask-ai-surface";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RowActionButton } from "@/components/ui/row-action-button";
import {
  NavTableRow,
  SortableTableHead,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePaginationFooter } from "@/components/ui/table-pagination-footer";
import { Timestamp } from "@/components/ui/timestamp";
import { AskAiThreadProvider } from "@/hooks/ask-ai-thread-provider";
import { parseNumeric, sortRows, useTableSort } from "@/hooks/use-table-sort";
import { DEMO_NOW } from "@/lib/demo-clock";
import { SAMPLE_KEYS } from "@/pages/component-canvas/sample-data";

/* Stateful wrappers for examples whose component is controlled-only
 * (value + onChange). The examples stay interactive (skill: "Examples
 * respond to input unless they show a disabled or read-only state") and the
 * state never leaves the slot. */

export function Stateful<T>({
  initial,
  children,
}: {
  initial: T;
  children: (value: T, setValue: (next: T) => void) => ReactNode;
}) {
  const [value, setValue] = useState<T>(initial);
  return <>{children(value, setValue)}</>;
}

const DAY_MS = 86_400_000;

/** Whole days since a key was created, against the app's demo clock. */
function ageInDays(createdAt: Date): number {
  return Math.max(
    0,
    Math.floor((DEMO_NOW.getTime() - createdAt.getTime()) / DAY_MS)
  );
}

type KeysTableMode = "basic" | "sortable" | "navigable" | "footer" | "overflow";

/** The API keys table from the seed rows, one feature switched on per mode,
 *  always inside `Card density="flush"` (design.md "Lists and tables"). */
export function KeysTableDemo({ mode }: { mode: KeysTableMode }) {
  const { sort, toggle } = useTableSort();
  const [selectedId, setSelectedId] = useState<string | null>(
    mode === "navigable" ? (SAMPLE_KEYS[1]?.id ?? null) : null
  );
  const rows =
    mode === "sortable"
      ? sortRows(SAMPLE_KEYS, sort, (row, key) =>
          key === "age" ? parseNumeric(ageInDays(row.createdAt)) : row.name
        )
      : SAMPLE_KEYS;

  const nameHead =
    mode === "sortable" ? (
      <SortableTableHead onSort={toggle} sort={sort} sortKey="name">
        Name
      </SortableTableHead>
    ) : (
      <TableHead>Name</TableHead>
    );
  const ageHead =
    mode === "sortable" ? (
      <SortableTableHead numeric onSort={toggle} sort={sort} sortKey="age">
        Age (days)
      </SortableTableHead>
    ) : (
      <TableHead className="text-right">Age (days)</TableHead>
    );

  return (
    <Card className="w-full" density="flush">
      <Table className={mode === "overflow" ? "min-w-[1000px]" : undefined}>
        {mode === "footer" ? (
          <TableCaption>Active keys in this workspace.</TableCaption>
        ) : null}
        <TableHeader>
          <TableRow>
            {nameHead}
            <TableHead>Key</TableHead>
            <TableHead>Last used</TableHead>
            {ageHead}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const cells = (
              <>
                <TableCell className="whitespace-nowrap">
                  {/* design-allow-copy-voice: the row identifier opens the row */}
                  <RowActionButton
                    aria-label={`Open ${row.name}`}
                    onClick={() => setSelectedId(row.id)}
                  >
                    {row.name}
                  </RowActionButton>
                </TableCell>
                <TableCell className="type-mono-14 whitespace-nowrap">
                  {row.masked}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Timestamp date={row.lastUsed} format="dateNumeric" />
                </TableCell>
                <TableCell className="type-mono-14 whitespace-nowrap text-right">
                  {ageInDays(row.createdAt)}
                </TableCell>
              </>
            );
            if (mode === "navigable") {
              return (
                <NavTableRow
                  data-state={selectedId === row.id ? "selected" : undefined}
                  key={row.id}
                  onActivate={() => setSelectedId(row.id)}
                >
                  {cells}
                </NavTableRow>
              );
            }
            return <TableRow key={row.id}>{cells}</TableRow>;
          })}
        </TableBody>
        {mode === "footer" ? (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>{rows.length} keys</TableCell>
              <TableCell className="type-mono-14 text-right">
                {rows.reduce((sum, row) => sum + ageInDays(row.createdAt), 0)}
              </TableCell>
            </TableRow>
          </TableFooter>
        ) : null}
      </Table>
    </Card>
  );
}

/** TablePaginationFooter with live page state in a flush card, the way
 *  every paged table hosts it. The default page size is a literal so
 *  table-pagination.test.ts can check it against the footer's options. */
export function PaginationFooterDemo({
  total,
  initialPage = 1,
}: {
  total: number;
  initialPage?: number;
}) {
  const [page, setPage] = useState(initialPage);
  const [rowsPerPage, setRowsPerPage] = useState("10");
  return (
    <Card className="w-full" density="flush">
      <TablePaginationFooter
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        page={page}
        rowsPerPage={rowsPerPage}
        total={total}
      />
    </Card>
  );
}

/** The same footer opening on "All" rows. */
export function PaginationFooterAllDemo({ total }: { total: number }) {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("All");
  return (
    <Card className="w-full" density="flush">
      <TablePaginationFooter
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        page={page}
        rowsPerPage={rowsPerPage}
        total={total}
      />
    </Card>
  );
}

/** AskAiSurface with its own open state. `isDesktop` picks the docked
 *  column (lg and up) or the Sheet, exactly as DashboardChrome passes it. */
export function AskAiSurfaceDemo({ isDesktop }: { isDesktop: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <AskAiThreadProvider>
      <div className="flex w-full flex-col gap-3">
        <Button
          className="self-start"
          onClick={() => setOpen(!open)}
          size="default"
          variant="outline"
        >
          {open ? "Close" : "Open"}
        </Button>
        {isDesktop ? (
          <div className="flex h-180 w-full justify-end rounded-md border border-border bg-background">
            <AskAiSurface isDesktop onOpenChange={setOpen} open={open} />
          </div>
        ) : (
          <AskAiSurface isDesktop={false} onOpenChange={setOpen} open={open} />
        )}
      </div>
    </AskAiThreadProvider>
  );
}

/** Render `children` as if the router were at `path`: `<Routes location>`
 *  overrides `useLocation()` for its subtree only, so a tier-aware
 *  component (WorkspaceSwitcher) shows that tier while the canvas
 *  MemoryRouter stays where it is. Nothing navigates. */
export function AtPath({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  return (
    <Routes location={path}>
      <Route element={children} path="*" />
    </Routes>
  );
}
