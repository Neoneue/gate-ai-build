import { ArrowDown } from "lucide-react";
import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

/* ─── ScrollToLatestFab — jump-to-bottom control for the Ask AI thread ───────
 * Figma: `1149:10955` (light, in frame `1096:5471`) and `1125:4280` (dark, in
 * frame `1107:2962`). Both twins agree on geometry:
 *
 *   32×32 · rounded-full (999px) · p-8px · 16px ArrowDown
 *   fill    white / neutral-700       → --control-raised (exact in both)
 *   border  neutral-200 / neutral-600 → --border (exact in light)
 *   shadow  Figma `shadow/md`         → --shadow-card-soft
 *   offset  16px from the panel's right edge, 16px above the composer
 *
 * Both offsets fall out of the panel's existing box for free: the FAB is
 * absolutely positioned against the message region's wrapper, whose right edge
 * is the body's `px-4` (16px) and whose bottom edge is the body's `gap-4`
 * (16px) above the composer. Nothing is hard-coded, and nothing shifts when
 * the FAB toggles — it is out of flow, so the composer grows independently.
 *
 * DETECTION — a zero-height sentinel as the last child of the scroll region,
 * observed by an IntersectionObserver with the region as root. No scroll
 * handler: this fires only on the two transitions we care about instead of on
 * every pixel, and needs no rAF throttling.
 * ────────────────────────────────────────────────────────────────────────── */

/** Slack at the bottom, in px, within which the user counts as pinned.
    60px is the conventional value: a tighter threshold misfires because
    ordinary content growth (one new line rendering) briefly opens a small gap
    that a naive `scrollHeight - scrollTop - clientHeight` check misreads as
    "the user scrolled away". Supplied to the observer as `rootMargin`. */
const BOTTOM_THRESHOLD_PX = 60;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Zero-height marker. Must be the LAST child of the scroll region.
 *
 * `overflow-anchor: auto` (against `none` on the content beside it) makes the
 * browser pin scroll to this node while content grows above it, and stop on
 * its own once the user scrolls it out of view — native stick-to-bottom, no JS.
 */
export function ScrollBottomSentinel({
  ref,
}: {
  ref: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div aria-hidden className="h-0 w-full [overflow-anchor:auto]" ref={ref} />
  );
}

export interface ScrollToLatestFabProps {
  className?: string;
  /** The scrolling message region. */
  scrollRef: RefObject<HTMLElement | null>;
  /** The <ScrollBottomSentinel /> rendered as that region's last child. */
  sentinelRef: RefObject<HTMLElement | null>;
}

export function ScrollToLatestFab({
  scrollRef,
  sentinelRef,
  className,
}: ScrollToLatestFabProps) {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasOverflow, setHasOverflow] = useState(false);
  // True while a smooth scroll we started is still animating.
  const smoothingRef = useRef(false);

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

  /* Does the thread overflow at all? Gated separately so a short thread never
     flashes the control during layout. Not a scroll listener — ResizeObserver
     covers both panel resizes and the thread growing under streaming. */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const measure = () => setHasOverflow(el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    for (const child of el.children) {
      observer.observe(child);
    }
    return () => observer.disconnect();
  }, [scrollRef]);

  /* If the user grabs the scroll while our smooth scroll is animating, the two
     fight and the view bounces. Stop ours dead by scrolling to where it
     already is. Bound to input events, not `scroll`, so this stays off the
     scroll path. */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const cancelSmoothScroll = () => {
      if (!smoothingRef.current) {
        return;
      }
      smoothingRef.current = false;
      el.scrollTo({ top: el.scrollTop, behavior: "instant" });
    };
    const passive = { passive: true } as const;
    el.addEventListener("wheel", cancelSmoothScroll, passive);
    el.addEventListener("touchmove", cancelSmoothScroll, passive);
    el.addEventListener("keydown", cancelSmoothScroll);
    return () => {
      el.removeEventListener("wheel", cancelSmoothScroll);
      el.removeEventListener("touchmove", cancelSmoothScroll);
      el.removeEventListener("keydown", cancelSmoothScroll);
    };
  }, [scrollRef]);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const reduced = prefersReducedMotion();
    smoothingRef.current = !reduced;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: reduced ? "instant" : "smooth",
    });
  }, [scrollRef]);

  const visible = !isAtBottom && hasOverflow;

  return (
    <button
      aria-hidden={!visible}
      aria-label="Scroll to latest"
      className={cn(
        "flex size-8 shrink-0 select-none items-center justify-center rounded-full border border-border bg-control-raised text-accent-foreground shadow-(--shadow-card-soft) outline-none",
        // Press convention, plus a subtle fade/scale so it does not hard-pop.
        "transition-[colors,opacity,scale] duration-150 ease-out will-change-transform focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98]",
        "motion-reduce:transition-none motion-reduce:active:scale-100",
        visible
          ? "scale-100 opacity-100"
          : "pointer-events-none scale-95 opacity-0",
        className
      )}
      onClick={scrollToBottom}
      tabIndex={visible ? 0 : -1}
      type="button"
    >
      <ArrowDown aria-hidden className="size-4" strokeWidth={1.75} />
    </button>
  );
}
