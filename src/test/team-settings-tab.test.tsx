// @vitest-environment happy-dom
/**
 * Team detail Settings tab — presence by tier and by default flag.
 *
 * One build serves /teams/:teamId (Pro), /teams-default/:teamId (Default)
 * and /teams-enterprise/:teamId (Enterprise), so "which tier" is read off the
 * pathname. The tab renders only when it has actionable content:
 *
 *  - entitled (Enterprise): always — Lock settings, Policies, Token savings;
 *  - unentitled (Pro / Default), non-default team: rename and delete;
 *  - unentitled, DEFAULT team: nothing — the default team can be neither
 *    renamed nor deleted (PRD 3 / 8.1), so the tab is hidden and its notice
 *    reads on Overview instead.
 */

import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ViewRole } from "@/pages/teams/teams-store";
import { renderRoute, resetViewRole } from "./render";

/** Seed ids (`src/data/teams.ts`): the catch-all team and a normal one. */
/** Mounting the whole team-detail route is the heaviest render in the suite,
 *  and the first case in a file also pays the lazy chunk's transform. The
 *  5s default is tight enough to flake under a full parallel run. */
const MOUNT_TIMEOUT = 20_000;

const DEFAULT_TEAM = "team_default";
const NAMED_TEAM = "team_platform";

const TIERS = [
  { tier: "Pro", base: "/teams" },
  { tier: "Default", base: "/teams-default" },
  { tier: "Enterprise", base: "/teams-enterprise" },
] as const;

/** The notice is the existing `Callout` (role="note"), wording unchanged. */
const NOTICE = /default team\. People and keys removed from other teams/i;

function settingsTab() {
  return screen.queryByRole("tab", { name: "Settings" });
}

function overviewPanel(): HTMLElement {
  const panel = screen
    .getAllByRole("tabpanel")
    .find((p) => within(p).queryByRole("heading", { name: "Team overview" }));
  if (!panel) {
    throw new Error("Overview panel never rendered");
  }
  return panel;
}

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  resetViewRole();
  errorSpy.mockRestore();
});

describe("Settings tab presence by tier x default flag", () => {
  const cases: [string, string, boolean][] = TIERS.flatMap(
    ({ tier, base }) =>
      [
        [
          `${tier} default team`,
          `${base}/${DEFAULT_TEAM}`,
          tier === "Enterprise",
        ],
        [`${tier} named team`, `${base}/${NAMED_TEAM}`, true],
      ] as [string, string, boolean][]
  );

  it.each(cases)(
    "%s (%s) shows Settings: %s",
    async (_label, path, shown) => {
      await renderRoute(path);
      expect(settingsTab() !== null).toBe(shown);
    },
    MOUNT_TIMEOUT
  );
});

describe("the default-team notice", () => {
  it.each(
    TIERS.filter((t) => t.tier !== "Enterprise").map(
      (t) => [t.tier, `${t.base}/${DEFAULT_TEAM}`] as const
    )
  )(
    "%s reads it on Overview, where Settings used to be",
    async (_t, path) => {
      await renderRoute(path);
      expect(within(overviewPanel()).getByRole("note").textContent).toMatch(
        NOTICE
      );
    },
    MOUNT_TIMEOUT
  );

  it(
    "stays in Settings on Enterprise, so it is never doubled",
    async () => {
      await renderRoute(`/teams-enterprise/${DEFAULT_TEAM}`);
      expect(settingsTab()).not.toBeNull();
      expect(within(overviewPanel()).queryByRole("note")).toBeNull();
    },
    MOUNT_TIMEOUT
  );

  it(
    "does not follow a named team onto Overview",
    async () => {
      await renderRoute(`/teams/${NAMED_TEAM}`);
      expect(within(overviewPanel()).queryByRole("note")).toBeNull();
    },
    MOUNT_TIMEOUT
  );
});

describe("role sweep: the manager case is unchanged", () => {
  /** Managers are pinned to their own team (`team_platform`), so the default
   *  team is unreachable for them — only the named-team rows apply. */
  const MANAGER: ViewRole = "manager";

  it(
    "entitled manager keeps the read-only Settings tab",
    async () => {
      await renderRoute(`/teams-enterprise/${NAMED_TEAM}`, { role: MANAGER });
      expect(settingsTab()).not.toBeNull();
    },
    MOUNT_TIMEOUT
  );

  it(
    "unentitled manager still has no Settings tab",
    async () => {
      await renderRoute(`/teams/${NAMED_TEAM}`, { role: MANAGER });
      expect(settingsTab()).toBeNull();
    },
    MOUNT_TIMEOUT
  );
});
