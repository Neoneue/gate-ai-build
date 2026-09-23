// @vitest-environment happy-dom
/**
 * "Events by …" member tables — the Email column, its position, and its source.
 *
 * The column is SECOND, directly after Member, and its value is read off the
 * roster row (`memberById`), never composed from the event row. That matters
 * twice over: the no-synthetic-data rule means an address must belong to a real
 * member entity, and `MemberFindingsTable` is one component rendered twice
 * ("Events by current members" and "Events by past members"), so the header
 * order is a single fact both tables share.
 *
 * Tier reach: the pane's entitlement gate returns the guardrail empty state for
 * `variant="default"`, so only Pro (/teams/:teamId) and Enterprise
 * (/teams-enterprise/:teamId) render the table at all.
 */

import { cleanup, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { memberById, TEAM_SEED_ROWS } from "@/data/teams";
import { securityForTeamAtRange } from "@/pages/teams/security-data";
import type { ViewRole } from "@/pages/teams/teams-store";
import { renderRoute, resetViewRole } from "./render";

/** Mounting the whole team-detail route is the heaviest render in the suite,
 *  and the first case in a file also pays the lazy chunk's transform. */
const MOUNT_TIMEOUT = 20_000;

/** Seed id (`src/data/teams.ts`) for Development, the two-member team. */
const NAMED_TEAM = "team_platform";

/** Header order, left to right. Email sits at index 1, next to the name it
 *  belongs to; the three threat types keep ATTACK_MIX order. */
const COLUMNS = [
  "Member",
  "Email",
  "PII / PHI",
  "Prompt injection",
  "Credential leak",
  "Events",
];

function currentMembersTable(): HTMLTableElement {
  const title = screen.getAllByText("Events by current members")[0];
  const table = title?.parentElement?.querySelector("table");
  if (!table) {
    throw new Error("Events by current members table never rendered");
  }
  return table as HTMLTableElement;
}

const headersOf = (table: HTMLTableElement): string[] =>
  [...table.querySelectorAll("thead th")].map((th) =>
    (th.textContent ?? "").trim()
  );

const columnOf = (table: HTMLTableElement, index: number): string[] =>
  [...table.querySelectorAll("tbody tr")].map((tr) =>
    (tr.querySelectorAll("td")[index]?.textContent ?? "").trim()
  );

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  resetViewRole();
  errorSpy.mockRestore();
});

describe("the Email column, by tier", () => {
  it.each([
    ["Pro", "/teams"],
    ["Enterprise", "/teams-enterprise"],
  ])(
    "%s renders it second, directly after Member",
    async (_tier, base) => {
      await renderRoute(`${base}/${NAMED_TEAM}`);
      const table = currentMembersTable();
      expect(headersOf(table)).toEqual(COLUMNS);
      expect(headersOf(table)[1]).toBe("Email");
    },
    MOUNT_TIMEOUT
  );

  it(
    "Default never reaches the table, so it has no column to render",
    async () => {
      await renderRoute(`/teams-default/${NAMED_TEAM}`);
      expect(screen.queryByText("Events by current members")).toBeNull();
    },
    MOUNT_TIMEOUT
  );
});

describe("every address is a real member's", () => {
  it(
    "each cell matches the roster row the Monogram tone already reads",
    async () => {
      const team = TEAM_SEED_ROWS.find((t) => t.id === NAMED_TEAM);
      if (!team) {
        throw new Error("seed team missing");
      }
      // Rows render in the incoming (events-ranked) order until a header is
      // toggled, so the derivation's order is the rendered order.
      const expected = securityForTeamAtRange(
        team,
        "all",
        null,
        TEAM_SEED_ROWS
      ).byMember.map((row) => memberById(row.id)?.email);
      expect(expected.length).toBeGreaterThan(0);

      await renderRoute(`/teams-enterprise/${NAMED_TEAM}`);
      // The pane mounts in its loading state, whose skeleton row carries the
      // same six cells with no text; wait for the real rows before reading.
      await waitFor(
        () => {
          expect(columnOf(currentMembersTable(), 1)).toEqual(expected);
        },
        { timeout: 10_000 }
      );
    },
    MOUNT_TIMEOUT
  );

  it("no member row on any seed team is missing an address", () => {
    for (const team of TEAM_SEED_ROWS) {
      const { byMember } = securityForTeamAtRange(
        team,
        "all",
        null,
        TEAM_SEED_ROWS
      );
      expect(byMember.length).toBeGreaterThan(0);
      for (const row of byMember) {
        expect(memberById(row.id)?.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      }
    }
  });

  /** The past-members table is the same component with `former` rows, so the
   *  header order cannot differ. What it needs proving is the DATA: a member
   *  who has left still resolves to a roster row, so the column has a real
   *  address to render rather than a fallback dash. */
  it("a past member still resolves to a roster address", () => {
    const team = TEAM_SEED_ROWS.find((t) => t.id === NAMED_TEAM);
    if (!team) {
      throw new Error("seed team missing");
    }
    const emptied = { ...team, memberIds: [] as string[] };
    const { byMember } = securityForTeamAtRange(
      emptied,
      "all",
      null,
      TEAM_SEED_ROWS
    );
    expect(byMember.length).toBeGreaterThan(0);
    expect(byMember.every((r) => r.former)).toBe(true);
    for (const row of byMember) {
      expect(memberById(row.id)?.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    }
  });
});

describe("role sweep", () => {
  const MANAGER: ViewRole = "manager";
  const MEMBER: ViewRole = "member";

  it(
    "a manager sees the column on their own team",
    async () => {
      await renderRoute(`/teams-enterprise/${NAMED_TEAM}`, { role: MANAGER });
      expect(headersOf(currentMembersTable())).toEqual(COLUMNS);
    },
    MOUNT_TIMEOUT
  );

  it(
    "a member never reaches the team detail, so never the table",
    async () => {
      await renderRoute(`/teams-enterprise/${NAMED_TEAM}`, { role: MEMBER });
      expect(screen.queryByText("Events by current members")).toBeNull();
    },
    MOUNT_TIMEOUT
  );
});
