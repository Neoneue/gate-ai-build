import { ShieldCheck } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { SectionTitle } from "@/components/ui/section-title";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { DashboardChrome } from "@/layouts/DashboardChrome";

export function SecurityDefault() {
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-full flex-col gap-2 xl:max-w-1/2">
          <PageTitle>Security events</PageTitle>
          <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
            Every injection, PII, and credential event your policies caught,
            fingerprinted to Constellation's Digital Evidence layer. Blocked,
            flagged, or redacted.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <SectionTitle>Overview</SectionTitle>
        <Card>
          <CardHeader>
            <CardTitle>Total events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div
                aria-hidden
                className="flex size-12 items-center justify-center rounded-md bg-muted"
              >
                <ShieldCheck
                  className="size-5 text-muted-foreground"
                  strokeWidth={1.75}
                />
              </div>
              <span className="type-copy-14 text-muted-foreground">
                No events yet
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-2 flex flex-col gap-4">
        <SectionTitle>Recent events</SectionTitle>
        <Card density="flush">
          <TableEmptyState
            body="Prompt injection, PII, and credential leak events flagged by your policies will appear here."
            icon={
              <div
                aria-hidden
                className="flex size-12 items-center justify-center rounded-md bg-muted"
              >
                <ShieldCheck
                  className="size-5 text-muted-foreground"
                  strokeWidth={1.75}
                />
              </div>
            }
            title="No security events"
          />
        </Card>
      </div>
    </DashboardChrome>
  );
}
