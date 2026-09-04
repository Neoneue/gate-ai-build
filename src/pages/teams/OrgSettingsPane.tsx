import { LockSettingsCard, SettingsStack } from "@/pages/teams/SettingsStack";
import { teamsStore, useOrgSettings } from "@/pages/teams/teams-store";

/* ─────────────────────────────────────────────────────────────────────────
 * OrgSettingsPane — the Teams list's Settings tab (AG-624 / PRD 8.5).
 *
 * Org-level policies and token savings, plus the org lock. The lock forces
 * these values onto every team: each team's Settings tab renders its
 * Policies and Token savings controls disabled with a "who set it" banner,
 * and its own lock card disables. The org's own controls stay live while
 * locked — an org admin is the one setting them.
 * ───────────────────────────────────────────────────────────────────────── */

export function OrgSettingsPane() {
  const org = useOrgSettings();
  return (
    <SettingsStack
      lockCard={
        <LockSettingsCard
          checked={org.locked}
          description="This will lock all settings for every team's policies and token savings controls in your organization."
          id="org-lock-label"
          onCheckedChange={(locked) => teamsStore.setOrgSettings({ locked })}
          title="Lock settings for this organization"
        />
      }
      locked={false}
      onPoliciesChange={(policies) => teamsStore.setOrgSettings({ policies })}
      onSavingsChange={(savings) => teamsStore.setOrgSettings({ savings })}
      policies={org.policies}
      savings={org.savings}
    />
  );
}
