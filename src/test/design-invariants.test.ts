/**
 * Pure design / data invariants. Node environment (the vitest default) — no
 * component is mounted here, only the modules that own the numbers.
 *
 * Each case names the rule it enforces, because the point is the product
 * fact, not the current value: "Compression % always one decimal", "Range
 * selectors default to All", "Revoked keys are never selectable", "Charts
 * must reconcile: the KPI total equals the sum of its bars".
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { API_KEY_SEED_ROWS } from "@/data/api-keys";
import { REQUEST_ROWS_ALL } from "@/data/requests";
import { ASSIGNABLE_KEYS, TEAM_SEED_ROWS } from "@/data/teams";
import { RANGE_OPTIONS } from "@/lib/range";
import { TOKENS_TOTALS_7D, TOTAL_7D_BASE_TOKENS } from "@/pages/activity-data";
import { rangeStore } from "@/pages/requests/range-store";
import {
  allocate,
  attackTypeCounts,
  buildEventsChartView,
  type EventsRange,
  eventsTotal,
  splitEventMix,
} from "@/pages/security/events-data";
import { teamSavingsKpis } from "@/pages/teams/savings-data";
import { RANGE_OPTIONS as SAVINGS_RANGE_OPTIONS } from "@/pages/token-savings-data";
import { allocateTenths, summaryFor } from "@/pages/token-savings-summary";

const PRESET_RANGES: EventsRange[] = ["all", "24h", "7d", "30d"];

/* ─── Compression % always one decimal ──────────────────────────────────── */

describe("compression % renders with exactly one decimal", () => {
  const authored = REQUEST_ROWS_ALL.filter((r) => r.compression);

  it("the seed actually carries compression overrides to check", () => {
    expect(authored.length).toBeGreaterThan(0);
  });

  it.each(
    authored.map((r) => [r.compression as string])
  )("%s is a one-decimal percentage", (value) => {
    expect(value).toMatch(/^\d+\.\d%$/);
  });

  /* EXPECTED TO FAIL — see the report. `compressionValue` in
   * RequestDetailBody.tsx returns `${Math.round(pct)}%` for every row without
   * an authored override, so the detail KPI prints "27%" where the rule says
   * "27.3%". The function is module-private, so the invariant is asserted
   * against the source it is written in. */
  it("the derived fallback also prints one decimal, not a rounded integer", () => {
    const source = readFileSync(
      resolve(import.meta.dirname, "../pages/requests/RequestDetailBody.tsx"),
      "utf8"
    );
    const fn = source.slice(
      source.indexOf("function compressionValue"),
      source.indexOf("function KpiRail")
    );
    expect(fn).toContain("toFixed(1)");
    expect(fn).not.toContain("Math.round(pct)");
  });
});

/* ─── Range selectors default to "All" ──────────────────────────────────── */

describe('range selectors default to "All"', () => {
  it("lib/range RANGE_OPTIONS leads with All", () => {
    expect(RANGE_OPTIONS[0]).toEqual({ value: "all", label: "All" });
  });

  it("token-savings RANGE_OPTIONS leads with All", () => {
    expect(SAVINGS_RANGE_OPTIONS[0]).toEqual({ value: "all", label: "All" });
  });

  it("the Messages range store starts on all", () => {
    expect(rangeStore.current).toBe("all");
    expect(rangeStore.customRange).toBeNull();
  });
});

/* ─── Revoked keys are never selectable ─────────────────────────────────── */

describe("revoked API keys never appear in a scope list", () => {
  const revoked = API_KEY_SEED_ROWS.filter((k) => k.revoked);

  it("the seed actually carries a revoked key to exclude", () => {
    expect(revoked.length).toBeGreaterThan(0);
  });

  it("ASSIGNABLE_KEYS excludes every revoked key", () => {
    expect(ASSIGNABLE_KEYS.some((k) => k.revoked)).toBe(false);
    for (const key of revoked) {
      expect(ASSIGNABLE_KEYS.map((k) => k.id)).not.toContain(key.id);
    }
  });

  it("no seeded team holds a revoked key", () => {
    const revokedIds = new Set(revoked.map((k) => k.id));
    for (const team of TEAM_SEED_ROWS) {
      for (const id of team.keyIds) {
        expect(revokedIds.has(id)).toBe(false);
      }
    }
  });
});

/* ─── Charts must reconcile ─────────────────────────────────────────────── */

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("charts reconcile: the KPI total equals the sum of its bars", () => {
  it.each(
    PRESET_RANGES
  )("%s: the action mix sums to the events total", (range) => {
    const total = eventsTotal(range, null);
    const { blocked, flagged, redacted } = splitEventMix(total);
    expect(blocked + flagged + redacted).toBe(total);
  });

  it.each(
    PRESET_RANGES
  )("%s: the attack-type counts sum to the events total", (range) => {
    const total = eventsTotal(range, null);
    expect(sum(attackTypeCounts(range, null).map((c) => c.count))).toBe(total);
  });

  it.each(
    PRESET_RANGES
  )("%s: every chart point's total is its three action series", (range) => {
    const view = buildEventsChartView(range, null);
    expect(view.data.length).toBeGreaterThan(0);
    for (const p of view.data) {
      expect(p.requests).toBe(p.blocked + p.flagged + p.redacted);
    }
  });

  it.each(
    PRESET_RANGES
  )("%s: the chart series sums back to the events total", (range) => {
    const view = buildEventsChartView(range, null);
    expect(sum(view.data.map((p) => p.requests))).toBe(
      eventsTotal(range, null)
    );
  });

  it("allocate() distributes an integer total with no loss", () => {
    for (const total of [0, 1, 7, 12, 117, 562, 1215, 4789]) {
      expect(sum(allocate(total, [8, 5, 3]))).toBe(total);
    }
  });

  it("allocateTenths() keeps one-decimal parts summing to the whole", () => {
    for (const tenths of [1000, 997, 123, 10]) {
      expect(sum(allocateTenths(tenths, [0.5, 0.3, 0.2]))).toBe(tenths);
    }
  });

  it("Activity's tokens KPI equals the sum of its model bars", () => {
    expect(TOTAL_7D_BASE_TOKENS).toBe(
      sum(Object.values(TOKENS_TOTALS_7D.model))
    );
  });

  it.each([
    "all",
    "7d",
    "30d",
    "24h",
  ] as const)("%s: the savings summary's mechanism shares sum to 100%%", (range) => {
    const model = summaryFor(range, null, { plan: "pro" });
    const tenths = sum(model.mechanisms.map((m) => Math.round(m.share * 10)));
    expect(tenths).toBe(1000);
  });

  it.each([
    "all",
    "7d",
    "30d",
    "24h",
  ] as const)("%s: a team's Total saved spark is Caching + Compression per point", (range) => {
    const team = TEAM_SEED_ROWS[0];
    const [total, caching, compression] = teamSavingsKpis(
      team,
      TEAM_SEED_ROWS,
      range
    );
    expect(total.spark.length).toBe(caching.spark.length);
    total.spark.forEach((v, i) => {
      expect(v).toBeCloseTo(caching.spark[i] + compression.spark[i], 2);
    });
  });
});
