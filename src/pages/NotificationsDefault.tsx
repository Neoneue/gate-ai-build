import { Notifications } from "@/pages/Notifications";

/**
 * Default-tier twin of My Notifications — the page as a BRAND-NEW workspace
 * sees it. Three forks, all props:
 *
 *   seed="default"        the ticket defaults from `buildDefaultPrefs()`:
 *                         the four default-on types deliver by email, nothing
 *                         else is selected, frequency is real-time, and the
 *                         security scope is still "every event".
 *   persist={false}       nothing has been saved, so there is nothing to
 *                         hydrate — and this surface is a snapshot of the
 *                         untouched state, so it must not pick up a real
 *                         visit's writes to notifications.prefs.v1 either.
 *   hasFeed={false}       no firings yet; the feed section renders the empty
 *                         band instead of the bell's items.
 *   showOrgSection=false  a fresh workspace has no org to administer.
 *
 * The divergence is props, not a copy of the sections — `Notifications`
 * stays the single source of truth.
 */
export function NotificationsDefault() {
  return (
    <Notifications
      hasFeed={false}
      persist={false}
      seed="default"
      showOrgSection={false}
    />
  );
}
