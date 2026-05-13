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
import { Billing } from '@/pages/Billing';
import { Conversations } from '@/pages/Conversations';
import { Guardrails } from '@/pages/Guardrails';
import { Models } from '@/pages/Models';
import { Requests } from '@/pages/Requests';
import { Security } from '@/pages/Security';
import { Settings } from '@/pages/Settings';
import { Team } from '@/pages/Team';
import { TokenSavings } from '@/pages/TokenSavings';

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
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/requests" replace />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/models" element={<Models />} />
          <Route path="/token-savings" element={<TokenSavings />} />
          <Route path="/guardrails" element={<Guardrails />} />
          <Route path="/security" element={<Security />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/team" element={<Team />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/api-keys" element={<ApiKeys />} />
          <Route path="/billing" element={<Billing />} />
          {/* Unknown routes fall back to Requests. */}
          <Route path="*" element={<Navigate to="/requests" replace />} />
        </Route>
      </Routes>
      <Toaster position="bottom-right" />
    </BrowserRouter>
  );
}
