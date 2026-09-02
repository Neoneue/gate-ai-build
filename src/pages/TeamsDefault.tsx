import { TeamsEnterprise } from "@/pages/TeamsEnterprise";

/** Default-workspace twin of Teams. Same build as Pro and Enterprise; the
 *  list derives its drill path from the `-default` pathname. */
export function TeamsDefault() {
  return <TeamsEnterprise />;
}
