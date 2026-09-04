import { useNavigate, useOutletContext } from "react-router-dom";
import { Callout } from "@/components/ui/callout";
import { PageTitle } from "@/components/ui/page-title";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { resolveEffectiveSettings } from "@/pages/teams/effective-settings";
import { TeamPoliciesPane } from "@/pages/teams/PoliciesPane";
import {
  teamsStore,
  useCurrentUserTeam,
  useOrgSettings,
  useUserSettings,
} from "@/pages/teams/teams-store";

/* ─────────────────────────────────────────────────────────────────────────
 * PoliciesEnterprise (route: /policies-enterprise, sidebar: "Policies")
 *
 * The Enterprise twin of Policies.tsx is USER-level: "My settings" (call
 * 2026-09-03, Joao: manage sections read as personal configuration). The
 * cards are the same TeamPoliciesPane the team and org Settings tabs render;
 * the values and the lock come from ONE resolver (effective-settings.ts), so
 * an org or team lock set on the Teams pages shows here as a banner plus
 * disabled inputs (AG-624 / PRD 8.5: teams see forced settings as locked).
 * ───────────────────────────────────────────────────────────────────────── */

export function PoliciesEnterprise() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();
  const user = useUserSettings();
  const team = useCurrentUserTeam();
  const org = useOrgSettings();
  const effective = resolveEffectiveSettings(user, team, org);

  return (
    <DashboardChrome
      activeNavId="policies"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      <div className="flex w-full @5xl:max-w-5xl flex-col @2xl:gap-6 gap-8">
        <div className="flex max-w-2xl flex-col gap-2">
          <PageTitle>My policies</PageTitle>
          <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
            Your policies for the three inline scans on every routed request.
            Settings locked by an admin apply to you as set.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          {effective.lockedBy ? <Callout>{effective.lockedBy}</Callout> : null}
          <TeamPoliciesPane
            locked={effective.locked}
            onChange={(policies) => teamsStore.setUserSettings({ policies })}
            policies={effective.policies}
          />
        </div>
      </div>
    </DashboardChrome>
  );
}
