import { TriangleAlert } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { PageTitle } from "@/components/ui/page-title";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { ProUpgradeCard } from "@/pages/pro-upgrade-card";

export function SecurityFree() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();
  return (
    <DashboardChrome
      activeNavId="security-events"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <PageHeader />
      <ProUpgradeCard
        body="Security scanning is a Pro feature. Upgrade in Billing to gate prompt injection, redact PII and credentials, and inspect every request inline."
        icon={TriangleAlert}
      />
    </DashboardChrome>
  );
}

/* ─── Page header ───────────────────────────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex max-w-1/2 flex-col gap-2">
      <PageTitle>Security events</PageTitle>
      <p className="m-0 text-pretty font-sans text-base text-neutral-500 tracking-snug">
        Every injection, PII, and credential event your policies caught,
        fingerprinted to Constellation's Digital Evidence layer. Blocked,
        flagged, or redacted.
      </p>
    </div>
  );
}
