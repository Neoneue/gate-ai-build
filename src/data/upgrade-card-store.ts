import { useSyncExternalStore } from "react";

/* ─────────────────────────────────────────────────────────────────────────
 * Whether the sidebar's "Upgrade to Pro plan" promo was dismissed.
 *
 * Held in memory and deliberately never persisted, the same shape as
 * `notifications-store.ts`: it survives navigation between pages (every
 * page mounts its own sidebar) but comes back on a full reload, so the
 * mockup can be demoed again from the start.
 * ───────────────────────────────────────────────────────────────────────── */

let dismissed = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Hides the promo for the rest of the visit. */
export function dismissUpgradeCard() {
  if (dismissed) {
    return;
  }
  dismissed = true;
  for (const listener of listeners) {
    listener();
  }
}

/** True once the promo has been dismissed this visit. */
export function useUpgradeCardDismissed(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => dismissed,
    () => false
  );
}
