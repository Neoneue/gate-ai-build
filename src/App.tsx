import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Activity } from '@/pages/Activity';
import { ApiKeys } from '@/pages/ApiKeys';
import { AuditTrail } from '@/pages/AuditTrail';
import { AuditTrailMerkle } from '@/pages/AuditTrailMerkle';
import { Billing } from '@/pages/Billing';
import { Conversations } from '@/pages/Conversations';
import { Dashboard } from '@/pages/Dashboard';
import { DashboardDefault } from '@/pages/DashboardDefault';
import { Limits } from '@/pages/Limits';
import { LimitsDefault } from '@/pages/LimitsDefault';
import { LimitsFree } from '@/pages/LimitsFree';
import { Upgrade } from '@/pages/Upgrade';
import { Models } from '@/pages/Models';
import { Policies } from '@/pages/Policies';
import { Requests } from '@/pages/Requests';
import { RequestsFindings } from '@/pages/RequestsFindings';
import { Security } from '@/pages/Security';
import { SecurityDefault } from '@/pages/SecurityDefault';
import { SecurityFree } from '@/pages/SecurityFree';
import { Settings } from '@/pages/Settings';
import { Team } from '@/pages/Team';
import { AuthLayout } from '@/layouts/AuthLayout';
import { SignIn } from '@/pages/SignIn';
import { SignUp } from '@/pages/SignUp';
import { TokenSavings } from '@/pages/TokenSavings';
import { TokenSavingsFree } from '@/pages/TokenSavingsFree';

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
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('sidebar') !== 'collapsed';
  });

  useEffect(() => {
    window.localStorage.setItem(
      'sidebar',
      sidebarExpanded ? 'expanded' : 'collapsed',
    );
  }, [sidebarExpanded]);

  const ctx: LayoutContext = {
    sidebarExpanded,
    toggleSidebar: () => setSidebarExpanded((v) => !v),
  };

  return <Outlet context={ctx} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes — no dashboard chrome (sidebar/topbar). */}
        <Route element={<AuthLayout />}>
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
        </Route>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Dashboard />} />
          <Route path="/overview-default" element={<DashboardDefault />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/requests-findings/:requestId" element={<RequestsFindings />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/models" element={<Models />} />
          <Route path="/token-savings" element={<TokenSavings />} />
          <Route path="/token-savings-free" element={<TokenSavingsFree />} />
          <Route path="/limits" element={<Limits />} />
          <Route path="/limits-default" element={<LimitsDefault />} />
          <Route path="/limits-free" element={<LimitsFree />} />
  <Route path="/upgrade" element={<Upgrade />} />
          <Route path="/security" element={<Security />} />
          <Route path="/events-default" element={<SecurityDefault />} />
  <Route path="/security-free" element={<SecurityFree />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/audit-trail" element={<AuditTrail />} />
   <Route path="/audit-trail-merkle" element={<AuditTrailMerkle />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/team" element={<Team />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/api-keys" element={<ApiKeys />} />
          <Route path="/billing" element={<Billing />} />
          {/* Unknown routes fall back to Requests. */}
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Route>
      </Routes>
      <Toaster position="bottom-right" />
    </BrowserRouter>
  );
}
