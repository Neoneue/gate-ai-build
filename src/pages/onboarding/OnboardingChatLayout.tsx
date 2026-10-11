import { Outlet } from "react-router-dom";
import { useVisualViewportVars } from "@/hooks/use-visual-viewport-vars";

/**
 * The Onboarding workspace's copy of `layouts/ChatLayout.tsx` for its Gate
 * Chat. The only difference: no `ChatTopBar` (logo, notifications, theme,
 * Ask AI, docs), so the conversation bar is the first row (owner
 * 2026-10-11). A workspace that is not set up yet has nowhere else to go.
 * With no Ask AI toggle, the Ask AI surface is left out too. Change it here,
 * never in the shared layout.
 */
export function OnboardingChatLayout() {
  useVisualViewportVars();

  return (
    // Same scroll model as ChatLayout: viewport-height on lg+, the document
    // scrolls below lg with the conversation bar sticky at the top.
    <div
      className="flex min-h-svh flex-col text-foreground lg:fixed lg:inset-x-0 lg:top-0 lg:h-dvh lg:overflow-hidden"
      data-chat-shell=""
    >
      <div className="flex flex-1 lg:min-h-0">
        <div className="flex min-w-0 flex-1 flex-col">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
