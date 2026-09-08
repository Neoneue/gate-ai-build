import { describe, expect, it } from "vitest";
import {
  ROWS_ALL,
  resolveRowsPerPage,
  rowsPerPageOptions,
} from "@/components/ui/table-pagination";

/** The window every paging consumer computes (Models, AuditTrail, ...). */
function pageWindow<T>(rows: T[], page: number, rowsPerPage: string): T[] {
  const perPage = resolveRowsPerPage(rowsPerPage, rows.length);
  return rows.slice((page - 1) * perPage, page * perPage);
}

describe("rowsPerPageOptions", () => {
  it("never offers a page size larger than the list", () => {
    expect(rowsPerPageOptions(8)).toEqual([ROWS_ALL]);
    expect(rowsPerPageOptions(10)).toEqual(["10", ROWS_ALL]);
    expect(rowsPerPageOptions(11)).toEqual(["10", ROWS_ALL]);
    expect(rowsPerPageOptions(25)).toEqual(["10", "25", ROWS_ALL]);
    expect(rowsPerPageOptions(26)).toEqual(["10", "25", ROWS_ALL]);
    expect(rowsPerPageOptions(50)).toEqual(["10", "25", "50", ROWS_ALL]);
    expect(rowsPerPageOptions(153)).toEqual(["10", "25", "50", ROWS_ALL]);
  });

  it("always ends with All", () => {
    for (const total of [0, 8, 10, 11, 25, 26, 50, 153]) {
      expect(rowsPerPageOptions(total).at(-1)).toBe(ROWS_ALL);
    }
  });
});

describe("resolveRowsPerPage", () => {
  it("parses numeric options and resolves All to the full list", () => {
    expect(resolveRowsPerPage("25", 76)).toBe(25);
    expect(resolveRowsPerPage(ROWS_ALL, 76)).toBe(76);
    expect(resolveRowsPerPage(ROWS_ALL, 0)).toBe(1);
  });

  it("falls back to the list length when the page size outgrows the list", () => {
    expect(resolveRowsPerPage("50", 20)).toBe(20);
    expect(resolveRowsPerPage("25", 25)).toBe(25);
    expect(resolveRowsPerPage("10", 8)).toBe(8);
    expect(resolveRowsPerPage("10", 0)).toBe(1);
  });

  it("agrees with the All the footer displays for a dropped option", () => {
    // A stale "50" is not in the options for a 20-row list, so the footer
    // shows "All" — the slice math must match, or the label lies.
    expect(rowsPerPageOptions(20)).not.toContain("50");
    expect(resolveRowsPerPage("50", 20)).toBe(resolveRowsPerPage(ROWS_ALL, 20));
  });
});

describe("page window at the default page size", () => {
  const rows = Array.from({ length: 76 }, (_, i) => i);

  it("slices page 1, page 2, and the short last page", () => {
    expect(pageWindow(rows, 1, "25")).toEqual(rows.slice(0, 25));
    expect(pageWindow(rows, 2, "25")).toEqual(rows.slice(25, 50));
    const last = pageWindow(rows, 4, "25");
    expect(last).toHaveLength(1);
    expect(last[0]).toBe(75);
  });

  it("returns everything for All", () => {
    expect(pageWindow(rows, 1, ROWS_ALL)).toHaveLength(76);
  });
});
