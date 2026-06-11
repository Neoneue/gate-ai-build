import { describe, expect, it } from "vitest";
import { parseNumeric, type SortState, sortRows } from "@/hooks/use-table-sort";

describe("parseNumeric", () => {
  it("parses plain and formatted numbers", () => {
    expect(parseNumeric("42")).toBe(42);
    expect(parseNumeric("$1,234.56")).toBe(1234.56);
    expect(parseNumeric("5.32s")).toBe(5.32);
  });

  it("returns null for non-numeric and placeholder values", () => {
    expect(parseNumeric("—")).toBeNull();
    expect(parseNumeric("")).toBeNull();
    expect(parseNumeric("abc")).toBeNull();
  });
});

describe("sortRows", () => {
  type Row = { id: string; latency: string | null };
  const rows: Row[] = [
    { id: "req_10", latency: "2.0s" },
    { id: "req_2", latency: null },
    { id: "req_1", latency: "1.0s" },
  ];
  const getValue = (row: Row, key: string) =>
    key === "latency"
      ? row.latency === null
        ? null
        : parseNumeric(row.latency)
      : row.id;

  it("returns the original order when no sort key is active", () => {
    const sort: SortState = { key: null, dir: "asc" };
    expect(sortRows(rows, sort, getValue).map((r) => r.id)).toEqual([
      "req_10",
      "req_2",
      "req_1",
    ]);
  });

  it("compares strings numeric-aware (req_2 < req_10)", () => {
    const sort: SortState = { key: "id", dir: "asc" };
    expect(sortRows(rows, sort, getValue).map((r) => r.id)).toEqual([
      "req_1",
      "req_2",
      "req_10",
    ]);
  });

  it("sorts null values last regardless of direction", () => {
    const asc = sortRows(rows, { key: "latency", dir: "asc" }, getValue);
    const desc = sortRows(rows, { key: "latency", dir: "desc" }, getValue);
    expect(asc.at(-1)?.id).toBe("req_2");
    expect(desc.at(-1)?.id).toBe("req_2");
    expect(asc.map((r) => r.id)).toEqual(["req_1", "req_10", "req_2"]);
    expect(desc.map((r) => r.id)).toEqual(["req_10", "req_1", "req_2"]);
  });

  it("does not mutate the input array", () => {
    const copy = [...rows];
    sortRows(rows, { key: "id", dir: "asc" }, getValue);
    expect(rows).toEqual(copy);
  });
});
