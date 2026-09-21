// @vitest-environment happy-dom
/**
 * Mobile nav drawer.
 *
 * The chrome's own `matchMedia("(min-width: 1024px)")` result is the single
 * signal: below lg the rail is hidden and the nav moves into the top-bar
 * hamburger Sheet; when the viewport widens back the desktop rail returns and
 * the portaled Sheet must CLOSE rather than sit orphaned beside it
 * (DashboardChrome.tsx MobileNav, `prevDesktop`).
 *
 * `dom-polyfills.ts` installs its stub only when `window.matchMedia` is
 * missing and its `matches` is always false, so it cannot drive this. A
 * controllable stub is installed here instead of being pushed into the shared
 * polyfill, so the smoke tier's media behaviour is untouched.
 */

import { act, cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mountRoute } from "@/test/mount-with-location";
import { resetViewRole } from "@/test/render";

type Listener = (event: { matches: boolean; media: string }) => void;

const listeners = new Map<string, Set<Listener>>();
let desktop = false;

/** `(min-width: 1024px)` follows `desktop`; every other query stays false,
 *  matching the shared polyfill's behaviour for `(max-width: 1280px)`. */
const queryMatches = (query: string) =>
  query === "(min-width: 1024px)" ? desktop : false;

function installMatchMedia() {
  listeners.clear();
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      get matches() {
        return queryMatches(query);
      },
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: (_type: string, listener: Listener) => {
        const set = listeners.get(query) ?? new Set<Listener>();
        set.add(listener);
        listeners.set(query, set);
      },
      removeEventListener: (_type: string, listener: Listener) => {
        listeners.get(query)?.delete(listener);
      },
      dispatchEvent: () => false,
    }),
  });
}

/** Flip the breakpoint and notify the chrome's subscriber, the way a real
 *  viewport resize would. */
function setDesktop(next: boolean) {
  desktop = next;
  for (const [query, set] of listeners) {
    for (const listener of set) {
      listener({ matches: queryMatches(query), media: query });
    }
  }
}

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  desktop = false;
  installMatchMedia();
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  resetViewRole();
  errorSpy.mockRestore();
});

describe("DashboardChrome mobile drawer", () => {
  it("below lg the hamburger renders", async () => {
    await mountRoute("/overview");
    expect(screen.getByLabelText("Open navigation menu")).toBeDefined();
  });

  it("the hamburger opens the nav Sheet", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await mountRoute("/overview");
    await user.click(screen.getByLabelText("Open navigation menu"));
    await waitFor(() => {
      expect(screen.getByText("Navigation")).toBeDefined();
    });
  });

  it("widening past lg closes the Sheet rather than orphaning it", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await mountRoute("/overview");
    await user.click(screen.getByLabelText("Open navigation menu"));
    await waitFor(() => {
      expect(screen.getByText("Navigation")).toBeDefined();
    });

    await act(() => setDesktop(true));
    await waitFor(() => {
      expect(screen.queryByText("Navigation")).toBeNull();
    });
  });

  it("at lg and above the hamburger is not the live nav mount", async () => {
    desktop = true;
    await mountRoute("/overview");
    expect(screen.queryByText("Navigation")).toBeNull();
  });
});
