/**
 * `renderRoute` (./render) owns its MemoryRouter, so a test that needs to read
 * the URL AFTER the app has settled cannot see it. This mounts the same
 * provider stack with a probe component inside the router and hands back a
 * live `location()` accessor.
 *
 * Kept separate from `render.tsx` so the smoke tier's helper stays the one
 * shape every other file already uses.
 */

import { type RenderResult, render, waitFor } from "@testing-library/react";
import { Suspense } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { AppRoutes } from "@/App";
import { ThemeProvider } from "@/hooks/use-theme";
import { teamsStore, type ViewRole } from "@/pages/teams/teams-store";
import "./dom-polyfills";

export type Loc = { pathname: string; search: string };

export type MountResult = RenderResult & { location: () => Loc };

export async function mountRoute(
  path: string,
  opts: { role?: ViewRole } = {}
): Promise<MountResult> {
  if (opts.role) {
    teamsStore.setViewRole(opts.role);
  }
  let current: Loc = { pathname: path, search: "" };
  const Probe = () => {
    const loc = useLocation();
    current = { pathname: loc.pathname, search: loc.search };
    return null;
  };

  const result = render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <Probe />
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
    { timeout: 20_000 }
  );

  return Object.assign(result, { location: () => current });
}
