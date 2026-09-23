import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ROWS_ALL,
  resolveRowsPerPage,
  rowsPerPageOptions,
} from "@/components/ui/table-pagination";

/** Call sites live under src/pages; the primitive itself is the only other
 *  file that names `TablePaginationFooter`. */
const PAGES_DIR = join(import.meta.dirname, "..", "..", "pages");

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

/** Two buckets (user direction 2026-09-23): the Teams surfaces keep the floor
 *  of 10, every other table passes `minRowsPerPage={25}` and loses the 10
 *  step. The floor composes with the 2026-09-07 ceiling rule rather than
 *  replacing it. */
describe("rowsPerPageOptions floor", () => {
  it("drops the 10 step at floor 25", () => {
    expect(rowsPerPageOptions(400, 25)).toEqual(["25", "50", ROWS_ALL]);
    expect(rowsPerPageOptions(400, 25)).not.toContain("10");
  });

  it("leaves All alone when the list is under the floor", () => {
    expect(rowsPerPageOptions(12, 25)).toEqual([ROWS_ALL]);
    expect(rowsPerPageOptions(24, 25)).toEqual([ROWS_ALL]);
    expect(rowsPerPageOptions(25, 25)).toEqual(["25", ROWS_ALL]);
  });

  it("never re-adds a step larger than the list", () => {
    // The ceiling still binds: 30 rows cannot offer 50 at any floor.
    expect(rowsPerPageOptions(30, 25)).toEqual(["25", ROWS_ALL]);
    expect(rowsPerPageOptions(30, 10)).toEqual(["10", "25", ROWS_ALL]);
  });

  it("defaults to the Teams floor of 10", () => {
    for (const total of [8, 10, 25, 153]) {
      expect(rowsPerPageOptions(total)).toEqual(rowsPerPageOptions(total, 10));
    }
  });

  /** Read off the real call sites rather than a list kept here, which would
   *  be free to drift from the thing it claims to check. Every consumer of
   *  `TablePaginationFooter` declares its floor (`minRowsPerPage`, default 10)
   *  and its own default page size; a default below its floor is dropped from
   *  `options`, so the select would read "All" while the consumer still
   *  slices the smaller number. */
  it("keeps every consumer's default page size inside its own options", () => {
    const pages = readdirSync(PAGES_DIR, {
      recursive: true,
      encoding: "utf8",
    }).filter((f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx"));

    const checked: string[] = [];
    for (const file of pages) {
      const src = readFileSync(join(PAGES_DIR, file), "utf8");
      if (!src.includes("<TablePaginationFooter")) {
        continue;
      }
      // One floor per file: every table in a file belongs to one surface.
      const floors = [...src.matchAll(/minRowsPerPage=\{(\d+)\}/g)].map((m) =>
        Number(m[1])
      );
      const floor = floors.length > 0 ? Math.max(...floors) : 10;
      // Both shapes a default takes: paged state, and the one static footer
      // (`TeamDefault`) that hard-codes a single-page list.
      const defaults = [
        ...src.matchAll(
          /rowsPerPage,\s*set\w*\]\s*=\s*\w*\.?useState\("([^"]+)"\)/g
        ),
        ...src.matchAll(/\browsPerPage="([^"]+)"/g),
      ].map((m) => m[1]);
      expect(
        defaults.length,
        `${file}: no default page size found`
      ).toBeGreaterThan(0);
      for (const def of defaults) {
        expect(
          rowsPerPageOptions(1000, floor),
          `${file} floor ${floor}`
        ).toContain(def);
      }
      checked.push(file);
    }
    // The scan itself has to be load-bearing: 13 footers across 13 files
    // (2026-09-23). A regex that silently matched nothing would pass.
    expect(checked.length).toBeGreaterThanOrEqual(13);
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
