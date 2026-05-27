import { useNavigate, useOutletContext } from 'react-router-dom';
import { PageTitle } from '@/components/ui/page-title';
import { DashboardChrome } from '@/layouts/DashboardChrome';
import { HeroCard } from '@/pages/SecurityDefault';

// Pro-upsell default for the Token Savings surface, mirroring SecurityDefault.
// Reuses SecurityDefault's HeroCard verbatim as a placeholder until the
// Token Savings-specific hero content is authored.
export function TokenSavingsDefault() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  return (
    <DashboardChrome
      activeNavId="token-savings"
      sidebarExpanded={sidebarExpanded}
      onToggleSidebar={toggleSidebar}
      onNavigate={(path: string) => navigate(path)}
    >
      <div className="flex flex-col gap-2 max-w-1/2">
        <PageTitle>Token Savings</PageTitle>
        <p className="font-sans text-neutral-500 text-base tracking-tight text-pretty m-0">
          Cache, compress and deduplicate to spend less per request.
        </p>
      </div>
      <HeroCard />
    </DashboardChrome>
  );
}
