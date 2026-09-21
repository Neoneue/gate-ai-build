#!/usr/bin/env node
/**
 * lint-copy: semantic copy lint over user-facing strings in src/pages.
 *
 * Extracts JSX text and string props with the TypeScript AST, sends each
 * string to TypeSafe's Jev model with two questions derived from the copy
 * rules (copy is for users, never a PRD echo or a mechanism restatement),
 * and prints the strings where BOTH questions agree above the threshold.
 * Measured 2026-09-21 over 269 strings: either-question gate flagged 42%,
 * AND gate flagged 10% at roughly 60% precision. Keep the AND gate.
 *
 * Opt-in only: `npm run lint:copy [files...]`. Needs TYPESAFE_API_KEY (shell
 * or .env.local) plus network. Never wire into lint-staged or CI.
 *
 * Waive a string with a comment on the line above it (or its JSX element):
 *   {/＊ copy-allow: explains what the switch does ＊/}   (ASCII slash-star in JSX)
 *   // copy-allow: definition answering a question
 *
 * Flags: --threshold 0.7   both probabilities must reach this
 *        --any             flag on either question (noisy, for exploration)
 *        --json <path>     dump every judged string with probabilities
 */
import { existsSync, globSync, readFileSync } from "node:fs";
import { relative } from "node:path";
import ts from "typescript";

const args = process.argv.slice(2);
const thresholdIdx = args.indexOf("--threshold");
const THRESHOLD = thresholdIdx >= 0 ? Number(args[thresholdIdx + 1]) : 0.7;
const jsonArgIdx = args.indexOf("--json");
const files = args.filter(
  (a, i) =>
    !(
      a.startsWith("--") ||
      (thresholdIdx >= 0 && i === thresholdIdx + 1) ||
      (jsonArgIdx >= 0 && i === jsonArgIdx + 1)
    )
);
const ANY = args.includes("--any");
const targets =
  files.length > 0
    ? files.flatMap((f) => globSync(f))
    : globSync("src/pages/**/*.tsx");

function apiKey() {
  if (process.env.TYPESAFE_API_KEY) {
    return process.env.TYPESAFE_API_KEY;
  }
  if (existsSync(".env.local")) {
    const m = readFileSync(".env.local", "utf8").match(
      /^TYPESAFE_API_KEY=(.*)$/m
    );
    if (m) {
      return m[1].trim().replace(/^["']|["']$/g, "");
    }
  }
  console.error("lint-copy: TYPESAFE_API_KEY not set (env or .env.local)");
  process.exit(2);
}

const PROP_NAMES = new Set([
  "title",
  "description",
  "subtitle",
  "label",
  "placeholder",
  "note",
  "helper",
  "helperText",
  "caption",
  "eyebrow",
  "empty",
  "emptyText",
  "body",
  "copy",
  "hint",
  "summary",
  "aria-label",
]);
const MIN_WORDS = 4;

function extract(file) {
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n");
  const sf = ts.createSourceFile(
    file,
    src,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const out = [];
  const push = (node, text) => {
    const t = text.replace(/\s+/g, " ").trim();
    if (t.split(" ").length < MIN_WORDS) {
      return;
    }
    if (/^[\w-]+(\s[\w-]+)*$/.test(t) && !/[a-z]{3}/.test(t)) {
      return;
    }
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
    const above = lines.slice(Math.max(0, line - 2), line + 1).join("\n");
    if (
      /copy-allow\b/.test(above) ||
      /copy-allow\b/.test(node.getFullText(sf))
    ) {
      return;
    }
    out.push({ file: relative(process.cwd(), file), line: line + 1, text: t });
  };
  const inlineText = (child) => {
    if (ts.isJsxText(child)) {
      return child.text;
    }
    if (ts.isJsxExpression(child) && child.expression) {
      const e = child.expression;
      if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) {
        return e.text;
      }
      return " <value> ";
    }
    if (ts.isJsxElement(child)) {
      return child.children.map(inlineText).join("");
    }
    if (ts.isJsxSelfClosingElement(child)) {
      return " ";
    }
    return "";
  };
  const visit = (node) => {
    if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
      const hasText = node.children.some(
        (c) =>
          (ts.isJsxText(c) && c.text.trim()) ||
          (ts.isJsxExpression(c) &&
            c.expression &&
            ts.isStringLiteral(c.expression))
      );
      if (hasText) {
        push(node, node.children.map(inlineText).join(""));
        // do not descend into inline children for text; still visit attributes of nested elements
        for (const c of node.children) {
          if (ts.isJsxElement(c) || ts.isJsxSelfClosingElement(c)) {
            visitAttrs(c);
          }
        }
        if (ts.isJsxElement(node)) {
          visitAttrs(node);
        }
        return;
      }
    }
    if (ts.isJsxAttribute(node) && node.initializer) {
      const name = node.name.getText(sf);
      if (PROP_NAMES.has(name)) {
        const init = node.initializer;
        if (ts.isStringLiteral(init)) {
          push(init, init.text);
        } else if (ts.isJsxExpression(init) && init.expression) {
          const e = init.expression;
          if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) {
            push(e, e.text);
          }
        }
      }
    } else if (
      ts.isPropertyAssignment(node) &&
      PROP_NAMES.has(node.name.getText(sf))
    ) {
      const e = node.initializer;
      if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) {
        push(e, e.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  const visitAttrs = (el) => {
    const opening = ts.isJsxElement(el) ? el.openingElement : el;
    for (const a of opening.attributes.properties) {
      visit(a);
    }
    if (ts.isJsxElement(el)) {
      for (const c of el.children) {
        if (ts.isJsxElement(c) || ts.isJsxSelfClosingElement(c)) {
          visitAttrs(c);
        }
      }
    }
  };
  visit(sf);
  return out;
}

const QUESTIONS = {
  mechanic: {
    type: "noul",
    instructions:
      "Does `copy` explain how the software works internally, restate a rule or mechanism, or use negative framing such as 'cannot', 'is not', 'there is no', 'does not' instead of telling the user what they get or can do?",
    criteria: {
      true: "Describes mechanism, restrictions, or system behaviour in spec language",
      false:
        "Tells the user a benefit, an action, or a plain fact in user language",
    },
  },
  prd_echo: {
    type: "noul",
    instructions:
      "Does `copy` read like a sentence lifted from a product requirements document (formal, third-person, mechanism-first, system as subject) rather than direct dashboard UI copy addressed to the person using it?",
  },
};

async function judge(key, copy) {
  const r = await fetch("https://api.typesafe.ai/v1/systemone", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "jev-latest",
      state: { copy },
      questions: QUESTIONS,
    }),
  });
  if (r.status === 429) {
    const wait = Number(r.headers.get("retry-after") ?? 2) * 1000;
    await new Promise((res) => setTimeout(res, wait));
    return judge(key, copy);
  }
  if (!r.ok) {
    throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  }
  const j = await r.json();
  return {
    mech: j.answers.mechanic.noul,
    prd: j.answers.prd_echo.noul,
    tokens: j.usage?.input_tokens ?? 0,
  };
}

const key = apiKey();
const items = targets.flatMap(extract);
const seen = new Map();
for (const it of items) {
  if (!seen.has(it.text)) {
    seen.set(it.text, it);
  }
}
const unique = [...seen.values()];
console.error(
  `lint-copy: ${targets.length} files, ${items.length} strings, ${unique.length} unique`
);

const CONCURRENCY = 8;
let tokens = 0;
const results = [];
for (let i = 0; i < unique.length; i += CONCURRENCY) {
  const batch = unique.slice(i, i + CONCURRENCY);
  const rs = await Promise.all(batch.map((it) => judge(key, it.text)));
  rs.forEach((r, k) => {
    tokens += r.tokens;
    results.push({ ...batch[k], ...r });
  });
}

const jsonIdx = args.indexOf("--json");
if (jsonIdx >= 0) {
  (await import("node:fs")).writeFileSync(
    args[jsonIdx + 1],
    JSON.stringify(results, null, 1)
  );
}
const flagged = results.filter((r) =>
  ANY
    ? r.mech >= THRESHOLD || r.prd >= THRESHOLD
    : r.mech >= THRESHOLD && r.prd >= THRESHOLD
);
flagged.sort((a, b) => b.mech + b.prd - (a.mech + a.prd));
for (const r of flagged) {
  console.log(
    `${r.file}:${r.line}  mechanic ${r.mech.toFixed(2)}  prd-echo ${r.prd.toFixed(2)}\n    ${r.text.slice(0, 140)}`
  );
}
console.log(
  `\n${flagged.length}/${unique.length} flagged (${ANY ? "either" : "both"} >= ${THRESHOLD}); ${tokens} input tokens (~$${((tokens / 1e6) * 0.042).toFixed(4)})`
);
