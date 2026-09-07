import { describe, expect, it } from "vitest";
import { scaleHeroView } from "./hero-data";
import type { HeroView } from "./types";

/** Bucket counts chosen so independent per-bucket rounding does NOT sum to
 *  the rounded total (e.g. 0.24 × 7 = 1.68 → 2 in several buckets). */
const BUCKETS = [7, 3, 12, 0, 5, 9, 2, 11, 6, 4, 8, 1];

const FIXTURE: HeroView = {
  eyebrow: "MESSAGES",
  total: BUCKETS.reduce((a, b) => a + b, 0),
  success: 66,
  errors: 2,
  delta: "+1.0%",
  deltaNote: "vs prior week",
  data: BUCKETS.map((requests, i) => ({
    time: `Sep ${i + 1} 00:00`,
    label: `Sep ${i + 1}`,
    requests,
  })),
  ticks: ["Sep 1 00:00", "Sep 12 00:00"],
  bucketLabel: "Messages/hr",
  domainTop: Math.max(...BUCKETS) + 1,
};

const sumRequests = (view: HeroView) =>
  view.data.reduce((a, d) => a + d.requests, 0);

/** Real Manager / Member request shares (view-scope.ts). */
const SCOPED_SHARES = [0.24, 0.06];

describe("scaleHeroView", () => {
  it("returns the input view unchanged at share 1", () => {
    expect(scaleHeroView(FIXTURE, 1)).toBe(FIXTURE);
  });

  for (const share of SCOPED_SHARES) {
    it(`headline total equals the sum of scaled buckets at share ${share}`, () => {
      const view = scaleHeroView(FIXTURE, share);
      expect(view.total).toBe(sumRequests(view));
    });

    it(`success never exceeds total and errors close the gap at share ${share}`, () => {
      const view = scaleHeroView(FIXTURE, share);
      expect(view.success).toBeLessThanOrEqual(view.total);
      expect(view.success + view.errors).toBe(view.total);
      expect(view.errors).toBeGreaterThanOrEqual(0);
    });
  }

  it("keeps the bucket count and lifts domainTop above the tallest bar", () => {
    const view = scaleHeroView(FIXTURE, 0.24);
    expect(view.data).toHaveLength(FIXTURE.data.length);
    expect(view.domainTop).toBe(
      Math.max(...view.data.map((d) => d.requests), 1) + 1
    );
  });
});
