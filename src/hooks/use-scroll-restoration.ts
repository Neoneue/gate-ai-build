import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/* Scroll restoration for the app shell's internal scroller. At lg+ the
 * document doesn't scroll; `<main>` inside DashboardChrome does, so the
 * browser's native back-restores-scroll never fires and returning from a
 * deep link (a notification's security event, a findings page) dumped you
 * at the top of a page you'd scrolled to the bottom of.
 *
 * The store is MODULE-LEVEL, not component state, because every page
 * remounts its own DashboardChrome on navigation (see the comment in
 * DashboardChrome) so anything kept in the component is gone exactly when
 * the back navigation needs it. Keyed by `location.key`, which is unique
 * per history entry: two visits to the same path restore independently.
 * Session-scoped by design; a full reload clears it along with the
 * in-memory history stack it mirrors.
 *
 * Restore fires ONLY on POP (back/forward). PUSH and REPLACE are left
 * untouched: a fresh mount already starts at the top, and same-route
 * search-param writes (the `?range=` producers) re-render without
 * remounting, where forcing scrollTop = 0 would yank the page under the
 * control the user just clicked. */
const positions = new Map<string, number>();

export function useScrollRestoration<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const { key } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    if (navigationType === "POP") {
      el.scrollTop = positions.get(key) ?? 0;
    }
    const onScroll = () => positions.set(key, el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [key, navigationType]);

  return ref;
}
