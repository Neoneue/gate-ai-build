import { Activity, BarChart2, MessageSquare } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { KpiRail } from "@/components/ui/kpi-rail";
import { PageTitle } from "@/components/ui/page-title";
import { SectionTitle } from "@/components/ui/section-title";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { DashboardChrome } from "@/layouts/DashboardChrome";

export function ConversationsDefault() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  return (
    <DashboardChrome
      activeNavId="conversations"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-1/2 flex-col gap-2">
          <PageTitle>Conversations</PageTitle>
          <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
            A conversation is a chain of messages that share session context:
            agent runs, multi-turn chats, tool-calling loops. Click any row to
            see its message thread.
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
              <MessageSquare
                className="size-5 text-muted-foreground"
                strokeWidth={1.75}
              />
            </div>
            <span className="type-copy-14 text-muted-foreground">
              No conversations yet
            </span>
          </div>
          <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 bg-card p-6">
            <div
              aria-hidden
              className="flex size-12 items-center justify-center rounded-md bg-muted"
            >
              <Activity
                className="size-5 text-muted-foreground"
                strokeWidth={1.75}
              />
            </div>
            <span className="type-copy-14 text-muted-foreground">
              No turns yet
            </span>
          </div>
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
              No cost yet
            </span>
          </div>
        </KpiRail>
      </div>

      <div className="mt-2 flex flex-col gap-4">
        <SectionTitle>Recent conversations</SectionTitle>
        <Card density="flush">
          <TableEmptyState
            body="Multi-turn conversations grouped by key and model will appear here as your workspace routes traffic."
            icon={
              <div
                aria-hidden
                className="flex size-12 items-center justify-center rounded-md bg-muted"
              >
                <MessageSquare
                  className="size-5 text-muted-foreground"
                  strokeWidth={1.75}
                />
              </div>
            }
            title="No conversations"
          />
        </Card>
      </div>
    </DashboardChrome>
  );
}
