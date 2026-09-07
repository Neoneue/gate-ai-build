import { expect, test } from "vitest";
import {
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
