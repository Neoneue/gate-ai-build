import { Settings } from "@/pages/Settings";

/**
 * Free-tier twin of Settings. Same page, two forks: no "Cancel plan" card,
 * because a Free workspace has no paid subscription to stop, and the Free
 * data retention rules (fixed 30 days, read-only). "Delete account and data"
 * and every other section still render. The divergence is props, not a copy
 * of the sections — `Settings` stays the single source of truth.
 */
export function SettingsFree({ clamp = false }: { clamp?: boolean }) {
  // `clamp`: the `/settings-free/clamp` preview route (owner 2026-10-08), the
  // org just downgraded from Pro with its 90-day window clamping to Free's
  // 30 after the PRD's 3-day grace. A typed URL, nothing wired between pages.
  return (
    <Settings
      retentionClampPreview={clamp}
      retentionTier="free"
      showCancelPlan={false}
    />
  );
}
