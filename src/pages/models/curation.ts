import { MODELS, type Model, sortModels } from "@/data/models";

/**
 * Curation layer for the Models list page: the Featured row and the four
 * shelves that sit between the page header and the full catalog table.
 *
 * Two shelf kinds, per the Model transparency PRD (Notion, AG-675): an
 * editorial ALLOWLIST is permitted when the reason is a stated property;
 * a quality RANKING (benchmarks, "most capable") is not. So the two
 * "Best for" shelves are allowlists whose subtitle names the properties
 * that earned the pick, and the other two derive from catalog fields
 * (`releasedAt`, prod's popular order). Every number a shelf row shows
 * still reads off the same `Model` the main table renders, so shelf and
 * table cannot disagree.
 *
 * Picks are industry-backed (research 2026-09-14): OpenClaw's Anthropic
 * small-model default is Haiku 4.5; DeepSeek V4 Flash leads OpenRouter's
 * weekly token volume; Gemini 3.1 Pro Preview ships PDF input and Search
 * grounding at 1M context; Gemini 3.8 Flash and Fable 5.1 ship web search
 * plus PDF input at 1M.
 */

export const SHELF_ROW_COUNT = 4;

/** Featured: one row of compact cards under the page header. The tagline is
 *  the per-card "why", two or three words in the marketing site's badge
 *  vocabulary (positioning, not a rank). */
export type FeaturedPick = { id: string; tagline: string };

export const FEATURED_PICKS: readonly FeaturedPick[] = [
  { id: "anthropic/claude-fable-5-1", tagline: "Frontier reasoning" },
  { id: "openai/gpt-6-astra", tagline: "Deep reasoning" },
  { id: "anthropic/claude-sonnet-5", tagline: "Balanced" },
  { id: "deepseek/deepseek-v4-flash", tagline: "Open weight" },
];

export const FEATURED_MODEL_IDS: readonly string[] = FEATURED_PICKS.map(
  (p) => p.id
);

export function featuredTagline(model: Model): string | undefined {
  return FEATURED_PICKS.find((p) => p.id === model.id)?.tagline;
}

export type ShelfId = "research" | "always-on" | "newest" | "popular";

export type Shelf = {
  id: ShelfId;
  /** The "what". */
  title: string;
  /** The "why": the reason Gate chose these, in a curated voice. */
  subtitle: string;
  /** Sort the main table applies when the shelf's "View all" is followed.
   *  Absent for allowlist shelves, which have no single sort key. */
  sort?: Parameters<typeof sortModels>[1];
  /** Ordered picks, resolved against MODELS. */
  rows: (models: Model[]) => Model[];
};

const byIds =
  (ids: readonly string[]) =>
  (models: Model[]): Model[] =>
    ids
      .map((id) => models.find((m) => m.id === id))
      .filter((m): m is Model => m !== undefined)
      .slice(0, SHELF_ROW_COUNT);

/** Each row carries web search or PDF input AND a 1M+ context window, so
 *  the shelf's subtitle is true of every pick (checked in curation.test). */
export const RESEARCH_MODEL_IDS: readonly string[] = [
  "anthropic/claude-fable-5-1",
  "openai/gpt-6-astra",
  "google/gemini-3-1-pro-preview",
  "google/gemini-3-8-flash",
];

export const ALWAYS_ON_MODEL_IDS: readonly string[] = [
  "anthropic/claude-haiku-4-5",
  "google/gemini-3-1-flash-lite",
  "deepseek/deepseek-v4-flash",
  "qwen/qwen3-next-80b-a3b-instruct",
];

/** Confirmed API releases, Sept 2026 (research 2026-09-14). */
export const NEWEST_MODEL_IDS: readonly string[] = [
  "deepseek/deepseek-v4-1-flash",
  "openai/gpt-6-astra",
  "google/gemini-3-8-flash",
  "anthropic/claude-fable-5-1",
];

export const SHELVES: readonly Shelf[] = [
  {
    id: "research",
    title: "Best for research",
    subtitle:
      "We reach for these when the job is reading a hundred sources and coming back with one answer. Web search, PDF input and million-token context.",
    rows: byIds(RESEARCH_MODEL_IDS),
  },
  {
    id: "always-on",
    title: "Best for 24/7 runs",
    subtitle:
      "Picked for agents that never clock out. Low per-token cost, tool use and prompt caching. Pairs well with Hermes and OpenClaw.",
    rows: byIds(ALWAYS_ON_MODEL_IDS),
  },
  {
    id: "newest",
    title: "Newest models on Gate",
    subtitle:
      "Fresh off the wire. The latest releases we have brought onto the gateway, so you can try them the week they ship.",
    sort: "newest",
    // Allowlisted, then ordered by releasedAt. A pure releasedAt sort over
    // the full feed surfaces "-latest" alias rows and niche fine-tunes whose
    // catalogue insert date is recent; the shelf is for releases people
    // have heard of this month.
    rows: (models) =>
      sortModels(byIds(NEWEST_MODEL_IDS)(models), "newest").slice(
        0,
        SHELF_ROW_COUNT
      ),
  },
  {
    id: "popular",
    title: "Most popular on Gate",
    subtitle:
      "What our users actually route to. Ranked by requests through the gateway over the last 30 days.",
    sort: "popular",
    rows: (models) => sortModels(models, "popular").slice(0, SHELF_ROW_COUNT),
  },
];

export function featuredModels(models: Model[] = MODELS): Model[] {
  return byIds(FEATURED_MODEL_IDS)(models);
}

export function shelfRows(shelf: Shelf, models: Model[] = MODELS): Model[] {
  return shelf.rows(models);
}
