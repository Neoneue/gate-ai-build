import { type RefObject, useCallback, useEffect, useRef } from "react";
import {
  type Camera,
  centerOn,
  clampCamera,
  fitCamera,
  fitRectCamera,
  loadCamera,
  RESET_CAMERA,
  type Size,
  safeLocalStorage,
  saveCamera,
  zoomAround,
} from "@/pages/component-canvas/camera";

/* Camera controller for the component canvas (skill "Camera" and
 * "Interactions").
 *
 * - Pan: primary-button drag that STARTS on empty canvas space (the shell,
 *   the world, a frame, a title, a caption, or the bare inside of a preview
 *   slot), middle-button drag anywhere, Space + drag while the shell has
 *   focus, one-finger touch drag on empty space, wheel and trackpad scroll.
 * - Zoom: ctrl / cmd + wheel and trackpad pinch (both arrive as ctrl-wheel)
 *   around the cursor, two-finger touch pinch around the midpoint, +/- keys
 *   and the zoom buttons around the view centre.
 * - Keys (shell focused only, never taken from a preview control): arrows
 *   pan, Shift for a bigger step; + and - zoom; Shift+1 fit all; Shift+0
 *   reset; Escape cancels a drag in progress.
 *
 * A wheel over a nested scroller that can still scroll that way is left to
 * the browser, so scrolling inside previews keeps working. The transform is
 * written straight to the world element at most once per animation frame;
 * React never re-renders during a gesture. Every listener, observer, frame,
 * timer and pointer capture is released on teardown. */

const WHEEL_ZOOM_SPEED = 0.01;
const WHEEL_ZOOM_MAX_DELTA = 50;
const LINE_HEIGHT_PX = 16;
const KEY_PAN_PX = 64;
const KEY_PAN_FAST_PX = 320;
const BUTTON_ZOOM_FACTOR = 1.25;
const SAVE_DELAY_MS = 300;
const SETTLE_DELAY_MS = 200;
/** Screen px kept between a revealed element and the view edge. */
const REVEAL_MARGIN_PX = 32;

const PREVIEW_SELECTOR = "[data-canvas-preview]";
/** Group frames carry `id="canvas-group-<id>"`. */
export const GROUP_ID_PREFIX = "canvas-group-";
const SCROLLABLE_RE = /(auto|scroll|overlay)/;

interface Point {
  x: number;
  y: number;
}

interface Gesture {
  /** The camera before the drag began, for Escape. */
  originCamera: Camera;
  pointers: Map<number, Point>;
  startCamera: Camera;
  startDist: number;
  startMid: Point;
}

/** True when a pointerdown on `target` should pan rather than reach a
 *  preview: anywhere outside a preview, or the bare preview slot itself. */
function isEmptyCanvasTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }
  const preview = target.closest(PREVIEW_SELECTOR);
  return preview === null || preview === target;
}

/** Whether a nested scroller between `target` and `stop` can still scroll
 *  in the wheel's direction, in which case the browser should have it. */
function nestedScrollerCanTake(
  target: EventTarget | null,
  stop: Element,
  dx: number,
  dy: number
): boolean {
  let el = target instanceof Element ? target : null;
  while (el && el !== stop) {
    if (el instanceof HTMLElement) {
      const style = getComputedStyle(el);
      if (
        dy !== 0 &&
        SCROLLABLE_RE.test(style.overflowY) &&
        el.scrollHeight > el.clientHeight + 1
      ) {
        const canMove =
          dy < 0
            ? el.scrollTop > 0
            : el.scrollTop + el.clientHeight < el.scrollHeight - 1;
        if (canMove) {
          return true;
        }
      }
      if (
        dx !== 0 &&
        SCROLLABLE_RE.test(style.overflowX) &&
        el.scrollWidth > el.clientWidth + 1
      ) {
        const canMove =
          dx < 0
            ? el.scrollLeft > 0
            : el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
        if (canMove) {
          return true;
        }
      }
    }
    el = el.parentElement;
  }
  return false;
}

function midpoint(points: Point[]): Point {
  if (points.length < 2) {
    return points[0] ?? { x: 0, y: 0 };
  }
  return {
    x: (points[0].x + points[1].x) / 2,
    y: (points[0].y + points[1].y) / 2,
  };
}

function distance(points: Point[]): number {
  if (points.length < 2) {
    return 0;
  }
  return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
}

export interface CanvasCameraControls {
  fitAll: () => void;
  reset: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

export function useCanvasCamera(
  viewportRef: RefObject<HTMLDivElement | null>,
  worldRef: RefObject<HTMLDivElement | null>
): CanvasCameraControls {
  const cameraRef = useRef<Camera>(RESET_CAMERA);
  const worldSizeRef = useRef<Size>({ width: 0, height: 0 });
  const viewSizeRef = useRef<Size>({ width: 0, height: 0 });
  const frameRef = useRef<number | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const readyRef = useRef(false);

  /* Write the transform, once per frame. `will-change` is held only while
     the camera is moving, then dropped so text re-rasters crisply at rest. */
  const scheduleApply = useCallback(() => {
    if (frameRef.current !== null) {
      return;
    }
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const world = worldRef.current;
      if (!world) {
        return;
      }
      const { x, y, zoom } = cameraRef.current;
      world.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;
      world.style.willChange = "transform";
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
      }
      settleTimerRef.current = window.setTimeout(() => {
        settleTimerRef.current = null;
        world.style.willChange = "";
      }, SETTLE_DELAY_MS);
      if (readyRef.current) {
        world.dataset.ready = "true";
      }
    });
  }, [worldRef]);

  const flushSave = useCallback(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (readyRef.current) {
      saveCamera(safeLocalStorage(), cameraRef.current);
    }
  }, []);

  const setCamera = useCallback(
    (next: Camera) => {
      cameraRef.current = clampCamera(
        next,
        worldSizeRef.current,
        viewSizeRef.current
      );
      scheduleApply();
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = window.setTimeout(flushSave, SAVE_DELAY_MS);
    },
    [flushSave, scheduleApply]
  );

  const viewCenter = useCallback(
    (): Point => ({
      x: viewSizeRef.current.width / 2,
      y: viewSizeRef.current.height / 2,
    }),
    []
  );

  const fitAll = useCallback(() => {
    setCamera(fitCamera(worldSizeRef.current, viewSizeRef.current));
  }, [setCamera]);

  const reset = useCallback(() => {
    setCamera(RESET_CAMERA);
  }, [setCamera]);

  const zoomIn = useCallback(() => {
    const c = viewCenter();
    setCamera(zoomAround(cameraRef.current, BUTTON_ZOOM_FACTOR, c.x, c.y));
  }, [setCamera, viewCenter]);

  const zoomOut = useCallback(() => {
    const c = viewCenter();
    setCamera(zoomAround(cameraRef.current, 1 / BUTTON_ZOOM_FACTOR, c.x, c.y));
  }, [setCamera, viewCenter]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const world = worldRef.current;
    if (!(viewport && world)) {
      return;
    }

    let disposed = false;
    let gesture: Gesture | null = null;
    let spaceHeld = false;

    const viewportPoint = (clientX: number, clientY: number): Point => {
      const rect = viewport.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    /* ── First camera: the saved one, else fit-all once layout settles ── */
    const stored = loadCamera(safeLocalStorage());
    const initialise = () => {
      if (disposed || readyRef.current) {
        return;
      }
      readyRef.current = true;
      if (stored) {
        setCamera(stored);
      } else {
        setCamera(fitCamera(worldSizeRef.current, viewSizeRef.current));
      }
    };
    let settleFrame: number | null = null;
    const settleThenInitialise = () => {
      const fonts = document.fonts?.ready ?? Promise.resolve();
      fonts.then(() => {
        if (disposed) {
          return;
        }
        settleFrame = requestAnimationFrame(() => {
          settleFrame = requestAnimationFrame(initialise);
        });
      });
    };

    /* ── Sizes. Layout boxes are unaffected by the transform. ── */
    const observer = new ResizeObserver(() => {
      worldSizeRef.current = {
        width: world.offsetWidth,
        height: world.offsetHeight,
      };
      viewSizeRef.current = {
        width: viewport.clientWidth,
        height: viewport.clientHeight,
      };
      if (readyRef.current) {
        // Re-clamp only: content growing or the window resizing never
        // refits or rearranges anything.
        setCamera(cameraRef.current);
      } else if (worldSizeRef.current.width > 0) {
        settleThenInitialise();
      }
    });
    observer.observe(world);
    observer.observe(viewport);

    /* ── Gestures ── */
    const rebaseline = () => {
      if (!gesture) {
        return;
      }
      const points = [...gesture.pointers.values()];
      gesture.startCamera = cameraRef.current;
      gesture.startMid = midpoint(points);
      gesture.startDist = distance(points);
    };

    const endGesture = () => {
      if (!gesture) {
        return;
      }
      for (const id of gesture.pointers.keys()) {
        if (viewport.hasPointerCapture(id)) {
          viewport.releasePointerCapture(id);
        }
      }
      gesture = null;
      delete viewport.dataset.panning;
      flushSave();
    };

    const onPointerDown = (event: PointerEvent) => {
      const isMiddle = event.button === 1;
      const isPrimary = event.button === 0;
      const fromEmpty = isEmptyCanvasTarget(event.target);
      if (gesture?.pointers.size) {
        // A further finger joins the gesture only from empty space.
        if (event.pointerType !== "touch" || !fromEmpty) {
          return;
        }
      } else if (!(isMiddle || (isPrimary && (fromEmpty || spaceHeld)))) {
        return;
      }
      event.preventDefault();
      if (event.pointerType !== "touch") {
        viewport.focus({ preventScroll: true });
      }
      viewport.setPointerCapture(event.pointerId);
      const point = viewportPoint(event.clientX, event.clientY);
      if (gesture) {
        gesture.pointers.set(event.pointerId, point);
      } else {
        gesture = {
          pointers: new Map([[event.pointerId, point]]),
          startCamera: cameraRef.current,
          startMid: point,
          startDist: 0,
          originCamera: cameraRef.current,
        };
        viewport.dataset.panning = "true";
      }
      rebaseline();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!gesture?.pointers.has(event.pointerId)) {
        return;
      }
      gesture.pointers.set(
        event.pointerId,
        viewportPoint(event.clientX, event.clientY)
      );
      const points = [...gesture.pointers.values()];
      const start = gesture.startCamera;
      const mid = midpoint(points);
      if (points.length >= 2 && gesture.startDist > 0) {
        const scaled = zoomAround(
          start,
          distance(points) / gesture.startDist,
          gesture.startMid.x,
          gesture.startMid.y
        );
        setCamera({
          x: scaled.x + (mid.x - gesture.startMid.x),
          y: scaled.y + (mid.y - gesture.startMid.y),
          zoom: scaled.zoom,
        });
      } else {
        setCamera({
          x: start.x + (mid.x - gesture.startMid.x),
          y: start.y + (mid.y - gesture.startMid.y),
          zoom: start.zoom,
        });
      }
    };

    const onPointerEnd = (event: PointerEvent) => {
      if (!gesture?.pointers.has(event.pointerId)) {
        return;
      }
      gesture.pointers.delete(event.pointerId);
      if (viewport.hasPointerCapture(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }
      if (gesture.pointers.size === 0) {
        endGesture();
      } else {
        rebaseline();
      }
    };

    /* ── Wheel and trackpad ── */
    const onWheel = (event: WheelEvent) => {
      let unit = 1;
      if (event.deltaMode === 1) {
        unit = LINE_HEIGHT_PX;
      } else if (event.deltaMode === 2) {
        unit = viewSizeRef.current.height;
      }
      let dx = event.deltaX * unit;
      let dy = event.deltaY * unit;
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const clamped = Math.max(
          -WHEEL_ZOOM_MAX_DELTA,
          Math.min(WHEEL_ZOOM_MAX_DELTA, dy)
        );
        const point = viewportPoint(event.clientX, event.clientY);
        setCamera(
          zoomAround(
            cameraRef.current,
            Math.exp(-clamped * WHEEL_ZOOM_SPEED),
            point.x,
            point.y
          )
        );
        return;
      }
      if (event.shiftKey && dx === 0) {
        dx = dy;
        dy = 0;
      }
      if (nestedScrollerCanTake(event.target, viewport, dx, dy)) {
        return;
      }
      event.preventDefault();
      const c = cameraRef.current;
      setCamera({ x: c.x - dx, y: c.y - dy, zoom: c.zoom });
    };

    /* ── Keys: the shell only ── */
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target !== viewport) {
        return;
      }
      const c = cameraRef.current;
      const step = event.shiftKey ? KEY_PAN_FAST_PX : KEY_PAN_PX;
      let handled = true;
      if (event.key === "ArrowLeft") {
        setCamera({ ...c, x: c.x + step });
      } else if (event.key === "ArrowRight") {
        setCamera({ ...c, x: c.x - step });
      } else if (event.key === "ArrowUp") {
        setCamera({ ...c, y: c.y + step });
      } else if (event.key === "ArrowDown") {
        setCamera({ ...c, y: c.y - step });
      } else if (event.key === "+" || event.key === "=") {
        zoomIn();
      } else if (event.key === "-" || event.key === "_") {
        zoomOut();
      } else if (event.shiftKey && event.code === "Digit1") {
        fitAll();
      } else if (event.shiftKey && event.code === "Digit0") {
        reset();
      } else if (event.key === " ") {
        spaceHeld = true;
        viewport.dataset.space = "true";
      } else if (event.key === "Escape" && gesture) {
        const origin = gesture.originCamera;
        endGesture();
        setCamera(origin);
      } else {
        handled = false;
      }
      if (handled) {
        event.preventDefault();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === " ") {
        spaceHeld = false;
        delete viewport.dataset.space;
      }
    };

    const releaseEverything = () => {
      spaceHeld = false;
      delete viewport.dataset.space;
      endGesture();
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        releaseEverything();
        flushSave();
      }
    };

    /* ── Reveal keyboard focus that lands outside the view ── */
    const onFocusIn = (event: FocusEvent) => {
      const el = event.target;
      if (!(el instanceof HTMLElement && el.matches(":focus-visible"))) {
        return;
      }
      const rect = el.getBoundingClientRect();
      const view = viewport.getBoundingClientRect();
      const inside =
        rect.left >= view.left + REVEAL_MARGIN_PX &&
        rect.right <= view.right - REVEAL_MARGIN_PX &&
        rect.top >= view.top + REVEAL_MARGIN_PX &&
        rect.bottom <= view.bottom - REVEAL_MARGIN_PX;
      if (inside) {
        return;
      }
      const c = cameraRef.current;
      setCamera(centerOn(c, worldRectOf(el, viewport, c), viewSizeRef.current));
    };

    /* `overflow: clip` already forbids programmatic scrolling of the shell;
       this undoes any scroll the browser still applies (find-in-page,
       scrollIntoView) so native scrolling never moves the board. */
    const onScroll = () => {
      if (viewport.scrollTop !== 0 || viewport.scrollLeft !== 0) {
        viewport.scrollTop = 0;
        viewport.scrollLeft = 0;
      }
    };

    /* ── Links (skill "Interactions") ──
       A `#canvas-group-<id>` link moves the camera to that group instead of
       scrolling. Any other anchor would leave the canvas (an external URL,
       a plain `href` to an app route, a new-tab link, a modified click on a
       router Link): its default is prevented, here and inside portals, so
       the page never navigates. Router Links already prevent their own
       plain clicks and move the MemoryRouter, which renders nothing. */
    const goToGroup = (elementId: string) => {
      const target = document.getElementById(elementId);
      if (!(target && world.contains(target))) {
        return;
      }
      const rect = worldRectOf(target, viewport, cameraRef.current);
      setCamera(fitRectCamera(rect, viewSizeRef.current));
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || !(event.target instanceof Element)) {
        return;
      }
      const anchor = event.target.closest("a[href]");
      if (!anchor) {
        return;
      }
      event.preventDefault();
      const href = anchor.getAttribute("href") ?? "";
      if (href.startsWith(`#${GROUP_ID_PREFIX}`)) {
        goToGroup(href.slice(1));
      }
    };

    const onHashChange = () => {
      const id = window.location.hash.slice(1);
      if (id.startsWith(GROUP_ID_PREFIX)) {
        goToGroup(id);
      }
    };

    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerEnd);
    viewport.addEventListener("pointercancel", onPointerEnd);
    viewport.addEventListener("lostpointercapture", onPointerEnd);
    viewport.addEventListener("wheel", onWheel, { passive: false });
    viewport.addEventListener("keydown", onKeyDown);
    viewport.addEventListener("keyup", onKeyUp);
    viewport.addEventListener("scroll", onScroll);
    world.addEventListener("focusin", onFocusIn);
    window.addEventListener("blur", releaseEverything);
    window.addEventListener("pagehide", flushSave);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("auxclick", onDocumentClick);
    window.addEventListener("hashchange", onHashChange);

    return () => {
      disposed = true;
      if (settleFrame !== null) {
        cancelAnimationFrame(settleFrame);
      }
      releaseEverything();
      observer.disconnect();
      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("auxclick", onDocumentClick);
      window.removeEventListener("hashchange", onHashChange);
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", onPointerEnd);
      viewport.removeEventListener("pointercancel", onPointerEnd);
      viewport.removeEventListener("lostpointercapture", onPointerEnd);
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("keydown", onKeyDown);
      viewport.removeEventListener("keyup", onKeyUp);
      viewport.removeEventListener("scroll", onScroll);
      world.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("blur", releaseEverything);
      window.removeEventListener("pagehide", flushSave);
      document.removeEventListener("visibilitychange", onVisibility);
      flushSave();
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
      readyRef.current = false;
    };
  }, [
    fitAll,
    flushSave,
    reset,
    setCamera,
    viewportRef,
    worldRef,
    zoomIn,
    zoomOut,
  ]);

  return { fitAll, reset, zoomIn, zoomOut };
}

/** An element's box in world coordinates, from its on-screen box. */
function worldRectOf(
  el: Element,
  viewport: Element,
  camera: Camera
): { x: number; y: number; width: number; height: number } {
  const rect = el.getBoundingClientRect();
  const view = viewport.getBoundingClientRect();
  return {
    x: (rect.left - view.left - camera.x) / camera.zoom,
    y: (rect.top - view.top - camera.y) / camera.zoom,
    width: rect.width / camera.zoom,
    height: rect.height / camera.zoom,
  };
}
