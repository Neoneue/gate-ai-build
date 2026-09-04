/* Shared pagination constants and helpers, split out of
 * table-pagination-footer.tsx so that file exports only components and
 * Fast Refresh stays whole-file. Repo convention: split, don't trip
 * `react-refresh/only-export-components` (see chart-geometry.ts,
 * payg-config.ts). */

/** The rows-per-page select's one non-numeric option: show the whole list. */
export const ROWS_ALL = "All";

/** Resolve the select's string value to a row count. "All" resolves to the
 *  full list, floored at 1 so the `Math.ceil(total / perPage)` every
 *  consumer does cannot divide by zero on an empty list; the numeric
 *  options parse as before. */
export function resolveRowsPerPage(rowsPerPage: string, total: number): number {
  return rowsPerPage === ROWS_ALL
    ? Math.max(1, total)
    : Number.parseInt(rowsPerPage, 10);
}
