#!/usr/bin/env node
// ux-designer plugin hook: one script for every event (hooks/hooks.json).
//
// The designer must design before it builds. For an agent_type ending in
// "designer" from this plugin, UI file writes are blocked until:
//   1. a valid spec file (design-spec*.md) was written this session
//      (validateSpec: five sections, moments, single value homes, two
//      candidates, a Precedent URL that was fetched or searched), and
//   2. the owner replied AFTER that spec (a UserPromptSubmit later than the
//      spec write), unless UX_DESIGNER_MODE says otherwise:
//        spec-only    -> UI writes always blocked (unattended spec tests)
//        auto-approve -> the reply is not required (unattended build tests)
// A "Tiny:" one-line spec unlocks one UI file. Stop is blocked (twice at
// most) when UI changed but the duplicate check or the reviewer never ran.
//
// State lives per session in ${CLAUDE_PLUGIN_DATA}/sessions/<id>.json. The
// transcript is never read (it is written asynchronously and can lag).
// Anything unreadable passes: a broken hook must not lock work.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const MOMENTS = [
  "always",
  "interaction",
  "error",
  "elsewhere",
  "cut",
  "deferred",
];
const SECTIONS = [
  "Requirements",
  "Surface",
  "Values",
  "Candidates",
  "Decision",
];
const UI_FILE = /\.(tsx|jsx|vue|svelte|astro|css|scss|less|html)$/i;
const NOT_UI =
  /(^|\/)(node_modules|dist|build|\.git)\/|\.(test|spec|stories)\.[a-z]+$/i;
const SPEC_FILE = /^design-spec[\w.-]*\.md$/i;

export function isUiPath(file) {
  return Boolean(file) && UI_FILE.test(file) && !NOT_UI.test(file);
}

export function isSpecPath(file) {
  return Boolean(file) && SPEC_FILE.test(path.basename(file));
}

export function isDesigner(agentType) {
  return /^(ux-designer:)?designer$/.test(String(agentType ?? ""));
}

/**
 * Whether this hook call is held to design-before-build: a designer agent,
 * an agent type the project lists in UX_DESIGNER_GATE_AGENTS (comma
 * separated), or the main session itself (no agent_type, no agent_id) when
 * the project sets UX_DESIGNER_GATE_MAIN=1.
 */
export function isGated(input, env = process.env) {
  if (isDesigner(input.agent_type)) {
    return true;
  }
  const listed = String(env.UX_DESIGNER_GATE_AGENTS ?? "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
  if (input.agent_type && listed.includes(input.agent_type)) {
    return true;
  }
  return (
    env.UX_DESIGNER_GATE_MAIN === "1" && !input.agent_type && !input.agent_id
  );
}

/**
 * URLs a fetch tool looked up: WebFetch's url, or an MCP fetch or scrape
 * tool's url / requests[].url (hosts can redirect WebFetch to one).
 */
export function fetchedUrls(name, toolInput) {
  const ti = toolInput ?? {};
  if (name === "WebFetch" || /^mcp__.*(fetch|scrape)/i.test(name)) {
    const urls = [ti.url, ...(ti.requests ?? []).map((r) => r?.url)];
    return urls.filter((u) => typeof u === "string" && u);
  }
  return [];
}

/** An owner reply that approves a spec: a literal "go" or "approved". */
export function isApproval(prompt) {
  const p = String(prompt ?? "").trim();
  return (
    /^(go|approved?|lgtm|ship it|build it)\b/i.test(p) ||
    /\b(go|approved)[.!]?$/i.test(p)
  );
}

function isPluginAgent(agentType) {
  return /^(ux-designer:)?(designer|reviewer)$/.test(String(agentType ?? ""));
}

/** Normalised URL for matching a Precedent link against fetched ones. */
export function normUrl(u) {
  return String(u)
    .trim()
    .replace(/[)>\].,;'"`]+$/, "")
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/[#?].*$/, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

function urlsIn(text) {
  return [...String(text).matchAll(/https?:\/\/[^\s)>\]"'`|]+/gi)].map(
    (m) => m[0]
  );
}

function section(text, name) {
  const re = new RegExp(
    `^##\\s+${name}\\s*$([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`,
    "im"
  );
  const m = text.match(re);
  return m ? m[1] : null;
}

function table(sectionText) {
  const lines = String(sectionText ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|"));
  const cells = (l) =>
    l
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
  if (lines.length < 2) {
    return { header: [], rows: [] };
  }
  const header = cells(lines[0]).map((h) => h.toLowerCase());
  const rows = lines
    .slice(1)
    .filter((l) => !/^\|[\s:|-]+\|?$/.test(l))
    .map(cells);
  return { header, rows };
}

const col = (header, re) => header.findIndex((h) => re.test(h));

const PATTERNS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "skills",
  "patterns"
);

/** The patterns library entries: skills/patterns/*.md, not its SKILL.md. */
export function patternEntries(dir = PATTERNS_DIR) {
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".md") && f !== "SKILL.md");
  } catch {
    return [];
  }
}

/**
 * Validates a spec. Returns { valid, tiny, errors }. `fetched` is the list
 * of URLs fetched or seen in search results this session; `entries` the
 * patterns library files the Precedent line must cite one of.
 */
export function validateSpec(text, fetched = [], entries = patternEntries()) {
  const body = String(text ?? "").trim();
  if (/^Tiny:\s*\S.{8,}$/.test(body) && !body.includes("\n")) {
    return { valid: true, tiny: true, errors: [] };
  }
  const errors = [];
  for (const name of SECTIONS) {
    if (section(body, name) === null) {
      errors.push(`Missing section "## ${name}".`);
    }
  }
  const req = table(section(body, "Requirements"));
  if (req.rows.length === 0) {
    errors.push("Requirements: add one row per brief line.");
  } else {
    const mi = col(req.header, /moment/);
    const ri = col(req.header, /reason/);
    if (mi < 0) {
      errors.push("Requirements: needs a Moment column.");
    } else {
      req.rows.forEach((r, i) => {
        const m = String(r[mi] ?? "")
          .toLowerCase()
          .replace(/[`*]/g, "")
          .trim();
        if (!MOMENTS.includes(m)) {
          errors.push(
            `Requirements row ${i + 1}: Moment "${r[mi] ?? ""}" is not one of ${MOMENTS.join(", ")}.`
          );
        } else if (
          (m === "cut" || m === "deferred") &&
          (ri < 0 || !String(r[ri] ?? "").trim())
        ) {
          errors.push(`Requirements row ${i + 1}: a ${m} row needs a Reason.`);
        }
      });
    }
  }
  const surface = table(section(body, "Surface"));
  if (surface.rows.length < 3) {
    errors.push(
      "Surface: list every element on the surface (at least 3 rows), existing ones included."
    );
  } else {
    const si = col(surface.header, /says/);
    if (si < 0) {
      errors.push('Surface: needs a "Says (only here)" column.');
    } else {
      surface.rows.forEach((r, i) => {
        if (!String(r[si] ?? "").trim()) {
          errors.push(
            `Surface row ${i + 1} (${r[0] ?? "?"}): say what only this element says, or cut it.`
          );
        }
      });
    }
  }
  const values = table(section(body, "Values"));
  const seen = new Map();
  for (const r of values.rows) {
    const key = String(r[0] ?? "")
      .toLowerCase()
      .replace(/\(.*?\)/g, "")
      .replace(/[^a-z0-9 ]/g, "")
      .trim();
    if (!key) {
      continue;
    }
    if (seen.has(key)) {
      errors.push(`Values: "${r[0]}" is listed twice; one value, one home.`);
    }
    seen.set(key, true);
  }
  if (values.rows.length === 0 && section(body, "Values") !== null) {
    errors.push(
      "Values: list every number, date, limit and name the surface shows, with its one home."
    );
  }
  const candidates = (
    String(section(body, "Candidates") ?? "").match(/^###\s+\S/gm) || []
  ).length;
  if (candidates < 2) {
    errors.push(
      "Candidates: sketch at least two structures (### A, ### B) before choosing."
    );
  }
  const decision = String(section(body, "Decision") ?? "");
  if (!/^\s*Chosen:\s*\S/m.test(decision)) {
    errors.push('Decision: add a "Chosen:" line.');
  }
  if (!/^\s*Rejected:\s*\S/m.test(decision)) {
    errors.push(
      'Decision: add a "Rejected:" line (a design with no rejected alternative was defaulted).'
    );
  }
  const precedent = decision.match(/^\s*Precedent:\s*(.+)$/m);
  if (precedent) {
    const links = urlsIn(precedent[1]);
    const known = new Set(fetched.map(normUrl));
    if (links.length === 0) {
      errors.push("Decision: the Precedent line needs the URL you looked up.");
    } else if (!links.some((u) => known.has(normUrl(u)))) {
      errors.push(
        "Decision: the Precedent URL was not fetched or returned by a search this session. Look it up with WebFetch or WebSearch first; a precedent from memory does not count."
      );
    }
    // The library holds the owner's corrections; a spec that skips it can
    // repeat one (owner 2026-10-10).
    const cited =
      entries.some((e) => precedent[1].includes(e)) ||
      /none fits:\s*\S/i.test(precedent[1]);
    if (entries.length > 0 && !cited) {
      errors.push(
        `Decision: the Precedent line must name the patterns entry it follows (one of: ${entries.join(", ")}), or say "none fits:" and why.`
      );
    }
  } else {
    errors.push('Decision: add a "Precedent:" line.');
  }
  return { valid: errors.length === 0, tiny: false, errors };
}

/* ─── State ─────────────────────────────────────────────────────────────── */

function stateFile(sessionId, env = process.env) {
  const dir = path.join(
    env.CLAUDE_PLUGIN_DATA || path.join(os.tmpdir(), "ux-designer"),
    "sessions"
  );
  fs.mkdirSync(dir, { recursive: true });
  return path.join(
    dir,
    `${String(sessionId || "nosession").replace(/[^\w-]/g, "_")}.json`
  );
}

export function emptyState() {
  return {
    spec: null,
    prompts: [],
    fetched: [],
    uiEdits: [],
    verify: { dupCheck: false, reviewer: false },
    stopBlocksBy: {},
    // Set by the first feature-size UI write; cleared by a commit.
    feature: false,
  };
}

function load(file) {
  try {
    return { ...emptyState(), ...JSON.parse(fs.readFileSync(file, "utf8")) };
  } catch {
    return emptyState();
  }
}

/* ─── Decisions (pure, unit-tested) ─────────────────────────────────────── */

/**
 * The files a shell command WRITES: redirect and tee targets, in-place
 * editors' files, cp's destination, mv's paths, touch, and any file named
 * by an inline writeFile. Quoted strings are dropped first, so a grep
 * pattern containing ">" is not a redirect.
 */
export function bashWriteTargets(command) {
  const cmd = String(command ?? "");
  const bare = cmd.replace(/'[^']*'|"[^"]*"/g, " ");
  const out = [];
  for (const m of bare.matchAll(/(?:^|[^0-9&>])>>?\s*([^\s;|&<>]+)/g)) {
    out.push(m[1]);
  }
  for (const m of bare.matchAll(/\btee\s+(?:-a\s+)?([^\s;|&]+)/g)) {
    out.push(m[1]);
  }
  for (const seg of bare.split(/[;|&]+/)) {
    const words = seg.trim().split(/\s+/).filter(Boolean);
    const [bin, ...args] = words;
    const files = args.filter((a) => !a.startsWith("-"));
    if (
      /^(sed|perl)$/.test(bin ?? "") &&
      args.some((a) => /^-[a-zA-Z]*i/.test(a) || a === "--in-place")
    ) {
      out.push(...files);
    } else if (bin === "cp" || bin === "install" || bin === "rsync") {
      out.push(...files.slice(-1));
    } else if (bin === "mv" || bin === "touch") {
      out.push(...files);
    }
  }
  if (/writeFile|open\([^)]*['"]w/.test(cmd)) {
    out.push(
      ...[...cmd.matchAll(/[\w@~./-]+\.[a-z]{2,6}\b/gi)].map((m) => m[0])
    );
  }
  return out;
}

function targetsOf(input) {
  const ti = input.tool_input ?? {};
  if (input.tool_name === "Bash") {
    return bashWriteTargets(ti.command).filter(isUiPath);
  }
  return [ti.file_path ?? ti.path].filter(Boolean);
}

/** One edit larger than this many changed lines is feature-size. */
export const FEATURE_LINES = 40;

const lineCount = (t) => (t ? String(t).split("\n").length : 0);

/** Lines added plus lines removed between two texts, as git counts them. */
export function lineDiff(before, after) {
  const left = new Map();
  for (const l of String(before ?? "").split("\n")) {
    left.set(l, (left.get(l) ?? 0) + 1);
  }
  let added = 0;
  for (const l of String(after ?? "").split("\n")) {
    const n = left.get(l) ?? 0;
    if (n > 0) {
      left.set(l, n - 1);
    } else {
      added += 1;
    }
  }
  let removed = 0;
  for (const n of left.values()) {
    removed += n;
  }
  return added + removed;
}

/**
 * Whether a UI write is feature-size: it creates a UI file, or this one
 * edit changes more than FEATURE_LINES lines. Small edits need no spec, and
 * a run of them never adds up to one (owner 2026-10-10).
 */
export function isFeatureEdit(input, ui, env = process.env) {
  const limit = Number(env.UX_DESIGNER_FEATURE_LINES) || FEATURE_LINES;
  const cwd = input.cwd ?? process.cwd();
  if (ui.some((f) => !fs.existsSync(path.resolve(cwd, f)))) {
    return true;
  }
  const ti = input.tool_input ?? {};
  let lines = 0;
  if (input.tool_name === "Write") {
    let before = "";
    try {
      before = fs.readFileSync(path.resolve(cwd, ti.file_path), "utf8");
    } catch {
      before = "";
    }
    lines = lineDiff(before, ti.content);
  } else if (input.tool_name === "Edit") {
    lines = lineCount(ti.old_string) + lineCount(ti.new_string);
  } else if (input.tool_name === "MultiEdit") {
    for (const e of ti.edits ?? []) {
      lines += lineCount(e?.old_string) + lineCount(e?.new_string);
    }
  }
  return lines > limit;
}

/** PreToolUse: returns null to allow, or a reason string to block. */
export function preToolUse(input, state, env = process.env, now = Date.now()) {
  if (!isGated(input, env)) {
    return null;
  }
  const ui = targetsOf(input).filter((f) => isUiPath(f) && !isSpecPath(f));
  if (ui.length === 0) {
    return null;
  }
  const mode = env.UX_DESIGNER_MODE || "";
  if (mode === "spec-only") {
    return "Spec-only run: UI files stay locked. Write the spec (design-spec skill), present it, and stop.";
  }
  if (!state.feature) {
    if (!isFeatureEdit(input, ui, env)) {
      return null;
    }
    state.feature = true;
  }
  const spec = state.spec;
  if (!spec?.valid) {
    const why = spec?.errors?.length ? ` Fix: ${spec.errors.join(" ")}` : "";
    return `Design before build: this is feature-size UI work (a new UI file, or one edit over ${Number(env.UX_DESIGNER_FEATURE_LINES) || FEATURE_LINES} lines). Load the ux-designer:design-spec skill and write a valid spec first (Requirements, Surface, Values, Candidates, Decision) to design-spec.md in your scratchpad.${why}`;
  }
  const replies = state.prompts.filter((p) => p.t > spec.at);
  // A Tiny spec records a change the owner fully specified: their instruction
  // is the approval, so it needs no second round.
  const approved =
    mode === "auto-approve" || spec.tiny || replies.some((p) => p.approve);
  if (!approved) {
    return replies.length
      ? 'The owner replied after the spec but did not approve it (no "go" or "approved"). Apply their reply to the spec, present it again, and end your turn.'
      : "The spec is valid but the owner has not replied since you wrote it. Present the spec and end your turn; their reply unlocks the build (or tells you what to change).";
  }
  if (spec.tiny) {
    const allowed = spec.tinyFile ?? ui[0];
    const other = ui.find((f) => path.resolve(f) !== path.resolve(allowed));
    if (other) {
      return `A Tiny spec unlocks one file (${allowed}). ${other} needs a full spec.`;
    }
  }
  void now;
  return null;
}

/** Who is stopping: a subagent by its id, or the main session. */
const stopper = (input) => input.agent_id || "main";

/**
 * Stop / SubagentStop: returns null to allow, or a reason to keep going.
 * A subagent cannot start another agent, so it owes only the duplicate check
 * and hands the review to the main session, which owns the reviewer for all
 * feature work in its session (the state is shared by session id). Each
 * stopper has its own two-block budget, so a subagent cannot spend the main
 * session's.
 */
export function stopCheck(input, state, env = process.env) {
  const blocks = state.stopBlocksBy?.[stopper(input)] ?? 0;
  if (input.stop_hook_active || blocks >= 2) {
    return null;
  }
  if (
    (env.UX_DESIGNER_MODE || "") === "spec-only" ||
    !state.feature ||
    state.uiEdits.length === 0 ||
    state.spec?.tiny
  ) {
    return null;
  }
  const dupCheck =
    "run the duplicate checker on each changed surface (design-spec skill, Verify step 2)";
  if (input.agent_id) {
    if (!isGated(input, env) || state.verify.dupCheck) {
      return null;
    }
    return `Not done yet: ${dupCheck}. Then report spec line by line, and say that the ux-designer reviewer is still owed: the main session starts it.`;
  }
  const missing = [];
  if (!state.verify.dupCheck) {
    missing.push(dupCheck);
  }
  if (!state.verify.reviewer) {
    missing.push(
      "spawn ux-designer:reviewer with the spec, screenshots and changed files (Verify step 3)"
    );
  }
  return missing.length
    ? `Not done yet: ${missing.join("; ")}. Then report spec line by line.`
    : null;
}

/** PostToolUse: updates state; returns { context?, block? }. */
export function postToolUse(input, state, now = Date.now(), env = process.env) {
  const ti = input.tool_input ?? {};
  const name = input.tool_name;
  state.fetched.push(...fetchedUrls(name, ti));
  if (name === "WebSearch") {
    state.fetched.push(...urlsIn(JSON.stringify(input.tool_response ?? "")));
  }
  if (name === "Bash") {
    const cmd = String(ti.command ?? "");
    if (/dup-check\.mjs/.test(cmd)) {
      state.verify.dupCheck = true;
    }
    // A commit closes the piece of work: the next feature needs its own spec.
    if (/\bgit\b[^;&|]*\bcommit\b/.test(cmd)) {
      Object.assign(state, {
        spec: null,
        feature: false,
        uiEdits: [],
        verify: { dupCheck: false, reviewer: false },
        stopBlocksBy: {},
      });
    }
    const changed = input.tool_response?.bashEditDiff;
    if (Array.isArray(changed)) {
      for (const c of changed) {
        const f = c?.path ?? c?.file ?? c;
        if (isUiPath(String(f))) {
          state.uiEdits.push(String(f));
        }
      }
    }
  }
  if (name === "Agent" && /reviewer/.test(String(ti.subagent_type ?? ""))) {
    state.verify.reviewer = true;
  }
  if (["Write", "Edit", "MultiEdit"].includes(name)) {
    const file = ti.file_path ?? "";
    if (isSpecPath(file)) {
      let text = "";
      try {
        text = fs.readFileSync(file, "utf8");
      } catch {
        text = String(ti.content ?? ti.new_string ?? "");
      }
      const v = validateSpec(text, state.fetched);
      state.spec = {
        path: file,
        at: now,
        valid: v.valid,
        tiny: v.tiny,
        errors: v.errors,
        tinyFile: null,
      };
      state.verify = { dupCheck: false, reviewer: false };
      state.uiEdits = [];
      state.stopBlocksBy = {};
      if (!v.valid) {
        return { block: `Spec not valid yet:\n- ${v.errors.join("\n- ")}` };
      }
      if ((env.UX_DESIGNER_MODE || "") === "auto-approve") {
        return {
          context:
            "Spec valid. Build it now, exactly as specified. In your report, after the build, add three lines: what was cut, the precedent, the rejected alternative.",
        };
      }
      return {
        context: v.tiny
          ? "Tiny spec recorded. Show it to the owner in one line and stop; their reply unlocks that one file."
          : "Spec valid. Present it to the owner (Requirements with cuts and moves first, Values, the chosen wireframe, the Decision) and end your turn. Their reply unlocks UI files.",
      };
    }
    if (isUiPath(file) && isGated(input, env)) {
      state.uiEdits.push(file);
      if (state.spec?.tiny && !state.spec.tinyFile) {
        state.spec.tinyFile = file;
      }
    }
  }
  return {};
}

/* ─── Main ──────────────────────────────────────────────────────────────── */

function out(obj) {
  process.stdout.write(JSON.stringify(obj));
}

function main() {
  let input;
  try {
    input = JSON.parse(fs.readFileSync(0, "utf8"));
  } catch {
    return;
  }
  const ev = input.hook_event_name;
  let file;
  try {
    file = stateFile(input.session_id);
  } catch {
    return;
  }
  const state = load(file);
  const save = () => {
    try {
      fs.writeFileSync(file, JSON.stringify(state));
    } catch {
      // fail open
    }
  };

  if (ev === "SessionStart" || ev === "SubagentStart") {
    if (isPluginAgent(input.agent_type) || isGated(input)) {
      const mode = process.env.UX_DESIGNER_MODE
        ? ` Mode: ${process.env.UX_DESIGNER_MODE}.`
        : "";
      out({
        hookSpecificOutput: {
          hookEventName: ev,
          additionalContext: `ux-designer plugin root: ${process.env.CLAUDE_PLUGIN_ROOT ?? "(unknown)"}. Write specs to design-spec.md in your scratchpad directory${input.scratchpad_dir ? ` (${input.scratchpad_dir})` : ""}. Small UI edits need no spec. Feature-size work (a new UI file, or one edit over ${FEATURE_LINES} changed lines) starts with the ux-designer:design-spec skill: think through the whole surface, write the spec, then build.${mode}`,
        },
      });
    }
    return;
  }
  if (ev === "UserPromptSubmit") {
    state.prompts.push({ t: Date.now(), approve: isApproval(input.prompt) });
    save();
    return;
  }
  if (ev === "PreToolUse") {
    const wasFeature = state.feature;
    const reason = preToolUse(input, state);
    if (state.feature !== wasFeature) {
      save();
    }
    if (reason) {
      process.stderr.write(`Blocked (ux-designer): ${reason}`);
      process.exit(2);
    }
    return;
  }
  if (ev === "PostToolUse") {
    const res = postToolUse(input, state);
    save();
    if (res.block) {
      out({ decision: "block", reason: res.block });
    } else if (res.context) {
      out({
        hookSpecificOutput: {
          hookEventName: "PostToolUse",
          additionalContext: res.context,
        },
      });
    }
    return;
  }
  if (ev === "Stop" || ev === "SubagentStop") {
    const reason = stopCheck(input, state);
    if (reason) {
      const who = stopper(input);
      state.stopBlocksBy = {
        ...state.stopBlocksBy,
        [who]: (state.stopBlocksBy?.[who] ?? 0) + 1,
      };
      save();
      out({ decision: "block", reason });
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main();
}
