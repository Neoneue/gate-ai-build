import { useMemo } from "react";
import {
  type SetupTraffic,
  setupTraffic,
} from "@/pages/onboarding/onboarding-setup-traffic";
import { useOnboarding } from "@/pages/onboarding/use-onboarding";

/** Step 3's messages for the workspace's data pages (owner 2026-10-13): the
 *  setup state every onboarding tab shares (OnboardingProvider), so a tab
 *  the demo opened reads them too, one message at a time as each lands.
 *  Null before the test message passed, and the page keeps its Default
 *  layout. */
export function useSetupTraffic(): SetupTraffic | null {
  const { improved } = useOnboarding();
  return useMemo(() => setupTraffic(improved), [improved]);
}
