import { expect, test } from "vitest";
import { MESSAGE_TOTALS } from "@/data/message-totals";
import type { PresetRange } from "@/lib/range";
import { usageAt } from "@/pages/activity-data";
import { KPI_BY_RANGE } from "@/pages/token-savings-data";
import {
  allocateTenths,
  BREAKDOWN_MAX_ROWS,
  BREAKDOWN_OTHERS_LABEL,
  COMPARABILITY_EPOCH,
  LOW_VOLUME_REQUESTS,
  passesForPlan,
  resolveWindow,
  SUMMARY_COPY,
  summaryFor,
} from "@/pages/token-savings-summary";

const RANGES: PresetRange[] = ["all", "24h", "7d", "30d"];
const ON = { plan: "pro" as const };

const tenths = (label: string) => Math.round(Number.parseFloat(label) * 10);

test("figures divide back to the Overview tile rates (charts must reconcile)", () => {
  for (const range of RANGES) {
    const m = summaryFor(range, null, ON);
    const [, caching, compression] = KPI_BY_RANGE[range];
    const compressionRate = (m.inputTokensRemoved / m.inputTokensSent) * 100;
    expect(compressionRate).toBeCloseTo(Number(compression.value), 1);
    // Requests are real message counts (48 at 24H), so the cached count is
    // the tile rate applied and rounded; at that volume it cannot divide
    // back to a two-decimal rate.
    expect(m.cacheAnswered).toBe(
      Math.round((Number(caching.value) / 100) * m.requests)
    );
    expect(m.compressionRateLabel).toBe(`${compression.value}%`);
    expect(m.cachingRateLabel).toBe(`${caching.value}%`);
  }
});

test("denominators are the site's totals for the window", () => {
  for (const range of RANGES) {
    const m = summaryFor(range, null, ON);
    // The Messages page's count for the same range, and those messages'
    // real input tokens (Activity's Tokens In column summed), not a scaled
    // base.
    expect(m.requests).toBe(MESSAGE_TOTALS[range]);
    expect(m.inputTokensSent).toBe(usageAt(range, null, null).tokensIn);
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
    // Low-volume windows show the two mechanism bars only (see below).
    if (m.lowVolume) {
      expect(comp.passes).toHaveLength(0);
      continue;
    }
    // Five rows: four categories plus the "All others" catch-all, last.
    expect(comp.passes).toHaveLength(BREAKDOWN_MAX_ROWS);
    expect(comp.passes.at(-1)?.label).toBe(BREAKDOWN_OTHERS_LABEL);
    for (const r of comp.passes) {
      expect(r.share).toBeGreaterThan(0);
    }
    const passTenths = comp.passes.reduce(
      (s, r) => s + tenths(r.shareLabel),
      0
    );
    expect(passTenths).toBe(tenths(comp.shareLabel));
    expect(cache.passes).toHaveLength(0);
    expect(m.mechanisms[0].share).toBeGreaterThanOrEqual(m.mechanisms[1].share);
    // Named rows are ranked; the "All others" catch-all always sits last,
    // whatever its size.
    const named = comp.passes.filter((r) => r.id !== "others");
    for (let i = 1; i < named.length; i++) {
      expect(named[i - 1].share).toBeGreaterThanOrEqual(named[i].share);
    }
    expect(comp.passes.at(-1)?.id).toBe("others");
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

test("method shares: four categories plus All others, descending, summing to 1, same on every plan", () => {
  const methods = passesForPlan("pro");
  expect(methods.map((m) => m.label)).toEqual([
    "Tool compression",
    "Output compaction",
    "Deduplication",
    "Text trimming",
    BREAKDOWN_OTHERS_LABEL,
  ]);
  for (let i = 1; i < methods.length; i++) {
    expect(methods[i].weight).toBeLessThan(methods[i - 1].weight);
  }
  expect(methods.reduce((s, m) => s + m.weight, 0)).toBeCloseTo(1, 9);
  expect(passesForPlan("free")).toEqual(methods);
  const free = summaryFor("all", null, { ...ON, plan: "free" });
  const pro = summaryFor("all", null, ON);
  expect(free.mechanisms).toEqual(pro.mechanisms);
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

test("low volume hides the passes: 24H and 7D sit under the threshold", () => {
  // Real message counts (48 / 468 / 2,248 / 4,860 since 2026-09-25) put the
  // two short windows under LOW_VOLUME_REQUESTS.
  for (const range of RANGES) {
    const m = summaryFor(range, null, ON);
    expect(m.lowVolume).toBe(m.requests < LOW_VOLUME_REQUESTS);
  }
  expect(summaryFor("24h", null, ON).lowVolume).toBe(true);
  expect(summaryFor("7d", null, ON).lowVolume).toBe(true);
  expect(summaryFor("30d", null, ON).lowVolume).toBe(false);
  expect(summaryFor("all", null, ON).lowVolume).toBe(false);
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
  expect(SUMMARY_COPY.exclusion.body).toMatch(/did not go through Gate/);
});
