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
 *  4. RAW TYPE UTILITY WITH NO VOICE — a bare `font-medium` / `font-semibold`
 *     / `font-bold` or `text-xs` … `text-2xl` on a line in `src/pages` or
 *     `src/layouts` that carries no `type-*` voice. design.md §3 routes every
 *     page-level text through a named voice (`type-heading-*`, `type-copy-*`,
 *     `type-label-*`, `type-mono-*`, `type-eyebrow-*`); a raw weight or size is
 *     the pre-voice idiom and drifts from the ladder silently (added
 *     2026-09-17 after an audit found 38 survivors across 14 pages).
 *     Primitives under `src/components` are exempt: their recipes ARE the
 *     voices. Waiver: a `design-allow-raw-type` comment with a reason within
 *     the 5 lines above.
 *
 *  5. RAW COLOR LITERAL — a hex (`#abc`, `#aabbcc`, `#aabbccdd`), `rgb()`,
 *     `rgba()`, `hsl()`, `oklch()` or `oklab()` on a non-comment line
 *     anywhere in `src` except `src/index.css` (the palette) and
 *     `src/components/icons/brand-colors.ts` (the ONE registry of external
 *     brand hexes, design.md §2 "Vendor brand colors"). `src/data` is skipped:
 *     it holds captured transcripts, not UI. Waiver: `design-allow-raw-color`
 *     within the 5 lines above (chart.tsx uses it for Recharts attribute
 *     selectors, which match a stroke value rather than paint one). Added
 *     2026-09-18 after color-audit.md found the arbitrary-class check (1)
 *     could not see a bare string hex or an inline `rgba(` gradient.
 *
 *  6. RAW PALETTE ATOM WITH A SEMANTIC TWIN — the "Do NOT write" column of
 *     design.md §2 "Semantic token quick-reference" plus the families added
 *     2026-09-18: `bg-white`, `bg-neutral-100`, `border-neutral-200`,
 *     `ring-neutral-N`, `text-neutral-900`, `text-neutral-500`,
 *     `bg-neutral-900/N` (scrim: `bg-overlay`). Non-comment lines in
 *     `src/pages`, `src/layouts`, `src/components`. Same waiver as 5.
 *
 *  7. CHART TOOLTIP OUTSIDE THE PORTAL RECIPE — design.md §"Chart tooltip &
 *     legend", Positioning (2026-09-21). Every chart tooltip renders through
 *     `ChartTooltip` in `components/ui/chart.tsx`, which portals to
 *     `document.body` and positions itself. Flagged anywhere in `src` except
 *     that file: a `recharts` import naming `Tooltip`, or the props
 *     `position=`, `wrapperStyle=`, `allowEscapeViewBox` on a tooltip line.
 *     Those were the pre-portal workarounds; a Card is `overflow-hidden`, so
 *     a tooltip drawn inside the chart container clips the moment it is
 *     taller than the chart band. No waiver: the recipe is the only shape.
 *
 *  8. SCROLLPORT WITH NO FOCUS-RING GUTTER, design.md §"Focus ring",
 *     Clipping (2026-09-22). Setting `overflow-y` (or `-x`) to anything but
 *     `visible` computes the OTHER axis to `auto` as well (CSS Overflow 3 §3),
 *     so a box that only meant to scroll vertically clips horizontally too.
 *     The site ring is `ring-2` + `ring-offset-2` = 4px outside the control's
 *     border box, so a full-width control flush inside a scrollport loses all
 *     4px on both edges, permanently: there is no horizontal scroll to
 *     recover it. Every scrolling container therefore reserves >= 4px of
 *     inline padding (`px-1` / `p-1` or larger, or `pl-*` + `pr-*`).
 *     Waiver: `design-allow-clip` with a reason within the 5 lines above,
 *     for a scrollport whose children are all inset-ringed, or which holds no
 *     focusable content at all. This is the check that would have caught the
 *     ManageSubscription contact dialog, whose body was a bare
 *     `min-h-0 overflow-y-auto overscroll-contain`.
 *
 *     WHAT IT CANNOT SEE: whether the container actually holds a focusable
 *     descendant (the contact dialog's fields arrive through a `<ContactBody/>`
 *     component, invisible to a text scan), the BLOCK axis (a scrollport
 *     parks a tabbed-to control flush against its top or bottom edge whatever
 *     its padding; that wants `scroll-py-1`, which only real geometry can
 *     confirm), and `overflow-hidden` clip-only boxes (47 of them are
 *     progress-bar tracks, corner-rounders and layout columns; a static rule
 *     there is ~90% waivers, which is a rule nobody reads). Those three are
 *     `npm run lint:clipping`'s job: it drives the real DOM.
 *
 *  9. FLOATING LAYER NOT PORTALLED, design.md §"Focus ring", Clipping.
 *     A popup that renders inside its trigger's DOM position is clipped by
 *     every `overflow-hidden` Card and every scrollport between them. Every
 *     floating primitive in `src/components/ui` (tooltip, popover, menu,
 *     select, notifications menu) wraps its `*.Positioner` in a `*.Portal`
 *     so the layer escapes to the body. Flagged: a file under
 *     `src/components/ui` that renders a `Positioner` with no `Portal`
 *     anywhere in it. Same waiver marker as 8.
 *
 * Tracking / width / translate arbitrary values are NOT linted here — those
 * have legitimate documented uses (PageTitle `-tracking-[1px]`, container-query
 * layout clamps). The closed-set rule still governs them by discipline.
 */
import { readdirSync, readFileSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";

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
  10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64, 72,
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

// --- 4. raw type utility with no voice ----------------------------------
const RAW_TYPE_RE =
  /(?:^|[\s"'`])(?:font-(?:medium|semibold|bold)|text-(?:xs|sm|base|lg|xl|2xl))(?=[\s"'`\]/]|$)/;
const ANY_VOICE_RE =
  /\btype-(?:heading|copy|label|mono|eyebrow|input|display)-/;
const RAW_TYPE_SCOPE = /^src\/(?:pages|layouts)\//;

// --- 5. raw color literal -------------------------------------------------
// 3/4/6/8 hex digits followed by a non-alphanumeric, so "order #12345" in
// copy does not match. rgb/hsl/oklch/oklab in any casing.
const RAW_COLOR_RE =
  /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z])|\b(?:rgba?|hsla?|oklch|oklab)\(/;
const RAW_COLOR_SKIP =
  /^src\/(?:index\.css$|data\/|components\/icons\/brand-colors\.ts$)/;

// --- 6. raw palette atom with a semantic twin ----------------------------
const RAW_PALETTE_RE =
  /(?:^|[\s"'`:])(?:bg-white|bg-neutral-100|border-neutral-200|ring-neutral-\d+|text-neutral-900|text-neutral-500|bg-neutral-900\/\d+)(?=[\s"'`\]/]|$)/;
const RAW_PALETTE_SCOPE = /^src\/(?:pages|layouts|components)\//;
const RAW_PALETTE_HINT = {
  "bg-white": "bg-card / bg-background / bg-popover",
  "bg-neutral-100": "bg-muted / bg-secondary / bg-accent",
  "border-neutral-200": "border-border",
  "text-neutral-900": "text-foreground",
  "text-neutral-500": "text-muted-foreground",
};

// --- 7. chart tooltip outside the portal recipe --------------------------
// chart.tsx owns the recipe; src/test asserts it and quotes the banned props.
const CHART_TOOLTIP_OWNER = /^src\/(?:components\/ui\/chart\.tsx$|test\/)/;
const RECHARTS_TOOLTIP_IMPORT_RE =
  /import\s*\{[^}]*\bTooltip\b[^}]*\}\s*from\s*["']recharts["']/;
const CHART_TOOLTIP_PROP_RE =
  /\b(?:position=\{|wrapperStyle=|allowEscapeViewBox)/;

// --- 8. scrollport with no focus-ring gutter -----------------------------
// A SCROLLING overflow only. `overflow-hidden` / `overflow-clip` are left to
// `npm run lint:clipping` (see the header note): a static rule over those is
// almost all waiver.
const SCROLLPORT_RE =
  /(?:^|[\s"'`:])(?:@?[a-z0-9-]+:)*overflow-(?:x-|y-)?(?:auto|scroll)(?=[\s"'`\]/]|$)/;
/* `src/test` is exempt for the same reason `CHART_TOOLTIP_OWNER` exempts it:
   the invariant suite quotes the class strings it bans, and a test renders
   nothing a user can see. */
const SCROLLPORT_SKIP = /^src\/test\//;
// >= 4px on the inline axis: `p-1`+, `px-1`+, or `pl-1`+ AND `pr-1`+.
// Variant prefixes (`sm:`, `lg:`, `group-hover:`) are allowed through: a
// gutter that exists only at one breakpoint still beats none, and the browser
// check is what proves the rest.
const inlinePad = (s) => {
  const has = (axis) =>
    new RegExp(
      `(?:^|[\\s"'\`:])(?:@?[a-z0-9-]+:)*${axis}-(\\d+)(?=[\\s"'\`\\]/]|$)`
    ).exec(s);
  const all = has("p");
  if (all && Number(all[1]) >= 1) {
    return true;
  }
  const x = has("px");
  if (x && Number(x[1]) >= 1) {
    return true;
  }
  const l = has("pl") ?? has("ps");
  const r = has("pr") ?? has("pe");
  return Boolean(l && r && Number(l[1]) >= 1 && Number(r[1]) >= 1);
};

// --- 9. floating layer not portalled -------------------------------------
const FLOATING_SCOPE = /^src\/components\/ui\//;
const POSITIONER_RE = /<[A-Z][\w.]*\.Positioner\b/;
const PORTAL_RE = /<[A-Z][\w.]*\.Portal\b/;

// A line that is only a comment never paints anything.
const COMMENT_LINE_RE = /^\s*(?:\/\/|\*|\/\*|\{\/\*)/;

/* Lines that sit INSIDE a `/* … *\/` block, including the continuation lines
   that carry no leading `*`. `COMMENT_LINE_RE` cannot see those, and the
   header blocks in this codebase quote class strings in prose (`Override the
   body's default \`overflow-y-auto\``), which check 8 would otherwise read as
   markup. Deliberately naive about `/*` inside a string literal: a false
   "this is a comment" only ever suppresses a check, never invents one. */
function blockCommentLines(lines) {
  const inBlock = new Array(lines.length).fill(false);
  let open = false;
  lines.forEach((line, i) => {
    if (open) {
      inBlock[i] = true;
    }
    let idx = 0;
    while (idx < line.length) {
      if (!open && line.startsWith("/*", idx)) {
        open = true;
        inBlock[i] = true;
        idx += 2;
      } else if (open && line.startsWith("*/", idx)) {
        open = false;
        idx += 2;
      } else {
        idx += 1;
      }
    }
  });
  return inBlock;
}

function waivedAbove(lines, i, marker) {
  for (let j = i - 1; j >= 0 && j > i - 6; j--) {
    if (lines[j].includes(marker)) {
      return true;
    }
  }
  return false;
}

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
for (const rawFile of files) {
  // lint-staged passes ABSOLUTE paths; every scope regex below is written
  // against the repo-relative form (`src/...`), so normalise first.
  const file = isAbsolute(rawFile) ? relative(process.cwd(), rawFile) : rawFile;
  const lines = readFileSync(rawFile, "utf8").split("\n");
  const inBlockComment = blockCommentLines(lines);
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

      /* Explicit per-site waiver: `design-allow-copy-voice`. design.md §3
         carves out ONE label role that legitimately takes the Copy voice — a
         table cell's row-identifier text that doubles as the row's drill-in
         target. It reads as table data alongside its sibling cells, so a
         font-medium there makes one column shout. The waiver must appear in a
         comment within the 5 lines above the className, so it is visible
         exactly where it applies and can never go repo-wide. Every use states
         its reason inline. */
      if (flagged) {
        for (let j = i - 1; j >= 0 && j > i - 6; j--) {
          if (/design-allow-copy-voice/.test(lines[j])) {
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

    if (RAW_TYPE_SCOPE.test(file) && !ANY_VOICE_RE.test(line)) {
      const rawM = line.match(RAW_TYPE_RE);
      if (rawM) {
        let waived = false;
        for (let j = i - 1; j >= 0 && j > i - 6; j--) {
          if (/design-allow-raw-type/.test(lines[j])) {
            waived = true;
            break;
          }
        }
        if (!waived) {
          violations.push({
            file,
            line: i + 1,
            kind: "raw-type",
            text: `${rawM[0].trim()} with no type-* voice — use type-label-* / type-copy-* / type-heading-* / type-mono-*`,
          });
        }
      }
    }

    if (!COMMENT_LINE_RE.test(line)) {
      if (!RAW_COLOR_SKIP.test(file)) {
        const rawColorM = line.match(RAW_COLOR_RE);
        if (rawColorM && !waivedAbove(lines, i, "design-allow-raw-color")) {
          violations.push({
            file,
            line: i + 1,
            kind: "raw-color",
            text: `${rawColorM[0]} — colors are tokens; only src/index.css and icons/brand-colors.ts hold literals`,
          });
        }
      }
      if (RAW_PALETTE_SCOPE.test(file)) {
        const rawPalM = line.match(RAW_PALETTE_RE);
        if (rawPalM && !waivedAbove(lines, i, "design-allow-raw-color")) {
          const cls = rawPalM[0].trim().replace(/^[:"'`]/, "");
          const hint =
            RAW_PALETTE_HINT[cls] ??
            (cls.startsWith("ring-")
              ? "ring-ring"
              : "bg-overlay / bg-overlay-strong");
          violations.push({
            file,
            line: i + 1,
            kind: "raw-palette",
            text: `${cls} has a semantic twin — use ${hint} (design.md §2 quick-reference)`,
          });
        }
      }
    }

    if (!(CHART_TOOLTIP_OWNER.test(file) || COMMENT_LINE_RE.test(line))) {
      if (RECHARTS_TOOLTIP_IMPORT_RE.test(line)) {
        violations.push({
          file,
          line: i + 1,
          kind: "chart-tooltip",
          text: "Tooltip imported from recharts — use ChartTooltip from components/ui/chart (portalled, self-positioning; design.md Chart tooltip & legend)",
        });
      }
      if (
        /<ChartTooltip\b/.test(
          lines.slice(Math.max(0, i - 12), i + 1).join("\n")
        ) &&
        CHART_TOOLTIP_PROP_RE.test(line)
      ) {
        violations.push({
          file,
          line: i + 1,
          kind: "chart-tooltip",
          text: `${line.match(CHART_TOOLTIP_PROP_RE)[0]} on ChartTooltip — the portal recipe positions itself; this prop only moves the clipping (design.md Chart tooltip & legend)`,
        });
      }
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

    if (
      !(
        COMMENT_LINE_RE.test(line) ||
        inBlockComment[i] ||
        SCROLLPORT_SKIP.test(file)
      ) &&
      SCROLLPORT_RE.test(line) &&
      !inlinePad(line) &&
      !waivedAbove(lines, i, "design-allow-clip")
    ) {
      violations.push({
        file,
        line: i + 1,
        kind: "ring-clip",
        text: "scrolling container with no inline padding: a non-visible overflow on ONE axis computes the other to auto, so the 4px focus ring (ring-2 + ring-offset-2) is clipped on both edges. Reserve it with px-1 (pull the box back with -mx-1 if the content must not shift), or waive with design-allow-clip + a reason. design.md, Focus ring / Clipping",
      });
    }
  });

  if (FLOATING_SCOPE.test(file)) {
    const body = lines.join("\n");
    const posLine = lines.findIndex((l) => POSITIONER_RE.test(l));
    if (
      posLine !== -1 &&
      !PORTAL_RE.test(body) &&
      !waivedAbove(lines, posLine, "design-allow-clip")
    ) {
      violations.push({
        file,
        line: posLine + 1,
        kind: "float-clip",
        text: "floating layer rendered with no <*.Portal>: the popup stays in the trigger's DOM position, where every overflow-hidden Card and every scrollport above it clips the surface. design.md, Focus ring / Clipping",
      });
    }
  }
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
  "✓ design-token guard: no invented colors or type sizes, no copy voice on a label, no raw type utility on a page, no raw color literal or palette atom with a semantic twin, no chart tooltip outside the portal recipe, no scrollport without a focus-ring gutter, no floating layer outside a portal."
);
