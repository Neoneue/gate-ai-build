import { API_KEY_SEED_ROWS } from "@/data/api-keys";
import {
  attributedKeyNames,
  TEAM_POLICIES_SEED,
  TEAM_SAVINGS_SEED,
  type TeamRow,
} from "@/data/teams";
import type { CustomRange, Range } from "@/lib/range";
import { securityForTeamAtRange, type TeamSecurity } from "./security-data";
import type { ViewScope } from "./view-scope";

/* ─────────────────────────────────────────────────────────────────────────
 * Security reads per role (PRD §8.4 security-event visibility, §11).
 *
 *  Admin    the org canon, untouched.
 *  Manager  their team's users: the team's allocated share of the org canon
 *           (the same numbers the team Security tab shows), filterable by
 *           user. Oversight metadata only.
 *  Member   their own keys: the person as a one-member team.
 * ───────────────────────────────────────────────────────────────────────── */

/** The rest of the org as one team, so a virtual own-team's share settles
 *  against everything it is not (allocation needs the whole set at once). */
function orgRemainder(own: TeamRow): TeamRow {
  const ownIds = new Set(own.historyKeyIds ?? own.keyIds);
  const rest = API_KEY_SEED_ROWS.filter((k) => !ownIds.has(k.id));
  return {
    id: `${own.id}_remainder`,
    name: "Everyone else",
    isDefault: false,
    memberIds: [],
    keyIds: rest.filter((k) => !k.revoked).map((k) => k.id),
    historyKeyIds: rest.map((k) => k.id),
    managerIds: [],
    budget: null,
    policies: TEAM_POLICIES_SEED,
    savings: TEAM_SAVINGS_SEED,
  };
}

/** The team whose security a scoped user reads: the managed team for a
 *  Manager, themself for a Member. Null when unscoped. */
export function securityTeam(scope: ViewScope): TeamRow | null {
  return scope.managedTeam ?? scope.ownTeam;
}

/** Key names whose events a scoped user may see. Null when unscoped. */
export function securityKeyNames(scope: ViewScope): Set<string> | null {
  if (!scope.scoped) {
    return null;
  }
  if (scope.managedTeam) {
    return attributedKeyNames(scope.managedTeam);
  }
  return scope.keyNames;
}

/** The scoped Security numbers for a range, or null for Admin. */
export function scopedSecurity(
  scope: ViewScope,
  range: Range,
  customRange: CustomRange | null,
  teams: TeamRow[]
): TeamSecurity | null {
  if (scope.managedTeam) {
    return securityForTeamAtRange(scope.managedTeam, range, customRange, teams);
  }
  if (scope.ownTeam) {
    const own = scope.ownTeam;
    return securityForTeamAtRange(own, range, customRange, [
      own,
      orgRemainder(own),
    ]);
  }
  return null;
}
