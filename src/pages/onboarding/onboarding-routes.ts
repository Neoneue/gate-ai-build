/* Routes of the Onboarding workspace. Every path carries the `-onboarding`
 * suffix (src/lib/plan.ts), the same convention as the `-default`, `-free`
 * and `-enterprise` twins, so the workspace switcher and the tier helpers
 * recognise it. Both flows start on ONE first page, `/overview-onboarding`;
 * the flow version picked in the demo controls decides what it renders. */

import { ListChecks } from "lucide-react";
import type { SidebarSection } from "@/components/ui/sidebar";
import { ONBOARDING_SIDEBAR_SECTIONS } from "@/layouts/nav-sections";
import { ONBOARDING_FIRST_STEP } from "@/lib/plan";
import type { ImprovedState } from "@/pages/onboarding/onboarding-state";

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
  /* The mock hosted checkout "Add credits" hands off to (owner 2026-10-13). */
  checkout: "/checkout-onboarding",
  /* The workspace's Overview, in the rail from step 1 (owner 2026-10-13):
   * empty until step 3's first message, then fed by each message as it
   * lands. */
  setupOverview: "/overview-setup-onboarding",
  /* Gate Chat, the Onboarding version (OnboardingChat), phone and desktop.
   * Free, Default, Pro and Enterprise keep the main version (pages/Chat). */
  chat: "/chat-onboarding",
  /* Mobile A demo (signup -> Gate Chat): its own Overview, empty until the
   * first message (OnboardingMobileOverview). Mobile only; the desktop
   * Overview pages are untouched (owner 2026-10-11). */
  mobileOverview: "/overview-mobile-onboarding",
  /* Mobile A demo copies of Messages and Activity: empty until the first
   * message, then that message (owner 2026-10-12). */
  mobileMessages: "/messages-mobile-onboarding",
  mobileActivity: "/activity-mobile-onboarding",
  /* The phone demo's Conversations copy: empty until the first message,
   * then one row per demo chat (owner 2026-10-12). */
  mobileConversations: "/conversations-mobile-onboarding",
} as const;

/** Opens a page in a new tab with no opener (the DashboardDefault docs
 *  button's `window.open`): the explore task rows, so the onboarding tab
 *  stays on its page and keeps its state (owner 2026-10-13). */
export const openInNewTab = (to: string) => {
  window.open(to, "_blank", "noopener,noreferrer");
};

/** The screen-reader cue on every control that opens a new tab, read after
 *  its label in a visually hidden span (copywriter, owner 2026-10-13). */
export const NEW_TAB_CUE = "(opens in a new tab)";

/** The two phone demos' auth entries (owner 2026-10-13): both start at
 *  sign-in, then sign-up. Mobile A's signup opens Gate Chat; Mobile B's
 *  opens the 2-card phone start (`ONBOARDING_ROUTES.start`). The bare
 *  `/sign-in-onboarding` and `/sign-up-onboarding` redirect to A. */
export type PhoneDemoVersion = "a" | "b";
export const ONBOARDING_AUTH: Record<
  PhoneDemoVersion,
  { signIn: string; signUp: string }
> = {
  a: { signIn: "/sign-in-onboarding/a", signUp: "/sign-up-onboarding/a" },
  b: { signIn: "/sign-in-onboarding/b", signUp: "/sign-up-onboarding/b" },
};

/** The demo's sign-in screen: where Mobile A starts and where Sign out
 *  returns. */
export const ONBOARDING_SIGN_IN = ONBOARDING_AUTH.a.signIn;

/** The mockup's preview of step 3's failure states (owner 2026-10-13):
 *  `?simulate=fail-connection` (the first test message check fails),
 *  `fail-demo` (the first protection demo run fails) or `fail-both`. Read
 *  once, from the URL the app loaded with, because a reload restarts the
 *  flow at its first page (so the flag goes on that page's URL); step 3
 *  also reads it from its own URL. The product's real states are the same
 *  screens, reached when a message does not go through. */
export type SimulateFlag = "fail-connection" | "fail-demo" | "fail-both";

const readSimulateFlag = (search: string): SimulateFlag | null => {
  const value = new URLSearchParams(search).get("simulate");
  return value === "fail-connection" ||
    value === "fail-demo" ||
    value === "fail-both"
    ? value
    : null;
};

const SIMULATE_ON_LOAD =
  typeof window === "undefined"
    ? null
    : readSimulateFlag(window.location.search);

/** The failure preview for this page load: the current URL's flag, else
 *  the one the app loaded with. */
export const simulateFlag = (search: string): SimulateFlag | null =>
  readSimulateFlag(search) ?? SIMULATE_ON_LOAD;

/** Router state a demo signup (`/sign-up-onboarding`) passes on its way in,
 *  so OnboardingLayout lets the flow start on the page signup lands on. */
export const ONBOARDING_SIGNUP_STATE = { onboardingSignup: true } as const;

/* Mobile A tab mark (owner 2026-10-11). The phone demo and the desktop flow
 * share `/chat-onboarding`, so a cold load cannot tell them apart by URL,
 * and screen width would catch a narrowed desktop window. The Mobile A
 * signup marks the tab instead; a refresh in a marked tab returns to the
 * demo's sign-in, never to the desktop setup start. Per tab
 * (sessionStorage), cleared when the desktop start page loads. One of two
 * things this workspace stores, with the credit balance the Gate Chat tab
 * reads (onboarding-credits.ts, owner 2026-10-13): the flow state itself
 * stays in memory. */
const MOBILE_A_TAB_KEY = "gate-onboarding-mobile-a";

export const markMobileATab = (): void => {
  // A Mobile A run ends any Option B phone chat in this tab.
  optionBPhoneChat = false;
  try {
    sessionStorage.setItem(MOBILE_A_TAB_KEY, "1");
  } catch {
    // Storage blocked: a refresh falls back to the setup start, as before.
  }
};

export const isMobileATab = (): boolean => {
  try {
    return sessionStorage.getItem(MOBILE_A_TAB_KEY) === "1";
  } catch {
    return false;
  }
};

export const clearMobileATab = (): void => {
  try {
    sessionStorage.removeItem(MOBILE_A_TAB_KEY);
  } catch {
    // Nothing stored to clear.
  }
};

/* Option B phone chat mark (owner 2026-10-12): the phone two-card start's
 * Gate Chat buttons (`useOpenChatOnPhone`, improved-start.tsx) open the same
 * chat as Mobile A. In memory: Option B has no signup yet, so a reload
 * starts over. The phone start page keeps it, since B's site menu Overview
 * returns there mid-run; the desktop start (`DesktopPicker`) clears it when
 * it mounts, so its "Open Gate Chat" keeps the desktop chat, and a Mobile A
 * signup clears it (`markMobileATab`). */
let optionBPhoneChat = false;

export const markOptionBPhoneChat = (): void => {
  optionBPhoneChat = true;
};

export const clearOptionBPhoneChat = (): void => {
  optionBPhoneChat = false;
};

/** The one gate for the phone demo chat (owner 2026-10-12): Mobile A's tab
 *  mark or Option B's phone chat mark. The free-model start, the picker,
 *  scripted replies and their follow-ups, the quick actions and no "Setup
 *  complete" toast all read it. The refresh redirect to the demo sign-in
 *  stays on `isMobileATab` alone. */
export const isPhoneDemoChat = (): boolean =>
  isMobileATab() || optionBPhoneChat;

/** Where the chat's Sign out goes (owner 2026-10-13): B's sign-in from an
 *  Option B phone chat, so a B tester stays in B; A's sign-in otherwise. */
export const chatSignInPath = (): string =>
  optionBPhoneChat ? ONBOARDING_AUTH.b.signIn : ONBOARDING_SIGN_IN;

/** The chat page the Mobile A demo was last on (the landing or a
 *  conversation), so the site menu's Gate Chat row returns to it after a
 *  visit to Overview, Activity or Messages (owner 2026-10-12). In memory,
 *  like the chat store: a refresh starts over. */
let lastChatPath: string = ONBOARDING_ROUTES.chat;

export const rememberChatPath = (path: string): void => {
  lastChatPath = path;
};

export const lastOnboardingChatPath = (): string => lastChatPath;

/** Nav rows the phone demo has its own copy of, by nav id. Both versions'
 *  Overview row opens the phone Overview (owner 2026-10-15); Option B's
 *  phone start is the chat drawer's "Main" link. */
export const PHONE_DEMO_PAGES: Record<string, string> = {
  overview: ONBOARDING_ROUTES.mobileOverview,
  requests: ONBOARDING_ROUTES.mobileMessages,
  activity: ONBOARDING_ROUTES.mobileActivity,
  conversations: ONBOARDING_ROUTES.mobileConversations,
};

/** Where the chat top bar's logo goes (owner 2026-10-12): Mobile A's
 *  Overview with counts in a Mobile A tab, else Option B's two-card start.
 *  The site menu's Overview row and brand open the phone Overview on both
 *  versions (owner 2026-10-15). */
export const phoneOverviewPath = (): string =>
  isMobileATab() ? ONBOARDING_ROUTES.mobileOverview : ONBOARDING_ROUTES.start;

/** Where the phone menu's Sign out goes (owner 2026-10-14): Mobile A's
 *  sign-in in a Mobile A tab, else Option B's, so each version restarts at
 *  its own first screen. */
export const phoneSignInPath = (): string =>
  isMobileATab() ? ONBOARDING_AUTH.a.signIn : ONBOARDING_AUTH.b.signIn;

/** The site menu's nav (phone only, below `lg`): the Onboarding nav with
 *  Overview at `overviewPath` and Messages, Activity and Conversations at
 *  the phone demo's own copies, so the phone demo never opens a desktop page
 *  for them. The Gate Chat row returns to the chat page the demo was last
 *  on, so the conversation is where it was left. Every other row is
 *  unchanged (owner 2026-10-11, 2026-10-12). Used by the chat top bar's menu
 *  (onboarding-chat-top-bar.tsx) and B's phone start menu (`ImprovedStart`).
 *  `improved` set (Option B, owner 2026-10-15): "Get started" above
 *  Overview opens B's phone start, until setup is over by the desktop
 *  rail's own rule (`setupTasksDone`). */
export function phoneSiteSections(
  overviewPath: string,
  improved?: ImprovedState | null
): SidebarSection[] {
  const pages: Record<string, string> = {
    ...PHONE_DEMO_PAGES,
    overview: overviewPath,
    chat: lastOnboardingChatPath(),
  };
  const getStarted =
    improved && !setupTasksDone(improved)
      ? [
          {
            id: SETUP_NAV_ID,
            icon: ListChecks,
            label: "Get started",
            pageId: ONBOARDING_ROUTES.start,
            newTab: false,
          },
        ]
      : [];
  return ONBOARDING_SIDEBAR_SECTIONS.map((section) => ({
    ...section,
    items: section.items.flatMap((item) => {
      const pageId = pages[item.id];
      // The phone chat stays in this tab (the desktop sidebar opens a new
      // one), so Resume finds the conversation.
      const row = pageId ? { ...item, pageId, newTab: false } : item;
      return item.id === "overview" ? [...getStarted, row] : [row];
    }),
  }));
}

/** The desktop rail on every onboarding page (owner 2026-10-13): the setup
 *  steps (OnboardingChrome) and the workspace pages (DashboardChrome), in
 *  every tab, since they read the shared setup state. "Get started" above
 *  Overview, until every explore task is checked off on the final page or
 *  in the Tasks menu (the live Gate build's rule, get-started-menu.tsx);
 *  Overview always, opening the workspace's Overview. `improved` is null
 *  outside the onboarding flow (no Get started row). Every other row is
 *  ONBOARDING_SIDEBAR_SECTIONS unchanged; the phone menus
 *  (`phoneSiteSections`) keep that list as it is. */
export function setupSidebarSections(
  improved: ImprovedState | null | undefined
): SidebarSection[] {
  const showGetStarted = Boolean(improved) && !setupTasksDone(improved);
  return ONBOARDING_SIDEBAR_SECTIONS.map((section) => {
    const overview = section.items.find((item) => item.id === "overview");
    if (!overview) {
      return section;
    }
    return {
      ...section,
      items: [
        ...(improved && showGetStarted
          ? [
              {
                id: SETUP_NAV_ID,
                icon: ListChecks,
                label: "Get started",
                pageId: setupNavTarget(improved),
              },
            ]
          : []),
        { ...overview, pageId: ONBOARDING_ROUTES.setupOverview },
        ...section.items.filter((item) => item.id !== "overview"),
      ],
    };
  });
}

/** Setup is over for the rail: Finish setup was pressed and all four
 *  explore tasks are checked off. */
export const setupTasksDone = (
  improved: ImprovedState | null | undefined
): boolean =>
  Boolean(improved?.finished) &&
  Object.values(improved?.tasks ?? {}).every(Boolean);

/** Where the rail's "Get started" row goes, forward only: the step due
 *  next, or the final page once Finish setup was pressed. */
export function setupNavTarget(improved: ImprovedState): string {
  if (improved.finished) {
    return ONBOARDING_ROUTES.improvedComplete;
  }
  if (!improved.pathChosen || improved.connection === "gate-chat") {
    return ONBOARDING_ROUTES.start;
  }
  return improved.connected
    ? ONBOARDING_ROUTES.verify
    : ONBOARDING_ROUTES.improvedConnect;
}

/** The rail's Upgrade card on the onboarding workspace (owner 2026-10-13):
 *  hidden during setup, shown from the final page on (Finish setup was
 *  pressed), when the user can upgrade. It opens the workspace's own plans
 *  page, so the demo never leaves the workspace. */
export const onboardingUpgradePath = (
  improved: ImprovedState | null | undefined
): string | undefined =>
  improved?.finished ? "/billing-onboarding/plans" : undefined;

/** The rail id of the "Get started" row. */
export const SETUP_NAV_ID = "get-started";

/** The "Full name" typed on the onboarding Create account form, so the
 *  Mobile A Activity page can rank the new user in Top users (owner
 *  2026-10-12). Set on both signup paths: Continue with Google passes ""
 *  (it carries no name). In memory, like `lastChatPath`: a refresh starts
 *  over. */
let signupName = "";

export const rememberSignupName = (name: string): void => {
  signupName = name.trim();
};

export const onboardingSignupName = (): string => signupName;

export const isOnboardingSignup = (state: unknown): boolean =>
  typeof state === "object" &&
  state !== null &&
  (state as { onboardingSignup?: unknown }).onboardingSignup === true;

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

/** The workspace's own pages (owner 2026-10-13: the demo never leaves the
 *  onboarding workspace): every sidebar row and the final page's explore
 *  rows land on one. A cold load renders in place (OnboardingLayout), since
 *  the explore rows open a new tab, and resumes the setup state the other
 *  tabs share (OnboardingProvider). */
export const ONBOARDING_WORKSPACE_PAGES: ReadonlySet<string> = new Set([
  ONBOARDING_ROUTES.setupOverview,
  "/messages-onboarding",
  "/conversations-onboarding",
  "/security-onboarding",
  "/audit-trail-onboarding",
  "/policies-onboarding",
  "/token-savings-onboarding",
  "/models-onboarding",
  "/activity-onboarding",
  "/limits-onboarding",
  "/members-onboarding",
  "/teams-onboarding",
  "/billing-onboarding",
  "/billing-onboarding/plans",
  "/api-keys-onboarding",
  "/notifications-onboarding",
  "/settings-onboarding",
]);

/** Exits: finishing or skipping setup lands on the user's real workspace,
 *  the Default twin of each page. The four "Explore your Gateway" pages stay
 *  in the onboarding workspace (owner 2026-10-13), on routes that mount
 *  their Default twins (App.tsx). */
export const ONBOARDING_EXITS = {
  overview: "/overview-default",
  messages: "/messages-default",
  policies: "/policies-onboarding",
  limits: "/limits-onboarding",
  savings: "/token-savings-onboarding",
  models: "/models-onboarding",
} as const;
