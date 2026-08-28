import { Teams } from "@/pages/Teams";

/** Default-workspace twin of Teams. Rows drill into `/teams-default/:teamId`
 *  so the detail page keeps the Default variant. */
export function TeamsDefault() {
  return <Teams variant="default" />;
}
