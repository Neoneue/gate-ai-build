import { describe, expect, it } from "vitest";
import { demoMessagesHero } from "./onboarding-messages-hero";

const NOW = new Date(2026, 9, 12, 13, 11, 30);
const SENT = new Date(2026, 9, 12, 13, 10, 5);
const PRESETS = ["all", "24h", "7d", "30d"] as const;
// The Pro hero's bucket count per preset (requests/hero-data.ts).
const PRO_BUCKETS = { all: 240, "24h": 96, "7d": 168, "30d": 120 };

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

describe("demoMessagesHero", () => {
  it("reads 0 over a flat line before the first message", () => {
    for (const range of PRESETS) {
      const view = demoMessagesHero(range, null, [], NOW);
      expect(view.total).toBe(0);
      expect(view.success).toBe(0);
      expect(view.errors).toBe(0);
      expect(view.data).toHaveLength(PRO_BUCKETS[range]);
      expect(view.data.every((d) => d.requests === 0)).toBe(true);
      // hero-data.ts's floor: max(tallest bucket, 1) + 1.
      expect(view.domainTop).toBe(2);
    }
  });

  it("reads 1 with the line at 1 on the last bucket after the send", () => {
    for (const range of PRESETS) {
      const view = demoMessagesHero(range, null, [SENT], NOW);
      expect(view.total).toBe(1);
      expect(view.success).toBe(1);
      expect(view.errors).toBe(0);
      expect(sum(view.data.map((d) => d.requests))).toBe(1);
      expect(view.data.at(-1)?.requests).toBe(1);
      expect(view.data.every((d) => d.success + d.errors === d.requests)).toBe(
        true
      );
    }
  });

  it("uses only tick values that are real bucket keys", () => {
    for (const range of PRESETS) {
      const view = demoMessagesHero(range, null, [SENT], NOW);
      const keys = new Set(view.data.map((d) => d.time));
      expect(keys.size).toBe(view.data.length);
      expect(view.ticks.every((t) => keys.has(t))).toBe(true);
    }
  });

  it("counts a custom range only when it holds the send time", () => {
    const holding = {
      from: new Date(2026, 9, 10, 0, 0),
      to: new Date(2026, 9, 12, 23, 59),
    };
    const inside = demoMessagesHero("custom", holding, [SENT], NOW);
    expect(inside.total).toBe(1);
    expect(sum(inside.data.map((d) => d.requests))).toBe(1);
    // Hourly buckets from `from`: the send hour is bucket 2 * 24 + 13.
    expect(inside.data[2 * 24 + 13]?.requests).toBe(1);

    const missing = {
      from: new Date(2026, 9, 1, 0, 0),
      to: new Date(2026, 9, 5, 23, 59),
    };
    const outside = demoMessagesHero("custom", missing, [SENT], NOW);
    expect(outside.total).toBe(0);
    expect(outside.data.every((d) => d.requests === 0)).toBe(true);
  });

  it("draws a bucket for the send time on a long custom range", () => {
    const long = {
      from: new Date(2026, 0, 1, 0, 0),
      to: new Date(2026, 9, 12, 23, 59),
    };
    const view = demoMessagesHero("custom", long, [SENT], NOW);
    expect(view.total).toBe(1);
    expect(sum(view.data.map((d) => d.requests))).toBe(1);
  });

  it("counts every message, the total equal to the bucket sum", () => {
    // Chips 1, 2 and 3 a minute apart, then a second chat 1.5 hours later.
    const sends = [
      new Date(2026, 9, 12, 11, 30, 0),
      new Date(2026, 9, 12, 11, 31, 0),
      new Date(2026, 9, 12, 11, 32, 0),
      new Date(2026, 9, 12, 13, 10, 5),
    ];
    for (const range of PRESETS) {
      const view = demoMessagesHero(range, null, sends, NOW);
      expect(view.total).toBe(4);
      expect(view.success).toBe(4);
      expect(view.errors).toBe(0);
      expect(sum(view.data.map((d) => d.requests))).toBe(4);
      expect(view.domainTop).toBe(
        Math.max(...view.data.map((d) => d.requests)) + 1
      );
    }
    // 7D is hourly back from now: the three chips share the hour before the last.
    const hourly = demoMessagesHero("7d", null, sends, NOW);
    expect(hourly.data.at(-1)?.requests).toBe(1);
    expect(hourly.data.at(-2)?.requests).toBe(3);
  });

  it("counts only the sends a custom range holds", () => {
    const sends = [new Date(2026, 9, 3, 9, 0), SENT];
    const range = {
      from: new Date(2026, 9, 1),
      to: new Date(2026, 9, 5, 23, 59),
    };
    const view = demoMessagesHero("custom", range, sends, NOW);
    expect(view.total).toBe(1);
  });
});
