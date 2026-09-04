import { useState } from "react";
import {
  useNavigate,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { Callout } from "@/components/ui/callout";
import { PageTitle } from "@/components/ui/page-title";
import { SectionTitle } from "@/components/ui/section-title";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import type { CustomRange, Range } from "@/lib/range";
import { OverviewSection } from "@/pages/TokenSavings";
import { resolveEffectiveSettings } from "@/pages/teams/effective-settings";
import { TeamSavingsOptionCards } from "@/pages/teams/TokenSavingsPane";
import {
  teamsStore,
  useCurrentUserTeam,
  useOrgSettings,
  useUserSettings,
} from "@/pages/teams/teams-store";

/* ─────────────────────────────────────────────────────────────────────────
 * TokenSavingsEnterprise (route: /token-savings-enterprise)
 *
 * USER-level twin of TokenSavings.tsx: the org KPI rail stays (a reading),
 * and the Compression + Caching controls below are "My settings" (call
 * 2026-09-03). Values + lock from ONE resolver (effective-settings.ts): an
 * org or team lock renders a banner and disabled inputs (AG-624 / PRD 8.5).
 * ───────────────────────────────────────────────────────────────────────── */

export function TokenSavingsEnterprise() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();
  const [searchParams] = useSearchParams();
  const [range, setRange] = useState<Range>(() => {
    const r = searchParams.get("range");
    return r === "24h" || r === "7d" || r === "30d" || r === "all" ? r : "all";
  });
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);
  const user = useUserSettings();
  const team = useCurrentUserTeam();
  const org = useOrgSettings();
  const effective = resolveEffectiveSettings(user, team, org);

  return (
    <DashboardChrome
      activeNavId="token-savings"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <div className="flex w-full @5xl:max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <PageTitle>My token savings</PageTitle>
          <p className="type-copy-16 m-0 @4xl:max-w-1/2 max-w-full text-pretty text-muted-foreground tracking-snug">
            Your token savings: cache, compress and deduplicate to spend less
            per request. Settings locked by an admin apply to you as set.
          </p>
        </div>
        <OverviewSection
          customRange={customRange}
          onCustomRangeChange={(r) => {
            if (r) {
              setCustomRange(r);
              setRange("custom");
            } else {
              setCustomRange(null);
              setRange("all");
            }
          }}
          onRangeChange={(r) => {
            setRange(r);
            setCustomRange(null);
          }}
          range={range}
        />
        <div className="mt-2 flex flex-col gap-4">
          <SectionTitle>Savings options</SectionTitle>
          {effective.lockedBy ? <Callout>{effective.lockedBy}</Callout> : null}
          <TeamSavingsOptionCards
            locked={effective.locked}
            onChange={(savings) => teamsStore.setUserSettings({ savings })}
            savings={effective.savings}
          />
        </div>
      </div>
    </DashboardChrome>
  );
}
