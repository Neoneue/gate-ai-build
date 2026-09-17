import { describe, expect, it } from "vitest";
import {
  buildCustomHeroView,
  HERO_VIEWS,
  scaleHeroView,
  withBreakdown,
} from "./hero-data";
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
  data: withBreakdown(
    BUCKETS.map((requests, i) => ({
      time: `Sep ${i + 1} 00:00`,
      label: `Sep ${i + 1}`,
      requests,
    })),
    2
  ),
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

/** Every point's Success + Errors is its request count, and the per-point
 *  errors sum to the view's errors, so the chart tooltip can never disagree
 *  with the headline or the Success / Errors legend (charts reconcile). */
function expectReconciled(view: HeroView) {
  let errors = 0;
  for (const p of view.data) {
    expect(p.success + p.errors).toBe(p.requests);
    expect(p.errors).toBeGreaterThanOrEqual(0);
    expect(p.errors).toBeLessThanOrEqual(p.requests);
    errors += p.errors;
  }
  expect(errors).toBe(view.errors);
  expect(view.success + view.errors).toBe(view.total);
}

describe("withBreakdown", () => {
  it("reconciles every preset view", () => {
    for (const view of Object.values(HERO_VIEWS)) {
      expectReconciled(view);
    }
  });

  it("reconciles scoped views at every real share", () => {
    for (const share of SCOPED_SHARES) {
      expectReconciled(scaleHeroView(HERO_VIEWS.all, share));
    }
  });

  it("reconciles a custom range", () => {
    const view = buildCustomHeroView({
      from: new Date(2026, 8, 1),
      to: new Date(2026, 8, 8),
    });
    expectReconciled(view);
  });

  it("never puts errors in an empty bucket and caps errors at the total", () => {
    const points = withBreakdown(
      [
        { time: "a", label: "a", requests: 0 },
        { time: "b", label: "b", requests: 3 },
      ],
      10
    );
    expect(points[0].errors).toBe(0);
    expect(points[1].errors).toBe(3);
  });
});
