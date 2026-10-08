import { describe, expect, it } from "vitest";
import { MESSAGE_TOTALS } from "@/data/message-totals";
import {
  ENTERPRISE_CONTRACT_CEILING_DAYS,
  FREE_RETENTION_DAYS,
  formatDays,
  formatDeletionRun,
  type MessageCurveAnchor,
  messagesInWindow,
  metricsRetentionDays,
  nextDeletionRun,
  normalizeDaysInput,
  oldestInWindow,
  PRO_RETENTION_CEILING_DAYS,
  readDaysInput,
  retentionCeilingDays,
  retentionCutoff,
  shortenPreview,
} from "@/lib/retention";
import {
  lifetimeDays,
  MESSAGE_TIMES,
  messageCurve,
} from "@/pages/settings/retention-data";

const utc = (iso: string) => new Date(`${iso}Z`);

describe("retentionCeilingDays", () => {
  it("maps each tier to its PRD ceiling", () => {
    expect(retentionCeilingDays("free")).toBe(FREE_RETENTION_DAYS);
    expect(retentionCeilingDays("pro")).toBe(PRO_RETENTION_CEILING_DAYS);
    expect(retentionCeilingDays("enterprise")).toBe(
      ENTERPRISE_CONTRACT_CEILING_DAYS
    );
    expect([FREE_RETENTION_DAYS, PRO_RETENTION_CEILING_DAYS]).toEqual([30, 90]);
    expect(ENTERPRISE_CONTRACT_CEILING_DAYS).toBe(90);
  });
});

describe("metricsRetentionDays", () => {
  it("is tier-fixed per the pricing page: Free 90, Pro and Enterprise 180", () => {
    expect(metricsRetentionDays("free")).toBe(90);
    expect(metricsRetentionDays("pro")).toBe(180);
    expect(metricsRetentionDays("enterprise")).toBe(180);
  });
});

describe("nextDeletionRun", () => {
  it("lands on today's 03:00 UTC before it has passed", () => {
    expect(nextDeletionRun(utc("2026-10-07T01:00:00")).toISOString()).toBe(
      "2026-10-07T03:00:00.000Z"
    );
  });

  it("rolls to tomorrow once today's run has started", () => {
    expect(nextDeletionRun(utc("2026-10-07T03:00:00")).toISOString()).toBe(
      "2026-10-08T03:00:00.000Z"
    );
    expect(nextDeletionRun(utc("2026-10-07T18:30:00")).toISOString()).toBe(
      "2026-10-08T03:00:00.000Z"
    );
  });

  it("crosses a month boundary", () => {
    expect(nextDeletionRun(utc("2026-10-31T12:00:00")).toISOString()).toBe(
      "2026-11-01T03:00:00.000Z"
    );
  });
});

describe("messagesInWindow", () => {
  const anchors: MessageCurveAnchor[] = [
    { days: 0, messages: 0 },
    { days: 10, messages: 100 },
    { days: 20, messages: 400 },
  ];

  it("reads anchors exactly and interpolates between them", () => {
    expect(messagesInWindow(anchors, 10)).toBe(100);
    expect(messagesInWindow(anchors, 5)).toBe(50);
    expect(messagesInWindow(anchors, 15)).toBe(250);
  });

  it("holds nothing at 0 days and everything past the lifetime", () => {
    expect(messagesInWindow(anchors, 0)).toBe(0);
    expect(messagesInWindow(anchors, 20)).toBe(400);
    expect(messagesInWindow(anchors, 365)).toBe(400);
  });
});

describe("oldestInWindow", () => {
  const now = utc("2026-10-07T12:00:00");
  const records = [
    utc("2026-10-07T11:00:00"),
    utc("2026-10-01T00:00:00"),
    utc("2026-09-01T00:00:00"),
  ];

  it("finds the oldest record the window still holds", () => {
    expect(oldestInWindow(records, now, 30)?.toISOString()).toBe(
      "2026-10-01T00:00:00.000Z"
    );
    expect(oldestInWindow(records, now, 90)?.toISOString()).toBe(
      "2026-09-01T00:00:00.000Z"
    );
  });

  it("holds none at 0 days", () => {
    expect(oldestInWindow(records, now, 0)).toBeNull();
  });
});

describe("shortenPreview", () => {
  const now = utc("2026-10-07T12:00:00");
  const anchors: MessageCurveAnchor[] = [
    { days: 0, messages: 0 },
    { days: 30, messages: 300 },
    { days: 90, messages: 900 },
  ];

  it("counts what the shorter window drops and names the next run", () => {
    const preview = shortenPreview(anchors, now, 90, 30);
    expect(preview.count).toBe(600);
    expect(preview.runAt.toISOString()).toBe("2026-10-08T03:00:00.000Z");
    expect(preview.cutoff.toISOString()).toBe("2026-09-07T12:00:00.000Z");
  });

  it("deletes everything the window held when shortened to 0", () => {
    expect(shortenPreview(anchors, now, 90, 0).count).toBe(900);
  });
});

describe("Messages counts reconcile (data-model.md §5.1)", () => {
  const now = new Date();
  const curve = messageCurve(now);

  it("prints the Messages hero pill at 1, 7, 30 days and the lifetime", () => {
    expect(messagesInWindow(curve, 1)).toBe(MESSAGE_TOTALS["24h"]);
    expect(messagesInWindow(curve, 7)).toBe(MESSAGE_TOTALS["7d"]);
    expect(messagesInWindow(curve, 30)).toBe(MESSAGE_TOTALS["30d"]);
    expect(messagesInWindow(curve, lifetimeDays(now))).toBe(MESSAGE_TOTALS.all);
  });

  it("every paid org starts at its ceiling and holds every message", () => {
    for (const ceiling of [
      PRO_RETENTION_CEILING_DAYS,
      ENTERPRISE_CONTRACT_CEILING_DAYS,
    ]) {
      expect(messagesInWindow(curve, ceiling)).toBe(MESSAGE_TOTALS.all);
    }
  });

  it("the owner's spot checks hold", () => {
    expect(shortenPreview(curve, now, 90, 30).count).toBe(2612);
    expect(shortenPreview(curve, now, 365, 7).count).toBe(4392);
  });

  it("the dialog's count and the card's facts reconcile", () => {
    // What the dialog says goes + what the card shows after saving =
    // what the card showed before saving, for every step down.
    for (const [fromDays, toDays] of [
      [90, 60],
      [90, 30],
      [90, 7],
      [90, 1],
      [90, 0],
      [30, 7],
      [365, 45],
    ]) {
      const eligible = shortenPreview(curve, now, fromDays, toDays).count;
      expect(eligible + messagesInWindow(curve, toDays)).toBe(
        messagesInWindow(curve, fromDays)
      );
    }
  });

  it("the cutoff matches the window the card measures", () => {
    expect(shortenPreview(curve, now, 90, 30).cutoff).toEqual(
      retentionCutoff(now, 30)
    );
  });

  it("the oldest message at a paid ceiling is the oldest Messages row", () => {
    const oldestRow = Math.min(...MESSAGE_TIMES.map((d) => d.getTime()));
    expect(oldestInWindow(MESSAGE_TIMES, now, 90)?.getTime()).toBe(oldestRow);
  });
});

describe("days input", () => {
  it("keeps digits only and collapses leading zeros", () => {
    expect(normalizeDaysInput("30 days")).toBe("30");
    expect(normalizeDaysInput(" 007")).toBe("7");
    expect(normalizeDaysInput("-5")).toBe("5");
    expect(normalizeDaysInput("abc")).toBe("");
    expect(normalizeDaysInput("0")).toBe("0");
  });

  it("reads empty, valid and above-ceiling values", () => {
    expect(readDaysInput("", 90)).toEqual({ kind: "empty" });
    expect(readDaysInput("0", 90)).toEqual({ kind: "valid", days: 0 });
    expect(readDaysInput("90", 90)).toEqual({ kind: "valid", days: 90 });
    expect(readDaysInput("91", 90)).toEqual({
      kind: "above-ceiling",
      days: 91,
    });
  });
});

describe("formatting", () => {
  it("prints the run in UTC whatever the viewer's zone", () => {
    expect(formatDeletionRun(utc("2026-10-08T03:00:00"))).toMatch(/03:00 UTC$/);
  });

  it("pluralizes days", () => {
    expect(formatDays(1)).toBe("1 day");
    expect(formatDays(0)).toBe("0 days");
    expect(formatDays(30)).toBe("30 days");
  });
});
