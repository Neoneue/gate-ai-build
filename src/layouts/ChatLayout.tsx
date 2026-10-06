import { type Dispatch, type SetStateAction, useState } from "react";
import { Outlet, useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/App";
import { AskAiSurface } from "@/components/ui/ask-ai-surface";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { useVisualViewportVars } from "@/hooks/use-visual-viewport-vars";
import { ChatTopBar } from "@/pages/chat/chat-top-bar";

/**
 * Full-screen layout for `/chat` (and its tier twins) and everything under
 * it, ported from the site's `layouts/ChatLayout.tsx`. It sits beside
 * `DashboardChrome` and is selected by route: no dashboard sidebar, no
 * dashboard top bar. A chat is the working page, not a card on a canvas.
 *
 * `ChatTopBar` is the layout's row rather than the page's so it spans the full
 * width above the conversation rail. The Ask AI surface (the site's
 * Gatekeeper) is the LAST flex child of the row below it, so the docked
 * column is a real sibling of the chat and condenses it, exactly as it does
 * in `DashboardChrome`. Its open state is App's hoisted `askAiOpen`, so the
 * panel survives navigation between conversations.
 */
export interface ChatLayoutContext {
  railCollapsed: boolean;
  setRailCollapsed: Dispatch<SetStateAction<boolean>>;
}

export function ChatLayout() {
  const { askAiOpen, setAskAiOpen } = useOutletContext<LayoutContext>();
  const isDesktop = useIsDesktop();
  // Lifted out of the page so the top bar's brand column, its toggle and the
  // rail below read ONE value: they draw two halves of the same vertical line.
  const [railCollapsed, setRailCollapsed] = useState(false);
  useVisualViewportVars();

  return (
    // Desktop (lg+): viewport-height, the chat surface owns its own scroll
    // regions and the page never scrolls. Below lg the DOCUMENT scrolls:
    // both header bars are sticky, the thread runs behind them in normal
    // flow and the composer floats (Chat.tsx). With a scrollable document
    // iOS scrolls it for the keyboard instead of panning the visual
    // viewport, which dragged fixed bars along. min-h-svh, not dvh: with
    // Chrome's toolbar showing, dvh outgrew the window by the toolbar's
    // height, so the page could scroll and drift with the keyboard down.
    <div
      className="flex min-h-svh flex-col text-foreground lg:fixed lg:inset-x-0 lg:top-0 lg:h-dvh lg:overflow-hidden"
      data-chat-shell=""
    >
      <ChatTopBar
        askAiOpen={askAiOpen}
        className="max-lg:sticky max-lg:top-0 max-lg:z-30"
        onToggleAskAi={() => setAskAiOpen((open) => !open)}
        onToggleRail={() => setRailCollapsed((collapsed) => !collapsed)}
        railCollapsed={railCollapsed}
      />
      <div className="flex flex-1 lg:min-h-0">
        <div className="flex min-w-0 flex-1 flex-col">
          <Outlet
            context={
              { railCollapsed, setRailCollapsed } satisfies ChatLayoutContext
            }
          />
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
