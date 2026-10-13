#!/usr/bin/env node
// UserPromptSubmit hook: the context budget (token report, 2026-10-10).
// Every call in a session re-reads its whole context, so a long session costs
// more per step the longer it runs. Measured 2026-09-26 to 10-10 in this
// project: 20 of 76 sessions ran past 250K tokens (the longest 776K), and 83%
// of cache-read spend came from calls above 200K.
//
// Reads the session transcript's latest usage. Once the context passes
// BUDGET, and again every STEP above it, it adds one line for Claude: finish
// the current step, then ask the owner to run /handoff and /clear. A nudge,
// not auto-compaction: a silent compaction drops in-session decisions that
// the handoff keeps. The last step nudged is kept per session in the OS temp
// folder, so each step nudges once.
//
// Never blocks a prompt: any failure prints nothing and exits 0.
import {
  closeSync,
  fstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const BUDGET = 250_000;
export const STEP = 100_000;
/** The last usage line sits near the end, but one line can hold a big tool result. */
const TAIL_BYTES = 4 * 1024 * 1024;

/**
 * Context size of the last real assistant call in a JSONL transcript tail:
 * input + cache writes + cache reads. Null when the tail holds none.
 * @param {string} tail
 * @returns {number | null}
 */
export function lastContext(tail) {
  const lines = tail.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (!line.includes('"usage"')) {
      continue;
    }
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    const usage = entry?.message?.usage;
    if (
      entry.type !== "assistant" ||
      !usage ||
      entry.message.model === "<synthetic>"
    ) {
      continue;
    }
    return (
      (usage.input_tokens ?? 0) +
      (usage.cache_creation_input_tokens ?? 0) +
      (usage.cache_read_input_tokens ?? 0)
    );
  }
  return null;
}

/**
 * Which budget step a context sits on: -1 under budget, 0 from BUDGET, 1 from
 * BUDGET + STEP, and so on.
 * @param {number | null} tokens
 */
export function stepOf(tokens, budget = BUDGET, step = STEP) {
  if (tokens === null || tokens < budget) {
    return -1;
  }
  return Math.floor((tokens - budget) / step);
}

/**
 * The line Claude sees, or null when this prompt owes no nudge: under budget,
 * or this step was already nudged.
 * @param {number | null} tokens
 * @param {number} lastNudged the step nudged before, -1 for none
 */
export function nudge(tokens, lastNudged, budget = BUDGET) {
  const step = stepOf(tokens, budget);
  if (step < 0 || step <= lastNudged) {
    return null;
  }
  const k = Math.round(/** @type {number} */ (tokens) / 1000);
  return `Context budget: this session is at ${k}K tokens, over the ${budget / 1000}K budget, and every call now re-reads all of it. Finish the step you are on, then tell the owner in one line to run /handoff and then /clear. Say it once; do not repeat it in later replies.`;
}

function readTail(file) {
  const fd = openSync(file, "r");
  try {
    const size = fstatSync(fd).size;
    const length = Math.min(size, TAIL_BYTES);
    const buf = Buffer.alloc(length);
    readSync(fd, buf, 0, length, size - length);
    return buf.toString("utf8");
  } finally {
    closeSync(fd);
  }
}

function main() {
  const input = JSON.parse(readFileSync(0, "utf8"));
  if (!(input.transcript_path && input.session_id)) {
    return;
  }
  const tokens = lastContext(readTail(input.transcript_path));
  const dir = path.join(os.tmpdir(), "context-budget");
  const stateFile = path.join(
    dir,
    String(input.session_id).replace(/[^\w-]/g, "")
  );
  let lastNudged = -1;
  try {
    const stored = Number.parseInt(readFileSync(stateFile, "utf8"), 10);
    lastNudged = Number.isInteger(stored) ? stored : -1;
  } catch {
    // First prompt of the session, or the temp folder was cleared.
  }
  // A /clear or compaction drops the context: let the next climb nudge again.
  if (stepOf(tokens) < lastNudged) {
    lastNudged = stepOf(tokens);
    mkdirSync(dir, { recursive: true });
    writeFileSync(stateFile, String(lastNudged));
  }
  const text = nudge(tokens, lastNudged);
  if (!text) {
    return;
  }
  mkdirSync(dir, { recursive: true });
  writeFileSync(stateFile, String(stepOf(tokens)));
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext: text,
      },
    })
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    main();
  } catch {
    // A broken budget check must never cost the owner a prompt.
  }
  process.exit(0);
}
