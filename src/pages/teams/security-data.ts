import { REQUEST_ROWS_ALL } from "@/data/requests";
import { MEMBER_ROWS } from "@/data/team-members";
import { keyById, type TeamRow } from "@/data/teams";
import { API_KEY_ROWS } from "@/pages/activity-data";
import type { GuardrailAction, GuardrailReason } from "@/pages/requests/types";

/* ─────────────────────────────────────────────────────────────────────────
 * Team guardrail roll-up — what the detail page's Security tab counts.
 *
 * Two sources, each doing the job it is the truth for, and nothing authored
 * in between:
 *
 *   VOLUME  → `API_KEY_ROWS` (activity-data). The same per-key request counts
 *             the Usage tab's Requests KPI reads, so "out of N checks" and
 *             "N requests" describe one workload.
 *   VERDICTS → `REQUEST_ROWS_ALL` (data/requests). The recorded guardrail
 *             events — every block / redaction / flag the gateway filed, with
 *             the check that fired. These are counted as they stand; nothing
 *             is extrapolated from them, because a recorded event either
 *             happened or it did not.
 *
 * The check arithmetic, stated once so every card sums:
 *
 *   requestStage = requests                (every request is scanned inbound)
 *   outputStage  = requests − blocked      (a blocked request has no reply)
 *   checks       = requestStage + outputStage
 *   findings     = blocked + redacted + flagged
 *   allowed      = checks − findings
 *
 * By-category and by-member count FINDINGS, not checks — they answer "what
 * fired and on whose traffic", mirroring the real summary endpoint, whose
 * zero-findings shape the pane renders as "Nothing to attribute". Scan
 * volume (the stage counts) is the only card that spans clean checks.
 * ───────────────────────────────────────────────────────────────────────── */

export type TeamSecuritySlice = {
  id: string;
  label: string;
  description?: string;
  count: number;
};

export type TeamOutcomeSlice = TeamSecuritySlice & {
  action: GuardrailAction;
};

export type TeamSecurity = {
  /** Every guardrail check on record for the team, both stages. */
  checks: number;
  /** Checks that decided something: blocked + redacted + flagged. */
  findings: number;
  byOutcome: TeamOutcomeSlice[];
  byCategory: TeamSecuritySlice[];
  byStage: TeamSecuritySlice[];
  byMember: TeamSecuritySlice[];
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

const CATEGORY_ORDER: GuardrailReason[] = ["injection", "credential", "pii"];

/** The activity-data key ids (`prod-web`) a team holds. `keyById` resolves
 *  the `sk-gw-…` seed id to the name both other modules index on. */
function teamKeyNames(team: TeamRow): Set<string> {
  return new Set(
    team.keyIds
      .map((id) => keyById(id)?.name)
      .filter((n): n is string => n !== undefined)
  );
}

const memberIdFor = (owner: string): string =>
  MEMBER_ROWS.find((m) => m.name === owner)?.id ?? owner;

export function securityForTeam(team: TeamRow): TeamSecurity {
  const names = teamKeyNames(team);

  // Volume, per key, from the same rows the Usage tab totals.
  const volume = API_KEY_ROWS.filter((r) => names.has(r.key));
  const requests = volume.reduce((a, r) => a + r.requests, 0);

  // Verdicts, per key, from the recorded guardrail events.
  const events = REQUEST_ROWS_ALL.filter(
    (r) => names.has(r.keyId) && r.guardrail !== "allow"
  );
  const countBy = (action: GuardrailAction) =>
    events.filter((r) => r.guardrail === action).length;
  const blocked = countBy("block");
  const findings = events.length;

  const requestStage = requests;
  const outputStage = Math.max(0, requests - blocked);
  const checks = requestStage + outputStage;

  const byOutcome: TeamOutcomeSlice[] = OUTCOME_ORDER.map((action) => ({
    id: action,
    action,
    label: OUTCOME_COPY[action].label,
    description: OUTCOME_COPY[action].description,
    count: action === "allow" ? checks - findings : countBy(action),
  }));

  // Findings by detector category, biggest first. Only findings carry a
  // category, so a zero-findings team gets an empty list — the pane's
  // "Nothing to attribute" state — rather than a clean-checks filler row.
  const byCategory: TeamSecuritySlice[] = CATEGORY_ORDER.map((reason) => ({
    id: reason,
    label: reason,
    count: events.filter((r) => r.guardrailReason === reason).length,
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

  // Findings per member: every recorded event, attributed to the owner of
  // the key that carried it. Mirrors the real summary's byUser — "who made
  // the checked requests" once something fired — so a zero-findings team
  // gets an empty list, and per-member request VOLUME stays on the Usage
  // tab rather than being restated here.
  const perOwner = new Map<string, number>();
  for (const event of events) {
    const owner = API_KEY_ROWS.find((r) => r.key === event.keyId)?.owner;
    if (!owner) {
      continue;
    }
    perOwner.set(owner, (perOwner.get(owner) ?? 0) + 1);
  }
  const byMember: TeamSecuritySlice[] = [...perOwner.entries()]
    .map(([owner, count]) => ({
      id: memberIdFor(owner),
      label: owner,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return { checks, findings, byOutcome, byCategory, byStage, byMember };
}
