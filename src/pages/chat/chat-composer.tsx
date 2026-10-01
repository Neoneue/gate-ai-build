import { ChevronDown, Plus, Send, X } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ChatAttachmentPicker } from "./chat-attachment-picker";
import { CHAT_TOUCH_TARGET } from "./chat-layout";
import { ChatModelLogo } from "./chat-model-logo";
import { ChatModelSelector } from "./chat-model-selector";
import { CHAT_MAX_INPUT_CHARS } from "./contract";
import {
  CHAT_COMPOSER_PLACEHOLDER,
  CHAT_COPY,
  composerCountLabel,
  modelSlotLabel,
} from "./copy";
import type { ChatModel, ChatNotice, ChatNoticeTone } from "./types";

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

export interface ChatComposerProps {
  catalog?: readonly ChatModel[];
  catalogError?: unknown;
  catalogLoading?: boolean;
  className?: string;
  /** True while a lane is streaming: sending pauses, but the next prompt can be drafted. */
  disabled?: boolean;
  /** A landing suggestion can seed and focus the draft without sending it. */
  draftRequest?: { id: number; text: string } | null;
  /** Model routing belongs with the prompt it will affect. */
  models?: ChatModel[];
  notice?: ChatNotice;
  onAddComparisonModel?: (modelId: string) => void | Promise<void>;
  onRemoveComparisonModel?: () => void | Promise<void>;
  onRetryCatalog?: () => void;
  onSelectLaneModel?: (
    laneIndex: number,
    modelId: string
  ) => void | Promise<void>;
  /**
   * Returns whether the send succeeded. The draft is cleared only on `true`;
   * a failed send must leave the user's prompt on screen rather than discard it.
   */
  onSend: (text: string) => boolean | Promise<boolean>;
  onToggleFavorite?: (
    modelId: string,
    favorite: boolean
  ) => void | Promise<void>;
}

export function ChatComposer({
  notice,
  disabled = false,
  onSend,
  draftRequest,
  models = [],
  catalog = [],
  onSelectLaneModel,
  onAddComparisonModel,
  onRemoveComparisonModel,
  onToggleFavorite,
  catalogLoading,
  catalogError,
  onRetryCatalog,
  className,
}: ChatComposerProps) {
  const fieldId = useId();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState("");
  const [limitHit, setLimitHit] = useState(false);
  const usedModelIds = new Set(models.map((model) => model.id));
  const comparisonCandidates = catalog.filter(
    (model) => model.available && !usedModelIds.has(model.id)
  );

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
      {/* The Ask AI composer's content-sized field: one quiet line at rest,
          four lines before it scrolls, with the shell carrying every edge.
          design-allow-clip: the textarea IS the control and holds no
          focusable children; the shell draws its focus state. */}
      <textarea
        className="type-copy-14 field-sizing-content block max-h-20 min-h-5 w-full resize-none overflow-y-auto border-0 bg-transparent p-0 text-foreground outline-none placeholder:text-muted-foreground"
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

      {/* One wrapping row. On a phone the model controls take a full-width
          line of their own (order 1) and the send and attach controls share
          the line below. From `sm` up the four parts sit on one line. */}
      <div className="flex min-h-8 min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <ChatAttachmentPicker
          className="order-2 shrink-0 sm:order-1"
          models={models}
        />

        {models.length > 0 && onSelectLaneModel ? (
          <>
            <Separator
              className="order-2 hidden h-5 shrink-0 self-center sm:order-2 sm:block"
              orientation="vertical"
            />
            <div
              aria-label="Models"
              className="order-1 flex w-full min-w-0 items-center gap-1 sm:order-3 sm:w-auto sm:flex-1"
              role="group"
            >
              {models.map((model, index) => {
                const slot =
                  models.length > 1 ? modelSlotLabel(index) : CHAT_COPY.model;
                const laneCatalog = catalog.filter(
                  (candidate) =>
                    candidate.id === model.id ||
                    !models.some(
                      (other, otherIndex) =>
                        otherIndex !== index && other.id === candidate.id
                    )
                );
                return (
                  <ChatModelSelector
                    error={catalogError}
                    isLoading={catalogLoading}
                    key={`${model.id}-${index}`}
                    models={laneCatalog}
                    onRetry={onRetryCatalog}
                    onSelect={(modelId) => onSelectLaneModel(index, modelId)}
                    onToggleFavorite={onToggleFavorite}
                    selectedId={model.id}
                    slotLabel={models.length > 1 ? slot : undefined}
                    trigger={
                      <Button
                        className={cn(
                          CHAT_TOUCH_TARGET,
                          "min-w-0 flex-1 basis-0 sm:max-w-44"
                        )}
                        size="sm"
                        type="button"
                        variant="ghost"
                      />
                    }
                  >
                    <span className="sr-only">{slot}: </span>
                    {models.length > 1 ? (
                      <span
                        aria-hidden
                        className="type-label-12 shrink-0 text-muted-foreground"
                      >
                        {index + 1}
                      </span>
                    ) : null}
                    <ChatModelLogo model={model} />
                    <span className="min-w-0 truncate">{model.label}</span>
                    <ChevronDown
                      aria-hidden
                      className="size-4 shrink-0 text-muted-foreground"
                      data-icon="inline-end"
                      strokeWidth={1.75}
                    />
                  </ChatModelSelector>
                );
              })}

              {models.length === 1 &&
              onAddComparisonModel &&
              comparisonCandidates.length > 0 ? (
                <ChatModelSelector
                  error={catalogError}
                  isLoading={catalogLoading}
                  models={comparisonCandidates}
                  onRetry={onRetryCatalog}
                  onSelect={onAddComparisonModel}
                  onToggleFavorite={onToggleFavorite}
                  selectedId=""
                  trigger={
                    <Button
                      className={cn(CHAT_TOUCH_TARGET, "shrink-0")}
                      size="sm"
                      type="button"
                      variant="ghost"
                    />
                  }
                >
                  <Plus
                    aria-hidden
                    className="size-4"
                    data-icon="inline-start"
                    strokeWidth={1.75}
                  />
                  <span className="sr-only sm:not-sr-only">
                    {CHAT_COPY.addComparisonModel}
                  </span>
                </ChatModelSelector>
              ) : null}

              {models.length > 1 && onRemoveComparisonModel ? (
                <Button
                  aria-label={CHAT_COPY.removeComparisonModel}
                  className={cn(CHAT_TOUCH_TARGET, "shrink-0")}
                  onClick={onRemoveComparisonModel}
                  size="icon-sm"
                  title={CHAT_COPY.removeComparisonModel}
                  type="button"
                  variant="ghost"
                >
                  <X aria-hidden className="size-4" strokeWidth={1.75} />
                </Button>
              ) : null}
            </div>
          </>
        ) : null}
        <Button
          aria-label={CHAT_COPY.sendPrompt}
          className={cn(
            CHAT_TOUCH_TARGET,
            "order-3 ml-auto shrink-0 sm:order-4 sm:ml-0"
          )}
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
