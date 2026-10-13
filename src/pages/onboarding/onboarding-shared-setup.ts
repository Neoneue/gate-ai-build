import {
  type ImprovedState,
  initialImprovedState,
} from "@/pages/onboarding/onboarding-state";

/* ─── The setup state every onboarding tab shares (owner 2026-10-13) ────────
 * The demo opens tabs of its own (the final page's explore rows, the Tasks
 * menu), and a user can leave setup mid-step for Messages or Activity. Every
 * one of those tabs keeps the Get started row and the Overview, reads the
 * step 3 messages as they land, and can resume setup where it was left, so
 * the Improved flow's state is mirrored to localStorage on every change and
 * read back by the other tabs (a `storage` event). The live Gate build keeps
 * its setup progress the same way (`gate-onboarding-progress`,
 * apps/dashboard-web/src/lib/onboarding-progress.ts).
 * OnboardingProvider decides per tab whether it joins: a fresh run writes
 * the initial state (every tab starts over with it); the desktop Gate Chat
 * tab keeps its own state, as before.
 * ───────────────────────────────────────────────────────────────────────── */

export const SHARED_SETUP_KEY = "gate-onboarding-setup-state";

/** The stored state, shape-checked: a field whose type differs from the
 *  initial state's is dropped for its initial value, so a stale or edited
 *  entry never reaches the pages. Null when nothing usable is stored. */
export function parseSharedSetup(raw: string | null): ImprovedState | null {
  if (!raw) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null;
  }
  const stored = parsed as Record<string, unknown>;
  const base = initialImprovedState();
  const next: Record<string, unknown> = { ...base };
  for (const [key, initial] of Object.entries(base)) {
    const value = stored[key];
    // A null initial (the timestamps, the key id, the link state) takes a
    // stored null, number, string or object.
    const fits =
      initial === null
        ? value === null ||
          typeof value === "number" ||
          typeof value === "string" ||
          (typeof value === "object" && !Array.isArray(value))
        : typeof value === typeof initial &&
          Array.isArray(value) === Array.isArray(initial);
    if (fits) {
      next[key] = value;
    }
  }
  const tasks =
    typeof stored.tasks === "object" && stored.tasks !== null
      ? (stored.tasks as Record<string, unknown>)
      : {};
  next.tasks = Object.fromEntries(
    Object.keys(base.tasks).map((task) => [task, tasks[task] === true])
  );
  return next as ImprovedState;
}

export function storedSharedSetup(): ImprovedState | null {
  try {
    return parseSharedSetup(localStorage.getItem(SHARED_SETUP_KEY));
  } catch {
    return null;
  }
}

/** Writes the state unless it is already stored, so a tab that just read
 *  another tab's change never echoes it back. */
export function saveSharedSetup(state: ImprovedState): void {
  try {
    const raw = JSON.stringify(state);
    if (localStorage.getItem(SHARED_SETUP_KEY) !== raw) {
      localStorage.setItem(SHARED_SETUP_KEY, raw);
    }
  } catch {
    // Storage blocked: each tab keeps its own state, as before.
  }
}
