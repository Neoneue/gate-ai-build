#!/usr/bin/env node
/**
 * verify-twins: resolve dashboard routes to every source file that renders on
 * them, and optionally prove a pattern's coverage across those files.
 *
 *   node .claude/skills/verify-twins/resolve-route.mjs /models /models-free
 *   node .claude/skills/verify-twins/resolve-route.mjs --pattern 'cursor-help' /token-savings ...
 *
 * Walks src/App.tsx for each `<Route ... path="<route>">`, takes the element's
 * component name, finds its lazy import or static import, then follows every
 * `@/pages/...` and `@/layouts/...` import recursively. Components under
 * src/components are primitives and are not walked (they are shared by
 * definition). Never opens src/data/*.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const pIdx = args.indexOf("--pattern");
const pattern = pIdx >= 0 ? new RegExp(args[pIdx + 1]) : null;
const routes = args.filter((a, i) => !a.startsWith("--") && !(pIdx >= 0 && i === pIdx + 1));
if (routes.length === 0) {
  console.error("usage: resolve-route.mjs [--pattern <regex>] <route> [<route>...]");
  process.exit(2);
}

const ROOT = process.cwd();
const app = readFileSync(resolve(ROOT, "src/App.tsx"), "utf8");

function componentForRoute(route) {
  const esc = route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // The element prop itself contains "/>", so a tag cannot be cut at the
  // first "/>". Instead, each chunk between one "<Route" and the next holds
  // exactly one tag's attributes, in any order, across any lines.
  for (const chunk of app.split(/<Route\b/).slice(1)) {
    if (!new RegExp(`\\bpath="${esc}"`).test(chunk)) continue;
    const el = chunk.match(/element=\{<([A-Z][A-Za-z0-9]*)/);
    return el ? el[1] : null;
  }
  return null;
}

function importPathFor(name, src) {
  const lazy = src.match(new RegExp(`const ${name} = lazy\\(\\(\\) =>\\s*import\\("([^"]+)"\\)`));
  if (lazy) return lazy[1];
  const stat = src.match(new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*"([^"]+)"`));
  if (stat) return stat[1];
  const def = src.match(new RegExp(`import\\s+${name}\\s+from\\s*"([^"]+)"`));
  return def ? def[1] : null;
}

function toFile(spec) {
  if (!spec.startsWith("@/")) return null;
  const rel = spec.slice(2);
  if (!(rel.startsWith("pages/") || rel.startsWith("layouts/"))) return null;
  for (const ext of [".tsx", ".ts", "/index.tsx"]) {
    const f = resolve(ROOT, "src", rel + ext);
    if (existsSync(f)) return f;
  }
  return null;
}

function walk(file, seen) {
  if (seen.has(file)) return;
  seen.add(file);
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(/from\s*"(@\/(?:pages|layouts)\/[^"]+)"/g)) {
    const f = toFile(m[1]);
    if (f) walk(f, seen);
  }
  for (const m of src.matchAll(/import\("(@\/(?:pages|layouts)\/[^"]+)"\)/g)) {
    const f = toFile(m[1]);
    if (f) walk(f, seen);
  }
}

const rows = [];
for (const route of routes) {
  const comp = componentForRoute(route);
  if (!comp) {
    console.log(`\n${route}: no <Route path="${route}"> in src/App.tsx`);
    continue;
  }
  const spec = importPathFor(comp, app);
  const entry = spec ? toFile(spec) : null;
  if (!entry) {
    console.log(`\n${route}: element <${comp}> has no resolvable @/pages import`);
    continue;
  }
  const seen = new Set();
  walk(entry, seen);
  // Rendered UI only: page and pane components. Data modules, stores and
  // the shared chrome are reached by every route and never carry a twin.
  const files = [...seen]
    .map((f) => f.replace(`${ROOT}/src/`, ""))
    .filter((f) => f.startsWith("pages/") && f.endsWith(".tsx") && !/\.test\.tsx$/.test(f))
    .sort();
  console.log(`\n${route}  ->  <${comp}>`);
  for (const f of files) {
    const lines = readFileSync(resolve(ROOT, "src", f), "utf8").split("\n").length;
    const hits = pattern
      ? readFileSync(resolve(ROOT, "src", f), "utf8").split("\n").filter((l) => pattern.test(l)).length
      : null;
    console.log(`  ${f} (${lines})${pattern ? `  hits: ${hits}` : ""}`);
    if (pattern) rows.push({ route, file: f, hits });
  }
}

if (pattern) {
  console.log(`\n| route | file | hits |\n| --- | --- | --- |`);
  for (const r of rows) console.log(`| ${r.route} | ${r.file} | ${r.hits} |`);
  const total = rows.reduce((n, r) => n + r.hits, 0);
  console.log(total === 0 ? "\npattern absent across every rendered file" : `\n${total} hit(s) across ${rows.filter((r) => r.hits > 0).length} file(s)`);
}
