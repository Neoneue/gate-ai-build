import { ImprovedStart } from "@/pages/onboarding/improved-start";

/* `/overview-onboarding`: the single first page of the Onboarding workspace.
 * Only the Improved flow is presented (owner direction 2026-10-08); the
 * Current flow's start (`CurrentStart` in current-setup.tsx) is kept, hidden. */

export function OnboardingOverview() {
  return <ImprovedStart />;
}
