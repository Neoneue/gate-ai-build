import { describe, expect, test } from "vitest";
import {
  ONBOARDING_ROUTES,
  ONBOARDING_WORKSPACE_PAGES,
  onboardingUpgradePath,
  SETUP_NAV_ID,
  setupSidebarSections,
} from "@/pages/onboarding/onboarding-routes";
import { initialImprovedState } from "@/pages/onboarding/onboarding-state";

const rowsOf = (
  improved: Parameters<typeof setupSidebarSections>[0]
): { id: string; pageId: string }[] =>
  setupSidebarSections(improved).flatMap((section) =>
    section.items.map(({ id, pageId }) => ({ id, pageId }))
  );

const ALL_TASKS = { policies: true, limits: true, savings: true, models: true };

describe("onboarding rail (owner 2026-10-13)", () => {
  test("Get started then Overview from step 1, Overview on the workspace's Overview", () => {
    const rows = rowsOf(initialImprovedState());
    expect(rows.slice(0, 2)).toEqual([
      { id: SETUP_NAV_ID, pageId: ONBOARDING_ROUTES.start },
      { id: "overview", pageId: ONBOARDING_ROUTES.setupOverview },
    ]);
  });

  test("Get started resumes the step due next", () => {
    const base = { ...initialImprovedState(), pathChosen: true };
    expect(rowsOf(base)[0]?.pageId).toBe(ONBOARDING_ROUTES.improvedConnect);
    expect(rowsOf({ ...base, connected: true })[0]?.pageId).toBe(
      ONBOARDING_ROUTES.verify
    );
    expect(
      rowsOf({ ...base, connected: true, finished: true })[0]?.pageId
    ).toBe(ONBOARDING_ROUTES.improvedComplete);
  });

  test("Get started stays at 4/4 setup until all four tasks are checked off", () => {
    const finished = { ...initialImprovedState(), finished: true };
    expect(rowsOf(finished)[0]?.id).toBe(SETUP_NAV_ID);
    expect(
      rowsOf({ ...finished, tasks: { ...ALL_TASKS, models: false } })[0]?.id
    ).toBe(SETUP_NAV_ID);
    const done = rowsOf({ ...finished, tasks: ALL_TASKS });
    expect(done.some((row) => row.id === SETUP_NAV_ID)).toBe(false);
    expect(done[0]).toEqual({
      id: "overview",
      pageId: ONBOARDING_ROUTES.setupOverview,
    });
  });

  test("outside the flow: no Get started, Overview still present", () => {
    const rows = rowsOf(null);
    expect(rows.some((row) => row.id === SETUP_NAV_ID)).toBe(false);
    expect(rows[0]?.id).toBe("overview");
  });

  test("the Overview renders on a cold load (a new tab)", () => {
    expect(
      ONBOARDING_WORKSPACE_PAGES.has(ONBOARDING_ROUTES.setupOverview)
    ).toBe(true);
  });

  test("the Upgrade card shows from the final page on", () => {
    expect(onboardingUpgradePath(initialImprovedState())).toBeUndefined();
    expect(onboardingUpgradePath(null)).toBeUndefined();
    expect(
      onboardingUpgradePath({ ...initialImprovedState(), finished: true })
    ).toBe("/billing-onboarding/plans");
  });
});
