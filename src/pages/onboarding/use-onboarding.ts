import { createContext, use } from "react";
import type {
  CurrentState,
  ImprovedState,
  OnboardingFlow,
} from "@/pages/onboarding/onboarding-state";

/* The Onboarding context and its hook. The state itself is owned by
 * `OnboardingProvider` (OnboardingProvider.tsx); types and pure helpers live
 * in onboarding-state.ts. */

export type OnboardingContextValue = {
  flow: OnboardingFlow;
  current: CurrentState;
  improved: ImprovedState;
  /** Switch flow version; resets both flows' progress. */
  setFlow: (flow: OnboardingFlow) => void;
  /** Start the current flow over. */
  restart: () => void;
  updateCurrent: (patch: Partial<CurrentState>) => void;
  updateImproved: (
    patch:
      | Partial<ImprovedState>
      | ((state: ImprovedState) => Partial<ImprovedState>)
  ) => void;
  /** Read the latest improved state inside an async handler. */
  readImproved: () => ImprovedState;
};

export const OnboardingContext = createContext<OnboardingContextValue | null>(
  null
);

export function useOnboarding(): OnboardingContextValue {
  const value = use(OnboardingContext);
  if (!value) {
    throw new Error("useOnboarding must be used inside OnboardingProvider");
  }
  return value;
}
