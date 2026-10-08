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
  flowOfRoute,
  ONBOARDING_ROUTES,
} from "@/pages/onboarding/onboarding-routes";
import { useOnboarding } from "@/pages/onboarding/use-onboarding";
import { useOnboardingMotion } from "@/pages/onboarding/use-onboarding-motion";

/* ─── OnboardingLayout ──────────────────────────────────────────────────────
 * Layout route for every `-onboarding` path. It owns the in-memory flow
 * state (OnboardingProvider) and enforces the demo contract:
 *   • A cold load (refresh, typed URL) of any step but the first redirects
 *     to `/overview-onboarding`. The guard keys on THIS layout's first
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
  const { pathname } = useLocation();
  const { flow, improved, updateImproved } = useOnboarding();
  const [started, setStarted] = useState(
    () => pathname === ONBOARDING_ROUTES.start
  );
  if (!started && pathname === ONBOARDING_ROUTES.start) {
    setStarted(true);
  }

  // The Improved flow's chat path: the existing Gate Chat page opens its
  // conversation on the first send, which is the first message through Gate.
  const chatThreadOpen = pathname.startsWith(`${ONBOARDING_ROUTES.chat}/`);
  useEffect(() => {
    if (chatThreadOpen && flow === "improved" && !improved.received) {
      updateImproved({ received: true, connected: true, pathChosen: true });
      toast.success("Setup complete");
    }
  }, [chatThreadOpen, flow, improved.received, updateImproved]);

  if (!started) {
    return <Navigate replace to={ONBOARDING_ROUTES.start} />;
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
