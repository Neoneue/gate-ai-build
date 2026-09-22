#!/usr/bin/env node
/**
 * ui-audit report checker. The review or apply agent runs this on its own
 * report before handing back; the orchestrator runs it once on the returned
 * file and bounces the agent with the output until it prints PASS.
 *
 *   node .claude/skills/ui-audit/check-report.mjs review <report.md> <route>...
 *   node .claude/skills/ui-audit/check-report.mjs apply  <report.md> <route>...
 *
 * review criteria
 *   R1 every item line is `- [ ] **N. SEVERITY** \`slug\` path:line`
 *   R2 every item has one-line Before / After / Why sub-bullets
 *   R3 every Why ends with a proof in parentheses: (grep: ...), (design.md:N),
 *      a DOM measurement, or (verify-twins: ...)
 *   R4 an Opinion line exists and is Clean / Qualified / Adverse / Disclaimer
 *   R5 "Files read in full" lists every file verify-twins resolves for the
 *      routes (line counts optional); Disclaimer is only allowed with a
 *      named stop line
 *   R6 no "checked, not a defect" item (After says "no action" / "keep as-is")
 *
 * apply criteria
 *   A1 every item has file:line before -> after
 *   A2 a Twin sweep table with Free / Default / Pro / Enterprise columns and
 *      no blank cell
 *   A3 every `Before:` pattern quoted in the report is absent from every
 *      file verify-twins resolves for the routes (run live)
 *   A4 gates block names tsc, biome, lint:design, smoke with counts
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const [mode, reportPath, ...routes] = process.argv.slice(2);
if (!(mode === "review" || mode === "apply") || !reportPath) {
  console.error("usage: check-report.mjs review|apply <report.md> <route>...");
  process.exit(2);
}
const report = readFileSync(reportPath, "utf8");
const lines = report.split("\n");
const fails = [];

function resolved() {
  if (routes.length === 0) return [];
  const out = execFileSync("node", [".claude/skills/verify-twins/resolve-route.mjs", ...routes], { encoding: "utf8" });
  return [...new Set([...out.matchAll(/^\s{2}(pages\/[^\s]+\.tsx)/gm)].map((m) => m[1]))];
}
function absent(pattern) {
  if (routes.length === 0) return null;
  const out = execFileSync("node", [".claude/skills/verify-twins/resolve-route.mjs", "--pattern", pattern, ...routes], { encoding: "utf8" });
  return /pattern absent across every rendered file/.test(out) ? true : out.split("\n").filter((l) => /^\| \/.*\| [1-9]\d* \|$/.test(l));
}

const ITEM_RE = /^- \[[ x]\] \*\*(?:[a-z]+-)?\d+\.? (HIGH|MEDIUM|LOW)\*\* `[a-z0-9-]+` \S+:\d+/;
const items = [];
lines.forEach((l, i) => {
  if (/^- \[[ x]\] \*\*/.test(l)) {
    if (!ITEM_RE.test(l)) fails.push(`R1 line ${i + 1}: item line not in shape \`- [ ] **N. SEVERITY** \\\`slug\\\` path:line\`: ${l.slice(0, 80)}`);
    items.push(i);
  }
});

if (mode === "review") {
  for (const i of items) {
    const block = lines.slice(i + 1, i + 6);
    const before = block.find((l) => /^\s+- Before:/.test(l));
    const after = block.find((l) => /^\s+- After:/.test(l));
    const why = block.find((l) => /^\s+- Why:/.test(l));
    if (!(before && after && why)) fails.push(`R2 line ${i + 1}: missing Before / After / Why sub-bullet`);
    if (why && !/\((?:grep|design\.md|verify-twins|measured|scrollHeight|clientWidth|clientHeight|getBoundingClientRect|tabindex|contrast)[^)]*\)\.?\s*$/i.test(why)) fails.push(`R3 line ${i + 1}: Why does not end with a proof in parentheses`);
    if (after && /no action|keep as-is|keep as is|not a defect|listed only/i.test(after)) fails.push(`R6 line ${i + 1}: "checked, not a defect" belongs under Compliant, not as an item`);
  }
  const op = report.match(/^\s*Opinion:\s*(Clean|Qualified|Adverse|Disclaimer)/m);
  if (!op) fails.push("R4 no `Opinion: Clean|Qualified|Adverse|Disclaimer` line");
  const frif = report.match(/Files read in full[\s\S]*$/);
  if (!frif) fails.push("R5 no `Files read in full` section");
  else {
    for (const f of resolved()) {
      const base = f.split("/").pop();
      if (!frif[0].includes(base)) fails.push(`R5 route renders ${f} but it is not in Files read in full`);
    }
  }
  if (op && op[1] === "Disclaimer" && !/stopped at line \d+/i.test(report)) fails.push("R5 Disclaimer without a named stop line");
}

if (mode === "apply") {
  const sweep = report.match(/\|\s*Item\s*\|[^\n]*Free[^\n]*Default[^\n]*Pro[^\n]*Enterprise[^\n]*\|\n\|[-| ]+\|\n((?:\|[^\n]*\|\n?)+)/);
  if (!sweep) fails.push("A2 no Twin sweep table with Item | Files touched | Free | Default | Pro | Enterprise");
  else {
    sweep[1].split("\n").filter(Boolean).forEach((row, k) => {
      const cells = row.split("|").slice(1, -1).map((c) => c.trim());
      if (cells.length < 6 || cells.some((c) => c === "")) fails.push(`A2 sweep row ${k + 1} has a blank cell: ${row.slice(0, 80)}`);
      cells.slice(2).forEach((c) => { if (!/covered by|pattern absent/i.test(c)) fails.push(`A2 sweep row ${k + 1}: cell "${c.slice(0, 40)}" must say "covered by <file>" or "pattern absent"`); });
    });
  }
  const befores = [...report.matchAll(/Before: `([^`]+)`/g)].map((m) => m[1]);
  if (befores.length === 0) fails.push("A1 no `Before: \\`...\\`` strings to prove absent");
  for (const b of befores) {
    const r = absent(b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    if (r === null) continue;
    if (r !== true) fails.push(`A3 Before pattern still present: \`${b.slice(0, 60)}\` -> ${r.join(" ; ")}`);
  }
  for (const g of ["tsc", "biome", "lint:design", "smoke"]) {
    if (!new RegExp(g.replace(":", "\\:")).test(report)) fails.push(`A4 gates block does not mention ${g}`);
  }
  if (!/\d+\s*(?:\/|tests|passed)/.test(report)) fails.push("A4 gates carry no counts");
}

if (fails.length === 0) {
  console.log(`PASS ${mode} ${reportPath}: ${items.length} item(s), ${routes.length} route(s) checked`);
  process.exit(0);
}
console.log(`FAIL ${mode} ${reportPath}: ${fails.length} criteria unmet`);
for (const f of fails) console.log(`  - ${f}`);
process.exit(1);
