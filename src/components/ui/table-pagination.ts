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
 *  which case the footer drops the select entirely.
 *
 *  `minStep` is the floor the surface starts at, and composes with that rule
 *  from the other end. Two buckets (user direction 2026-09-23): the Teams
 *  surfaces keep the floor of 10, because a roster or a team list is short
 *  and 25 would page nothing; every other table floors at 25, so the 10 step
 *  is gone there. The floor never re-adds a step the list itself cannot
 *  support — a 12-row list at floor 25 is still "All" alone.
 *
 *  A consumer that passes a floor MUST also default its own `rowsPerPage`
 *  state to a value at or above it. A "10" held against a floor of 25 is
 *  dropped from `options`, so the select displays "All" while the consumer's
 *  `resolveRowsPerPage("10", total)` still slices 10 — the exact drift these
 *  two helpers exist to prevent. */
export function rowsPerPageOptions(total: number, minStep = 10): string[] {
  const steps = ROWS_PER_PAGE_STEPS.filter(
    (n) => n >= minStep && n <= total
  ).map(String);
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
