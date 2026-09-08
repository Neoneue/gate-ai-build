import { describe, expect, test } from "vitest";
import { deleteTeam, TEAM_SEED_ROWS } from "@/data/teams";
import {
  securityForTeamAtRange,
  teamEventShares,
  teamsIncluding,
} from "@/pages/teams/security-data";

const design = TEAM_SEED_ROWS.find((t) => t.id === "team_design");
if (!design) {
  throw new Error("seed has no Design team");
}

describe("archived team security (snapshot rendered off the live list)", () => {
  // The detail page renders an archived team from its frozen snapshot while
  // the live list no longer carries it. Its historical keys still earned
  // their share of the org events (PRD 3 Reassignment).
  const live = deleteTeam(TEAM_SEED_ROWS, design.id);
  const seeded = securityForTeamAtRange(design, "all", null, TEAM_SEED_ROWS);
  const archived = securityForTeamAtRange(design, "all", null, live);

  test("live list no longer contains the archived team", () => {
    expect(live.some((t) => t.id === design.id)).toBe(false);
  });

  test("the archived team keeps the findings its keys earned", () => {
    expect(archived.findings).toBeGreaterThan(0);
    expect(archived.findings).toBe(seeded.findings);
  });

  test("its manager keeps a per-member row", () => {
    const jordan = archived.byMember.find((m) => m.id === "usr_jordan");
    expect(jordan?.count).toBe(
      seeded.byMember.find((m) => m.id === "usr_jordan")?.count
    );
    expect(jordan?.count).toBeGreaterThan(0);
  });

  test("teamsIncluding is a no-op for a live team", () => {
    expect(teamsIncluding(TEAM_SEED_ROWS, design)).toBe(TEAM_SEED_ROWS);
    expect(teamsIncluding(live, design)).toHaveLength(live.length + 1);
  });

  test("live teams' shares are unchanged by the archive", () => {
    const before = teamEventShares("all", null, TEAM_SEED_ROWS);
    const after = teamEventShares("all", null, teamsIncluding(live, design));
    for (const t of live) {
      expect(after.get(t.id)).toBe(before.get(t.id));
    }
  });
});
