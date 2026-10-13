import { useMemo } from "react";
import { BillingFree } from "@/pages/BillingFree";
import { onboardingCredits } from "@/pages/onboarding/onboarding-billing";
import { useOnboarding } from "@/pages/onboarding/use-onboarding";

/* `/billing-onboarding`: the onboarding workspace's Billing (owner
 * 2026-10-13). The Free page (a new workspace is Free) with its Credits card
 * and Billing history fed by the setup's own top-ups (`onboardingCredits`):
 * empty until the user adds credits on Gate credits billing, never on
 * Existing subscriptions. */
export function OnboardingBilling() {
  const { improved } = useOnboarding();
  const credits = useMemo(() => onboardingCredits(improved), [improved]);
  return <BillingFree credits={credits} />;
}
