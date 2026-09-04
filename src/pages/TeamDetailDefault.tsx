import { TeamDetailEnterprise } from "@/pages/TeamDetailEnterprise";

/** Default-workspace twin of the team detail page. The variant reaches the
 *  Security tab, which keeps the "No guardrail activity" empty state here. */
export function TeamDetailDefault() {
  return <TeamDetailEnterprise variant="default" />;
}
