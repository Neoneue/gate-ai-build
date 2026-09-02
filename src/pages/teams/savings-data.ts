// Team-scoped Token savings — the org page's KPI series projected onto one
// team (AG-624 / PRD 8.5: compression settings per team).
//
// Savings is a RATE, so it does not scale with the team's share of traffic
// the way spend does. The ONE fiction minted here, single-sourced: a team's
// rates follow its prompt size. Compression finds more to remove in longer
// prompts, so its rate scales with the team's average tokens per message
// relative to the org; caching hits more often on short repeated prompts, so
// its rate scales the other way. Both factors are clamped so no team drifts
// far from the org canon, and the team's own switches zero a component the
// team has turned off. Total saved = caching + compression at every point,
// so the three tiles reconcile by construction (charts-must-reconcile).
//
// Every input is a real derivation: `usageForTeam` (tokens, requests) and the
// org series in `token-savings-data.ts`. Nothing is authored per team.

import { type TeamRow, usageForTeam } from "@/data/teams";
import {
  KPI_BY_RANGE,
  type PresetRange,
  type SavingsKpi,
} from "@/pages/token-savings-data";

const FACTOR_FLOOR = 0.6;
const FACTOR_CEIL = 1.4;

function clamp(n: number): number {
  return Math.min(FACTOR_CEIL, Math.max(FACTOR_FLOOR, n));
}

function avgTokens(tokens: number, requests: number): number {
  return requests > 0 ? tokens / requests : 0;
}

/** Compression / caching rate multipliers for a team against the org. Both
 *  are 1 when the team's prompt size matches the org average (or when the
 *  team has no traffic, so an empty team reads as the org). */
export function teamSavingsFactors(
  team: TeamRow,
  teams: TeamRow[]
): { compression: number; caching: number } {
  const own = usageForTeam(team);
  let tokens = 0;
  let requests = 0;
  for (const t of teams) {
    const u = usageForTeam(t);
    tokens += u.tokens;
    requests += u.requests;
  }
  const orgAvg = avgTokens(tokens, requests);
  const teamAvg = avgTokens(own.tokens, own.requests);
  if (orgAvg === 0 || teamAvg === 0) {
    return { compression: 1, caching: 1 };
  }
  const ratio = teamAvg / orgAvg;
  return { compression: clamp(ratio), caching: clamp(1 / ratio) };
}

/** Format a rate the way the org tiles do: two decimals under 1%, else one. */
export function formatSavingsRate(n: number): string {
  return n.toFixed(Math.abs(n) < 1 ? 2 : 1);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** The three KPI tiles for one team and range, same order and titles as the
 *  org page: Total saved / Caching / Compression. Sparks are per-point
 *  products, and total is the per-point sum, so sum(spark) reconciles. */
export function teamSavingsKpis(
  team: TeamRow,
  teams: TeamRow[],
  range: PresetRange
): SavingsKpi[] {
  const [total, caching, compression] = KPI_BY_RANGE[range];
  const f = teamSavingsFactors(team, teams);
  const cachingScale = team.savings.caching ? f.caching : 0;
  const compressionScale = team.savings.compression ? f.compression : 0;
  const cachingSpark = caching.spark.map((v) => round2(v * cachingScale));
  const compressionSpark = compression.spark.map((v) =>
    round2(v * compressionScale)
  );
  const totalSpark = cachingSpark.map((v, i) =>
    round2(v + compressionSpark[i])
  );
  const tile = (base: SavingsKpi, spark: number[]): SavingsKpi => ({
    ...base,
    spark,
    value: formatSavingsRate(spark[spark.length - 1]),
  });
  return [
    tile(total, totalSpark),
    tile(caching, cachingSpark),
    tile(compression, compressionSpark),
  ];
}
