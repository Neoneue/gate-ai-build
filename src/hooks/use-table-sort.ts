import { useCallback, useState } from "react";

/* ─────────────────────────────────────────────────────────────────────────
 * useTableSort — lightweight client-side sort state for shadcn <Table>s.
 *
 * Pairs with <SortableTableHead> (ui/table.tsx). The table owns the data and
 * supplies a `getValue(row, key)` accessor; this hook owns the {key, dir}
 * state and the toggle semantics (click a column → asc; click again → desc).
 * No TanStack dependency — the project's tables render rows by hand, so a
 * local accessor + `sortRows` keeps the existing rendering intact.
 * ───────────────────────────────────────────────────────────────────────── */

export type SortDir = "asc" | "desc";
export type SortState = { key: string | null; dir: SortDir };

export function useTableSort(initial: SortState = { key: null, dir: "asc" }) {
  const [sort, setSort] = useState<SortState>(initial);
  // Three-state cycle on the active column: asc → desc → unsorted (back to the
  // table's default order). A different column starts fresh at asc. Never locks
  // the user into a sorted view.
  const toggle = useCallback((key: string) => {
    setSort((s) => {
      if (s.key !== key) {
        return { key, dir: "asc" };
      }
      if (s.dir === "asc") {
        return { key, dir: "desc" };
      }
      return { key: null, dir: "asc" }; // third click clears
    });
  }, []);
  return { sort, toggle, setSort };
}

/** Strip currency / commas / units to a comparable number; non-numeric → null. */
export function parseNumeric(
  value: string | number | null | undefined
): number | null {
  if (value == null) {
    return null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const cleaned = value.replace(/[^0-9.-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") {
    return null;
  }
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * Pure sort over a row list. `getValue` returns the comparable value for a
 * column key (a number for numeric columns via `parseNumeric`, a string
 * otherwise). Null/empty values always sort LAST regardless of direction
 * (e.g. em-dash latency on blocked rows), so they never crowd the top.
 * Strings compare with `numeric: true` so "req_2" < "req_10".
 */
export function sortRows<T>(
  rows: T[],
  sort: SortState,
  getValue: (row: T, key: string) => string | number | null | undefined
): T[] {
  if (!sort.key) {
    return rows;
  }
  const key = sort.key;
  const mul = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = getValue(a, key);
    const bv = getValue(b, key);
    const aNull = av == null || av === "";
    const bNull = bv == null || bv === "";
    if (aNull && bNull) {
      return 0;
    }
    if (aNull) {
      return 1;
    }
    if (bNull) {
      return -1;
    }
    if (typeof av === "number" && typeof bv === "number") {
      return (av - bv) * mul;
    }
    return (
      String(av).localeCompare(String(bv), undefined, { numeric: true }) * mul
    );
  });
}
