import { useEffect, useState } from "react";

/** Reactive `matchMedia` — returns whether `query` currently matches and
 *  re-renders when it changes. SSR-safe (no window → false on first paint).
 *  Kept dependency-free so any component can gate layout/count on a breakpoint
 *  without a resize listener of its own. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
