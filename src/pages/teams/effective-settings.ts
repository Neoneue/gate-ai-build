import type { TeamRow, TeamSavings } from "@/data/teams";
import type { PolicyState } from "@/pages/policies/config";
import type { OrgSettings, UserSettings } from "@/pages/teams/teams-store";

/* ─────────────────────────────────────────────────────────────────────────
 * Which policies + savings apply to a user, and who set them (AG-624 / PRD
 * 8.5 lock cascade org -> team -> member). ONE resolver so the team page and
 * the sidebar "My settings" pages agree by construction.
 *
 *   org lock on            -> org values,  "Locked by your organization"
 *   org off, team lock on  -> team values, "Locked by your team's admin"
 *   both off               -> the user's own values, controls live
 * ───────────────────────────────────────────────────────────────────────── */

export type EffectiveSettings = {
  policies: PolicyState[];
  savings: TeamSavings;
  locked: boolean;
  /** "Who set it" banner copy; undefined when nothing is locked. */
  lockedBy?: string;
};

export const ORG_LOCK_COPY =
  "Locked by your organization. These settings are set by an org admin and can't be changed here.";
export const TEAM_LOCK_COPY =
  "Locked by your team's admin. These settings are set for your team and can't be changed here.";

export function resolveEffectiveSettings(
  user: UserSettings,
  team: TeamRow | undefined,
  org: OrgSettings
): EffectiveSettings {
  if (org.locked) {
    return {
      policies: org.policies,
      savings: org.savings,
      locked: true,
      lockedBy: ORG_LOCK_COPY,
    };
  }
  if (team?.locked) {
    return {
      policies: team.policies,
      savings: team.savings,
      locked: true,
      lockedBy: TEAM_LOCK_COPY,
    };
  }
  return { policies: user.policies, savings: user.savings, locked: false };
}
