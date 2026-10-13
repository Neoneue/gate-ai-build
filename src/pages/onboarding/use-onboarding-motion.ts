import { useEffect } from "react";

/* ─── useOnboardingMotion ───────────────────────────────────────────────────
 * The mockup's art trigger (`nw()` in preview-Dz-uWT5D.js), applied to every
 * `[data-motion-root]` on the page. Each root is set to
 * `data-motion-play="armed"` (paused) on mount, "play" once 40% of it is in
 * view on a visible tab, and "paused" when it leaves view or the tab hides.
 * Pointer-enter or focus on the root's card (nearest button, radio or
 * section) replays a sequence that has finished, unless the root sits inside
 * `data-motion-no-replay` (the setup route stage, owner 2026-10-09: it
 * replays on its own app and model changes instead). Under reduced motion no
 * root is ever armed, so the art shows its static end state.
 * A root with `data-motion-loop` (the phone start card's chat art) loops:
 * once its sequence settles it holds the end state for LOOP_HOLD_MS, sets
 * `data-motion-reset` (a short beat that clears the art back to the
 * sequence's first frame), then restarts. The hold only counts down while
 * the root is in view on a visible tab; leaving pauses it, returning starts
 * the hold again.
 * A MutationObserver picks up roots that mount later (step changes,
 * selection swaps). Keyframes live in onboarding-motion.css.
 * ───────────────────────────────────────────────────────────────────────── */

const ROOT = "[data-motion-root]";
const ATTR = "data-motion-play";
const LOOP = "data-motion-loop";
const RESET = "data-motion-reset";
const NO_REPLAY = "[data-motion-no-replay]";
const LOOP_HOLD_MS = 3000;

function arm(root: HTMLElement): () => void {
  let inView = false;
  let played = false;
  // Loop phase: the sequence is running, holding its end state, or clearing.
  let phase: "run" | "hold" | "reset" = "run";
  let holdTimer = 0;
  const loop = root.hasAttribute(LOOP);
  const set = (value: string) => root.setAttribute(ATTR, value);
  const visible = () => inView && !document.hidden;
  const holdThenReset = () => {
    window.clearTimeout(holdTimer);
    holdTimer = 0;
    if (visible()) {
      holdTimer = window.setTimeout(() => {
        holdTimer = 0;
        phase = "reset";
        root.setAttribute(RESET, "");
      }, LOOP_HOLD_MS);
    }
  };
  const sync = () => {
    if (visible()) {
      played = true;
      set("play");
      if (phase === "hold") {
        holdThenReset();
      }
    } else {
      window.clearTimeout(holdTimer);
      holdTimer = 0;
      if (played) {
        set("paused");
      }
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
    root.closest<HTMLElement>("button, [role='radio'], label, section") ?? root;
  const restart = () => {
    window.clearTimeout(holdTimer);
    holdTimer = 0;
    phase = "run";
    root.removeAttribute(RESET);
    root.removeAttribute(ATTR);
    // Force a reflow so the restarted keyframes run from the first frame.
    root.getBoundingClientRect();
    set("play");
  };
  const replay = () => {
    if (
      !played ||
      root.closest(NO_REPLAY) ||
      root.getAnimations({ subtree: true }).length > 0
    ) {
      return;
    }
    restart();
  };
  // Looping roots: each part's animationend bubbles here; act once nothing
  // in the subtree is still running (the reset beat's parts stay filled
  // forwards, so count running animations, not all of them).
  const onAnimationEnd = () => {
    if (
      root
        .getAnimations({ subtree: true })
        .some((animation) => animation.playState === "running")
    ) {
      return;
    }
    if (phase === "reset") {
      restart();
    } else {
      phase = "hold";
      holdThenReset();
    }
  };
  if (loop) {
    root.addEventListener("animationend", onAnimationEnd);
  }
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
    window.clearTimeout(holdTimer);
    document.removeEventListener("visibilitychange", sync);
    root.removeEventListener("animationend", onAnimationEnd);
    card.removeEventListener("pointerenter", replayOnHover);
    card.removeEventListener("focusin", replayOnFocus);
    root.removeAttribute(RESET);
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
