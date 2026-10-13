import { Suspense, useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  useLocation,
  useOutletContext,
} from "react-router-dom";
import { toast } from "sonner";
import type { LayoutContext } from "@/App";
import "@/pages/onboarding/onboarding-motion.css";
import { OnboardingProvider } from "@/pages/onboarding/OnboardingProvider";
import { resetOnboardingBalance } from "@/pages/onboarding/onboarding-credits";
import {
  clearMobileATab,
  flowOfRoute,
  isMobileATab,
  isOnboardingSignup,
  isPhoneDemoChat,
  ONBOARDING_ROUTES,
  ONBOARDING_SIGN_IN,
  ONBOARDING_WORKSPACE_PAGES,
} from "@/pages/onboarding/onboarding-routes";
import { isMobileSetupNow } from "@/pages/onboarding/use-is-mobile-setup";
import { useOnboarding } from "@/pages/onboarding/use-onboarding";
import { useOnboardingMotion } from "@/pages/onboarding/use-onboarding-motion";

/* ─── OnboardingLayout ──────────────────────────────────────────────────────
 * Layout route for every `-onboarding` path. It owns the flow state
 * (OnboardingProvider, shared with the workspace's other tabs) and enforces
 * the demo contract:
 *   • A cold load of the desktop Gate Chat (`/chat-onboarding`, opened in a
 *     new tab) starts there; a conversation URL falls back to the landing.
 *   • A cold load (refresh, typed URL) of any other step but the first redirects
 *     to `/overview-onboarding`, or, in a tab the Mobile A signup marked,
 *     to the demo's sign-in (`isMobileATab`), so a phone refresh never
 *     lands on the desktop setup start. A demo signup (`/sign-up-onboarding`)
 *     also starts the flow, on the page it lands on. The guard keys on THIS layout's first
 *     mount, so in-app navigation inside the workspace is never redirected.
 *   • A route from the other flow version (only reachable by URL) also
 *     returns to the first page.
 * It passes the parent Layout's outlet context through untouched, so
 * DashboardChrome and ChatLayout below read sidebar / Ask AI state as on
 * every other route, and wraps its outlet in its own Suspense boundary so a
 * lazily loaded step never suspends (and resets) the flow state above it.
 * ───────────────────────────────────────────────────────────────────────── */

export function OnboardingLayout() {
  const parent = useOutletContext<LayoutContext>();
  return (
    <OnboardingProvider>
      <OnboardingGuard parent={parent} />
    </OnboardingProvider>
  );
}

function OnboardingGuard({ parent }: { parent: LayoutContext }) {
  useOnboardingMotion();
  const { pathname, state: locationState } = useLocation();
  const { flow, improved, updateImproved } = useOnboarding();
  // Desktop Gate Chat opens in a new tab (owner 2026-10-13), so a cold load
  // of the chat on desktop starts there, as a new user. A conversation URL
  // falls back to the chat landing (its store is empty in a fresh tab). The
  // phone keeps the redirect: Mobile A to its sign-in, Option B to the start.
  const [coldChat] = useState(
    () =>
      pathname.startsWith(ONBOARDING_ROUTES.chat) &&
      !isMobileATab() &&
      !isMobileSetupNow()
  );
  const [coldThread, setColdThread] = useState(
    () => coldChat && pathname !== ONBOARDING_ROUTES.chat
  );
  if (coldThread && pathname === ONBOARDING_ROUTES.chat) {
    setColdThread(false);
  }
  // A workspace page (a sidebar row, the Overview, or an explore row's new
  // tab) renders on a cold load too (owner 2026-10-13); it resumes the
  // setup state the other tabs share (OnboardingProvider).
  const [started, setStarted] = useState(
    () =>
      pathname === ONBOARDING_ROUTES.start ||
      isOnboardingSignup(locationState) ||
      coldChat ||
      ONBOARDING_WORKSPACE_PAGES.has(pathname)
  );
  if (!started && pathname === ONBOARDING_ROUTES.start) {
    setStarted(true);
  }
  // A fresh run (this layout mounting on the start page, or on the Mobile A
  // signup) begins with no credits: the stored balance the Gate Chat tab
  // reads (onboarding-credits.ts, owner 2026-10-13) goes back to 0. A cold
  // chat tab is part of the running demo, so it never resets. (The shared
  // setup state starts over in OnboardingProvider.)
  const [freshRun] = useState(
    () =>
      pathname === ONBOARDING_ROUTES.start || isOnboardingSignup(locationState)
  );
  useEffect(() => {
    if (freshRun) {
      resetOnboardingBalance();
    }
  }, [freshRun]);
  // The start page ends any Mobile A run in this tab. Option B's phone chat
  // mark stays: B's site menu Overview returns to its phone start mid-run
  // (owner 2026-10-12); the desktop start clears it (`DesktopPicker`).
  useEffect(() => {
    if (pathname === ONBOARDING_ROUTES.start) {
      clearMobileATab();
    }
  }, [pathname]);

  // The Improved flow's chat path: the existing Gate Chat page opens its
  // conversation on the first send, which is the first message through Gate.
  const chatThreadOpen = pathname.startsWith(`${ONBOARDING_ROUTES.chat}/`);
  useEffect(() => {
    if (chatThreadOpen && flow === "improved" && !improved.received) {
      updateImproved({ received: true, connected: true, pathChosen: true });
      // Desktop flow only: the phone demo chat's first message (Mobile A or
      // Option B's phone chat) is a chat, not a setup step, so it gets no
      // "Setup complete" toast (owner 2026-10-12).
      if (!isPhoneDemoChat()) {
        toast.success("Setup complete");
      }
    }
  }, [chatThreadOpen, flow, improved.received, updateImproved]);

  if (coldThread) {
    return <Navigate replace to={ONBOARDING_ROUTES.chat} />;
  }
  if (!started) {
    return (
      <Navigate
        replace
        to={isMobileATab() ? ONBOARDING_SIGN_IN : ONBOARDING_ROUTES.start}
      />
    );
  }
  const routeFlow = pathname.startsWith(ONBOARDING_ROUTES.chat)
    ? "improved"
    : flowOfRoute(pathname);
  if (routeFlow !== null && routeFlow !== flow) {
    return <Navigate replace to={ONBOARDING_ROUTES.start} />;
  }

  return (
    <Suspense fallback={null}>
      <Outlet context={parent} />
    </Suspense>
  );
}
