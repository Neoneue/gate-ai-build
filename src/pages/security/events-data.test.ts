import { expect, test } from "vitest";
import { MESSAGE_TOTALS } from "@/data/message-totals";
import { REQUEST_ROWS_ALL } from "@/data/requests";
import {
  allocate,
  attackTypeCounts,
  buildEventsChartView,
  EVENTS_RANGE_TOTAL,
  eventsTotal,
  splitEventMix,
} from "@/pages/security/events-data";

const RANGES = ["24h", "7d", "30d", "all"] as const;

test("attack types and action types both sum to the range's event total", () => {
  const bad: string[] = [];
  for (const range of RANGES) {
    const total = eventsTotal(range, null);
    const attack = attackTypeCounts(range, null).reduce(
      (a, c) => a + c.count,
      0
    );
    const { blocked, flagged, redacted } = splitEventMix(total);
    if (attack !== total) {
      bad.push(`${range}: attack types ${attack} != events ${total}`);
    }
    if (blocked + flagged + redacted !== total) {
      bad.push(`${range}: action types != events ${total}`);
    }
  }
  expect(bad.join("\n")).toBe("");
});

test("allocate sums exactly and tracks weights", () => {
  expect(allocate(161, [8, 5, 3])).toEqual([81, 50, 30]);
  expect(allocate(0, [1, 2])).toEqual([0, 0]);
  expect(allocate(10, [0, 0])).toEqual([0, 0]);
  expect(allocate(7, [1, 1, 1]).reduce((a, b) => a + b, 0)).toBe(7);
});

// The chart tooltip lists Total / Blocked / Flagged / Redacted per bucket.
// Every point's three counts sum to its total, and across the series each
// type sums to the same split the headline breakdown shows, so the tooltip
// can never disagree with the KPI or the Action-types card.
test("chart points carry a per-bucket action split that reconciles", () => {
  for (const range of RANGES) {
    const view = buildEventsChartView(range, null);
    const split = splitEventMix(eventsTotal(range, null));
    const sum = { blocked: 0, flagged: 0, redacted: 0, requests: 0 };
    for (const p of view.data) {
      expect(p.blocked + p.flagged + p.redacted).toBe(p.requests);
      sum.blocked += p.blocked;
      sum.flagged += p.flagged;
      sum.redacted += p.redacted;
      sum.requests += p.requests;
    }
    expect(sum.blocked).toBe(split.blocked);
    expect(sum.flagged).toBe(split.flagged);
    expect(sum.redacted).toBe(split.redacted);
    expect(sum.requests).toBe(eventsTotal(range, null));
  }
});

test("event totals are the Messages rows' own finding rate applied to the message totals", () => {
  // The org Security page may not claim a finding rate the Messages list
  // contradicts: events / messages === non-allow rows / all rows.
  const share =
    REQUEST_ROWS_ALL.filter((r) => r.guardrail !== "allow").length /
    REQUEST_ROWS_ALL.length;
  for (const range of RANGES) {
    expect(EVENTS_RANGE_TOTAL[range]).toBe(
      Math.round(MESSAGE_TOTALS[range] * share)
    );
  }
});

test("splitEventMix never hands out more events than the total, even for a fractional input", () => {
  // The team security chart fed it fractional buckets (0.24, 1.91), and its
  // tooltip rows summed past their Total.
  for (const raw of [0, 0.24, 0.5, 1.91, 3.51, 4, 4.4, 17, 17.6, 1215]) {
    const { blocked, flagged, redacted } = splitEventMix(raw);
    expect(blocked + flagged + redacted, String(raw)).toBe(Math.round(raw));
  }
});
