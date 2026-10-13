#!/usr/bin/env node
// Every CI gate in one call, one line each, judged by exit code only. Ported
// from agent-room (AR-36) for the token report, 2026-10-10: checks here ran
// as 457 separate calls in two weeks, each re-reading the session's context.
// A tail of a test run can read green while tests fail, so the verdict never
// parses "passed". A failing gate prints the last lines of its output, so one
// call is enough to start fixing. Ends with GATES PASS n/n or
// GATES FAIL: <names>, and exits non-zero on any failure.
//
//   npm run gates                 tsc, lint, lint:md, test, build (CI verify)
//   npm run gates -- --e2e        also the Playwright smoke (CI e2e job)
//   npm run gates -- tsc test     only the named gates, in this order
import { spawnSync } from "node:child_process";

const GATES = [
  ["tsc", "npx", ["tsc", "-b"]],
  ["lint", "npm", ["run", "lint"]],
  ["lint:md", "npm", ["run", "lint:md"]],
  ["test", "npx", ["vitest", "run"]],
  ["build", "npm", ["run", "build"]],
  ["e2e", "npx", ["playwright", "test", "--reporter=json"]],
];
const TAIL_LINES = 30;

/** Playwright's JSON report: how many tests failed or were flaky. */
function e2eDetail(stdout) {
  try {
    const { stats } = JSON.parse(stdout);
    return `${stats.unexpected} failed, ${stats.flaky} flaky, ${stats.skipped} skipped, ${stats.expected} passed`;
  } catch {
    return "no JSON report";
  }
}

/** The last non-empty lines of a run, without colour codes. */
function tail(text) {
  return (
    text
      // biome-ignore lint/suspicious/noControlCharactersInRegex: strips ANSI colour codes
      .replace(/\u001b\[[0-9;]*m/g, "")
      .split("\n")
      .filter((line) => line.trim())
      .slice(-TAIL_LINES)
      .map((line) => `    ${line}`)
      .join("\n")
  );
}

const args = process.argv.slice(2);
const named = args.filter((a) => !a.startsWith("--"));
const unknown = named.filter((n) => !GATES.some(([name]) => name === n));
if (unknown.length > 0) {
  console.error(
    `Unknown gate: ${unknown.join(", ")}. Gates: ${GATES.map(([n]) => n).join(", ")}`
  );
  process.exit(2);
}
const run = named.length
  ? named.map((n) => GATES.find(([name]) => name === n))
  : GATES.filter(([name]) => name !== "e2e" || args.includes("--e2e"));

const failed = [];
for (const [name, cmd, cmdArgs] of run) {
  const result = spawnSync(cmd, cmdArgs, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const code = result.status ?? 1;
  const detail = name === "e2e" ? ` (${e2eDetail(result.stdout)})` : "";
  console.log(`${code === 0 ? "ok  " : "FAIL"} ${name} exit ${code}${detail}`);
  if (code !== 0) {
    failed.push(name);
    if (name !== "e2e") {
      console.log(tail(`${result.stdout ?? ""}\n${result.stderr ?? ""}`));
    }
  }
}
console.log(
  failed.length === 0
    ? `GATES PASS ${run.length}/${run.length}`
    : `GATES FAIL: ${failed.join(", ")}`
);
process.exit(failed.length === 0 ? 0 : 1);
