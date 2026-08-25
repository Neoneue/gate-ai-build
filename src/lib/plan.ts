/** A surface is on a non-PRO experience when its route ends in `-default` or
 * `-free`. Single source of truth consumed by the sidebar lock icons and the
 * workspace badge — if the badge says PRO, the locks are hidden, and vice versa. */
export const FREE_SURFACE = /-(default|free)$/;

/** Returns true for `-default` routes (the "default workspace" tier). */
export const isDefaultSurface = (pathname: string): boolean =>
  pathname.endsWith("-default");

/** Returns true for `-free` routes (the "Free workspace" tier). */
export const isFreeSurface = (pathname: string): boolean =>
  pathname.endsWith("-free");

/** Returns true for any non-PRO surface (default or free). Used by sidebar
 *  lock icons and any shared "is this gated?" check. */
export const isNonProSurface = (pathname: string): boolean =>
  FREE_SURFACE.test(pathname);

/** Nav bases that have a `-free` twin. */
const FREE_TWINS = new Set([
  "/overview",
  "/messages",
  "/conversations",
  "/models",
  "/token-savings",
  "/limits",
  "/security",
  "/policies",
  "/audit-trail",
  "/activity",
  "/team",
  "/billing",
  "/api-keys",
  "/notifications",
  "/settings",
]);

/** Nav bases that have a `-default` twin. */
export const DEFAULT_TWINS = new Set([
  "/overview",
  "/messages",
  "/conversations",
  "/models",
  "/token-savings",
  "/limits",
  "/security",
  "/policies",
  "/audit-trail",
  "/activity",
  "/team",
  "/billing",
  "/api-keys",
  "/notifications",
  "/settings",
]);

/** PRO path → its Free twin. Falls back to Free home if no twin exists.
 *  Idempotent on Free paths; converts -default to -free. */
export const toFreePath = (pathname: string): string => {
  if (isFreeSurface(pathname)) {
    return pathname;
  }
  const base = isDefaultSurface(pathname)
    ? pathname.replace(/-default$/, "")
    : pathname;
  return FREE_TWINS.has(base) ? `${base}-free` : "/overview-free";
};

/** PRO path → its Default twin. Falls back to Default home if no twin exists.
 *  Idempotent on Default paths; converts -free to -default. */
export const toDefaultPath = (pathname: string): string => {
  if (isDefaultSurface(pathname)) {
    return pathname;
  }
  const base = isFreeSurface(pathname)
    ? pathname.replace(/-free$/, "")
    : pathname;
  return DEFAULT_TWINS.has(base) ? `${base}-default` : "/overview-default";
};

/** Non-PRO path → its PRO twin (strip the `-free` or `-default` suffix). */
export const toProPath = (pathname: string): string =>
  pathname.replace(/-(free|default)$/, "") || "/overview";
