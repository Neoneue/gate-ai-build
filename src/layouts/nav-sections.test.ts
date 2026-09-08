import { expect, test } from "vitest";
import {
  DEFAULT_SIDEBAR_SECTIONS,
  ENTERPRISE_MEMBER_SIDEBAR_SECTIONS,
  ENTERPRISE_SIDEBAR_SECTIONS,
  ENTERPRISE_TEAM_ROLE_SIDEBAR_SECTIONS,
  FREE_SIDEBAR_SECTIONS,
  PRO_MEMBER_SIDEBAR_SECTIONS,
  PRO_TEAM_ROLE_SIDEBAR_SECTIONS,
  SIDEBAR_SECTIONS,
  sectionsIncludePage,
} from "./nav-sections";

const ids = (sections: typeof ENTERPRISE_SIDEBAR_SECTIONS) =>
  sections.flatMap((s) => s.items.map((i) => i.id));

test("team-role sidebar hides only Members and Billing (AG-695 AC 3)", () => {
  const admin = ids(ENTERPRISE_SIDEBAR_SECTIONS);
  const teamRole = ids(ENTERPRISE_TEAM_ROLE_SIDEBAR_SECTIONS);
  for (const hidden of ["team", "billing"]) {
    expect(admin).toContain(hidden);
    expect(teamRole).not.toContain(hidden);
  }
  for (const kept of [
    "audit-trail",
    "api-keys",
    "limits",
    "security-events",
    "teams",
  ]) {
    expect(teamRole).toContain(kept);
  }
  expect(teamRole).toEqual(
    admin.filter((id) => !["team", "billing"].includes(id))
  );
});

test("member sidebar also hides Teams (confirmed 2026-09-03)", () => {
  const admin = ids(ENTERPRISE_SIDEBAR_SECTIONS);
  const member = ids(ENTERPRISE_MEMBER_SIDEBAR_SECTIONS);
  expect(member).not.toContain("teams");
  expect(member).toEqual(
    admin.filter((id) => !["team", "billing", "teams"].includes(id))
  );
});

/* Pro carries the same role variants as Enterprise: PRD §3 scopes teams,
 * budgets, roll-up and the team-manager role to BOTH plans — only the
 * org/team forced settings are Enterprise-only. */

test("Pro team-role sidebar hides Members and Billing (PRD §3)", () => {
  const admin = ids(SIDEBAR_SECTIONS);
  const teamRole = ids(PRO_TEAM_ROLE_SIDEBAR_SECTIONS);
  for (const hidden of ["team", "billing"]) {
    expect(admin).toContain(hidden);
    expect(teamRole).not.toContain(hidden);
  }
  for (const kept of [
    "audit-trail",
    "api-keys",
    "limits",
    "security-events",
    "teams",
  ]) {
    expect(teamRole).toContain(kept);
  }
  expect(teamRole).toEqual(
    admin.filter((id) => !["team", "billing"].includes(id))
  );
});

test("Pro member sidebar also hides Teams", () => {
  const admin = ids(SIDEBAR_SECTIONS);
  const member = ids(PRO_MEMBER_SIDEBAR_SECTIONS);
  expect(member).not.toContain("teams");
  expect(member).toEqual(
    admin.filter((id) => !["team", "billing", "teams"].includes(id))
  );
});

test("Pro role sidebars keep unsuffixed paths", () => {
  const paths = [
    ...PRO_TEAM_ROLE_SIDEBAR_SECTIONS,
    ...PRO_MEMBER_SIDEBAR_SECTIONS,
  ].flatMap((s) => s.items.map((i) => i.pageId));
  expect(paths.length).toBeGreaterThan(0);
  for (const pageId of paths) {
    expect(pageId).toBeDefined();
    expect(pageId).not.toMatch(/-(default|free|enterprise)(?=\/|$)/);
  }
});

/* ─── The 16 nav ids, and who loses which ────────────────────────────────
 * The chrome blocks by URL on exactly one test — `sectionsIncludePage`
 * against the same set it renders the rail from — so a page dropped from a
 * variant here is a page that variant cannot reach at all. These pin the
 * membership of every variant so a nav edit cannot silently open or close a
 * surface to a role. PRD §3, §8.4, §11. */

const ALL_NAV_IDS = [
  "activity",
  "api-keys",
  "audit-trail",
  "billing",
  "conversations",
  "limits",
  "models",
  "notifications",
  "overview",
  "policies",
  "requests",
  "security-events",
  "settings",
  "team",
  "teams",
  "token-savings",
];

test("the admin sidebars carry all 16 nav ids", () => {
  for (const sections of [SIDEBAR_SECTIONS, ENTERPRISE_SIDEBAR_SECTIONS]) {
    expect([...ids(sections)].sort()).toEqual(ALL_NAV_IDS);
  }
});

test("manager variants drop team and billing, keep teams", () => {
  for (const sections of [
    PRO_TEAM_ROLE_SIDEBAR_SECTIONS,
    ENTERPRISE_TEAM_ROLE_SIDEBAR_SECTIONS,
  ]) {
    expect(ids(sections)).not.toContain("team");
    expect(ids(sections)).not.toContain("billing");
    expect(ids(sections)).toContain("teams");
  }
});

test("member variants drop team, billing and teams", () => {
  for (const sections of [
    PRO_MEMBER_SIDEBAR_SECTIONS,
    ENTERPRISE_MEMBER_SIDEBAR_SECTIONS,
  ]) {
    for (const hidden of ["team", "billing", "teams"]) {
      expect(ids(sections)).not.toContain(hidden);
    }
  }
});

test("the Free workspace drops teams", () => {
  expect(ids(FREE_SIDEBAR_SECTIONS)).not.toContain("teams");
  expect([...ids(FREE_SIDEBAR_SECTIONS)].sort()).toEqual(
    ALL_NAV_IDS.filter((id) => id !== "teams")
  );
});

/* ─── sectionsIncludePage — the guard's whole implementation ──────────── */

test("sectionsIncludePage answers membership across every section", () => {
  for (const id of ALL_NAV_IDS) {
    expect(sectionsIncludePage(SIDEBAR_SECTIONS, id)).toBe(true);
  }
  expect(sectionsIncludePage(SIDEBAR_SECTIONS, "not-a-page")).toBe(false);
  expect(sectionsIncludePage([], "overview")).toBe(false);
});

test("sectionsIncludePage matches each variant's own membership", () => {
  const variants = [
    SIDEBAR_SECTIONS,
    FREE_SIDEBAR_SECTIONS,
    DEFAULT_SIDEBAR_SECTIONS,
    ENTERPRISE_SIDEBAR_SECTIONS,
    PRO_TEAM_ROLE_SIDEBAR_SECTIONS,
    PRO_MEMBER_SIDEBAR_SECTIONS,
    ENTERPRISE_TEAM_ROLE_SIDEBAR_SECTIONS,
    ENTERPRISE_MEMBER_SIDEBAR_SECTIONS,
  ];
  for (const sections of variants) {
    for (const id of ALL_NAV_IDS) {
      expect(sectionsIncludePage(sections, id)).toBe(
        ids(sections).includes(id)
      );
    }
  }
});

/* Overview is what the chrome redirects a blocked viewer to, so no variant
 * may ever drop it — otherwise the guard would bounce into itself. */
test("every variant keeps overview, so the redirect target always renders", () => {
  for (const sections of [
    SIDEBAR_SECTIONS,
    FREE_SIDEBAR_SECTIONS,
    DEFAULT_SIDEBAR_SECTIONS,
    ENTERPRISE_SIDEBAR_SECTIONS,
    PRO_TEAM_ROLE_SIDEBAR_SECTIONS,
    PRO_MEMBER_SIDEBAR_SECTIONS,
    ENTERPRISE_TEAM_ROLE_SIDEBAR_SECTIONS,
    ENTERPRISE_MEMBER_SIDEBAR_SECTIONS,
  ]) {
    expect(sectionsIncludePage(sections, "overview")).toBe(true);
  }
});

/* Locking is gone: hiding is the only mechanism the nav has, so every row
 * that renders is a live destination. */
test("every item in every variant has a route", () => {
  for (const sections of [
    SIDEBAR_SECTIONS,
    FREE_SIDEBAR_SECTIONS,
    DEFAULT_SIDEBAR_SECTIONS,
    ENTERPRISE_SIDEBAR_SECTIONS,
    PRO_TEAM_ROLE_SIDEBAR_SECTIONS,
    PRO_MEMBER_SIDEBAR_SECTIONS,
    ENTERPRISE_TEAM_ROLE_SIDEBAR_SECTIONS,
    ENTERPRISE_MEMBER_SIDEBAR_SECTIONS,
  ]) {
    for (const section of sections) {
      for (const item of section.items) {
        expect(item.pageId).toBeTruthy();
        expect(item.pageId).not.toContain("undefined");
      }
    }
  }
});
