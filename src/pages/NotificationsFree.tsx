import { Notifications } from "@/pages/Notifications";

/**
 * Free-tier twin of My Notifications. Same page, one fork: no "Organization"
 * section, because org-wide notification types are an org-admin surface and a
 * Free workspace has no organization to administer. Personal delivery
 * channels, the whole catalog, the security-event scope, and the recent-
 * notifications history all still render.
 *
 * The divergence is a prop, not a copy of the sections — `Notifications`
 * stays the single source of truth.
 */
export function NotificationsFree() {
  return <Notifications showOrgSection={false} />;
}
