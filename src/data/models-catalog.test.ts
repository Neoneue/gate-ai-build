import { describe, expect, it } from "vitest";
import { VENDOR_META } from "@/components/icons/vendor-meta";
import { getConversationView } from "@/data/conversationDetail";
import { CONVERSATION_ROWS, SAMPLE_TRACE } from "@/data/conversations";
import {
  MODEL_IDS,
  MODELS,
  modelById,
  PAYG_PRICING_MODEL_IDS,
} from "@/data/models";
import {
  REQUEST_ROWS_7D,
  REQUEST_ROWS_24H,
  REQUEST_ROWS_30D,
  REQUEST_ROWS_ALL,
} from "@/data/requests";
import {
  MODEL_ROWS,
  OTHERS_KEY,
  OTHERS_LABEL,
  rankSeries,
  SERIES_POOL,
  TOKENS_TOTALS_7D,
} from "@/pages/activity-data";
import { MODEL_FILTER_OPTIONS as CONVERSATION_MODEL_FILTERS } from "@/pages/conversations/data";
import { MODEL_FILTER_OPTIONS as REQUEST_MODEL_FILTERS } from "@/pages/requests/data";

/**
 * The catalog-coverage contract.
 *
 * `data/models.ts` is the only place a model may be introduced. Every other
 * surface — Messages rows, Conversations, the Activity charts, the Setup
 * pricing table, both filter dropdowns — refers to a model by its canonical
 * `vendor/model` id and reads the label back from the catalog.
 *
 * This exists because that was not true. On 2026-08-03 the catalog was rebuilt
 * from the production API and six of the nine models Messages charted stopped
 * existing; Activity charted four more that never existed anywhere; Setup
 * quoted prices for GPT-5.2, o4, Grok 4 and Llama 4 Maverick. Each surface had
 * its own spelling and none of them were checked against anything, so the app
 * described three different fleets depending on which page you opened.
 *
 * A failure here is not a style issue. It means a page is naming a model the
 * gateway cannot serve.
 */

const CATALOG = new Set(MODEL_IDS);
const catalogIds = (ids: Iterable<string>) => [...new Set(ids)].sort();

describe("model catalog coverage", () => {
  it("every request row names a catalog model, with its catalog vendor", () => {
    const sets = {
      all: REQUEST_ROWS_ALL,
      "24h": REQUEST_ROWS_24H,
      "7d": REQUEST_ROWS_7D,
      "30d": REQUEST_ROWS_30D,
    };
    for (const [range, rows] of Object.entries(sets)) {
      expect(rows.length, `${range} has rows`).toBeGreaterThan(0);
      const unknown = catalogIds(
        rows.map((r) => r.model).filter((id) => !CATALOG.has(id))
      );
      expect(unknown, `${range} model ids outside the catalog`).toEqual([]);
      // The row's own `vendor` drives its avatar and the wire-format endpoint,
      // so it has to agree with the catalog rather than merely be a Vendor.
      const mismatched = rows
        .filter((r) => modelById(r.model)?.vendor !== r.vendor)
        .map((r) => `${r.model} labelled ${r.vendor}`);
      expect(catalogIds(mismatched), `${range} vendor mismatches`).toEqual([]);
    }
  });

  it("every conversation names catalog models, seeded and derived alike", () => {
    for (const seed of CONVERSATION_ROWS) {
      const view = getConversationView(seed, REQUEST_ROWS_ALL);
      const label = seed.conversationId;
      expect(
        catalogIds(seed.models.filter((id) => !CATALOG.has(id))),
        `${label} seed models outside the catalog`
      ).toEqual([]);
      expect(
        catalogIds(view.models.filter((id) => !CATALOG.has(id))),
        `${label} derived models outside the catalog`
      ).toEqual([]);
      // The seed is what raw consumers read (Overview's preview table,
      // ConversationsTrace's lookup); the view is what the list renders. They
      // drifted apart on 7 of 8 rows before 2026-08-03, which is exactly the
      // shape of bug a reader cannot see from one page.
      expect(seed.models, `${label} seed models match the derivation`).toEqual(
        view.models
      );
      expect(
        seed.vendors,
        `${label} seed vendors match the derivation`
      ).toEqual(view.vendors);
    }
  });

  it("every sample trace step names a catalog model", () => {
    const unknown = catalogIds(
      SAMPLE_TRACE.map((t) => t.model).filter((id) => !CATALOG.has(id))
    );
    expect(unknown).toEqual([]);
    const mismatched = SAMPLE_TRACE.filter(
      (t) => modelById(t.model)?.vendor !== t.vendor
    ).map((t) => `${t.model} labelled ${t.vendor}`);
    expect(catalogIds(mismatched)).toEqual([]);
  });

  it("both model filter dropdowns offer only catalog models", () => {
    for (const [name, options] of [
      ["Messages", REQUEST_MODEL_FILTERS],
      ["Conversations", CONVERSATION_MODEL_FILTERS],
    ] as const) {
      expect(options.length, `${name} filter has options`).toBeGreaterThan(0);
      const unknown = catalogIds(
        options.map((o) => o.value).filter((id) => !CATALOG.has(id))
      );
      expect(unknown, `${name} filter values outside the catalog`).toEqual([]);
      // The label is the catalog's, not a second spelling of it.
      const relabelled = options
        .filter((o) => modelById(o.value)?.name !== o.label)
        .map((o) => `${o.value} shown as "${o.label}"`);
      expect(catalogIds(relabelled), `${name} filter labels`).toEqual([]);
      const misvendored = options
        .filter((o) => modelById(o.value)?.vendor !== o.vendor)
        .map((o) => o.value);
      expect(catalogIds(misvendored), `${name} filter vendors`).toEqual([]);
    }
  });

  it("Messages' filter only offers models that can return a row", () => {
    const used = new Set(REQUEST_ROWS_ALL.map((r) => r.model));
    const empty = REQUEST_MODEL_FILTERS.filter((o) => !used.has(o.value)).map(
      (o) => o.value
    );
    expect(empty).toEqual([]);
  });

  it("Activity's Top Models rows are catalog ids with catalog vendors", () => {
    const unknown = catalogIds(
      MODEL_ROWS.map((m) => m.key).filter((id) => !CATALOG.has(id))
    );
    expect(unknown).toEqual([]);
    const mismatched = MODEL_ROWS.filter(
      (m) => modelById(m.key)?.vendor !== m.vendor
    ).map((m) => m.key);
    expect(catalogIds(mismatched)).toEqual([]);
    // Every vendor charted here must have a brand mark to render.
    for (const m of MODEL_ROWS) {
      expect(VENDOR_META[m.vendor], `${m.vendor} has vendor meta`).toBeTruthy();
    }
  });

  it("Activity's model series are catalog ids labelled with catalog names", () => {
    // The chart's model dimension is one series per catalog model since
    // 2026-08-03. Before that it charted six authored labels, one of which
    // ("Others") was a bucket that happened to hold the 3rd-heaviest model in
    // the workspace — so this test could pass while the legend misranked it.
    const unknown = catalogIds(
      SERIES_POOL.model.filter((id) => !CATALOG.has(id))
    );
    expect(unknown).toEqual([]);

    // Labels are resolved through the catalog at rank time, never authored.
    const names = new Set(MODELS.map((m) => m.name));
    const { series } = rankSeries("model", TOKENS_TOTALS_7D.model);
    const mislabelled = series
      .filter((s) => s.key !== OTHERS_KEY)
      .map((s) => s.label)
      .filter((label) => !names.has(label));
    expect(mislabelled).toEqual([]);

    // The rollup is synthesised, so its label must not collide with a model.
    expect(names.has(OTHERS_LABEL)).toBe(false);
  });

  it("the Setup pricing table quotes catalog models", () => {
    expect(PAYG_PRICING_MODEL_IDS.length).toBeGreaterThan(0);
    const unknown = catalogIds(
      PAYG_PRICING_MODEL_IDS.filter((id) => !CATALOG.has(id))
    );
    expect(unknown).toEqual([]);
  });
});
