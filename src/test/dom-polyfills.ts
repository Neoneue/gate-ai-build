/**
 * Browser APIs happy-dom does not implement that the dashboard chrome calls
 * during mount. Imported for side effects by `src/test/render.tsx`; nothing
 * here runs under the default `node` environment because the pure tests never
 * import the render helper.
 *
 * Each shim is the minimum the callers touch, not a faithful implementation:
 * the smoke tier only asserts "mounts without throwing", so a stub that never
 * fires is correct behaviour, not a gap.
 */

type Ctor = new (...args: never[]) => unknown;

const defineGlobal = (name: string, value: unknown) => {
  if (!(name in globalThis)) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value,
    });
  }
};

/** Tailwind `useMediaQuery`-style hooks and the sidebar breakpoint read this. */
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

/** Recharts' ResponsiveContainer and Base UI popups observe element size. */
class ResizeObserverStub {
  observe() {
    return;
  }
  unobserve() {
    return;
  }
  disconnect() {
    return;
  }
}
defineGlobal("ResizeObserver", ResizeObserverStub as unknown as Ctor);

/** Scroll-spy / lazy reveal wrappers construct one on mount. */
class IntersectionObserverStub {
  root = null;
  rootMargin = "";
  thresholds: number[] = [];
  observe() {
    return;
  }
  unobserve() {
    return;
  }
  disconnect() {
    return;
  }
  takeRecords() {
    return [];
  }
}
defineGlobal(
  "IntersectionObserver",
  IntersectionObserverStub as unknown as Ctor
);

if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => undefined;
}

/** Canvas is only reached by font-metric measurement in chart labels. */
if (
  typeof HTMLCanvasElement !== "undefined" &&
  !HTMLCanvasElement.prototype.getContext
) {
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    writable: true,
    value: () => ({
      measureText: () => ({ width: 0 }),
      fillText: () => undefined,
      clearRect: () => undefined,
    }),
  });
}
