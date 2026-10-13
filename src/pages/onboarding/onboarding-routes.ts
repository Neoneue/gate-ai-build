/* Routes of the Onboarding workspace. Every path carries the `-onboarding`
 * suffix (src/lib/plan.ts), the same convention as the `-default`, `-free`
 * and `-enterprise` twins, so the workspace switcher and the tier helpers
 * recognise it. Both flows start on ONE first page, `/overview-onboarding`;
 * the flow version picked in the demo controls decides what it renders. */

import type { SidebarSection } from "@/components/ui/sidebar";
import { ONBOARDING_SIDEBAR_SECTIONS } from "@/layouts/nav-sections";
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

/** The demo's sign-in screen: where it starts and where Sign out returns. */
export const ONBOARDING_SIGN_IN = "/sign-in-onboarding";

/** Router state a demo signup (`/sign-up-onboarding`) passes on its way in,
 *  so OnboardingLayout lets the flow start on the page signup lands on. */
export const ONBOARDING_SIGNUP_STATE = { onboardingSignup: true } as const;

/* Mobile A tab mark (owner 2026-10-11). The phone demo and the desktop flow
 * share `/chat-onboarding`, so a cold load cannot tell them apart by URL,
 * and screen width would catch a narrowed desktop window. The Mobile A
 * signup marks the tab instead; a refresh in a marked tab returns to the
 * demo's sign-in, never to the desktop setup start. Per tab
 * (sessionStorage), cleared when the desktop start page loads. It is the
 * only thing this workspace stores: the flow state itself stays in memory. */
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

/** The chat page the Mobile A demo was last on (the landing or a
 *  conversation), so the site menu's Gate Chat row returns to it after a
 *  visit to Overview, Activity or Messages (owner 2026-10-12). In memory,
 *  like the chat store: a refresh starts over. */
let lastChatPath: string = ONBOARDING_ROUTES.chat;

export const rememberChatPath = (path: string): void => {
  lastChatPath = path;
};

export const lastOnboardingChatPath = (): string => lastChatPath;

/** Nav rows the phone demo has its own copy of, by nav id. Overview is
 *  Mobile A's; Option B's Overview is its phone start (`phoneOverviewPath`). */
export const PHONE_DEMO_PAGES: Record<string, string> = {
  overview: ONBOARDING_ROUTES.mobileOverview,
  requests: ONBOARDING_ROUTES.mobileMessages,
  activity: ONBOARDING_ROUTES.mobileActivity,
  conversations: ONBOARDING_ROUTES.mobileConversations,
};

/** Where the phone demo's Overview row, logo and menu brand go (owner
 *  2026-10-12): Mobile A's Overview with counts in a Mobile A tab, else
 *  Option B's two-card start. */
export const phoneOverviewPath = (): string =>
  isMobileATab() ? ONBOARDING_ROUTES.mobileOverview : ONBOARDING_ROUTES.start;

/** The site menu's nav (phone only, below `lg`): the Onboarding nav with
 *  Overview at `overviewPath` and Messages, Activity and Conversations at
 *  the phone demo's own copies, so the phone demo never opens a desktop page
 *  for them. The Gate Chat row returns to the chat page the demo was last
 *  on, so the conversation is where it was left. Every other row is
 *  unchanged (owner 2026-10-11, 2026-10-12). Used by the chat top bar's menu
 *  (onboarding-chat-top-bar.tsx) and B's phone start menu (`ImprovedStart`). */
export function phoneSiteSections(overviewPath: string): SidebarSection[] {
  const pages: Record<string, string> = {
    ...PHONE_DEMO_PAGES,
    overview: overviewPath,
    chat: lastOnboardingChatPath(),
  };
  return ONBOARDING_SIDEBAR_SECTIONS.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      const pageId = pages[item.id];
      return pageId ? { ...item, pageId } : item;
    }),
  }));
}

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
