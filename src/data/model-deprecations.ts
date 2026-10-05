/**
 * Models that are deprecated as of 2026-10-01, keyed by `Model.id`.
 *
 * The public `/v1/models` feed the catalog is generated from carries no
 * deprecation field (prod's `deprecatedAt` comes from the authenticated
 * dashboard API), so each entry cites where its date comes from:
 *
 *   route     prod's own rule: the route head's provider deprecated it, per
 *             LiteLLM `model_prices_and_context_window.json`
 *             `deprecation_date` (the source prod's `deprecatedAt` reads).
 *   vendor    the model's maker deprecated it: LiteLLM's first-party entry
 *             (`litellm_provider` = the maker) has a past `deprecation_date`.
 *   anthropic Anthropic's own model table lists it as deprecated or retired.
 *
 * Only past dates count; upcoming deprecations are not flagged. Checked
 * 2026-10-01. `model-deprecations.test.ts` asserts every id is a real row.
 */

export type DeprecationSource = "route" | "vendor" | "anthropic";

export type ModelDeprecation = {
  /** ISO date the deprecation took effect. */
  date: string;
  source: DeprecationSource;
};

export const MODEL_DEPRECATIONS: Record<string, ModelDeprecation> = {
  // Anthropic model table: deprecated or retired.
  "anthropic/claude-3-haiku": { date: "2026-04-19", source: "anthropic" },
  "anthropic/claude-3-opus": { date: "2026-01-05", source: "anthropic" },
  "anthropic/claude-opus-4": { date: "2026-10-01", source: "anthropic" },
  "anthropic/claude-opus-4-1": { date: "2026-08-05", source: "anthropic" },
  "anthropic/claude-sonnet-4": { date: "2026-10-01", source: "anthropic" },
  // Route head (Vertex) deprecated it.
  "anthropic/claude-sonnet-4-5": { date: "2026-09-29", source: "route" },
  // Route head (OpenRouter) deprecated it.
  "deepseek/deepseek-r1-distill-llama-70b": {
    date: "2026-09-28",
    source: "route",
  },
  // OpenAI first-party.
  "openai/gpt-3-5-turbo-instruct": { date: "2026-09-28", source: "vendor" },
  "openai/gpt-5-1-codex": { date: "2026-07-23", source: "vendor" },
  "openai/gpt-5-1-codex-max": { date: "2026-07-23", source: "vendor" },
  "openai/gpt-5-1-codex-mini": { date: "2026-07-23", source: "vendor" },
  "openai/gpt-5-2-codex": { date: "2026-07-23", source: "vendor" },
  // Google AI Studio first-party.
  "google/gemini-3-1-flash-image-preview": {
    date: "2026-06-25",
    source: "vendor",
  },
  "google/gemini-3-1-flash-lite-preview": {
    date: "2026-05-25",
    source: "vendor",
  },
  "google/gemini-3-pro-image-preview": { date: "2026-06-25", source: "vendor" },
  "google/gemini-omni-flash-preview": { date: "2026-09-30", source: "vendor" },
};

export function isDeprecated(modelId: string): boolean {
  return modelId in MODEL_DEPRECATIONS;
}
