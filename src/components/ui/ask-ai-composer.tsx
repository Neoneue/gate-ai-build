import { Plus, Send, Square } from "lucide-react";
import { type KeyboardEvent, type RefObject, useState } from "react";
import { Button } from "@/components/ui/button";
import type { AskAiPhase } from "@/hooks/use-ask-ai-thread";
import { cn } from "@/lib/utils";

/* ─── AskAiComposer — the Ask AI chat box ───────────────────────────────────
 * Figma: Research / node 1125:5376 ("Frame 24"), 334×116 at 16px inset inside
 * the 366px panel. Measurements taken from get_metadata / get_design_context,
 * not eyeballed:
 *
 *   shell      16px padding all sides · 8px radius · 1px border
 *   textarea   Geist Regular 14/20 (`copy/14` variable → type-copy-14)
 *   gap        12px between textarea and the actions row  (gap-3)
 *   actions    32px tall · plus 24×24 · send 32×32 · both circular, 16px icon
 *
 * Growth: `field-sizing-content` sizes the textarea to its content, clamped to
 * exact multiples of the 20px line-height — min-h-5 (1 line) → max-h-20
 * (4 lines) — after which the text scrolls and the shell stops growing. The
 * textarea carries no padding or border of its own so those heights stay exact.
 * The shell therefore stands at 98 / 118 / 138 / 158px, and `rootRef` exists so
 * the panel can MEASURE that instead of predicting it — the scroll-to-latest
 * control rides a fixed distance above this box (see `ask-ai-panel.tsx`).
 *
 * The `Plus` key is intentionally unwired; it carries the press affordance and
 * label so wiring it later is a no-op on the visuals. The send key IS wired —
 * `onSend` submits and `onStop` interrupts, and the glyph swaps to `Square`
 * while the agent works. ──────────────────────────────────────────────────── */

/* Placeholder swaps with the agent's phase (Figma frames `1107:2962` /
   `1096:5471` show the replying copy in the field). The field stays editable
   throughout — only the prompt text changes. */
const PLACEHOLDER =
  "Ask Gatekeeper a question or type /help to see a list of options";
const PLACEHOLDER_BY_PHASE: Partial<Record<AskAiPhase, string>> = {
  thinking: "The Gatekeeper is thinking…",
  replying: "The Gatekeeper is replying…",
};

/* The two action keys are `Button shape="circle"` — the press convention,
   focus ring, and reduced-motion handling all come from the primitive. This
   file used to carry its own hand-rolled copy of that recipe; it doesn't
   any more. */

export interface AskAiComposerProps {
  className?: string;
  /** Called with the trimmed text. The field clears itself on submit. */
  onSend?: (text: string) => void;
  /** Halt an in-flight reply, keeping whatever has already streamed. */
  onStop?: () => void;
  /** Drives the placeholder and the send/stop swap. */
  phase?: AskAiPhase;
  /** The SHELL, not the field. Handed up so the panel can measure this box —
      the field grows in 20px steps and the panel's scroll-to-latest control
      sits a fixed distance above whatever height that lands on. It is the
      shell rather than the textarea deliberately: the panel then needs to know
      nothing about the 16px padding, 1px borders, 12px gap, or 32px actions row
      that sit around the field. */
  rootRef?: RefObject<HTMLDivElement | null>;
  /** Handed up so the panel can put the caret here (open, post-send). */
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
}

export function AskAiComposer({
  className,
  phase = "idle",
  onSend,
  onStop,
  rootRef,
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
      ref={rootRef}
    >
      <textarea
        aria-label="Ask Gatekeeper"
        className="type-copy-14 field-sizing-content block max-h-20 min-h-5 w-full resize-none overflow-y-auto border-0 bg-transparent p-0 text-foreground outline-none placeholder:text-muted-foreground"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={PLACEHOLDER_BY_PHASE[phase] ?? PLACEHOLDER}
        ref={textareaRef}
        rows={1}
        value={value}
      />
      <div className="flex h-8 items-center justify-between">
        <Button
          aria-label="Add context"
          shape="circle"
          size="icon-xs"
          type="button"
          variant="raised"
        >
          <Plus aria-hidden strokeWidth={1.75} />
        </Button>
        {/* One 32px circle in two roles — send, or stop while the agent works
            (Figma swaps the glyph to `Icon / Square`, node `1125:5428`). The
            BUTTON stops without sending; Enter with text sends and interrupts.
            `opacity-*` is state, not chrome — the only thing this call site is
            allowed to say about how the control looks. */}
        <Button
          aria-label={isBusy ? "Stop replying" : "Send message"}
          className={hasText || isBusy ? "opacity-100" : "opacity-50"}
          onClick={isBusy ? onStop : submit}
          shape="circle"
          size="icon-sm"
          type="button"
        >
          {isBusy ? (
            <Square aria-hidden strokeWidth={1.75} />
          ) : (
            <Send aria-hidden strokeWidth={1.75} />
          )}
        </Button>
      </div>
    </div>
  );
}
