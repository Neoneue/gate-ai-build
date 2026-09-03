import { expect, test } from "vitest";
import {
  ENTERPRISE_MEMBER_SIDEBAR_SECTIONS,
  ENTERPRISE_SIDEBAR_SECTIONS,
  ENTERPRISE_TEAM_ROLE_SIDEBAR_SECTIONS,
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
