#!/usr/bin/env node
// Duplicate checker: lists every value (number, number + unit, date) and
// every 5-word phrase that appears in more than one place on one rendered
// surface. Deterministic; LLM reviewers are weakest at exactly this.
//
//   node dup-check.mjs --url <page> --selector "<css>"   (needs Playwright)
//   node dup-check.mjs --text <file>                      (one segment per line)
//
// A "segment" is one visible block (a label, a value, a helper, a button,
// an input's value). Input values count: a disabled field showing 30 next
// to a "30 days" row is a repeat.
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const MONTH =
  "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
const VALUE_RE = new RegExp(
  `\\b${MONTH}\\s+\\d{1,2},?\\s+\\d{4}\\b|\\b\\d{4}-\\d{2}-\\d{2}\\b|\\b\\d[\\d,.]*\\s*(?:%|days?|hours?|minutes?|records?|seats?|keys?|members?|requests?|tokens?|gb|mb|usd)?\\b`,
  "gi"
);

export function valuesIn(segment) {
  const out = [];
  for (const m of String(segment).matchAll(VALUE_RE)) {
    const raw = m[0].trim();
    // The bare number is the identity: "90", "90 days" and "90-day" are one value.
    const num = raw.match(/^\d[\d,.]*/);
    const key = num
      ? num[0].replace(/[,.]$/, "")
      : raw.toLowerCase().replace(/,/g, "");
    if (num && /^[01]$/.test(key)) {
      continue; // 0 and 1 are too common to be signal
    }
    out.push({ key, raw });
  }
  return out;
}

function grams(segment, n = 5) {
  const w = String(segment)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const g = new Set();
  for (let i = 0; i + n <= w.length; i++) {
    g.add(w.slice(i, i + n).join(" "));
  }
  return g;
}

/** Returns { values: [{key, places[]}], phrases: [{phrase, places[]}] }. */
export function findRepeats(segments) {
  const segs = segments.map((s) => String(s).trim()).filter(Boolean);
  const byValue = new Map();
  segs.forEach((s, i) => {
    for (const v of valuesIn(s)) {
      const places = byValue.get(v.key) ?? new Set();
      places.add(i);
      byValue.set(v.key, places);
    }
  });
  const values = [...byValue]
    .filter(([, p]) => p.size > 1)
    .map(([key, p]) => ({ key, places: [...p].map((i) => segs[i]) }));
  const byGram = new Map();
  segs.forEach((s, i) => {
    for (const g of grams(s)) {
      const places = byGram.get(g) ?? new Set();
      places.add(i);
      byGram.set(g, places);
    }
  });
  const seenPairs = new Set();
  const phrases = [];
  for (const [g, p] of byGram) {
    if (p.size < 2) {
      continue;
    }
    const pair = [...p].join(",");
    if (seenPairs.has(pair)) {
      continue; // one report per repeated pair of places
    }
    seenPairs.add(pair);
    phrases.push({ phrase: g, places: [...p].map((i) => segs[i]) });
  }
  return { values, phrases };
}

async function segmentsFromUrl(url, selector) {
  const require = createRequire(path.join(process.cwd(), "noop.js"));
  let pw;
  try {
    pw = require("playwright");
  } catch {
    const alt = process.env.UX_DESIGNER_PLAYWRIGHT;
    if (!alt) {
      throw new Error(
        "Playwright not found from this project. Set UX_DESIGNER_PLAYWRIGHT to its index.mjs, or use --text."
      );
    }
    pw = await import(pathToFileURL(alt).href);
  }
  const browser = await pw.chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    await page.goto(url, { waitUntil: "networkidle" });
    const root = page.locator(selector).first();
    await root.waitFor({ timeout: 10_000 });
    return await root.evaluate((el) => {
      const out = [];
      const visible = (n) => {
        const s = getComputedStyle(n);
        return (
          s.display !== "none" &&
          s.visibility !== "hidden" &&
          n.getClientRects().length > 0
        );
      };
      // Split on layout, not tag names: a child laid out as a block, flex
      // or grid item starts its own segment; inline children stay in it.
      const blockish = (c) => !getComputedStyle(c).display.startsWith("inline");
      const isField = (c) => c.matches("input, textarea, select");
      const walk = (n) => {
        if (!(n instanceof HTMLElement && visible(n))) {
          return;
        }
        if (isField(n)) {
          const v = n.value || n.getAttribute("placeholder") || "";
          if (v) {
            out.push(`[${n.tagName.toLowerCase()}] ${v}`);
          }
          return;
        }
        const kids = [...n.children].filter(
          (c) => c instanceof HTMLElement && visible(c)
        );
        if (!kids.some((c) => blockish(c) || isField(c))) {
          const t = n.innerText.replace(/\s+/g, " ").trim();
          if (t) {
            out.push(t);
          }
          return;
        }
        // Mixed content: keep the element's own loose text as a segment.
        const own = [...n.childNodes]
          .filter((c) => c.nodeType === Node.TEXT_NODE)
          .map((c) => c.textContent.trim())
          .join(" ")
          .trim();
        if (own) {
          out.push(own);
        }
        for (const c of kids) {
          walk(c);
        }
      };
      walk(el);
      return out;
    });
  } finally {
    await browser.close();
  }
}

function report({ values, phrases }) {
  const lines = [];
  for (const v of values) {
    lines.push(`VALUE ${v.key} appears in ${v.places.length} places:`);
    for (const p of v.places) {
      lines.push(`  - ${p.slice(0, 140)}`);
    }
  }
  for (const p of phrases) {
    lines.push(`PHRASE "${p.phrase}" appears in ${p.places.length} places:`);
    for (const s of p.places) {
      lines.push(`  - ${s.slice(0, 140)}`);
    }
  }
  return lines.length
    ? `${lines.join("\n")}\n\nExplain each repeat in the spec's Values table as DIFFERENT values that happen to match (for example typed vs saved vs limit), or remove it. An error that states the fix is not a repeat.`
    : "No repeated values or phrases.";
}

async function main() {
  const args = process.argv.slice(2);
  const get = (k) => {
    const i = args.indexOf(k);
    return i >= 0 ? args[i + 1] : undefined;
  };
  let segments;
  if (get("--text")) {
    segments = fs.readFileSync(get("--text"), "utf8").split("\n");
  } else if (get("--url") && get("--selector")) {
    segments = await segmentsFromUrl(get("--url"), get("--selector"));
  } else {
    console.log(
      'Usage: dup-check.mjs --url <page> --selector "<css>" | --text <file>'
    );
    process.exit(1);
  }
  if (args.includes("--segments")) {
    console.log(segments.map((s, i) => `${i + 1}. ${s}`).join("\n"));
    console.log("");
  }
  console.log(report(findRepeats(segments)));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((e) => {
    console.log(`dup-check failed: ${e.message}`);
    process.exit(1);
  });
}
