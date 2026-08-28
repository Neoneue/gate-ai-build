import { TeamDetail } from "@/pages/TeamDetail";

/** Default-workspace twin of the team detail page. The variant reaches the
 *  Security tab, which keeps the "No guardrail activity" empty state here. */
export function TeamDetailDefault() {
  return <TeamDetail variant="default" />;
}
