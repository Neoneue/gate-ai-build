import { describe, expect, it } from "vitest";
import {
  getEventFindingCopy,
  getRequestFindings,
  REQUEST_ROWS_ALL,
  REQUEST_ROWS_RECENT,
  requestRowId,
} from "@/data/requests";

describe("requestRowId", () => {
  it("prefers the canonical requestId when present", () => {
    const row = REQUEST_ROWS_ALL.find((r) => r.requestId);
    expect(row).toBeDefined();
    expect(requestRowId(row!)).toBe(row!.requestId);
  });

  it("derives a deterministic fallback id from conversation + code", () => {
    const base = REQUEST_ROWS_ALL[0];
    const row = {
      ...base,
      requestId: undefined,
      conversation: "cnv_9fed01e5",
      code: "200",
    };
    const id = requestRowId(row);
    expect(id).toBe(requestRowId({ ...row }));
    expect(id.startsWith("req_")).toBe(true);
  });
});

describe("request row invariants", () => {
  it("every row resolves to a non-empty row id", () => {
    for (const row of REQUEST_ROWS_ALL) {
      expect(requestRowId(row).length).toBeGreaterThan(4);
    }
  });

  it("findings only carry known categories", () => {
    for (const row of REQUEST_ROWS_ALL) {
      for (const finding of getRequestFindings(row).findings) {
        expect(["pii", "credential", "injection"]).toContain(finding.category);
      }
    }
  });

  it("recent rows are a subset of the all-range rows by identity", () => {
    const allIds = new Set(REQUEST_ROWS_ALL.map((r) => requestRowId(r)));
    for (const row of REQUEST_ROWS_RECENT) {
      expect(allIds.has(requestRowId(row))).toBe(true);
    }
  });
});

describe("getEventFindingCopy", () => {
  it("returns null for unknown request ids and missing input", () => {
    expect(getEventFindingCopy("req_does_not_exist", "pii")).toBeNull();
    expect(getEventFindingCopy(undefined, "pii")).toBeNull();
  });

  it("returns finding copy for a row that carries that finding", () => {
    const row = REQUEST_ROWS_ALL.find(
      (r) =>
        r.requestId &&
        getRequestFindings(r).findings.some((f) => f.category === "pii")
    );
    expect(row).toBeDefined();
    const copy = getEventFindingCopy(row!.requestId, "pii");
    expect(copy).not.toBeNull();
    expect(copy!.message.length).toBeGreaterThan(0);
  });
});
