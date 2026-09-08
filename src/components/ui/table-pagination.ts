/* Shared pagination constants and helpers, split out of
 * table-pagination-footer.tsx so that file exports only components and
 * Fast Refresh stays whole-file. Repo convention: split, don't trip
 * `react-refresh/only-export-components` (see chart-geometry.ts,
 * payg-config.ts). */

/** The rows-per-page select's one non-numeric option: show the whole list. */
export const ROWS_ALL = "All";

/** The numeric page sizes the select can offer, ascending. */
const ROWS_PER_PAGE_STEPS = [10, 25, 50] as const;

/** The page sizes worth offering for a list of `total` rows: never offer a
 *  page size larger than the list (user direction 2026-09-07 — a "50" on a
 *  25-row list is a no-op that reads as broken). "All" is always last, and
 *  is the only option once the list is shorter than the smallest step, in
 *  which case the footer drops the select entirely. */
export function rowsPerPageOptions(total: number): string[] {
  const steps = ROWS_PER_PAGE_STEPS.filter((n) => n <= total).map(String);
  return [...steps, ROWS_ALL];
}

/** Resolve the select's string value to a row count. "All" resolves to the
 *  full list, floored at 1 so the `Math.ceil(total / perPage)` every
 *  consumer does cannot divide by zero on an empty list; the numeric
 *  options parse as before.
 *
 *  A numeric value larger than the list resolves to the list too — that is
 *  the same fallback `rowsPerPageOptions` applies when it drops an
 *  oversized step, so a stale "50" held by a consumer whose list shrank to
 *  20 slices identically to the "All" the select now displays. Keeping the
 *  fallback here (not in the footer) is what lets every consumer's own
 *  `perPage` agree with the footer's "Showing 1–N of N" without touching
 *  the consumers. */
export function resolveRowsPerPage(rowsPerPage: string, total: number): number {
  if (rowsPerPage === ROWS_ALL) {
    return Math.max(1, total);
  }
  const parsed = Number.parseInt(rowsPerPage, 10);
  return parsed > total ? Math.max(1, total) : parsed;
}
