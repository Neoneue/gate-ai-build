import { Settings } from "@/pages/Settings";

/**
 * Free-tier twin of Settings. Same page, two forks: no "Cancel plan" card,
 * because a Free workspace has no paid subscription to stop, and the Free
 * data retention rules (fixed 30 days, read-only). "Delete account and data"
 * and every other section still render. The divergence is props, not a copy
 * of the sections — `Settings` stays the single source of truth.
 */
export function SettingsFree() {
  return <Settings retentionTier="free" showCancelPlan={false} />;
}
