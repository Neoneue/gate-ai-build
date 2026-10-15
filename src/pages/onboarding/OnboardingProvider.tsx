import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import { onboardingChatStore } from "@/pages/onboarding/onboarding-chat-store";
import {
  isMobileATab,
  ONBOARDING_ROUTES,
  ONBOARDING_WORKSPACE_PAGES,
} from "@/pages/onboarding/onboarding-routes";
import {
  parseSharedSetup,
  SHARED_SETUP_KEY,
  saveSharedSetup,
  storedSharedSetup,
} from "@/pages/onboarding/onboarding-shared-setup";
import {
  type CurrentState,
  type ImprovedState,
  initialCurrentState,
  initialImprovedState,
  type OnboardingFlow,
} from "@/pages/onboarding/onboarding-state";
import { isMobileSetupNow } from "@/pages/onboarding/use-is-mobile-setup";
import { OnboardingContext } from "@/pages/onboarding/use-onboarding";

/** Owns the state. Mounted once, by `OnboardingLayout`. The Improved flow's
 *  state is shared with the workspace's other tabs (onboarding-shared-
 *  setup.ts), decided once per tab, on the route it first loads:
 *   • A workspace page (a sidebar row, an explore row's or the Tasks menu's
 *     new tab, the Overview) resumes the shared state.
 *   • The desktop Gate Chat tab keeps its own state (it starts as a new
 *     user, OnboardingLayout) and never writes the shared one.
 *   • Any other first load (the start page, a signup, a refresh that
 *     returns to the start) is a fresh run: its initial state replaces the
 *     shared one, so every tab starts over with it. The shared Gate Chat
 *     history (onboarding-chat-storage.ts, owner 2026-10-14) starts over
 *     with it. */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [shared] = useState(
    () =>
      !(
        pathname.startsWith(ONBOARDING_ROUTES.chat) &&
        !isMobileATab() &&
        !isMobileSetupNow()
      )
  );
  const [freshRun] = useState(
    () => shared && !ONBOARDING_WORKSPACE_PAGES.has(pathname)
  );
  useEffect(() => {
    if (freshRun) {
      onboardingChatStore.reset();
    }
  }, [freshRun]);
  const [flow, setFlowState] = useState<OnboardingFlow>("improved");
  const [current, setCurrent] = useState(initialCurrentState);
  const [improved, setImproved] = useState(
    () =>
      (shared && ONBOARDING_WORKSPACE_PAGES.has(pathname)
        ? storedSharedSetup()
        : null) ?? initialImprovedState()
  );
  // Mirror of `improved` for async handlers (a simulated 900ms check reads
  // the flag that was true when it resolves, not when it started).
  const improvedRef = useRef(improved);
  useLayoutEffect(() => {
    improvedRef.current = improved;
  }, [improved]);
  // Every change reaches the other tabs; another tab's change lands here.
  useEffect(() => {
    if (shared) {
      saveSharedSetup(improved);
    }
  }, [shared, improved]);
  useEffect(() => {
    if (!shared) {
      return;
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key !== SHARED_SETUP_KEY) {
        return;
      }
      const next = parseSharedSetup(event.newValue);
      if (next) {
        improvedRef.current = next;
        setImproved(next);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [shared]);

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
