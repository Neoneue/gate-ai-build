#!/usr/bin/env node
// PreToolUse guard: the UI gate. Ported from the agent-room project on
// 2026-10-05. Reads the hook input on stdin and the transcript of the
// session or subagent making the call (transcriptPathOf: a subagent's hook
// input carries its agent_id, and its own transcript sits beside the
// parent's under <session_id>/subagents/).
//
// - UI files (isUiPath: src/components/, src/pages/, any src/ .tsx or .css
//   that is not a test, the root design.md) need four steps since this
//   session's last landed git commit (skillState): read the skills INDEX.md
//   (once per session), read the ux-laws skill, read visual-hierarchy, then
//   load ONE build skill picked from that index. One round covers one
//   change: after a commit, the next change does them again.
// - The gate covers every way a session writes a file: Write, Edit and
//   MultiEdit by path; Bash by its command (shellWritesUi: in-place sed or
//   perl, a redirect or tee into the file, cp/mv/rm/touch on it, a python,
//   node, ruby or awk write naming it); and, as the backstop for anything
//   the command text hides, a git commit whose staged files hold UI.
//   A UI commit also passes when one of this session's subagents loaded the
//   full set since the session's last landed commit (subagentCovers): the
//   subagent built the UI, the main session only commits it.
// - Other product code (src/, e2e/) needs the kit INDEX.md read once per
//   session, then a skill loaded after it. Reads through cat, sed, head and
//   the like count.
//
// Exit 2 blocks the call and tells the agent what to load. Anything it
// cannot read passes, so a broken hook never locks work.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const GUARDED = /(^|\/)(src|e2e)\//;

/** A UI file: changing it needs the ux-laws skill. */
export function isUiPath(file) {
  if (!file || /(^|\/)node_modules\//.test(file)) {
    return false;
  }
  // design.md and DESIGN.md are one file on this case-insensitive disk.
  if (/(^|\/)design\.md$/i.test(file)) {
    // The design contract, not a kit's or a skill's own design.md.
    return !/(^|\/)(agents|skills)\//.test(file);
  }
  if (!/(^|\/)src\//.test(file) || /\.test\.[jt]sx?$/.test(file)) {
    return false;
  }
  return (
    /(^|\/)src\/(components|pages)\//.test(file) || /\.(tsx|css)$/.test(file)
  );
}

const TARGET = String.raw`['"]?([^\s'";|&)<>]+)`;
const REDIRECT = new RegExp(String.raw`(?:^|[^0-9&>])>>?\s*${TARGET}`, "g");
const TEE = new RegExp(String.raw`\btee\b(?:\s+-\S+)*\s+${TARGET}`, "g");
const IN_PLACE = /\b(sed|perl)\b[^;|&]*\s(-[a-zA-Z]*i|--in-place)/;
const FILE_OP = /(^|[\s;|&(])(cp|mv|rm|touch|truncate|install|rsync|ln)\s/;
const SCRIPT = /\b(python3?|node|ruby|perl|awk|gawk|deno|bun)\b/;
const SCRIPT_WRITE =
  /write|open\([^)]*,\s*['"][wa+]|inplace|\.unlink|\.rename|copyFile/i;

/** The UI files a shell command names, by its words. */
function uiWords(command) {
  return command.split(/[\s'"`;|&()<>=,]+/).filter(isUiPath);
}

function targets(re, command) {
  return [...command.matchAll(re)].map((m) => m[1]);
}

/**
 * The UI files a script names as string literals ('src/index.css' in its
 * code). Its prose (a heredoc's text that mentions design.md) is not a file
 * it writes. Each quote kind is read on its own, so a literal inside a
 * python -c "..." still counts.
 */
function uiLiterals(command) {
  return [
    ...targets(/'([^'\n]*)'/g, command),
    ...targets(/"([^"\n]*)"/g, command),
  ]
    .map((s) => s.trim())
    .filter(isUiPath);
}

/** True when a shell command changes a UI file it names. */
export function shellWritesUi(command) {
  if (!command) {
    return false;
  }
  if (
    targets(REDIRECT, command).some(isUiPath) ||
    targets(TEE, command).some(isUiPath)
  ) {
    return true;
  }
  // sed -i, cp, mv and the like count only with the UI file in their own
  // segment, so a cp elsewhere in a chain beside a grep of a UI file passes.
  // A script is read whole: its code may hold ; and | of its own.
  const segmentWrites = command
    .split(/&&|\|\||[;|\n]/)
    .some(
      (part) =>
        uiWords(part).length > 0 && (IN_PLACE.test(part) || FILE_OP.test(part))
    );
  return (
    segmentWrites ||
    (SCRIPT.test(command) &&
      SCRIPT_WRITE.test(command) &&
      uiLiterals(command).length > 0)
  );
}

const COMMIT = /(^|[;&|(\s])git(\s+-[cC]\s+\S+)*\s+commit\b/;

/** A shell command that makes a git commit. */
export function isCommit(command) {
  return COMMIT.test(command ?? "");
}

function isUxLaws(name) {
  return name === "ux-laws" || String(name ?? "").endsWith(":ux-laws");
}

/** The UX skills, read before the one build skill (ux-laws, then visual-hierarchy). */
function uxKind(name) {
  const n = String(name ?? "").replace(/^.*:/, "");
  if (isUxLaws(n)) {
    return "ux";
  }
  return n === "visual-hierarchy" ? "vh" : null;
}

const UX_COMMAND = /<command-name>\/?ux-laws<\/command-name>/;
const INDEX_FILE = /skills\/INDEX\.md\b/;
// The index itself printed by a reader, not a pipe that only names it.
const INDEX_SHELL_READ =
  /\b(cat|sed|head|tail|less|bat)\b[^|;&]*skills\/INDEX\.md/;
// A kit skill printed by a reader counts as loading it, as a Read does.
const SKILL_SHELL_READ =
  /\b(?:cat|sed|head|tail|less|bat)\b[^|;&]*skills\/([^/\s"'|;&]+)\/SKILL\.md/;

/** The events that load a skill: the UX skills and any other. */
const SKILL_KINDS = ["ux", "vh", "build"];

/** One transcript event the gate reads, in order. */
function eventsOf(part) {
  const input = part.input ?? {};
  if (part.name === "Skill") {
    return [uxKind(input.skill) ?? "build"];
  }
  if (part.name === "Read") {
    const file = String(input.file_path ?? "");
    if (INDEX_FILE.test(file)) {
      return ["index"];
    }
    // A kit skill loads by reading its SKILL.md.
    const skill = file.match(/skills\/([^/"\n]+)\/SKILL\.md$/)?.[1];
    if (!skill) {
      return [];
    }
    return [uxKind(skill) ?? "build"];
  }
  if (part.name === "Bash") {
    const command = String(input.command ?? "");
    if (isCommit(command)) {
      return ["commit"];
    }
    const events = [];
    if (INDEX_SHELL_READ.test(command)) {
      events.push("index");
    }
    const skill = command.match(SKILL_SHELL_READ)?.[1];
    if (skill) {
      events.push(uxKind(skill) ?? "build");
    }
    return events;
  }
  return [];
}

/**
 * What the transcript says about skills: whether any skill was loaded, and,
 * since the last commit that landed, which of the UI gate's steps are
 * missing: "index" (read a skills INDEX.md), "ux-laws" (read it),
 * "visual-hierarchy" (read it), "pick" (load one build skill, after reading
 * the index). A commit counts once its result came back without an error,
 * so a blocked or failed commit, or the one being checked now, resets
 * nothing. `lastCommitAt` is when the last landed commit's result came back.
 * With `after` (a time from another transcript, in ms), a per-change step
 * counts only when it happened after it; an event with no timestamp then
 * never counts.
 */
export function skillState(text, { after = null } = {}) {
  const events = [];
  const landedAt = new Map();
  for (const line of text.split("\n")) {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    const content = entry?.message?.content;
    const parts = typeof content === "string" ? [content] : content;
    if (!Array.isArray(parts)) {
      continue;
    }
    const ts = Date.parse(entry.timestamp ?? "");
    for (const part of parts) {
      if (typeof part === "string" || part?.type === "text") {
        const said = typeof part === "string" ? part : (part.text ?? "");
        if (entry.type === "user" && UX_COMMAND.test(said)) {
          events.push({ kind: "ux", ts });
        }
      } else if (part?.type === "tool_result") {
        if (!part.is_error) {
          landedAt.set(part.tool_use_id, ts);
        }
      } else if (part?.type === "tool_use") {
        for (const kind of eventsOf(part)) {
          events.push({ id: part.id, kind, ts });
        }
      }
    }
  }
  const anySkill = events.some((e) => SKILL_KINDS.includes(e.kind));
  let from = 0;
  let lastCommitAt = null;
  events.forEach((e, i) => {
    if (e.kind === "commit" && landedAt.has(e.id)) {
      from = i + 1;
      lastCommitAt = landedAt.get(e.id);
    }
  });
  const fresh = (e, i) => i >= from && (after === null || e.ts > after);
  // The index is read once per session (a full re-read before every small
  // fix costs too much); the UX skills and the pick are per change, and the
  // pick still comes after the index.
  const indexAt = events.findIndex((e) => e.kind === "index");
  const missing = [];
  if (indexAt === -1) {
    missing.push("index");
  }
  if (!events.some((e, i) => e.kind === "ux" && fresh(e, i))) {
    missing.push("ux-laws");
  }
  if (!events.some((e, i) => e.kind === "vh" && fresh(e, i))) {
    missing.push("visual-hierarchy");
  }
  const picked = events.some(
    (e, i) => e.kind === "build" && fresh(e, i) && i > indexAt
  );
  if (indexAt === -1 || !picked) {
    missing.push("pick");
  }
  // Other product code: the index once per session, then any skill loaded
  // after it. Not reset by a commit, as the index is not.
  const codeMissing = [];
  if (indexAt === -1) {
    codeMissing.push("index");
  }
  if (!events.some((e, i) => i > indexAt && SKILL_KINDS.includes(e.kind))) {
    codeMissing.push("skill");
  }
  return { anySkill, missing, codeMissing, lastCommitAt };
}

/**
 * Whether one of this session's subagents loaded the full UI set since
 * `after` (the session's last landed commit, or null for none). Reads
 * <dir of transcript_path>/<session_id>/subagents/*.jsonl. With no such
 * folder, or nothing readable in it, nothing is credited: the commit is
 * judged on the committer's own transcript (fail closed).
 */
export function subagentCovers(input, after, { readTranscript, listDir }) {
  if (!(input.transcript_path && input.session_id)) {
    return false;
  }
  const dir = path.join(
    path.dirname(input.transcript_path),
    String(input.session_id),
    "subagents"
  );
  let files = [];
  try {
    files = listDir(dir).filter((f) => f.endsWith(".jsonl"));
  } catch {
    return false;
  }
  return files.some((f) => {
    try {
      return (
        skillState(readTranscript(path.join(dir, f)), { after }).missing
          .length === 0
      );
    } catch {
      return false;
    }
  });
}

/**
 * The transcript of whoever is making the call. Inside a subagent the hook
 * input names the parent's transcript in `transcript_path` and adds the
 * subagent's `agent_id`; the subagent's own transcript is
 * <dir of transcript_path>/<session_id>/subagents/agent-<agent_id>.jsonl.
 * Falls back to `transcript_path` when that file is missing.
 */
export function transcriptPathOf(input, exists = existsSync) {
  const main = input.transcript_path;
  if (!main) {
    return null;
  }
  if (input.agent_id && input.session_id) {
    const own = path.join(
      path.dirname(main),
      String(input.session_id),
      "subagents",
      `agent-${input.agent_id}.jsonl`
    );
    if (exists(own)) {
      return own;
    }
  }
  return main;
}

/** The folder a commit runs in: `git -C <dir>` beside the hook's cwd. */
function commitDir(command, cwd) {
  const m = command.match(/\bgit\s+-C\s+['"]?([^\s'"]+)/);
  return m ? path.resolve(cwd, m[1]) : cwd;
}

/** The files a commit would hold: staged, plus tracked changes with -a. */
function commitFiles(command, cwd) {
  const dir = commitDir(command, cwd);
  const run = (args) =>
    execFileSync("git", args, { cwd: dir, encoding: "utf8" })
      .split("\n")
      .filter(Boolean);
  const files = run(["diff", "--cached", "--name-only"]);
  if (/\scommit\b[^;|&]*\s(-[a-zA-Z]*a[a-zA-Z]*|--all)\b/.test(command)) {
    files.push(...run(["diff", "--name-only"]));
  }
  return files;
}

/**
 * The verdict for one hook input: null to pass, or why it is blocked.
 * `readTranscript`, `filesOf`, `exists` and `listDir` are passed in by tests.
 */
export function verdict(
  input,
  {
    readTranscript = (p) => readFileSync(p, "utf8"),
    filesOf = commitFiles,
    exists = existsSync,
    listDir = (d) => readdirSync(d),
  } = {}
) {
  const tool = input.tool_name;
  const toolInput = input.tool_input ?? {};
  let ui = null;
  let guarded = false;
  let commitUi = false;
  if (tool === "Bash") {
    const command = String(toolInput.command ?? "");
    if (shellWritesUi(command)) {
      ui =
        [
          ...targets(REDIRECT, command),
          ...targets(TEE, command),
          ...uiLiterals(command),
        ].find(isUiPath) ?? uiWords(command)[0];
    } else if (isCommit(command)) {
      let files = [];
      try {
        files = filesOf(command, input.cwd ?? process.cwd());
      } catch {
        return null;
      }
      ui = files.find(isUiPath) ?? null;
      commitUi = ui !== null;
    }
    if (!ui) {
      return null;
    }
  } else {
    const file = String(toolInput.file_path ?? toolInput.path ?? "");
    if (isUiPath(file)) {
      ui = file;
    } else if (GUARDED.test(file)) {
      guarded = true;
    } else {
      return null;
    }
  }
  const transcript = transcriptPathOf(input, exists);
  if (!(transcript && exists(transcript))) {
    return null;
  }
  let state;
  try {
    state = skillState(readTranscript(transcript));
  } catch {
    return null;
  }
  if (ui) {
    if (state.missing.length === 0) {
      return null;
    }
    if (commitUi) {
      // The session's last commit lives in the main transcript.
      let after = state.lastCommitAt;
      if (transcript !== input.transcript_path) {
        try {
          after = skillState(
            readTranscript(input.transcript_path)
          ).lastCommitAt;
        } catch {
          return uiMessage(ui, state.missing, true);
        }
      }
      if (subagentCovers(input, after, { readTranscript, listDir })) {
        return null;
      }
    }
    return uiMessage(ui, state.missing, commitUi);
  }
  return guarded && state.codeMissing.length > 0
    ? codeMessage(state.codeMissing)
    : null;
}

const STEP = {
  index:
    "read the skills INDEX.md in full, once this session (Read agents/front-end-developer/skills/INDEX.md)",
  "ux-laws":
    "read the ux-laws skill by path (Read agents/front-end-developer/skills/ux-laws/SKILL.md) and write its gate: the job, the path, the expectation; each law the change touches; the corrected patterns that apply",
  "visual-hierarchy":
    "load visual-hierarchy, the second UX skill (Read agents/front-end-developer/skills/visual-hierarchy/SKILL.md), and give every element its tier",
  pick: "after reading the index, load the ONE build skill that fits this job (for example shadcn for a component or a button, ask-sonner for a toast): Read agents/front-end-developer/skills/<name>/SKILL.md. One build skill, not several",
};

function uiMessage(file, missing, commit = false) {
  const steps = missing.map((m, i) => `${i + 1}. ${STEP[m]}.`).join(" ");
  return (
    `Blocked (UI gate): this changes UI (${file}). Still missing: ${steps} ` +
    "Then retry. The index is read once per session; ux-laws, visual-hierarchy and the pick cover your work until your next commit, then repeat for the next change. " +
    (commit
      ? "A commit also passes when one of this session's subagents loaded all four since the last commit. "
      : "") +
    "Shell edits and commits of UI files are checked too. Name the skill you picked in your report.\n"
  );
}

const CODE_STEP = {
  index:
    "read your kit's skills INDEX.md in full, once this session (agents/<your-agent>/skills/INDEX.md, or .claude/skills/INDEX.md)",
  skill:
    "after reading the index, load the skill it names for this job (read its SKILL.md with Read, cat or sed -n, or the Skill tool for a general skill)",
};

function codeMessage(missing) {
  const steps = missing.map((m, i) => `${i + 1}. ${CODE_STEP[m]}.`).join(" ");
  return (
    `Blocked (skill gate): load the right skill before editing product code. Still missing: ${steps} ` +
    "Then retry. Both hold for the rest of the session. Name the skill in your report.\n"
  );
}

function main() {
  let input = {};
  try {
    input = JSON.parse(readFileSync(0, "utf8"));
  } catch {
    process.exit(0);
  }
  const why = verdict(input);
  if (why) {
    process.stderr.write(why);
    process.exit(2);
  }
  process.exit(0);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
