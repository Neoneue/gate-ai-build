import { describe, expect, it } from "vitest";
import { MODEL_DEPRECATIONS } from "./model-deprecations";
import { MODELS } from "./models";

describe("MODEL_DEPRECATIONS", () => {
  it("only names models that exist in the catalog", () => {
    const ids = new Set(MODELS.map((m) => m.id));
    const unknown = Object.keys(MODEL_DEPRECATIONS).filter(
      (id) => !ids.has(id)
    );
    expect(unknown).toEqual([]);
  });

  it("only flags deprecations that have already taken effect", () => {
    const future = Object.entries(MODEL_DEPRECATIONS).filter(
      ([, d]) => d.date > "2026-10-01"
    );
    expect(future).toEqual([]);
  });
});
