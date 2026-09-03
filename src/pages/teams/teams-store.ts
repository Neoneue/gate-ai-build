import { useSyncExternalStore } from "react";
import { auditStore } from "@/data/audit-trail-store";
import {
  memberById,
  ORG_BUDGET_SEED,
  TEAM_POLICIES_SEED,
  TEAM_SAVINGS_SEED,
  TEAM_SEED_ROWS,
  type TeamBudget,
  type TeamRow,
  type TeamSavings,
} from "@/data/teams";
import { POLICIES, type PolicyState } from "@/pages/policies/config";

/** Org-level settings (AG-624 / PRD 8.5): the org's own policy + savings
 *  defaults and the lock that forces them onto every team. */
export type OrgSettings = {
  locked: boolean;
  policies: PolicyState[];
  savings: TeamSavings;
};

export const ORG_SETTINGS_SEED: OrgSettings = {
  locked: false,
  policies: TEAM_POLICIES_SEED,
  savings: TEAM_SAVINGS_SEED,
};

/** Who is looking (AG-695 AC 3, role variants of every screen). Admin = the
 *  seeded owner of "Chad's workspace"; Manager = Kira Tan, Development's
 *  manager; Member = Mateus Silva, a Development member (user 2026-09-03). */
export type ViewRole = "admin" | "manager" | "member";
export const ADMIN_USER_ID = "usr_chad";
export const MANAGER_USER_ID = "usr_kira";
export const MEMBER_USER_ID = "usr_mate";
const USER_ID_FOR_ROLE: Record<ViewRole, string> = {
  admin: ADMIN_USER_ID,
  manager: MANAGER_USER_ID,
  member: MEMBER_USER_ID,
};
/** @deprecated read `currentUserId()`; kept for the resolver tests. */
export const CURRENT_USER_ID = ADMIN_USER_ID;

/** The signed-in user for the active view role. The sidebar "My settings"
 *  pages resolve their team from the live store, so moving them between
 *  teams changes which lock governs those pages. */
export function currentUserId(): string {
  return USER_ID_FOR_ROLE[teamsStore.viewRole];
}

/** The signed-in user's own policy + savings choices (Free/Pro settings are
 *  USER-level, meeting 2026-09-01). Applied only when no org or team lock
 *  overrides them. */
export type UserSettings = {
  policies: PolicyState[];
  savings: TeamSavings;
};

export const USER_SETTINGS_SEED: UserSettings = {
  policies: TEAM_POLICIES_SEED,
  savings: TEAM_SAVINGS_SEED,
};

/* ─────────────────────────────────────────────────────────────────────────
 * Enterprise Teams store — ONE teams array for the list page and the detail
 * page, so a mutation made on either survives navigating to the other.
 *
 * Before this store each page owned its own `useState(TEAM_SEED_ROWS)`, and
 * a freshly created team existed only in the list's state: clicking its row
 * mounted the detail page, which re-seeded and answered "Team not found"
 * (live defect, 2026-09-01, `team_local_2`). Same idiom as
 * `requests/range-store.ts`: module state + useSyncExternalStore, no
 * Provider. Session-scoped on purpose — the seed is the shared starting
 * point on every full reload; this is a mock, not persistence.
 *
 * Enterprise pages only. Pro `Teams.tsx` / `TeamDetail.tsx` stay frozen on
 * per-page state for the A/B comparison.
 * ───────────────────────────────────────────────────────────────────────── */

export type DeletedTeamSnapshot = {
  id: string;
  name: string;
  spend: number;
  /** Wall-clock moment of the delete, same as a key's `createdAt` on the
   *  API Keys page: an in-session action stamps real time, not the demo clock. */
  deletedAt: Date;
  /** The row as it stood at the moment of the delete, before its members and
   *  keys folded into Default. The detail page renders an archived team from
   *  this frozen copy: every tab, no Settings, no mutations. */
  team: TeamRow;
};

const listeners = new Set<() => void>();

const emit = () => {
  for (const l of listeners) {
    l();
  }
};

export const teamsStore = {
  teams: TEAM_SEED_ROWS as TeamRow[],
  orgBudget: ORG_BUDGET_SEED as TeamBudget | null,
  /** Deleted teams keep their historical spend attribution on the list's
   *  "Deleted teams" card, wherever the delete happened. */
  deletedTeams: [] as DeletedTeamSnapshot[],
  orgSettings: ORG_SETTINGS_SEED as OrgSettings,
  setOrgSettings(patch: Partial<OrgSettings>) {
    logSettingsChange("Org", this.orgSettings, patch);
    this.orgSettings = { ...this.orgSettings, ...patch };
    emit();
  },
  userSettings: USER_SETTINGS_SEED as UserSettings,
  setUserSettings(patch: Partial<UserSettings>) {
    this.userSettings = { ...this.userSettings, ...patch };
    emit();
  },
  viewRole: "admin" as ViewRole,
  setViewRole(next: ViewRole) {
    this.viewRole = next;
    emit();
  },
  setTeams(next: TeamRow[] | ((prev: TeamRow[]) => TeamRow[])) {
    this.teams = typeof next === "function" ? next(this.teams) : next;
    emit();
  },
  setOrgBudget(next: TeamBudget | null) {
    this.orgBudget = next;
    emit();
  },
  appendDeleted(snapshot: DeletedTeamSnapshot) {
    this.deletedTeams = [...this.deletedTeams, snapshot];
    emit();
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useTeams(): TeamRow[] {
  return useSyncExternalStore(
    (cb) => teamsStore.subscribe(cb),
    () => teamsStore.teams,
    () => teamsStore.teams
  );
}

export function useOrgBudget(): TeamBudget | null {
  return useSyncExternalStore(
    (cb) => teamsStore.subscribe(cb),
    () => teamsStore.orgBudget,
    () => teamsStore.orgBudget
  );
}

export function useOrgSettings(): OrgSettings {
  return useSyncExternalStore(
    (cb) => teamsStore.subscribe(cb),
    () => teamsStore.orgSettings,
    () => teamsStore.orgSettings
  );
}

/* ─── Audit log for forced-settings writes (AG-624 AC) ─────────────────── */

const actorName = () => memberById(currentUserId())?.name ?? "Unknown";

/** Name the policy whose row differs between two arrays, for the log line. */
function changedPolicyName(
  prev: PolicyState[],
  next: PolicyState[]
): string | undefined {
  const before = new Map(prev.map((p) => [p.id, JSON.stringify(p)]));
  const hit = next.find((p) => before.get(p.id) !== JSON.stringify(p));
  return hit ? POLICIES.find((c) => c.id === hit.id)?.name : undefined;
}

function changedSavingsField(
  prev: TeamSavings,
  next: TeamSavings
): string | undefined {
  if (prev.compression !== next.compression) {
    return `Advanced compression ${next.compression ? "enabled" : "disabled"}`;
  }
  if (prev.caching !== next.caching) {
    return `Caching ${next.caching ? "enabled" : "disabled"}`;
  }
  if (prev.cacheTtl !== next.cacheTtl) {
    return `Cache TTL set to ${next.cacheTtl}`;
  }
  return;
}

/** One audit row per settings write, scope named first ("Org" or the team). */
export function logSettingsChange(
  scope: string,
  prev: { locked?: boolean; policies: PolicyState[]; savings: TeamSavings },
  next: Partial<{
    locked: boolean;
    policies: PolicyState[];
    savings: TeamSavings;
  }>
) {
  let description: string | undefined;
  if (next.locked !== undefined && next.locked !== (prev.locked ?? false)) {
    description = `${scope} settings ${next.locked ? "locked" : "unlocked"}`;
  } else if (next.policies) {
    const name = changedPolicyName(prev.policies, next.policies);
    description = name ? `${scope} policy "${name}" updated` : undefined;
  } else if (next.savings) {
    const field = changedSavingsField(prev.savings, next.savings);
    description = field ? `${scope} token savings: ${field}` : undefined;
  }
  if (description) {
    auditStore.append({ kind: "AUDIT", description, member: actorName() });
  }
}

export function useUserSettings(): UserSettings {
  return useSyncExternalStore(
    (cb) => teamsStore.subscribe(cb),
    () => teamsStore.userSettings,
    () => teamsStore.userSettings
  );
}

/** The live team row holding the signed-in user (every user is on exactly
 *  one team, PRD 3). */
export function useCurrentUserTeam(): TeamRow | undefined {
  const teams = useTeams();
  const role = useViewRole();
  const id = USER_ID_FOR_ROLE[role];
  return teams.find((t) => t.memberIds.includes(id));
}

export function useViewRole(): ViewRole {
  return useSyncExternalStore(
    (cb) => teamsStore.subscribe(cb),
    () => teamsStore.viewRole,
    () => teamsStore.viewRole
  );
}

export function useDeletedTeams(): DeletedTeamSnapshot[] {
  return useSyncExternalStore(
    (cb) => teamsStore.subscribe(cb),
    () => teamsStore.deletedTeams,
    () => teamsStore.deletedTeams
  );
}
