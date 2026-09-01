import { useSyncExternalStore } from "react";
import {
  ORG_BUDGET_SEED,
  TEAM_SEED_ROWS,
  type TeamBudget,
  type TeamRow,
} from "@/data/teams";

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

export type DeletedTeamSnapshot = { id: string; name: string; spend: number };

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

export function useDeletedTeams(): DeletedTeamSnapshot[] {
  return useSyncExternalStore(
    (cb) => teamsStore.subscribe(cb),
    () => teamsStore.deletedTeams,
    () => teamsStore.deletedTeams
  );
}
