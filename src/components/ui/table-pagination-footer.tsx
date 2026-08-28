import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROWS_ALL, resolveRowsPerPage } from "@/components/ui/table-pagination";

/* ─────────────────────────────────────────────────────────────────────────
 * TablePaginationFooter — bottom strip of any paginated table.
 *
 * Renders the count summary ("Showing 1–25 of 8,241"), rows-per-page select,
 * and the page-link strip with windowed truncation. Single source of truth
 * for table pagination chrome — CMP-011 sortable, CMP-013 requests, CMP-014
 * conversations all consume this primitive instead of hand-rolling it.
 *
 * State stays in the parent (page + rowsPerPage); the primitive is
 * controlled. Resetting page to 1 on a rows-per-page change is internalized
 * — consumers only handle the value updates.
 *
 * The page-window helper is exported separately for callers that need to
 * read the truncation pattern (rare, but supported).
 *
 * Rows-per-page offers 10 / 25 / 50 / All (user direction 2026-08-27: the
 * 100 step became All). "All" resolves to the whole list via
 * `resolveRowsPerPage`, which every consumer that slices its own rows must
 * use for its page math, so the option list and the slicing cannot drift.
 * ───────────────────────────────────────────────────────────────────────── */

const ROWS_PER_PAGE_OPTIONS = ["10", "25", "50", ROWS_ALL];

/**
 * Constant-width truncated-pagination window (`1 … 3 4 5 … 7` shape, GitHub
 * style). Anchors are always page 1, the last page, and the current page with
 * its immediate neighbors; ANY gap of one or more hidden pages collapses to an
 * ellipsis (no lone-gap-to-number fill), so the control keeps a stable compact
 * shape while paging and never grows back to every number. Caps at 5 numeric
 * buttons and stays correct at both edges. 1-based.
 */
function buildPageWindow(
  current: number,
  totalPages: number
): (number | "ellipsis-l" | "ellipsis-r")[] {
  // Always-shown anchors: first, last, current and its two neighbors.
  const anchors = [1, totalPages, current - 1, current, current + 1];
  const pages = [...new Set(anchors)]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const out: (number | "ellipsis-l" | "ellipsis-r")[] = [];
  let prev = 0;
  for (const p of pages) {
    if (p - prev > 1) {
      // Any hidden page(s) collapse to a single ellipsis.
      out.push(p <= current ? "ellipsis-l" : "ellipsis-r");
    }
    out.push(p);
    prev = p;
  }
  return out;
}

export type TablePaginationFooterProps = {
  total: number;
  page: number;
  rowsPerPage: string;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: string) => void;
};

export function TablePaginationFooter({
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: TablePaginationFooterProps) {
  const perPage = resolveRowsPerPage(rowsPerPage, total);
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage + 1;
  const end = Math.min(safePage * perPage, total);
  const pageWindow = buildPageWindow(safePage, totalPages);
  const atLastPage = safePage >= totalPages;

  return (
    <div className="flex @xl:flex-row flex-col items-center @xl:justify-between gap-3 border-border border-t px-4 py-3 @xl:pb-3 pb-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="whitespace-nowrap font-mono text-muted-foreground text-xs tabular-nums">
          Showing{" "}
          <span className="font-medium">
            {start.toLocaleString()}–{end.toLocaleString()}
          </span>{" "}
          of <span className="font-medium">{total.toLocaleString()}</span>
        </span>
        <span aria-hidden className="text-muted-foreground">
          ·
        </span>
        <span className="font-medium font-mono text-muted-foreground text-xs">
          Rows
        </span>
        <Select
          onValueChange={(v: string) => {
            onRowsPerPageChange(v);
            onPageChange(1);
          }}
          value={rowsPerPage}
        >
          <SelectTrigger
            aria-label="Rows per page"
            className="border-border bg-card text-foreground"
            size="sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROWS_PER_PAGE_OPTIONS.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Pagination className="mx-0 w-fit justify-end">
        <PaginationContent className="gap-1">
          <PaginationItem>
            <PaginationPrevious
              aria-disabled={safePage <= 1 || undefined}
              className={
                safePage <= 1 ? "pointer-events-none opacity-50" : undefined
              }
              disabled={safePage <= 1}
              onClick={() => {
                if (safePage > 1) {
                  onPageChange(Math.max(1, safePage - 1));
                }
              }}
            />
          </PaginationItem>
          {pageWindow.map((entry, idx) =>
            entry === "ellipsis-l" || entry === "ellipsis-r" ? (
              <PaginationItem key={`${entry}-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={entry}>
                <PaginationLink
                  className="w-auto min-w-8 px-2"
                  isActive={safePage === entry}
                  onClick={() => onPageChange(entry)}
                >
                  {entry}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
              aria-disabled={atLastPage || undefined}
              className={
                atLastPage ? "pointer-events-none opacity-50" : undefined
              }
              disabled={atLastPage}
              onClick={() => {
                if (!atLastPage) {
                  onPageChange(Math.min(totalPages, safePage + 1));
                }
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
