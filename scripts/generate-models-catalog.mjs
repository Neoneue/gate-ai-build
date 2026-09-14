#!/usr/bin/env node
/**
 * Regenerate the Models catalog from the gateway's public feed.
 *
 *   node scripts/generate-models-catalog.mjs [path/to/models.json]
 *
 * Without an argument it fetches GET https://gateway.constellationgate.ai/v1/models.
 * Two outputs, both written in place:
 *
 *  1. src/data/models-catalog.ts   every feed row whose id is NOT curated in
 *                                  src/data/models.ts, mapped to `Model`.
 *  2. src/data/models.ts           every CURATED row present in the feed gets
 *                                  its measurable fields overwritten from the
 *                                  feed: pricing, contextWindow,
 *                                  maxOutputTokens, capabilities, releasedAt
 *                                  (only when the feed carries one). Providers,
 *                                  descriptions, names and row order stay
 *                                  hand-authored.
 *
 * Price basis (decided 2026-09-14): the feed advertises the BILLED PAYG rate,
 * markup included, so it is stored verbatim with `pricingMarkup: 1` and every
 * provider row at `paygMarkup: 1`. Advertised equals billed, per the Model
 * transparency PRD (Notion, AG-675). No number in either file is typed by hand.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MODELS_TS = resolve(root, "src/data/models.ts");
const CATALOG_TS = resolve(root, "src/data/models-catalog.ts");
const FEED_URL = "https://gateway.constellationgate.ai/v1/models";

/**
 * Curated rows whose PRICES stay hand-pinned. These eight models carry the
 * seeded traffic in requests.ts, conversations.ts, activity-data.ts and the
 * team roll-ups, whose dollar figures were computed from the catalog at seed
 * time and are asserted to the cent by pricing.test.ts and teams.test.ts.
 * Re-pricing them means regenerating every seeded cost, a separate job. All
 * other fields on these rows still reconcile from the feed.
 */
const PRICE_PINNED_IDS = new Set([
  "anthropic/claude-haiku-4-5",
  "anthropic/claude-opus-4-7",
  "anthropic/claude-opus-4-8",
  "anthropic/claude-sonnet-5",
  "deepseek/deepseek-v4-pro",
  "google/gemini-3-1-pro-preview",
  "moonshotai/kimi-k2-thinking",
  "qwen/qwen3-next-80b-a3b-instruct",
]);

const TAG = {
  "tool-use": "tools",
  vision: "vision",
  reasoning: "reasoning",
  promptCaching: "promptCaching",
  responseSchema: "responseSchema",
  streaming: "streaming",
  webSearch: "webSearch",
  audioInput: "audioInput",
  pdfInput: "pdfInput",
  videoInput: "videoInput",
  audioOutput: "audioOutput",
};
const ORDER = [
  "tools",
  "reasoning",
  "vision",
  "webSearch",
  "pdfInput",
  "promptCaching",
  "responseSchema",
  "streaming",
  "audioInput",
  "videoInput",
  "audioOutput",
];

const perM = (v) =>
  v == null ? null : Math.round(Number.parseFloat(v) * 1e6 * 1e6) / 1e6;
const fixName = (n) =>
  n
    .replace(/(\d) (\d)/g, "$1.$2")
    .replace(/(\d) (\d)/g, "$1.$2")
    .replace(/\b(\d+)b\b/gi, (_, d) => `${d}B`)
    .replace(/\bA(\d+)b\b/gi, (_, d) => `A${d}B`);
const caps = (tags) =>
  [...new Set((tags ?? []).map((t) => TAG[t]).filter(Boolean))].sort(
    (a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)
  );
const iso = (unix) => (unix ? new Date(unix * 1000).toISOString() : null);
const tsNum = (n) =>
  n == null
    ? "null"
    : Number.isInteger(n) && n >= 10_000
      ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "_")
      : String(n);

async function loadFeed(arg) {
  if (arg) {
    return JSON.parse(readFileSync(resolve(arg), "utf8")).data;
  }
  const res = await fetch(FEED_URL);
  if (!res.ok) {
    throw new Error(`feed ${res.status}`);
  }
  return (await res.json()).data;
}

function reconcileCurated(src, feedById) {
  const start = src.indexOf("const CURATED_ROWS: Model[] = [");
  const end = src.indexOf("\n];\n", start) + 4;
  let block = src.slice(start, end);
  let touched = 0;
  block = block.replace(/\n {2}\{\n([\s\S]*?)\n {2}\},?/g, (whole, body) => {
    const id = /id: "([^"]+)"/.exec(body)?.[1];
    const f = id && feedById.get(id);
    if (!f) {
      return whole;
    }
    touched += 1;
    let b = body;
    if (!PRICE_PINNED_IDS.has(id)) {
      b = b.replace(
        /pricing: \{[\s\S]*?\n {4}\},/,
        `pricing: {\n      inputPer1M: ${tsNum(perM(f.pricing?.input))},\n      outputPer1M: ${tsNum(perM(f.pricing?.output))},\n      cachedInputReadPer1M: ${tsNum(perM(f.pricing?.input_cache_read))},\n      cachedInputWritePer1M: ${tsNum(perM(f.pricing?.input_cache_write))},\n    },`
      );
      b = b.replace(/pricingMarkup: [\d.]+,/, "pricingMarkup: 1,");
      b = b.replace(/paygMarkup: [\d.]+,/g, "paygMarkup: 1,");
    }
    b = b.replace(
      /contextWindow: (?:[\d_]+|null),/,
      `contextWindow: ${tsNum(f.context_window ?? null)},`
    );
    b = b.replace(
      /maxOutputTokens: (?:[\d_]+|null),/,
      `maxOutputTokens: ${tsNum(f.max_tokens ?? null)},`
    );
    const c = caps(f.tags);
    b = b.replace(
      /capabilities: \[[\s\S]*?\],/,
      c.length === 0
        ? "capabilities: [],"
        : `capabilities: [\n${c.map((x) => `      "${x}",`).join("\n")}\n    ],`
    );
    if (f.released) {
      b = b.replace(
        /releasedAt: (?:"[^"]*"|null),/,
        `releasedAt: "${iso(f.released)}",`
      );
    }
    return whole.replace(body, b);
  });
  return { src: src.slice(0, start) + block + src.slice(end), touched };
}

function buildCatalog(feed, curatedIds, fetchedOn) {
  const rows = feed
    .filter((x) => !curatedIds.has(x.id))
    .map((x) => ({
      id: x.id,
      vendor: x.owned_by,
      name: fixName(x.name),
      description: x.description ?? "",
      modality: "text",
      contextWindow: x.context_window ?? null,
      maxOutputTokens: x.max_tokens ?? null,
      pricing: {
        inputPer1M: perM(x.pricing?.input),
        outputPer1M: perM(x.pricing?.output),
        cachedInputReadPer1M: perM(x.pricing?.input_cache_read),
        cachedInputWritePer1M: perM(x.pricing?.input_cache_write),
      },
      pricingMarkup: 1,
      capabilities: caps(x.tags),
      releasedAt: iso(x.released),
      providers: [
        {
          id: "openrouter",
          nativeModelId: x.id,
          paygMarkup: 1,
          latencyP50Ms: null,
          throughputTps: null,
          sampleCount: 0,
        },
      ],
    }));
  const header = `/**
 * GENERATED by scripts/generate-models-catalog.mjs, do not edit by hand.
 *
 * Source: GET ${FEED_URL}, fetched ${fetchedOn} (${feed.length} rows).
 * Rows whose id is curated in models.ts are skipped here (their measurable
 * fields are reconciled from the same feed by the script), so MODELS =
 * curated rows first (prod's popular order), then these in feed order.
 *   pricing      the BILLED PAYG rate the feed advertises, markup included,
 *                stored verbatim with markup 1 on one pass-through provider.
 *   providers    the public feed carries no per-account rows.
 *   name         digit-dot repair ("Gemini 2 5" -> "Gemini 2.5") and "80B".
 *   description  verbatim from the feed when present, else empty.
 *   releasedAt   from \`released\` when present, else null.
 */
import type { Model } from "./models";

export const CATALOG_ROWS: Model[] = `;
  return {
    text: `${header}${JSON.stringify(rows, null, 2)};\n`,
    count: rows.length,
  };
}

const feed = await loadFeed(process.argv[2]);
const feedById = new Map(feed.map((m) => [m.id, m]));
const src = readFileSync(MODELS_TS, "utf8");
const curatedIds = new Set(
  [...src.matchAll(/^ {4}id: "([^"]+)",$/gm)].map((m) => m[1])
);
const { src: reconciled, touched } = reconcileCurated(src, feedById);
writeFileSync(MODELS_TS, reconciled);
const today = new Date().toISOString().slice(0, 10);
const { text, count } = buildCatalog(feed, curatedIds, today);
writeFileSync(CATALOG_TS, text);
console.log(
  `feed ${feed.length} rows; curated ${curatedIds.size} (${touched} reconciled, ${curatedIds.size - touched} not in feed); generated ${count}`
);
