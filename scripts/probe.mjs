#!/usr/bin/env node
// One-call browser probe (token report, 2026-10-10). Replaces the throwaway
// Playwright scripts agents rewrote for each check (probe.mjs 19 times in two
// weeks, most importing Playwright from an npx cache path) and the five or
// six calls a `npx playwright cli` session costs for one look. Use the CLI
// (tester kit, `playwright-cli`) for interactive, multi-step exploration.
//
// Reuses a dev server already on --port, or starts Vite there (--strictPort)
// and stops it when done. Never the owner's :5173. Prints one JSON line.
//
//   node scripts/probe.mjs <route> [options]
//     --viewport 390x844     default 1440x900
//     --theme dark|light     sets localStorage "theme" before the page loads
//     --role Manager         picks a "Viewing as" role with real clicks
//     --shot out.png         screenshot (add --full for the whole page);
//                            delete it when done
//     --eval "expression"    evaluated in the page, result in the JSON
//     --text                 the page's visible text (first 2000 chars)
//     --wait 500             extra ms after load
//     --port 3000
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";

const USAGE =
  "usage: node scripts/probe.mjs <route> [--viewport WxH] [--theme dark|light] [--role NAME] [--shot FILE [--full]] [--eval JS] [--text] [--wait MS] [--port N]";

export function parseArgs(argv) {
  const opts = {
    viewport: "1440x900",
    port: 3000,
    wait: 0,
    full: false,
    text: false,
  };
  const rest = [...argv];
  while (rest.length) {
    const a = rest.shift();
    if (a === "--full" || a === "--text") {
      opts[a.slice(2)] = true;
    } else if (a.startsWith("--")) {
      const value = rest.shift();
      if (value === undefined) {
        throw new Error(`${a} needs a value`);
      }
      opts[a.slice(2)] = value;
    } else if (opts.route) {
      throw new Error(`unexpected argument: ${a}`);
    } else {
      opts.route = a;
    }
  }
  if (!opts.route) {
    throw new Error(USAGE);
  }
  if (Number(opts.port) === 5173) {
    throw new Error("5173 is the owner's dev server; probe on 3000 or 3001");
  }
  const [width, height] = String(opts.viewport).split("x").map(Number);
  if (!(width > 0 && height > 0)) {
    throw new Error(`--viewport takes WxH, got ${opts.viewport}`);
  }
  if (opts.theme && !["dark", "light"].includes(opts.theme)) {
    throw new Error("--theme takes dark or light");
  }
  return {
    ...opts,
    port: Number(opts.port),
    wait: Number(opts.wait),
    width,
    height,
  };
}

async function up(url) {
  try {
    const r = await fetch(url);
    return r.ok;
  } catch {
    return false;
  }
}

/** A server on the port, reused or started. Returns a stop function. */
async function ensureServer(port) {
  const base = `http://localhost:${port}`;
  if (await up(base)) {
    return () => undefined;
  }
  const vite = spawn("npx", ["vite", "--port", String(port), "--strictPort"], {
    stdio: "ignore",
  });
  for (let i = 0; i < 60; i++) {
    if (await up(base)) {
      return () => vite.kill("SIGTERM");
    }
    await new Promise((res) => setTimeout(res, 500));
  }
  vite.kill("SIGTERM");
  throw new Error(`no dev server on :${port} after 30s`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const stop = await ensureServer(opts.port);
  const browser = await chromium.launch();
  const out = { route: opts.route };
  try {
    const page = await browser.newPage({
      viewport: { width: opts.width, height: opts.height },
    });
    const errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") {
        errors.push(m.text().slice(0, 200));
      }
    });
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
    if (opts.theme) {
      await page.addInitScript(
        (t) => localStorage.setItem("theme", t),
        opts.theme
      );
    }
    const res = await page.goto(`http://localhost:${opts.port}${opts.route}`, {
      waitUntil: "networkidle",
    });
    out.status = res?.status() ?? null;
    if (opts.role) {
      await page.locator('[aria-label="Viewing as"]').first().click();
      await page.getByRole("option", { name: opts.role }).first().click();
      await page.waitForLoadState("networkidle");
    }
    if (opts.wait) {
      await page.waitForTimeout(opts.wait);
    }
    out.url = page.url();
    out.title = await page.title();
    if (opts.eval) {
      // undefined would drop the key from the JSON; null says "ran, got nothing".
      out.eval = (await page.evaluate(opts.eval)) ?? null;
    }
    if (opts.text) {
      out.text = (await page.locator("body").innerText())
        .replace(/\n{2,}/g, "\n")
        .slice(0, 2000);
    }
    if (opts.shot) {
      await page.screenshot({ path: opts.shot, fullPage: opts.full });
      out.shot = opts.shot;
    }
    out.consoleErrors = errors.slice(0, 5);
  } finally {
    await browser.close();
    stop();
  }
  console.log(JSON.stringify(out));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(`probe: ${e.message}`);
    process.exit(1);
  });
}
