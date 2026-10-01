import { useLayoutEffect, useRef, useState } from "react";
import { ScrollToLatestFab } from "@/components/ui/ask-ai-scroll-to-latest";
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

export function ChatThread({
  turns,
  onRetry,
  onStop,
  className,
}: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const followLatestRef = useRef(true);
  const [showLatest, setShowLatest] = useState(false);
  const latestTurn = turns.at(-1);
  const contentKey = latestTurn
    ? `${turns.length}:${latestTurn.id}:${latestTurn.prompt.length}:${latestTurn.lanes.map((lane) => `${lane.id}:${lane.state}:${lane.body.length}`).join(",")}`
    : "0";

  // biome-ignore lint/correctness/useExhaustiveDependencies: contentKey is the trigger; the effect reads the DOM, not the key
  useLayoutEffect(() => {
    const scrollport = scrollRef.current;
    if (!(scrollport && followLatestRef.current)) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      scrollport.scrollTop = scrollport.scrollHeight;
      setShowLatest(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [contentKey]);

  const handleScroll = () => {
    const scrollport = scrollRef.current;
    if (!scrollport) {
      return;
    }
    const awayFromBottom =
      scrollport.scrollHeight - scrollport.scrollTop - scrollport.clientHeight >
      FOLLOW_SLACK_PX;
    followLatestRef.current = !awayFromBottom;
    setShowLatest(awayFromBottom);
  };

  const scrollToLatest = () => {
    const scrollport = scrollRef.current;
    if (!scrollport) {
      return;
    }
    scrollport.scrollTop = scrollport.scrollHeight;
    followLatestRef.current = true;
    setShowLatest(false);
  };

  return (
    <div className={cn("relative min-h-0 flex-1", className)}>
      {/* design-allow-clip: the inner column carries the 16px / 24px measure
          gutter (CHAT_MEASURE px-4 sm:px-6), well clear of the 4px ring. */}
      <div
        className="h-full overflow-y-auto"
        onScroll={handleScroll}
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
      <ScrollToLatestFab
        className="absolute bottom-3 left-1/2 -translate-x-1/2"
        onClick={scrollToLatest}
        visible={showLatest}
      />
    </div>
  );
}
