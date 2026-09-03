import { useSyncExternalStore } from "react";
import {
  ORG_BUDGET_SEED,
  TEAM_POLICIES_SEED,
  TEAM_SAVINGS_SEED,
  TEAM_SEED_ROWS,
  type TeamBudget,
  type TeamRow,
  type TeamSavings,
} from "@/data/teams";
import type { PolicyState } from "@/pages/policies/config";

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

/** The signed-in user. Seeded owner of "Chad's workspace" (team-members.ts);
 *  the sidebar "My settings" pages resolve their team from the live store,
 *  so moving them between teams changes which lock governs those pages. */
export const CURRENT_USER_ID = "usr_chad";

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
    this.orgSettings = { ...this.orgSettings, ...patch };
    emit();
  },
  userSettings: USER_SETTINGS_SEED as UserSettings,
  setUserSettings(patch: Partial<UserSettings>) {
    this.userSettings = { ...this.userSettings, ...patch };
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
  return teams.find((t) => t.memberIds.includes(CURRENT_USER_ID));
}

export function useDeletedTeams(): DeletedTeamSnapshot[] {
  return useSyncExternalStore(
    (cb) => teamsStore.subscribe(cb),
    () => teamsStore.deletedTeams,
    () => teamsStore.deletedTeams
  );
}
