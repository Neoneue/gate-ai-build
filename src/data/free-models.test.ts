import { describe, expect, it } from "vitest";
import {
  canUseFreeModel,
  effectivePlan,
  FREE_MODELS,
  freeModelRows,
  isExhausted,
  nextResetUtc,
  usedPct,
} from "./free-models";
import { MODELS } from "./models";

describe("free models", () => {
  it("every free model resolves to a catalog row and uses a constellation id", () => {
    const ids = new Set(MODELS.map((m) => m.id));
    for (const f of FREE_MODELS) {
      expect(ids.has(f.id), f.id).toBe(true);
      expect(f.constellationId.startsWith("constellation/"), f.id).toBe(true);
    }
    expect(freeModelRows()).toHaveLength(FREE_MODELS.length);
  });

  it("Default and Free surfaces read as Free access, Pro and Enterprise as Pro", () => {
    expect(effectivePlan("/models-default")).toBe("free");
    expect(effectivePlan("/models-free")).toBe("free");
    expect(effectivePlan("/models")).toBe("pro");
    expect(effectivePlan("/models-enterprise")).toBe("pro");
  });

  it("Pro-only rows are locked for Free users and open for Pro users", () => {
    const proOnly = FREE_MODELS.find((f) => f.access === "pro-only");
    const shared = FREE_MODELS.find((f) => f.access === "free-and-pro");
    expect(proOnly && shared).toBeTruthy();
    expect(
      canUseFreeModel(proOnly as (typeof FREE_MODELS)[number], "free")
    ).toBe(false);
    expect(
      canUseFreeModel(proOnly as (typeof FREE_MODELS)[number], "pro")
    ).toBe(true);
    expect(
      canUseFreeModel(shared as (typeof FREE_MODELS)[number], "free")
    ).toBe(true);
  });

  it("usage clamps to 0..100 and exhaustion names the reached period", () => {
    expect(usedPct(-5)).toBe(0);
    expect(usedPct(140)).toBe(100);
    const exhausted = FREE_MODELS.filter((f) => isExhausted(f) !== null);
    expect(exhausted.length).toBeGreaterThan(0);
    for (const f of exhausted) {
      expect(["week", "month"]).toContain(isExhausted(f));
    }
  });

  it("weekly reset is the next Monday 00:00 UTC, monthly the first of next month", () => {
    const thu = new Date(Date.UTC(2026, 8, 17, 15, 0, 0)); // Thu 17 Sep 2026
    expect(nextResetUtc("week", thu).toISOString()).toBe(
      "2026-09-21T00:00:00.000Z"
    );
    const mon = new Date(Date.UTC(2026, 8, 21, 0, 0, 0)); // Mon 21 Sep
    expect(nextResetUtc("week", mon).toISOString()).toBe(
      "2026-09-28T00:00:00.000Z"
    );
    expect(nextResetUtc("month", thu).toISOString()).toBe(
      "2026-10-01T00:00:00.000Z"
    );
  });
});
