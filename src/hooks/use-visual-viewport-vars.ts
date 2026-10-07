import { useEffect } from "react";

/** A keyboard is "up" when the visible viewport is this much shorter than
 *  the page was with nothing focused. Smaller changes are Safari's toolbar
 *  collapsing, which must not move the composer. */
const KEYBOARD_MIN_PX = 150;

/** iOS fires visualViewport events late, and sometimes not at all after a
 *  focus change, so every focus change also re-reads once after this. */
const RECHECK_MS = 100;

const EDITABLE =
  "input, textarea, select, [contenteditable]:not([contenteditable='false'])";

/** Asks the browser to lay the keyboard over the page rather than resize it
 *  (Android Chrome reads it; iOS ignores it). Chat only: added on mount and
 *  the original viewport meta restored on unmount, so no dashboard page
 *  changes. */
const OVERLAYS_KEYBOARD = "interactive-widget=overlays-content";

/** While the keyboard is up, a finger drag on the chat must not scroll the
 *  page behind the lifted composer (the thread slid under it). Cancelling
 *  the drag, not an overflow lock: locking html/body made Chrome on iPhone
 *  push the whole page up. A text field that can scroll itself (a long
 *  draft) still scrolls, and popups portal outside the shell, so the model
 *  picker and menus keep scrolling. */
const blockBackgroundDrag = (event: TouchEvent) => {
  const target = event.target;
  if (!(target instanceof Element && target.closest("[data-chat-shell]"))) {
    return;
  }
  const field = target.closest("textarea");
  if (field && field.scrollHeight > field.clientHeight) {
    return;
  }
  event.preventDefault();
};

const editableHasFocus = () =>
  document.activeElement instanceof HTMLElement &&
  document.activeElement.matches(EDITABLE);

/** Floats the chat composer above the on-screen keyboard on iOS.
 *
 *  The keyboard shrinks only the visual viewport. Below lg the chat document
 *  scrolls (ChatLayout), so iOS scrolls it to reveal the focused field
 *  instead of panning the visual viewport, and the sticky header bars stay
 *  put. Chrome and Brave on iPhone run WebKit and behave the same.
 *
 *  While the keyboard is up, `--kb-inset` on <html> carries how much of the
 *  layout the keyboard covers, and only the floating composer (Chat.tsx)
 *  lifts by it. Set only past KEYBOARD_MIN_PX (Safari's toolbar collapse
 *  never moves it), only at 1x zoom (zoomed, the visual viewport is a pan
 *  window), and only while an editable element has focus. */
export function useVisualViewportVars(): void {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="viewport"]'
    );
    const metaBefore = meta?.content ?? null;
    if (
      meta &&
      metaBefore !== null &&
      !metaBefore.includes(OVERLAYS_KEYBOARD)
    ) {
      meta.content = `${metaBefore}, ${OVERLAYS_KEYBOARD}`;
    }
    const restoreMeta = () => {
      if (meta && metaBefore !== null) {
        meta.content = metaBefore;
      }
    };
    const vv = window.visualViewport;
    if (!vv) {
      return restoreMeta;
    }
    const root = document.documentElement;
    let keyboardWasUp = false;
    let recheck = 0;
    // The visible height with no field focused: the keyboard is measured
    // against this, not against innerHeight, because Chrome on iPhone
    // shrinks innerHeight along with the visual viewport when the keyboard
    // opens (both near 359px on device), which hid the keyboard from an
    // innerHeight - vv.height test and left the page scrollable under it.
    // Re-read whenever nothing is focused (toolbar changes, rotation).
    let restingHeight = Math.max(window.innerHeight, vv.height);
    let dragBlocked = false;
    const setDragBlocked = (blocked: boolean) => {
      if (blocked === dragBlocked) {
        return;
      }
      dragBlocked = blocked;
      if (blocked) {
        document.addEventListener("touchmove", blockBackgroundDrag, {
          passive: false,
        });
      } else {
        document.removeEventListener("touchmove", blockBackgroundDrag);
      }
    };

    const sync = () => {
      // The keyboard's height over the bottom of the layout, in layout
      // pixels: everything below the visible area's bottom edge.
      const inset = window.innerHeight - vv.height - vv.offsetTop;
      const editing = editableHasFocus();
      if (!editing) {
        restingHeight = Math.max(window.innerHeight, vv.height);
      }
      const keyboardUp =
        editing &&
        Math.abs(vv.scale - 1) <= 0.01 &&
        restingHeight - vv.height > KEYBOARD_MIN_PX;
      root.toggleAttribute("data-keyboard-open", keyboardUp);
      if (keyboardUp) {
        root.style.setProperty("--kb-inset", `${Math.max(0, inset)}px`);
      } else {
        root.style.removeProperty("--kb-inset");
        if (keyboardWasUp) {
          // iOS 26 can leave a stale `offsetTop` after the keyboard closes;
          // a 1px scroll round trip forces it to recompute.
          window.scrollBy(0, -1);
          window.scrollBy(0, 1);
        }
      }
      setDragBlocked(keyboardUp);
      keyboardWasUp = keyboardUp;
    };

    const syncSoon = () => {
      sync();
      window.clearTimeout(recheck);
      recheck = window.setTimeout(sync, RECHECK_MS);
    };

    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    document.addEventListener("focusin", syncSoon);
    document.addEventListener("focusout", syncSoon);
    return () => {
      window.clearTimeout(recheck);
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      document.removeEventListener("focusin", syncSoon);
      document.removeEventListener("focusout", syncSoon);
      root.style.removeProperty("--kb-inset");
      root.removeAttribute("data-keyboard-open");
      setDragBlocked(false);
      restoreMeta();
    };
  }, []);
}
