import { describe, expect, it } from "vitest";
import {
  isTeamRoleSurface,
  toDefaultPath,
  toEnterprisePath,
  toFreePath,
  toProPath,
  withTierOf,
} from "./plan";

describe("isTeamRoleSurface", () => {
  it.each([
    ["/messages", true],
    ["/messages-enterprise", true],
    ["/messages-findings-enterprise/x", true],
    ["/messages-free", false],
    ["/overview-default", false],
    ["/teams-default/t1", false],
  ])("%s -> %s", (pathname, expected) => {
    expect(isTeamRoleSurface(pathname)).toBe(expected);
  });
});

describe("withTierOf", () => {
  it.each([
    [
      "/messages-enterprise",
      "/messages-findings/abc",
      "/messages-findings-enterprise/abc",
    ],
    ["/conversations-free", "/conversations", "/conversations-free"],
    ["/messages", "/messages-findings/abc", "/messages-findings/abc"],
    ["/overview", "/conversations-trace/cnv_x", "/conversations-trace/cnv_x"],
    ["/messages-findings-default/x", "/messages", "/messages-default"],
    [
      "/conversations-trace-enterprise/cnv_x",
      "/conversations",
      "/conversations-enterprise",
    ],
    [
      "/teams-enterprise/t1",
      "/messages-findings/abc",
      "/messages-findings-enterprise/abc",
    ],
    [
      "/security-default",
      "/conversations-trace/cnv_x",
      "/conversations-trace-default/cnv_x",
    ],
  ])("on %s, target %s -> %s", (current, target, expected) => {
    expect(withTierOf(current, target)).toBe(expected);
  });
});

describe("workspace switcher keeps the detail pages", () => {
  it.each([
    [
      "/messages-findings/abc",
      "/messages-findings-enterprise/abc",
      "/messages-findings-free/abc",
      "/messages-findings-default/abc",
    ],
    [
      "/conversations-trace/cnv_x",
      "/conversations-trace-enterprise/cnv_x",
      "/conversations-trace-free/cnv_x",
      "/conversations-trace-default/cnv_x",
    ],
  ])("%s", (pro, enterprise, free, def) => {
    expect(toEnterprisePath(pro)).toBe(enterprise);
    expect(toFreePath(pro)).toBe(free);
    expect(toDefaultPath(pro)).toBe(def);
    for (const twin of [enterprise, free, def]) {
      expect(toProPath(twin)).toBe(pro);
    }
  });
});
