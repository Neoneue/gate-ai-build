#!/usr/bin/env node
// Stop, SubagentStop and PreToolUse (SendMessage, room_post) guard: the
// animator's review gate (owner 2026-10-09: "You're not allowed to skip
// anything"). require-skill.mjs checks the kit's steps before a write; this
// checks the steps after it, which nothing enforced before: kit order steps
// 5 and 6 in agents/animator/skills/INDEX.md.
//
// - Who: any session or agent; what it edited decides, not its role.
// - When: once it has a landed motion edit (isMotionEdit in
//   require-skill.mjs: a src/ Write, Edit, MultiEdit or shell write whose
//   text holds keyframes, an animation or transition, GSAP or motion/react,
//   or a file named for motion), it may not end its turn, or send a report
//   through SendMessage or room_post, until, after its LAST such edit and in
//   this order, it has: read agents/animator/skills/review-animations/
//   SKILL.md, read transitions-polish/SKILL.md, run a reduced-motion browser
//   check (a tool call whose input sets reducedMotion to "reduce", such as
//   Playwright's browser_emulate_media or an emulateMedia script), and read
//   emil-design-eng/SKILL.md. A later motion edit resets all four; an edit
//   with no motion arms nothing.
// - Proof: after the last write, its own output (this final message or
//   report, or an earlier one) must name the review-animations verdict
//   (Approve or Block) and hold the emil-design-eng Before / After.
//
// No retry escape: stop_hook_active does not let a second stop through,
// since the fix is always in reach (three reads and one check). Two stops
// pass without skipping the steps: a reply (or report) starting BLOCKED, or
// a room post with needs_human, asks the owner and leaves the steps owed;
// and a hand-off of the review to an animator subagent on Opus after the
// last write frees the session, while that subagent (isHandedReview) must
// do all four steps itself. Anything it cannot read passes, so a broken
// hook never locks work.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  isMotionEdit,
  shellWritesUi,
  transcriptPathOf,
} from "./require-skill.mjs";

/** The review steps, in the order they must come after the last write. */
export const STEPS = [
  "review-animations",
  "transitions-polish",
  "reduced-motion",
  "emil-design-eng",
];

const KIT_SKILL = /agents\/animator\/skills\/([^/\s"'|;&]+)\/SKILL\.md/;
const KIT_SKILL_SHELL_READ = new RegExp(
  String.raw`\b(?:cat|sed|head|tail|less|bat)\b[^|;&]*${KIT_SKILL.source}`,
  "g"
);
/** A tool input that turns reduced motion on in a browser. */
const REDUCED_MOTION = /reducedMotion\W{0,6}reduce\b/;
/** Tools whose input only reads or writes text, never drives a browser. */
const NOT_A_CHECK = new Set(["Read", "Grep", "Glob", "Write", "Edit"]);

/** A source file under src/ that is not a test. */
function isSrc(file) {
  return /(^|\/)src\//.test(file) && !/\.test\.[jt]sx?$/.test(file);
}

/** What one tool call means for the review: a write, a step, or nothing. */
function eventOf(part) {
  const name = part.name;
  const input = part.input ?? {};
  // The review handed to an animator subagent on Opus (the definition's
  // model, or an explicit opus override), so the session stays free to talk.
  if (
    (name === "Agent" || name === "Task") &&
    input.subagent_type === "animator" &&
    (!input.model || /opus/i.test(String(input.model)))
  ) {
    return [{ kind: "handoff", prompt: String(input.prompt ?? "") }];
  }
  if (["Write", "Edit", "MultiEdit", "NotebookEdit"].includes(name)) {
    const file = String(input.file_path ?? input.notebook_path ?? "");
    return isSrc(file) && isMotionEdit(name, input) ? [{ kind: "write" }] : [];
  }
  if (name === "Read") {
    const skill = String(input.file_path ?? "").match(KIT_SKILL)?.[1];
    return skill && STEPS.includes(skill) ? [{ kind: skill }] : [];
  }
  const events = [];
  if (name === "Bash") {
    const command = String(input.command ?? "");
    if (shellWritesUi(command)) {
      return isMotionEdit("Bash", input) ? [{ kind: "write" }] : [];
    }
    for (const m of command.matchAll(KIT_SKILL_SHELL_READ)) {
      if (STEPS.includes(m[1])) {
        events.push({ kind: m[1] });
      }
    }
  }
  if (!NOT_A_CHECK.has(name) && REDUCED_MOTION.test(JSON.stringify(input))) {
    events.push({ kind: "reduced-motion" });
  }
  return events;
}

/** True when a text names the review-animations verdict and the Before / After. */
export function hasProof(text) {
  const t = String(text ?? "");
  return (
    /review-animations/i.test(t) &&
    /\b(approve|approved|block|blocked)\b/i.test(t) &&
    /emil-design-eng/i.test(t) &&
    /\bbefore\b/i.test(t) &&
    /\bafter\b/i.test(t)
  );
}

/**
 * The review state of one transcript: whether a landed src write exists,
 * which steps are still missing after the last one, whether the proof was
 * already given in output after it, and whether the review was handed to an
 * animator subagent after it. A tool call counts once its result came back
 * without an error, so a blocked write arms nothing and a failed browser
 * check proves nothing. With `review`, a transcript with no write of its own
 * (a subagent the review was handed to) is armed from its start.
 * `lastWriteAt`, `startedAt`, `firstPrompt` and `handoffs` let a subagent's
 * stop be matched to its parent's hand-off.
 */
export function reviewState(text, { review = false } = {}) {
  const calls = [];
  const landed = new Set();
  let startedAt = null;
  let firstPrompt = null;
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
    startedAt ??= Number.isNaN(ts) ? null : ts;
    if (firstPrompt === null && entry.type === "user") {
      firstPrompt = parts
        .map((p) => (typeof p === "string" ? p : (p?.text ?? "")))
        .join("");
    }
    for (const part of parts) {
      if (part?.type === "tool_result") {
        if (!part.is_error) {
          landed.add(part.tool_use_id);
        }
      } else if (part?.type === "tool_use") {
        for (const ev of eventOf(part)) {
          calls.push({ id: part.id, ...ev, ts });
        }
        if (hasProof(JSON.stringify(part.input ?? {}))) {
          calls.push({ id: part.id, kind: "proof", ts });
        }
      } else if (
        entry.type === "assistant" &&
        (typeof part === "string" || part?.type === "text") &&
        hasProof(typeof part === "string" ? part : part.text)
      ) {
        calls.push({ id: null, kind: "proof", ts });
      }
    }
  }
  const events = calls.filter((e) => e.id === null || landed.has(e.id));
  const lastWrite = events.findLastIndex((e) => e.kind === "write");
  const after = (kind) =>
    events.filter((e, i) => i > lastWrite && e.kind === kind);
  const base = {
    startedAt,
    firstPrompt,
    lastWriteAt: lastWrite === -1 ? null : events[lastWrite].ts,
    handoffs: after("handoff").map((e) => e.prompt),
  };
  if (lastWrite === -1 && !review) {
    return { ...base, armed: false, missing: [], proof: false };
  }
  const missing = [];
  let at = lastWrite;
  for (const step of STEPS) {
    const found = events.findIndex((e, i) => i > at && e.kind === step);
    if (found === -1) {
      missing.push(step);
    } else {
      at = found;
    }
  }
  const proof = after("proof").length > 0;
  return { ...base, armed: true, missing, proof };
}

/**
 * Whether a subagent's transcript is the review its parent handed off: the
 * subagent is an animator, the parent has an unreviewed motion edit and
 * handed the review to an animator subagent after it, and this transcript
 * started after that edit with the hand-off's prompt.
 */
function isHandedReview(agentType, own, parentText) {
  const parent = reviewState(parentText);
  if (
    !(agentType === "animator" && parent.armed && parent.handoffs.length > 0)
  ) {
    return false;
  }
  const startedAfter =
    own.startedAt === null ||
    parent.lastWriteAt === null ||
    Number.isNaN(parent.lastWriteAt) ||
    own.startedAt > parent.lastWriteAt;
  const prompt = String(own.firstPrompt ?? "").trim();
  return (
    startedAfter &&
    prompt !== "" &&
    parent.handoffs.some((p) => p.trim() === prompt)
  );
}

/** A message that says the writer is blocked and needs the owner. */
const BLOCKED = /^\s*(?:\*\*)?BLOCKED\b/;

/** The transcript of whoever is stopping or reporting. */
function transcriptOf(input) {
  if (input.hook_event_name === "SubagentStop") {
    return input.agent_transcript_path ?? null;
  }
  return transcriptPathOf(input);
}

/**
 * The verdict for one hook input: null to pass, or why it is blocked.
 * `readTranscript` is passed in by tests.
 */
export function verdict(
  input,
  { readTranscript = (p) => readFileSync(p, "utf8") } = {}
) {
  const event = input.hook_event_name;
  const reporting = event === "PreToolUse";
  if (
    !(reporting || event === "Stop" || event === "SubagentStop") ||
    (reporting &&
      !/^(SendMessage|mcp__room__room_post)$/.test(String(input.tool_name)))
  ) {
    return null;
  }
  const file = transcriptOf(input);
  if (!file) {
    return null;
  }
  let text;
  try {
    text = readTranscript(file);
  } catch {
    return null;
  }
  let state = reviewState(text);
  if (!state.armed && event === "SubagentStop") {
    // A subagent with no motion edit of its own may be the review its parent
    // handed off: then the four steps are its whole job.
    try {
      if (
        isHandedReview(
          input.agent_type,
          state,
          readTranscript(input.transcript_path)
        )
      ) {
        state = reviewState(text, { review: true });
      }
    } catch {
      return null;
    }
  }
  if (!state.armed) {
    return null;
  }
  // Handed to an animator subagent: the session stays free to talk to the
  // owner, and that subagent's stop carries the gate.
  if (state.handoffs.length > 0) {
    return null;
  }
  // Blocked and asking the owner: a reply starting BLOCKED (the animator
  // contract's first-line status), or a room post with needs_human. The
  // steps stay armed for the next stop.
  const toolInput = input.tool_input ?? {};
  if (
    reporting
      ? toolInput.needs_human === true ||
        BLOCKED.test(String(toolInput.message ?? toolInput.text ?? ""))
      : BLOCKED.test(String(input.last_assistant_message ?? ""))
  ) {
    return null;
  }
  const outgoing = reporting
    ? JSON.stringify(toolInput)
    : input.last_assistant_message;
  const proof = state.proof || hasProof(outgoing);
  if (state.missing.length === 0 && proof) {
    return null;
  }
  return message(state.missing, proof, reporting);
}

const STEP_TEXT = {
  "review-animations":
    "read agents/animator/skills/review-animations/SKILL.md and run its ten-point review on what you built, ending in Approve or Block",
  "transitions-polish":
    "after it, read agents/animator/skills/transitions-polish/SKILL.md and check the timing",
  "reduced-motion":
    'after it, check the motion in the browser with reduced motion on (Playwright browser_emulate_media with reducedMotion "reduce", or emulateMedia({ reducedMotion: "reduce" }) in a script)',
  "emil-design-eng":
    "after it, read agents/animator/skills/emil-design-eng/SKILL.md and do its final polish pass, with its Before / After table",
};

function message(missing, proof, reporting) {
  const steps = missing.map((m) => STEP_TEXT[m]);
  if (!proof) {
    steps.push(
      "then put the proof in your report: the review-animations verdict (Approve or Block) and the emil-design-eng Before / After"
    );
  }
  const list = steps.map((s, i) => `${i + 1}. ${s}.`).join(" ");
  return (
    `Blocked (animator review gate): you changed src/ and ${reporting ? "are reporting" : "are finishing"} without kit order steps 5 and 6 (agents/animator/skills/INDEX.md). Still missing, after your last edit and in this order: ${list} ` +
    "Every edit resets these steps, follow-up fixes included. Nothing is optional; do them now, then finish.\n"
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
  if (!why) {
    process.exit(0);
  }
  if (input.hook_event_name === "PreToolUse") {
    process.stderr.write(why);
    process.exit(2);
  }
  process.stdout.write(JSON.stringify({ decision: "block", reason: why }));
  process.exit(0);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
