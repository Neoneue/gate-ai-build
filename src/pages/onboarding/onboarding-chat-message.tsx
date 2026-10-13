import { CircleCheck, CircleSlash, Copy, RotateCcw } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { useCopyFeedback } from "@/hooks/use-copy-feedback";
import { cn } from "@/lib/utils";
import { CHAT_BUBBLE_MAX, CHAT_TOUCH_TARGET } from "@/pages/chat/chat-layout";
import { ChatModelLogo } from "@/pages/chat/chat-model-logo";
import { ChatProse } from "@/pages/chat/chat-prose";
import { CHAT_COPY, preparingReplyForLabel } from "@/pages/chat/copy";
import type { ChatLane, ChatTurn } from "@/pages/chat/types";
import { OnboardingChatUsageRow } from "@/pages/onboarding/onboarding-chat-usage-row";

/* ─────────────────────────────────────────────────────────────────────────
 * The onboarding copy of `pages/chat/chat-message.tsx` (owner 2026-10-12),
 * for the Mobile A thread, so its reply card can change without touching
 * the shared one on Free, Default, Pro and Enterprise. Change it here,
 * never in the shared message.
 *
 * It differs in one way: the reply header wraps at large text sizes
 * (200%), so the time drops below the model name instead of pushing the
 * page sideways. At 100% it lays out exactly as the shared header.
 *
 * Left out: attachment chips and notes and memory chips. A Mobile A turn
 * never carries them (its composer has no attachments and its replies use
 * no memory tools); the thread hands any turn that does to the shared
 * `ChatMessage` (`canUseOnboardingChatMessage`,
 * `onboarding-chat-message-support.ts`).
 * ───────────────────────────────────────────────────────────────────────── */

/** The site's own single-use label for the stop affordance (not in CHAT_COPY). */
const STOP_GENERATING = "Stop generating";

/** How long the inline "Copied" confirmation holds, the site's value and the
 *  Ask AI reply row's. */
const COPY_HOLD_MS = 3000;

/** The prompt is the user's own text, shown as typed: plain paragraphs, no
    markdown. `wrap-anywhere` lets a pasted key or URL break inside the bubble
    instead of running past it. */
function ChatBody({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
  if (paragraphs.length === 0) {
    return null;
  }
  return (
    <div className="type-copy-14 wrap-anywhere flex min-w-0 flex-col gap-3 text-pretty">
      {paragraphs.map((paragraph, index) => (
        <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
      ))}
    </div>
  );
}

/**
 * The answer header: the display name a reader scans for, then the
 * canonical id and the time as quiet metadata. Shared by this card and the
 * follow-up cards (`onboarding-computer-prompt.tsx`).
 *
 * Large text (200%): the row wraps. The id takes no room when the row
 * decides where to break (`flex-1` from a 0 basis), so the time drops to a
 * second line only when the logo, name and time no longer fit side by
 * side; the id then rides with the time and truncates. Capped at its own
 * width (`max-w-max`), the id grows only as far as its text, so at 100% the
 * time sits right after it and the id truncates first, as the shared header
 * does. The name wraps inside its group only when it alone is wider than
 * the card.
 */
export function OnboardingChatLaneHeader({ lane }: { lane: ChatLane }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <div className="flex min-w-0 items-center gap-2">
        <ChatModelLogo model={lane.model} />
        <span className="type-label-14 min-w-0 text-foreground">
          <span className="sr-only">
            {lane.state === "streaming"
              ? CHAT_COPY.replyFrom
              : CHAT_COPY.responded}{" "}
          </span>
          {lane.model.label}
        </span>
      </div>
      <span className="type-mono-12 min-w-0 max-w-max flex-1 truncate text-muted-foreground">
        {lane.model.id}
      </span>
      <time
        className="type-mono-12 shrink-0 text-muted-foreground"
        dateTime={lane.timestampIso}
      >
        {lane.timestamp}
      </time>
    </div>
  );
}

interface LaneCardProps {
  lane: ChatLane;
  onRetry?: (messageId: string) => void;
  onStop?: (messageId: string) => void;
}

function LaneCard({ lane, onRetry, onStop }: LaneCardProps) {
  const showBody = lane.state !== "failed";
  const streaming = lane.state === "streaming";
  const hasBody = lane.body.trim().length > 0;
  // A lane with no row id yet cannot be retried or stopped.
  const terminal = lane.state !== "streaming";
  const canRetry = lane.id !== null && terminal;
  const canStop = lane.id !== null && lane.state === "streaming";
  const { copied, trigger: copyResponse } = useCopyFeedback({
    value: lane.body,
    label: "response",
    holdMs: COPY_HOLD_MS,
    notify: false,
  });
  const CopyGlyph = copied ? CircleCheck : Copy;

  return (
    <div className="flex h-full min-w-0 flex-col gap-2" data-slot="chat-lane">
      <div
        aria-busy={lane.state === "streaming"}
        className="flex min-w-0 flex-1 flex-col gap-3 rounded-md border border-border bg-chat-bubble-agent p-4 text-chat-bubble-agent-foreground shadow-xs"
      >
        <OnboardingChatLaneHeader lane={lane} />

        {/* One slot for the wait and the reply, with the same floor under both. */}
        {showBody && (streaming || hasBody) ? (
          <div className="flex min-h-9 min-w-0 flex-col justify-center">
            {hasBody ? (
              <ChatProse>{lane.body}</ChatProse>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div
                  aria-label={preparingReplyForLabel(lane.model.label)}
                  className="flex items-center gap-2 py-2 text-muted-foreground"
                  role="status"
                >
                  <span aria-hidden className="flex items-center gap-1">
                    {[0, 1, 2].map((dot) => (
                      <span
                        className="size-1 animate-pulse rounded-full bg-current motion-reduce:animate-none"
                        key={dot}
                        style={{ animationDelay: `${dot * 160}ms` }}
                      />
                    ))}
                  </span>
                  <span className="type-copy-12">
                    {CHAT_COPY.preparingReply}
                  </span>
                </div>
                {canStop ? (
                  <Button
                    onClick={() => lane.id && onStop?.(lane.id)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <CircleSlash
                      aria-hidden
                      data-icon="inline-start"
                      strokeWidth={1.75}
                    />
                    {STOP_GENERATING}
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        ) : null}

        {streaming && hasBody && canStop ? (
          <div className="flex justify-end">
            <Button
              onClick={() => lane.id && onStop?.(lane.id)}
              size="sm"
              type="button"
              variant="outline"
            >
              <CircleSlash
                aria-hidden
                data-icon="inline-start"
                strokeWidth={1.75}
              />
              {STOP_GENERATING}
            </Button>
          </div>
        ) : null}

        {lane.state === "stopped" ? (
          <p className="type-copy-12 flex items-center gap-2 text-muted-foreground">
            <CircleSlash
              aria-hidden
              className="size-3 shrink-0"
              strokeWidth={1.75}
            />
            {CHAT_COPY.incomplete}
          </p>
        ) : null}

        {lane.state === "failed" ? (
          <p className="type-copy-12 text-destructive">{lane.error}</p>
        ) : null}

        {terminal ? (
          <OnboardingChatUsageRow
            className="mt-auto border-border border-t pt-3"
            usage={lane.usage}
          />
        ) : null}
      </div>

      {/* The Ask AI reply row's geometry: `icon-action` boxes that trade the
          row's gap away on touch so the glyph pitch never moves. */}
      <div
        aria-hidden={!terminal}
        className={cn(
          "flex min-h-8 items-center gap-0 px-0 text-muted-foreground transition-opacity duration-150 ease-out motion-reduce:transition-none lg:gap-1 lg:px-1",
          terminal ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <Button
          aria-label={copied ? "Copied" : CHAT_COPY.copyResponse}
          className={cn(
            CHAT_TOUCH_TARGET,
            copied ? "text-foreground" : "text-muted-foreground"
          )}
          disabled={lane.body.length === 0}
          onClick={copyResponse}
          size="icon-action"
          tabIndex={terminal ? 0 : -1}
          type="button"
          variant="ghost"
        >
          <CopyGlyph aria-hidden strokeWidth={1.75} />
        </Button>
        {canRetry ? (
          <Button
            aria-label={`${lane.state === "complete" ? CHAT_COPY.regenerateResponse : CHAT_COPY.retryLane}: ${lane.model.label}`}
            className={cn(CHAT_TOUCH_TARGET, "text-muted-foreground")}
            onClick={() => lane.id && onRetry?.(lane.id)}
            size="icon-action"
            tabIndex={terminal ? 0 : -1}
            type="button"
            variant="ghost"
          >
            <RotateCcw aria-hidden strokeWidth={1.75} />
          </Button>
        ) : null}
        <span aria-live="polite" className="type-copy-12 ml-auto" role="status">
          {copied ? "Copied" : ""}
        </span>
      </div>
    </div>
  );
}

export interface OnboardingChatMessageProps {
  className?: string;
  onRetry?: (messageId: string) => void;
  onStop?: (messageId: string) => void;
  turn: ChatTurn;
}

export function OnboardingChatMessage({
  turn,
  onRetry,
  onStop,
  className,
}: OnboardingChatMessageProps) {
  const promptId = useId();
  const isComparison = turn.lanes.length > 1;

  return (
    <article
      aria-labelledby={promptId}
      className={cn("flex flex-col gap-4", className)}
    >
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center justify-end gap-2">
          <span className="type-label-12 text-foreground">{CHAT_COPY.you}</span>
          <time
            className="type-mono-12 text-muted-foreground"
            dateTime={turn.promptTimestampIso}
          >
            {turn.promptTimestamp}
          </time>
        </div>
        <div
          className={cn(
            "type-copy-14 min-w-0 text-pretty rounded-md border border-border bg-chat-bubble-user px-4 py-3 text-chat-bubble-user-foreground shadow-xs",
            CHAT_BUBBLE_MAX
          )}
          id={promptId}
        >
          <ChatBody text={turn.prompt} />
        </div>
        {turn.promptUsage ? (
          <OnboardingChatUsageRow
            className={cn("items-end text-right", CHAT_BUBBLE_MAX)}
            usage={turn.promptUsage}
          />
        ) : null}
      </div>

      {/* Two lanes are equal columns so a failed answer cannot shrink or crowd a
          successful one; both share the column's edges. */}
      <div
        className={cn(
          isComparison && "grid items-stretch gap-4 md:grid-cols-2"
        )}
      >
        {turn.lanes.map((lane, index) => (
          <LaneCard
            key={`lane-${index}`}
            lane={lane}
            onRetry={onRetry}
            onStop={onStop}
          />
        ))}
      </div>
    </article>
  );
}
