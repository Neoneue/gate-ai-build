import { describe, expect, it } from "vitest";
import {
  EVENT_ROWS,
  fmtRelative,
  KIND_BADGE_VARIANT,
  NOW,
  truncateHex,
} from "@/data/audit-trail";

describe("fmtRelative", () => {
  const ago = (seconds: number) => new Date(NOW.getTime() - seconds * 1000);

  it("formats each magnitude bucket", () => {
    expect(fmtRelative(ago(30))).toBe("30s ago");
    expect(fmtRelative(ago(5 * 60))).toBe("5m ago");
    expect(fmtRelative(ago(3 * 3600))).toBe("3h ago");
    expect(fmtRelative(ago(2 * 86_400))).toBe("2d ago");
    expect(fmtRelative(ago(14 * 86_400))).toBe("2w ago");
    expect(fmtRelative(ago(60 * 86_400))).toBe("2mo ago");
  });

  it("clamps future timestamps to 0s instead of going negative", () => {
    expect(fmtRelative(new Date(NOW.getTime() + 60_000))).toBe("0s ago");
  });
});

describe("truncateHex", () => {
  it("leaves short strings untouched", () => {
    expect(truncateHex("abc123")).toBe("abc123");
  });

  it("keeps the first and last 6 chars around an ellipsis", () => {
    const hash = "0123456789abcdef0123456789abcdef";
    expect(truncateHex(hash)).toBe("012345…abcdef");
  });
});

describe("EVENT_ROWS invariants", () => {
  it("has globally unique event ids", () => {
    const ids = EVENT_ROWS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only contains timestamps at or before the mock clock", () => {
    for (const row of EVENT_ROWS) {
      expect(row.at.getTime()).toBeLessThanOrEqual(NOW.getTime());
    }
  });

  it("has a badge variant for every event kind in the data", () => {
    for (const row of EVENT_ROWS) {
      expect(KIND_BADGE_VARIANT[row.kind]).toBeDefined();
    }
  });
});
