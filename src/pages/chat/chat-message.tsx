import {
  BrainCircuit,
  CircleCheck,
  CircleSlash,
  Copy,
  Paperclip,
  RotateCcw,
} from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { useCopyFeedback } from "@/hooks/use-copy-feedback";
import { cn } from "@/lib/utils";
import { CHAT_BUBBLE_MAX, CHAT_TOUCH_TARGET } from "./chat-layout";
import { ChatModelLogo } from "./chat-model-logo";
import { ChatProse } from "./chat-prose";
import { ChatUsageRow } from "./chat-usage-row";
import { isExtractableChatAttachment, isImageChatAttachment } from "./contract";
import { CHAT_COPY, preparingReplyForLabel } from "./copy";
import type {
  ChatAttachment,
  ChatLane,
  ChatLaneMemory,
  ChatTurn,
} from "./types";

/** The site's own single-use label for the stop affordance (not in CHAT_COPY). */
const STOP_GENERATING = "Stop generating";

/** The prompt is the user's own text, shown as typed: plain paragraphs, no
    markdown. `wrap-anywhere` lets a pasted key or URL break inside the bubble
    instead of running past it. */
function ChatBody({ text, className }: { text: string; className?: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
  if (paragraphs.length === 0) {
    return null;
  }
  return (
    <div
      className={cn(
        "type-copy-14 wrap-anywhere flex min-w-0 flex-col gap-3 text-pretty",
        className
      )}
    >
      {paragraphs.map((paragraph, index) => (
        <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
      ))}
    </div>
  );
}

/** What every lane that reported said about one attachment. `unknown` is a
 *  turn that carries no verdict, so the chip claims nothing rather than
 *  guessing from the model catalog. */
type ChatAttachmentVerdict = "delivered" | "omitted" | "mixed" | "unknown";

function attachmentVerdict(
  attachmentId: string,
  lanes: readonly ChatLane[]
): ChatAttachmentVerdict {
  let delivered = false;
  let omitted = false;
  for (const lane of lanes) {
    if (!lane.attachments) {
      continue;
    }
    if (lane.attachments.deliveredIds.includes(attachmentId)) {
      delivered = true;
    }
    if (lane.attachments.omittedIds.includes(attachmentId)) {
      omitted = true;
    }
  }
  if (delivered && omitted) {
    return "mixed";
  }
  if (delivered) {
    return "delivered";
  }
  if (omitted) {
    return "omitted";
  }
  return "unknown";
}

interface ChatAttachmentNote {
  hint?: string;
  label: string;
}

/** The chip's own claim about a file, which must survive being read literally. */
function attachmentNote(
  attachment: ChatAttachment,
  verdict: ChatAttachmentVerdict
): ChatAttachmentNote | null {
  if (isImageChatAttachment(attachment.contentType)) {
    if (verdict === "delivered") {
      return { label: CHAT_COPY.attachmentSentAsImage };
    }
    if (verdict === "omitted") {
      return {
        label: CHAT_COPY.attachmentNoVision,
        hint: CHAT_COPY.attachmentNoVisionHint,
      };
    }
    return null;
  }
  if (isExtractableChatAttachment(attachment.contentType)) {
    return null;
  }
  return {
    label: CHAT_COPY.attachmentNotRead,
    hint: CHAT_COPY.attachmentNotReadHint,
  };
}

/** One set for the whole turn, rendered once under the prompt rather than per
    lane: every lane was offered the same files. A quiet chip row, not a card. */
function ChatAttachmentChips({
  attachments,
  lanes,
}: {
  attachments: ChatAttachment[];
  lanes: readonly ChatLane[];
}) {
  if (attachments.length === 0) {
    return null;
  }
  return (
    <ul className="flex flex-wrap justify-end gap-2">
      {attachments.map((attachment) => {
        const note = attachmentNote(
          attachment,
          attachmentVerdict(attachment.id, lanes)
        );
        return (
          <li
            className="type-copy-12 flex items-center gap-2 rounded-sm border border-border bg-muted px-2 py-1 text-muted-foreground"
            key={attachment.id}
          >
            <Paperclip
              aria-hidden
              className="size-3 shrink-0"
              strokeWidth={1.75}
            />
            <span className="max-w-40 truncate">{attachment.filename}</span>
            <span className="type-mono-12 shrink-0">{attachment.size}</span>
            {note ? (
              <span
                className="shrink-0 border-border border-l pl-2"
                title={note.hint}
              >
                {note.label}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/** The images the lanes of this turn were NOT all given the same way. Only
    these need saying per lane. */
function contestedImages(
  attachments: ChatAttachment[],
  lanes: readonly ChatLane[]
): ChatAttachment[] {
  return attachments.filter(
    (attachment) =>
      isImageChatAttachment(attachment.contentType) &&
      attachmentVerdict(attachment.id, lanes) === "mixed"
  );
}

function ChatLaneAttachmentNotes({
  attachments,
  lane,
}: {
  attachments: ChatAttachment[];
  lane: ChatLane;
}) {
  const delivery = lane.attachments;
  if (!delivery || attachments.length === 0) {
    return null;
  }
  const received = attachments.filter((attachment) =>
    delivery.deliveredIds.includes(attachment.id)
  );
  const withheld = attachments.filter((attachment) =>
    delivery.omittedIds.includes(attachment.id)
  );
  const names = (files: ChatAttachment[]) =>
    files.map((file) => file.filename).join(", ");
  return (
    <div className="flex flex-col gap-1">
      {received.length > 0 ? (
        <p className="type-copy-12 flex flex-wrap items-center gap-1 text-muted-foreground">
          <Paperclip
            aria-hidden
            className="size-3 shrink-0"
            strokeWidth={1.75}
          />
          <span>{CHAT_COPY.attachmentSentAsImage}:</span>
          <span className="text-foreground">{names(received)}</span>
        </p>
      ) : null}
      {withheld.length > 0 ? (
        <p
          className="type-copy-12 flex flex-wrap items-center gap-1 text-muted-foreground"
          title={CHAT_COPY.attachmentNoVisionHint}
        >
          <Paperclip
            aria-hidden
            className="size-3 shrink-0"
            strokeWidth={1.75}
          />
          <span>{CHAT_COPY.attachmentNoVision}:</span>
          <span className="text-foreground">{names(withheld)}</span>
        </p>
      ) : null}
    </div>
  );
}

/** One chip per memory tool call, in the order the model made them. */
function ChatMemoryChips({ memories }: { memories: ChatLaneMemory[] }) {
  if (memories.length === 0) {
    return null;
  }
  return (
    <ul aria-label={CHAT_COPY.memories} className="flex flex-wrap gap-2">
      {memories.map((memory, index) => (
        <li
          className="type-copy-12 flex items-center gap-2 rounded-sm border border-border bg-muted px-2 py-1 text-muted-foreground"
          key={`${index}-${memory.action}-${memory.key}`}
        >
          <BrainCircuit
            aria-hidden
            className="size-3 shrink-0"
            strokeWidth={1.75}
          />
          <span className="shrink-0">
            {memory.action === "remembered"
              ? CHAT_COPY.memoryRemembered
              : CHAT_COPY.memoryForgotten}
            :
          </span>{" "}
          <span className="type-mono-12 max-w-40 truncate text-foreground">
            {memory.key}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Keep the answer header as quiet metadata: the display name a reader scans
    for, then the canonical id the answer can be checked against. */
function ChatLaneHeader({ lane }: { lane: ChatLane }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <ChatModelLogo model={lane.model} />
      <span className="type-label-14 shrink-0 text-foreground">
        <span className="sr-only">
          {lane.state === "streaming"
            ? CHAT_COPY.replyFrom
            : CHAT_COPY.responded}{" "}
        </span>
        {lane.model.label}
      </span>
      <span className="type-mono-12 min-w-0 truncate text-muted-foreground">
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

interface ChatLaneCardProps {
  /** Only the files the lanes were given differently. */
  attachments: ChatAttachment[];
  lane: ChatLane;
  onRetry?: (messageId: string) => void;
  onStop?: (messageId: string) => void;
}

/** How long the inline "Copied" confirmation holds, the site's value and the
 *  Ask AI reply row's. */
const COPY_HOLD_MS = 3000;

function ChatLaneCard({
  lane,
  attachments,
  onRetry,
  onStop,
}: ChatLaneCardProps) {
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
        <ChatLaneHeader lane={lane} />

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

        <ChatLaneAttachmentNotes attachments={attachments} lane={lane} />

        {lane.memories ? <ChatMemoryChips memories={lane.memories} /> : null}

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
          <ChatUsageRow
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

export interface ChatMessageProps {
  className?: string;
  onRetry?: (messageId: string) => void;
  onStop?: (messageId: string) => void;
  turn: ChatTurn;
}

export function ChatMessage({
  turn,
  onRetry,
  onStop,
  className,
}: ChatMessageProps) {
  const promptId = useId();
  const isComparison = turn.lanes.length > 1;
  const contested = contestedImages(turn.promptAttachments, turn.lanes);

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
        <ChatAttachmentChips
          attachments={turn.promptAttachments}
          lanes={turn.lanes}
        />
        {turn.promptUsage ? (
          <ChatUsageRow
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
          <ChatLaneCard
            attachments={contested}
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
