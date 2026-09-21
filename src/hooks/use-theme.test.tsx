// @vitest-environment happy-dom
/**
 * Theme provider contract.
 *
 * `index.css` flips every semantic token off `.dark` on <html>, so the class
 * IS the theme; the provider owns only that class and the persisted choice.
 * A stored choice wins over the OS — the provider "keeps following the OS
 * until an explicit choice is stored", so a stored value must not be
 * overwritten by `matchMedia` on mount.
 */

import { act, cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider, useTheme } from "./use-theme";

/** Controllable `prefers-color-scheme` stub; the provider also subscribes to
 *  `change`, so the listener surface has to exist. */
function stubPrefersDark(dark: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: query.includes("prefers-color-scheme: dark") ? dark : false,
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

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  stubPrefersDark(false);
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("useTheme", () => {
  it("toggle flips the document class", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    act(() => result.current.toggle());
    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    act(() => result.current.toggle());
    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("toggle persists the choice to localStorage", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.toggle());
    expect(localStorage.getItem("theme")).toBe("dark");
    act(() => result.current.toggle());
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("setTheme is idempotent and still writes the class", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setTheme("dark"));
    act(() => result.current.setTheme("dark"));
    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("the stored value wins over matchMedia on first read", () => {
    localStorage.setItem("theme", "light");
    stubPrefersDark(true);
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("with no stored value the OS preference is followed", () => {
    stubPrefersDark(true);
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("an unparseable stored value falls back to the OS preference", () => {
    localStorage.setItem("theme", "sepia");
    stubPrefersDark(true);
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("dark");
  });
});
