import { API_KEY_SEED_ROWS } from "@/data/api-keys";
import {
  memberById,
  TEAM_POLICIES_SEED,
  TEAM_SAVINGS_SEED,
  type TeamRow,
} from "@/data/teams";
import { API_KEY_ROWS } from "@/pages/activity-data";
import {
  currentUserId,
  useTeams,
  useViewRole,
  type ViewRole,
} from "./teams-store";

/* ─────────────────────────────────────────────────────────────────────────
 * View scope (PRD §3 "Managers use the product too", §8.4, §11).
 *
 * Manager and Member are regular Gate users: every product page shows the
 * data THEIR OWN keys produced. Admin is the org owner and reads everything.
 * The scope is one object every org-wide page derives from, so the rule
 * lives in one place and a role switch re-scopes every surface at once.
 *
 * Attribution is by API key (PRD §3 Attribution, §8.1): a request, event or
 * conversation belongs to whoever owns the key that sent it. Revoked keys
 * stay in the set because their PAST traffic is still the owner's history.
 * ───────────────────────────────────────────────────────────────────────── */

export type ViewScope = {
  role: ViewRole;
  userId: string;
  /** False for Admin: the page reads the org. */
  scoped: boolean;
  /** Activity key names (`prod-web`) the signed-in user owns, revoked
   *  included. Null when unscoped. */
  keyNames: Set<string> | null;
  /** A virtual team holding only the user and their keys, so the team
   *  derivations (`usageForTeam`, `teamSavingsKpis`, `securityForTeamAtRange`)
   *  read a person exactly as they read a team. Null when unscoped. */
  ownTeam: TeamRow | null;
  /** The team the user manages (live store), for the Manager's team-level
   *  security reads (PRD §8.4 security-event visibility). Null otherwise. */
  managedTeam: TeamRow | null;
  /** The user's share of the org's 7d request volume. Org canon totals that
   *  are not row-derived (the Messages hero, the Conversations count) scale by
   *  it, the same way team pages allocate the org Security canon. 1 when
   *  unscoped. */
  requestShare: number;
};

export function ownKeyNames(userId: string): Set<string> {
  return new Set(
    API_KEY_SEED_ROWS.filter((k) => k.ownerId === userId).map((k) => k.name)
  );
}

/** Fraction of the org's 7d requests that ran on `names`. BYOK keys count:
 *  Gate saw the traffic even though the provider billed it. */
function requestShareFor(names: Set<string>): number {
  const total = API_KEY_ROWS.reduce((a, r) => a + r.requests, 0) || 1;
  const own = API_KEY_ROWS.filter((r) => names.has(r.key)).reduce(
    (a, r) => a + r.requests,
    0
  );
  return own / total;
}

/** One person as a team: their id, their live keys as membership, every key
 *  they ever owned as history. `usageForTeam` and friends need nothing else. */
function ownTeamRow(userId: string): TeamRow {
  const own = API_KEY_SEED_ROWS.filter((k) => k.ownerId === userId);
  return {
    id: `scope_${userId}`,
    name: memberById(userId)?.name ?? userId,
    isDefault: false,
    memberIds: [userId],
    keyIds: own.filter((k) => !k.revoked).map((k) => k.id),
    historyKeyIds: own.map((k) => k.id),
    managerIds: [],
    budget: null,
    policies: TEAM_POLICIES_SEED,
    savings: TEAM_SAVINGS_SEED,
  };
}

export function viewScopeFor(
  role: ViewRole,
  userId: string,
  teams: TeamRow[]
): ViewScope {
  if (role === "admin") {
    return {
      role,
      userId,
      scoped: false,
      keyNames: null,
      ownTeam: null,
      managedTeam: null,
      requestShare: 1,
    };
  }
  const keyNames = ownKeyNames(userId);
  return {
    role,
    userId,
    scoped: true,
    keyNames,
    ownTeam: ownTeamRow(userId),
    managedTeam:
      role === "manager"
        ? (teams.find((t) => t.managerIds.includes(userId)) ?? null)
        : null,
    requestShare: requestShareFor(keyNames),
  };
}

export function useViewScope(): ViewScope {
  const role = useViewRole();
  const teams = useTeams();
  return viewScopeFor(role, currentUserId(), teams);
}

/** The Security rows store the key as `name (sk-gw-xxx)`; the name is the
 *  attribution id. */
export function eventKeyName(eventKey: string): string {
  return eventKey.split(" ")[0] ?? eventKey;
}

export function inScope(scope: ViewScope, keyName: string): boolean {
  return scope.keyNames === null || scope.keyNames.has(keyName);
}

/** A whole-number share of an org canon total, floored at 0. */
export function scaleByShare(n: number, share: number): number {
  return Math.max(0, Math.round(n * share));
}
