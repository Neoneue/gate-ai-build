import { describe, expect, it } from "vitest";
import {
  getEventFindingCopy,
  getRequestFindings,
  REQUEST_ROWS_ALL,
  REQUEST_ROWS_RECENT,
  requestIdLabel,
  requestRowId,
  shortRequestId,
} from "@/data/requests";

/** The shape `gateway_requests.request_id` actually holds: gate-main fills it
 *  with `randomUUID()`, so both the authored ids and the fallback are UUID
 *  v4-shaped. `req_*` is a DISPLAY shortening, never a stored value. */
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

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
    expect(id).toMatch(UUID_V4);
  });

  it("gives every row a UUID-shaped id, authored or derived", () => {
    for (const row of REQUEST_ROWS_ALL) {
      expect(requestRowId(row)).toMatch(UUID_V4);
    }
  });

  it("shortens to the req_ display form gate-main uses", () => {
    expect(shortRequestId("5ef89e48-0545-40cb-8b7f-9f6045eace37")).toBe(
      "req_5ef89e"
    );
    expect(shortRequestId(null)).toBe("—");
  });

  it("labels a row with the first two UUID segments", () => {
    expect(requestIdLabel("5ef89e48-0545-40cb-8b7f-9f6045eace37")).toBe(
      "5ef89e48-0545"
    );
    expect(requestIdLabel(null)).toBe("—");
  });

  it("keeps row labels unique across every row", () => {
    // The label is what a person reads on the row, so it has to stay
    // distinguishing on its own — truncating to two segments must not
    // reintroduce the collisions the full id was fixed to avoid.
    const labels = REQUEST_ROWS_ALL.map((r) => requestIdLabel(requestRowId(r)));
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("keeps row ids unique so deep links cannot collide", () => {
    const ids = REQUEST_ROWS_ALL.map((r) => requestRowId(r));
    expect(new Set(ids).size).toBe(ids.length);
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
