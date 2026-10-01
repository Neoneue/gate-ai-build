import { useEffect, useState } from "react";

/** The chrome's one breakpoint: the persistent rail, the docked Ask AI column
 *  and the top bar's full control set all switch at `lg` (1024px). */
const DESKTOP_QUERY = "(min-width: 1024px)";

/** Live `lg`+ match. Shared by the dashboard chrome and the Gate Chat layout
 *  so both open the Ask AI panel docked on desktop and in a Sheet below. */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const handleChange = (event: MediaQueryListEvent) =>
      setIsDesktop(event.matches);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);
  return isDesktop;
}
