import { describe, expect, it } from "vitest";
import { getConversationView } from "@/data/conversationDetail";
import { CONVERSATION_ROWS, SAMPLE_TRACE } from "@/data/conversations";
import { blendedRate, costOf, modelById } from "@/data/models";
import { isByokKey, REQUEST_ROWS_ALL } from "@/data/requests";
import {
  API_KEY_ROWS,
  KEY_MIX_7D,
  MODEL_ROWS,
  MODEL_SERIES_7D,
  PROVIDER_MIX_7D,
  SPEND_BASE,
  SPEND_SERIES,
  SPEND_TOTALS_7D,
  TOKENS_TOTALS_7D,
  TOTAL_7D_BASE_DOLLARS,
  TOTAL_7D_BASE_REQUESTS,
  TOTAL_7D_BASE_TOKENS,
  USAGE_7D,
} from "@/pages/activity-data";

/**
 * The pricing contract: no dollar figure in this app is authored.
 *
 * Every $ on every surface is `costOf(model, tokensIn, tokensOut)` or a sum of
 * those calls, where `costOf` reads the same catalog the Models page prints.
 * Divide any spend figure by the token counts sitting next to it and you get a
 * rate the Models page will confirm.
 *
 * This exists because none of that was true. On 2026-08-03, across 51 costed
 * request rows, the authored price ranged from 0.48× to 14.7× what the catalog
 * charges for the very tokens on the row — a DeepSeek V4 Pro call billed at
 * $0.0169 against a real $0.0012, sitting one column from the model name. The
 * Activity page was worse in aggregate: Qwen3 Next was billed at 13× list and
 * Gemini 3.1 Pro at 0.47×, and the file said in a comment not to try
 * reconciling it. The Conversations KPI rail hardcoded "$0.082" per
 * conversation when its own rows averaged $0.134.
 *
 * A failure here is not a rounding disagreement. It means a page is quoting a
 * price the gateway does not charge.
 */

const money = (s: string) => Number.parseFloat(s.replace(/[^0-9.]/g, "")) || 0;
const count = (s: string) => Number.parseInt(s.replace(/[^0-9]/g, ""), 10) || 0;
/** SAMPLE_TRACE abbreviates ("1.2k"); the request rows do not ("44,889"). */
const traceTokens = (s: string) => {
  const bare = s.replace(/,/g, "").trim();
  return bare.endsWith("k")
    ? Math.round(Number.parseFloat(bare) * 1000)
    : count(bare);
};
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const sumValues = (r: Record<string, number>) => sum(Object.values(r));

describe("request rows are priced from the catalog", () => {
  it("every costed row equals costOf(model, in, out) to the cent it shows", () => {
    const wrong: string[] = [];
    for (const row of REQUEST_ROWS_ALL) {
      if (row.cost.trim() === "—") {
        continue;
      }
      const expected = costOf(
        row.model,
        count(row.inTokens),
        count(row.outTokens)
      );
      // The column renders 4dp, so that is the precision the claim is made at.
      if (`$${expected.toFixed(4)}` !== row.cost) {
        wrong.push(
          `${row.model} ${row.inTokens}/${row.outTokens} shows ${row.cost}, costs $${expected.toFixed(4)}`
        );
      }
    }
    expect(wrong).toEqual([]);
  });

  it("prices at least the 41 rows the gateway metered", () => {
    const costed = REQUEST_ROWS_ALL.filter((r) => r.cost.trim() !== "—");
    expect(costed.length).toBe(41);
    // Guards the opposite failure to the one above: a codemod that blanked the
    // column would pass a per-row equality check vacuously.
    expect(costed.every((r) => money(r.cost) > 0)).toBe(true);
  });

  it("leaves BYOK rows unmetered rather than pricing them at zero", () => {
    // 102 of 153 rows are conversation cnv_7a3f9e2b on the BYOK `design-agent`
    // key. Gate saw the traffic; the customer's own provider billed it. "$0.0000"
    // would be a different and false claim.
    const byok = REQUEST_ROWS_ALL.filter(
      (r) => r.conversation === "cnv_7a3f9e2b"
    );
    expect(byok).toHaveLength(102);
    expect(byok.every((r) => r.cost.trim() === "—")).toBe(true);
  });

  it("means one thing by BYOK, on every surface", () => {
    // Three definitions had to agree and did not. `isByokKey` (which decides
    // whether the Messages table shows a cost or the BYOK badge) listed five
    // keys; ten rows on four of those keys still carried a dollar figure, and
    // `getConversationView` summed those dollars into the conversation's cost.
    // So the table said "billed by your provider" on a row whose money the
    // Conversations list was counting — $0.2565 of one 9-request conversation.
    for (const row of REQUEST_ROWS_ALL) {
      expect(row.cost.trim() === "—", `${row.keyId} row cost ${row.cost}`).toBe(
        isByokKey(row.keyId)
      );
    }
    // And the set itself must mirror API_KEY_ROWS, which is what its own
    // comment in data/requests.ts has always claimed.
    const chartedByok = API_KEY_ROWS.filter((k) => k.path === "BYOK").map(
      (k) => k.key
    );
    expect(chartedByok.every((k) => isByokKey(k))).toBe(true);
    expect(
      API_KEY_ROWS.filter((k) => k.path === "Gate").every(
        (k) => !isByokKey(k.key)
      )
    ).toBe(true);
  });

  it("prices every sample trace step from the catalog too", () => {
    // SAMPLE_TRACE is exported reference data rather than a render path, which
    // is exactly how it kept a Sonnet 5 step priced at $0.0142 against a real
    // $0.0042. Stale money in an exported constant is still wrong money.
    for (const step of SAMPLE_TRACE) {
      const expected = costOf(
        step.model,
        traceTokens(step.inTokens),
        traceTokens(step.outTokens)
      );
      expect(
        step.cost,
        `${step.model} ${step.inTokens}/${step.outTokens}`
      ).toBe(`$${expected.toFixed(4)}`);
    }
  });
});

describe("conversation seeds match what their own rows cost", () => {
  it("every seed equals its derived view on volume and money", () => {
    for (const seed of CONVERSATION_ROWS) {
      const view = getConversationView(seed, REQUEST_ROWS_ALL);
      const label = seed.conversationId;
      // Overview's preview table reads the raw seed while the list renders the
      // view. They drifted on 7 of 8 rows — cnv_orion_70 claimed 38 requests
      // over 9 real ones — so the same conversation showed two different costs
      // depending on which page you opened.
      expect(
        {
          reqs: seed.reqs,
          turns: seed.turns,
          inTokens: seed.inTokens,
          outTokens: seed.outTokens,
          cost: seed.cost,
        },
        `${label} seed vs derivation`
      ).toEqual({
        reqs: view.reqs,
        turns: view.turns,
        inTokens: view.inTokens,
        outTokens: view.outTokens,
        cost: view.cost,
      });
    }
  });

  it("a conversation costs exactly what its metered rows cost", () => {
    for (const seed of CONVERSATION_ROWS) {
      const view = getConversationView(seed, REQUEST_ROWS_ALL);
      if (view.cost.trim() === "—") {
        continue;
      }
      // Metered rows only. A conversation can span a Gate key and a BYOK key;
      // only the Gate half is money Gate charged, and the BYOK half must not
      // silently join the total the way it used to.
      const rows = REQUEST_ROWS_ALL.filter(
        (r) => r.conversation === seed.conversationId && !isByokKey(r.keyId)
      );
      const expected = sum(
        rows.map((r) => costOf(r.model, count(r.inTokens), count(r.outTokens)))
      );
      expect(money(view.cost), seed.conversationId).toBeCloseTo(expected, 3);
    }
  });
});

describe("the Activity workload prices itself from the catalog", () => {
  it("routes traffic only where the catalog says the model is served", () => {
    const illegal: string[] = [];
    for (const cell of USAGE_7D) {
      const model = modelById(cell.model);
      if (!model?.providers.some((p) => p.id === cell.provider)) {
        illegal.push(`${cell.model} routed to ${cell.provider}`);
      }
    }
    expect([...new Set(illegal)]).toEqual([]);
  });

  it("splits each model's traffic completely — shares sum to 1", () => {
    for (const [model, mix] of Object.entries(PROVIDER_MIX_7D)) {
      expect(
        sum(Object.values(mix) as number[]),
        `${model} provider`
      ).toBeCloseTo(1, 6);
    }
    for (const [model, mix] of Object.entries(KEY_MIX_7D)) {
      expect(sum(Object.values(mix)), `${model} key`).toBeCloseTo(1, 6);
    }
  });

  it("costs every cell at list price × the route's own markup", () => {
    for (const cell of USAGE_7D) {
      const model = modelById(cell.model);
      const markup =
        model?.providers.find((p) => p.id === cell.provider)?.paygMarkup ?? 1;
      const expected =
        costOf(cell.model, cell.tokensIn, cell.tokensOut) * markup;
      expect(cell.spend, `${cell.model} via ${cell.provider}`).toBeCloseTo(
        expected,
        9
      );
    }
  });

  it("charges every dimension the same total, because they group one workload", () => {
    for (const [dimension, totals] of Object.entries(SPEND_TOTALS_7D)) {
      expect(sumValues(totals), `${dimension} spend`).toBeCloseTo(
        TOTAL_7D_BASE_DOLLARS,
        2
      );
    }
    for (const [dimension, totals] of Object.entries(TOKENS_TOTALS_7D)) {
      expect(sumValues(totals), `${dimension} tokens`).toBe(
        TOTAL_7D_BASE_TOKENS
      );
    }
  });

  it("charts exactly the series the workload defines", () => {
    expect(Object.keys(MODEL_SERIES_7D).sort()).toEqual(
      SPEND_SERIES.model.map((s) => s.key).sort()
    );
    for (const dimension of ["model", "provider", "apiKey"] as const) {
      expect(Object.keys(SPEND_TOTALS_7D[dimension]).sort()).toEqual(
        SPEND_SERIES[dimension].map((s) => s.key).sort()
      );
    }
  });

  it("keeps every series' blended rate inside the catalog's own range", () => {
    // The cheapest thing the fleet can do is all-input Qwen3 Next; the dearest
    // is all-output Opus 4.7. A series outside that band is arithmetically
    // impossible, whatever its model mix.
    const floor = blendedRate("qwen/qwen3-next-80b-a3b-instruct", 0);
    const ceiling = blendedRate("anthropic/claude-opus-4-7", 1) * 1.1;
    for (const dimension of ["model", "provider", "apiKey"] as const) {
      for (const [key, spend] of Object.entries(SPEND_TOTALS_7D[dimension])) {
        const tokens = TOKENS_TOTALS_7D[dimension][key] ?? 0;
        const rate = (spend / tokens) * 1_000_000;
        expect(
          rate,
          `${dimension}/${key} $${rate.toFixed(3)}/1M`
        ).toBeGreaterThan(floor);
        expect(rate, `${dimension}/${key} $${rate.toFixed(3)}/1M`).toBeLessThan(
          ceiling
        );
      }
    }
  });

  it("bills the same on every day of the week in every dimension", () => {
    const days = SPEND_BASE.model.map((row) => +sumValues(row).toFixed(2));
    for (const dimension of ["provider", "apiKey"] as const) {
      SPEND_BASE[dimension].forEach((row, i) => {
        expect(+sumValues(row).toFixed(2), `${dimension} day ${i}`).toBeCloseTo(
          days[i]!,
          2
        );
      });
    }
  });
});

describe("the Activity tables show the price of the tokens beside them", () => {
  it("prices each Top Models row at its own blended catalog rate", () => {
    for (const row of MODEL_ROWS) {
      const tokens = row.tokensIn + row.tokensOut;
      const list = blendedRate(row.key, row.tokensOut / tokens);
      const actual = (row.spend / tokens) * 1_000_000;
      // Between list and list + 10%: the spread is OpenRouter's PAYG markup on
      // whatever share of this model's traffic it routed, and nothing else.
      expect(actual, `${row.key} rate`).toBeGreaterThanOrEqual(list - 1e-6);
      expect(actual, `${row.key} rate`).toBeLessThanOrEqual(list * 1.1 + 1e-6);
    }
  });

  it("sums Top Models to the KPI rail above it", () => {
    expect(sum(MODEL_ROWS.map((m) => m.spend))).toBeCloseTo(
      TOTAL_7D_BASE_DOLLARS,
      2
    );
    expect(sum(MODEL_ROWS.map((m) => m.tokensIn + m.tokensOut))).toBe(
      TOTAL_7D_BASE_TOKENS
    );
    expect(sum(MODEL_ROWS.map((m) => m.requests))).toBe(TOTAL_7D_BASE_REQUESTS);
  });

  it("gives each key the spend its own chart series carries", () => {
    for (const [key, charted] of Object.entries(SPEND_TOTALS_7D.apiKey)) {
      const row = API_KEY_ROWS.find((k) => k.key === key);
      expect(row?.spend, `key: ${key}`).toBeCloseTo(charted, 2);
      expect(row?.path, `key: ${key}`).toBe("Gate");
    }
  });

  it("bills BYOK keys nothing, and charts none of them", () => {
    const charted = new Set(SPEND_SERIES.apiKey.map((s) => s.key));
    for (const row of API_KEY_ROWS.filter((k) => k.path === "BYOK")) {
      expect(row.spend, `${row.key} spend`).toBe(0);
      expect(charted.has(row.key), `${row.key} charted`).toBe(false);
    }
    // `design-agent` is the one this caught: charted at $21.00 while every one
    // of its request rows is unmetered.
    expect(API_KEY_ROWS.find((k) => k.key === "design-agent")?.path).toBe(
      "BYOK"
    );
  });

  it("sums the Gate keys to the same workspace as every other surface", () => {
    const gate = API_KEY_ROWS.filter((k) => k.path === "Gate");
    expect(sum(gate.map((k) => k.spend))).toBeCloseTo(TOTAL_7D_BASE_DOLLARS, 2);
    expect(sum(gate.map((k) => k.tokensIn + k.tokensOut))).toBe(
      TOTAL_7D_BASE_TOKENS
    );
    expect(sum(gate.map((k) => k.requests))).toBe(TOTAL_7D_BASE_REQUESTS);
  });
});
