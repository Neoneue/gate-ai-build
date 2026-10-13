import { useMemo } from "react";
import {
  type SetupTraffic,
  setupTraffic,
  storedSetupTraffic,
} from "@/pages/onboarding/onboarding-setup-traffic";
import { useOnboarding } from "@/pages/onboarding/use-onboarding";

/** Step 3's two messages for the workspace's data pages (owner 2026-10-13):
 *  this tab's live setup state first; in a tab the final page's explore
 *  rows opened (no flow state), the localStorage mirror. Null before step 3
 *  passed, and the page keeps its Default layout. */
export function useSetupTraffic(): SetupTraffic | null {
  const { improved } = useOnboarding();
  return useMemo(
    () => setupTraffic(improved) ?? storedSetupTraffic(),
    [improved]
  );
}
