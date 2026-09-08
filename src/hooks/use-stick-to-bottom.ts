import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/* ─── useStickToBottom — auto-follow for a streaming thread ──────────────────
 * Split out of `ask-ai-scroll-to-latest.tsx` so that file exports only
 * components (react-refresh requires components and hooks in separate modules).
 *
 * CSS `overflow-anchor` does NOT do this job. Measured 2026-07-28: it stops the
 * scroll position jumping when content changes ABOVE the viewport, but never
 * follows content appended BELOW it — a streaming reply drifted 0 → 819px out
 * of view over ~10s. Hence this hook.
 * ────────────────────────────────────────────────────────────────────────── */

/** Slack at the bottom, in px, within which the user counts as pinned.
    60px is the conventional value: a tighter threshold misfires because
    ordinary content growth briefly opens a small gap that a naive
    `scrollHeight - scrollTop - clientHeight` check misreads as "the user
    scrolled away". Also supplied to the observer as `rootMargin`. */
const BOTTOM_THRESHOLD_PX = 60;

const distanceFromBottom = (el: HTMLElement) =>
  el.scrollHeight - el.scrollTop - el.clientHeight;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export interface StickToBottom {
  /** True while the view is auto-following new content. */
  following: boolean;
  /** FAB press: smooth-scroll to the end AND re-arm following. */
  jumpToLatest: () => void;
  /** Send: snap to the end and re-arm following, without animation. */
  pinToBottom: () => void;
  /** Show the jump-to-latest control. */
  showFab: boolean;
}

/**
 * Stick-to-bottom for a streaming thread.
 *
 * `following` is a user-intent flag, not a geometry read. Deriving it straight
 * from `isAtBottom` does not work: while the reply streams, the sentinel
 * momentarily leaves the threshold every time a chunk lands, which would
 * disarm following even though the user never touched the scroll. So:
 *
 *   - Content grows (ResizeObserver) + following → snap to the end. Runs in
 *     the RO callback, before paint, so there is no visible drift.
 *   - The user touches the scroll (wheel / touch / key) → recompute intent
 *     from the real position on the next frame. Away from the bottom disarms;
 *     scrolling back to the bottom re-arms. Nothing fights the user.
 *   - The FAB and a new message re-arm explicitly.
 */
export function useStickToBottom(
  scrollRef: RefObject<HTMLElement | null>,
  sentinelRef: RefObject<HTMLElement | null>
): StickToBottom {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [following, setFollowing] = useState(true);
  // Mirrors `following` for callbacks that must not re-subscribe on every change.
  const followingRef = useRef(true);
  // True while a smooth scroll we started is still animating.
  const smoothingRef = useRef(false);

  const arm = useCallback((next: boolean) => {
    followingRef.current = next;
    setFollowing(next);
  }, []);

  // Is the sentinel within BOTTOM_THRESHOLD_PX of the visible bottom?
  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!(root && sentinel)) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsAtBottom(entry.isIntersecting);
        if (entry.isIntersecting) {
          // Arrived — any smooth scroll we started is done.
          smoothingRef.current = false;
        }
      },
      { root, rootMargin: `0px 0px ${BOTTOM_THRESHOLD_PX}px 0px`, threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [scrollRef, sentinelRef]);

  /* Content growth: keep the end in view while following, and track whether
     the thread overflows at all (so a short thread never flashes the FAB).
     ResizeObserver covers streaming growth and panel resizes; no scroll
     listener is involved. */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const onResize = () => {
      setHasOverflow(el.scrollHeight > el.clientHeight + 1);
      if (followingRef.current) {
        // Instant, never smooth: a smooth scroll cannot keep up with content
        // that is still growing, and the two animations fight.
        el.scrollTo({ top: el.scrollHeight, behavior: "instant" });
      }
    };
    onResize();
    const observer = new ResizeObserver(onResize);
    observer.observe(el);
    for (const child of el.children) {
      observer.observe(child);
    }
    return () => observer.disconnect();
  }, [scrollRef]);

  /* User took the scroll. Two jobs: kill any smooth scroll of ours that is
     still animating (otherwise the two fight and the view bounces), and
     recompute follow intent from where they actually landed. Bound to input
     events rather than `scroll`, so this stays off the scroll path. */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    let frame = 0;
    const onUserInput = () => {
      if (smoothingRef.current) {
        smoothingRef.current = false;
        el.scrollTo({ top: el.scrollTop, behavior: "instant" });
      }
      // `wheel` fires before the scroll is applied — read on the next frame.
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        arm(distanceFromBottom(el) <= BOTTOM_THRESHOLD_PX);
      });
    };
    const passive = { passive: true } as const;
    el.addEventListener("wheel", onUserInput, passive);
    el.addEventListener("touchmove", onUserInput, passive);
    el.addEventListener("keydown", onUserInput);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("wheel", onUserInput);
      el.removeEventListener("touchmove", onUserInput);
      el.removeEventListener("keydown", onUserInput);
    };
  }, [scrollRef, arm]);

  const jumpToLatest = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const reduced = prefersReducedMotion();
    smoothingRef.current = !reduced;
    arm(true);
    el.scrollTo({
      top: el.scrollHeight,
      behavior: reduced ? "instant" : "smooth",
    });
  }, [scrollRef, arm]);

  const pinToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    smoothingRef.current = false;
    arm(true);
    el.scrollTo({ top: el.scrollHeight, behavior: "instant" });
  }, [scrollRef, arm]);

  return {
    showFab: !isAtBottom && hasOverflow,
    following,
    jumpToLatest,
    pinToBottom,
  };
}
