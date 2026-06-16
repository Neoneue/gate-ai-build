import { Dashboard } from "@/pages/Dashboard";

/** Free-tier twin of the Pro Overview. Renders the Pro page verbatim for now;
 *  this separate file is where the Free experience diverges (show less / gate
 *  PRO features) without touching the Pro page. */
export function DashboardFree() {
  return <Dashboard />;
}
