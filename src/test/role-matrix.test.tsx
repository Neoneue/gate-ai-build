// @vitest-environment happy-dom
/**
 * Role × tier matrix — "hidden in the sidebar must equal blocked by URL".
 *
 * The expected nav sets are DERIVED from `src/layouts/nav-sections.ts`
 * exports, never re-listed here: the chrome renders the rail from the very
 * same arrays and runs `sectionsIncludePage` against them, so a test that
 * hardcoded ids would only prove the test file agrees with itself.
 */

import { cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ENTERPRISE_MEMBER_SIDEBAR_SECTIONS,
  ENTERPRISE_SIDEBAR_SECTIONS,
  ENTERPRISE_TEAM_ROLE_SIDEBAR_SECTIONS,
  PRO_MEMBER_SIDEBAR_SECTIONS,
  PRO_TEAM_ROLE_SIDEBAR_SECTIONS,
  SIDEBAR_SECTIONS,
} from "@/layouts/nav-sections";
import type { ViewRole } from "@/pages/teams/teams-store";
import { mountRoute } from "./mount-with-location";
import { resetViewRole } from "./render";

type SectionSet = typeof SIDEBAR_SECTIONS;

/** The variant arrays already carry their own `-free` / `-enterprise` suffix
 *  (`buildVariantSections`), so nothing is appended here. */
const pageIds = (sections: SectionSet) =>
  new Set(sections.flatMap((s) => s.items.map((i) => i.pageId)));

const TIERS = [
  {
    tier: "Pro",
    suffix: "",
    overview: "/overview",
    byRole: {
      admin: SIDEBAR_SECTIONS,
      manager: PRO_TEAM_ROLE_SIDEBAR_SECTIONS,
      member: PRO_MEMBER_SIDEBAR_SECTIONS,
    },
  },
  {
    tier: "Enterprise",
    suffix: "-enterprise",
    overview: "/overview-enterprise",
    byRole: {
      admin: ENTERPRISE_SIDEBAR_SECTIONS,
      manager: ENTERPRISE_TEAM_ROLE_SIDEBAR_SECTIONS,
      member: ENTERPRISE_MEMBER_SIDEBAR_SECTIONS,
    },
  },
] as const;

const ROLES: ViewRole[] = ["admin", "manager", "member"];

/** Nav hrefs currently in the DOM. The brand lockup is a Link too, but it
 *  carries `aria-label="Go to overview"` — excluded so the set is nav rows. */
function navHrefs(container: HTMLElement): Set<string> {
  const links = container.querySelectorAll<HTMLAnchorElement>("nav a[href]");
  const out = new Set<string>();
  for (const a of links) {
    if (a.getAttribute("aria-label") === "Go to overview") {
      continue;
    }
    out.add(a.getAttribute("href") ?? "");
  }
  return out;
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

describe("sidebar link set equals the role's nav-sections set", () => {
  const cases = TIERS.flatMap((t) => ROLES.map((role) => [t, role] as const));

  it.each(
    cases.map(([t, role]) => [t.tier, role, t] as const)
  )("%s overview as %s renders exactly that role's nav ids", async (_tier, role, t) => {
    const { container } = await mountRoute(t.overview, { role });
    expect(navHrefs(container)).toEqual(pageIds(t.byRole[role as ViewRole]));
  });
});

describe("hidden in the sidebar means blocked by URL", () => {
  const cases: [string, ViewRole, string, string][] = [];
  for (const t of TIERS) {
    for (const role of ROLES) {
      const visible = pageIds(t.byRole[role]);
      for (const path of pageIds(t.byRole.admin)) {
        if (!visible.has(path)) {
          cases.push([t.tier, role, path, t.overview]);
        }
      }
    }
  }

  it("the matrix actually has hidden surfaces to test", () => {
    expect(cases.length).toBeGreaterThan(0);
  });

  it.each(
    cases
  )("%s as %s: %s redirects to %s", async (_tier, role, path, overview) => {
    const { location } = await mountRoute(path, { role });
    expect(location().pathname).toBe(overview);
  });
});

describe("Billing is Admin-only on every plan that has roles", () => {
  const cases: [string, ViewRole, string, string][] = TIERS.flatMap((t) =>
    (["manager", "member"] as ViewRole[]).map(
      (role) =>
        [t.tier, role, `/billing${t.suffix}`, t.overview] as [
          string,
          ViewRole,
          string,
          string,
        ]
    )
  );

  it.each(cases)("%s as %s cannot reach %s", async (_t, role, path, ov) => {
    const { location } = await mountRoute(path, { role });
    expect(location().pathname).toBe(ov);
  });

  it.each(
    TIERS.map((t) => [t.tier, t.suffix] as const)
  )("%s as admin CAN reach Billing", async (_tier, suffix) => {
    const { location } = await mountRoute(`/billing${suffix}`, {
      role: "admin",
    });
    expect(location().pathname).toBe(`/billing${suffix}`);
  });
});

describe('only Pro and Enterprise carry the "Viewing as" role switch', () => {
  it.each([
    ["Default", "/overview-default"],
    ["Free", "/overview-free"],
  ])("%s never renders the control", async (_tier, path) => {
    await mountRoute(path);
    expect(screen.queryByLabelText("Viewing as")).toBeNull();
  });

  it.each([
    ["Pro", "/overview"],
    ["Enterprise", "/overview-enterprise"],
  ])("%s renders the control", async (_tier, path) => {
    await mountRoute(path);
    expect(screen.getAllByLabelText("Viewing as").length).toBeGreaterThan(0);
  });
});
