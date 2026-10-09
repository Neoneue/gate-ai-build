import { useEffect } from "react";

/* ─── useOnboardingMotion ───────────────────────────────────────────────────
 * The mockup's art trigger (`nw()` in preview-Dz-uWT5D.js), applied to every
 * `[data-motion-root]` on the page. Each root is set to
 * `data-motion-play="armed"` (paused) on mount, "play" once 40% of it is in
 * view on a visible tab, and "paused" when it leaves view or the tab hides.
 * Pointer-enter or focus on the root's card (nearest button, radio or
 * section) replays a sequence that has finished. Under reduced motion no
 * root is ever armed, so the art shows its static end state.
 * A MutationObserver picks up roots that mount later (step changes,
 * selection swaps). Keyframes live in onboarding-motion.css.
 * ───────────────────────────────────────────────────────────────────────── */

const ROOT = "[data-motion-root]";
const ATTR = "data-motion-play";

function arm(root: HTMLElement): () => void {
  let inView = false;
  let played = false;
  const set = (value: string) => root.setAttribute(ATTR, value);
  const sync = () => {
    if (inView && !document.hidden) {
      played = true;
      set("play");
    } else if (played) {
      set("paused");
    }
  };
  set("armed");

  const io = new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      sync();
    },
    { threshold: 0.4 }
  );
  io.observe(root);

  const card =
    root.closest<HTMLElement>("button, [role='radio'], section") ?? root;
  const replay = () => {
    if (!played || root.getAnimations({ subtree: true }).length > 0) {
      return;
    }
    root.removeAttribute(ATTR);
    // Force a reflow so the restarted keyframes run from the first frame.
    root.getBoundingClientRect();
    set("play");
  };
  // A touch tap also fires pointerenter and focus; replay on mouse or pen
  // hover and on keyboard focus only, so tapping a card to select it does
  // not restart its art.
  const replayOnHover = (event: PointerEvent) => {
    if (event.pointerType !== "touch") {
      replay();
    }
  };
  const replayOnFocus = (event: FocusEvent) => {
    if (
      event.target instanceof Element &&
      event.target.matches(":focus-visible")
    ) {
      replay();
    }
  };

  document.addEventListener("visibilitychange", sync);
  card.addEventListener("pointerenter", replayOnHover);
  card.addEventListener("focusin", replayOnFocus);
  return () => {
    io.disconnect();
    document.removeEventListener("visibilitychange", sync);
    card.removeEventListener("pointerenter", replayOnHover);
    card.removeEventListener("focusin", replayOnFocus);
    root.removeAttribute(ATTR);
  };
}

export function useOnboardingMotion() {
  useEffect(() => {
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const armed = new Map<HTMLElement, () => void>();
    const scan = () => {
      for (const root of document.querySelectorAll<HTMLElement>(ROOT)) {
        if (!armed.has(root)) {
          armed.set(root, arm(root));
        }
      }
      for (const [root, disarm] of armed) {
        if (!root.isConnected) {
          disarm();
          armed.delete(root);
        }
      }
    };
    scan();
    // Coalesce DOM changes to one scan per frame (a streaming chat reply
    // under this layout mutates the DOM on every token).
    let frame = 0;
    const queueScan = () => {
      if (frame === 0) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          scan();
        });
      }
    };
    const mo = new MutationObserver(queueScan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      mo.disconnect();
      for (const disarm of armed.values()) {
        disarm();
      }
      armed.clear();
    };
  }, []);
}
