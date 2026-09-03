import { describe, expect, it } from "vitest";
import { requestRowId } from "@/data/requests";
import { TEAM_SEED_ROWS, type TeamRow } from "@/data/teams";
import { budgetBlockRows } from "./budget-block-rows";

const platform = TEAM_SEED_ROWS.find(
  (t) => t.name === "Development"
) as TeamRow;

describe("budgetBlockRows (PRD §3 hard-budget block on Messages)", () => {
  it("renders nothing while every team is inside its caps (seed)", () => {
    expect(budgetBlockRows(TEAM_SEED_ROWS)).toEqual([]);
  });

  it("a hard cap under spend yields one 429 error/block row naming the team and window", () => {
    const over: TeamRow = {
      ...platform,
      budget: {
        name: "Team budget",
        caps: { monthly: 1 },
        enforcement: "hard",
        warnThreshold: 80,
        notifyAdmins: true,
        blockThreshold: 100,
      },
    };
    const rows = budgetBlockRows([over]);
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.status).toBe("error");
    expect(row.guardrail).toBe("block");
    expect(row.code).toBe("429");
    expect(row.blockReason).toBe("budget");
    expect(row.guardrailReason).toBeUndefined();
    expect(row.errorDetail).toContain('"Development"');
    expect(row.errorDetail).toContain("monthly cap");
    expect(row.errorDetail).toContain("Team budget block");
    expect(platform.keyIds.length).toBeGreaterThan(0);
    expect(requestRowId(row)).toBe("budget-block-" + platform.id);
  });

  it("a soft budget over cap never blocks", () => {
    const over: TeamRow = {
      ...platform,
      budget: {
        name: "Team budget",
        caps: { monthly: 1 },
        enforcement: "soft",
        warnThreshold: 80,
        notifyAdmins: true,
        blockThreshold: 100,
      },
    };
    expect(budgetBlockRows([over])).toEqual([]);
  });
});
