// @vitest-environment happy-dom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addOnboardingCredits,
  readOnboardingBalance,
  resetOnboardingBalance,
  useOnboardingBalance,
} from "./onboarding-credits";

/* The onboarding balance both tabs read (owner 2026-10-13): Add credits in
 * the setup tab shows in the Gate Chat tab, live; a fresh run resets it. */

afterEach(() => {
  resetOnboardingBalance();
  vi.restoreAllMocks();
});

describe("onboarding credits", () => {
  it("starts at 0 and adds up", () => {
    expect(readOnboardingBalance()).toBe(0);
    addOnboardingCredits(25);
    addOnboardingCredits(10);
    expect(readOnboardingBalance()).toBe(35);
  });

  it("ignores a non-positive amount", () => {
    addOnboardingCredits(0);
    addOnboardingCredits(-5);
    expect(readOnboardingBalance()).toBe(0);
  });

  it("resets to 0 for a fresh run", () => {
    addOnboardingCredits(25);
    resetOnboardingBalance();
    expect(readOnboardingBalance()).toBe(0);
  });

  it("updates a mounted reader in this tab and from another tab", () => {
    const { result } = renderHook(() => useOnboardingBalance());
    expect(result.current).toBe(0);
    act(() => addOnboardingCredits(25));
    expect(result.current).toBe(25);
    // Another tab writes storage directly; this tab hears the storage event.
    act(() => {
      localStorage.setItem("gate-onboarding-credits", "40");
      window.dispatchEvent(
        new StorageEvent("storage", { key: "gate-onboarding-credits" })
      );
    });
    expect(result.current).toBe(40);
  });

  it("reads 0 when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readOnboardingBalance()).toBe(0);
  });
});
