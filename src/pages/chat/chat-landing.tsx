import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CHAT_MEASURE, CHAT_TOUCH_TARGET } from "./chat-layout";
import { CHAT_COPY, CHAT_STARTER_PROMPTS } from "./copy";

/** The landing steps aside while an on-screen keyboard is open (the
 *  `keyboard-open` variant, set by useVisualViewportVars), not merely on
 *  focus: a desktop, even a narrow one or DevTools' phone mode, opens no
 *  keyboard, so the title and text stay. Title, description and workspace
 *  line each fade out and lift 8px over 150ms, staggered 50ms top to bottom
 *  so the last is gone at 250ms, inside the keyboard's own rise. They keep
 *  their space, so nothing below reflows.
 *  The return is a different move on purpose: translate is not transitioned,
 *  so each line snaps home while still invisible, and the fades wait 150ms
 *  for the keyboard to finish closing (the landing re-centres as the
 *  viewport grows), then run 200ms in place, same order, same 50ms steps.
 *  Fading back in during that re-centre, with the 8px drop on top, read as
 *  a pop. Reduced motion: no transitions, the lines simply hide and return. */
const STEP_ASIDE =
  "keyboard-open:-translate-y-2 keyboard-open:opacity-0 motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-out motion-safe:keyboard-open:transition-[opacity,translate] motion-safe:keyboard-open:duration-150";

/** Page load: the same three lines fade in and rise 8px, 200ms each,
 *  staggered 50ms by an inline `animationDelay` (the Models featured-row
 *  precedent, design.md Motion). `fill-mode-backwards` holds each line
 *  hidden through its delay. */
const STEP_ASIDE_ENTER =
  "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-backwards";

/** Per-line delays: [return, exit]. Literal strings so Tailwind sees them. */
const STEP_ASIDE_DELAY = [
  "motion-safe:delay-150 motion-safe:keyboard-open:delay-0",
  "motion-safe:delay-200 motion-safe:keyboard-open:delay-50",
  "motion-safe:delay-250 motion-safe:keyboard-open:delay-100",
] as const;

export interface ChatLandingProps {
  className?: string;
  onPromptSelect?: (prompt: string) => void;
  organizationName?: string | null;
}

export function ChatLanding({
  organizationName,
  onPromptSelect,
  className,
}: ChatLandingProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      // gap-6: the site's 28px section gap is an odd 4-multiple, which
      // design.md §4 bars at the surface tier; 24px is the nearest rung.
      className={cn(
        CHAT_MEASURE,
        "flex w-full max-w-2xl flex-col items-center gap-6 text-center",
        className
      )}
    >
      {/* Steps aside on focus, staggered with the workspace line below:
          STEP_ASIDE at the top of this file. */}
      <div className="flex max-w-2xl flex-col items-center gap-3">
        <h2
          className={cn(
            "type-heading-32 text-balance text-foreground",
            STEP_ASIDE,
            STEP_ASIDE_DELAY[0],
            STEP_ASIDE_ENTER
          )}
          id={titleId}
          style={{ animationDelay: "0ms" }}
        >
          {CHAT_COPY.landingTitle}
        </h2>
        <p
          className={cn(
            "type-copy-16 max-w-xl text-pretty text-muted-foreground",
            STEP_ASIDE,
            STEP_ASIDE_DELAY[1],
            STEP_ASIDE_ENTER
          )}
          style={{ animationDelay: "50ms" }}
        >
          {CHAT_COPY.landingDescription}
        </p>
      </div>

      {/* From `sm` up the prompts are a centered list. On a phone they move
          into ChatStarterChips, a one-line row docked on the composer. */}
      {onPromptSelect ? (
        <div
          aria-label="Starter prompts"
          className="hidden w-full flex-col gap-2 sm:flex"
        >
          {CHAT_STARTER_PROMPTS.map((prompt) => (
            // The Ask AI suggestion-row recipe (outline + pill + default).
            // `h-auto min-h-9 whitespace-normal` lets a long prompt wrap
            // instead of overflowing the row. The pill inset is 16px, not
            // the Button's 10px icon padding: a fully round end eats into a
            // 10px inset, so the label crowded the curve. Overriding that
            // same `has-data-[icon=inline-end]` variant is what lets the call
            // site win (a bare `px-4` loses to it on specificity), padding
            // only. A coarse pointer gets the chat surface's 44px floor.
            <Button
              className={cn(
                CHAT_TOUCH_TARGET,
                "h-auto min-h-9 w-full justify-between whitespace-normal text-left has-data-[icon=inline-end]:px-4"
              )}
              key={prompt}
              onClick={() => onPromptSelect(prompt)}
              shape="pill"
              size="default"
              type="button"
              variant="outline"
            >
              <span className="text-balance">{prompt}</span>
              <ArrowUpRight
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground"
                data-icon="inline-end"
                strokeWidth={1.75}
              />
            </Button>
          ))}
        </div>
      ) : null}

      <p
        className={cn(
          "type-label-12 flex items-center justify-center gap-2 text-muted-foreground",
          STEP_ASIDE,
          STEP_ASIDE_DELAY[2],
          STEP_ASIDE_ENTER
        )}
        style={{ animationDelay: "100ms" }}
      >
        <ShieldCheck
          aria-hidden
          className="size-4 shrink-0"
          strokeWidth={1.75}
        />
        <span>
          {organizationName
            ? `${organizationName} · ${CHAT_COPY.protectedByGate}`
            : CHAT_COPY.protectedByGate}
        </span>
      </p>
    </section>
  );
}

export interface ChatStarterChipsProps {
  className?: string;
  onPromptSelect: (prompt: string) => void;
}

/** The starter prompts as a phone surface: one line each, side-scrolling,
 *  docked on top of the composer in thumb reach (the Grok app's pattern).
 *  The row bleeds to the screen edge through the measure's 16px gutter
 *  (`-mx-4 px-4`), so the first pill lines up with the composer and the
 *  last scrolls off the edge instead of stopping short of it. `py-1` with
 *  `-my-1` keeps the 2px focus ring and its 2px offset inside the scroll
 *  container, which would otherwise clip it top and bottom. */
export function ChatStarterChips({
  onPromptSelect,
  className,
}: ChatStarterChipsProps) {
  return (
    <div
      aria-label="Starter prompts"
      className={cn(
        "-mx-4 -my-1 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none]",
        className
      )}
      role="group"
    >
      {CHAT_STARTER_PROMPTS.map((prompt) => (
        <Button
          className={cn(CHAT_TOUCH_TARGET, "has-data-[icon=inline-end]:px-4")}
          key={prompt}
          onClick={() => onPromptSelect(prompt)}
          shape="pill"
          size="default"
          type="button"
          variant="outline"
        >
          {prompt}
          <ArrowUpRight
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground"
            data-icon="inline-end"
            strokeWidth={1.75}
          />
        </Button>
      ))}
    </div>
  );
}
