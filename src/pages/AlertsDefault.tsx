import { BellRing } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { EmptyState } from "@/components/ui/empty-state";
import { PageTitle } from "@/components/ui/page-title";
import { DashboardChrome } from "@/layouts/DashboardChrome";

/** Default-workspace twin of Alerts — a new workspace with nothing configured
 *  yet. Same composition as the Pro page (no upsell; the default tier is not
 *  gated), kept as its own file so it can diverge when rules ship. */
export function AlertsDefault() {
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
      <div className="flex w-full flex-col gap-6 xl:max-w-5xl">
        <PageHeader />
        <AlertRulesSection />
      </div>
    </DashboardChrome>
  );
}

/* ─── Page header ───────────────────────────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex max-w-full flex-col gap-2 xl:max-w-1/2">
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

/* ─── Alert rules empty state ───────────────────────────────────────── */

function AlertRulesSection() {
  return (
    <EmptyState
      body="A rule pairs one metric and threshold with a notification channel, so a spend spike or a blocked injection reaches you without anyone watching the dashboard."
      icon={
        <div
          aria-hidden
          className="flex size-12 items-center justify-center rounded-full bg-muted"
        >
          <BellRing className="size-5 text-muted-foreground" />
        </div>
      }
      title="No alert rules yet"
    />
  );
}
