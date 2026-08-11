import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { PageTitle } from "@/components/ui/page-title";
import { SectionTitle } from "@/components/ui/section-title";
import { SegmentedPill } from "@/components/ui/segmented-pill";
import type { CustomRange, RangeKey } from "./requests/types";

// Re-export for external importers of `@/pages/Requests`.
export type { RequestRow } from "./requests/types";

import { DashboardChrome } from "@/layouts/DashboardChrome";
import { RANGE_OPTIONS } from "./requests/data";
import { HeroMetricCard } from "./requests/HeroMetric";
import { RequestsTableSection } from "./requests/RequestsTable";
import { rangeStore } from "./requests/range-store";

/* CMP-013 — Requests (Observability) */

export function Requests() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  // Range state lifted from RequestsTableSection so PageHeader can also
  // drive it (the data selector + Custom range button live in the top-
  // right page-header chrome now). rangeStore stays the single source of
  // truth for HeroMetricCard and other useRange()/useCustomRange()
  // subscribers — the effects below keep it in lockstep.
  // Defaults to `all` on load — the intended landing state for every
  // page's range selector (matches the Events page).
  const [range, setRange] = useState<RangeKey>("all");
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);

  // Hydrate the store with the initial state once on mount. After that
  // the handlers below keep the store in lockstep — no effect-as-event.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only store hydration; later changes flow through the handlers, not this effect
  useEffect(() => {
    rangeStore.set(range);
    rangeStore.setCustom(customRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRangeChange = (next: RangeKey) => {
    setRange(next);
    setCustomRange(null);
    rangeStore.set(next);
    rangeStore.setCustom(null);
  };
  const handleCustomRangeChange = (next: CustomRange | null) => {
    if (next) {
      setCustomRange(next);
      setRange("custom");
      rangeStore.set("custom");
      rangeStore.setCustom(next);
    } else {
      setCustomRange(null);
      setRange("all");
      rangeStore.set("all");
      rangeStore.setCustom(null);
    }
  };

  return (
    <DashboardChrome
      activeNavId="requests"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <PageHeader />
      {/* Overview label + range controls group with the hero card
              (gap-4 internal) rather than floating equidistant between
              sections — the chrome content pane spaces its direct children
              at gap-6, so wrapping the bar + card in one tighter-gapped
              child reads the "Overview" heading as the label FOR the card it
              sits above. Mirrors AuditTrail's OverviewBar + KPI rail. */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionTitle>Overview</SectionTitle>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedPill
              onValueChange={(next) => handleRangeChange(next as RangeKey)}
              options={RANGE_OPTIONS}
              size="sm"
              // Empty string when a custom range is active so no preset
              // reads as selected — see segmented-pill internal notes for
              // why empty string deselects all items.
              value={range === "custom" ? "" : range}
            />
            <DateRangePicker
              onChange={handleCustomRangeChange}
              size="sm"
              value={customRange}
            />
          </div>
        </div>
        <HeroMetricCard />
      </div>
      <RequestsTableSection customRange={customRange} range={range} />
    </DashboardChrome>
  );
}

/* ─── Page header (title + range selector + custom date) ──────────────── */

function PageHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
        {/* h2 — see CMP012 PageHeader note. */}
        <PageTitle>Messages</PageTitle>
        <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
          Every model call across your stack, inspected for injection, PII, and
          credentials before it reaches the model.
        </p>
      </div>
    </div>
  );
}
