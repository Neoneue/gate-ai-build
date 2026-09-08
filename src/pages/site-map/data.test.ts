import { expect, test } from "vitest";
import {
  DETAIL_PAGE_RULES,
  hiddenNavIdsFor,
  PRD_REFS,
  rowsForWorkspace,
  SITE_MAP_COLUMNS,
  SITE_MAP_MATRIX,
  SITE_MAP_ROLES,
  SITE_MAP_WORKSPACES,
  type WorkspaceId,
} from "./data";

const itemIds = (row: (typeof SITE_MAP_MATRIX)[number]) =>
  row.sidebar.flatMap((section) => section.items.map((item) => item.id));

const rolesOn = (id: WorkspaceId) => rowsForWorkspace(id).map((r) => r.role);

test("exactly four workspaces, three of them drawn as columns", () => {
  expect(SITE_MAP_WORKSPACES).toHaveLength(4);
  expect(SITE_MAP_WORKSPACES.map((w) => w.id)).toEqual([
    "free",
    "pro",
    "enterprise",
    "default",
  ]);
  // Default is a state of the Free plan, not an org type: footnote, no column.
  expect(SITE_MAP_COLUMNS.map((w) => w.id)).toEqual([
    "free",
    "pro",
    "enterprise",
  ]);
});

test("three roles on Pro and Enterprise, one on Default and Free", () => {
  expect(rolesOn("pro")).toEqual(["admin", "manager", "member"]);
  expect(rolesOn("enterprise")).toEqual(["admin", "manager", "member"]);
  expect(rolesOn("default")).toEqual(["admin"]);
  expect(rolesOn("free")).toEqual(["admin"]);
  expect(SITE_MAP_ROLES).toHaveLength(3);
});

test("switchAvailable tracks isTeamRoleSurface, not the row count", () => {
  for (const row of SITE_MAP_MATRIX) {
    const expected = row.workspace === "pro" || row.workspace === "enterprise";
    expect(row.switchAvailable).toBe(expected);
  }
});

test("member rows never list a teams item", () => {
  const memberRows = SITE_MAP_MATRIX.filter((r) => r.role === "member");
  expect(memberRows).toHaveLength(2);
  for (const row of memberRows) {
    expect(itemIds(row)).not.toContain("teams");
  }
});

test("team-role rows never list Members or Billing", () => {
  const teamRoleRows = SITE_MAP_MATRIX.filter((r) => r.role !== "admin");
  expect(teamRoleRows).toHaveLength(4);
  for (const row of teamRoleRows) {
    expect(itemIds(row)).not.toContain("team");
    expect(itemIds(row)).not.toContain("billing");
  }
});

test("only Enterprise rows are entitled to forced settings", () => {
  for (const row of SITE_MAP_MATRIX) {
    expect(row.entitledForcedSettings).toBe(row.workspace === "enterprise");
  }
  const entitled = SITE_MAP_MATRIX.filter((r) => r.entitledForcedSettings);
  expect(entitled).toHaveLength(3);
});

test("every role row cites at least one PRD section", () => {
  const known = new Set<string>(Object.values(PRD_REFS));
  for (const row of SITE_MAP_MATRIX) {
    expect(row.prdRefs.length).toBeGreaterThan(0);
    for (const ref of row.prdRefs) {
      expect(known).toContain(ref);
    }
  }
  // Team-scoped access justifies the non-admin views specifically.
  for (const row of SITE_MAP_MATRIX.filter((r) => r.role !== "admin")) {
    expect(row.prdRefs).toContain(PRD_REFS.teamScope);
  }
  // Forced settings is cited only where the entitlement exists.
  for (const row of SITE_MAP_MATRIX) {
    expect(row.prdRefs.includes(PRD_REFS.forcedSettings)).toBe(
      row.entitledForcedSettings
    );
  }
});

test("routes carry the workspace suffix and include the detail twins", () => {
  for (const row of SITE_MAP_MATRIX) {
    const suffix =
      SITE_MAP_WORKSPACES.find((w) => w.id === row.workspace)?.suffix ?? "";
    expect(row.detailRoutes).toEqual([
      `/messages-findings${suffix}/:requestId`,
      `/conversations-trace${suffix}/:conversationId`,
    ]);
    for (const detail of row.detailRoutes) {
      expect(row.routes).toContain(detail);
    }
    expect(row.routes).toContain(`/overview${suffix}`);
    expect(row.routes.length).toBeGreaterThan(itemIds(row).length);
  }
});

test("Teams landing differs per role and stays in-workspace", () => {
  const [proAdmin, proManager, proMember] = rowsForWorkspace("pro");
  expect(proAdmin.teamsLanding.path).toBe("/teams");
  expect(proManager.teamsLanding.path).toBe("/teams/:teamId");
  expect(proMember.teamsLanding.path).toBe("/overview");

  const [entAdmin, entManager, entMember] = rowsForWorkspace("enterprise");
  expect(entAdmin.teamsLanding.path).toBe("/teams-enterprise");
  expect(entManager.teamsLanding.path).toBe("/teams-enterprise/:teamId");
  expect(entMember.teamsLanding.path).toBe("/overview-enterprise");

  // Free hides Teams entirely; Default keeps it (single owner, one team).
  expect(rowsForWorkspace("free")[0].teamsLanding.path).toBe("—");
  expect(rowsForWorkspace("default")[0].teamsLanding.path).toBe(
    "/teams-default"
  );
});

test("personas come from the roster, not from string literals", () => {
  expect(SITE_MAP_ROLES.map((r) => r.persona)).toEqual([
    "Chad Ponticas",
    "Kira Tan",
    "Mateus Silva",
  ]);
  for (const row of SITE_MAP_MATRIX) {
    expect(row.persona).toBe(
      SITE_MAP_ROLES.find((r) => r.id === row.role)?.persona
    );
  }
});

test("each row names the real nav-sections constant it renders", () => {
  const byKey = Object.fromEntries(
    SITE_MAP_MATRIX.map((r) => [`${r.workspace}/${r.role}`, r.sidebarConstant])
  );
  expect(byKey).toEqual({
    "free/admin": "FREE_SIDEBAR_SECTIONS",
    "default/admin": "DEFAULT_SIDEBAR_SECTIONS",
    "pro/admin": "SIDEBAR_SECTIONS",
    "pro/manager": "PRO_TEAM_ROLE_SIDEBAR_SECTIONS",
    "pro/member": "PRO_MEMBER_SIDEBAR_SECTIONS",
    "enterprise/admin": "ENTERPRISE_SIDEBAR_SECTIONS",
    "enterprise/manager": "ENTERPRISE_TEAM_ROLE_SIDEBAR_SECTIONS",
    "enterprise/member": "ENTERPRISE_MEMBER_SIDEBAR_SECTIONS",
  });
});

/* ─── Hidden = blocked ───────────────────────────────────────────────────
 * `hiddenNavIds` is derived with the same `sectionsIncludePage` call the
 * chrome guards with (`layouts/DashboardChrome.tsx`), so the sheet cannot
 * describe a rule the shell does not enforce. */

test("hidden nav ids are derived per role, never typed", () => {
  const hidden = Object.fromEntries(
    SITE_MAP_MATRIX.map((r) => [
      `${r.workspace}/${r.role}`,
      [...r.hiddenNavIds].sort(),
    ])
  );
  expect(hidden).toEqual({
    "free/admin": ["teams"],
    "default/admin": [],
    "pro/admin": [],
    "pro/manager": ["billing", "team"],
    "pro/member": ["billing", "team", "teams"],
    "enterprise/admin": [],
    "enterprise/manager": ["billing", "team"],
    "enterprise/member": ["billing", "team", "teams"],
  });
});

test("a hidden id is absent from that row's own sidebar and routes", () => {
  for (const row of SITE_MAP_MATRIX) {
    const suffix =
      SITE_MAP_WORKSPACES.find((w) => w.id === row.workspace)?.suffix ?? "";
    for (const id of row.hiddenNavIds) {
      expect(itemIds(row)).not.toContain(id);
    }
    // …and every id it does carry is one the chrome would let it render.
    for (const id of itemIds(row)) {
      expect(row.hiddenNavIds).not.toContain(id);
    }
    expect(row.routes).toContain(`/overview${suffix}`);
  }
});

test("hiddenNavIdsFor reads the matrix rather than a second list", () => {
  for (const row of SITE_MAP_MATRIX) {
    expect(hiddenNavIdsFor(row.workspace, row.role)).toEqual(row.hiddenNavIds);
  }
  expect(hiddenNavIdsFor("pro", "member")).toContain("teams");
});

test("the Hidden pages rule names the ids it derives", () => {
  const entry = DETAIL_PAGE_RULES.find((e) => e.term === "Hidden pages");
  expect(entry).toBeDefined();
  expect(entry?.detail).toContain("hidden from that role's sidebar");
  expect(entry?.detail).toContain("blocked by URL");
  expect(entry?.detail).toContain("Admin sees every page");
  for (const id of hiddenNavIdsFor("pro", "member")) {
    expect(entry?.detail).toContain(id);
  }
});

test("no nav row on the sheet is inert: every item has a route", () => {
  for (const row of SITE_MAP_MATRIX) {
    for (const section of row.sidebar) {
      for (const item of section.items) {
        expect(item.pageId).toBeTruthy();
      }
    }
  }
});
