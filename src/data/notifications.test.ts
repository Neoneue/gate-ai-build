import { describe, expect, it } from "vitest";
import {
  KIND_META,
  NOTIFICATION_HISTORY,
  NOTIFICATION_ITEMS,
  NOTIFICATIONS_CAP,
  NOTIFICATIONS_NOW,
} from "@/data/notifications";
import { REQUEST_ROWS_ALL, requestRowId } from "@/data/requests";
import { EVENT_ROWS as SECURITY_EVENT_ROWS } from "@/pages/security-data";

describe("NOTIFICATION_HISTORY", () => {
  it("has unique ids across the whole history", () => {
    const ids = NOTIFICATION_HISTORY.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("is newest-first, never post-dates the clock, and has real depth", () => {
    expect(NOTIFICATION_HISTORY.length).toBeGreaterThan(NOTIFICATIONS_CAP);
    for (let i = 1; i < NOTIFICATION_HISTORY.length; i++) {
      expect(NOTIFICATION_HISTORY[i - 1].at.getTime()).toBeGreaterThanOrEqual(
        NOTIFICATION_HISTORY[i].at.getTime()
      );
    }
    for (const item of NOTIFICATION_HISTORY) {
      expect(item.at.getTime()).toBeLessThanOrEqual(
        NOTIFICATIONS_NOW.getTime()
      );
    }
  });

  it("is the source the bell slices from", () => {
    expect(NOTIFICATION_ITEMS).toEqual(
      NOTIFICATION_HISTORY.slice(0, NOTIFICATIONS_CAP)
    );
  });
});

describe("NOTIFICATION_ITEMS", () => {
  it("has unique ids", () => {
    const ids = NOTIFICATION_ITEMS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("stays within the preview cap and is newest-first", () => {
    expect(NOTIFICATION_ITEMS.length).toBeGreaterThan(0);
    expect(NOTIFICATION_ITEMS.length).toBeLessThanOrEqual(NOTIFICATIONS_CAP);
    for (let i = 1; i < NOTIFICATION_ITEMS.length; i++) {
      expect(NOTIFICATION_ITEMS[i - 1].at.getTime()).toBeGreaterThanOrEqual(
        NOTIFICATION_ITEMS[i].at.getTime()
      );
    }
  });

  it("never post-dates the feed clock", () => {
    for (const item of NOTIFICATION_ITEMS) {
      expect(item.at.getTime()).toBeLessThanOrEqual(
        NOTIFICATIONS_NOW.getTime()
      );
    }
  });

  it("covers every kind in KIND_META and vice versa", () => {
    // Record<NotificationKind, …> enforces key completeness at compile
    // time; this guards the runtime feed against a kind losing its rows.
    // The HISTORY carries the invariant — the bell's newest-8 slice can
    // legitimately miss a kind whose latest firing is older than the cut.
    const fedKinds = new Set(NOTIFICATION_HISTORY.map((item) => item.kind));
    for (const kind of Object.keys(KIND_META)) {
      expect(fedKinds.has(kind as keyof typeof KIND_META)).toBe(true);
    }
    for (const kind of fedKinds) {
      expect(KIND_META[kind]).toBeDefined();
    }
  });

  it("security hrefs target events that exist on the Security page", () => {
    const eventIds = new Set(SECURITY_EVENT_ROWS.map((row) => row.requestId));
    const securityItems = NOTIFICATION_HISTORY.filter(
      (item) => item.kind === "security"
    );
    expect(securityItems.length).toBeGreaterThan(0);
    for (const item of securityItems) {
      const openId = new URLSearchParams(item.href.split("?")[1]).get("open");
      expect(openId).toBeTruthy();
      expect(eventIds.has(openId as string)).toBe(true);
    }
  });

  it("message hrefs resolve via the RequestsFindings lookup", () => {
    // Mirrors RequestsFindings.tsx: REQUEST_ROWS_ALL.find(
    //   (r) => requestRowId(r) === :requestId). A `req_*` display id here
    // would land on "Request not found".
    const messageItems = NOTIFICATION_ITEMS.filter(
      (item) => item.kind === "message"
    );
    expect(messageItems.length).toBeGreaterThan(0);
    for (const item of messageItems) {
      const param = item.href.replace("/messages-findings/", "");
      expect(param.startsWith("req_")).toBe(false);
      const row = REQUEST_ROWS_ALL.find((r) => requestRowId(r) === param);
      expect(row).toBeDefined();
    }
  });

  it("gives every item a title, copy, and icon", () => {
    for (const item of NOTIFICATION_HISTORY) {
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.copy.length).toBeGreaterThan(0);
      expect(item.Icon).toBeDefined();
    }
  });
});
