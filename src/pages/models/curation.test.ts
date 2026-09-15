import { describe, expect, it } from "vitest";
import { MODELS } from "@/data/models";
import {
  ALWAYS_ON_MODEL_IDS,
  FEATURED_MODEL_IDS,
  featuredModels,
  NEWEST_MODEL_IDS,
  RESEARCH_MODEL_IDS,
  SHELF_ROW_COUNT,
  SHELVES,
  shelfRows,
} from "./curation";

const ids = new Set(MODELS.map((m) => m.id));

describe("models curation", () => {
  it("every allowlisted id resolves to a catalog row", () => {
    for (const id of [
      ...FEATURED_MODEL_IDS,
      ...RESEARCH_MODEL_IDS,
      ...ALWAYS_ON_MODEL_IDS,
      ...NEWEST_MODEL_IDS,
    ]) {
      expect(ids.has(id), id).toBe(true);
    }
  });

  it("featured row and every shelf carry exactly SHELF_ROW_COUNT rows", () => {
    expect(featuredModels()).toHaveLength(SHELF_ROW_COUNT);
    for (const shelf of SHELVES) {
      expect(shelfRows(shelf), shelf.id).toHaveLength(SHELF_ROW_COUNT);
    }
  });

  it("shelf rows are distinct within a shelf", () => {
    for (const shelf of SHELVES) {
      const rows = shelfRows(shelf).map((m) => m.id);
      expect(new Set(rows).size, shelf.id).toBe(rows.length);
    }
  });

  it("newest derives from releasedAt and lands on the four September releases", () => {
    const newest = SHELVES.find((s) => s.id === "newest");
    expect(newest).toBeDefined();
    const rows = shelfRows(newest as (typeof SHELVES)[number]);
    expect(rows.map((m) => m.id)).toEqual([
      "deepseek/deepseek-v4-1-flash",
      "openai/gpt-6-astra",
      "google/gemini-3-8-flash",
      "anthropic/claude-fable-5-1",
    ]);
    for (let i = 1; i < rows.length; i++) {
      const a = Date.parse(rows[i - 1]?.releasedAt ?? "");
      const b = Date.parse(rows[i]?.releasedAt ?? "");
      expect(a).toBeGreaterThanOrEqual(b);
    }
  });

  it("every research pick has PDF input, reasoning and a 1M+ context", () => {
    const research = SHELVES.find((s) => s.id === "research");
    for (const m of shelfRows(research as (typeof SHELVES)[number])) {
      const caps = new Set(m.capabilities);
      expect(caps.has("pdfInput") && caps.has("reasoning"), m.id).toBe(true);
      expect(m.contextWindow ?? 0, m.id).toBeGreaterThanOrEqual(1_000_000);
    }
  });

  it("popular is prod's catalog order, untouched by the new rows", () => {
    const popular = SHELVES.find((s) => s.id === "popular");
    const rows = shelfRows(popular as (typeof SHELVES)[number]);
    expect(rows.map((m) => m.id)).toEqual(
      MODELS.slice(0, SHELF_ROW_COUNT).map((m) => m.id)
    );
  });

  it("every row a shelf or the featured strip shows carries a release date", () => {
    const shown = [
      ...featuredModels(),
      ...SHELVES.flatMap((s) => shelfRows(s)),
    ];
    for (const m of shown) {
      expect(m.releasedAt, m.id).not.toBeNull();
    }
  });
});
