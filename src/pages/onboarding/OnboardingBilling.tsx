import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BillingFree } from "@/pages/BillingFree";
import type { CheckoutState } from "@/pages/onboarding/OnboardingCheckout";
import { onboardingCredits } from "@/pages/onboarding/onboarding-billing";
import { ONBOARDING_ROUTES } from "@/pages/onboarding/onboarding-routes";
import { useOnboarding } from "@/pages/onboarding/use-onboarding";

/* `/billing-onboarding`: the onboarding workspace's Billing (owner
 * 2026-10-13). The Free page (a new workspace is Free) with its Credits card
 * and Billing history fed by the setup's own top-ups (`onboardingCredits`):
 * setup credits show on Gate credits only; credits bought here show on
 * either billing type. Its Add credits runs the same mock checkout as
 * setup, for whichever amount was picked, and returns here (owner
 * 2026-10-14), so the balance and Gate Chat's paid models follow on desktop
 * and phone alike. */
export function OnboardingBilling() {
  const { improved } = useOnboarding();
  const navigate = useNavigate();
  const credits = useMemo(() => onboardingCredits(improved), [improved]);
  return (
    <BillingFree
      credits={credits}
      onCheckout={(amount) =>
        navigate(ONBOARDING_ROUTES.checkout, {
          state: {
            amount,
            returnTo: "/billing-onboarding",
            source: "billing",
          } satisfies CheckoutState,
        })
      }
    />
  );
}
