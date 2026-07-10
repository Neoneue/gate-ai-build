import { ArrowLeftRight, BarChart2, Key, Zap } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { KpiRail } from "@/components/ui/kpi-rail";
import { PageTitle } from "@/components/ui/page-title";
import { SectionTitle } from "@/components/ui/section-title";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { DashboardChrome } from "@/layouts/DashboardChrome";

export function ActivityDefault() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  return (
    <DashboardChrome
      activeNavId="activity"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-1/2 flex-col gap-2">
          <PageTitle>Activity</PageTitle>
          <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
            Cost, request volume, and token usage by model, API key, and team
            member.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <SectionTitle>Overview</SectionTitle>
        <KpiRail columns={3}>
          <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 bg-card p-6">
            <div
              aria-hidden
              className="flex size-12 items-center justify-center rounded-md bg-muted"
            >
              <BarChart2
                className="size-5 text-muted-foreground"
                strokeWidth={1.75}
              />
            </div>
            <span className="type-copy-14 text-muted-foreground">
              No spend yet
            </span>
          </div>
          <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 bg-card p-6">
            <div
              aria-hidden
              className="flex size-12 items-center justify-center rounded-md bg-muted"
            >
              <ArrowLeftRight
                className="size-5 text-muted-foreground"
                strokeWidth={1.75}
              />
            </div>
            <span className="type-copy-14 text-muted-foreground">
              No messages yet
            </span>
          </div>
          <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 bg-card p-6">
            <div
              aria-hidden
              className="flex size-12 items-center justify-center rounded-md bg-muted"
            >
              <Zap
                className="size-5 text-muted-foreground"
                strokeWidth={1.75}
              />
            </div>
            <span className="type-copy-14 text-muted-foreground">
              No tokens yet
            </span>
          </div>
        </KpiRail>

        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div
                aria-hidden
                className="flex size-12 items-center justify-center rounded-md bg-muted"
              >
                <Zap
                  className="size-5 text-muted-foreground"
                  strokeWidth={1.75}
                />
              </div>
              <span className="type-copy-14 text-muted-foreground">
                No tokens used
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-2 flex flex-col gap-4">
        <SectionTitle>Recent key usage</SectionTitle>
        <Card density="flush">
          <TableEmptyState
            body="Per-key usage across messages, tokens, and spend will appear here as your workspace routes traffic."
            icon={
              <div
                aria-hidden
                className="flex size-12 items-center justify-center rounded-md bg-muted"
              >
                <Key
                  className="size-5 text-muted-foreground"
                  strokeWidth={1.75}
                />
              </div>
            }
            title="No usage yet"
          />
        </Card>
      </div>
    </DashboardChrome>
  );
}
