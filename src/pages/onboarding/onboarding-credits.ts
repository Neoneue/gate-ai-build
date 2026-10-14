import { useSyncExternalStore } from "react";

/* ─── The Onboarding workspace's credit balance, shared across tabs ─────────
 * Owner requirement 2026-10-13: "During onboarding, if a user adds credits
 * then opens Gate chat any time during the demo it needs to show the updated
 * balance and they can then use paid models."
 *
 * Desktop Gate Chat opens in a new tab (`window.open`, noopener), which
 * cannot see the setup tab's in-memory flow state, so the balance is the one
 * piece of the run kept in `localStorage`, under one onboarding key. Every
 * tab reads it here; the `storage` event updates a tab that is already open
 * the moment another tab adds credits. A fresh run (the desktop start page,
 * or the Mobile A signup, both in `OnboardingLayout`) resets it to 0.
 *
 * It is the workspace's second stored value, after the Mobile A tab mark in
 * `onboarding-routes.ts`. Storage blocked: every read is 0, so the chat
 * shows $0.00 and keeps the free-send rule.
 * ───────────────────────────────────────────────────────────────────────── */

const ONBOARDING_CREDITS_KEY = "gate-onboarding-credits";

/** This tab's own listeners: the `storage` event fires only in OTHER tabs. */
const listeners = new Set<() => void>();

const notify = () => {
  for (const listener of listeners) {
    listener();
  }
};

/** The stored balance in whole or fractional USD; 0 when unset, invalid or
 *  storage is blocked. */
export function readOnboardingBalance(): number {
  try {
    const value = Number(localStorage.getItem(ONBOARDING_CREDITS_KEY));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function writeOnboardingBalance(usd: number) {
  try {
    if (usd > 0) {
      localStorage.setItem(ONBOARDING_CREDITS_KEY, String(usd));
    } else {
      localStorage.removeItem(ONBOARDING_CREDITS_KEY);
    }
  } catch {
    // Storage blocked: the balance stays 0 everywhere.
  }
  notify();
}

/** Adds `usd` to the shared balance (every onboarding Add credits). */
export function addOnboardingCredits(usd: number): void {
  if (!(Number.isFinite(usd) && usd > 0)) {
    return;
  }
  writeOnboardingBalance(readOnboardingBalance() + usd);
}

/** Sets the shared balance to this run's setup balance: the landing page
 *  (`OnboardingLayout`) so a balance left by an earlier run never shows in
 *  the chat (owner 2026-10-14). */
export function syncOnboardingBalance(usd: number): void {
  writeOnboardingBalance(Number.isFinite(usd) && usd > 0 ? usd : 0);
}

/** Back to 0: a fresh onboarding run starts. */
export function resetOnboardingBalance(): void {
  writeOnboardingBalance(0);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    // `key` is null when another tab clears all of storage.
    if (event.key === null || event.key === ONBOARDING_CREDITS_KEY) {
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The shared balance, live: updates when this tab or another adds credits. */
export function useOnboardingBalance(): number {
  return useSyncExternalStore(subscribe, readOnboardingBalance, () => 0);
}
