// Teams — workspace teams, their budgets, and the usage that rolls up to
// them. Mirrors the staging build's Teams surface (list + detail).
//
// NOTHING here is authored traffic. A team is a *grouping* of members and
// keys that already exist:
//   · members  → src/data/team-members.ts  (MEMBER_ROWS)
//   · keys     → src/data/api-keys.ts      (API_KEY_SEED_ROWS)
//   · usage    → src/pages/activity-data.ts (API_KEY_ROWS, USAGE_7D)
// Every number a Teams surface renders is a groupBy over those arrays, which
// is what makes the Teams table, the detail KPIs, the per-user table, the
// per-model table and the budget bars agree by construction rather than by
// three authored numbers happening to line up (the charts-must-reconcile
// contract).
//
// The revoked `test-key` is filtered out of ASSIGNABLE_KEYS and can never be
// seeded onto a team or offered in the "Add keys" picker — standing rule.
//
// Pages own mutation: `useState(TEAM_SEED_ROWS)`, same pattern api-keys.ts
// documents. This module stays a pure seed + derivation layer.

import { API_KEY_SEED_ROWS, type ApiKeyRow } from "@/data/api-keys";
import { modelName } from "@/data/models";
import { MEMBER_ROWS, type MemberRow } from "@/data/team-members";
import { API_KEY_ROWS, MODEL_ROWS, USAGE_7D } from "@/pages/activity-data";

/* ─── Types ─────────────────────────────────────────────────────────────── */

/** Budget reset cadence. Matches the limits Claude and Codex expose. */
export type BudgetWindow = "5h" | "weekly" | "monthly";

/** Soft budgets warn; hard budgets block once the cap is used up. */
export type BudgetEnforcement = "soft" | "hard";

export type TeamBudget = {
  name: string;
  window: BudgetWindow;
  /** Cap in USD for one window. */
  amount: number;
  enforcement: BudgetEnforcement;
  /** Percent of `amount` at which the warning fires. */
  warnThreshold: number;
  /** Percent of `amount` at which requests start being refused. Only
   *  meaningful on a HARD budget — a soft budget never blocks, so the field
   *  is absent on one rather than carrying a number that does nothing.
   *  PRD 8.2 pairs warn (80) with block (100); before this existed, `hard`
   *  implied block-at-100 silently. Read it through `budgetBlockThreshold()`
   *  so a hard budget authored without one still resolves to the default. */
  blockThreshold?: number;
};

export type TeamRow = {
  id: string;
  name: string;
  /** The catch-all team. Can't be renamed or deleted; deleted teams' members
   *  and keys fold into it. Exactly one team carries this. */
  isDefault: boolean;
  /** MEMBER_ROWS ids. */
  memberIds: string[];
  /** API_KEY_SEED_ROWS ids. Never a revoked key. */
  keyIds: string[];
  /** MEMBER_ROWS id, or null when nobody owns the team. */
  managerId: string | null;
  budget: TeamBudget | null;
};

/* ─── Copy tables (single source for both the form and the summary) ─────── */

export const BUDGET_WINDOW_LABEL: Record<BudgetWindow, string> = {
  "5h": "Per 5 hours",
  weekly: "Weekly",
  monthly: "Monthly",
};

/** Helper line under the window segmented control. Says what the window
 *  actually resets on, because "weekly" alone doesn't distinguish a rolling
 *  7 days from a calendar week. */
export const BUDGET_WINDOW_HELP: Record<BudgetWindow, string> = {
  "5h": "Rolling 5-hour window — spend ages out continuously as the window slides.",
  weekly: "Calendar week — runs from Monday and resets on Monday.",
  monthly: "Calendar month — runs from the 1st and resets on the 1st.",
};

export const BUDGET_ENFORCEMENT_LABEL: Record<BudgetEnforcement, string> = {
  soft: "Soft: warn only, never blocks",
  hard: "Hard: blocks requests once exceeded",
};

export const BUDGET_WINDOW_OPTIONS: { label: string; value: BudgetWindow }[] = [
  { label: BUDGET_WINDOW_LABEL["5h"], value: "5h" },
  { label: BUDGET_WINDOW_LABEL.weekly, value: "weekly" },
  { label: BUDGET_WINDOW_LABEL.monthly, value: "monthly" },
];

/* ─── Assignable entities ───────────────────────────────────────────────── */

/** Keys a team may hold. Revoked keys are excluded here rather than at each
 *  call site so no picker, seed, or assignment can ever reach one. */
export const ASSIGNABLE_KEYS: ApiKeyRow[] = API_KEY_SEED_ROWS.filter(
  (k) => !k.revoked
);

const keyIdByName = (name: string): string | null =>
  ASSIGNABLE_KEYS.find((k) => k.name === name)?.id ?? null;

const keyIds = (...names: string[]): string[] =>
  names.map(keyIdByName).filter((id): id is string => id !== null);

export function memberById(id: string): MemberRow | undefined {
  return MEMBER_ROWS.find((m) => m.id === id);
}

export function keyById(id: string): ApiKeyRow | undefined {
  return ASSIGNABLE_KEYS.find((k) => k.id === id);
}

/** Display name for a member id; em dash when the id resolves to nobody
 *  (an unset manager) rather than a plausible-looking guess. */
export function memberName(id: string | null): string {
  if (id === null) {
    return "—";
  }
  return memberById(id)?.name ?? "—";
}

/* ─── Seed ──────────────────────────────────────────────────────────────── */

export const ORG_BUDGET_SEED: TeamBudget = {
  name: "Org budget",
  window: "monthly",
  amount: 1500,
  enforcement: "soft",
  warnThreshold: 80,
};

/** Three teams over the four workspace members and the three active keys.
 *  Default holds the owner and no keys (so its spend is a real $0, not a
 *  rounded-down one); Platform carries the two metered production keys;
 *  Design carries the BYOK design-agent key, whose gateway spend is $0 by
 *  definition — Gate sees the traffic and never the invoice. */
export const TEAM_SEED_ROWS: TeamRow[] = [
  {
    id: "team_default",
    name: "Default",
    isDefault: true,
    memberIds: ["usr_chad"],
    keyIds: [],
    managerId: null,
    budget: null,
  },
  {
    id: "team_platform",
    name: "Platform",
    isDefault: false,
    memberIds: ["usr_kira", "usr_mate"],
    keyIds: keyIds("prod-web", "prod-agent"),
    managerId: "usr_kira",
    budget: {
      name: "Team budget",
      window: "monthly",
      amount: 500,
      enforcement: "soft",
      warnThreshold: 80,
    },
  },
  {
    id: "team_design",
    name: "Design",
    isDefault: false,
    memberIds: ["usr_jordan"],
    keyIds: keyIds("design-agent"),
    managerId: "usr_jordan",
    budget: null,
  },
];

export const DEFAULT_TEAM_ID = "team_default";

/* ─── Usage roll-up ─────────────────────────────────────────────────────── */

export type UsageSlice = {
  /** Stable row key — member id, or catalog model id. */
  id: string;
  label: string;
  requests: number;
  spend: number;
};

export type TeamUsage = {
  /** Every request the team's keys served, metered or not. */
  requests: number;
  /** What the gateway billed for them. BYOK keys contribute $0. */
  spend: number;
  byUser: UsageSlice[];
  byModel: UsageSlice[];
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Round a list to `decimals` places so it still sums to exactly `target`.
 *  The largest entry absorbs the remainder — same technique activity-data
 *  uses for its own dimension totals, so a breakdown can never disagree with
 *  the KPI above it by a cent. */
function settleValues(
  values: number[],
  target: number,
  decimals: number
): number[] {
  const scale = 10 ** decimals;
  const round = (n: number) => Math.round(n * scale) / scale;
  if (values.length === 0) {
    return [];
  }
  let biggest = 0;
  for (let i = 1; i < values.length; i += 1) {
    if ((values[i] ?? 0) > (values[biggest] ?? 0)) {
      biggest = i;
    }
  }
  const out = values.map(round);
  let rest = 0;
  for (let i = 0; i < out.length; i += 1) {
    if (i !== biggest) {
      rest += out[i] ?? 0;
    }
  }
  out[biggest] = round(target - rest);
  return out;
}

/** Requests a token of this model's traffic represents, read off MODEL_ROWS
 *  rather than re-authored. It carries the per-model call size (Haiku's 450-
 *  token classifications vs Opus' 9,000-token agent runs), which is why the
 *  model breakdown can rank differently on requests than on spend. */
const MODEL_REQUESTS_PER_TOKEN: Record<string, number> = Object.fromEntries(
  MODEL_ROWS.map((r) => {
    const tokens = r.tokensIn + r.tokensOut;
    return [r.key, tokens > 0 ? r.requests / tokens : 0];
  })
);

/** The Activity rows for a team's keys. Matched on the key's NAME, which is
 *  the id activity-data uses (`prod-web`), not the `sk-gw-…` string. */
function activityRowsFor(team: TeamRow) {
  const names = new Set(
    team.keyIds
      .map((id) => keyById(id)?.name)
      .filter((n): n is string => n !== undefined)
  );
  return API_KEY_ROWS.filter((r) => names.has(r.key));
}

function usageByUser(
  rows: ReturnType<typeof activityRowsFor>,
  totalSpend: number
): UsageSlice[] {
  const acc = new Map<string, { requests: number; spend: number }>();
  for (const row of rows) {
    const prev = acc.get(row.owner) ?? { requests: 0, spend: 0 };
    acc.set(row.owner, {
      requests: prev.requests + row.requests,
      spend: prev.spend + row.spend,
    });
  }
  const entries = [...acc.entries()].sort((a, b) => b[1].spend - a[1].spend);
  const spends = settleValues(
    entries.map(([, v]) => v.spend),
    totalSpend,
    2
  );
  return entries.map(([owner, v], i) => ({
    // Owner names come from activity-data, which mirrors MEMBER_ROWS; fall
    // back to the name itself so an unmapped owner still renders.
    id: MEMBER_ROWS.find((m) => m.name === owner)?.id ?? owner,
    label: owner,
    requests: v.requests,
    spend: spends[i] ?? 0,
  }));
}

function usageByModel(team: TeamRow, totalSpend: number): UsageSlice[] {
  const names = new Set(
    team.keyIds
      .map((id) => keyById(id)?.name)
      .filter((n): n is string => n !== undefined)
  );
  const acc = new Map<string, { spend: number; tokens: number }>();
  for (const cell of USAGE_7D) {
    if (!names.has(cell.apiKey)) {
      continue;
    }
    const prev = acc.get(cell.model) ?? { spend: 0, tokens: 0 };
    acc.set(cell.model, {
      spend: prev.spend + cell.spend,
      tokens: prev.tokens + cell.tokens,
    });
  }
  if (acc.size === 0) {
    return [];
  }
  const entries = [...acc.entries()].sort((a, b) => b[1].spend - a[1].spend);
  const rawRequests = entries.map(
    ([model, v]) => v.tokens * (MODEL_REQUESTS_PER_TOKEN[model] ?? 0)
  );
  // Requests settle onto the METERED key subtotal, not the team total: a BYOK
  // key serves requests the gateway never attributes to a catalog model, so
  // folding them in here would credit models with traffic they never saw.
  const meteredRequests = API_KEY_ROWS.filter(
    (r) => names.has(r.key) && r.path === "Gate"
  ).reduce((a, r) => a + r.requests, 0);
  const requests = settleValues(rawRequests, meteredRequests, 0);
  // Spend settles onto the team KPI, which is the sum of the per-key totals
  // the Activity table shows. Re-rounding the raw cells here instead would
  // leave the model breakdown a cent short of the number above it.
  const spends = settleValues(
    entries.map(([, v]) => v.spend),
    totalSpend,
    2
  );
  return entries.map(([model], i) => ({
    id: model,
    label: modelName(model),
    requests: requests[i] ?? 0,
    spend: spends[i] ?? 0,
  }));
}

/** Everything the detail page's Usage tab renders, and the Spend column the
 *  list page renders, from one pass over the team's keys. */
export function usageForTeam(team: TeamRow): TeamUsage {
  const rows = activityRowsFor(team);
  const spend = round2(rows.reduce((a, r) => a + r.spend, 0));
  return {
    requests: rows.reduce((a, r) => a + r.requests, 0),
    spend,
    byUser: usageByUser(rows, spend),
    byModel: usageByModel(team, spend),
  };
}

/** Org spend = what the teams' keys cost, counted once. Keys are single-
 *  assignment by construction (the picker only offers unassigned keys), but
 *  the union guards the roll-up against a double count regardless. */
export function orgSpend(teams: TeamRow[]): number {
  const names = new Set<string>();
  for (const team of teams) {
    for (const id of team.keyIds) {
      const name = keyById(id)?.name;
      if (name) {
        names.add(name);
      }
    }
  }
  return round2(
    API_KEY_ROWS.filter((r) => names.has(r.key)).reduce(
      (a, r) => a + r.spend,
      0
    )
  );
}

/** Fraction of a budget consumed, clamped to [0, 1] for the bar's width.
 *  Returns null when there is no budget to measure against. */
export function budgetProgress(
  spend: number,
  budget: TeamBudget | null
): number | null {
  if (!budget || budget.amount <= 0) {
    return null;
  }
  return Math.min(1, Math.max(0, spend / budget.amount));
}

/** Percent used, always one decimal — a bar that has barely moved still
 *  reads as a number instead of rounding to a flat 0%. Not clamped: an
 *  overspent budget should say so. */
export function budgetPercentLabel(spend: number, budget: TeamBudget): string {
  if (budget.amount <= 0) {
    return "0.0%";
  }
  return `${((spend / budget.amount) * 100).toFixed(1)}%`;
}

/** The line under a budget's label — "Org budget · Monthly". */
export function budgetWindowLine(budget: TeamBudget): string {
  return `${budget.name} · ${BUDGET_WINDOW_LABEL[budget.window]}`;
}

/** PRD 8.2's block default. A hard budget refuses requests once spend passes
 *  this share of the cap; warn fires earlier, at `warnThreshold`. */
export const DEFAULT_BLOCK_THRESHOLD = 100;

/** The block threshold to render or enforce for a budget. Null for soft
 *  budgets — they never block, so there is nothing to show. */
export function budgetBlockThreshold(budget: TeamBudget): number | null {
  if (budget.enforcement !== "hard") {
    return null;
  }
  return budget.blockThreshold ?? DEFAULT_BLOCK_THRESHOLD;
}

/* ─── Membership (PRD 3 / 8.1: a user belongs to exactly ONE team) ──────── */

export type TeamRole = "manager" | "member";

/** A member's role on the team they are on. Derived from `managerId`, never
 *  stored per-row: one field means one manager, and the two can never
 *  disagree about who it is. */
export function teamRole(team: TeamRow, memberId: string): TeamRole {
  return team.managerId === memberId ? "manager" : "member";
}

/** The team a member currently belongs to, or null when they are on none.
 *  One-team-per-user is the PRD's invariant, so the first hit IS the answer;
 *  `moveMembersToTeam` is what keeps that true. */
export function teamOfMember(
  teams: TeamRow[],
  memberId: string
): TeamRow | null {
  return teams.find((t) => t.memberIds.includes(memberId)) ?? null;
}

/** Set (or clear) a team's manager.
 *
 *  Promotion needs no matching demotion: `managerId` is a single id, so
 *  writing a new one demotes the previous manager by construction. Demoting
 *  the current manager clears the field; demoting anyone else is a no-op,
 *  because they were already a member. */
export function withManager(
  team: TeamRow,
  memberId: string,
  role: TeamRole
): TeamRow {
  if (role === "manager") {
    return { ...team, managerId: memberId };
  }
  return team.managerId === memberId ? { ...team, managerId: null } : team;
}

/** Move members onto `targetId`, removing them from whichever team they were
 *  on. PRD 3 / 8.1: adding someone to a team IS moving them, so this is one
 *  operation over the whole array rather than an add on one team and a
 *  silent duplicate everywhere else.
 *
 *  A member who managed their previous team stops managing it — the role is
 *  a property of the team they are on, and they are no longer on it. */
export function moveMembersToTeam(
  teams: TeamRow[],
  targetId: string,
  memberIds: string[]
): TeamRow[] {
  const moving = new Set(memberIds);
  return teams.map((team) => {
    if (team.id === targetId) {
      const added = memberIds.filter((id) => !team.memberIds.includes(id));
      return { ...team, memberIds: [...team.memberIds, ...added] };
    }
    const kept = team.memberIds.filter((id) => !moving.has(id));
    if (kept.length === team.memberIds.length) {
      return team;
    }
    return {
      ...team,
      memberIds: kept,
      managerId:
        team.managerId && moving.has(team.managerId) ? null : team.managerId,
    };
  });
}
