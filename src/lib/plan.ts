/** A surface is on a non-PRO experience when a path segment ends in
 * `-default` or `-free`. Single source of truth consumed by the sidebar lock
 * icons and the workspace badge — if the badge says PRO, the locks are hidden,
 * and vice versa.
 *
 * The tier suffix is matched at a SEGMENT boundary, not just at the end of
 * the pathname: detail drill-ins like `/teams-enterprise/:teamId` and
 * `/teams-default/:teamId` carry their tier in the first segment, and an
 * end-anchored test dropped them back into PRO chrome. */
export const FREE_SURFACE = /-(default|free)(?=\/|$)/;

const DEFAULT_SEGMENT = /-default(?=\/|$)/;
const FREE_SEGMENT = /-free(?=\/|$)/;
const ENTERPRISE_SEGMENT = /-enterprise(?=\/|$)/;

/** Returns true for `-default` routes (the "default workspace" tier). */
export const isDefaultSurface = (pathname: string): boolean =>
  DEFAULT_SEGMENT.test(pathname);

/** Returns true for `-free` routes (the "Free workspace" tier). */
export const isFreeSurface = (pathname: string): boolean =>
  FREE_SEGMENT.test(pathname);

/** Returns true for `-enterprise` routes (the "Enterprise workspace" tier).
 *  Deliberately NOT part of FREE_SURFACE: Enterprise sits above Pro, so it
 *  never shows the Free-tier lock icons or badge. */
export const isEnterpriseSurface = (pathname: string): boolean =>
  ENTERPRISE_SEGMENT.test(pathname);

/** Teams list path for the tier the user is currently in. One Teams build
 *  serves Pro and Enterprise (and the Default twin); the pathname, not a
 *  prop, decides which subtree drill-ins and back-links stay inside. */
export const teamsListPath = (
  pathname: string
): "/teams" | "/teams-default" | "/teams-enterprise" => {
  if (isDefaultSurface(pathname)) {
    return "/teams-default";
  }
  if (isEnterpriseSurface(pathname)) {
    return "/teams-enterprise";
  }
  return "/teams";
};

/** Any tier suffix, on any segment — strip to recover the PRO base path. */
const TIER_SUFFIX = /-(default|free|enterprise)(?=\/|$)/;

const toBasePath = (pathname: string): string =>
  pathname.replace(TIER_SUFFIX, "");

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
  "/members",
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
  "/members",
  "/billing",
  "/api-keys",
  "/notifications",
  "/settings",
]);

/** Nav bases that have an `-enterprise` twin. Teams is the only page with a
 *  real divergent Enterprise build (A/B vs Pro); every other base reuses the
 *  Pro page component under the Enterprise chrome (see App.tsx). */
export const ENTERPRISE_TWINS = new Set([
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
  "/members",
  "/teams",
  "/billing",
  "/api-keys",
  "/notifications",
  "/settings",
]);

/** Insert a tier suffix after the FIRST segment when that base has a twin, so
 *  detail drill-ins survive a tier switch: `/teams/t1` + `-enterprise` →
 *  `/teams-enterprise/t1`. Falls back to that tier's Overview otherwise. */
const withSuffix = (
  base: string,
  suffix: string,
  twins: Set<string>,
  fallback: string
): string => {
  const slash = base.indexOf("/", 1);
  const head = slash === -1 ? base : base.slice(0, slash);
  const rest = slash === -1 ? "" : base.slice(slash);
  return twins.has(head) ? `${head}${suffix}${rest}` : fallback;
};

/** PRO path → its Free twin. Falls back to Free home if no twin exists.
 *  Idempotent on Free paths; converts -default and -enterprise to -free. */
export const toFreePath = (pathname: string): string => {
  if (isFreeSurface(pathname)) {
    return pathname;
  }
  return withSuffix(
    toBasePath(pathname),
    "-free",
    FREE_TWINS,
    "/overview-free"
  );
};

/** PRO path → its Default twin. Falls back to Default home if no twin exists.
 *  Idempotent on Default paths; converts -free and -enterprise to -default. */
export const toDefaultPath = (pathname: string): string => {
  if (isDefaultSurface(pathname)) {
    return pathname;
  }
  return withSuffix(
    toBasePath(pathname),
    "-default",
    DEFAULT_TWINS,
    "/overview-default"
  );
};

/** PRO path → its Enterprise twin. Falls back to Enterprise home if no twin
 *  exists. Idempotent on Enterprise paths. */
export const toEnterprisePath = (pathname: string): string => {
  if (isEnterpriseSurface(pathname)) {
    return pathname;
  }
  return withSuffix(
    toBasePath(pathname),
    "-enterprise",
    ENTERPRISE_TWINS,
    "/overview-enterprise"
  );
};

/** Non-PRO path → its PRO twin (strip the tier suffix). */
export const toProPath = (pathname: string): string =>
  toBasePath(pathname) || "/overview";
