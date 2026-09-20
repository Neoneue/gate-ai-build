// @vitest-environment happy-dom
/**
 * Route smoke tier — mounts every route declared in `src/App.tsx` and asserts
 * it renders something without a `console.error`.
 *
 * The path list is DERIVED from App.tsx as text rather than duplicated here,
 * so a route added to the app is covered the moment it is declared and can
 * never silently fall out of the suite.
 *
 * React 19 reports key warnings, invalid DOM nesting and act violations
 * through `console.error`, so the spy is the real net; the "renders something"
 * assertion only catches a blank crash.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONVERSATION_ROWS } from "@/data/conversations";
import { REQUEST_ROWS_ALL, requestRowId } from "@/data/requests";
import { TEAM_SEED_ROWS } from "@/data/teams";
import { isEnterpriseSurface } from "@/lib/plan";
import type { ViewRole } from "@/pages/teams/teams-store";
import { renderRoute, resetViewRole } from "./render";

/**
 * Dynamic segments → a real id from the module the matching detail page reads.
 * Each entry names that source so the substitution stays checkable:
 *
 * | segment            | page                     | source                          |
 * | ------------------ | ------------------------ | ------------------------------- |
 * | `:requestId`       | `RequestsFindings.tsx`   | `requestRowId(REQUEST_ROWS_ALL)` |
 * | `:conversationId`  | `ConversationsTrace.tsx` | `CONVERSATION_ROWS[].conversationId` |
 * | `:teamId`          | `TeamDetail*.tsx`        | `TEAM_SEED_ROWS[].id`           |
 *
 * First row in each case: any row resolves, and the first is stable ordering.
 */
const PARAM_VALUES: Record<string, string> = {
  ":requestId": requestRowId(REQUEST_ROWS_ALL[0]),
  ":conversationId": CONVERSATION_ROWS[0].conversationId,
  ":teamId": TEAM_SEED_ROWS[0].id,
};

const PATH_ATTR = /path="([^"]+)"/g;

/** Under the happy-dom environment `import.meta.url` is not a `file:` URL, so
 *  prefer Vite's `import.meta.dirname` and fall back to the URL form. */
const APP_SOURCE_PATH = import.meta.dirname
  ? resolve(import.meta.dirname, "../App.tsx")
  : fileURLToPath(new URL("../App.tsx", import.meta.url));

function declaredPaths(): string[] {
  const appSource = readFileSync(APP_SOURCE_PATH, "utf8");
  const found = new Set<string>();
  for (const [, raw] of appSource.matchAll(PATH_ATTR)) {
    // `*` is the catch-all; the index route declares no `path` at all.
    if (raw === "*") {
      continue;
    }
    let resolved = raw;
    for (const [segment, value] of Object.entries(PARAM_VALUES)) {
      resolved = resolved.replace(segment, value);
    }
    if (resolved.includes(":")) {
      throw new Error(`unmapped dynamic segment in route "${raw}"`);
    }
    found.add(resolved);
  }
  return [...found];
}

const ROUTE_PATHS = declaredPaths();

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  resetViewRole();
  errorSpy.mockRestore();
});

const errorText = () =>
  errorSpy.mock.calls
    .map((call: unknown[]) => call.map(String).join(" "))
    .join("\n");

describe("route smoke", () => {
  it("derives a non-trivial path list from App.tsx", () => {
    expect(ROUTE_PATHS.length).toBeGreaterThan(50);
  });

  it.each(ROUTE_PATHS)("renders %s", async (path) => {
    const { container } = await renderRoute(path);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
    expect(errorText()).toBe("");
  });
});

const ROLES: ViewRole[] = ["admin", "manager", "member"];
const ENTERPRISE_PATHS = ROUTE_PATHS.filter((p) => isEnterpriseSurface(p));

describe("enterprise routes under each view role", () => {
  /* The chrome guard may bounce Manager / Member off a hidden surface, so the
   * bar is "mounts and renders something clean", not page content. */
  const cases = ENTERPRISE_PATHS.flatMap((path) =>
    ROLES.map((role) => [path, role] as const)
  );

  it.each(cases)("renders %s as %s", async (path, role) => {
    const { container } = await renderRoute(path, { role });
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
    expect(errorText()).toBe("");
  });
});

describe("redirect routes", () => {
  /* The index route and the `*` catch-all both `<Navigate replace>` to
   * Overview; assert the target actually resolves rather than blanking. */
  it.each([
    "/",
    "/definitely-not-a-route",
  ])("%s resolves to Overview", async (path) => {
    const { container } = await renderRoute(path);
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(0);
    expect(errorText()).toBe("");
  });
});
