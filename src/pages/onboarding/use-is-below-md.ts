import { useEffect, useState } from "react";

/** `OnboardingAuthLayout`'s phone breakpoint: Tailwind `max-md`. */
const BELOW_MD_QUERY = "(max-width: 767px)";

/** Live below-`md` match for the onboarding auth screens, which pick
 *  Button's `size` with it: `touch` (44px) below md, `default` (36px) from
 *  md up. `size` is a prop and cannot carry a breakpoint, and a height in a
 *  call-site className is hand-rolling (`.claude/rules/no-handrolling.md`),
 *  so the breakpoint picks the prop, the way `useIsMobileSetup` does on the
 *  phone start (`improved-start.tsx`). Read on first render, so the right
 *  size paints without a flash. */
export function useIsBelowMd(): boolean {
  const [belowMd, setBelowMd] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia(BELOW_MD_QUERY).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(BELOW_MD_QUERY);
    const onChange = (event: MediaQueryListEvent) => setBelowMd(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return belowMd;
}
