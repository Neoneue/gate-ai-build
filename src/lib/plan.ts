/** A surface is on the FREE / default experience when its route ends in
 * `-default` or `-free`; everything else is the PRO surface. Single source of
 * truth for the workspace plan badge and the sidebar PRO-feature lock icons —
 * if the badge says PRO, the locks are hidden, and vice versa. */
export const FREE_SURFACE = /-(default|free)$/;

export const isFreeSurface = (pathname: string): boolean =>
  FREE_SURFACE.test(pathname);

/** Nav bases that have a `-free` twin (every unlocked surface). Limits and
 *  Events are PRO-only — locked in Free, no twin — so they are absent here. */
const FREE_TWINS = new Set([
  "/overview",
  "/requests",
  "/conversations",
  "/models",
  "/token-savings",
  "/policies",
  "/audit-trail",
  "/activity",
  "/team",
  "/billing",
  "/api-keys",
  "/settings",
]);

/** PRO path → its Free twin. PRO-only surfaces (Limits/Events) and any route
 *  without a twin fall back to the Free home. Idempotent on Free paths. */
export const toFreePath = (pathname: string): string => {
  if (isFreeSurface(pathname)) {
    return pathname;
  }
  return FREE_TWINS.has(pathname) ? `${pathname}-free` : "/overview-free";
};

/** Free path → its PRO twin (strip the `-free` suffix). */
export const toProPath = (pathname: string): string =>
  pathname.replace(/-free$/, "") || "/overview";
