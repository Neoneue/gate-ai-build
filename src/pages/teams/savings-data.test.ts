import { expect, test } from "vitest";
import { TEAM_SEED_ROWS } from "@/data/teams";
import {
  teamSavingsFactors,
  teamSavingsKpis,
} from "@/pages/teams/savings-data";
import { KPI_BY_RANGE, type PresetRange } from "@/pages/token-savings-data";

const RANGES: PresetRange[] = ["all", "24h", "7d", "30d"];

test("team savings: total = caching + compression at every spark point", () => {
  for (const team of TEAM_SEED_ROWS) {
    for (const range of RANGES) {
      const [total, caching, compression] = teamSavingsKpis(
        team,
        TEAM_SEED_ROWS,
        range
      );
      total.spark.forEach((v, i) => {
        expect(v).toBeCloseTo(caching.spark[i] + compression.spark[i], 2);
      });
      expect(total.value).toBe(
        total.spark[total.spark.length - 1].toFixed(
          total.spark[total.spark.length - 1] < 1 ? 2 : 1
        )
      );
    }
  }
});

test("team savings: factors stay inside the clamp and shape is the org's", () => {
  for (const team of TEAM_SEED_ROWS) {
    const f = teamSavingsFactors(team, TEAM_SEED_ROWS);
    expect(f.compression).toBeGreaterThanOrEqual(0.6);
    expect(f.compression).toBeLessThanOrEqual(1.4);
    expect(f.caching).toBeGreaterThanOrEqual(0.6);
    expect(f.caching).toBeLessThanOrEqual(1.4);
    const [, , compression] = teamSavingsKpis(team, TEAM_SEED_ROWS, "all");
    const org = KPI_BY_RANGE.all[2].spark;
    // Monotone in the org's direction: a scaled copy keeps the ramp shape.
    for (let i = 1; i < org.length; i++) {
      expect(Math.sign(compression.spark[i] - compression.spark[i - 1])).toBe(
        Math.sign(org[i] - org[i - 1])
      );
    }
  }
});

test("team savings: a switched-off component reads 0 and drops out of total", () => {
  const team = {
    ...TEAM_SEED_ROWS[1],
    savings: { ...TEAM_SEED_ROWS[1].savings, compression: false },
  };
  const [total, caching, compression] = teamSavingsKpis(
    team,
    TEAM_SEED_ROWS,
    "7d"
  );
  expect(compression.spark.every((v) => v === 0)).toBe(true);
  expect(total.value).toBe(caching.value);
});

test("team savings: a fresh team with no traffic reads 0 on every tile", () => {
  const fresh = {
    ...TEAM_SEED_ROWS[1],
    id: "team_fresh",
    memberIds: [],
    keyIds: [],
  };
  const f = teamSavingsFactors(fresh, TEAM_SEED_ROWS);
  expect(f).toEqual({ compression: 0, caching: 0 });
  for (const k of teamSavingsKpis(fresh, TEAM_SEED_ROWS, "all")) {
    expect(k.spark.every((v) => v === 0)).toBe(true);
    expect(k.value).toBe("0.00");
  }
});
