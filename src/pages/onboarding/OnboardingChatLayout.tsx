import { Outlet, useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/App";
import { AskAiSurface } from "@/components/ui/ask-ai-surface";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { useVisualViewportVars } from "@/hooks/use-visual-viewport-vars";
import { OnboardingChatTopBar } from "@/pages/onboarding/onboarding-chat-top-bar";

/**
 * The Onboarding workspace's copy of `layouts/ChatLayout.tsx` for its Gate
 * Chat. The only difference: its top bar is the onboarding copy, which has
 * no workspace switcher, notifications or Ask AI trigger (owner 2026-10-11).
 * The Ask AI surface stays mounted for when its trigger returns. Change it here, never in the
 * shared layout.
 */
export function OnboardingChatLayout() {
  const { askAiOpen, setAskAiOpen } = useOutletContext<LayoutContext>();
  const isDesktop = useIsDesktop();
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
        <AskAiSurface
          isDesktop={isDesktop}
          onOpenChange={setAskAiOpen}
          open={askAiOpen}
        />
      </div>
    </div>
  );
}
