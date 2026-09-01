import { expect, test } from "vitest";
import {
  budgetPercentLabel,
  budgetProgress,
  ORG_BUDGET_SEED,
  orgSpend,
  scaleUsage,
  TEAM_SEED_ROWS,
  usageForTeam,
} from "@/data/teams";
import type { Range } from "@/lib/range";
import { securityForTeam } from "@/pages/teams/security-data";
import { teamDailySeries, teamSparkSeries } from "@/pages/teams/spark-series";

const SCALES = [0.16, 1, 4.2, 8.5, 3 / 7, 10 / 7, 45 / 7, 61 / 7];
const round2 = (n: number) => Math.round(n * 100) / 100;

// Regression guard for the Teams math contract (2026-08-31): every number a
// Teams surface renders must reconcile with every other reading of the same
// fact — per-team KPIs vs both breakdown tables at every range scale
// (including non-terminating custom scales), sparkline sums vs their KPI,
// budget facts vs the meter, the Security tab's four groupings, and the org
// bar vs the sum of team spends. Born from two live defects: Haiku at
// -6,638 requests (settle absorbed the estimation error) and a 200k+
// by-user vs by-model gap (models settled onto metered-only requests).
test("teams math reconciles across teams, scales, budgets, security, and org roll-up", () => {
  const bad: string[] = [];
  for (const team of TEAM_SEED_ROWS) {
    const u = usageForTeam(team);
    for (const scale of SCALES) {
      const s = scaleUsage(u, scale);
      const uReq = s.byUser.reduce((a, x) => a + x.requests, 0);
      const mReq = s.byModel.reduce((a, x) => a + x.requests, 0);
      const uSp = round2(s.byUser.reduce((a, x) => a + x.spend, 0));
      const mSp = round2(s.byModel.reduce((a, x) => a + x.spend, 0));
      if (uReq !== s.requests) {
        bad.push(`${team.name} x${scale} userReq ${uReq} != ${s.requests}`);
      }
      if (mReq !== s.requests) {
        bad.push(`${team.name} x${scale} modelReq ${mReq} != ${s.requests}`);
      }
      if (uSp !== s.spend) {
        bad.push(`${team.name} x${scale} userSp ${uSp} != ${s.spend}`);
      }
      if (mSp !== s.spend) {
        bad.push(`${team.name} x${scale} modelSp ${mSp} != ${s.spend}`);
      }
      for (const x of [...s.byUser, ...s.byModel]) {
        if (x.requests < 0 || x.spend < 0) {
          bad.push(
            `${team.name} x${scale} NEGATIVE ${x.label} ${x.requests}/${x.spend}`
          );
        }
      }
      if (s.tokens < 0 || s.requests < 0 || s.spend < 0) {
        bad.push(`${team.name} x${scale} negative KPI`);
      }
    }
    // sparklines: every range renders a window of ONE daily backbone
    // (teams/spark-series.ts), re-settled onto that range's KPI — so sums
    // reconcile AND the All tail cannot contradict the 7D shape.
    const teamSeed = [...team.id].reduce((a, c) => a + c.charCodeAt(0), 0);
    const RANGES: [Range, number, number][] = [
      ["all", 8.5, 30],
      ["30d", 4.2, 30],
      ["7d", 1, 7],
      ["24h", 0.16, 12],
    ];
    for (const [range, scale, count] of RANGES) {
      const s = scaleUsage(u, scale);
      const metrics: [number, number][] = [
        [u.spend, s.spend],
        [u.requests, s.requests],
        [u.tokens, s.tokens],
      ];
      for (const [k, [total7d, scaledTotal]] of metrics.entries()) {
        const spark = teamSparkSeries(
          total7d,
          scaledTotal,
          range,
          null,
          count,
          teamSeed * 31 + k + 1
        );
        const sum = round2(spark.reduce((a, b) => a + b, 0));
        if (Math.abs(sum - round2(scaledTotal)) > 0.01) {
          bad.push(`${team.name} ${range} spark sum ${sum} != ${scaledTotal}`);
        }
        if (spark.some((v) => v < 0)) {
          bad.push(`${team.name} ${range} spark negative bucket`);
        }
      }
    }
    // coherence: the 7D spark is the backbone's last 7 days, rescaled — the
    // exact defect guard (All plunged while 7D climbed, 2026-09-01)
    if (u.spend > 0) {
      const tail = teamDailySeries(u.spend, teamSeed * 31 + 1).slice(-7);
      const tailSum = tail.reduce((a, b) => a + b, 0);
      const spark = teamSparkSeries(
        u.spend,
        u.spend,
        "7d",
        null,
        7,
        teamSeed * 31 + 1
      );
      for (let i = 0; i < 7; i++) {
        const want = ((tail[i] ?? 0) / tailSum) * u.spend;
        if (Math.abs((spark[i] ?? 0) - want) > 0.02) {
          bad.push(`${team.name} 7d spark diverges from backbone at ${i}`);
        }
      }
    }
    // budget facts
    if (team.budget) {
      const frac = budgetProgress(u.spend, team.budget);
      if (frac === null || frac < 0 || frac > 1) {
        bad.push(`${team.name} progress ${frac}`);
      }
      const pct = budgetPercentLabel(u.spend, team.budget);
      const expected = `${((u.spend / team.budget.amount) * 100).toFixed(1)}%`;
      if (pct !== expected) {
        bad.push(`${team.name} pct ${pct} != ${expected}`);
      }
      const remaining = round2(Math.abs(team.budget.amount - u.spend));
      if (
        round2(remaining + Math.min(u.spend, team.budget.amount)) !==
          team.budget.amount &&
        u.spend <= team.budget.amount
      ) {
        bad.push(`${team.name} remaining ${remaining} + spend != amount`);
      }
    }
    // security reconciliation
    const sec = securityForTeam(team);
    const catSum = sec.byCategory.reduce((a, x) => a + x.count, 0);
    const memSum = sec.byMember.reduce((a, x) => a + x.count, 0);
    const outcomeFindings = sec.byOutcome
      .filter((o) => o.action !== "allow")
      .reduce((a, x) => a + x.count, 0);
    const outcomeAll = sec.byOutcome.reduce((a, x) => a + x.count, 0);
    if (catSum !== sec.findings) {
      bad.push(
        `${team.name} sec byCategory ${catSum} != findings ${sec.findings}`
      );
    }
    if (memSum !== sec.findings) {
      bad.push(
        `${team.name} sec byMember ${memSum} != findings ${sec.findings}`
      );
    }
    if (outcomeFindings !== sec.findings) {
      bad.push(
        `${team.name} sec outcomes ${outcomeFindings} != findings ${sec.findings}`
      );
    }
    if (outcomeAll !== sec.checks) {
      bad.push(
        `${team.name} sec outcomeAll ${outcomeAll} != checks ${sec.checks}`
      );
    }
  }
  // org roll-up: single-assignment keys means org spend == sum of team spends
  const teamSum = round2(
    TEAM_SEED_ROWS.reduce((a, t) => a + usageForTeam(t).spend, 0)
  );
  const org = orgSpend(TEAM_SEED_ROWS);
  if (org !== teamSum) {
    bad.push(`org ${org} != team sum ${teamSum}`);
  }
  if (org !== 247.59) {
    bad.push(`org ${org} != 247.59 (rendered bar)`);
  }
  if (ORG_BUDGET_SEED && budgetPercentLabel(org, ORG_BUDGET_SEED) !== "16.5%") {
    bad.push(`org pct ${budgetPercentLabel(org, ORG_BUDGET_SEED)} != 16.5%`);
  }
  expect(bad.join("\n")).toBe("");
});
