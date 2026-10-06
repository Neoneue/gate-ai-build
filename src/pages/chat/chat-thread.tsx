import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ScrollToLatestFab } from "@/components/ui/ask-ai-scroll-to-latest";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { cn } from "@/lib/utils";
import { CHAT_MEASURE } from "./chat-layout";
import { ChatMessage } from "./chat-message";
import type { ChatTurn } from "./types";

export interface ChatThreadProps {
  className?: string;
  onRetry?: (messageId: string) => void;
  onStop?: (messageId: string) => void;
  turns: ChatTurn[];
}

/** How far from the bottom a reader can be and still count as following. */
const FOLLOW_SLACK_PX = 80;

/** Desktop (lg+) scrolls the thread's own box; below lg the document
 *  scrolls (ChatLayout), so follow-latest reads and moves the page. */
const scrollportFor = (isDesktop: boolean, box: HTMLElement | null) =>
  isDesktop ? box : document.scrollingElement;

const awayFromBottom = (scrollport: Element) =>
  scrollport.scrollHeight - scrollport.scrollTop - scrollport.clientHeight >
  FOLLOW_SLACK_PX;

export function ChatThread({
  turns,
  onRetry,
  onStop,
  className,
}: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop();
  const followLatestRef = useRef(true);
  const [showLatest, setShowLatest] = useState(false);
  const latestTurn = turns.at(-1);
  const contentKey = latestTurn
    ? `${turns.length}:${latestTurn.id}:${latestTurn.prompt.length}:${latestTurn.lanes.map((lane) => `${lane.id}:${lane.state}:${lane.body.length}`).join(",")}`
    : "0";

  // biome-ignore lint/correctness/useExhaustiveDependencies: contentKey is the trigger; the effect reads the DOM, not the key
  useLayoutEffect(() => {
    const target = scrollportFor(isDesktop, scrollRef.current);
    if (!(target && followLatestRef.current)) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      target.scrollTop = target.scrollHeight;
      setShowLatest(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [contentKey, isDesktop]);

  const handleScroll = () => {
    const target = scrollportFor(isDesktop, scrollRef.current);
    if (!target) {
      return;
    }
    const away = awayFromBottom(target);
    followLatestRef.current = !away;
    setShowLatest(away);
  };

  // Below lg the scroll events come from the window, not the thread's box.
  useEffect(() => {
    if (isDesktop) {
      return;
    }
    const target = document.scrollingElement;
    if (!target) {
      return;
    }
    const handleWindowScroll = () => {
      const away = awayFromBottom(target);
      followLatestRef.current = !away;
      setShowLatest(away);
    };
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, [isDesktop]);

  const scrollToLatest = () => {
    const target = scrollportFor(isDesktop, scrollRef.current);
    if (!target) {
      return;
    }
    target.scrollTop = target.scrollHeight;
    followLatestRef.current = true;
    setShowLatest(false);
  };

  return (
    <div className={cn("relative flex-1 lg:min-h-0", className)}>
      {/* design-allow-clip: the inner column carries the 16px / 24px measure
          gutter (CHAT_MEASURE px-4 sm:px-6), well clear of the 4px ring. */}
      <div
        className="lg:h-full lg:overflow-y-auto"
        onScroll={isDesktop ? handleScroll : undefined}
        ref={scrollRef}
      >
        <div
          aria-label="Chat conversation"
          aria-live="polite"
          aria-relevant="additions"
          className={cn(
            CHAT_MEASURE,
            "flex flex-col gap-6 py-6 sm:gap-8 sm:pt-8"
          )}
          role="log"
        >
          {turns.map((turn) => (
            <ChatMessage
              key={turn.id}
              onRetry={onRetry}
              onStop={onStop}
              turn={turn}
            />
          ))}
        </div>
      </div>
      {/* Below lg it rides above the floating composer (and the keyboard):
          main's `--chat-composer-h` plus `--kb-inset`, 12px clear. */}
      <ScrollToLatestFab
        className="fixed bottom-[calc(var(--chat-composer-h,0px)+var(--kb-inset,0px)+--spacing(3))] left-1/2 -translate-x-1/2 max-lg:z-20 lg:absolute lg:bottom-3"
        onClick={scrollToLatest}
        visible={showLatest}
      />
    </div>
  );
}
