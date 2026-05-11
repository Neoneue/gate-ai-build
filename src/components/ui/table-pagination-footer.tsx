import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
 * ───────────────────────────────────────────────────────────────────────── */

const ROWS_PER_PAGE_OPTIONS = ['10', '25', '50', '100'];

/**
 * Canonical truncated-pagination window. For totalPages ≤ 7 returns every
 * page; otherwise returns [1, optional left ellipsis, current ± 1 clipped,
 * optional right ellipsis, last page]. 1-based.
 */
export function buildPageWindow(
  current: number,
  totalPages: number,
): (number | 'ellipsis-l' | 'ellipsis-r')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const out: (number | 'ellipsis-l' | 'ellipsis-r')[] = [1];
  if (current > 3) out.push('ellipsis-l');
  for (let p = current - 1; p <= current + 1; p++) {
    if (p > 1 && p < totalPages) out.push(p);
  }
  if (current < totalPages - 2) out.push('ellipsis-r');
  out.push(totalPages);
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
  const perPage = parseInt(rowsPerPage, 10);
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage + 1;
  const end = Math.min(safePage * perPage, total);
  const pageWindow = buildPageWindow(safePage, totalPages);
  const atLastPage = safePage >= totalPages;

  return (
    <div className="flex items-center justify-between gap-3 py-3 px-4 border-t border-ink-200">
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-ink-500 tabular-nums -tracking-[0.01em]">
          Showing{' '}
          <span className="font-medium">
            {start.toLocaleString()}–{end.toLocaleString()}
          </span>{' '}
          of <span className="font-medium">{total.toLocaleString()}</span>
        </span>
        <span className="text-ink-400" aria-hidden>·</span>
        <span className="font-mono text-xs font-medium text-ink-500 -tracking-[0.01em]">
          Rows
        </span>
        <Select
          value={rowsPerPage}
          onValueChange={(v: string) => {
            onRowsPerPageChange(v);
            onPageChange(1);
          }}
        >
          <SelectTrigger
            size="sm"
            aria-label="Rows per page"
            className="border-ink-200 bg-white text-ink-900 font-normal"
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
          {pageWindow.map((entry, idx) =>
            entry === 'ellipsis-l' || entry === 'ellipsis-r' ? (
              <PaginationItem key={`${entry}-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={entry}>
                <PaginationLink
                  isActive={safePage === entry}
                  onClick={() => onPageChange(entry)}
                >
                  {entry}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              aria-disabled={atLastPage || undefined}
              disabled={atLastPage}
              className={
                atLastPage ? 'pointer-events-none opacity-50' : undefined
              }
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
