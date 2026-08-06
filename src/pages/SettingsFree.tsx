import { Settings } from "@/pages/Settings";

/**
 * Free-tier twin of Settings. Same page, one fork: no "Cancel plan" card,
 * because a Free workspace has no paid subscription to stop. "Delete account
 * and data" and every other section still render. The divergence is a prop,
 * not a copy of the sections — `Settings` stays the single source of truth.
 */
export function SettingsFree() {
  return <Settings showCancelPlan={false} />;
}
