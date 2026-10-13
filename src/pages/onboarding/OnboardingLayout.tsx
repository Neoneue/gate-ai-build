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
import {
  clearMobileATab,
  flowOfRoute,
  isMobileATab,
  isOnboardingSignup,
  isPhoneDemoChat,
  ONBOARDING_ROUTES,
  ONBOARDING_SIGN_IN,
} from "@/pages/onboarding/onboarding-routes";
import { useOnboarding } from "@/pages/onboarding/use-onboarding";
import { useOnboardingMotion } from "@/pages/onboarding/use-onboarding-motion";

/* ─── OnboardingLayout ──────────────────────────────────────────────────────
 * Layout route for every `-onboarding` path. It owns the in-memory flow
 * state (OnboardingProvider) and enforces the demo contract:
 *   • A cold load (refresh, typed URL) of any step but the first redirects
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
  const [started, setStarted] = useState(
    () =>
      pathname === ONBOARDING_ROUTES.start || isOnboardingSignup(locationState)
  );
  if (!started && pathname === ONBOARDING_ROUTES.start) {
    setStarted(true);
  }
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
