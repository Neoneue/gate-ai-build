import { MEMBER_ROWS } from "@/data/team-members";
import { attributedKeyNames, TEAM_SEED_ROWS, type TeamRow } from "@/data/teams";
import type { CustomRange, Range } from "@/lib/range";
import { RANGE_SCALE } from "@/lib/range";
import { API_KEY_ROWS } from "@/pages/activity-data";
import type { GuardrailAction } from "@/pages/requests/types";
import {
  ATTACK_MIX,
  allocate,
  eventsTotal,
  splitEventMix,
} from "@/pages/security/events-data";

/* ─────────────────────────────────────────────────────────────────────────
 * Team guardrail roll-up — what the detail page's Security tab counts.
 *
 * Re-derived 2026-09-01: the org Security page is the events canon, and a
 * team's numbers are its SHARE of that canon — the same story at two zoom
 * levels. (The first cut counted the ~10 recorded REQUEST_ROWS verdicts,
 * which put a 0.005% finding rate against 65k checks while the org page
 * claimed 1,215 events — two surfaces contradicting each other, and a
 * live-build reference showed ~5% is realistic.)
 *
 * Sources, each the truth for its axis, nothing authored in between:
 *
 *   VOLUME → `API_KEY_ROWS` (activity-data): per-key 7d request counts, the
 *            same rows the Usage tab totals. Scaled by the Usage tab's
 *            range canon (RANGE_SCALE — All = 8.5) so "out of N checks"
 *            agrees with the Usage tab's Total Messages for the same range.
 *            (The first cut presented raw 7d volume as "everything on
 *            record".)
 *   EVENTS → `security/events-data` (org Security page): `eventsTotal()`
 *            per range, split 31:14:2 by `splitEventMix`, typed 8:5:3 by
 *            `ATTACK_MIX` (sums to the total). Teams receive largest-remainder shares in
 *            proportion to their request volume, so the seed teams sum
 *            EXACTLY to the org page's number at every preset range.
 *
 * Known, accepted drift: the org events canon scales ranges by the
 * Requests-page ratios (25% coupling) while checks scale by RANGE_SCALE;
 * the two disagree by up to ~20% at "all", so the implied finding RATE
 * wobbles across ranges. Nothing on screen divides the two; reconciling
 * the canons is a data-model decision recorded in data-model.md, not one
 * this module takes on its own.
 *
 * The check arithmetic, stated once so every card sums. It models the dev
 * build's WRITE path (gateway-proxy `request.repository.ts`): at most one
 * decision row per request per phase, each written only when that phase's
 * scan produced at least one result.
 *
 *   requestStage = requests                (the inbound scan always records)
 *   outputStage  = requests × 0.0777       (see OUTPUT_RESULT_RATE)
 *   checks       = requestStage + outputStage
 *   findings     = blocked + redacted + flagged   (the team's event share)
 *   allowed      = checks − findings
 * ───────────────────────────────────────────────────────────────────────── */

/** Share of requests whose REPLY scan records a decision row. The dev
 *  build's response-security-evaluation stage skips the write for
 *  streaming/empty/non-inference/non-2xx bodies AND for clean scans with
 *  zero results, so output rows exist only when the reply scan found
 *  something to note: 1,612 output rows over 20,737 requests on the
 *  2026-09-01 live capture. Sanctioned anchor to that recording. */
const OUTPUT_RESULT_RATE = 1612 / 20_737;

export type TeamSecuritySlice = {
  id: string;
  label: string;
  description?: string;
  count: number;
};

export type TeamOutcomeSlice = TeamSecuritySlice & {
  action: GuardrailAction;
};

/** One member's row: total findings plus the split by threat type, keyed by
 *  ATTACK_MIX key. Each key column sums EXACTLY to the matching byCategory
 *  count (the Attack types card), and a row's categories never exceed its
 *  `count` (the balance is the org page's uncategorized remainder). */
export type TeamMemberSlice = TeamSecuritySlice & {
  byCategory: Record<(typeof ATTACK_MIX)[number]["key"], number>;
  /** The member's keys ran here but they are no longer on the roster (PRD 3
   *  Reassignment: history stays with the team). Same flag, same derivation
   *  as `UsageSlice.former`, so the Security tab splits current / past
   *  members exactly the way the Usage tab does. */
  former: boolean;
};

export type TeamSecurity = {
  /** Every guardrail check on record for the team, both stages. */
  checks: number;
  /** Checks that decided something: blocked + redacted + flagged. */
  findings: number;
  byOutcome: TeamOutcomeSlice[];
  byCategory: TeamSecuritySlice[];
  byStage: TeamSecuritySlice[];
  byMember: TeamMemberSlice[];
};

const OUTCOME_COPY: Record<
  GuardrailAction,
  { label: string; description: string }
> = {
  block: {
    label: "Blocked",
    description: "The request never reached the model.",
  },
  redacted: {
    label: "Redacted",
    description: "It went through with the sensitive text removed.",
  },
  flagged: {
    label: "Flagged",
    description: "Allowed through, but recorded for review.",
  },
  allow: {
    label: "Allowed",
    description: "Nothing was detected, so the request went through untouched.",
  },
};

/** Fixed reading order — worst outcome first, so the eye lands on blocks. */
const OUTCOME_ORDER: GuardrailAction[] = [
  "block",
  "redacted",
  "flagged",
  "allow",
];

/** The activity-data key names (`prod-web`) ATTRIBUTED to a team, not its
 *  live membership: security events are history too (PRD 3 Reassignment),
 *  so a moved key's past events stay with the team that ran them. */
function teamKeyNames(team: TeamRow): Set<string> {
  return attributedKeyNames(team);
}

/** 7d request volume on the team's keys — the share weight. */
function teamRequests7d(team: TeamRow): number {
  const names = teamKeyNames(team);
  return API_KEY_ROWS.filter((r) => names.has(r.key)).reduce(
    (a, r) => a + r.requests,
    0
  );
}

/** The org Security page's event total for a range, allocated across
 *  `teams` by request volume. The allocation needs every team at once so
 *  the shares settle exactly onto the org number — callers with live page
 *  state pass it; the seed is the default. */
export function teamEventShares(
  range: Range,
  customRange: CustomRange | null,
  teams: TeamRow[] = TEAM_SEED_ROWS
): Map<string, number> {
  const weights = teams.map((t) => teamRequests7d(t));
  const shares = allocate(eventsTotal(range, customRange), weights);
  return new Map(teams.map((t, i) => [t.id, shares[i] ?? 0]));
}

const memberIdFor = (owner: string): string =>
  MEMBER_ROWS.find((m) => m.name === owner)?.id ?? owner;

/** A team's Security-tab numbers for a range. `teams` is the full set the
 *  page is rendering (live state where available) so event shares settle
 *  onto the org total exactly; `team` must be a member of it. */
export function securityForTeamAtRange(
  team: TeamRow,
  range: Range,
  customRange: CustomRange | null,
  teams: TeamRow[] = TEAM_SEED_ROWS
): TeamSecurity {
  const names = teamKeyNames(team);

  // Volume: the Usage tab's rows and the Usage tab's range canon.
  const scale = RANGE_SCALE[range === "custom" ? "7d" : range];
  const requests = Math.round(teamRequests7d(team) * scale);

  // Events: this team's share of the org Security page's canon.
  const findings = teamEventShares(range, customRange, teams).get(team.id) ?? 0;
  const { blocked, flagged, redacted } = splitEventMix(findings);

  const requestStage = requests;
  const outputStage = Math.round(requests * OUTPUT_RESULT_RATE);
  const checks = requestStage + outputStage;

  const outcomeCount: Record<GuardrailAction, number> = {
    block: blocked,
    flagged,
    redacted,
    allow: checks - findings,
  };
  const byOutcome: TeamOutcomeSlice[] = OUTCOME_ORDER.map((action) => ({
    id: action,
    action,
    label: OUTCOME_COPY[action].label,
    description: OUTCOME_COPY[action].description,
    count: outcomeCount[action],
  }));

  // Categories mirror the org Attack-types card: the team's findings
  // allocated 8:5:3 by largest remainder, so the three sum EXACTLY to the
  // findings headline (every event is a detection of one type).
  const categoryShares = allocate(
    findings,
    ATTACK_MIX.map((c) => c.units)
  );
  const categoryCount = Object.fromEntries(
    ATTACK_MIX.map((c, i) => [c.key, categoryShares[i] ?? 0])
  ) as Record<(typeof ATTACK_MIX)[number]["key"], number>;
  const byCategory: TeamSecuritySlice[] = ATTACK_MIX.map((c) => ({
    id: c.key,
    label: c.label,
    count: categoryCount[c.key],
  }))
    .filter((slice) => slice.count > 0)
    .sort((a, b) => b.count - a.count);

  const byStage: TeamSecuritySlice[] = [
    {
      id: "request",
      label: "request",
      description: "Checked on the way to the model",
      count: requestStage,
    },
    {
      id: "output",
      label: "output",
      description: "Checked on the model’s reply",
      count: outputStage,
    },
  ];

  // Per member: each threat-type column is the category total allocated by
  // the request volume on the keys each member owns here, so every COLUMN
  // sums exactly to the Attack types card. A member's Events total is the
  // sum of their three columns, so every ROW adds up on its face and the
  // rows together sum to the findings headline (columns sum to it).
  const owners = new Map<string, number>();
  for (const row of API_KEY_ROWS) {
    if (names.has(row.key)) {
      owners.set(row.owner, (owners.get(row.owner) ?? 0) + row.requests);
    }
  }
  const ownerEntries = [...owners.entries()];
  const weights = ownerEntries.map(([, reqs]) => reqs);
  const perCategory = ATTACK_MIX.map((c) =>
    allocate(categoryCount[c.key], weights)
  );
  const rowCategorized = (i: number) =>
    perCategory.reduce((a, col) => a + (col[i] ?? 0), 0);
  const byMember: TeamMemberSlice[] = ownerEntries
    .map(([owner], i) => ({
      id: memberIdFor(owner),
      label: owner,
      former: !team.memberIds.includes(memberIdFor(owner)),
      count: rowCategorized(i),
      byCategory: Object.fromEntries(
        ATTACK_MIX.map((c, k) => [c.key, perCategory[k]?.[i] ?? 0])
      ) as TeamMemberSlice["byCategory"],
    }))
    .filter((slice) => slice.count > 0)
    .sort((a, b) => b.count - a.count);

  return { checks, findings, byOutcome, byCategory, byStage, byMember };
}

/** All-time roll-up — what the pane renders before the range chrome lands. */
export function securityForTeam(
  team: TeamRow,
  teams: TeamRow[] = TEAM_SEED_ROWS
): TeamSecurity {
  return securityForTeamAtRange(team, "all", null, teams);
}
