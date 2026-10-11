import { Send } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { VendorAvatar } from "@/components/icons/vendor-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CHAT_TOUCH_TARGET } from "@/pages/chat/chat-layout";
import { CHAT_MAX_INPUT_CHARS } from "@/pages/chat/contract";
import {
  CHAT_COMPOSER_PLACEHOLDER,
  CHAT_COPY,
  composerCountLabel,
} from "@/pages/chat/copy";
import type { ChatModel, ChatNotice, ChatNoticeTone } from "@/pages/chat/types";

/** Far enough from the ceiling to warn in time, late enough that a normal prompt never sees it. */
const COMPOSER_COUNT_VISIBLE_CHARS = 20_000;

/** The composer notice is an inline note inside the composer, so it takes the
 *  15% rung of the status wash ladder (design.md §2). */
const NOTICE_TONE: Record<ChatNoticeTone, string> = {
  info: "bg-muted text-muted-foreground",
  warning:
    "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300",
  danger:
    "bg-danger-50 text-danger-800 dark:bg-destructive/15 dark:text-danger-300",
};

/**
 * The Onboarding workspace's copy of `pages/chat/chat-composer.tsx`. The
 * only difference: the model is fixed. It shows as its logo and name, with
 * no picker, no "add a second model" and no attachments (owner 2026-10-11). Change it here,
 * never in the shared composer.
 */
export interface OnboardingChatComposerProps {
  className?: string;
  /** True while a lane is streaming: sending pauses, but the next prompt can be drafted. */
  disabled?: boolean;
  /** A landing suggestion can seed and focus the draft without sending it. */
  draftRequest?: { id: number; text: string } | null;
  /** Model routing belongs with the prompt it will affect. */
  models?: ChatModel[];
  notice?: ChatNotice;
  /**
   * Returns whether the send succeeded. The draft is cleared only on `true`;
   * a failed send must leave the user's prompt on screen rather than discard it.
   */
  onSend: (text: string) => boolean | Promise<boolean>;
}

export function OnboardingChatComposer({
  notice,
  disabled = false,
  onSend,
  draftRequest,
  models = [],
  className,
}: OnboardingChatComposerProps) {
  const fieldId = useId();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState("");
  const [limitHit, setLimitHit] = useState(false);

  // A landing suggestion seeds the draft during render (React's "store the
  // previous prop" pattern) and focuses the field once it lands.
  const [seededRequest, setSeededRequest] = useState(draftRequest);
  if (draftRequest !== seededRequest) {
    setSeededRequest(draftRequest);
    if (draftRequest) {
      setDraft(draftRequest.text.slice(0, CHAT_MAX_INPUT_CHARS));
      setLimitHit(draftRequest.text.length >= CHAT_MAX_INPUT_CHARS);
    }
  }
  useEffect(() => {
    if (draftRequest) {
      fieldRef.current?.focus();
    }
  }, [draftRequest]);

  const submit = () => {
    const text = draft.trim();
    if (!text || disabled) {
      return;
    }
    Promise.resolve(onSend(text)).then((sent) => {
      if (!sent) {
        return;
      }
      setDraft("");
      setLimitHit(false);
    });
  };

  // A paste past the ceiling is clamped, never dropped in silence.
  const handleChange = (value: string) => {
    setDraft(value.slice(0, CHAT_MAX_INPUT_CHARS));
    setLimitHit(value.length >= CHAT_MAX_INPUT_CHARS);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }
    event.preventDefault();
    submit();
  };

  return (
    <div
      className={cn(
        // The Ask AI composer shell (ask-ai-composer.tsx): the edge goes to
        // --primary while the field has focus.
        "relative flex w-full min-w-0 flex-col gap-3 rounded-md border border-border bg-card-muted p-4 transition-[border-color] duration-150 ease-out focus-within:border-primary motion-reduce:transition-none",
        className
      )}
    >
      {notice ? (
        <div
          className={cn(
            "type-copy-12 -mx-4 -mt-4 flex flex-wrap items-center gap-2 rounded-t-md border-border border-b px-4 py-2",
            NOTICE_TONE[notice.tone]
          )}
          role="status"
        >
          <span className="min-w-0">{notice.text}</span>
          {notice.action ? (
            <Link
              className="type-label-12 shrink-0 rounded-xs text-current underline decoration-current underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              to={notice.action.href}
            >
              {notice.action.label}
            </Link>
          ) : null}
        </div>
      ) : null}

      <label className="sr-only" htmlFor={fieldId}>
        {CHAT_COPY.prompt}
      </label>
      {/* The Ask AI composer's content-sized field: one quiet line at rest
          with 8px of room under it (28px, 32px on touch, where the
          index.css touch rule sets 16/24), four lines before it scrolls,
          with the shell carrying every edge.
          design-allow-clip: the textarea IS the control and holds no
          focusable children; the shell draws its focus state. */}
      <textarea
        className="type-copy-14 field-sizing-content block max-h-20 pointer-coarse:max-h-24 min-h-7 pointer-coarse:min-h-8 w-full resize-none overflow-y-auto border-0 bg-transparent p-0 text-foreground outline-none placeholder:text-muted-foreground"
        id={fieldId}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={CHAT_COMPOSER_PLACEHOLDER}
        ref={fieldRef}
        rows={1}
        value={draft}
      />

      {/* The count is noise until the ceiling is in sight, so it mounts at the
          threshold. */}
      {draft.length >= COMPOSER_COUNT_VISIBLE_CHARS ? (
        <div className="type-copy-12 flex flex-wrap items-center justify-end gap-2">
          <span aria-live="polite" className="text-destructive">
            {limitHit ? CHAT_COPY.composerLimitHint : ""}
          </span>
          <span
            className={cn(
              "type-mono-12",
              limitHit ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {composerCountLabel(draft.length, CHAT_MAX_INPUT_CHARS)}
          </span>
        </div>
      ) : null}

      {/* One toolbar row: the fixed model (flex-1, its label truncating
          first) and send at the far edge. */}
      <div className="flex min-h-8 min-w-0 flex-wrap items-center gap-x-1 gap-y-2 sm:gap-x-3">
        {/* Fixed (owner 2026-10-11): name and logo as text, leading the row
            on the prompt's text edge, one step up from the picker's (16px
            label, 20px logo). */}
        {models.length > 0 ? (
          <p className="type-label-16 flex min-w-0 flex-1 items-center gap-2 text-foreground">
            <span className="sr-only">{CHAT_COPY.model}: </span>
            <VendorAvatar decorative size="md" vendor={models[0].provider} />
            <span className="min-w-0 truncate">{models[0].label}</span>
          </p>
        ) : null}
        <Button
          aria-label={CHAT_COPY.sendPrompt}
          className={cn(CHAT_TOUCH_TARGET, "ml-auto shrink-0 sm:ml-0")}
          disabled={disabled || draft.trim().length === 0}
          onClick={submit}
          shape="circle"
          size="icon-sm"
          type="button"
        >
          <Send aria-hidden strokeWidth={1.75} />
        </Button>
      </div>
    </div>
  );
}
