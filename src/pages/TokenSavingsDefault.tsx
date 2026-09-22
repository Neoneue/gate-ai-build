import { BarChart2, Layers, type LucideIcon, Zap } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { KpiRail } from "@/components/ui/kpi-rail";
import { PageTitle } from "@/components/ui/page-title";
import { SectionTitle } from "@/components/ui/section-title";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { SavingsOptionsSection } from "@/pages/TokenSavings";
import { SummaryCard } from "@/pages/token-savings/SummaryCard";
import { summaryFor } from "@/pages/token-savings-summary";

/** The Default workspace has never seen traffic, so its rail carries three
 *  placeholders instead of tiles. Padding is `p-4`, the same 16px every KPI
 *  tile on the site takes (`CompactKpi`, `ModelKpiTile`), and the height is
 *  whatever the content needs — the rail's own tracks keep the three even, so
 *  a hand-picked minimum only pushed this rail out of line with the Free, Pro
 *  and Enterprise twins. */
function EmptyKpiTile({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 bg-card p-4">
      <div
        aria-hidden
        className="flex size-12 items-center justify-center rounded-md bg-muted"
      >
        <Icon
          aria-hidden
          className="size-5 text-muted-foreground"
          strokeWidth={1.75}
        />
      </div>
      <span className="type-copy-14 text-muted-foreground">{label}</span>
    </div>
  );
}

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
      {/* Content stays fluid, then caps so the cards don't stretch across
          ultrawide displays. CONTAINER query, not viewport: the Ask AI
          panel narrows this column without narrowing the window. `@5xl`
          (1024px inline-size) is the same number as the `max-w-5xl` cap, so
          the class is a no-op until the column is wide enough to bind. */}
      <div className="flex w-full @5xl:max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <PageTitle>Token savings</PageTitle>
          <p className="type-copy-18 m-0 @4xl:max-w-1/2 max-w-full text-pretty text-muted-foreground">
            Cache, compress and deduplicate to spend less per request.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <SectionTitle as="h2">Overview</SectionTitle>
          <KpiRail columns={3}>
            <EmptyKpiTile icon={BarChart2} label="No savings yet" />
            <EmptyKpiTile icon={Layers} label="No caching yet" />
            <EmptyKpiTile icon={Zap} label="No compression yet" />
          </KpiRail>
        </div>

        {/* Nothing has passed through this workspace, so every window is a
            no-traffic window: the card explains instead of claiming zeros. */}
        <SummaryCard
          model={summaryFor("all", null, {
            plan: "free",
            hasTraffic: false,
          })}
        />

        <SavingsOptionsSection plan="free" />
      </div>
    </DashboardChrome>
  );
}
