const DEFAULT_SEGMENT = /-default(?=\/|$)/;
const FREE_SEGMENT = /-free(?=\/|$)/;
const ENTERPRISE_SEGMENT = /-enterprise(?=\/|$)/;
const ONBOARDING_SEGMENT = /-onboarding(?=\/|$)/;

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

/** Returns true for `-onboarding` routes: the first-run Onboarding workspace
 *  (a brand-new single-owner workspace on the Free plan, walked through the
 *  setup flow). It shares the Default workspace's nav and has no roles. */
export const isOnboardingSurface = (pathname: string): boolean =>
  ONBOARDING_SEGMENT.test(pathname);

/** Returns true on the tiers that have teams, budgets, roll-up and the
 *  team-manager role: Pro (no suffix) and Enterprise (PRD
 *  `docs/prds/org-team-hierarchy-prd.md` §3 "Plan availability" — only the
 *  org/team FORCED settings are Enterprise-only). Default and Free are
 *  single-owner workspaces with no roles, so they are the exclusions. */
export const isTeamRoleSurface = (pathname: string): boolean =>
  !(
    isDefaultSurface(pathname) ||
    isFreeSurface(pathname) ||
    isOnboardingSurface(pathname)
  );

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
const TIER_SUFFIX = /-(default|free|enterprise|onboarding)(?=\/|$)/;

const toBasePath = (pathname: string): string =>
  pathname.replace(TIER_SUFFIX, "");

/** Nav bases that have a `-free` twin. */
const FREE_TWINS = new Set([
  "/overview",
  "/chat",
  "/messages",
  "/messages-findings",
  "/conversations",
  "/conversations-trace",
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
const DEFAULT_TWINS = new Set([
  "/overview",
  "/chat",
  "/messages",
  "/messages-findings",
  "/conversations",
  "/conversations-trace",
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
const ENTERPRISE_TWINS = new Set([
  "/overview",
  "/chat",
  "/messages",
  "/messages-findings",
  "/conversations",
  "/conversations-trace",
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
const splitFirstSegment = (path: string): [head: string, rest: string] => {
  const slash = path.indexOf("/", 1);
  return slash === -1 ? [path, ""] : [path.slice(0, slash), path.slice(slash)];
};

const withSuffix = (
  base: string,
  suffix: string,
  twins: Set<string>,
  fallback: string
): string => {
  const [head, rest] = splitFirstSegment(base);
  return twins.has(head) ? `${head}${suffix}${rest}` : fallback;
};

/** Tier suffix of the pathname the user is currently on ("" for Pro). */
export const tierSuffixOf = (
  pathname: string
): "" | "-default" | "-free" | "-enterprise" | "-onboarding" => {
  if (isDefaultSurface(pathname)) {
    return "-default";
  }
  if (isFreeSurface(pathname)) {
    return "-free";
  }
  if (isEnterpriseSurface(pathname)) {
    return "-enterprise";
  }
  if (isOnboardingSurface(pathname)) {
    return "-onboarding";
  }
  return "";
};

/** Carry the CURRENT pathname's tier onto a PRO target path so cross-links
 *  stay in-tier: on `/messages-enterprise`, `/messages-findings/abc` ->
 *  `/messages-findings-enterprise/abc`; on a Pro path the target is returned
 *  unchanged. The suffix goes after the target's first segment, matching how
 *  the twin routes are declared in App.tsx. */
export const withTierOf = (
  currentPathname: string,
  targetProPath: string
): string => {
  const suffix = tierSuffixOf(currentPathname);
  if (suffix === "") {
    return targetProPath;
  }
  const [head, rest] = splitFirstSegment(toBasePath(targetProPath));
  return `${head}${suffix}${rest}`;
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

/** The Onboarding workspace has no per-page twins: it is the first-run
 *  setup flow, so switching into it ALWAYS lands on its first step. */
export const ONBOARDING_FIRST_STEP = "/overview-onboarding";

/** Any path → the Onboarding workspace's first step (no drill-in survives
 *  the switch, by design: the workspace is demoed from the start). */
export const toOnboardingPath = (): string => ONBOARDING_FIRST_STEP;

/** Non-PRO path → its PRO twin (strip the tier suffix). The Onboarding
 *  workspace's steps have no PRO twins, so leaving it lands on Overview. */
export const toProPath = (pathname: string): string =>
  isOnboardingSurface(pathname)
    ? "/overview"
    : toBasePath(pathname) || "/overview";

/** The Overview route for the workspace the pathname is on: `/teams-enterprise`
 *  -> `/overview-enterprise`, `/teams-default` -> `/overview-default`, else
 *  `/overview`. */
export function overviewPathFor(pathname: string): string {
  if (pathname.startsWith("/teams-enterprise")) {
    return "/overview-enterprise";
  }
  if (pathname.startsWith("/teams-default")) {
    return "/overview-default";
  }
  return "/overview";
}
