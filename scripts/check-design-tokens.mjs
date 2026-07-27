#!/usr/bin/env node
/**
 * Design-token guard — fails the build when code invents colors or literal
 * type sizes outside the design.md scale. Enforces the closed-set rule in
 * `.claude/rules/design-tokens.md`.
 *
 * Scope (intentionally narrow + low-false-positive):
 *  1. Arbitrary COLORS in any Tailwind utility — `*-[#…]`, `*-[rgb(…)]`,
 *     `*-[oklch(…)]`, `*-[hsl(…)]`. Colors are always tokens; no exceptions.
 *  2. Literal arbitrary FONT SIZES — `text-[12px]`, `text-[1.1rem]`, etc.
 *     Responsive `text-[clamp(…)]` / `calc` / `var` pass . A short
 *     allowlist covers pre-existing sub-12px micro-labels.
 *
 * Tracking / width / translate arbitrary values are NOT linted here — those
 * have legitimate documented uses (PageTitle `-tracking-[1px]`, container-query
 * layout clamps). The closed-set rule still governs them by discipline.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src";

const COLOR_RE =
  /\b(?:bg|text|border|ring|ring-offset|fill|stroke|from|to|via|shadow|outline|decoration|divide|accent|caret|placeholder)-\[\s*(?:#|rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color)\b/;
const FONT_RE = /\btext-\[\s*[\d.]+(?:px|rem|em)\s*\]/;

// [fileEndsWith, substring] pairs that predate the rule and stay (documented).
const FONT_ALLOW = [
  ["monogram.tsx", "text-[10px]"], // sm avatar initial — 10px micro-label
  ["DashboardDefault.tsx", "text-[10px]/[16px]"], // Gate Connect "Connected" pill
];

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...walk(p));
    } else if (/\.(tsx?|css)$/.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

// Accept explicit file paths (lint-staged passes staged filenames). With no
// arguments, fall back to a full `src` walk so `npm run lint:design` and CI
// keep scanning everything.
const argFiles = process.argv.slice(2).filter((f) => /\.(tsx?|css)$/.test(f));
const files = argFiles.length > 0 ? argFiles : walk(ROOT);

const violations = [];
for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    const colorM = line.match(COLOR_RE);
    if (colorM) {
      violations.push({ file, line: i + 1, kind: "color", text: colorM[0] });
    }
    const fontM = line.match(FONT_RE);
    if (
      fontM &&
      !FONT_ALLOW.some(([f, s]) => file.endsWith(f) && line.includes(s))
    ) {
      violations.push({ file, line: i + 1, kind: "font-size", text: fontM[0] });
    }
  });
}

if (violations.length > 0) {
  console.error(
    `\n✖ design-token guard: ${violations.length} arbitrary value(s) outside design.md.\n` +
      "  Colors and type sizes are a closed set — map to a token/voice in design.md,\n" +
      "  or add it to the scale first. See .claude/rules/design-tokens.md.\n"
  );
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.kind}]  ${v.text}`);
  }
  process.exit(1);
}

console.log("✓ design-token guard: no invented colors or type sizes.");
