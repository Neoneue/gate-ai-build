import { expect, test } from "vitest";
import { type PresetRange, RANGE_SCALE } from "@/lib/range";
import {
  TOTAL_7D_BASE_INPUT_TOKENS,
  TOTAL_7D_BASE_REQUESTS,
} from "@/pages/activity-data";
import { KPI_BY_RANGE } from "@/pages/token-savings-data";
import {
  ATTRIBUTION_START,
  allocateTenths,
  COMPARABILITY_EPOCH,
  LOW_VOLUME_REQUESTS,
  passesForPlan,
  resolveWindow,
  SUMMARY_COPY,
  summaryFor,
} from "@/pages/token-savings-summary";

const RANGES: PresetRange[] = ["all", "24h", "7d", "30d"];
const ON = { compressionOn: true, cachingOn: true, plan: "pro" as const };

const tenths = (label: string) => Math.round(Number.parseFloat(label) * 10);

test("figures divide back to the Overview tile rates (charts must reconcile)", () => {
  for (const range of RANGES) {
    const m = summaryFor(range, null, ON);
    const [, caching, compression] = KPI_BY_RANGE[range];
    const compressionRate = (m.inputTokensRemoved / m.inputTokensSent) * 100;
    const cachingRate = (m.cacheAnswered / m.requests) * 100;
    expect(compressionRate).toBeCloseTo(Number(compression.value), 1);
    expect(cachingRate).toBeCloseTo(Number(caching.value), 1);
    expect(m.compressionRateLabel).toBe(`${compression.value}%`);
    expect(m.cachingRateLabel).toBe(`${caching.value}%`);
  }
});

test("denominators are the site's totals scaled to the window", () => {
  for (const range of RANGES) {
    const m = summaryFor(range, null, ON);
    expect(m.requests).toBe(
      Math.round(TOTAL_7D_BASE_REQUESTS * RANGE_SCALE[range])
    );
    expect(m.inputTokensSent).toBe(
      Math.round(TOTAL_7D_BASE_INPUT_TOKENS * RANGE_SCALE[range])
    );
  }
});

test("breakdown: two levels on ONE basis (the Total saved tile); every printed share sums to 100.0, ranked", () => {
  for (const range of RANGES) {
    const m = summaryFor(range, null, ON);
    const [total, caching, compression] = KPI_BY_RANGE[range];
    const comp = m.mechanisms.find((x) => x.id === "compression");
    const cache = m.mechanisms.find((x) => x.id === "cache");
    if (!(comp && cache)) {
      throw new Error("mechanism row missing");
    }
    // Shares come from the tile values, nothing else.
    const totalPoints = Number(compression.value) + Number(caching.value);
    expect(totalPoints).toBeCloseTo(Number(total.value), 0);
    expect(comp.share).toBeCloseTo(
      (Number(compression.value) / totalPoints) * 100,
      0
    );
    expect(cache.share).toBeCloseTo(
      (Number(caching.value) / totalPoints) * 100,
      0
    );
    expect(tenths(comp.shareLabel) + tenths(cache.shareLabel)).toBe(1000);
    expect(comp.passes).toHaveLength(8);
    const passTenths = comp.passes.reduce(
      (s, r) => s + tenths(r.shareLabel),
      0
    );
    expect(passTenths).toBe(tenths(comp.shareLabel));
    expect(cache.passes).toHaveLength(0);
    expect(m.mechanisms[0].share).toBeGreaterThanOrEqual(m.mechanisms[1].share);
    for (let i = 1; i < comp.passes.length; i++) {
      expect(comp.passes[i - 1].share).toBeGreaterThanOrEqual(
        comp.passes[i].share
      );
    }
  }
});

test("allocateTenths distributes the whole and only the whole", () => {
  expect(
    allocateTenths(
      897,
      [0.46, 0.27, 0.09, 0.06, 0.05, 0.03, 0.03, 0.01]
    ).reduce((a, b) => a + b, 0)
  ).toBe(897);
  expect(allocateTenths(1000, [0.5, 0.5])).toEqual([500, 500]);
  expect(allocateTenths(0, [0.7, 0.3])).toEqual([0, 0]);
});

test("pass weights: Pro runs all eight, Free the Basic four, both sum to 1", () => {
  const pro = passesForPlan("pro");
  const free = passesForPlan("free");
  expect(pro).toHaveLength(8);
  expect(free).toHaveLength(4);
  expect(free.every((p) => p.tier === "free")).toBe(true);
  expect(pro.reduce((s, p) => s + p.weight, 0)).toBeCloseTo(1, 9);
  expect(free.reduce((s, p) => s + p.weight, 0)).toBeCloseTo(1, 9);
  const freeModel = summaryFor("all", null, { ...ON, plan: "free" });
  const freeComp = freeModel.mechanisms.find((x) => x.id === "compression");
  expect(freeComp?.passes.map((p) => p.id).sort()).toEqual([
    "blobs",
    "json",
    "lossless",
    "wrapper",
  ]);
});

test("attribution: All and 30D are partial, 7D and 24H complete", () => {
  expect(summaryFor("all", null, ON).partial).toBe(true);
  expect(summaryFor("30d", null, ON).partial).toBe(true);
  expect(summaryFor("7d", null, ON).partial).toBe(false);
  expect(summaryFor("24h", null, ON).partial).toBe(false);
  expect(ATTRIBUTION_START.getTime()).toBeGreaterThan(
    COMPARABILITY_EPOCH.getTime()
  );
});

test("a custom range starting before the epoch is clamped to it", () => {
  const early = new Date(COMPARABILITY_EPOCH);
  early.setDate(early.getDate() - 20);
  const late = new Date(COMPARABILITY_EPOCH);
  late.setDate(late.getDate() + 10);
  const clamped = summaryFor("custom", { from: early, to: late }, ON);
  expect(clamped.window.clamped).toBe(true);
  expect(clamped.window.from.getTime()).toBe(COMPARABILITY_EPOCH.getTime());
  expect(clamped.periodLabel).not.toMatch(/since/);
  const inside = summaryFor("custom", { from: late, to: late }, ON);
  expect(inside.window.clamped).toBe(false);
});

test("a window entirely before the epoch is no traffic, not zero-valued claims", () => {
  const from = new Date(COMPARABILITY_EPOCH);
  from.setDate(from.getDate() - 30);
  const to = new Date(COMPARABILITY_EPOCH);
  to.setDate(to.getDate() - 1);
  const m = summaryFor("custom", { from, to }, ON);
  expect(m.noTraffic).toBe(true);
  expect(m.requests).toBe(0);
  expect(resolveWindow("custom", { from, to }).empty).toBe(true);
});

test("switch off: the mechanism is named as off with zero figure; the other takes the whole; both off is nothing", () => {
  const noCompression = summaryFor("all", null, {
    ...ON,
    compressionOn: false,
  });
  expect(noCompression.compressionOff).toBe(true);
  expect(noCompression.inputTokensRemoved).toBe(0);
  const cache = noCompression.mechanisms.find((x) => x.id === "cache");
  expect(cache?.shareLabel).toBe("100.0%");
  expect(noCompression.mechanisms[0].id).toBe("cache");
  expect(noCompression.mechanisms[1].passes).toHaveLength(0);

  const noCaching = summaryFor("all", null, { ...ON, cachingOn: false });
  expect(noCaching.cachingOff).toBe(true);
  expect(noCaching.cacheAnswered).toBe(0);
  expect(noCaching.mechanisms[0].shareLabel).toBe("100.0%");

  const both = summaryFor("all", null, {
    ...ON,
    compressionOn: false,
    cachingOn: false,
  });
  expect(both.bothOff).toBe(true);
  expect(both.mechanisms.every((x) => x.shareLabel === "0.0%")).toBe(true);
});

test("low volume hides the passes; no preset org window is low volume", () => {
  for (const range of RANGES) {
    const m = summaryFor(range, null, ON);
    expect(m.requests).toBeGreaterThanOrEqual(LOW_VOLUME_REQUESTS);
    expect(m.lowVolume).toBe(false);
  }
});

test("copy: no dollar amounts, denominators and exclusion present", () => {
  const m = summaryFor("all", null, ON);
  const text = [
    SUMMARY_COPY.lede(m),
    SUMMARY_COPY.removed.denominator(m),
    SUMMARY_COPY.cached.denominator(m),
    SUMMARY_COPY.breakdown.basis,
    SUMMARY_COPY.exclusion.lead,
    SUMMARY_COPY.exclusion.body,
  ].join(" ");
  expect(text).not.toMatch(/\$/);
  expect(SUMMARY_COPY.removed.denominator(m)).toContain("of the");
  expect(SUMMARY_COPY.cached.denominator(m)).toContain("requests");
  expect(SUMMARY_COPY.exclusion.body).toMatch(/prompt caching/);
  expect(SUMMARY_COPY.exclusion.body).toMatch(/did not route through Gate/);
});
