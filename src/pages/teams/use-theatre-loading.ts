/* ─────────────────────────────────────────────────────────────────────────
 * useTheatreLoading — DEMO THEATRE standing in for a fetch state.
 *
 * This build has no network: the Teams data is a synchronous seed, so the
 * skeletons would never be seen. The hook holds `true` for
 * TEAMS_LOADING_THEATRE_MS after mount so the loading pass is visible and
 * reviewable (user direction 2026-09-02: "unless you set a 2 second delay
 * for theatre, which I'm okay with").
 *
 * IN THE REAL APP: replace this hook's return with the query's `isLoading`
 * and nothing else changes — every consumer already takes `loading` as a
 * plain boolean and threads it down as a prop.
 *
 * ONE CALL PER PAGE MOUNT. `TeamsEnterprise` calls it once;
 * `TeamDetailEnterprise` calls it once in the page body and passes `loading`
 * down to every pane, so switching tabs does NOT restart the skeletons.
 * Calling it inside a pane would re-run the delay on every tab change.
 *
 * Lives in its own `.ts` module because `react-refresh/only-export-components`
 * forbids a non-component export from a component file.
 * ───────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";

export const TEAMS_LOADING_THEATRE_MS = 2000;

/** Stable React keys for skeleton table rows, one per row that is coming.
 *  The demo knows the row count up front (the data is local), so the
 *  placeholder matches the real table exactly and the swap is free of layout
 *  shift, which is the jump skeletons exist to prevent. A real implementation
 *  renders its page size here instead. Floors at one so an about-to-be-empty
 *  table still reads as a table rather than a bare header. */
export function skeletonRowIds(realRowCount: number): readonly string[] {
  return Array.from(
    { length: Math.max(realRowCount, 1) },
    (_, i) => `skeleton-${i + 1}`
  );
}

export function useTheatreLoading(): boolean {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setLoading(false),
      TEAMS_LOADING_THEATRE_MS
    );
    return () => window.clearTimeout(timer);
  }, []);

  return loading;
}
