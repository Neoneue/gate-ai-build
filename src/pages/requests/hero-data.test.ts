import { describe, expect, it } from "vitest";
import {
  buildCustomHeroView,
  HERO_VIEWS,
  scaleHeroView,
  withBreakdown,
} from "./hero-data";
import type { HeroView, RangeKey } from "./types";

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

/** Scoped totals a Manager or Member can read: small ones (0, 1, 9) are
 *  the case per-bucket share scaling used to round to 0. */
const SCOPED_TOTALS = [0, 1, 9, 17, 41];

describe("scaleHeroView", () => {
  it("returns the input view unchanged at its own total", () => {
    expect(scaleHeroView(FIXTURE, FIXTURE.total)).toBe(FIXTURE);
  });

  for (const target of SCOPED_TOTALS) {
    it(`headline equals the target and the sum of its buckets at ${target}`, () => {
      const view = scaleHeroView(FIXTURE, target);
      expect(view.total).toBe(target);
      expect(sumRequests(view)).toBe(target);
    });

    it(`success never exceeds total and errors close the gap at ${target}`, () => {
      const view = scaleHeroView(FIXTURE, target);
      expect(view.success).toBeLessThanOrEqual(view.total);
      expect(view.success + view.errors).toBe(view.total);
      expect(view.errors).toBeGreaterThanOrEqual(0);
    });
  }

  it("keeps the bucket count and lifts domainTop above the tallest bar", () => {
    const view = scaleHeroView(FIXTURE, 17);
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

  it("reconciles scoped views at every scoped total", () => {
    for (const target of SCOPED_TOTALS) {
      expectReconciled(scaleHeroView(HERO_VIEWS.all, target));
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

/** smk-2 guard: the hero AreaChart must never receive a malformed point.
 *  A non-finite `requests` or a tick that is not a member of the series
 *  makes recharts emit `<line> attribute x1/x2: Expected length` and drop
 *  the axis. Covers every preset range AND the Manager / Member scoped
 *  narrowings, which rebuild the series through `scaleHeroView`. */
describe("hero series shape", () => {
  const views: [string, HeroView][] = [
    ...(Object.keys(HERO_VIEWS) as RangeKey[]).map(
      (key) => [key, HERO_VIEWS[key]] as [string, HeroView]
    ),
    ...SCOPED_TOTALS.flatMap((target) =>
      (["all", "24h", "7d", "30d"] as RangeKey[]).map(
        (key) =>
          [`${key} @ ${target}`, scaleHeroView(HERO_VIEWS[key], target)] as [
            string,
            HeroView,
          ]
      )
    ),
  ];

  it.each(views)("keeps %s well-formed for the chart", (_name, view) => {
    for (const point of view.data) {
      expect(typeof point.time).toBe("string");
      expect(point.time.length).toBeGreaterThan(0);
      expect(point.label.length).toBeGreaterThan(0);
      for (const n of [point.requests, point.success, point.errors]) {
        expect(Number.isFinite(n)).toBe(true);
        expect(n).toBeGreaterThanOrEqual(0);
      }
    }
    const times = new Set(view.data.map((d) => d.time));
    for (const tick of view.ticks) {
      expect(times.has(tick)).toBe(true);
    }
    expect(Number.isFinite(view.domainTop)).toBe(true);
    expect(view.domainTop).toBeGreaterThan(0);
  });
});
