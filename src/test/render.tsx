/**
 * Shared mount helper for the route smoke tier.
 *
 * Tests opt into a DOM per file with the docblock
 * `// @vitest-environment happy-dom` — the global `environment` stays `node`
 * because the pure (data / lib) tests depend on it and are far cheaper there.
 *
 * The provider stack mirrors production: `ThemeProvider` wraps `App` in
 * `src/main.tsx`, and `AskAiThreadProvider` is part of the route tree itself.
 * StrictMode is deliberately omitted — its double-render would double every
 * mount in a ~150-case suite for no extra signal here.
 *
 * Importing this module pulls in `dom-polyfills`, which shims the browser APIs
 * happy-dom lacks and the dashboard chrome calls during mount.
 */

import { type RenderResult, render, waitFor } from "@testing-library/react";
import { Suspense } from "react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "@/App";
import { ThemeProvider } from "@/hooks/use-theme";
import { teamsStore, type ViewRole } from "@/pages/teams/teams-store";
import "./dom-polyfills";

type RenderRouteOptions = {
  /** Enterprise view role; the chrome guard hides or read-onlys surfaces by it. */
  role?: ViewRole;
};

/** Restore the store default so role-scoped tests cannot leak into each other. */
export function resetViewRole() {
  teamsStore.setViewRole("admin");
}

/**
 * Mount the real route tree at `path` under a MemoryRouter and wait for the
 * lazy chunk to resolve (every page renders `main`, the auth layout, or at
 * least an `h1`).
 */
export async function renderRoute(
  path: string,
  opts: RenderRouteOptions = {}
): Promise<RenderResult> {
  if (opts.role) {
    teamsStore.setViewRole(opts.role);
  }

  const result = render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <Suspense fallback={null}>
          <AppRoutes />
        </Suspense>
      </MemoryRouter>
    </ThemeProvider>
  );

  await waitFor(
    () => {
      const mounted =
        result.container.querySelector("main, [data-slot=auth-layout], h1") ||
        result.container.textContent?.trim();
      if (!mounted) {
        throw new Error(`route ${path} never resolved a page root`);
      }
    },
    { timeout: 5000 }
  );

  return result;
}
