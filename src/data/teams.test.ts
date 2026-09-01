import { expect, test } from "vitest";
import {
  BUDGET_WINDOW_ORDER,
  BUDGET_WINDOW_SCALE,
  budgetPercentLabel,
  budgetProgress,
  budgetReadings,
  ORG_BUDGET_SEED,
  orgSpend,
  scaleUsage,
  TEAM_SEED_ROWS,
  tightestReading,
  usageForTeam,
} from "@/data/teams";
import type { Range } from "@/lib/range";
import {
  ATTACK_MIX,
  EVENT_MIX_TOTAL,
  EVENTS_RANGE_TOTAL,
} from "@/pages/security/events-data";
import { securityForTeam, teamEventShares } from "@/pages/teams/security-data";
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
    // budget facts, one reading per configured window. Weekly IS the 7d
    // roll-up; windows scale monotonically (5h < weekly < monthly) so three
    // tabs can never show the same money; the tightest window is the one the
    // list row's single meter shows.
    if (team.budget) {
      const readings = budgetReadings(u, team.budget);
      if (readings.length === 0) {
        bad.push(`${team.name} budget has no windows`);
      }
      const weekly = readings.find((r) => r.window === "weekly");
      if (weekly && weekly.spend !== u.spend) {
        bad.push(`${team.name} weekly ${weekly.spend} != 7d ${u.spend}`);
      }
      for (const r of readings) {
        if (r.usage.spend !== r.spend) {
          bad.push(`${team.name} ${r.window} usage.spend != spend`);
        }
        const users = round2(r.usage.byUser.reduce((a, x) => a + x.spend, 0));
        const models = round2(r.usage.byModel.reduce((a, x) => a + x.spend, 0));
        if (users !== r.spend || models !== r.spend) {
          bad.push(
            `${team.name} ${r.window} tables ${users}/${models} != ${r.spend}`
          );
        }
        const frac = budgetProgress(r.spend, r.cap);
        if (frac === null || frac < 0 || frac > 1) {
          bad.push(`${team.name} ${r.window} progress ${frac}`);
        }
        const pct = budgetPercentLabel(r.spend, r.cap);
        const expected = `${((r.spend / r.cap) * 100).toFixed(1)}%`;
        if (pct !== expected) {
          bad.push(`${team.name} ${r.window} pct ${pct} != ${expected}`);
        }
        const remaining = round2(Math.abs(r.cap - r.spend));
        if (
          round2(remaining + Math.min(r.spend, r.cap)) !== r.cap &&
          r.spend <= r.cap
        ) {
          bad.push(`${team.name} ${r.window} remaining + spend != cap`);
        }
      }
      const tight = tightestReading(u, team.budget);
      const maxUtil = Math.max(...readings.map((r) => r.spend / r.cap));
      if (tight.spend / tight.cap !== maxUtil) {
        bad.push(
          `${team.name} tightest ${tight.window} is not max utilization`
        );
      }
    }
    // security reconciliation: findings are the team's allocated share of
    // the org Security page's events; categories mirror the org card's
    // ATTACK_MIX fraction (16 of 47 units), so they sum BELOW findings.
    const sec = securityForTeam(team);
    const catSum = sec.byCategory.reduce((a, x) => a + x.count, 0);
    const catWant = ATTACK_MIX.reduce(
      (a, c) => a + Math.round((c.units * sec.findings) / EVENT_MIX_TOTAL),
      0
    );
    const memSum = sec.byMember.reduce((a, x) => a + x.count, 0);
    // per-member threat types: every column sums to the Attack types card,
    // every row's categories stay within its findings total
    for (const c of ATTACK_MIX) {
      const col = sec.byMember.reduce((a, m) => a + m.byCategory[c.key], 0);
      const want = sec.byCategory.find((x) => x.id === c.key)?.count ?? 0;
      if (col !== want) {
        bad.push(`${team.name} sec member column ${c.key} ${col} != ${want}`);
      }
    }
    for (const m of sec.byMember) {
      const cats = ATTACK_MIX.reduce((a, c) => a + m.byCategory[c.key], 0);
      if (cats > m.count || Object.values(m.byCategory).some((n) => n < 0)) {
        bad.push(
          `${team.name} sec member ${m.label} categories ${cats} > ${m.count}`
        );
      }
    }
    const outcomeFindings = sec.byOutcome
      .filter((o) => o.action !== "allow")
      .reduce((a, x) => a + x.count, 0);
    const outcomeAll = sec.byOutcome.reduce((a, x) => a + x.count, 0);
    if (catSum !== catWant || catSum > sec.findings) {
      bad.push(
        `${team.name} sec byCategory ${catSum} != ${catWant} (findings ${sec.findings})`
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
    // stage ratio: output rows exist only when the reply scan recorded a
    // result — the dev build's write rule, anchored at 1,612/20,737 (~7.8%).
    // Guards against regressing to the old one-check-per-stage ~1:1 split.
    const reqStage = sec.byStage.find((s) => s.id === "request")?.count ?? 0;
    const outStage = sec.byStage.find((s) => s.id === "output")?.count ?? 0;
    const stageRate = reqStage > 0 ? outStage / reqStage : 0;
    if (reqStage + outStage !== sec.checks) {
      bad.push(`${team.name} stages ${reqStage}+${outStage} != ${sec.checks}`);
    }
    if (stageRate < 0.075 || stageRate > 0.08) {
      bad.push(`${team.name} stage rate ${stageRate.toFixed(4)} off anchor`);
    }
  }
  // security shares: seed teams sum EXACTLY to the org Security page's
  // event total at every preset range — one story at two zoom levels
  for (const range of ["24h", "7d", "30d", "all"] as const) {
    const shares = teamEventShares(range, null);
    const sum = [...shares.values()].reduce((a, b) => a + b, 0);
    if (sum !== EVENTS_RANGE_TOTAL[range]) {
      bad.push(
        `event shares ${sum} != org ${EVENTS_RANGE_TOTAL[range]} at ${range}`
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
  const orgCap = ORG_BUDGET_SEED.caps.monthly ?? 0;
  if (budgetPercentLabel(org, orgCap) !== "16.5%") {
    bad.push(`org pct ${budgetPercentLabel(org, orgCap)} != 16.5%`);
  }
  // window scale is strictly increasing in canonical order
  for (let i = 1; i < BUDGET_WINDOW_ORDER.length; i++) {
    const a = BUDGET_WINDOW_ORDER[i - 1] as keyof typeof BUDGET_WINDOW_SCALE;
    const b = BUDGET_WINDOW_ORDER[i] as keyof typeof BUDGET_WINDOW_SCALE;
    if (BUDGET_WINDOW_SCALE[a] >= BUDGET_WINDOW_SCALE[b]) {
      bad.push(`window scale ${a} >= ${b}`);
    }
  }
  // Design seed: the documented multi-window example
  const design = TEAM_SEED_ROWS.find((t) => t.id === "team_design");
  if (design?.budget) {
    const r = budgetReadings(usageForTeam(design), design.budget);
    const fiveH = r.find((x) => x.window === "5h");
    if (!fiveH || budgetPercentLabel(fiveH.spend, fiveH.cap) !== "11.0%") {
      bad.push(
        `design 5h pct ${fiveH ? budgetPercentLabel(fiveH.spend, fiveH.cap) : "missing"} != 11.0%`
      );
    }
    if (
      tightestReading(usageForTeam(design), design.budget).window !== "weekly"
    ) {
      bad.push("design tightest window != weekly");
    }
  }
  expect(bad.join("\n")).toBe("");
});
