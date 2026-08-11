import { BellRing } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { PageTitle } from "@/components/ui/page-title";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { ProUpgradeCard } from "@/pages/pro-upgrade-card";

/** Free-tier twin of Alerts — the feature is Pro-only, so the page keeps the
 *  header and swaps the empty state for the shared Pro upsell (same treatment
 *  and same `/billing` destination as the other gated `-free` pages). */
export function AlertsFree() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  return (
    <DashboardChrome
      activeNavId="alerts"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <div className="flex w-full @5xl:max-w-5xl flex-col gap-6">
        <PageHeader />
        <ProUpgradeCard
          body="Alerts are a Pro feature. Upgrade to our Pro plan to hear about a spend spike or a blocked injection when it happens, not when you next open the dashboard."
          icon={BellRing}
        />
      </div>
    </DashboardChrome>
  );
}

/* ─── Page header ───────────────────────────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
        <PageTitle>Alerts</PageTitle>
        <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
          Alert rules watch spend, tokens, errors, latency, and security events,
          then notify you by email, Slack, or webhook the moment a threshold is
          crossed.
        </p>
      </div>
    </div>
  );
}
