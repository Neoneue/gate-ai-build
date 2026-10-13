import { Outlet } from "react-router-dom";
import { useVisualViewportVars } from "@/hooks/use-visual-viewport-vars";
import { OnboardingChatTopBar } from "@/pages/onboarding/onboarding-chat-top-bar";

/**
 * The Onboarding workspace's copy of `layouts/ChatLayout.tsx` for its Gate
 * Chat and the phone demo pages. The differences: its top bar is the
 * onboarding copy, which has no workspace switcher, notifications or Ask AI
 * trigger (owner 2026-10-11), and there is no Ask AI panel either (owner
 * 2026-10-13: Ask AI appears once the user leaves onboarding for the real
 * Overview). The shared panel state in App's Layout is not read here, so a
 * panel left open on another page does not follow the user into
 * onboarding. Change it here, never in the shared layout.
 */
export function OnboardingChatLayout() {
  useVisualViewportVars();

  return (
    // Same scroll model as ChatLayout: viewport-height on lg+, the document
    // scrolls below lg with both header bars sticky.
    <div
      className="flex min-h-svh flex-col text-foreground lg:fixed lg:inset-x-0 lg:top-0 lg:h-dvh lg:overflow-hidden"
      data-chat-shell=""
    >
      <OnboardingChatTopBar className="max-lg:sticky max-lg:top-0 max-lg:z-30" />
      <div className="flex flex-1 lg:min-h-0">
        <div className="flex min-w-0 flex-1 flex-col">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
