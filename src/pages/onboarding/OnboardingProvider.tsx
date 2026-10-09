import {
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type CurrentState,
  type ImprovedState,
  initialCurrentState,
  initialImprovedState,
  type OnboardingFlow,
} from "@/pages/onboarding/onboarding-state";
import { OnboardingContext } from "@/pages/onboarding/use-onboarding";

/** Owns the state. Mounted once, by `OnboardingLayout`. */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [flow, setFlowState] = useState<OnboardingFlow>("improved");
  const [current, setCurrent] = useState(initialCurrentState);
  const [improved, setImproved] = useState(initialImprovedState);
  // Mirror of `improved` for async handlers (a simulated 900ms check reads
  // the flag that was true when it resolves, not when it started).
  const improvedRef = useRef(improved);
  useLayoutEffect(() => {
    improvedRef.current = improved;
  }, [improved]);

  const updateCurrent = useCallback(
    (patch: Partial<CurrentState>) =>
      setCurrent((state) => ({ ...state, ...patch })),
    []
  );
  const updateImproved = useCallback(
    (
      patch:
        | Partial<ImprovedState>
        | ((state: ImprovedState) => Partial<ImprovedState>)
    ) =>
      setImproved((state) => {
        const next = {
          ...state,
          ...(typeof patch === "function" ? patch(state) : patch),
        };
        improvedRef.current = next;
        return next;
      }),
    []
  );
  const restart = useCallback(() => {
    setCurrent(initialCurrentState());
    const fresh = initialImprovedState();
    improvedRef.current = fresh;
    setImproved(fresh);
  }, []);
  const setFlow = useCallback(
    (next: OnboardingFlow) => {
      setFlowState(next);
      restart();
    },
    [restart]
  );
  const readImproved = useCallback(() => improvedRef.current, []);

  const value = useMemo(
    () => ({
      flow,
      current,
      improved,
      setFlow,
      restart,
      updateCurrent,
      updateImproved,
      readImproved,
    }),
    [
      flow,
      current,
      improved,
      setFlow,
      restart,
      updateCurrent,
      updateImproved,
      readImproved,
    ]
  );

  return <OnboardingContext value={value}>{children}</OnboardingContext>;
}
