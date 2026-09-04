import { expect, test } from "vitest";
import {
  attributedKeyNames,
  BUDGET_WINDOW_ORDER,
  BUDGET_WINDOW_SCALE,
  budgetBlockPoint,
  budgetPercentLabel,
  budgetProgress,
  budgetReadings,
  budgetSpendShown,
  DEFAULT_TEAM_ID,
  deleteTeam,
  keyById,
  moveKeysToTeam,
  moveMembersToTeam,
  ORG_BUDGET_SEED,
  orgSpend,
  scaleUsage,
  TEAM_SEED_ROWS,
  teamSavedPercent,
  tightestReading,
  usageForTeam,
} from "@/data/teams";
import type { Range } from "@/lib/range";

import {
  ACTIVITY_SAVINGS_RATE_7D,
  API_KEY_ROWS,
  savingsRateFor,
} from "@/pages/activity-data";
import { ATTACK_MIX, EVENTS_RANGE_TOTAL } from "@/pages/security/events-data";
import { budgetStatus } from "@/pages/teams/budget-band";
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
    // the org Security page's events; the three attack types allocate the
    // findings 8:5:3, so they sum EXACTLY to findings.
    const sec = securityForTeam(team);
    const catSum = sec.byCategory.reduce((a, x) => a + x.count, 0);
    const catWant = sec.findings;
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
      if (cats !== m.count || Object.values(m.byCategory).some((n) => n < 0)) {
        bad.push(
          `${team.name} sec member ${m.label} categories ${cats} != ${m.count}`
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
  // Development seed: the documented multi-window example (Design is monthly
  // only since 2026-09-02, so the user can switch the other windows on).
  const platform = TEAM_SEED_ROWS.find((t) => t.id === "team_platform");
  if (platform?.budget) {
    const r = budgetReadings(usageForTeam(platform), platform.budget);
    const fiveH = r.find((x) => x.window === "5h");
    if (!fiveH || budgetPercentLabel(fiveH.spend, fiveH.cap) !== "1.5%") {
      bad.push(
        `platform 5h pct ${fiveH ? budgetPercentLabel(fiveH.spend, fiveH.cap) : "missing"} != 1.5%`
      );
    }
    if (
      tightestReading(usageForTeam(platform), platform.budget).window !==
      "monthly"
    ) {
      bad.push("platform tightest window != monthly");
    }
  }
  const design = TEAM_SEED_ROWS.find((t) => t.id === "team_design");
  if (design?.budget) {
    const windows = budgetReadings(usageForTeam(design), design.budget).map(
      (x) => x.window
    );
    if (windows.join(",") !== "monthly") {
      bad.push(`design windows ${windows.join(",")} != monthly`);
    }
  }
  expect(bad.join("\n")).toBe("");
});

test("moving a member moves the keys they own, and only those", () => {
  const platform = TEAM_SEED_ROWS.find((t) => t.name === "Development");
  const design = TEAM_SEED_ROWS.find((t) => t.name === "Design");
  if (!(platform && design)) {
    throw new Error("seed teams missing");
  }
  const kira = "usr_kira";
  const kirasKeys = platform.keyIds.filter(
    (id) => keyById(id)?.ownerId === kira
  );
  expect(kirasKeys.length).toBeGreaterThan(0);
  const next = moveMembersToTeam(TEAM_SEED_ROWS, design.id, [kira]);
  const nextDevelopment = next.find((t) => t.id === platform.id);
  const nextDesign = next.find((t) => t.id === design.id);
  expect(nextDevelopment?.memberIds).not.toContain(kira);
  expect(nextDesign?.memberIds).toContain(kira);
  for (const id of kirasKeys) {
    expect(nextDevelopment?.keyIds).not.toContain(id);
    expect(nextDesign?.keyIds).toContain(id);
  }
  // Someone else's keys on Development stay on Development.
  const others = platform.keyIds.filter((id) => !kirasKeys.includes(id));
  for (const id of others) {
    expect(nextDevelopment?.keyIds).toContain(id);
  }
});

test("hard budgets never show spend past the cap; soft budgets do", () => {
  expect(budgetSpendShown(615, 500, "hard")).toBe(500);
  expect(budgetSpendShown(615, 500, "soft")).toBe(615);
  expect(budgetPercentLabel(615, 500, "hard")).toBe("100.0%");
  expect(budgetPercentLabel(615, 500, "soft")).toBe("123.0%");
  expect(budgetPercentLabel(500, 500, "hard")).toBe("100.0%");
});

// PRD 3 Reassignment / 8.1 / 11: "when a key or user moves teams, past
// requests keep their original team; only new traffic attributes to the new
// team (history is immutable)". Every roll-up reads the frozen attribution,
// so a move changes membership and nothing else.
test("PRD 3 Reassignment: moving a key or member never moves spend", () => {
  const platform = TEAM_SEED_ROWS.find((t) => t.name === "Development");
  const design = TEAM_SEED_ROWS.find((t) => t.name === "Design");
  if (!(platform && design)) {
    throw new Error("seed teams missing");
  }
  const before = {
    platform: usageForTeam(platform),
    design: usageForTeam(design),
    org: orgSpend(TEAM_SEED_ROWS),
    platformSec: securityForTeam(platform).findings,
    designSec: securityForTeam(design).findings,
    designSecRows: securityForTeam(design).byMember,
  };

  // Key move: one Development key onto Design.
  const keyId = platform.keyIds[0];
  if (!keyId) {
    throw new Error("Development has no keys");
  }
  const afterKey = moveKeysToTeam(TEAM_SEED_ROWS, design.id, [keyId]);
  const p1 = afterKey.find((t) => t.id === platform.id);
  const d1 = afterKey.find((t) => t.id === design.id);
  if (!(p1 && d1)) {
    throw new Error("teams lost");
  }
  // Membership moved.
  expect(p1.keyIds).not.toContain(keyId);
  expect(d1.keyIds).toContain(keyId);
  // History did not: spend, requests, tokens, by-user, by-model, security.
  expect(usageForTeam(p1)).toEqual(before.platform);
  expect(usageForTeam(d1)).toEqual(before.design);
  expect(securityForTeam(p1, afterKey).findings).toBe(before.platformSec);
  expect(securityForTeam(d1, afterKey).findings).toBe(before.designSec);
  expect(orgSpend(afterKey)).toBe(before.org);

  // Member move: Kira (Development manager, owns keys) onto Design.
  const kira = platform.managerIds[0];
  if (!kira) {
    throw new Error("Development has no manager");
  }
  const afterMember = moveMembersToTeam(TEAM_SEED_ROWS, design.id, [kira]);
  const p2 = afterMember.find((t) => t.id === platform.id);
  const d2 = afterMember.find((t) => t.id === design.id);
  if (!(p2 && d2)) {
    throw new Error("teams lost");
  }
  expect(p2.memberIds).not.toContain(kira);
  expect(d2.memberIds).toContain(kira);
  const p2Usage = usageForTeam(p2);
  // Development keeps Kira's spend and now flags the row as a former member.
  expect(p2Usage.spend).toBe(before.platform.spend);
  expect(p2Usage.requests).toBe(before.platform.requests);
  const kiraRow = p2Usage.byUser.find((r) => r.id === kira);
  expect(kiraRow?.former).toBe(true);
  // The Usage tab splits by-user into "Spend by member" (current) and "Past
  // members" (former); the two tables must still sum to Total Spend.
  const current = p2Usage.byUser.filter((r) => !r.former);
  const past = p2Usage.byUser.filter((r) => r.former);
  expect(past.length).toBeGreaterThan(0);
  expect(current.every((r) => p2.memberIds.includes(r.id))).toBe(true);
  expect(past.every((r) => !p2.memberIds.includes(r.id))).toBe(true);
  expect(round2([...current, ...past].reduce((a, r) => a + r.spend, 0))).toBe(
    p2Usage.spend
  );
  expect(kiraRow?.spend).toBe(
    before.platform.byUser.find((r) => r.id === kira)?.spend
  );
  // Design gains a member and their keys, and no spend.
  expect(usageForTeam(d2)).toEqual(before.design);
  expect(orgSpend(afterMember)).toBe(before.org);
  // Security follows the same split: Kira's events stay on Development as a
  // past member, current + past rows sum to the findings headline, and
  // Design's security is untouched.
  const p2Sec = securityForTeam(p2);
  const kiraSec = p2Sec.byMember.find((r) => r.id === kira);
  expect(kiraSec?.former).toBe(true);
  expect(kiraSec?.count).toBe(
    securityForTeam(platform).byMember.find((r) => r.id === kira)?.count
  );
  const secCurrent = p2Sec.byMember.filter((r) => !r.former);
  const secPast = p2Sec.byMember.filter((r) => r.former);
  expect(secCurrent.every((r) => p2.memberIds.includes(r.id))).toBe(true);
  expect(secPast.every((r) => !p2.memberIds.includes(r.id))).toBe(true);
  expect([...secCurrent, ...secPast].reduce((a, r) => a + r.count, 0)).toBe(
    p2Sec.findings
  );
  expect(securityForTeam(d2).byMember.map((r) => r.former)).toEqual(
    before.designSecRows.map(() => false)
  );

  // Remove to Default team: same rule.
  const afterRemove = moveMembersToTeam(TEAM_SEED_ROWS, DEFAULT_TEAM_ID, [
    kira,
  ]);
  const def = afterRemove.find((t) => t.id === DEFAULT_TEAM_ID);
  const defSeed = TEAM_SEED_ROWS.find((t) => t.id === DEFAULT_TEAM_ID);
  if (!(def && defSeed)) {
    throw new Error("default team lost");
  }
  expect(usageForTeam(def)).toEqual(usageForTeam(defSeed));
  expect(def.memberIds).toContain(kira);
});

test("deleteTeam folds members and keys into Default and drops the team's history", () => {
  const design = TEAM_SEED_ROWS.find((t) => t.name === "Design");
  const defSeed = TEAM_SEED_ROWS.find((t) => t.id === DEFAULT_TEAM_ID);
  if (!(design && defSeed)) {
    throw new Error("seed teams missing");
  }
  const designSpend = usageForTeam(design).spend;
  const after = deleteTeam(TEAM_SEED_ROWS, design.id);
  const def = after.find((t) => t.id === DEFAULT_TEAM_ID);
  if (!def) {
    throw new Error("default team lost");
  }
  expect(after.find((t) => t.id === design.id)).toBeUndefined();
  for (const id of design.memberIds) {
    expect(def.memberIds).toContain(id);
  }
  for (const id of design.keyIds) {
    expect(def.keyIds).toContain(id);
  }
  // Default's spend is unchanged; the deleted team's spend leaves the org
  // roll-up with it (PM decision 2026-09-02: delete removes history).
  expect(usageForTeam(def).spend).toBe(usageForTeam(defSeed).spend);
  expect(orgSpend(after)).toBe(round2(orgSpend(TEAM_SEED_ROWS) - designSpend));
  // Default team and unknown ids are no-ops.
  expect(deleteTeam(TEAM_SEED_ROWS, DEFAULT_TEAM_ID)).toBe(TEAM_SEED_ROWS);
  expect(deleteTeam(TEAM_SEED_ROWS, "nope")).toBe(TEAM_SEED_ROWS);
});

// PRD 3 / 8.2: "warn at 80%, block at 100%" are DEFAULTS, not constants. A
// hard budget blocks at its block percent of the cap; soft ignores it.
test("block threshold: hard budgets block at blockThreshold% of the cap", () => {
  // Hard, block at 80: spend at 80% of the cap is over, shown clamps there.
  expect(budgetStatus(80, 100, 60, "hard", 80)).toBe("blocking");
  expect(budgetStatus(79, 100, 60, "hard", 80)).toBe("warning");
  expect(budgetSpendShown(95, 100, "hard", 80)).toBe(80);
  expect(budgetPercentLabel(95, 100, "hard", 80)).toBe("80.0%");
  expect(budgetBlockPoint(250, "hard", 80)).toBe(200);
  // Default 100 keeps today's behaviour.
  expect(budgetStatus(99, 100, 80, "hard")).toBe("warning");
  expect(budgetStatus(100, 100, 80, "hard")).toBe("blocking");
  // Soft never blocks: block percent is ignored, exceeded starts at the cap.
  expect(budgetStatus(85, 100, 80, "soft", 80)).toBe("warning");
  expect(budgetStatus(100, 100, 80, "soft", 80)).toBe("exceeded");
  expect(budgetBlockPoint(250, "soft", 80)).toBe(250);
  expect(budgetSpendShown(300, 250, "soft", 80)).toBe(300);
  // Seeds carry the default.
  for (const t of TEAM_SEED_ROWS) {
    if (t.budget) {
      expect(t.budget.blockThreshold).toBe(100);
    }
  }
});

// Usage tab token columns: per-member tokens in + out sum to the team's
// Tokens Used tile at every scale.
test("by-user tokens in + out reconcile with the team token total", () => {
  for (const team of TEAM_SEED_ROWS) {
    const usage = usageForTeam(team);
    for (const scale of [1, 30 / 7, 10 / 7]) {
      const scaled = scaleUsage(usage, scale);
      const sum = scaled.byUser.reduce(
        (a, r) => a + (r.tokensIn ?? 0) + (r.tokensOut ?? 0),
        0
      );
      expect(sum).toBe(scaled.tokens);
    }
  }
});

// Usage tab Saved column: per member, the token-weighted mean of their keys'
// Activity savings rates, moved onto the range with Activity's own recipe,
// so a member with one key reads exactly what Activity's Saved column shows
// for that key.
test("Usage Saved column reconciles with Activity per key", () => {
  for (const team of TEAM_SEED_ROWS) {
    const names = attributedKeyNames(team);
    const keys = API_KEY_ROWS.filter((r) => names.has(r.key));
    for (const row of usageForTeam(team).byUser) {
      const own = keys.filter((k) => k.owner === row.label);
      const rates = own.map((k) => k.savings);
      if (rates.length === 0) {
        continue;
      }
      expect(row.saved).toBeGreaterThanOrEqual(Math.min(...rates) - 1e-9);
      expect(row.saved).toBeLessThanOrEqual(Math.max(...rates) + 1e-9);
      if (own.length === 1) {
        expect(row.saved).toBeCloseTo(own[0].savings, 9);
        // Activity's 7d Saved cell for that key: savings × 100.
        expect(teamSavedPercent(row.saved, "7d", null)).toBeCloseTo(
          own[0].savings *
            (savingsRateFor("7d", null) / ACTIVITY_SAVINGS_RATE_7D) *
            100,
          9
        );
      }
    }
  }
  expect(teamSavedPercent(undefined, "7d", null)).toBeNull();
});
