/* Camera math and persistence for the component canvas. Pure functions, no
 * DOM, so `camera.test.ts` covers them in the node test tier.
 *
 * Coordinates: the world is drawn with `translate(x, y) scale(zoom)` and
 * `transform-origin: 0 0`, so a world point (wx, wy) lands on screen at
 * (x + wx * zoom, y + wy * zoom), measured from the viewport's top-left. */

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface Size {
  height: number;
  width: number;
}

/** Low enough that fit-all shows the whole ~10,800px board on a 390px
 *  phone ((390 - 2 * 48) / 10,800 = 0.027). */
export const MIN_ZOOM = 0.02;
export const MAX_ZOOM = 4;
/** Screen px of the world that must stay inside the viewport on each axis,
 *  so the board can never be panned fully out of reach. */
export const KEEP_VISIBLE_PX = 96;
/** Screen px left around the world by fit-all. */
export const FIT_PADDING_PX = 48;
/** Where reset puts the world's top-left corner, at 100%. */
export const RESET_CAMERA: Camera = { x: 0, y: 0, zoom: 1 };

export function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) {
    return 1;
  }
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/**
 * Keep the camera inside bounds: finite numbers, zoom within
 * [MIN_ZOOM, MAX_ZOOM], and at least KEEP_VISIBLE_PX of the world on screen
 * on each axis (or the whole world, when it is smaller than that).
 */
export function clampCamera(camera: Camera, world: Size, view: Size): Camera {
  const zoom = clampZoom(camera.zoom);
  const scaledW = world.width * zoom;
  const scaledH = world.height * zoom;
  const keepX = Math.min(KEEP_VISIBLE_PX, scaledW);
  const keepY = Math.min(KEEP_VISIBLE_PX, scaledH);
  const minX = keepX - scaledW;
  const maxX = Math.max(minX, view.width - keepX);
  const minY = keepY - scaledH;
  const maxY = Math.max(minY, view.height - keepY);
  const x = Number.isFinite(camera.x) ? camera.x : 0;
  const y = Number.isFinite(camera.y) ? camera.y : 0;
  return {
    x: Math.min(maxX, Math.max(minX, x)),
    y: Math.min(maxY, Math.max(minY, y)),
    zoom,
  };
}

/** Zoom by `factor` keeping the world point under (px, py) fixed on screen. */
export function zoomAround(
  camera: Camera,
  factor: number,
  px: number,
  py: number
): Camera {
  const zoom = clampZoom(camera.zoom * factor);
  const wx = (px - camera.x) / camera.zoom;
  const wy = (py - camera.y) / camera.zoom;
  return { x: px - wx * zoom, y: py - wy * zoom, zoom };
}

/** The camera that shows the whole world, centred, with FIT_PADDING_PX. */
export function fitCamera(world: Size, view: Size): Camera {
  if (world.width <= 0 || world.height <= 0) {
    return RESET_CAMERA;
  }
  const availW = Math.max(1, view.width - FIT_PADDING_PX * 2);
  const availH = Math.max(1, view.height - FIT_PADDING_PX * 2);
  const zoom = clampZoom(
    Math.min(availW / world.width, availH / world.height, 1)
  );
  return {
    x: (view.width - world.width * zoom) / 2,
    y: (view.height - world.height * zoom) / 2,
    zoom,
  };
}

/**
 * The camera that centres a world-space rect, keeping the zoom. Used to
 * reveal keyboard focus outside the view and to follow `#canvas-group-*`
 * links.
 */
export function centerOn(
  camera: Camera,
  rect: { x: number; y: number; width: number; height: number },
  view: Size
): Camera {
  return {
    x: view.width / 2 - (rect.x + rect.width / 2) * camera.zoom,
    y: view.height / 2 - (rect.y + rect.height / 2) * camera.zoom,
    zoom: camera.zoom,
  };
}

/** The camera that fits a world-space rect in the view, centred, never
 *  zooming past `maxZoom` (100% by default). */
export function fitRectCamera(
  rect: { x: number; y: number; width: number; height: number },
  view: Size,
  maxZoom = 1
): Camera {
  const availW = Math.max(1, view.width - FIT_PADDING_PX * 2);
  const availH = Math.max(1, view.height - FIT_PADDING_PX * 2);
  const zoom = clampZoom(
    Math.min(
      maxZoom,
      availW / Math.max(1, rect.width),
      availH / Math.max(1, rect.height)
    )
  );
  return centerOn({ x: 0, y: 0, zoom }, rect, view);
}

/* ─── Persistence ──────────────────────────────────────────────────────────
 * Camera only (skill "Persistence"): never group positions, preview state or
 * drafts. One versioned record under a key scoped to this project. No older
 * format exists (v1 is the first), so `migrateCamera` accepts v1 and returns
 * null for anything else, which falls back to fit-all. */

export const CAMERA_STORAGE_KEY = "gate-ai-build:component-canvas:camera";
export const CAMERA_STORAGE_VERSION = 1;
/** A v1 record is ~60 bytes; anything far bigger is not ours. */
const MAX_RECORD_BYTES = 512;

interface StoredCameraV1 {
  v: 1;
  x: number;
  y: number;
  zoom: number;
}

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Parse a stored record of any known version into a camera, or null. */
export function migrateCamera(raw: unknown): Camera | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  const record = raw as Partial<StoredCameraV1>;
  if (record.v !== CAMERA_STORAGE_VERSION) {
    return null;
  }
  if (
    !(
      isFiniteNumber(record.x) &&
      isFiniteNumber(record.y) &&
      isFiniteNumber(record.zoom)
    )
  ) {
    return null;
  }
  if (record.zoom < MIN_ZOOM || record.zoom > MAX_ZOOM) {
    return null;
  }
  return { x: record.x, y: record.y, zoom: record.zoom };
}

/** Read the saved camera. Null on missing, malformed, oversized or unknown
 *  data, and when storage itself throws (private mode, disabled). */
export function loadCamera(storage: StorageLike | null): Camera | null {
  if (!storage) {
    return null;
  }
  try {
    const text = storage.getItem(CAMERA_STORAGE_KEY);
    if (!text || text.length > MAX_RECORD_BYTES) {
      return null;
    }
    return migrateCamera(JSON.parse(text));
  } catch {
    return null;
  }
}

/** Save the camera. Returns false when storage is unavailable or full. */
export function saveCamera(
  storage: StorageLike | null,
  camera: Camera
): boolean {
  if (!storage) {
    return false;
  }
  const record: StoredCameraV1 = {
    v: CAMERA_STORAGE_VERSION,
    x: Math.round(camera.x * 100) / 100,
    y: Math.round(camera.y * 100) / 100,
    zoom: Math.round(clampZoom(camera.zoom) * 10_000) / 10_000,
  };
  try {
    storage.setItem(CAMERA_STORAGE_KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

/** `window.localStorage`, or null where touching it throws. */
export function safeLocalStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}
