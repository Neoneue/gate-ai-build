import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type * as React from "react";
import type { SortState } from "@/hooks/use-table-sort";
import { cn } from "@/lib/utils";

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
      className="relative w-full overflow-x-auto [&:not(:first-child)>table>thead>tr]:border-border [&:not(:first-child)>table>thead>tr]:border-t"
      data-slot="table-container"
    >
      <table
        className={cn("type-copy-14 w-full caption-bottom", className)}
        data-slot="table"
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      className={cn("bg-card-muted", className)}
      data-slot="table-header"
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      className={cn("[&_tr:last-child]:border-0", className)}
      data-slot="table-body"
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      className={cn(
        "border-border border-t bg-card-muted font-medium [&>tr]:last:border-b-0",
        className
      )}
      data-slot="table-footer"
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        // transition-[background-color] (not transition-colors): the hover/
        // selected fill should fade, but border-color must NOT — interpolating
        // the divider between dark's translucent white/10% border and light's
        // opaque neutral-200 produces a visible mid-transition gray smudge
        // (verified: alpha and lightness ramp at different rates in OKLab).
        // Letting the border snap instantly matches TableHeader/TableFooter,
        // which already snap with no visible artifact.
        "border-border border-b transition-[background-color] hover:bg-accent data-[state=selected]:bg-accent motion-reduce:transition-none",
        className
      )}
      data-slot="table-row"
      {...props}
    />
  );
}

/* Keyboard-accessible clickable row. Built on <TableRow> so it inherits the
 * hairline + hover; adds link semantics (role, tabIndex), pointer affordance,
 * a focus ring, an active fill, and Enter/Space activation. `onActivate` fires
 * on click and on Enter/Space. Pass `aria-label` via props. */
function NavTableRow({
  onActivate,
  className,
  ...props
}: Omit<
  React.ComponentProps<"tr">,
  "onClick" | "onKeyDown" | "role" | "tabIndex"
> & {
  onActivate: () => void;
}) {
  return (
    <TableRow
      className={cn(
        "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset active:bg-accent",
        className
      )}
      onClick={onActivate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onActivate();
        }
      }}
      role="link"
      tabIndex={0}
      {...props}
    />
  );
}

function TableHead({
  className,
  scope = "col",
  ...props
}: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        // Sans Title Case (not uppercase) so column heads stay distinct
        // from section eyebrows. Mono is reserved for ID / value content in
        // the body cells; sans here keeps the voice split clean. font-medium
        // + neutral-600 gives 12px sans enough presence to register as a header
        // row without competing with the body.
        "type-label-12 h-10 px-4 text-left align-middle text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      data-slot="table-head"
      // `scope="col"` is the WCAG H63 association affordance — without it,
      // screen readers can't reliably link cells back to their column heads
      // in fixed-layout multi-column tables. Defaulted in the primitive so
      // every consumer gets it; can be overridden for row-headers.
      scope={scope}
      {...props}
    />
  );
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
  sortKey: string;
  sort: SortState;
  onSort: (key: string) => void;
  numeric?: boolean;
}) {
  const active = sort.key === sortKey;
  return (
    <th
      aria-sort={
        active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"
      }
      // Cell keeps the standard header padding/alignment; the trigger inside is
      // content-width so the hit area is the label + glyph, not the whole cell.
      className={cn(
        "type-label-12 h-10 px-4 align-middle text-muted-foreground",
        numeric ? "text-right" : "text-left",
        className
      )}
      data-slot="table-head"
      scope="col"
      {...props}
    >
      <button
        // Content-width (`w-fit`, capped at half the cell) — the empty cell area
        // is NOT a click target. A fixed-size glyph slot is always present
        // (opacity-toggled) so the label never shifts across states.
        className={cn(
          "type-label-12 group/sort inline-flex h-10 w-fit max-w-1/2 select-none items-center gap-1 whitespace-nowrap rounded-xs align-middle text-muted-foreground outline-none transition-colors duration-150 ease-out hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
          // Numeric columns are right-aligned: put the glyph LEFT of the label
          // (flex-row-reverse) so the label stays flush to the column's right
          // edge and lines up with the right-aligned data below it.
          numeric && "flex-row-reverse",
          active && "text-foreground"
        )}
        onClick={() => onSort(sortKey)}
        type="button"
      >
        <span>{children}</span>
        {active ? (
          sort.dir === "asc" ? (
            <ArrowUp
              aria-hidden
              className="size-3.5 shrink-0 text-foreground"
              strokeWidth={2}
            />
          ) : (
            <ArrowDown
              aria-hidden
              className="size-3.5 shrink-0 text-foreground"
              strokeWidth={2}
            />
          )
        ) : (
          <ChevronsUpDown
            aria-hidden
            className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-150 ease-out group-hover/sort:opacity-100 motion-reduce:transition-none"
            strokeWidth={2}
          />
        )}
      </button>
    </th>
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      className={cn(
        "type-copy-14 px-4 py-3 align-middle text-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      data-slot="table-cell"
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      className={cn("type-copy-14 mt-4 text-muted-foreground", className)}
      data-slot="table-caption"
      {...props}
    />
  );
}

export {
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
};
