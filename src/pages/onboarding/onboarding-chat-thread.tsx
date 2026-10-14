import {
  Fragment,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ScrollToLatestFab } from "@/components/ui/ask-ai-scroll-to-latest";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { cn } from "@/lib/utils";
import { CHAT_MEASURE } from "@/pages/chat/chat-layout";
import { ChatMessage } from "@/pages/chat/chat-message";
import type { ChatTurn } from "@/pages/chat/types";

/* ─────────────────────────────────────────────────────────────────────────
 * The Mobile A onboarding chat's copy of `pages/chat/chat-thread.tsx` (owner
 * 2026-10-12), so the onboarding thread can change without touching the
 * shared one. It differs in two ways: `renderTurn` lets the page draw a turn
 * itself (quick action 3's reply as the offer card) and put the first
 * reply's follow-up cards right after their turn, so later turns land below
 * them; and below lg, follow-latest survives the phone keyboard (see
 * `pageGapBelow`). Change it here, never in the shared thread.
 * ───────────────────────────────────────────────────────────────────────── */

export interface OnboardingChatThreadProps {
  className?: string;
  onRetry?: (messageId: string) => void;
  onStop?: (messageId: string) => void;
  /** Draws one turn in place of the shared `ChatMessage`; keyed by the
   *  thread. Unset: every turn is a `ChatMessage`. */
  renderTurn?: (turn: ChatTurn) => ReactNode;
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

/** A scroll this soon after the reader's own touch drag or wheel is theirs.
 *  iOS momentum runs on past the last touchmove. */
const GESTURE_WINDOW_MS = 1000;

/** Below lg: how far the thread's end sits below what the reader can see
 *  (owner 2026-10-14). The keyboard room (index.css, `[data-keyboard-open]
 *  [data-chat-shell]`) is empty space under the page while a keyboard is up,
 *  so it is left out, and the end is measured against the visual viewport,
 *  the part above the keyboard. Counted in, an open keyboard read as
 *  "scrolled up": the FAB showed and new replies stopped following. */
const pageGapBelow = (page: Element) => {
  const shell = document.querySelector("[data-chat-shell]");
  const room = shell
    ? Number.parseFloat(getComputedStyle(shell).paddingBottom) || 0
    : 0;
  const vv = window.visualViewport;
  const visibleBottom = vv
    ? vv.pageTop + vv.height
    : page.scrollTop + page.clientHeight;
  return page.scrollHeight - room - visibleBottom;
};

/** Below lg: brings the thread's end to the bottom of what can be seen. */
const followPageEnd = (page: Element) => {
  page.scrollTop += pageGapBelow(page);
};

export function OnboardingChatThread({
  turns,
  onRetry,
  onStop,
  renderTurn,
  className,
}: OnboardingChatThreadProps) {
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
      if (isDesktop) {
        target.scrollTop = target.scrollHeight;
      } else {
        followPageEnd(target);
      }
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
  // Only the reader's own scroll turns following off; a scroll from the
  // keyboard opening, iOS revealing the field or the page growing keeps the
  // latest message in view instead (owner 2026-10-14).
  useEffect(() => {
    if (isDesktop) {
      return;
    }
    const page = document.scrollingElement;
    if (!page) {
      return;
    }
    let gestureAt = Number.NEGATIVE_INFINITY;
    const markGesture = () => {
      gestureAt = performance.now();
    };
    const handleWindowScroll = () => {
      if (pageGapBelow(page) <= FOLLOW_SLACK_PX) {
        followLatestRef.current = true;
        setShowLatest(false);
      } else if (performance.now() - gestureAt < GESTURE_WINDOW_MS) {
        followLatestRef.current = false;
        setShowLatest(true);
      } else if (followLatestRef.current) {
        followPageEnd(page);
      }
    };
    const handleViewportResize = () => {
      if (followLatestRef.current) {
        followPageEnd(page);
      }
    };
    const vv = window.visualViewport;
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    window.addEventListener("touchmove", markGesture, { passive: true });
    window.addEventListener("wheel", markGesture, { passive: true });
    vv?.addEventListener("resize", handleViewportResize);
    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
      window.removeEventListener("touchmove", markGesture);
      window.removeEventListener("wheel", markGesture);
      vv?.removeEventListener("resize", handleViewportResize);
    };
  }, [isDesktop]);

  const scrollToLatest = () => {
    const target = scrollportFor(isDesktop, scrollRef.current);
    if (!target) {
      return;
    }
    if (isDesktop) {
      target.scrollTop = target.scrollHeight;
    } else {
      followPageEnd(target);
    }
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
            // 8px between turns on a phone (owner 2026-10-14): the reply's
            // 44px touch-height tool row already adds 14px under its glyphs.
            "flex flex-col gap-2 py-6 sm:gap-8 sm:pt-8"
          )}
          role="log"
        >
          {turns.map((turn) =>
            renderTurn ? (
              <Fragment key={turn.id}>{renderTurn(turn)}</Fragment>
            ) : (
              <ChatMessage
                key={turn.id}
                onRetry={onRetry}
                onStop={onStop}
                turn={turn}
              />
            )
          )}
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
