import { ChevronsUpDown, PanelRightClose, SquarePen } from "lucide-react";
import { useCallback, useRef } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AskAiComposer } from "@/components/ui/ask-ai-composer";
import {
  AgentMessage,
  MessageThread,
  UserMessage,
} from "@/components/ui/ask-ai-message";
import {
  ScrollBottomSentinel,
  ScrollToLatestFab,
} from "@/components/ui/ask-ai-scroll-to-latest";
import { AskAiThinkingRow } from "@/components/ui/ask-ai-thinking-row";
import { Button } from "@/components/ui/button";
import { useAskAiThread } from "@/hooks/use-ask-ai-thread";
import { useStickToBottom } from "@/hooks/use-stick-to-bottom";
import { cn } from "@/lib/utils";

/* ─── AskAiPanel — right-docked "Ask AI" chat shell ─────────────────────────
 * Skeleton only: header (unwired "New session" caret + optional secondary
 * action + wired collapse) and an empty body surface. The inner chat elements
 * live elsewhere. Surface + borders come from the wrapper (the docked column's
 * `border-l bg-card`, or SheetContent below lg), so this component owns layout
 * only and stays single-bordered in both mounts.
 *
 * The header is `h-16` to line up flush with the 64px DashTopBar so the collapse
 * control sits on the same baseline as the top-bar actions. ──────────────── */

export interface AskAiPanelProps {
  className?: string;
  /** Collapse the panel (push-out on desktop, close the Sheet below lg). */
  onClose: () => void;
}

export function AskAiPanel({ onClose, className }: AskAiPanelProps) {
  // Conversation state lives above the router outlet (App.tsx) so the thread
  // survives navigation, the same way `askAiOpen` does.
  const { messages, phase, send, stop } = useAskAiThread();

  // The scrolling message region and the zero-height marker at its very end.
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const stick = useStickToBottom(scrollRef, sentinelRef);

  // Sending re-arms following and snaps to the end, so the new turn is in view
  // however far up the thread the user had scrolled.
  const handleSend = useCallback(
    (text: string) => {
      send(text);
      stick.pinToBottom();
    },
    [send, stick]
  );

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-col text-foreground",
        className
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-border border-b px-4">
        {/* Session picker affordance — visual only (unwired). Matches the
            WorkspaceSwitcher trigger: outline button, copy-14 label, muted
            ChevronsUpDown caret. */}
        <Button size="lg" type="button" variant="outline">
          <span className="type-label-14 text-foreground">New session</span>
          <ChevronsUpDown
            aria-hidden
            className="size-4 text-muted-foreground"
            strokeWidth={1.75}
          />
        </Button>
        <div className="flex items-center gap-1">
          {/* Secondary action for visual fidelity with the mock — unwired. */}
          <Button
            aria-label="New chat"
            size="icon-lg"
            type="button"
            variant="ghost"
          >
            <SquarePen aria-hidden strokeWidth={1.75} />
          </Button>
          <Button
            aria-label="Collapse Ask AI panel"
            onClick={onClose}
            size="icon-lg"
            type="button"
            variant="ghost"
          >
            <PanelRightClose aria-hidden strokeWidth={1.75} />
          </Button>
        </div>
      </div>
      {/* Body — 16px inset on left/right/bottom; the scrolling message region
          carries its own 16px top padding so the first message clears the top
          bar by 16px while the scroll track still runs edge-to-edge. `gap-4`
          keeps the thread 16px clear of the composer — Figma's inter-turn
          spacing (8px thread gap + 8px turn bottom padding) applied to the
          thread/composer boundary. */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-4">
        {/* Non-scrolling wrapper: owns the flex sizing so the scroll-to-latest
            control can anchor to the region's box without riding the scroll.
            Its right edge is the body's `px-4` and its bottom edge is the
            body's `gap-4`, which is exactly Figma's 16px / 16px offset pair —
            so the FAB needs no hard-coded position of its own. */}
        <div className="relative min-h-0 flex-1">
          {/* Scrolling turn list.
              Scroll anchoring: the content wrapper opts OUT and the sentinel
              opts IN. The two are separate elements rather than a `[&>*]` rule
              plus an override, so there is no specificity tie to lose. It
              prevents JUMPS when content changes above the viewport, but it
              does NOT follow content appended below (measured 2026-07-28:
              0 → 819px drift over ~10s of streaming). Auto-follow is
              `useStickToBottom`, which owns that. */}
          <div className="h-full overflow-y-auto pt-4" ref={scrollRef}>
            <div className="[overflow-anchor:none]">
              <MessageThread>
                {messages.map((message) =>
                  message.role === "user" ? (
                    <UserMessage key={message.id}>
                      {message.content}
                    </UserMessage>
                  ) : (
                    <AgentMessage
                      key={message.id}
                      showActions={message.status !== "streaming"}
                    >
                      <Markdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </Markdown>
                    </AgentMessage>
                  )
                )}
                {phase === "thinking" && <AskAiThinkingRow />}
              </MessageThread>
            </div>
            <ScrollBottomSentinel ref={sentinelRef} />
          </div>
          <ScrollToLatestFab
            className="absolute right-0 bottom-0"
            onClick={stick.jumpToLatest}
            visible={stick.showFab}
          />
        </div>
        <AskAiComposer
          className="shrink-0"
          onSend={handleSend}
          onStop={stop}
          phase={phase}
        />
      </div>
    </div>
  );
}
