/* Routes of the Onboarding workspace. Every path carries the `-onboarding`
 * suffix (src/lib/plan.ts), the same convention as the `-default`, `-free`
 * and `-enterprise` twins, so the workspace switcher and the tier helpers
 * recognise it. Both flows start on ONE first page, `/overview-onboarding`;
 * the flow version picked in the demo controls decides what it renders. */

import { ONBOARDING_FIRST_STEP } from "@/lib/plan";

export const ONBOARDING_ROUTES = {
  start: ONBOARDING_FIRST_STEP,
  /* Current flow */
  connect: "/setup-connect-onboarding",
  gateConnect: "/setup-gate-connect-onboarding",
  manual: "/setup-manual-onboarding",
  listening: "/setup-listening-onboarding",
  attack: "/setup-attack-onboarding",
  complete: "/setup-complete-onboarding",
  /* Improved flow */
  handoff: "/improved-handoff-onboarding",
  link: "/improved-link-onboarding",
  improvedConnect: "/improved-connect-onboarding",
  verify: "/improved-verify-onboarding",
  improvedComplete: "/improved-complete-onboarding",
  /* Gate Chat, the Improved flow's chat path (the existing Gate Chat page). */
  chat: "/chat-onboarding",
} as const;

/** Where the Current flow's "from" query sends Back from the listening and
 *  attack steps. */
export type SetupFrom = "gate-connect" | "manual" | "payg";

export const parseFrom = (value: string | null): SetupFrom | null =>
  value === "gate-connect" || value === "manual" || value === "payg"
    ? value
    : null;

export const setupPageFor = (from: SetupFrom | null): string => {
  if (from === "manual") {
    return `${ONBOARDING_ROUTES.manual}?bill=byok`;
  }
  if (from === "payg") {
    return `${ONBOARDING_ROUTES.manual}?bill=payg`;
  }
  return ONBOARDING_ROUTES.gateConnect;
};

/** Improved step key (as stored in a DesktopSetup) -> route. */
export const improvedStepPath = (step: string): string => {
  if (step === "verify") {
    return ONBOARDING_ROUTES.verify;
  }
  if (step === "connect") {
    return ONBOARDING_ROUTES.improvedConnect;
  }
  return ONBOARDING_ROUTES.start;
};

const CURRENT_ONLY = new Set<string>([
  ONBOARDING_ROUTES.connect,
  ONBOARDING_ROUTES.gateConnect,
  ONBOARDING_ROUTES.manual,
  ONBOARDING_ROUTES.listening,
  ONBOARDING_ROUTES.attack,
  ONBOARDING_ROUTES.complete,
]);

/** Which flow a route belongs to; `null` for the shared first page. */
export function flowOfRoute(pathname: string): "current" | "improved" | null {
  if (pathname === ONBOARDING_ROUTES.start) {
    return null;
  }
  if (CURRENT_ONLY.has(pathname)) {
    return "current";
  }
  return "improved";
}

/** Exits: finishing or skipping setup lands on the user's real workspace,
 *  the Default twin of each page. */
export const ONBOARDING_EXITS = {
  overview: "/overview-default",
  messages: "/messages-default",
  policies: "/policies-default",
  limits: "/limits-default",
  savings: "/token-savings-default",
  models: "/models-default",
} as const;
