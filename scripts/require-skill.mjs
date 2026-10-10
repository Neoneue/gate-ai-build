#!/usr/bin/env node
// PreToolUse guard: the UI gate. Ported from the agent-room project on
// 2026-10-05. Reads the hook input on stdin and the transcript of the
// session or subagent making the call (transcriptPathOf: a subagent's hook
// input carries its agent_id, and its own transcript sits beside the
// parent's under <session_id>/subagents/).
//
// - UI files (isUiPath: src/components/, src/pages/, any src/ .tsx or .css
//   that is not a test, the root design.md) need four steps, IN ORDER, since
//   this session's last landed git commit (skillState): read the skills
//   INDEX.md (once per session), read the ux-laws skill, read
//   visual-hierarchy, then load ONE build skill picked from that index. No
//   write-up: feature-size work gets its spec from the ux-designer plugin
//   (owner 2026-10-10).
//   UX before UI: a step out of order does not count. One round covers one
//   change: after a commit, the next change does them again.
// - A motion edit (isMotionEdit: the text it adds or removes holds
//   keyframes, an animation or transition, GSAP or motion/react, or the file
//   is named for motion), by any writer, also needs, after the index and
//   before ux-laws, agents/animator/knowledge/working-rules.md (once per
//   session), then motion-ux-laws (per change): the animator kit's order
//   steps 0 and 1. The review steps after it are require-motion-review.mjs's
//   job. Who edits does not matter; what the edit holds does.
// - The gate covers every way a session writes a file: Write, Edit and
//   MultiEdit by path; Bash by its command (shellWritesUi: in-place sed or
//   perl, a redirect or tee into the file, cp/mv/rm/touch on it, a python,
//   node, ruby or awk write naming it); and, as the backstop for anything
//   the command text hides, a git commit whose staged files hold UI.
//   A UI commit also passes when one of this session's subagents loaded the
//   full set since the session's last landed commit (subagentCovers): the
//   subagent built the UI, the main session only commits it.
// - Every other write inside the project (inRepo) needs the writer's OWN
//   kit INDEX.md read once per session (kitOf: by the hook input's
//   agent_type; designer uses front-end-developer's; the main session,
//   seats and general-purpose may read any index), then one skill that
//   index names, loaded after it and since the last landed commit (a new
//   pick per change; change-logs/ is exempt so /commit can stamp it).
//   impeccable-* agents are exempt. Reads
//   through cat, sed, head and the like count.
//
// Exit 2 blocks the call and tells the agent what to load. Anything it
// cannot read passes, so a broken hook never locks work.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Any file in the project counts as work: every agent picks its skill before
 * writing one. Outside the project (scratchpad, memory, /tmp), git's own
 * folder and node_modules are not gated.
 */
export function inRepo(file, root) {
  if (!file) {
    return false;
  }
  const abs = path.resolve(root, file);
  const rel = path.relative(path.resolve(root), abs);
  if (rel === "" || rel.startsWith("..") || path.isAbsolute(rel)) {
    return false;
  }
  return !/(^|\/)(\.git|node_modules)\//.test(`${rel}/`);
}

/**
 * The changelog is stamped by /commit right after its feature commit, when
 * the per-change skill pick has just reset; it is not new work.
 */
function isChangelog(file, root) {
  const rel = path.relative(path.resolve(root), path.resolve(root, file));
  return rel.startsWith(`change-logs${path.sep}`);
}

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
/** Which kit an INDEX.md path belongs to: agents/<kit>/, else "general". */
function kitOfIndex(text) {
  return (
    String(text).match(/agents\/([^/\s"'|;&]+)\/skills\/INDEX\.md/)?.[1] ??
    "general"
  );
}

/**
 * The project's agent kits (agents/<kit>/skills/INDEX.md). An agent of one
 * of these types must read its own kit's index; designer works from the
 * front-end-developer kit. Any other writer (the main session, a room seat,
 * general-purpose) may read any index.
 */
const KITS = new Set([
  "animator",
  "architect",
  "backend-engineer",
  "copywriter",
  "front-end-developer",
  "orchestrator",
  "researcher",
  "security-reviewer",
  "tester",
]);
export function kitOf(agentType) {
  const t = String(agentType ?? "");
  if (t === "designer") {
    return "front-end-developer";
  }
  return KITS.has(t) ? t : null;
}
/** Vendored agents with no kit of their own: not gated. */
const EXEMPT_AGENT = /^impeccable-/;
// A kit skill printed by a reader counts as loading it, as a Read does.
const SKILL_SHELL_READ =
  /\b(?:cat|sed|head|tail|less|bat)\b[^|;&]*skills\/([^/\s"'|;&]+)\/SKILL\.md/;
// The animator's working rules, read before its first build of a session.
const RULES_FILE = /agents\/animator\/knowledge\/working-rules\.md\b/;
const RULES_SHELL_READ =
  /\b(?:cat|sed|head|tail|less|bat)\b[^|;&]*agents\/animator\/knowledge\/working-rules\.md/;

/** The events that load a skill: the UX skills and any other. */
const SKILL_KINDS = ["ux", "vh", "build"];

/** One transcript event the gate reads, in order. */
function skillEvent(name) {
  const skill = String(name ?? "").replace(/^.*:/, "");
  return { kind: uxKind(skill) ?? "build", skill };
}

function eventsOf(part) {
  const input = part.input ?? {};
  // The gate written to a file (Write, or an Edit whose new text holds it).
  // Reply text after a tool result can stay off disk until the turn ends;
  // a tool call is on disk at once, so this is the reliable route.
  if (part.name === "Skill") {
    return [skillEvent(input.skill)];
  }
  if (part.name === "Read") {
    const file = String(input.file_path ?? "");
    if (INDEX_FILE.test(file)) {
      return [{ kind: "index", kit: kitOfIndex(file) }];
    }
    if (RULES_FILE.test(file)) {
      return [{ kind: "rules" }];
    }
    // A kit skill loads by reading its SKILL.md.
    const skill = file.match(/skills\/([^/"\n]+)\/SKILL\.md$/)?.[1];
    return skill ? [skillEvent(skill)] : [];
  }
  if (part.name === "Bash") {
    const command = String(input.command ?? "");
    if (isCommit(command)) {
      return [{ kind: "commit" }];
    }
    const events = [];
    if (INDEX_SHELL_READ.test(command)) {
      events.push({ kind: "index", kit: kitOfIndex(command) });
    }
    if (RULES_SHELL_READ.test(command)) {
      events.push({ kind: "rules" });
    }
    // Every SKILL.md the command prints counts, in the order it names them.
    for (const m of command.matchAll(new RegExp(SKILL_SHELL_READ, "g"))) {
      events.push(skillEvent(m[1]));
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
 * never counts. With `motion` (the write being judged is motion work), the
 * UI steps also need, between the index and ux-laws, "working-rules" (once
 * per session) and then "motion-ux-laws" (per change).
 */
export function skillState(
  text,
  { after = null, kit = null, allows = null, motion = false } = {}
) {
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
          events.push({ kind: "ux", skill: "ux-laws", ts });
        }
      } else if (part?.type === "tool_result") {
        if (!part.is_error) {
          landedAt.set(part.tool_use_id, ts);
        }
      } else if (part?.type === "tool_use") {
        for (const ev of eventsOf(part)) {
          events.push({ id: part.id, ...ev, ts });
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
  // fix costs too much); the rest is per change and must come in order:
  // UX first (ux-laws, then visual-hierarchy),
  // UI after (one build skill). A step out of order does not count.
  // A kit agent's index is its own kit's; another kit's does not count.
  const indexAt = events.findIndex(
    (e) => e.kind === "index" && (kit === null || e.kit === kit)
  );
  // A pick is a skill the agent's own index names (when it could be read).
  const named = (e) => allows === null || allows(e.skill);
  const nextAfter = (kind, from) =>
    from === -1
      ? -1
      : events.findIndex((e, i) => e.kind === kind && fresh(e, i) && i > from);
  // A motion edit adds the animator kit's first steps: working rules (once
  // per session), then motion-ux-laws, before the front-end UX steps.
  const rulesAt =
    !motion || indexAt === -1
      ? indexAt
      : events.findIndex((e, i) => e.kind === "rules" && i > indexAt);
  const muxAt =
    !motion || rulesAt === -1
      ? rulesAt
      : events.findIndex(
          (e, i) => e.skill === "motion-ux-laws" && fresh(e, i) && i > rulesAt
        );
  const uxAt = nextAfter("ux", muxAt);
  const vhAt = nextAfter("vh", uxAt);
  const pickAt =
    vhAt === -1
      ? -1
      : events.findIndex(
          (e, i) => e.kind === "build" && fresh(e, i) && i > vhAt && named(e)
        );
  const missing = [];
  if (indexAt === -1) {
    missing.push("index");
  }
  if (motion && rulesAt === -1) {
    missing.push("working-rules");
  }
  if (motion && muxAt === -1) {
    missing.push("motion-ux-laws");
  }
  if (uxAt === -1) {
    missing.push("ux-laws");
  }
  if (vhAt === -1) {
    missing.push("visual-hierarchy");
  }
  if (pickAt === -1) {
    missing.push("pick");
  }
  // Every other repo write: the agent's own index once per session, then a
  // skill that index names, loaded after it and since the last landed
  // commit, so each new piece of work gets its own pick. (The changelog
  // stamp right after a commit is exempt in verdict, not here.)
  const codeMissing = [];
  if (indexAt === -1) {
    codeMissing.push("index");
  }
  if (
    indexAt === -1 ||
    !events.some(
      (e, i) =>
        i > indexAt && fresh(e, i) && SKILL_KINDS.includes(e.kind) && named(e)
    )
  ) {
    codeMissing.push("skill");
  }
  return { anySkill, missing, codeMissing, lastCommitAt };
}

/**
 * Motion in a text, one match per declaration or class with its value, so a
 * changed duration or curve reads as a change: keyframes, animation and
 * transition declarations, Tailwind animate / transition / duration / ease /
 * delay / motion-reduce classes, data-motion attributes, GSAP, motion/react.
 */
const MOTION_TOKENS =
  /@keyframes[^{\n]*|\banimation(?:-[a-z]+)?\s*:[^;"}\n]*|\btransition(?:-[a-z]+)?(?:\s*:[^;"}\n]*)?|\banimate-[\w-]+|\bmotion-(?:reduce|safe)[\w:[\].-]*|\bdata-motion[\w-]*(?:=["{][^"}]*["}])?|\bduration-[\w[\].]+|\bease-[\w[\](),.-]+|\bdelay-[\w[\].]+|\bgsap(?:\.[\w.]+)?|\buseGSAP\b|motion\/react/g;
function motionOf(text) {
  return [...String(text ?? "").matchAll(MOTION_TOKENS)]
    .map((m) => m[0].trim())
    .sort()
    .join("\n");
}
/** A source file named for motion (use-onboarding-motion.ts, x-motion.css). */
const MOTION_FILE = /(^|\/)src\/.*motion[^/]*$/i;

/**
 * Whether a write is motion work: the file is named for motion, or the edit
 * adds, removes or changes motion. An Edit counts only when the motion in its
 * old and new text differs, so an edit that merely sits near an existing
 * animation class does not. A Write (its whole content) or a shell command
 * counts when it holds any motion.
 */
export function isMotionEdit(tool, toolInput = {}) {
  const file = String(toolInput.file_path ?? toolInput.path ?? "");
  if (tool !== "Bash" && MOTION_FILE.test(file)) {
    return true;
  }
  if (tool === "Bash") {
    const command = String(toolInput.command ?? "");
    return (
      motionOf(command) !== "" || /motion[^/\s]*\.(css|tsx?)/i.test(command)
    );
  }
  if (toolInput.content !== undefined) {
    return motionOf(toolInput.content) !== "";
  }
  const edits = [
    { old_string: toolInput.old_string, new_string: toolInput.new_string },
    ...(toolInput.edits ?? []),
  ];
  return edits.some((e) => motionOf(e?.old_string) !== motionOf(e?.new_string));
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
        skillState(readTranscript(path.join(dir, f)), {
          after,
        }).missing.length === 0
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
    root = input.cwd ?? process.cwd(),
    readIndex = (p) => readFileSync(p, "utf8"),
  } = {}
) {
  if (EXEMPT_AGENT.test(String(input.agent_type ?? ""))) {
    return null;
  }
  const kit = kitOf(input.agent_type);
  let allows = null;
  if (kit) {
    try {
      const text = readIndex(path.join(root, "agents", kit, "skills/INDEX.md"));
      allows = (name) =>
        Boolean(name) &&
        new RegExp(
          String.raw`(^|[^\w-])${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\w-]|$)`
        ).test(text);
    } catch {
      allows = null;
    }
  }
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
    } else if (inRepo(file, root) && !isChangelog(file, root)) {
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
    state = skillState(readTranscript(transcript), {
      kit,
      allows,
      // Motion work owes the animator kit's first steps, whoever writes it.
      // A commit is judged on its UI steps alone.
      motion: !commitUi && isMotionEdit(tool, toolInput),
    });
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
          return uiMessage(ui, state.missing, true, kit);
        }
      }
      if (subagentCovers(input, after, { readTranscript, listDir })) {
        return null;
      }
    }
    return uiMessage(ui, state.missing, commitUi, kit);
  }
  return guarded && state.codeMissing.length > 0
    ? codeMessage(state.codeMissing, kit)
    : null;
}

const STEP = {
  index:
    "read the skills INDEX.md in full, once this session (Read agents/front-end-developer/skills/INDEX.md)",
  "working-rules":
    "read the animator working rules in full, once this session (Read agents/animator/knowledge/working-rules.md)",
  "motion-ux-laws":
    "after the working rules, read motion-ux-laws, the animator kit's order step 1 (Read agents/animator/skills/motion-ux-laws/SKILL.md), and decide whether it should move at all",
  "ux-laws":
    "after the index, read the ux-laws skill by path (Read agents/front-end-developer/skills/ux-laws/SKILL.md)",
  "visual-hierarchy":
    "after ux-laws, load visual-hierarchy, the second UX skill (Read agents/front-end-developer/skills/visual-hierarchy/SKILL.md), and give every element its tier",
  pick: "after visual-hierarchy, load the ONE build skill from the index that fits this job (for example shadcn for a component or a button, ask-sonner for a toast): Read agents/front-end-developer/skills/<name>/SKILL.md. One build skill, not several",
};

function uiMessage(file, missing, commit = false, kit = null) {
  const steps = missing
    .map(
      (m, i) =>
        `${i + 1}. ${m === "index" ? indexStep(kit ?? "front-end-developer", kit !== null) : STEP[m]}.`
    )
    .join(" ");
  return (
    `Blocked (UI gate): this changes UI (${file}). Still missing: ${steps} ` +
    "Then retry. Order matters: index, (a motion edit: working rules, then motion-ux-laws), ux-laws, visual-hierarchy, then the build skill; a step out of order does not count, but nothing is lost: do the listed steps again in this order and retry. The index and the working rules are read once per session; the rest covers your work until your next commit, then repeat for the next change. " +
    (commit
      ? "A commit also passes when one of this session's subagents loaded all four since the last commit. "
      : "") +
    "Shell edits and commits of UI files are checked too. Name the skill you picked in your report.\n"
  );
}

/** The index step, naming the writer's own kit when it has one. */
function indexStep(kit, own) {
  return own
    ? `read your own kit's skills INDEX.md in full, once this session (Read agents/${kit}/skills/INDEX.md); another kit's index does not count`
    : "read a skills INDEX.md in full, once this session (your kit's agents/<kit>/skills/INDEX.md, or .claude/skills/INDEX.md)";
}

function codeStep(step, kit) {
  if (step === "index") {
    return indexStep(kit, kit !== null);
  }
  const where = kit ? `agents/${kit}/skills/INDEX.md` : "the index you read";
  return `after reading it, load the ONE skill that ${where} names for this job (read its SKILL.md with Read, cat or sed -n, or the Skill tool for a general skill). A skill your index does not list, or one read before the index, does not count`;
}

function codeMessage(missing, kit = null) {
  const steps = missing
    .map((m, i) => `${i + 1}. ${codeStep(m, kit)}.`)
    .join(" ");
  return (
    `Blocked (skill gate): every agent picks its skill before writing in this project. Still missing: ${steps} ` +
    "Then retry. The index holds for the session; the skill pick holds until your next commit, then pick again for the next piece of work. Name the skill in your report.\n"
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
