import * as React from "react"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import type { SortState } from "@/hooks/use-table-sort"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  // The `:not(:first-child)` guard lives at the container so the header's
  // top hairline only renders when something sits above the table (e.g.,
  // a toolbar inside the same Card). When the table is the first child of
  // its parent (e.g., the Providers table that sits directly inside a Card
  // density=flush), the Card's `--shadow-border` ring owns the top edge by
  // itself — stacking the header's `border-t` on top of the ring at the
  // same y-position is what reads as a "darker line" along the top.
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto [&:not(:first-child)>table>thead>tr]:border-t [&:not(:first-child)>table>thead>tr]:border-border"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({
  className,
  ...props
}: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-neutral-50", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({
  className,
  ...props
}: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t border-border bg-neutral-50 font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-border transition-colors motion-reduce:transition-none hover:bg-neutral-50 data-[state=selected]:bg-neutral-50",
        className,
      )}
      {...props}
    />
  )
}

function TableHead({ className, scope = "col", ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      // `scope="col"` is the WCAG H63 association affordance — without it,
      // screen readers can't reliably link cells back to their column heads
      // in fixed-layout multi-column tables. Defaulted in the primitive so
      // every consumer gets it; can be overridden for row-headers.
      scope={scope}
      className={cn(
        // Sans Title Case (not uppercase) so column heads stay distinct
        // from section eyebrows. Mono is reserved for ID / value content in
        // the body cells; sans here keeps the voice split clean. font-medium
        // + neutral-600 gives 12px sans enough presence to register as a header
        // row without competing with the body.
        "h-10 px-4 text-left align-middle text-xs font-medium text-neutral-500 [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  )
}

/* Sortable column header — drop-in replacement for <TableHead> on sortable
 * columns. The click target is just the label + glyph (NOT the whole cell), so
 * the empty cell space isn't clickable. The sort glyph fades in on hover when
 * inactive and PERSISTS, as a directional arrow, when this column is the active
 * sort. Sorting is a three-state cycle (asc → desc → unsorted) via `onSort`.
 * `aria-sort` keeps it accessible. Pairs with the `useTableSort` hook +
 * `sortRows` helper (@/hooks/use-table-sort). Set `numeric` for right-aligned
 * (number) columns so the trigger hugs the right edge, matching the body. */
function SortableTableHead({
  sortKey,
  sort,
  onSort,
  numeric = false,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"th">, "onSort"> & {
  sortKey: string
  sort: SortState
  onSort: (key: string) => void
  numeric?: boolean
}) {
  const active = sort.key === sortKey
  return (
    <th
      data-slot="table-head"
      scope="col"
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      // Cell keeps the standard header padding/alignment; the trigger inside is
      // content-width so the hit area is the label + glyph, not the whole cell.
      className={cn(
        "h-10 px-4 align-middle text-xs font-medium text-neutral-500",
        numeric ? "text-right" : "text-left",
        className,
      )}
      {...props}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        // Content-width (`w-fit`, capped at half the cell) — the empty cell area
        // is NOT a click target. A fixed-size glyph slot is always present
        // (opacity-toggled) so the label never shifts across states.
        className={cn(
          "group/sort inline-flex h-10 w-fit max-w-1/2 items-center gap-1 align-middle select-none whitespace-nowrap rounded-xs text-xs font-medium text-neutral-500 outline-none transition-colors duration-150 ease-out hover:text-neutral-900 focus-visible:ring-3 focus-visible:ring-ring/50",
          active && "text-neutral-900",
        )}
      >
        <span>{children}</span>
        {active ? (
          sort.dir === "asc" ? (
            <ArrowUp className="size-3.5 shrink-0 text-neutral-900" strokeWidth={2} aria-hidden />
          ) : (
            <ArrowDown className="size-3.5 shrink-0 text-neutral-900" strokeWidth={2} aria-hidden />
          )
        ) : (
          <ChevronsUpDown
            className="size-3.5 shrink-0 text-neutral-400 opacity-0 transition-opacity duration-150 ease-out group-hover/sort:opacity-100 motion-reduce:transition-none"
            strokeWidth={2}
            aria-hidden
          />
        )}
      </button>
    </th>
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-4 py-3 align-middle text-sm text-neutral-900 [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-neutral-500", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  SortableTableHead,
  TableRow,
  TableCell,
  TableCaption,
}
