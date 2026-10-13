import { describe, expect, it } from "vitest";
import {
  CAMERA_STORAGE_KEY,
  type Camera,
  clampCamera,
  clampZoom,
  fitCamera,
  fitRectCamera,
  KEEP_VISIBLE_PX,
  loadCamera,
  MAX_ZOOM,
  MIN_ZOOM,
  migrateCamera,
  saveCamera,
  zoomAround,
} from "@/pages/component-canvas/camera";

/* Camera math and persistence for the component canvas (skill "Camera" and
 * "Persistence"). */

const VIEW = { width: 1440, height: 900 };
const WORLD = { width: 10_000, height: 6000 };

function memoryStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    store,
  };
}

describe("clampZoom", () => {
  it("keeps zoom inside [MIN_ZOOM, MAX_ZOOM] and rejects non-finite", () => {
    expect(clampZoom(0)).toBe(MIN_ZOOM);
    expect(clampZoom(99)).toBe(MAX_ZOOM);
    expect(clampZoom(Number.NaN)).toBe(1);
    expect(clampZoom(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe("clampCamera", () => {
  it("keeps part of the world on screen however far it is panned", () => {
    const lostLeft = clampCamera({ x: -1e9, y: 0, zoom: 1 }, WORLD, VIEW);
    expect(lostLeft.x + WORLD.width).toBeGreaterThanOrEqual(KEEP_VISIBLE_PX);
    const lostRight = clampCamera({ x: 1e9, y: 0, zoom: 1 }, WORLD, VIEW);
    expect(VIEW.width - lostRight.x).toBeGreaterThanOrEqual(KEEP_VISIBLE_PX);
    const lostDown = clampCamera({ x: 0, y: 1e9, zoom: 1 }, WORLD, VIEW);
    expect(VIEW.height - lostDown.y).toBeGreaterThanOrEqual(KEEP_VISIBLE_PX);
  });

  it("replaces non-finite coordinates", () => {
    const camera = clampCamera(
      { x: Number.NaN, y: Number.POSITIVE_INFINITY, zoom: Number.NaN },
      WORLD,
      VIEW
    );
    expect(Number.isFinite(camera.x)).toBe(true);
    expect(Number.isFinite(camera.y)).toBe(true);
    expect(camera.zoom).toBe(1);
  });

  it("leaves an in-bounds camera alone", () => {
    const camera: Camera = { x: -200, y: -300, zoom: 0.5 };
    expect(clampCamera(camera, WORLD, VIEW)).toEqual(camera);
  });
});

describe("zoomAround", () => {
  it("keeps the world point under the cursor fixed", () => {
    const start: Camera = { x: 100, y: 50, zoom: 1 };
    const px = 700;
    const py = 400;
    const worldX = (px - start.x) / start.zoom;
    const worldY = (py - start.y) / start.zoom;
    const next = zoomAround(start, 2, px, py);
    expect(next.zoom).toBe(2);
    expect(next.x + worldX * next.zoom).toBeCloseTo(px);
    expect(next.y + worldY * next.zoom).toBeCloseTo(py);
  });

  it("stops at the zoom bounds", () => {
    expect(zoomAround({ x: 0, y: 0, zoom: 3 }, 10, 0, 0).zoom).toBe(MAX_ZOOM);
    expect(zoomAround({ x: 0, y: 0, zoom: 0.1 }, 0.01, 0, 0).zoom).toBe(
      MIN_ZOOM
    );
  });
});

describe("fitCamera", () => {
  it("fits and centres the whole world", () => {
    const camera = fitCamera(WORLD, VIEW);
    const width = WORLD.width * camera.zoom;
    const height = WORLD.height * camera.zoom;
    expect(width).toBeLessThanOrEqual(VIEW.width);
    expect(height).toBeLessThanOrEqual(VIEW.height);
    expect(camera.x + width / 2).toBeCloseTo(VIEW.width / 2);
    expect(camera.y + height / 2).toBeCloseTo(VIEW.height / 2);
  });

  it("never zooms past 100% for a small world", () => {
    expect(fitCamera({ width: 200, height: 100 }, VIEW).zoom).toBe(1);
  });

  it("falls back to the reset camera for an empty world", () => {
    expect(fitCamera({ width: 0, height: 0 }, VIEW)).toEqual({
      x: 0,
      y: 0,
      zoom: 1,
    });
  });
});

describe("fitRectCamera", () => {
  it("centres a group and caps the zoom at 100%", () => {
    const rect = { x: 2000, y: 1000, width: 400, height: 300 };
    const camera = fitRectCamera(rect, VIEW);
    expect(camera.zoom).toBe(1);
    expect(camera.x + (rect.x + rect.width / 2) * camera.zoom).toBeCloseTo(
      VIEW.width / 2
    );
  });
});

describe("persistence", () => {
  it("round-trips a camera through a versioned record", () => {
    const storage = memoryStorage();
    expect(saveCamera(storage, { x: 12.345, y: -6.789, zoom: 0.5 })).toBe(true);
    const raw = JSON.parse(storage.store.get(CAMERA_STORAGE_KEY) ?? "{}");
    expect(raw.v).toBe(1);
    expect(loadCamera(storage)).toEqual({ x: 12.35, y: -6.79, zoom: 0.5 });
  });

  it("returns null for missing, malformed, oversized and unknown data", () => {
    expect(loadCamera(memoryStorage())).toBeNull();
    expect(
      loadCamera(memoryStorage({ [CAMERA_STORAGE_KEY]: "{not json" }))
    ).toBeNull();
    expect(
      loadCamera(memoryStorage({ [CAMERA_STORAGE_KEY]: "x".repeat(10_000) }))
    ).toBeNull();
    expect(
      loadCamera(
        memoryStorage({
          [CAMERA_STORAGE_KEY]: JSON.stringify({ v: 9, x: 0, y: 0, zoom: 1 }),
        })
      )
    ).toBeNull();
    expect(
      loadCamera(
        memoryStorage({
          [CAMERA_STORAGE_KEY]: JSON.stringify({ v: 1, x: "0", y: 0, zoom: 1 }),
        })
      )
    ).toBeNull();
    expect(loadCamera(null)).toBeNull();
  });

  it("rejects an out-of-range zoom", () => {
    expect(migrateCamera({ v: 1, x: 0, y: 0, zoom: 50 })).toBeNull();
    expect(migrateCamera({ v: 1, x: 0, y: 0, zoom: 0 })).toBeNull();
  });

  it("survives storage that throws", () => {
    const throwing = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(loadCamera(throwing)).toBeNull();
    expect(saveCamera(throwing, { x: 0, y: 0, zoom: 1 })).toBe(false);
  });
});
