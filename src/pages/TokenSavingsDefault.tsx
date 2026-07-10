import { BarChart2, Layers, Zap } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { KpiRail } from "@/components/ui/kpi-rail";
import { PageTitle } from "@/components/ui/page-title";
import { SectionTitle } from "@/components/ui/section-title";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { SavingsOptionsSection } from "@/pages/TokenSavings";

export function TokenSavingsDefault() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  return (
    <DashboardChrome
      activeNavId="token-savings"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      {/* Content stays fluid up to xl, then caps tighter so the cards don't
          stretch across ultrawide displays. */}
      <div className="flex w-full flex-col gap-6 xl:max-w-5xl">
        <div className="flex flex-col gap-2">
          <PageTitle>Token Savings</PageTitle>
          <p className="type-copy-16 m-0 max-w-1/2 text-pretty text-muted-foreground tracking-snug">
            Cache, compress and deduplicate to spend less per request.
          </p>
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
                No savings yet
              </span>
            </div>
            <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 bg-card p-6">
              <div
                aria-hidden
                className="flex size-12 items-center justify-center rounded-md bg-muted"
              >
                <Layers
                  className="size-5 text-muted-foreground"
                  strokeWidth={1.75}
                />
              </div>
              <span className="type-copy-14 text-muted-foreground">
                No caching yet
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
                No compression yet
              </span>
            </div>
          </KpiRail>
        </div>

        <SavingsOptionsSection plan="free" />
      </div>
    </DashboardChrome>
  );
}
