import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import { SummaryCard } from "@/pages/token-savings/SummaryCard";
import {
  passesForPlan,
  SUMMARY_COPY,
  type SummaryModel,
  summaryFor,
} from "@/pages/token-savings-summary";

const ON = { compressionOn: true, cachingOn: true, plan: "pro" as const };

const html = (model: SummaryModel, loading = false) =>
  renderToString(<SummaryCard loading={loading} model={model} />);

/** Rendered text with the markup and HTML entities taken back out, so an
 *  assertion can quote SUMMARY_COPY verbatim (apostrophes and all). */
const plain = (markup: string) =>
  markup
    .replace(/<[^>]*>/g, "")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");

const meters = (markup: string) => (markup.match(/role="meter"/g) ?? []).length;

const ALL_CASES: Record<string, string> = {
  "pro all": html(summaryFor("all", null, ON)),
  "pro 7d": html(summaryFor("7d", null, ON)),
  "free all": html(summaryFor("all", null, { ...ON, plan: "free" })),
  "compression off": html(
    summaryFor("all", null, { ...ON, compressionOn: false })
  ),
  "caching off": html(summaryFor("all", null, { ...ON, cachingOn: false })),
  "both off": html(
    summaryFor("all", null, { ...ON, compressionOn: false, cachingOn: false })
  ),
  "no traffic": html(summaryFor("all", null, { ...ON, hasTraffic: false })),
  loading: html(summaryFor("all", null, ON), true),
};

test("Pro · All: title, subtitle, lede figures, both denominators, exclusion", () => {
  const model = summaryFor("all", null, ON);
  const markup = ALL_CASES["pro all"];
  const text = plain(markup);
  expect(text).toContain(SUMMARY_COPY.title);
  expect(text).toContain(SUMMARY_COPY.subtitle);
  expect(text).toContain(SUMMARY_COPY.lede(model));
  expect(text).toContain(SUMMARY_COPY.removed.label);
  expect(text).toContain(SUMMARY_COPY.cached.label);
  expect(text).toContain(SUMMARY_COPY.removed.denominator(model));
  expect(text).toContain(SUMMARY_COPY.cached.denominator(model));
  expect(text).toContain(SUMMARY_COPY.exclusion.lead);
  expect(text).toContain(SUMMARY_COPY.exclusion.body);
});

const mechanism = (model: SummaryModel, id: "compression" | "cache") => {
  const found = model.mechanisms.find((m) => m.id === id);
  if (!found) {
    throw new Error(`${id} row missing`);
  }
  return found;
};

test("Pro · All: two-level breakdown with Partial badge, its note, ten ranked meters", () => {
  const model = summaryFor("all", null, ON);
  const markup = ALL_CASES["pro all"];
  const text = plain(markup);
  expect(text).toContain(SUMMARY_COPY.breakdown.title);
  expect(text).toContain(SUMMARY_COPY.breakdown.basis);
  expect(model.partial).toBe(true);
  expect(text).toContain(SUMMARY_COPY.breakdown.partial);
  const compression = mechanism(model, "compression");
  const bars = [...model.mechanisms, ...compression.passes];
  expect(bars).toHaveLength(10);
  for (const bar of bars) {
    expect(text).toContain(bar.label);
    expect(text).toContain(bar.shareLabel);
    expect(markup).toContain(SUMMARY_COPY.breakdown.barAlt(bar));
  }
  expect(meters(markup)).toBe(10);
});

test("Pro · 7d: complete attribution, so no Partial badge and no partial note", () => {
  const model = summaryFor("7d", null, ON);
  const text = plain(ALL_CASES["pro 7d"]);
  expect(model.partial).toBe(false);
  expect(text).not.toContain(SUMMARY_COPY.breakdown.partial);
  expect(text).toContain(SUMMARY_COPY.exclusion.body);
});

test("Free · All: the four Basic mechanisms render, the four Pro-only ones do not", () => {
  const text = plain(ALL_CASES["free all"]);
  const free = passesForPlan("free").map((p) => p.label);
  const proOnly = passesForPlan("pro")
    .filter((p) => p.tier === "pro")
    .map((p) => p.label);
  expect(free).toHaveLength(4);
  for (const label of free) {
    expect(text).toContain(label);
  }
  for (const label of proOnly) {
    expect(text).not.toContain(label);
  }
  expect(meters(ALL_CASES["free all"])).toBe(6);
});

test("Compression off: OFF badge and the named reason, no compression bar, cache takes the whole", () => {
  const model = summaryFor("all", null, { ...ON, compressionOn: false });
  const markup = ALL_CASES["compression off"];
  const text = plain(markup);
  expect(text).toContain("OFF");
  expect(text).toContain(SUMMARY_COPY.removed.off);
  expect(text).toContain(SUMMARY_COPY.breakdown.compressionOff);
  expect(meters(markup)).toBe(1);
  expect(markup).not.toContain(
    SUMMARY_COPY.breakdown.barAlt(mechanism(model, "compression"))
  );
  expect(text).toContain("100.0%");
});

test("Caching off: OFF badge and the named reason; compression and its eight rows stay", () => {
  const model = summaryFor("all", null, { ...ON, cachingOn: false });
  const markup = ALL_CASES["caching off"];
  const text = plain(markup);
  expect(text).toContain("OFF");
  expect(text).toContain(SUMMARY_COPY.cached.off);
  expect(text).toContain(SUMMARY_COPY.breakdown.cachingOff);
  expect(meters(markup)).toBe(9);
  expect(markup).not.toContain(
    SUMMARY_COPY.breakdown.barAlt(mechanism(model, "cache"))
  );
});

test("Both off: one sentence replaces the rows, no bars, no Partial", () => {
  const markup = ALL_CASES["both off"];
  const text = plain(markup);
  expect(text).toContain(SUMMARY_COPY.breakdown.bothOff);
  expect(markup).not.toContain('role="meter"');
});

test("No traffic: header and explanation only — no figures, no bars, no exclusion", () => {
  const model = summaryFor("all", null, { ...ON, hasTraffic: false });
  const markup = ALL_CASES["no traffic"];
  const text = plain(markup);
  expect(model.noTraffic).toBe(true);
  expect(text).toContain(SUMMARY_COPY.noTraffic.title);
  expect(text).toContain(SUMMARY_COPY.noTraffic.body);
  expect(text).toContain(SUMMARY_COPY.title);
  expect(text).not.toContain("%");
  expect(markup).not.toContain('role="meter"');
  expect(text).not.toContain(SUMMARY_COPY.exclusion.body);
});

test("Loading: chrome stays, values skeleton, aria-busy, no meters", () => {
  const markup = ALL_CASES.loading;
  const text = plain(markup);
  expect(markup).toContain('aria-busy="true"');
  expect(markup).not.toContain('role="meter"');
  expect(text).toContain(SUMMARY_COPY.title);
  expect(text).toContain(SUMMARY_COPY.breakdown.title);
  expect(text).toContain(SUMMARY_COPY.exclusion.body);
  expect(text).not.toContain(SUMMARY_COPY.noTraffic.title);
});

test("No dollar amounts in any state", () => {
  for (const markup of Object.values(ALL_CASES)) {
    expect(plain(markup)).not.toContain("$");
  }
});
