#!/usr/bin/env node
// Token report for this project (first run 2026-10-10). Reads Claude Code's
// own transcripts for this repo and its worktrees (~/.claude/projects) and
// prints where the tokens went: spend by kind, context size, what main
// sessions spent calls on, subagents by model, blocked calls, rebuilt
// scratch scripts and, through Jev (TypeSafe), how many prompts corrected
// earlier work and why. Compares against the saved baseline.
//
//   node scripts/token-report.mjs                 last 7 days, with Jev
//   node scripts/token-report.mjs --since 2026-09-26 --until 2026-10-10
//   node scripts/token-report.mjs --no-jev        skip the correction count
//
// Snapshots go to docs/token-report/ (local-only, gitignored): <date>.json,
// and baseline.json on the first run. Prices are the bundled API table
// (cached 2026-10-06): Opus 5.5 $4 / $20, Sonnet 5.5 $2 / $10, cache reads
// $0.20 on both; Haiku 5.5 $0.10 / $0.50 up to 100K prompt, $0.50 / $2.50
// beyond (its cache ratios are assumed at 0.1x read, 1.25x / 2x write).
// Jev gets scrubbed excerpts only (no emails, URLs, paths, keys, user or
// owner names) and the run aborts if any slips through.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PROJECTS = path.join(os.homedir(), ".claude/projects");
const OUT_DIR = path.join(ROOT, "docs/token-report");
const DAY = 86_400_000;

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const until = arg("--until")
  ? Date.parse(`${arg("--until")}T23:59:59Z`)
  : Date.now();
const since = arg("--since")
  ? Date.parse(`${arg("--since")}T00:00:00Z`)
  : until - 7 * DAY;
const useJev = !args.includes("--no-jev");

const PRICES = {
  opus: { in: 4, out: 20, cr: 0.2, cw5: 5, cw1h: 8 },
  sonnet: { in: 2, out: 10, cr: 0.2, cw5: 2.5, cw1h: 4 },
  haikuLow: { in: 0.1, out: 0.5, cr: 0.01, cw5: 0.125, cw1h: 0.2 },
  haikuHigh: { in: 0.5, out: 2.5, cr: 0.05, cw5: 0.625, cw1h: 1 },
};
function price(model, ctx) {
  if (model.includes("opus")) {
    return PRICES.opus;
  }
  if (model.includes("sonnet")) {
    return PRICES.sonnet;
  }
  return ctx > 100_000 ? PRICES.haikuHigh : PRICES.haikuLow;
}

const slug = ROOT.replaceAll("/", "-");
const dirs = existsSync(PROJECTS)
  ? readdirSync(PROJECTS).filter((d) => d.startsWith(slug))
  : [];
function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== "tool-results") {
        walk(p, out);
      }
    } else if (p.endsWith(".jsonl") && statSync(p).mtimeMs >= since) {
      out.push(p);
    }
  }
  return out;
}
const files = dirs.flatMap((d) => walk(path.join(PROJECTS, d)));

function activityOf(tool) {
  const n = tool.name;
  const cmd = tool.input?.command ?? "";
  if (n === "Bash") {
    if (
      /\b(tsc|vitest|biome|ultracite|playwright test|gates\.mjs|npm run (lint|build|test|gates))/.test(
        cmd
      )
    ) {
      return "checks";
    }
    if (/^\s*(cd [^&]+&&\s*)?git\b|\bgh\b/.test(cmd)) {
      return "git";
    }
    if (/playwright|probe|chromium|lsof|kill /.test(cmd)) {
      return "browser / dev server";
    }
    if (/python3 -|sed -i|perl -|cat >|writeFileSync/.test(cmd)) {
      return "edit via shell";
    }
    if (/\b(sed -n|grep|rg|cat|head|tail|wc|ls|find)\b/.test(cmd)) {
      return "read code";
    }
    return "other shell";
  }
  if (["Read", "Grep", "Glob"].includes(n)) {
    return "read code";
  }
  if (["Edit", "Write"].includes(n)) {
    return "edit";
  }
  if (n.startsWith("mcp__room__") || n === "Monitor") {
    return "room";
  }
  if (["Agent", "SendMessage", "TaskStop"].includes(n)) {
    return "delegate";
  }
  if (n.startsWith("mcp__playwright")) {
    return "browser / dev server";
  }
  return "other tool";
}
function blockOf(text) {
  const rules = [
    [/deny pattern Bash\(rm -rf/, "rm -rf deny rule"],
    [/require-skill/, "skill / UI gate"],
    [/context-mode/, "context-mode redirect"],
    [/block-env-dump/, "env-dump guard"],
    [/auto mode classifier/, "auto-mode classifier"],
    [/File has not been read/, "Edit before Read"],
  ];
  return rules.find(([re]) => re.test(text))?.[1] ?? null;
}

export function scrub(s) {
  return String(s ?? "")
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "")
    .replace(
      /<pasted_content[^>]*>[\s\S]*?<\/pasted_content[^>]*>/g,
      "<pasted text>"
    )
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "<email>")
    .replace(/https?:\/\/\S+/g, "<url>")
    .replace(
      /(?:~|\/(?:Users|private|var|tmp|home))\/[^\s'"`)\]]*/g,
      (m) => `<path:${path.basename(m)}>`
    )
    .replace(/\b(?:sk|ghp|gho|pk|rk|xox[abp])[-_][A-Za-z0-9_-]{8,}/g, "<key>")
    .replace(/\b[0-9a-f]{16,}\b/gi, "<hex>")
    .replace(new RegExp(`${os.userInfo().username}|neoneue`, "gi"), "<user>")
    .replace(/\bchad\b/gi, "<owner>")
    .replace(/\s+/g, " ")
    .trim();
}
const textOf = (c) =>
  typeof c === "string"
    ? c
    : Array.isArray(c)
      ? c
          .filter((x) => x.type === "text")
          .map((x) => x.text)
          .join(" ")
      : "";

const R = {
  parts: { cr: 0, cw: 0, out: 0, in: 0 },
  main: 0,
  sub: 0,
  sessions: 0,
  subagents: 0,
  peaks: [],
  crAbove200: 0,
  mainCr: 0,
  activity: {},
  subByType: {},
  blocks: {},
  scratch: {},
  prompts: [],
};
const inc = (o, k, n = 1) => {
  o[k] = (o[k] ?? 0) + n;
};

for (const f of files) {
  const isSub = f.includes(`${path.sep}subagents${path.sep}`);
  let agentType = "?";
  if (isSub) {
    R.subagents++;
    try {
      agentType =
        JSON.parse(readFileSync(f.replace(/\.jsonl$/, ".meta.json"), "utf8"))
          .agentType ?? "?";
    } catch {
      // No meta file: older subagent transcripts.
    }
  } else {
    R.sessions++;
  }
  const msgs = new Map();
  let lastText = "";
  for (const line of readFileSync(f, "utf8").split("\n")) {
    if (!line) {
      continue;
    }
    let o;
    try {
      o = JSON.parse(line);
    } catch {
      continue;
    }
    const ts = Date.parse(o.timestamp ?? "");
    if (ts && (ts < since || ts > until)) {
      continue;
    }
    if (
      o.type === "assistant" &&
      o.message?.usage &&
      o.message.model !== "<synthetic>"
    ) {
      const tools = (o.message.content ?? []).filter(
        (c) => c.type === "tool_use"
      );
      for (const c of o.message.content ?? []) {
        if (c.type === "text" && c.text) {
          lastText = c.text;
        }
      }
      for (const t of tools) {
        const target =
          t.name === "Write"
            ? t.input?.file_path
            : t.name === "Bash"
              ? (t.input?.command ?? "").match(/cat\s*>\s*"?([^\s"<]+)/)?.[1]
              : null;
        if (target && /scratchpad|\/tmp\//.test(target)) {
          inc(R.scratch, path.basename(target).replace(/\d+/g, "N"));
        }
      }
      const m = msgs.get(o.message.id) ?? {
        usage: o.message.usage,
        model: o.message.model,
        tools: [],
      };
      m.tools.push(...tools);
      msgs.set(o.message.id, m);
    }
    if (o.type === "user" && o.message) {
      const c = o.message.content;
      if (Array.isArray(c)) {
        for (const x of c) {
          if (x.type === "tool_result" && x.is_error) {
            const b = blockOf(
              typeof x.content === "string"
                ? x.content
                : JSON.stringify(x.content)
            );
            if (b) {
              inc(R.blocks, b);
            }
          }
        }
      }
      const t = textOf(c);
      if (
        !(isSub || o.isMeta) &&
        t &&
        !/^\s*<(command-|local-command|system-reminder|task-notification|bash-)/.test(
          t
        ) &&
        !/\[Request interrupted/.test(t)
      ) {
        R.prompts.push({
          text: scrub(t).slice(0, 600),
          prev: scrub(lastText).slice(-350),
        });
      }
    }
  }
  let peak = 0;
  for (const m of msgs.values()) {
    const u = m.usage;
    const cw = u.cache_creation_input_tokens ?? 0;
    const h1 = u.cache_creation?.ephemeral_1h_input_tokens ?? 0;
    const ctx = (u.input_tokens ?? 0) + cw + (u.cache_read_input_tokens ?? 0);
    const p = price(m.model, ctx);
    const parts = {
      in: ((u.input_tokens ?? 0) * p.in) / 1e6,
      out: ((u.output_tokens ?? 0) * p.out) / 1e6,
      cr: ((u.cache_read_input_tokens ?? 0) * p.cr) / 1e6,
      cw: (h1 * p.cw1h + (cw - h1) * p.cw5) / 1e6,
    };
    const usd = parts.in + parts.out + parts.cr + parts.cw;
    for (const k of Object.keys(parts)) {
      R.parts[k] += parts[k];
    }
    if (isSub) {
      R.sub += usd;
      inc(
        R.subByType,
        `${agentType} on ${m.model.replace("claude-", "")}`,
        usd
      );
      continue;
    }
    R.main += usd;
    R.mainCr += parts.cr;
    peak = Math.max(peak, ctx);
    if (ctx > 200_000) {
      R.crAbove200 += parts.cr;
    }
    inc(
      R.activity,
      m.tools.length ? activityOf(m.tools[0]) : "reply / thinking",
      usd
    );
  }
  if (!isSub && msgs.size) {
    R.peaks.push(peak);
  }
}

// ---- Jev: which prompts correct earlier work, and why.
const KIND = {
  type: "choice",
  instructions:
    "Classify `user_message`, a person's reply to an AI coding assistant whose last words before it were `assistant_last_words`.",
  criteria: {
    correction:
      "Says the assistant's previous work, claim or plan was wrong, incomplete, missed something that was asked for, ignored an instruction or rule, or must be redone, reverted or restyled.",
    new_request:
      "Asks for new work or the next step, without saying that earlier work was wrong.",
    approval:
      "Approves, agrees, says go, or picks among options the assistant offered.",
    question:
      "Asks for information, an explanation or a status, with no complaint about earlier work.",
    other: "Tooling chores, tests of the setup, greetings, or anything else.",
  },
};
const CAUSE = {
  type: "choice",
  instructions:
    "Suppose `user_message` corrects the assistant's earlier work. What kind of miss is it? If it is not a correction, pick the closest kind anyway.",
  criteria: {
    design_judgment:
      "The visual or UX result was wrong: layout, hierarchy, spacing, alignment, styling, component choice or interaction.",
    instruction_ignored:
      "The assistant ignored or broke an explicit instruction, rule or earlier decision from the person, including doing more or less than asked.",
    missing_content:
      "The work left out something from the spec, PRD, ticket, mockup or request.",
    wrong_fact: "A claim, number, diagnosis or explanation was wrong.",
    broken_behavior:
      "Something does not work: a bug, an error, a failing build or test, a broken page.",
    process:
      "Workflow problems: git, commits, branches, agents, tools, permissions or how the assistant communicates.",
  },
};
const RESIDUE = new RegExp(
  `[\\w.+-]+@[\\w-]+\\.[a-z]{2,}|https?://|/Users/|\\bsk-ant-[A-Za-z0-9]{6,}|${os.userInfo().username}`,
  "i"
);

function jevKey() {
  if (process.env.TYPESAFE_API_KEY) {
    return process.env.TYPESAFE_API_KEY;
  }
  try {
    return readFileSync(path.join(ROOT, ".env.local"), "utf8")
      .match(/^TYPESAFE_API_KEY=(.*)$/m)?.[1]
      .trim()
      .replace(/^["']|["']$/g, "");
  } catch {
    return;
  }
}
async function judge(key, state, tries = 0) {
  const r = await fetch("https://api.typesafe.ai/v1/systemone", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "jev-latest",
      state,
      questions: { kind: KIND, cause: CAUSE },
    }),
  });
  if ((r.status === 429 || r.status >= 500) && tries < 6) {
    await new Promise((res) =>
      setTimeout(res, Number(r.headers.get("retry-after") ?? 2 ** tries) * 1000)
    );
    return judge(key, state, tries + 1);
  }
  if (!r.ok) {
    throw new Error(`HTTP ${r.status}`);
  }
  return (await r.json()).answers;
}
async function corrections() {
  const key = jevKey();
  if (!key) {
    return { skipped: "TYPESAFE_API_KEY not set (env or .env.local)" };
  }
  const items = R.prompts
    .filter(
      (p) =>
        p.text.length >= 15 &&
        !/^(re)?join\b|rejoin/i.test(p.text) &&
        !/^<path:[^>]+>$/.test(p.text)
    )
    .map((p) => ({
      assistant_last_words: p.prev || "(start of session)",
      user_message: p.text,
    }));
  const leak = items.find((s) => RESIDUE.test(JSON.stringify(s)));
  if (leak) {
    return {
      skipped: `aborted: unscrubbed text (${JSON.stringify(leak).match(RESIDUE)[0]})`,
    };
  }
  const out = { judged: 0, corrections: 0, causes: {}, errors: 0 };
  const queue = [...items];
  const worker = async () => {
    while (queue.length) {
      const state = queue.shift();
      try {
        const a = await judge(key, state);
        out.judged++;
        if (a.kind.choice === "correction") {
          out.corrections++;
          inc(out.causes, a.cause.choice);
        }
      } catch {
        out.errors++;
      }
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  return out;
}

// ---- Report.
const days = Math.max(
  1,
  Math.round((Math.min(until, Date.now()) - since) / DAY)
);
const peaks = [...R.peaks].sort((a, b) => a - b);
const q = (p) => peaks[Math.floor((peaks.length - 1) * p)] ?? 0;
const total = R.main + R.sub;
const snapshot = {
  window: `${new Date(since).toISOString().slice(0, 10)}..${new Date(until).toISOString().slice(0, 10)}`,
  days,
  usdPerDay: total / days,
  usd: total,
  mainUsd: R.main,
  subUsd: R.sub,
  parts: R.parts,
  sessions: R.sessions,
  subagents: R.subagents,
  peakP50: q(0.5),
  peakP90: q(0.9),
  peakMax: q(1),
  over250K: peaks.filter((x) => x > 250_000).length,
  crShareAbove200K: R.mainCr ? R.crAbove200 / R.mainCr : 0,
  activity: R.activity,
  subByType: R.subByType,
  blocks: R.blocks,
  rebuilt: Object.fromEntries(
    Object.entries(R.scratch).filter(([, n]) => n >= 3)
  ),
  jev: useJev ? await corrections() : { skipped: "--no-jev" },
};
mkdirSync(OUT_DIR, { recursive: true });
const basePath = path.join(OUT_DIR, "baseline.json");
const base = existsSync(basePath)
  ? JSON.parse(readFileSync(basePath, "utf8"))
  : null;
writeFileSync(
  path.join(OUT_DIR, `${new Date().toLocaleDateString("en-CA")}.json`),
  JSON.stringify(snapshot, null, 1)
);
if (!base) {
  writeFileSync(basePath, JSON.stringify(snapshot, null, 1));
}

const $ = (n) => `$${Math.round(n)}`;
const k = (n) => `${Math.round(n / 1000)}K`;
const pct = (n) => `${Math.round(n * 100)}%`;
const vs = (now, then, fmt) =>
  base && then !== undefined ? `${fmt(now)} (baseline ${fmt(then)})` : fmt(now);
const top = (o, n) =>
  Object.entries(o)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
const lines = [
  `Token report, ${snapshot.window} (${days} days)${base ? `, baseline ${base.window}` : ", saved as the baseline"}`,
  `Spend per day: ${vs(snapshot.usdPerDay, base?.usdPerDay, $)}  | total ${$(total)}: main ${$(R.main)}, subagents ${$(R.sub)}`,
  `By kind: cache reads ${$(R.parts.cr)}, cache writes ${$(R.parts.cw)}, output ${$(R.parts.out)}`,
  `Sessions ${R.sessions}, subagents ${R.subagents}. Peak context p50 ${k(q(0.5))}, p90 ${k(q(0.9))}, max ${k(q(1))}`,
  `Sessions past 250K: ${vs(snapshot.over250K, base?.over250K, String)}. Cache reads above 200K: ${vs(snapshot.crShareAbove200K, base?.crShareAbove200K, pct)}`,
  `Main-session calls: ${top(R.activity, 8)
    .map(([a, u]) => `${a} ${$(u)}`)
    .join(", ")}`,
  `Subagents: ${
    top(R.subByType, 6)
      .map(([a, u]) => `${a} ${$(u)}`)
      .join(", ") || "none"
  }`,
  `Blocked calls: ${
    top(R.blocks, 6)
      .map(([a, n]) => `${a} ${n}`)
      .join(", ") || "none"
  }`,
  `Scratch scripts written 3+ times: ${
    top(snapshot.rebuilt, 5)
      .map(([a, n]) => `${a} x${n}`)
      .join(", ") || "none"
  }`,
];
const j = snapshot.jev;
if (j.skipped) {
  lines.push(`Corrections: skipped (${j.skipped})`);
} else {
  const rate = j.judged ? j.corrections / j.judged : 0;
  const baseRate = base?.jev?.judged
    ? base.jev.corrections / base.jev.judged
    : undefined;
  lines.push(
    `Corrections (Jev): ${j.corrections} of ${j.judged} prompts, ${vs(rate, baseRate, pct)}. Causes: ${top(
      j.causes,
      6
    )
      .map(([c, n]) => `${c.replace("_", " ")} ${n}`)
      .join(", ")}${j.errors ? ` (${j.errors} Jev errors)` : ""}`
  );
}
console.log(lines.join("\n"));
