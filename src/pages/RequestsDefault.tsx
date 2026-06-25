import { ArrowLeftRight, BarChart2 } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { SectionTitle } from "@/components/ui/section-title";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { DashboardChrome } from "@/layouts/DashboardChrome";

export function RequestsDefault() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  return (
    <DashboardChrome
      activeNavId="requests"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-1/2 flex-col gap-2">
          <PageTitle>Requests</PageTitle>
          <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
            Every model call across your stack, inspected for injection, PII,
            and credentials before it reaches the model.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <SectionTitle>Overview</SectionTitle>
        <Card>
          <CardHeader>
            <CardTitle>Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div
                aria-hidden
                className="flex size-12 items-center justify-center rounded-md bg-muted"
              >
                <BarChart2
                  className="size-5 text-neutral-700"
                  strokeWidth={1.75}
                />
              </div>
              <span className="type-copy-14 text-muted-foreground">
                No requests yet
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-2 flex flex-col gap-4">
        <SectionTitle>Recent requests</SectionTitle>
        <Card density="flush">
          <TableEmptyState
            body="Individual API requests routed through the gateway will appear here."
            icon={
              <div
                aria-hidden
                className="flex size-12 items-center justify-center rounded-md bg-muted"
              >
                <ArrowLeftRight
                  className="size-5 text-neutral-700"
                  strokeWidth={1.75}
                />
              </div>
            }
            title="No requests"
          />
        </Card>
      </div>
    </DashboardChrome>
  );
}
