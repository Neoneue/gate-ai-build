import { ChevronDown, Send } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { VendorAvatar } from "@/components/icons/vendor-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CHAT_TOUCH_TARGET } from "@/pages/chat/chat-layout";
import { ChatModelLogo } from "@/pages/chat/chat-model-logo";
import { CHAT_MAX_INPUT_CHARS } from "@/pages/chat/contract";
import {
  CHAT_COMPOSER_PLACEHOLDER,
  CHAT_COPY,
  composerCountLabel,
} from "@/pages/chat/copy";
import type { ChatModel, ChatNotice, ChatNoticeTone } from "@/pages/chat/types";
import { OnboardingModelSelector } from "@/pages/onboarding/onboarding-model-selector";

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
 * The Onboarding workspace's copy of `pages/chat/chat-composer.tsx`, with no
 * "add a second model" and no attachments (owner 2026-10-11). On the desktop
 * flow the model is fixed: its logo and name, no picker. Mobile A passes
 * `onSelectModel` and gets the main chat's picker back (owner 2026-10-12):
 * the same trigger and the onboarding copy of its picker
 * (`onboarding-model-selector.tsx`, with a Free tab), one lane. Change it
 * here, never in the shared composer.
 */
export interface OnboardingChatComposerProps {
  /** The picker's list; used only with `onSelectModel`. */
  catalog?: readonly ChatModel[];
  className?: string;
  /** True while a lane is streaming: sending pauses, but the next prompt can be drafted. */
  disabled?: boolean;
  /** A landing suggestion can seed and focus the draft without sending it. */
  draftRequest?: { id: number; text: string } | null;
  /** Model routing belongs with the prompt it will affect. */
  models?: ChatModel[];
  notice?: ChatNotice;
  /** Set (Mobile A): the model shows as the picker's trigger. Unset: fixed. */
  onSelectModel?: (modelId: string) => void | Promise<void>;
  /**
   * Returns whether the send succeeded. The draft is cleared only on `true`;
   * a failed send must leave the user's prompt on screen rather than discard it.
   */
  onSend: (text: string) => boolean | Promise<boolean>;
  onToggleFavorite?: (
    modelId: string,
    favorite: boolean
  ) => void | Promise<void>;
  /**
   * Mobile A refused send (owner 2026-10-12): set while a paid model is
   * picked on the free plan. This line takes the placeholder and send is
   * disabled (Enter too). Typing stays on so a draft is never trapped, and
   * the picker stays live: a free model makes the draft sendable again.
   */
  refusedPlaceholder?: string;
}

export function OnboardingChatComposer({
  notice,
  disabled = false,
  onSend,
  draftRequest,
  models = [],
  catalog = [],
  onSelectModel,
  onToggleFavorite,
  refusedPlaceholder,
  className,
}: OnboardingChatComposerProps) {
  const refused = Boolean(refusedPlaceholder);
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
    if (!text || disabled || refused) {
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
        placeholder={refusedPlaceholder ?? CHAT_COMPOSER_PLACEHOLDER}
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

      {/* One toolbar row: the model (flex-1, its label truncating first) and
          send at the far edge. */}
      <div className="flex min-h-8 min-w-0 flex-wrap items-center gap-x-1 gap-y-2 sm:gap-x-3">
        {/* Mobile A: the main composer's one-lane picker trigger
            (chat-composer.tsx), leading the row. With no attach key before
            it, pulling back the Button's own 10px icon padding (the
            sanctioned px-2.5) lands its logo on the prompt's text edge.
            Large text (200%): the logo, chevron and padding alone fill a
            narrow row, so the group keeps a 6rem floor (`min-w-24`, 96px
            at 100%, where the group is always wider). When the row cannot
            give it that floor beside send, send wraps to its own line
            (`ml-auto` keeps it at the right edge) and the name truncates
            instead of vanishing. PRD: the selected model's name is visible
            in the composer before the first send. */}
        {models.length > 0 && onSelectModel ? (
          <div
            aria-label="Models"
            className="flex min-w-24 flex-1 items-center gap-1"
            role="group"
          >
            <OnboardingModelSelector
              models={catalog}
              onSelect={onSelectModel}
              onToggleFavorite={onToggleFavorite}
              selectedId={models[0].id}
              trigger={
                <Button
                  className={cn(
                    CHAT_TOUCH_TARGET,
                    "-ml-2.5 min-w-0 shrink sm:max-w-44 sm:flex-1 sm:basis-0",
                    "pointer-coarse:text-sm pointer-coarse:[&_img]:size-5 pointer-coarse:[&_svg]:size-5"
                  )}
                  size="sm"
                  type="button"
                  variant="ghost"
                />
              }
            >
              <span className="sr-only">{CHAT_COPY.model}: </span>
              <ChatModelLogo model={models[0]} />
              <span className="min-w-0 truncate">{models[0].label}</span>
              <ChevronDown
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground"
                data-icon="inline-end"
                strokeWidth={1.75}
              />
            </OnboardingModelSelector>
          </div>
        ) : null}
        {/* Desktop flow, fixed (owner 2026-10-11): name and logo as text,
            leading the row on the prompt's text edge, one step up from the
            picker's (16px label, 20px logo). */}
        {models.length > 0 && !onSelectModel ? (
          <p className="type-label-16 flex min-w-0 flex-1 items-center gap-2 text-foreground">
            <span className="sr-only">{CHAT_COPY.model}: </span>
            <VendorAvatar decorative size="md" vendor={models[0].provider} />
            <span className="min-w-0 truncate">{models[0].label}</span>
          </p>
        ) : null}
        <Button
          aria-label={CHAT_COPY.sendPrompt}
          className={cn(CHAT_TOUCH_TARGET, "ml-auto shrink-0 sm:ml-0")}
          disabled={disabled || refused || draft.trim().length === 0}
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
