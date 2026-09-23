#!/usr/bin/env node
/**
 * Clipping guard. Nothing may be cut off by an ancestor's bounding box.
 *
 * `lint:design` check 8 is a text scan: it can see that a scrolling container
 * carries no inline padding, and nothing else. It cannot see whether the box
 * holds a focusable descendant (they arrive through components), it cannot see
 * the block axis, and it cannot judge the 47 `overflow-hidden` clip-only boxes
 * (progress tracks, corner-rounders, layout columns) without becoming 90%
 * waiver. This script closes all three by measuring the real DOM.
 *
 * WHAT IT CHECKS, per route
 *   1. PAINT: every element whose painted extent exceeds its border box
 *      (a non-inset `box-shadow`, an `outline` at a positive offset) against
 *      every clipping ancestor's padding box. Covers card and button drop
 *      shadows at the edge of a scroll region or a horizontal strip.
 *   2. FOCUS RINGS: a real keyboard tab-walk (`Tab`, not `.focus()`, so
 *      `:focus-visible` genuinely applies), measuring each ring where the
 *      browser actually parks it, including after scroll-into-view.
 *   3. FLOATING LAYERS: every open tooltip / popover / menu / listbox /
 *      dialog that still has a clipping ancestor, i.e. failed to portal out.
 *   4. TRANSFORMS: a scaled or translated state grows `getBoundingClientRect`,
 *      so 1 and 2 catch it for free wherever the state is active when the
 *      audit runs. Hover states need `--hover` (below) to be active at all.
 *
 * REMEDIES, per design.md "Focus ring" / Clipping: reserve room inside the
 * container (`px-1` + `-mx-1`, `scroll-py-1`), or portal the layer out.
 * Removing the scroll or overflow behaviour is not one.
 *
 * WHAT IT STILL CANNOT SEE: any surface it never opens. It drives routes and
 * the interactions listed in `INTERACTIONS`; a dialog, menu or hover state
 * reached another way is unaudited until someone adds it here.
 *
 * USAGE
 *   npm run dev -- --port 3000 --strictPort      # in another shell
 *   npm run lint:clipping                        # all default routes
 *   npm run lint:clipping -- /billing/plans /security
 *   npm run lint:clipping -- --hover /policies   # also sweep hover states
 *
 * Not part of `npm run lint` or CI: it needs a running server. Run it when a
 * change touches an overflow, a scrollport, a floating layer or a shadow.
 */
import { chromium } from "@playwright/test";

const BASE = process.env.CLIP_BASE ?? "http://localhost:3000";
/** ring-2 (2px) + ring-offset-2 (2px). design.md, Focus ring. */
const RING = 4;

const DEFAULT_ROUTES = [
  "/overview",
  "/overview-default",
  "/overview-free",
  "/overview-enterprise",
  "/messages",
  "/conversations",
  "/models",
  "/token-savings",
  "/limits",
  "/security",
  "/policies",
  "/audit-trail",
  "/activity",
  "/members",
  "/teams",
  "/notifications",
  "/settings",
  "/api-keys",
  "/billing",
  "/billing/plans",
];

/* Surfaces that only exist after an interaction. Each entry opens one and
 * leaves it open for the audit; `close` restores the page for the next. */
const INTERACTIONS = [
  {
    route: "/billing/plans",
    label: "contact dialog, Name focused",
    open: async (p) => {
      await p.getByRole("button", { name: "Contact us", exact: true }).click();
      await p.waitForTimeout(500);
      await p.locator("#contact-name").focus();
    },
  },
  {
    route: "/billing/plans",
    label: "book a demo dialog",
    open: async (p) => {
      await p.getByRole("button", { name: "Book a demo", exact: true }).click();
      await p.waitForTimeout(600);
    },
  },
  {
    route: "/overview",
    label: "notifications menu",
    open: async (p) => {
      await p.locator('button[aria-label*="otification"]').first().click();
      await p.waitForTimeout(500);
    },
  },
  {
    route: "/overview",
    label: "Ask AI panel",
    open: async (p) => {
      await p
        .getByRole("button", { name: /ask ai/i })
        .first()
        .click();
      await p.waitForTimeout(800);
    },
  },
];

/* ─── page-side probes ──────────────────────────────────────────────────── */

/** Split a computed `box-shadow` into layers without cutting inside a colour
 *  function, which carries its own commas. */
const SPLIT_SHADOW = `const splitShadow = (bs) => {
  const out = []; let d = 0, cur = '';
  for (const ch of bs) {
    if (ch === '(') d++; if (ch === ')') d--;
    if (ch === ',' && d === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur); return out;
};`;

/** How far an element paints outside its own border box. Inset ring layers
 *  and fully transparent layers contribute nothing. */
const EXTENT = `${SPLIT_SHADOW}
const extentOf = (el) => {
  const s = getComputedStyle(el);
  let shadow = 0, outline = 0;
  if (s.boxShadow && s.boxShadow !== 'none') {
    for (const L of splitShadow(s.boxShadow)) {
      if (/\\binset\\b/.test(L)) continue;
      if (/rgba\\(\\s*0,\\s*0,\\s*0,\\s*0\\s*\\)/.test(L) || /\\btransparent\\b/.test(L)) continue;
      const m = L.match(/(-?[\\d.]+)px\\s+(-?[\\d.]+)px\\s+(-?[\\d.]+)px\\s+(-?[\\d.]+)px/);
      if (!m) continue;
      shadow = Math.max(shadow, Math.max(Math.abs(+m[1]), Math.abs(+m[2])) + (+m[3]) / 2 + (+m[4]));
    }
  }
  if (s.outlineStyle !== 'none' && s.outlineColor !== 'rgba(0, 0, 0, 0)' && parseFloat(s.outlineWidth) > 0) {
    outline = parseFloat(s.outlineWidth) + parseFloat(s.outlineOffset || '0');
  }
  return { shadow, outline, ext: Math.max(shadow, outline) };
};
/* Every ancestor that clips. \`display: contents\` boxes are skipped (they have
   no box to clip with), BODY is skipped (that is the viewport, not a
   container), and a position:fixed element is only clipped by an ancestor
   that is also its containing block. */
const clipChain = (el) => {
  const out = []; let n = el.parentElement;
  const fixed = getComputedStyle(el).position === 'fixed';
  while (n && n !== document.documentElement) {
    const cs = getComputedStyle(n);
    const clips = cs.overflowX !== 'visible' || cs.overflowY !== 'visible';
    if (clips && cs.display !== 'contents' && n.tagName !== 'BODY'
        && (!fixed || cs.transform !== 'none' || cs.filter !== 'none')) out.push([n, cs]);
    n = n.parentElement;
  }
  return out;
};
const label = (n) => n.tagName + (n.id ? '#' + n.id : '') + '.' + ((n.className || '').toString().slice(0, 110) || '(no class)');
const slackOf = (r, n, cs) => {
  const cr = n.getBoundingClientRect();
  const pl = cr.left + parseFloat(cs.borderLeftWidth), pr = cr.right - parseFloat(cs.borderRightWidth);
  const pt = cr.top + parseFloat(cs.borderTopWidth), pb = cr.bottom - parseFloat(cs.borderBottomWidth);
  return { sx: Math.min(r.left - pl, pr - r.right), sy: Math.min(r.top - pt, pb - r.bottom), pl, pr, pt, pb };
};`;

/** 1 + 3: painted extents and unportalled floating layers. */
const AUDIT = `(() => {
  ${EXTENT}
  const hits = new Map();
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const { ext } = extentOf(el);
    if (ext <= 0.5) continue;
    for (const [n, cs] of clipChain(el)) {
      const { sx, sy, pl, pr, pt, pb } = slackOf(r, n, cs);
      if (r.right < pl - 2 || r.left > pr + 2 || r.bottom < pt - 2 || r.top > pb + 2) continue;
      const bx = cs.overflowX !== 'visible' && sx < ext && sx > -2;
      const by = cs.overflowY !== 'visible' && sy < ext && sy > -2;
      if (!(bx || by)) continue;
      const k = 'paint::' + label(n) + '::' + label(el);
      const prev = hits.get(k);
      const rec = { kind: 'paint', axis: (bx ? 'X' : '') + (by ? 'Y' : ''), ext: +ext.toFixed(2),
        sx: +sx.toFixed(2), sy: +sy.toFixed(2), ov: cs.overflowX + '/' + cs.overflowY,
        container: label(n), victim: label(el) };
      if (!prev || Math.min(sx, sy) < Math.min(prev.sx, prev.sy)) hits.set(k, rec);
    }
  }
  const FLOAT = '[role=tooltip],[role=menu],[role=listbox],[role=dialog],[data-slot$=popup]';
  const floats = [];
  for (const el of document.querySelectorAll(FLOAT)) {
    const chain = clipChain(el);
    if (chain.length) floats.push({ kind: 'float', victim: label(el),
      clippedBy: chain.map(([n, cs]) => label(n) + ' [' + cs.overflowX + '/' + cs.overflowY + ']') });
  }
  return { hits: [...hits.values()], floats };
})()`;

/** 2: the focus ring of whatever the last Tab landed on. */
const MEASURE_FOCUS = `(() => {
  ${EXTENT}
  const f = document.activeElement;
  if (!f || f === document.body) return null;
  const { shadow, outline, ext } = extentOf(f);
  if (ext <= 0.5) return { id: label(f), clips: [] };
  const r = f.getBoundingClientRect();
  const clips = [];
  for (const [n, cs] of clipChain(f)) {
    const { sx, sy } = slackOf(r, n, cs);
    const bx = cs.overflowX !== 'visible' && sx < ext && sx > -2;
    const by = cs.overflowY !== 'visible' && sy < ext && sy > -2;
    if (bx || by) clips.push({ kind: 'ring', axis: (bx ? 'X' : '') + (by ? 'Y' : ''),
      ext: +ext.toFixed(2), sx: +sx.toFixed(2), sy: +sy.toFixed(2),
      ov: cs.overflowX + '/' + cs.overflowY, container: label(n), victim: label(f),
      via: shadow >= outline ? 'ring' : 'outline' });
  }
  return { id: label(f), clips };
})()`;

/* ─── driver ────────────────────────────────────────────────────────────── */

/** A real keyboard walk. `.focus()` does not reliably set `:focus-visible` on
 *  a button, so a script-focus sweep silently measures no ring at all. */
async function tabWalk(page, maxTabs = 150) {
  const found = new Map();
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    window.scrollTo(0, 0);
  });
  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press("Tab");
    const r = await page.evaluate(MEASURE_FOCUS);
    if (!r) {
      continue;
    }
    for (const c of r.clips) {
      const k = c.container + "::" + c.victim;
      const prev = found.get(k);
      if (!prev || Math.min(c.sx, c.sy) < Math.min(prev.sx, prev.sy)) {
        found.set(k, c);
      }
    }
  }
  return [...found.values()];
}

/** Hover every element that grows or raises on hover, then re-audit. Off by
 *  default: it is the slow pass and the codebase currently has no
 *  `hover:shadow-*` at all and only shrinking `active:scale-[0.98]`. */
async function hoverSweep(page) {
  const out = [];
  const ids = await page.evaluate(() => {
    const seen = [];
    document.querySelectorAll("*").forEach((el, i) => {
      const c = (el.className || "").toString();
      if (
        /hover:scale-|group-hover:scale-|hover:shadow-|hover:translate/.test(c)
      ) {
        el.setAttribute("data-clipprobe", String(i));
        seen.push(String(i));
      }
    });
    return seen;
  });
  for (const id of ids.slice(0, 40)) {
    const el = page.locator(`[data-clipprobe="${id}"]`).first();
    try {
      await el.hover({ timeout: 1500 });
    } catch {
      continue;
    }
    await page.waitForTimeout(200);
    const { hits } = await page.evaluate(AUDIT);
    out.push(...hits);
  }
  return out;
}

const args = process.argv.slice(2);
const withHover = args.includes("--hover");
const routes = args.filter((a) => a.startsWith("/"));
const targets = routes.length > 0 ? routes : DEFAULT_ROUTES;

const findings = [];
const push = (where, rows) => {
  for (const r of rows) {
    findings.push({ where, ...r });
  }
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

for (const route of targets) {
  try {
    await page.goto(BASE + route, {
      waitUntil: "networkidle",
      timeout: 25_000,
    });
  } catch {
    console.error(`  ! ${route} did not load. Is the dev server on ${BASE}?`);
    continue;
  }
  await page.waitForTimeout(350);
  const { hits, floats } = await page.evaluate(AUDIT);
  push(route, hits);
  push(route, floats);
  push(route, await tabWalk(page));
  if (withHover) {
    push(`${route} (hover)`, await hoverSweep(page));
  }
}

if (routes.length === 0) {
  for (const step of INTERACTIONS) {
    try {
      await page.goto(BASE + step.route, {
        waitUntil: "networkidle",
        timeout: 25_000,
      });
      await page.waitForTimeout(400);
      await step.open(page);
    } catch {
      console.error(`  ! could not open "${step.label}", skipped`);
      continue;
    }
    const { hits, floats } = await page.evaluate(AUDIT);
    push(step.label, hits);
    push(step.label, floats);
    push(step.label, await tabWalk(page, 60));
  }
}

await browser.close();

if (findings.length > 0) {
  console.error(
    `\n✖ clipping guard: ${findings.length} element(s) cut off by an ancestor.\n` +
      `  The focus ring is ${RING}px outside the border box; a shadow is its own spread.\n` +
      "  Reserve the room (px-1 + -mx-1, scroll-py-1) or portal the layer out.\n" +
      "  Never remove the scroll or overflow behaviour. design.md, Focus ring / Clipping.\n"
  );
  for (const f of findings) {
    if (f.kind === "float") {
      console.error(
        `  ${f.where}  [float]  ${f.victim}\n      clipped by ${f.clippedBy.join(", ")}`
      );
    } else {
      console.error(
        `  ${f.where}  [${f.kind}] ${f.axis}  needs ${f.ext}px, has ${f.sx}px inline / ${f.sy}px block  [${f.ov}]\n      in  ${f.container}\n      of  ${f.victim}`
      );
    }
  }
  process.exit(1);
}

console.log(
  `✓ clipping guard: ${targets.length} route(s)${routes.length === 0 ? ` + ${INTERACTIONS.length} interaction(s)` : ""}: no ring, shadow or floating layer cut off by an ancestor.`
);
