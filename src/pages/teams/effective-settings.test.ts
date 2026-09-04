import { describe, expect, it } from "vitest";
import { TEAM_SEED_ROWS } from "@/data/teams";
import {
  ORG_LOCK_COPY,
  resolveEffectiveSettings,
  TEAM_LOCK_COPY,
} from "@/pages/teams/effective-settings";
import {
  ORG_SETTINGS_SEED,
  USER_SETTINGS_SEED,
} from "@/pages/teams/teams-store";

const team = TEAM_SEED_ROWS[0];

describe("resolveEffectiveSettings (AG-624 lock cascade)", () => {
  it("unlocked: the user's own values, controls live", () => {
    const r = resolveEffectiveSettings(
      USER_SETTINGS_SEED,
      team,
      ORG_SETTINGS_SEED
    );
    expect(r.locked).toBe(false);
    expect(r.lockedBy).toBeUndefined();
    expect(r.policies).toBe(USER_SETTINGS_SEED.policies);
  });

  it("team lock: team values, team banner", () => {
    const locked = {
      ...team,
      locked: true,
      savings: { ...team.savings, caching: false },
    };
    const r = resolveEffectiveSettings(
      USER_SETTINGS_SEED,
      locked,
      ORG_SETTINGS_SEED
    );
    expect(r.locked).toBe(true);
    expect(r.lockedBy).toBe(TEAM_LOCK_COPY);
    expect(r.savings.caching).toBe(false);
  });

  it("org lock wins over team lock: org values, org banner", () => {
    const org = {
      ...ORG_SETTINGS_SEED,
      locked: true,
      savings: { ...ORG_SETTINGS_SEED.savings, compression: false },
    };
    const r = resolveEffectiveSettings(
      USER_SETTINGS_SEED,
      { ...team, locked: true },
      org
    );
    expect(r.lockedBy).toBe(ORG_LOCK_COPY);
    expect(r.savings.compression).toBe(false);
  });

  it("no team (user unassigned): falls back to the user's values", () => {
    const r = resolveEffectiveSettings(
      USER_SETTINGS_SEED,
      undefined,
      ORG_SETTINGS_SEED
    );
    expect(r.locked).toBe(false);
  });
});
