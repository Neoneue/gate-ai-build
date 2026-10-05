import { describe, expect, it } from "vitest";
import {
  FREE_MODELS,
  findFreeModel,
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

  it("ships the live build's two free twins, each a -free constellation id", () => {
    expect(FREE_MODELS.map((f) => [f.id, f.constellationId])).toEqual([
      ["qwen/qwen3-8-flash", "constellation/qwen3-8-flash-free"],
      ["z-ai/glm-5-3-flash", "constellation/glm-5-3-flash-free"],
    ]);
    expect(findFreeModel("qwen/qwen3-8-flash")?.tagline).toBe("Lightweight");
    expect(findFreeModel("openai/gpt-oss-20b")).toBeUndefined();
  });

  it("has no plan gate: every free row is open to every plan", () => {
    for (const f of FREE_MODELS) {
      expect(Object.keys(f).sort()).toEqual(
        ["constellationId", "id", "tagline", "usage"].sort()
      );
    }
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
