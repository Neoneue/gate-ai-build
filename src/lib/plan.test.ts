import { describe, expect, it } from "vitest";
import {
  isOnboardingSurface,
  isTeamRoleSurface,
  ONBOARDING_FIRST_STEP,
  tierSuffixOf,
  toDefaultPath,
  toEnterprisePath,
  toFreePath,
  toOnboardingPath,
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
    ["/overview-onboarding", false],
    ["/setup-listening-onboarding", false],
    ["/chat-onboarding/cnv_x", false],
  ])("%s -> %s", (pathname, expected) => {
    expect(isTeamRoleSurface(pathname)).toBe(expected);
  });
});

describe("Onboarding workspace", () => {
  it.each([
    ["/overview-onboarding", true],
    ["/improved-verify-onboarding", true],
    ["/chat-onboarding/cnv_x", true],
    ["/overview-default", false],
    ["/onboarding-notes", false],
  ])("isOnboardingSurface(%s) -> %s", (pathname, expected) => {
    expect(isOnboardingSurface(pathname)).toBe(expected);
  });

  it("switching in always lands on the first step", () => {
    expect(toOnboardingPath()).toBe("/overview-onboarding");
    expect(ONBOARDING_FIRST_STEP).toBe("/overview-onboarding");
  });

  it("switching out goes to the other workspace's Overview", () => {
    expect(toProPath("/setup-attack-onboarding")).toBe("/overview");
    expect(toProPath("/overview-onboarding")).toBe("/overview");
    expect(toDefaultPath("/overview-onboarding")).toBe("/overview-default");
    expect(toFreePath("/improved-connect-onboarding")).toBe("/overview-free");
    expect(toEnterprisePath("/overview-onboarding")).toBe(
      "/overview-enterprise"
    );
  });

  it("chat links stay inside the workspace", () => {
    expect(tierSuffixOf("/chat-onboarding")).toBe("-onboarding");
    expect(withTierOf("/chat-onboarding", "/chat/cnv_x")).toBe(
      "/chat-onboarding/cnv_x"
    );
    expect(withTierOf("/chat-onboarding/cnv_x", "/overview")).toBe(
      "/overview-onboarding"
    );
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
