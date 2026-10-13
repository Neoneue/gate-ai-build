import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BUDGET, lastContext, nudge, STEP, stepOf } from "./context-budget.mjs";

// Transcript lines in Claude Code's JSONL shape.
const assistant = (usage, model = "claude-opus-5-5") =>
  JSON.stringify({ type: "assistant", message: { model, usage } });
const ctx = (cacheRead) =>
  assistant({
    input_tokens: 2,
    cache_creation_input_tokens: 1000,
    cache_read_input_tokens: cacheRead,
  });

describe("lastContext", () => {
  it("sums input, cache writes and cache reads of the last assistant call", () => {
    const tail = [ctx(10_000), '{"type":"user"}', ctx(300_000), ""].join("\n");
    expect(lastContext(tail)).toBe(301_002);
  });

  it("skips synthetic messages, broken lines and lines without usage", () => {
    const tail = [
      ctx(200_000),
      assistant({ input_tokens: 0 }, "<synthetic>"),
      '{"usage": broken',
      '{"type":"user","message":{"content":"hi"}}',
    ].join("\n");
    expect(lastContext(tail)).toBe(201_002);
  });

  it("is null when the tail holds no assistant call", () => {
    expect(lastContext('{"type":"user"}\n')).toBeNull();
  });
});

describe("stepOf and nudge", () => {
  it("stays quiet under the budget", () => {
    expect(stepOf(BUDGET - 1)).toBe(-1);
    expect(nudge(BUDGET - 1, -1)).toBeNull();
    expect(nudge(null, -1)).toBeNull();
  });

  it("nudges once per step above the budget", () => {
    expect(stepOf(BUDGET)).toBe(0);
    expect(nudge(BUDGET + 10_000, -1)).toMatch(
      /260K tokens.*\/handoff.*\/clear/
    );
    expect(nudge(BUDGET + 10_000, 0)).toBeNull();
    expect(stepOf(BUDGET + STEP)).toBe(1);
    expect(nudge(BUDGET + STEP, 0)).not.toBeNull();
  });
});

describe("the hook", () => {
  const run = (input) =>
    execFileSync(
      "node",
      [path.join(import.meta.dirname, "context-budget.mjs")],
      {
        input: JSON.stringify(input),
        encoding: "utf8",
        env: { ...process.env, TMPDIR: tmp },
      }
    );
  const tmp = mkdtempSync(path.join(os.tmpdir(), "ctx-budget-"));

  it("adds context once at a step, then stays quiet at the same step", () => {
    const transcript = path.join(tmp, "t.jsonl");
    writeFileSync(transcript, `${ctx(BUDGET + 5000)}\n`);
    const input = { transcript_path: transcript, session_id: "s1" };
    const first = JSON.parse(run(input));
    expect(first.hookSpecificOutput.hookEventName).toBe("UserPromptSubmit");
    expect(first.hookSpecificOutput.additionalContext).toMatch(/budget/);
    expect(run(input)).toBe("");
    rmSync(tmp, { recursive: true, force: true });
  });

  it("exits 0 with no output on bad input", () => {
    expect(
      run({ transcript_path: "/nope/missing.jsonl", session_id: "x" })
    ).toBe("");
  });
});
