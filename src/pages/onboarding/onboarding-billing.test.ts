import { describe, expect, test } from "vitest";
import { onboardingCredits } from "@/pages/onboarding/onboarding-billing";
import { initialImprovedState } from "@/pages/onboarding/onboarding-state";

const AT = new Date(2026, 9, 13, 11, 30, 0).getTime();

describe("onboarding credits (owner 2026-10-13)", () => {
  test("no top-up: no balance, Last top-up Never, no history", () => {
    expect(
      onboardingCredits({ ...initialImprovedState(), billing: "payg" })
    ).toEqual({ balanceUsd: 0, lastTopUp: null, history: [] });
  });

  test("one top-up on Gate credits: one Credits added row", () => {
    const credits = onboardingCredits({
      ...initialImprovedState(),
      billing: "payg",
      topUps: [{ at: AT, amountUsd: 25 }],
    });
    expect(credits.balanceUsd).toBe(25);
    expect(credits.lastTopUp).toMatch(/· \$25$/);
    expect(credits.history).toEqual([
      {
        id: "onboarding-top-up-0",
        date: new Date(AT),
        type: "Credits added",
        amount: 25,
        balanceAfter: 25,
      },
    ]);
  });

  test("two top-ups: newest first, running balance", () => {
    const credits = onboardingCredits({
      ...initialImprovedState(),
      billing: "payg",
      topUps: [
        { at: AT, amountUsd: 25 },
        { at: AT + 60_000, amountUsd: 10 },
      ],
    });
    expect(credits.balanceUsd).toBe(35);
    expect(credits.history.map((r) => [r.amount, r.balanceAfter])).toEqual([
      [10, 35],
      [25, 25],
    ]);
  });

  test("Existing subscriptions never show credits", () => {
    expect(
      onboardingCredits({
        ...initialImprovedState(),
        billing: "existing",
        topUps: [{ at: AT, amountUsd: 25 }],
      })
    ).toEqual({ balanceUsd: 0, lastTopUp: null, history: [] });
  });
});
