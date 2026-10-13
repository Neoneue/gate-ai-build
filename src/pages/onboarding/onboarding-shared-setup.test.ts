// @vitest-environment happy-dom
import { afterEach, describe, expect, test } from "vitest";
import {
  parseSharedSetup,
  SHARED_SETUP_KEY,
  saveSharedSetup,
  storedSharedSetup,
} from "@/pages/onboarding/onboarding-shared-setup";
import { initialImprovedState } from "@/pages/onboarding/onboarding-state";

afterEach(() => localStorage.clear());

const midSetup = () => ({
  ...initialImprovedState(),
  pathChosen: true,
  connected: true,
  received: true,
  receivedAt: 1_760_000_000_000,
  tasks: { policies: true, limits: false, savings: false, models: false },
});

describe("shared setup state (owner 2026-10-13)", () => {
  test("round-trips through localStorage", () => {
    saveSharedSetup(midSetup());
    expect(storedSharedSetup()).toEqual(midSetup());
  });

  test("is null when nothing usable is stored", () => {
    expect(storedSharedSetup()).toBeNull();
    expect(parseSharedSetup("not json")).toBeNull();
    expect(parseSharedSetup("[]")).toBeNull();
    expect(parseSharedSetup("null")).toBeNull();
  });

  test("drops a field of the wrong type for its initial value", () => {
    const parsed = parseSharedSetup(
      JSON.stringify({
        ...midSetup(),
        finished: "yes",
        keys: "none",
        receivedAt: [1],
        tasks: { policies: "true", limits: true, other: true },
      })
    );
    expect(parsed?.finished).toBe(false);
    expect(parsed?.keys).toEqual([]);
    expect(parsed?.receivedAt).toBeNull();
    expect(parsed?.tasks).toEqual({
      policies: false,
      limits: true,
      savings: false,
      models: false,
    });
    expect(parsed?.connected).toBe(true);
  });

  test("never rewrites an unchanged state", () => {
    saveSharedSetup(midSetup());
    const raw = localStorage.getItem(SHARED_SETUP_KEY);
    let writes = 0;
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (...args) {
      writes += 1;
      return setItem.apply(this, args);
    };
    try {
      saveSharedSetup(midSetup());
    } finally {
      Storage.prototype.setItem = setItem;
    }
    expect(writes).toBe(0);
    expect(localStorage.getItem(SHARED_SETUP_KEY)).toBe(raw);
  });
});
