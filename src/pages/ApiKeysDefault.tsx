import { useNavigate, useOutletContext } from 'react-router-dom';
import { PageTitle } from '@/components/ui/page-title';
import { DashboardChrome } from '@/layouts/DashboardChrome';
import { HeroCard } from '@/pages/DashboardDefault';

/* ─────────────────────────────────────────────────────────────────────────
 * API Keys — default variant (route: /api-keys-default, sidebar: "API Keys")
 *
 * Stripped-down version of the API Keys page: the keys table, the Create-key
 * flow, and the "Using your key" section are removed. In their place we drop
 * the Overview "Get Started" hero card (shared <HeroCard> from
 * DashboardDefault) so the page leads with onboarding.
 * ───────────────────────────────────────────────────────────────────────── */

export function ApiKeysDefault() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  return (
    <DashboardChrome
      activeNavId="api-keys"
      sidebarExpanded={sidebarExpanded}
      onToggleSidebar={toggleSidebar}
      onNavigate={(path: string) => navigate(path)}
    >
      <PageHeader />
      <HeroCard />
    </DashboardChrome>
  );
}

function PageHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-2 max-w-1/2">
        <PageTitle>API Keys</PageTitle>
        <p className="font-sans text-neutral-500 text-base tracking-tight text-pretty m-0">
          Keys authenticate every request through the gateway. Rotate on a schedule; scope after creation.
        </p>
      </div>
    </div>
  );
}
