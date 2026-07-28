import { Plus, Send, Square } from "lucide-react";
import { type KeyboardEvent, type RefObject, useState } from "react";
import type { AskAiPhase } from "@/hooks/use-ask-ai-thread";
import { cn } from "@/lib/utils";

/* ─── AskAiComposer — the Ask AI chat box ───────────────────────────────────
 * Figma: Research / node 1125:5376 ("Frame 24"), 334×116 at 16px inset inside
 * the 366px panel. Measurements taken from get_metadata / get_design_context,
 * not eyeballed:
 *
 *   shell      16px padding all sides · 8px radius · 1px border
 *   textarea   Geist Regular 14/20 (`copy/14` variable → type-copy-14-tight)
 *   gap        12px between textarea and the actions row  (gap-3)
 *   actions    32px tall · plus 24×24 · send 32×32 · both circular, 16px icon
 *
 * Growth: `field-sizing-content` sizes the textarea to its content, clamped to
 * exact multiples of the 20px line-height — min-h-5 (1 line) → max-h-20
 * (4 lines) — after which the text scrolls and the shell stops growing. The
 * textarea carries no padding or border of its own so those heights stay exact.
 *
 * Both buttons are intentionally unwired; they carry the press affordance and
 * labels so wiring them later is a no-op on the visuals. ─────────────────── */

/* Placeholder swaps with the agent's phase (Figma frames `1107:2962` /
   `1096:5471` show the replying copy in the field). The field stays editable
   throughout — only the prompt text changes. */
const PLACEHOLDER =
  "Ask Gatekeeper a question or type /help to see a list of options";
const PLACEHOLDER_BY_PHASE: Partial<Record<AskAiPhase, string>> = {
  thinking: "The Gatekeeper is thinking…",
  replying: "The Gatekeeper is replying…",
};

/* Shared circular-action recipe. Mirrors the <Button> press convention:
   scale-DOWN to 0.98 over 150ms ease-out, promoted with will-change-transform,
   and dropped entirely under prefers-reduced-motion. `shadow-xs` is the repo's
   button/card lift tier (design.md §5) and the equivalent of the mock's
   `shadow/sm` — it is theme-aware, unlike Tailwind's stock shadow. */
const ACTION_BUTTON =
  "flex shrink-0 select-none items-center justify-center rounded-full shadow-xs outline-none transition-[colors,opacity,box-shadow,scale] duration-150 ease-out will-change-transform focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100";

export interface AskAiComposerProps {
  className?: string;
  /** Called with the trimmed text. The field clears itself on submit. */
  onSend?: (text: string) => void;
  /** Halt an in-flight reply, keeping whatever has already streamed. */
  onStop?: () => void;
  /** Drives the placeholder and the send/stop swap. */
  phase?: AskAiPhase;
  /** Handed up so the panel can put the caret here (open, post-send). */
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
}

export function AskAiComposer({
  className,
  phase = "idle",
  onSend,
  onStop,
  textareaRef,
}: AskAiComposerProps) {
  const [value, setValue] = useState("");
  const hasText = value.trim().length > 0;
  const isBusy =
    phase === "sending" || phase === "thinking" || phase === "replying";

  /* Sends even while the agent is busy — that is an INTERRUPT: the in-flight
     reply is aborted where it stands and this question takes over. Empty or
     whitespace-only input is still rejected, busy or not. */
  const submit = () => {
    if (!hasText) {
      return;
    }
    onSend?.(value);
    setValue("");
  };

  // Enter sends, Shift+Enter (and IME composition) inserts a newline.
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !(event.shiftKey || event.nativeEvent.isComposing)
    ) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div
      className={cn(
        // Raised wash on the panel's bg-card surface — matches the mock's
        // neutral-800-on-neutral-900 step, and inverts correctly in light.
        // Border highlights to --primary while the textarea holds focus.
        "flex flex-col gap-3 rounded-md border border-border bg-card-muted p-4 transition-colors focus-within:border-primary",
        className
      )}
    >
      <textarea
        aria-label="Ask Gatekeeper"
        className="type-copy-14-tight field-sizing-content block max-h-20 min-h-5 w-full resize-none overflow-y-auto border-0 bg-transparent p-0 text-foreground outline-none placeholder:text-muted-foreground"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={PLACEHOLDER_BY_PHASE[phase] ?? PLACEHOLDER}
        ref={textareaRef}
        rows={1}
        value={value}
      />
      <div className="flex h-8 items-center justify-between">
        <button
          aria-label="Add context"
          className={cn(
            ACTION_BUTTON,
            "size-6 border border-border bg-control-raised text-accent-foreground"
          )}
          type="button"
        >
          <Plus aria-hidden className="size-4" strokeWidth={1.75} />
        </button>
        {/* One 32px circle in two roles — send, or stop while the agent works
            (Figma swaps the glyph to `Icon / Square`, node `1125:5428`). The
            BUTTON stops without sending; Enter with text sends and interrupts. */}
        <button
          aria-label={isBusy ? "Stop replying" : "Send message"}
          className={cn(
            ACTION_BUTTON,
            "size-8 bg-primary text-primary-foreground-soft",
            hasText || isBusy ? "opacity-100" : "opacity-50"
          )}
          onClick={isBusy ? onStop : submit}
          type="button"
        >
          {isBusy ? (
            <Square aria-hidden className="size-4" strokeWidth={1.75} />
          ) : (
            <Send aria-hidden className="size-4" strokeWidth={1.75} />
          )}
        </button>
      </div>
    </div>
  );
}
