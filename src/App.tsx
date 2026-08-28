import { lazy, Suspense, useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AskAiThreadProvider } from "@/hooks/ask-ai-thread-provider";
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
const Notifications = lazy(() =>
  import("@/pages/Notifications").then((m) => ({ default: m.Notifications }))
);
const NotificationsDefault = lazy(() =>
  import("@/pages/NotificationsDefault").then((m) => ({
    default: m.NotificationsDefault,
  }))
);
const NotificationsFree = lazy(() =>
  import("@/pages/NotificationsFree").then((m) => ({
    default: m.NotificationsFree,
  }))
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
const Teams = lazy(() =>
  import("@/pages/Teams").then((m) => ({ default: m.Teams }))
);
const TeamDetail = lazy(() =>
  import("@/pages/TeamDetail").then((m) => ({ default: m.TeamDetail }))
);
const TeamsDefault = lazy(() =>
  import("@/pages/TeamsDefault").then((m) => ({ default: m.TeamsDefault }))
);
const TeamDetailDefault = lazy(() =>
  import("@/pages/TeamDetailDefault").then((m) => ({
    default: m.TeamDetailDefault,
  }))
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
const RequestsDefault = lazy(() =>
  import("@/pages/RequestsDefault").then((m) => ({
    default: m.RequestsDefault,
  }))
);
const ConversationsDefault = lazy(() =>
  import("@/pages/ConversationsDefault").then((m) => ({
    default: m.ConversationsDefault,
  }))
);
const ModelsDefault = lazy(() =>
  import("@/pages/ModelsDefault").then((m) => ({ default: m.ModelsDefault }))
);
const TokenSavingsDefault = lazy(() =>
  import("@/pages/TokenSavingsDefault").then((m) => ({
    default: m.TokenSavingsDefault,
  }))
);
const PoliciesDefault = lazy(() =>
  import("@/pages/PoliciesDefault").then((m) => ({
    default: m.PoliciesDefault,
  }))
);
const AuditTrailDefault = lazy(() =>
  import("@/pages/AuditTrailDefault").then((m) => ({
    default: m.AuditTrailDefault,
  }))
);
const ActivityDefault = lazy(() =>
  import("@/pages/ActivityDefault").then((m) => ({
    default: m.ActivityDefault,
  }))
);
const TeamDefault = lazy(() =>
  import("@/pages/TeamDefault").then((m) => ({ default: m.TeamDefault }))
);
const BillingDefault = lazy(() =>
  import("@/pages/BillingDefault").then((m) => ({ default: m.BillingDefault }))
);
const SettingsDefault = lazy(() =>
  import("@/pages/SettingsDefault").then((m) => ({
    default: m.SettingsDefault,
  }))
);
/* Overview onboarding subflows — dedicated `-default` subpages reached from
 * the Overview get-started card. Each keeps the default-tier chrome and
 * breadcrumbs back through the concept's multi-level flow. */
const SetupConnect = lazy(() =>
  import("@/pages/SetupConnect").then((m) => ({ default: m.SetupConnect }))
);
const SetupGateConnect = lazy(() =>
  import("@/pages/SetupGateConnect").then((m) => ({
    default: m.SetupGateConnect,
  }))
);
const SetupManual = lazy(() =>
  import("@/pages/SetupManual").then((m) => ({ default: m.SetupManual }))
);
const SetupCredits = lazy(() =>
  import("@/pages/SetupCredits").then((m) => ({ default: m.SetupCredits }))
);
const SetupModels = lazy(() =>
  import("@/pages/SetupModels").then((m) => ({ default: m.SetupModels }))
);

/** Outlet context shape — every page reads sidebar state from here via
 *  useOutletContext, so toggling persists across route changes without
 *  per-page state duplication or a Context provider. */
export type LayoutContext = {
  sidebarExpanded: boolean;
  toggleSidebar: () => void;
  askAiOpen: boolean;
  setAskAiOpen: (open: boolean | ((v: boolean) => boolean)) => void;
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

  // Ask AI panel state — hoisted here (not inside DashboardChrome, which
  // remounts per page) so the panel stays open across navigation. Deliberately
  // NOT persisted, unlike the sidebar: every page load starts CLOSED, the user
  // opens it once, and it then stays open for the rest of the session until
  // they close it.
  const [askAiOpen, setAskAiOpen] = useState(false);

  const ctx: LayoutContext = {
    sidebarExpanded,
    toggleSidebar: () => setSidebarExpanded((v) => !v),
    askAiOpen,
    setAskAiOpen,
  };

  return (
    <AskAiThreadProvider>
      <Outlet context={ctx} />
    </AskAiThreadProvider>
  );
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
            {/* Overview onboarding subflows (multi-level back stack). */}
            <Route element={<SetupConnect />} path="/setup-connect-default" />
            <Route
              element={<SetupGateConnect />}
              path="/setup-gate-connect-default"
            />
            <Route element={<SetupManual />} path="/setup-manual-default" />
            <Route element={<SetupCredits />} path="/setup-credits-default" />
            <Route element={<SetupModels />} path="/setup-models-default" />
            <Route element={<Requests />} path="/messages" />
            <Route
              element={<RequestsFindings />}
              path="/messages-findings/:requestId"
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
            <Route element={<SecurityDefault />} path="/security-default" />
            <Route element={<SecurityFree />} path="/security-free" />
            <Route element={<Policies />} path="/policies" />
            <Route element={<AuditTrail />} path="/audit-trail" />
            <Route element={<Activity />} path="/activity" />
            <Route element={<Team />} path="/team" />
            <Route element={<Teams />} path="/teams" />
            <Route element={<TeamDetail />} path="/teams/:teamId" />
            <Route element={<Notifications />} path="/notifications" />
            <Route
              element={<Settings showCancelPlan={false} />}
              path="/settings"
            />
            <Route element={<ApiKeys />} path="/api-keys" />
            <Route element={<ApiKeysDefault />} path="/api-keys-default" />
            <Route element={<Billing />} path="/billing" />
            <Route element={<BillingFree />} path="/billing-free" />
            {/* Default-workspace twins — reached via the workspace switcher. */}
            <Route element={<RequestsDefault />} path="/messages-default" />
            <Route
              element={<ConversationsDefault />}
              path="/conversations-default"
            />
            <Route element={<ModelsDefault />} path="/models-default" />
            <Route
              element={<TokenSavingsDefault />}
              path="/token-savings-default"
            />
            <Route element={<PoliciesDefault />} path="/policies-default" />
            <Route
              element={<AuditTrailDefault />}
              path="/audit-trail-default"
            />
            <Route element={<ActivityDefault />} path="/activity-default" />
            <Route element={<TeamDefault />} path="/team-default" />
            <Route element={<TeamsDefault />} path="/teams-default" />
            <Route
              element={<TeamDetailDefault />}
              path="/teams-default/:teamId"
            />
            <Route element={<BillingDefault />} path="/billing-default" />
            <Route
              element={<NotificationsDefault />}
              path="/notifications-default"
            />
            <Route element={<SettingsDefault />} path="/settings-default" />
            {/* Free-tier twins — reached via the workspace switcher. */}
            <Route element={<DashboardFree />} path="/overview-free" />
            <Route element={<RequestsFree />} path="/messages-free" />
            <Route element={<ConversationsFree />} path="/conversations-free" />
            <Route element={<ModelsFree />} path="/models-free" />
            <Route element={<PoliciesFree />} path="/policies-free" />
            <Route element={<AuditTrailFree />} path="/audit-trail-free" />
            <Route element={<ActivityFree />} path="/activity-free" />
            <Route element={<TeamFree />} path="/team-free" />
            <Route element={<ApiKeysFree />} path="/api-keys-free" />
            <Route element={<NotificationsFree />} path="/notifications-free" />
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
