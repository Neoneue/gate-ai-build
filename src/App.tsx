import { lazy, Suspense, useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthLayout } from "@/layouts/AuthLayout";

/* Route-level code splitting: each page loads as its own chunk on first
 * visit instead of shipping the whole dashboard in the entry bundle. */
const Activity = lazy(() =>
  import("@/pages/Activity").then((m) => ({ default: m.Activity }))
);
const ApiKeys = lazy(() =>
  import("@/pages/ApiKeys").then((m) => ({ default: m.ApiKeys }))
);
const ApiKeysDefault = lazy(() =>
  import("@/pages/ApiKeysDefault").then((m) => ({ default: m.ApiKeysDefault }))
);
const AuditTrail = lazy(() =>
  import("@/pages/AuditTrail").then((m) => ({ default: m.AuditTrail }))
);
const AuditTrailMerkle = lazy(() =>
  import("@/pages/AuditTrailMerkle").then((m) => ({
    default: m.AuditTrailMerkle,
  }))
);
const Billing = lazy(() =>
  import("@/pages/Billing").then((m) => ({ default: m.Billing }))
);
const BillingFree = lazy(() =>
  import("@/pages/BillingFree").then((m) => ({ default: m.BillingFree }))
);
const Conversations = lazy(() =>
  import("@/pages/Conversations").then((m) => ({ default: m.Conversations }))
);
const Dashboard = lazy(() =>
  import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard }))
);
const DashboardDefault = lazy(() =>
  import("@/pages/DashboardDefault").then((m) => ({
    default: m.DashboardDefault,
  }))
);
const Limits = lazy(() =>
  import("@/pages/Limits").then((m) => ({ default: m.Limits }))
);
const LimitsDefault = lazy(() =>
  import("@/pages/LimitsDefault").then((m) => ({ default: m.LimitsDefault }))
);
const LimitsFree = lazy(() =>
  import("@/pages/LimitsFree").then((m) => ({ default: m.LimitsFree }))
);
const Upgrade = lazy(() =>
  import("@/pages/Upgrade").then((m) => ({ default: m.Upgrade }))
);
const Models = lazy(() =>
  import("@/pages/Models").then((m) => ({ default: m.Models }))
);
const Policies = lazy(() =>
  import("@/pages/Policies").then((m) => ({ default: m.Policies }))
);
const Requests = lazy(() =>
  import("@/pages/Requests").then((m) => ({ default: m.Requests }))
);
const RequestsFindings = lazy(() =>
  import("@/pages/RequestsFindings").then((m) => ({
    default: m.RequestsFindings,
  }))
);
const ConversationsTrace = lazy(() =>
  import("@/pages/ConversationsTrace").then((m) => ({
    default: m.ConversationsTrace,
  }))
);
const Security = lazy(() =>
  import("@/pages/Security").then((m) => ({ default: m.Security }))
);
const SecurityDefault = lazy(() =>
  import("@/pages/SecurityDefault").then((m) => ({
    default: m.SecurityDefault,
  }))
);
const SecurityFree = lazy(() =>
  import("@/pages/SecurityFree").then((m) => ({ default: m.SecurityFree }))
);
const Settings = lazy(() =>
  import("@/pages/Settings").then((m) => ({ default: m.Settings }))
);
const Team = lazy(() =>
  import("@/pages/Team").then((m) => ({ default: m.Team }))
);
const SignIn = lazy(() =>
  import("@/pages/SignIn").then((m) => ({ default: m.SignIn }))
);
const SignUp = lazy(() =>
  import("@/pages/SignUp").then((m) => ({ default: m.SignUp }))
);
const TokenSavings = lazy(() =>
  import("@/pages/TokenSavings").then((m) => ({ default: m.TokenSavings }))
);
const TokenSavingsFree = lazy(() =>
  import("@/pages/TokenSavingsFree").then((m) => ({
    default: m.TokenSavingsFree,
  }))
);
const DashboardFree = lazy(() =>
  import("@/pages/DashboardFree").then((m) => ({ default: m.DashboardFree }))
);
const RequestsFree = lazy(() =>
  import("@/pages/RequestsFree").then((m) => ({ default: m.RequestsFree }))
);
const ConversationsFree = lazy(() =>
  import("@/pages/ConversationsFree").then((m) => ({
    default: m.ConversationsFree,
  }))
);
const ModelsFree = lazy(() =>
  import("@/pages/ModelsFree").then((m) => ({ default: m.ModelsFree }))
);
const PoliciesFree = lazy(() =>
  import("@/pages/PoliciesFree").then((m) => ({ default: m.PoliciesFree }))
);
const AuditTrailFree = lazy(() =>
  import("@/pages/AuditTrailFree").then((m) => ({ default: m.AuditTrailFree }))
);
const ActivityFree = lazy(() =>
  import("@/pages/ActivityFree").then((m) => ({ default: m.ActivityFree }))
);
const TeamFree = lazy(() =>
  import("@/pages/TeamFree").then((m) => ({ default: m.TeamFree }))
);
const ApiKeysFree = lazy(() =>
  import("@/pages/ApiKeysFree").then((m) => ({ default: m.ApiKeysFree }))
);
const SettingsFree = lazy(() =>
  import("@/pages/SettingsFree").then((m) => ({ default: m.SettingsFree }))
);

/** Outlet context shape — every page reads sidebar state from here via
 *  useOutletContext, so toggling persists across route changes without
 *  per-page state duplication or a Context provider. */
export type LayoutContext = {
  sidebarExpanded: boolean;
  toggleSidebar: () => void;
};

function Layout() {
  // Sidebar state persists across navigation. localStorage so a tab refresh
  // keeps the user's choice.
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    return window.localStorage.getItem("sidebar") !== "collapsed";
  });

  useEffect(() => {
    window.localStorage.setItem(
      "sidebar",
      sidebarExpanded ? "expanded" : "collapsed"
    );
  }, [sidebarExpanded]);

  // Force-collapse at ≤1024px. The user's stored preference is preserved and
  // restored once the viewport widens past 1024.
  const [isNarrow, setIsNarrow] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1024px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => setIsNarrow(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const ctx: LayoutContext = {
    sidebarExpanded: sidebarExpanded && !isNarrow,
    toggleSidebar: () => setSidebarExpanded((v) => !v),
  };

  return <Outlet context={ctx} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          {/* Auth routes — no dashboard chrome (sidebar/topbar). */}
          <Route element={<AuthLayout />}>
            <Route element={<SignIn />} path="/sign-in" />
            <Route element={<SignUp />} path="/sign-up" />
          </Route>
          <Route element={<Layout />}>
            <Route element={<Navigate replace to="/overview" />} index />
            <Route element={<Dashboard />} path="/overview" />
            <Route element={<DashboardDefault />} path="/overview-default" />
            <Route element={<Requests />} path="/requests" />
            <Route
              element={<RequestsFindings />}
              path="/requests-findings/:requestId"
            />
            <Route element={<Conversations />} path="/conversations" />
            <Route
              element={<ConversationsTrace />}
              path="/conversations-trace/:conversationId"
            />
            <Route element={<Models />} path="/models" />
            <Route element={<TokenSavings />} path="/token-savings" />
            <Route element={<TokenSavingsFree />} path="/token-savings-free" />
            <Route element={<Limits />} path="/limits" />
            <Route element={<LimitsDefault />} path="/limits-default" />
            <Route element={<LimitsFree />} path="/limits-free" />
            <Route element={<Upgrade />} path="/upgrade" />
            <Route element={<Security />} path="/security" />
            <Route element={<SecurityDefault />} path="/events-default" />
            <Route element={<SecurityFree />} path="/security-free" />
            <Route element={<Policies />} path="/policies" />
            <Route element={<AuditTrail />} path="/audit-trail" />
            <Route element={<AuditTrailMerkle />} path="/audit-trail-merkle" />
            <Route element={<Activity />} path="/activity" />
            <Route element={<Team />} path="/team" />
            <Route element={<Settings />} path="/settings" />
            <Route element={<ApiKeys />} path="/api-keys" />
            <Route element={<ApiKeysDefault />} path="/api-keys-default" />
            <Route element={<Billing />} path="/billing" />
            <Route element={<BillingFree />} path="/billing-free" />
            {/* Free-tier twins — reached via the PRO/Free workspace switcher. */}
            <Route element={<DashboardFree />} path="/overview-free" />
            <Route element={<RequestsFree />} path="/requests-free" />
            <Route element={<ConversationsFree />} path="/conversations-free" />
            <Route element={<ModelsFree />} path="/models-free" />
            <Route element={<PoliciesFree />} path="/policies-free" />
            <Route element={<AuditTrailFree />} path="/audit-trail-free" />
            <Route element={<ActivityFree />} path="/activity-free" />
            <Route element={<TeamFree />} path="/team-free" />
            <Route element={<ApiKeysFree />} path="/api-keys-free" />
            <Route element={<SettingsFree />} path="/settings-free" />
            {/* Unknown routes fall back to Requests. */}
            <Route element={<Navigate replace to="/overview" />} path="*" />
          </Route>
        </Routes>
      </Suspense>
      <Toaster position="bottom-right" />
    </BrowserRouter>
  );
}
