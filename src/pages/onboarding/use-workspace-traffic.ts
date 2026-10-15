import { useMemo } from "react";
import { useOnboardingDemoTraffic } from "@/pages/onboarding/onboarding-demo-traffic";
import {
  type WorkspaceTraffic,
  workspaceTraffic,
} from "@/pages/onboarding/onboarding-workspace-traffic";
import { useSetupTraffic } from "@/pages/onboarding/use-setup-traffic";

/** The desktop workspace's data pages' one source (owner 2026-10-14):
 *  step 3's messages and every Gate Chat reply of this onboarding run, from
 *  any tab, newest first. Null before either has a message, and the page
 *  keeps its Default layout. */
export function useWorkspaceTraffic(): WorkspaceTraffic | null {
  const setup = useSetupTraffic();
  const chat = useOnboardingDemoTraffic();
  return useMemo(() => workspaceTraffic(setup, chat), [setup, chat]);
}
