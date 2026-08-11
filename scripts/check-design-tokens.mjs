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
 *  3. COPY VOICE ON A LABEL — a `type-copy-*` utility in the className of a
 *     role design.md §3 enumerates under Body/label ("Card titles, page
 *     subtitles, button labels, key/project names, table column headers,
 *     form/input labels") or under its Label enumeration: `<button>`/
 *     `<Button>`, nav items, `TabsTrigger`, menu items, select / combobox /
 *     dialog / popover / menu triggers, `TextLink` link-buttons, clickable
 *     card affordances, pagination controls, `<dt>`, `Label`, `CardTitle`,
 *     `TableHead` / `SortableTableHead` — or on a `<span>` nested inside one.
 *     `type-copy-*` is font-normal body text; a label must carry
 *     `type-label-*` (font-medium). This is the check that would have caught
 *     the sidebar nav regression, where a body voice on an inner span
 *     silently overrode the button's own font-medium.
 *
 *     DELIBERATELY CONSERVATIVE: fires when the voice sits in the SAME
 *     className as the owning tag, or on a span whose nearest enclosing open
 *     tag is label-role. The span walk stops at the FIRST closing tag it
 *     meets — a sibling having ended means we are no longer inside a label,
 *     so it declines to guess. Descriptions, `<p>`, table cells, inputs and
 *     typed VALUES are never flagged — a false positive that blocks a commit
 *     is worse than a miss. See `.claude/rules/no-handrolling.md`.
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

// --- 2b. off-scale numeric type size in JS ------------------------------
// `FONT_RE` only sees Tailwind classes. A type size passed as a JS value —
// `fontSize: 11` in a recharts tick object, `fontSize={11}` on an SVG <text> —
// is invisible to it, which is exactly how an 11px chart tick shipped and
// survived review: a 1px deviation is not detectable by eye, so a human is
// not a viable backstop. The scale is closed; enforce it wherever it is
// expressed.
//
// Sanctioned sizes mirror design.md §Type scale (the `type-*` voice table).
const TYPE_SCALE = new Set([
  10, 12, 14, 16, 18, 20, 24, 32, 40, 48, 56, 64, 72,
]);
// `fontSize: 11`, `fontSize={11}`, `fontSize: "11px"`, `font-size: 11px`.
// Unitless, px, and quoted forms; rem/em are left alone (they are relative and
// resolve against a root the scale already governs).
const JS_FONT_SIZE_RE =
  /\bfont-?[Ss]ize\s*[:=]\s*\{?\s*["']?\s*(\d+(?:\.\d+)?)\s*(?:px)?\s*["']?\s*\}?/;

// --- 3. copy voice on a label -------------------------------------------
const VOICE_RE = /\btype-copy-(\d+)\b/;
// Elements whose text IS a label. `a` is intentionally absent: an inline
// body-text link legitimately carries the copy voice mid-sentence.
// Mirrors design.md §3 "Label voice — the enumeration" (ruled 2026-07-28),
// which is the single source. Everything the user can click, plus everything
// that names something.
//
// DELIBERATELY ABSENT, per that same enumeration's exclusion table:
//   `a`             — an inline text link mid-sentence is prose, and stays Copy.
//                     `Link`/`TextLink` ARE covered; the <p> exemption below
//                     is what keeps their inline uses out.
//                     Standalone link-buttons use `TextLink`, which IS covered.
//   Segmented*      — segmented control labels are the EYEBROW voice, not Label.
//   input/Input     — a typed value is Copy, not a label on the field.
//   SectionTitle    — a heading; a copy voice on it is wrong, but the fix is
//                     type-heading-*, so flagging it as a Label would mislead.
const LABEL_TAGS =
  "button|Button|SelectTrigger|PopoverTrigger|DialogTrigger|AlertDialogTrigger|DropdownMenuTrigger|MenuTrigger|TabsTrigger|SelectItem|MenuItem|DropdownMenuItem|CommandItem|TextLink|Label|CardTitle|TableHead|SortableTableHead|RowActionButton|Link|dt";
const LABEL_OPEN_RE = new RegExp(`<(?:${LABEL_TAGS})(?=[\\s/>]|$)`);
const SPAN_OPEN_RE = /<span(?=[\s/>]|$)/;

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
    const voiceM = line.match(VOICE_RE);
    if (voiceM) {
      // Owner = the tag whose attribute block contains this className.
      // Same line first; otherwise the nearest preceding un-terminated tag.
      let owner = null;
      let ownerLine = i;
      const head = line.slice(0, voiceM.index);
      const sameLine = [...head.matchAll(/<([A-Za-z][\w.]*)(?=[\s/>])/g)].pop();
      if (sameLine) {
        owner = sameLine[1];
      } else {
        for (let j = i - 1; j >= 0 && j > i - 8; j--) {
          const m = lines[j].match(/<([A-Za-z][\w.]*)\s*$/);
          if (m) {
            owner = m[1];
            ownerLine = j;
            break;
          }
          if (/>\s*$/.test(lines[j])) {
            break;
          }
        }
      }
      let flagged = owner ? LABEL_OPEN_RE.test(`<${owner} `) : false;
      // …or a <span> whose immediately-preceding open tag is label-role.
      if (!flagged && owner === "span") {
        // Start ABOVE the span's own open tag — otherwise a multi-line
        // `<span\n  className=…>` matches itself and the walk stops instantly.
        for (let j = ownerLine - 1; j >= 0 && j > ownerLine - 30; j--) {
          // Any closing tag means a sibling ended here — we are no longer
          // looking at our own parent, so stop rather than guess. A voice-less
          // wrapper `<span className="flex flex-col">` is passed through: it
          // is layout, not a scope of its own.
          if (/<\//.test(lines[j])) {
            break;
          }
          if (SPAN_OPEN_RE.test(lines[j]) && VOICE_RE.test(lines[j])) {
            break;
          }
          if (LABEL_OPEN_RE.test(lines[j])) {
            flagged = true;
            break;
          }
        }
      }
      /* Inline-prose exemption. design.md §3 excludes "inline text links
         mid-sentence" — those are prose that happens to be clickable and keep
         the Copy voice. `TextLink` and `<button>` serve BOTH that role and the
         standalone link-button role, so the tag alone cannot tell them apart:
         the distinguishing fact is whether the control sits inside a <p>.
         Walk back for an unclosed <p>; stop at any closing tag. */
      if (flagged) {
        for (let j = i - 1; j >= 0 && j > i - 12; j--) {
          if (/<\/(?!span)/.test(lines[j])) {
            break;
          }
          if (/<p(?=[\s/>]|$)/.test(lines[j])) {
            flagged = false;
            break;
          }
        }
      }

      if (flagged) {
        violations.push({
          file,
          line: i + 1,
          kind: "voice",
          text: `${voiceM[0]} on <${owner}> — a label takes type-label-${voiceM[1]} (font-medium), not the copy voice`,
        });
      }
    }

    const fontM = line.match(FONT_RE);
    if (
      fontM &&
      !FONT_ALLOW.some(([f, s]) => file.endsWith(f) && line.includes(s))
    ) {
      violations.push({ file, line: i + 1, kind: "font-size", text: fontM[0] });
    }

    const jsFontM = line.match(JS_FONT_SIZE_RE);
    if (jsFontM && !TYPE_SCALE.has(Number(jsFontM[1]))) {
      violations.push({
        file,
        line: i + 1,
        kind: "font-size",
        text: `${jsFontM[0].trim()} — ${jsFontM[1]} is off-scale; use ${[...TYPE_SCALE].join(" / ")}`,
      });
    }
  });
}

if (violations.length > 0) {
  console.error(
    `\n✖ design-token guard: ${violations.length} violation(s) outside design.md.\n` +
      "  Colors and type sizes are a closed set — map to a token/voice in design.md,\n" +
      "  or add it to the scale first. See .claude/rules/design-tokens.md.\n" +
      "  Voices: buttons/labels use type-label-*, body copy uses type-copy-*,\n" +
      "  headings use type-heading-*. See .claude/rules/no-handrolling.md.\n"
  );
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.kind}]  ${v.text}`);
  }
  process.exit(1);
}

console.log(
  "✓ design-token guard: no invented colors or type sizes, no copy voice on a label."
);
