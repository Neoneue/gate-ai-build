import { ArrowUpRight, CircleCheck, ShieldCheck } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  COMPUTER_PROMPT,
  isSetupLinkRequest,
  ONBOARDING_STARTER_PROMPTS,
  ONBOARDING_TIMING,
} from "@/data/onboarding-chat-script";
import { cn } from "@/lib/utils";
import { CHAT_MEASURE, CHAT_TOUCH_TARGET } from "@/pages/chat/chat-layout";
import { CHAT_COPY } from "@/pages/chat/copy";

/* The Onboarding workspace copy of `pages/chat/chat-landing.tsx`: the same
 * landing and phone chip row. The Mobile A demo uses its onboarding copy
 * (owner 2026-10-11: onboarding should be onboarding focused; copywriter
 * strings from the PRD "Onboarding by device"). The desktop onboarding chat
 * passes the shared landing's title, description and prompts (owner
 * 2026-10-13), and gets the refused send the shared landing cannot draw: the
 * prompts disabled while a paid model is picked. Change it here, never in the
 * shared landing. */
const ONBOARDING_LANDING_TITLE = "Welcome to Gate";
const ONBOARDING_LANDING_DESCRIPTION =
  "Send your first message to get started.";

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

/** From `md` (768px) the starter buttons join the same entrance, between the
 *  description and the workspace line: 100 / 150 / 200ms, 200ms each, then
 *  the workspace line at 250ms (user, 2026-10-06). Below `md` they appear at
 *  once. */
const STARTER_ENTER =
  "md:motion-safe:animate-in md:motion-safe:fade-in-0 md:motion-safe:slide-in-from-bottom-2 md:motion-safe:fill-mode-backwards";
const STARTER_DELAY_START_MS = 100;
const STARTER_DELAY_STEP_MS = 50;

/** Per-line delays: [return, exit]. Literal strings so Tailwind sees them. */
const STEP_ASIDE_DELAY = [
  "motion-safe:delay-150 motion-safe:keyboard-open:delay-0",
  "motion-safe:delay-200 motion-safe:keyboard-open:delay-50",
  "motion-safe:delay-250 motion-safe:keyboard-open:delay-100",
] as const;

export interface OnboardingChatLandingProps {
  className?: string;
  /** The line under the title. Default: the Mobile A line. */
  description?: string;
  /** Refused send: the prompts stay listed but cannot be sent. */
  disabled?: boolean;
  onPromptSelect?: (prompt: string) => void;
  organizationName?: string | null;
  /** The starter prompts. Default: the Mobile A quick actions. */
  prompts?: readonly string[];
  /** Default: the Mobile A title. */
  title?: string;
}

export function OnboardingChatLanding({
  organizationName,
  onPromptSelect,
  disabled = false,
  prompts = ONBOARDING_STARTER_PROMPTS,
  title = ONBOARDING_LANDING_TITLE,
  description = ONBOARDING_LANDING_DESCRIPTION,
  className,
}: OnboardingChatLandingProps) {
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
          {title}
        </h2>
        <p
          className={cn(
            "type-copy-16 max-w-135 text-pretty text-muted-foreground",
            STEP_ASIDE,
            STEP_ASIDE_DELAY[1],
            STEP_ASIDE_ENTER
          )}
          style={{ animationDelay: "50ms" }}
        >
          {description}
        </p>
      </div>

      {/* From `sm` up the prompts are a centered list, capped at the
          description's own 540px (max-w-135, user 2026-10-06) so both share
          one column edge. On a
          phone they move into OnboardingStarterChips, a one-line row docked on
          the composer. */}
      {onPromptSelect ? (
        <div
          aria-label="Starter prompts"
          className="hidden w-full max-w-135 flex-col gap-2 sm:flex"
        >
          {prompts.map((prompt, index) => (
            // The Ask AI suggestion-row recipe (outline + pill + default).
            // `h-auto min-h-10 whitespace-normal` lets a long prompt wrap
            // instead of overflowing the row. The pill inset is 16px, not
            // the Button's 10px icon padding: a fully round end eats into a
            // 10px inset, so the label crowded the curve. Overriding that
            // same `has-data-[icon=inline-end]` variant is what lets the call
            // site win (a bare `px-4` loses to it on specificity), padding
            // only. 40px with a mouse; a coarse pointer gets the chat
            // surface's 44px floor (user, 2026-10-06).
            <Button
              className={cn(
                CHAT_TOUCH_TARGET,
                "h-auto min-h-10 w-full justify-between whitespace-normal text-left has-data-[icon=inline-end]:px-4",
                STARTER_ENTER
              )}
              disabled={disabled}
              key={prompt}
              onClick={() => onPromptSelect(prompt)}
              shape="pill"
              size="default"
              style={{
                animationDelay: `${STARTER_DELAY_START_MS + index * STARTER_DELAY_STEP_MS}ms`,
                // The Button's own duration-150 would set the entrance to
                // 150ms; inline so its hover transition keeps 150ms.
                animationDuration: "200ms",
              }}
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
        // Last in the entrance, after the starter buttons (100-200ms).
        style={{ animationDelay: "250ms" }}
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

export interface OnboardingStarterChipsProps {
  /** Chips 1 and 2 whose question already has a finished reply in this
   *  conversation (OnboardingChat, `answeredStarterPrompts`). Key the row by
   *  conversation so a new chat starts over. */
  answered?: ReadonlySet<string>;
  className?: string;
  /** Refused send: the row still scrolls, every chip is disabled. */
  disabled?: boolean;
  onPromptSelect: (prompt: string) => void;
  /** The chips. Default: the Mobile A quick actions; the desktop chat passes
   *  the shared starter prompts. */
  prompts?: readonly string[];
  /** The setup link was emailed (the chat's offer card or B's phone start):
   *  chip 3 keeps a check and offers the re-send. */
  setupLinkSent?: boolean;
}

/** One quick action's state, on the chip as `data-chip-state` (owner
 *  2026-10-12): `idle` (arrow), `answered` (check, held
 *  `ONBOARDING_TIMING.quickActionAnsweredHold`), `leaving` (the exit, then
 *  the chip is removed after `ONBOARDING_TIMING.quickActionExit`), `sent`
 *  (chip 3 once the link was emailed; it never leaves). The motion for each
 *  is QUICK_ACTION_MOTION below. */
export type QuickActionState = "idle" | "answered" | "leaving" | "sent";

/* ─── Quick action motion (animator, owner 2026-10-12) ─────────────────────
 * Emil Kowalski's feedback recipes, on design.md Motion's values. One beat
 * at a time: the check lands, the hold reads it, the chip goes, the row
 * closes up.
 * - Arrow to check: both glyphs stay mounted and cross-dissolve in one
 *   200ms `--ease-out` beat (opacity, scale from 0.25, 1px blur: the
 *   IconCrossFade shape, icon-cross-fade.tsx).
 * - Exit: after the hold the chip fades and settles to 95% over 150ms
 *   (`quickActionExit`), shorter than the check's 200ms, so it closes faster
 *   than it opened; then it is removed.
 * - Close up: the chips that sat after it slide over 200ms `--ease-out` (a
 *   FLIP on transform, the sliding indicator's timing in segmented-pill.tsx).
 *   Positions are read on screen, so a row scrolled to its end, which the
 *   browser pulls back when the row shrinks, slides instead of jumping.
 * - Chip 3's label change: the pill's width runs from the old label to the
 *   new over 200ms `--ease-out` (the indicator's width move) while the new
 *   label sharpens in from a 2px blur.
 * Reduced motion keeps what explains the change and drops the travel: the
 * glyph swap and the exit are 150ms opacity fades with no scale or blur, the
 * chips after a leaver jump to place and fade up from 50% over 150ms, and
 * the width snaps while the new label fades in. */
const QUICK_ACTION_MOTION = {
  /** Check, slide and width: design.md's sliding-indicator 200ms. */
  move: 200,
  /** Every reduced-motion fade: the ceiling for a reduced crossfade. */
  reducedFade: 150,
} as const;

/** The glyph swap. Hidden takes no scale or blur under reduced motion, so
 *  the outgoing glyph fades in place instead of snapping small. */
const GLYPH_SWAP =
  "absolute size-4 transition-[opacity,scale,filter] duration-200 ease-out motion-reduce:transition-opacity motion-reduce:duration-150";
const GLYPH_SHOWN = "scale-100 opacity-100 blur-0";
const GLYPH_HIDDEN =
  "scale-[0.25] opacity-0 blur-[1px] motion-reduce:scale-100 motion-reduce:blur-none";

/** The exit, on the chip's own wrapper so it never shares a property with
 *  the Button's press scale. No `motion-reduce:transition-none` on purpose:
 *  reduced motion keeps the opacity fade and only drops the scale (owner
 *  2026-10-12, "reduced motion makes this boring"). */
const CHIP_EXIT =
  "transition-[opacity,scale] duration-150 ease-out has-data-[chip-state=leaving]:pointer-events-none has-data-[chip-state=leaving]:scale-95 has-data-[chip-state=leaving]:opacity-0 motion-reduce:has-data-[chip-state=leaving]:scale-100";

const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** design.md's `--ease-out` for the measured (WAAPI) moves, which cannot
 *  take a CSS variable as their easing. */
const easeOut = (element: Element): string =>
  getComputedStyle(element).getPropertyValue("--ease-out").trim() || "ease-out";

/** The starter prompts as a phone surface: one line each, side-scrolling,
 *  docked on top of the composer in thumb reach (the Grok app's pattern).
 *  The row bleeds to the screen edge through the measure's 16px gutter
 *  (`-mx-4 px-4`), so the first pill lines up with the composer and the
 *  last scrolls off the edge instead of stopping short of it. `py-1` with
 *  `-my-1` keeps the 2px focus ring and its 2px offset inside the scroll
 *  container, which would otherwise clip it top and bottom.
 *  Under a thread (owner 2026-10-12): a chip whose question was answered in
 *  this conversation shows a check, holds, then leaves the row; one already
 *  answered when the row mounts (a return to the chat) is gone already.
 *  Chip 3, the setup link, never leaves: once sent it keeps the check and
 *  reads, and sends, `COMPUTER_PROMPT.resend`. */
export function OnboardingStarterChips({
  answered = NO_PROMPTS,
  onPromptSelect,
  disabled = false,
  prompts = ONBOARDING_STARTER_PROMPTS,
  className,
  setupLinkSent = false,
}: OnboardingStarterChipsProps) {
  const [gone, setGone] = useState<ReadonlySet<string>>(
    () => new Set(answered)
  );
  const [leaving, setLeaving] = useState<ReadonlySet<string>>(NO_PROMPTS);
  const chips = useRef(new Map<string, HTMLElement>());
  /** FLIP "first": each chip's on-screen left just before a removal. */
  const before = useRef<Map<string, number> | null>(null);
  const register = useCallback((prompt: string, chip: HTMLElement | null) => {
    if (chip) {
      chips.current.set(prompt, chip);
    } else {
      chips.current.delete(prompt);
    }
  }, []);
  const startLeaving = useCallback((prompt: string) => {
    setLeaving((prev) => new Set([...prev, prompt]));
  }, []);
  const remove = useCallback((prompt: string) => {
    before.current = new Map(
      [...chips.current].map(([key, chip]) => [
        key,
        chip.getBoundingClientRect().left,
      ])
    );
    setGone((prev) => new Set([...prev, prompt]));
  }, []);
  // FLIP "last, invert, play" after the removal commits, before paint.
  useLayoutEffect(() => {
    const first = before.current;
    if (!first) {
      return;
    }
    before.current = null;
    const reduce = prefersReducedMotion();
    for (const [key, chip] of chips.current) {
      const from = first.get(key);
      if (from === undefined) {
        continue;
      }
      const dx = from - chip.getBoundingClientRect().left;
      if (Math.abs(dx) < 0.5) {
        continue;
      }
      chip.animate(
        reduce
          ? [{ opacity: 0.5 }, { opacity: 1 }]
          : [{ transform: `translateX(${dx}px)` }, { transform: "none" }],
        {
          duration: reduce
            ? QUICK_ACTION_MOTION.reducedFade
            : QUICK_ACTION_MOTION.move,
          easing: easeOut(chip),
        }
      );
    }
  });
  return (
    <div
      aria-label="Starter prompts"
      className={cn(
        "-mx-4 -my-1 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none]",
        className
      )}
      role="group"
    >
      {prompts
        .filter((prompt) => !gone.has(prompt))
        .map((prompt) => {
          const setupLink = isSetupLinkRequest(prompt);
          const state: QuickActionState = setupLink
            ? setupLinkSent
              ? "sent"
              : "idle"
            : leaving.has(prompt)
              ? "leaving"
              : answered.has(prompt)
                ? "answered"
                : "idle";
          return (
            <QuickActionChip
              disabled={disabled}
              key={prompt}
              label={state === "sent" ? COMPUTER_PROMPT.resend : prompt}
              onExited={remove}
              onHoldEnd={startLeaving}
              onSelect={onPromptSelect}
              prompt={prompt}
              register={register}
              state={state}
            />
          );
        })}
    </div>
  );
}

const NO_PROMPTS: ReadonlySet<string> = new Set();

/** One quick action. `answered` holds, then calls `onHoldEnd`; `leaving`
 *  waits the exit, then calls `onExited`, which removes the chip. The
 *  timers live here so each chip keeps its own clock. */
function QuickActionChip({
  disabled,
  label,
  onExited,
  onHoldEnd,
  onSelect,
  prompt,
  register,
  state,
}: {
  disabled: boolean;
  label: string;
  onExited: (prompt: string) => void;
  onHoldEnd: (prompt: string) => void;
  onSelect: (prompt: string) => void;
  prompt: string;
  register: (prompt: string, chip: HTMLElement | null) => void;
  state: QuickActionState;
}) {
  const wrapper = useRef<HTMLSpanElement | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const setWrapper = useCallback(
    (chip: HTMLSpanElement | null) => {
      wrapper.current = chip;
      register(prompt, chip);
    },
    [prompt, register]
  );
  useEffect(() => {
    if (state !== "answered" && state !== "leaving") {
      return;
    }
    const timer = setTimeout(
      () => {
        if (state === "leaving") {
          onExited(prompt);
          return;
        }
        // Focus on the chip about to go moves to its neighbour first (chip
        // 3 never leaves, so there always is one), never lost to the page.
        // No scroll: the row must not jump while it closes up.
        const chip = wrapper.current;
        if (chip?.contains(document.activeElement)) {
          const next = chip.nextElementSibling ?? chip.previousElementSibling;
          next?.querySelector("button")?.focus({ preventScroll: true });
        }
        onHoldEnd(prompt);
      },
      state === "answered"
        ? ONBOARDING_TIMING.quickActionAnsweredHold
        : ONBOARDING_TIMING.quickActionExit
    );
    return () => clearTimeout(timer);
  }, [state, prompt, onHoldEnd, onExited]);
  // The pill's border-box width as last laid out, kept current by the
  // browser, so a label change knows the width it is growing from.
  const width = useRef(0);
  useEffect(() => {
    const pill = button.current;
    if (!pill) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      width.current = entry?.borderBoxSize[0]?.inlineSize ?? pill.offsetWidth;
    });
    observer.observe(pill, { box: "border-box" });
    return () => observer.disconnect();
  }, []);
  // Chip 3's label change, before paint: the new label sharpens in and the
  // pill's width runs from the old label's to the new. While the pill is
  // narrower than its text the label clips (min-w-0 lets it shrink), so the
  // check rides the growing edge and the focus ring is never cut.
  const shownLabel = useRef(label);
  useLayoutEffect(() => {
    if (shownLabel.current === label) {
      return;
    }
    shownLabel.current = label;
    const pill = button.current;
    const words = text.current;
    if (!(pill && words)) {
      return;
    }
    const reduce = prefersReducedMotion();
    const easing = easeOut(pill);
    words.animate(
      reduce
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [
            { filter: "blur(2px)", opacity: 0 },
            { filter: "blur(0)", opacity: 1 },
          ],
      {
        duration: reduce
          ? QUICK_ACTION_MOTION.reducedFade
          : QUICK_ACTION_MOTION.move,
        easing,
      }
    );
    const from = width.current;
    const to = pill.getBoundingClientRect().width;
    if (reduce || from === 0 || Math.abs(from - to) < 0.5) {
      return;
    }
    words.style.overflow = "hidden";
    const morph = pill.animate([{ width: `${from}px` }, { width: `${to}px` }], {
      duration: QUICK_ACTION_MOTION.move,
      easing,
    });
    const settle = () => words.style.removeProperty("overflow");
    morph.onfinish = settle;
    morph.oncancel = settle;
  }, [label]);
  const checked = state !== "idle";
  return (
    <span
      className={cn("flex shrink-0", CHIP_EXIT)}
      inert={state === "leaving"}
      ref={setWrapper}
    >
      <Button
        // 40px with a mouse, the chat surface's 44px floor on touch
        // (user, 2026-10-06).
        className={cn(
          CHAT_TOUCH_TARGET,
          "h-10 has-data-[icon=inline-end]:px-4"
        )}
        data-chip-state={state}
        disabled={disabled}
        onClick={() => onSelect(label)}
        ref={button}
        shape="pill"
        size="default"
        type="button"
        variant="outline"
      >
        <span className="min-w-0" ref={text}>
          {label}
        </span>
        {/* Both glyphs stay mounted for the cross-dissolve; the check is the
            repo's done glyph (onboarding-chrome.tsx TaskGlyph). */}
        <span
          aria-hidden
          className="relative inline-flex size-4 shrink-0 items-center justify-center"
          data-icon="inline-end"
        >
          <ArrowUpRight
            className={cn(
              GLYPH_SWAP,
              checked ? GLYPH_HIDDEN : GLYPH_SHOWN,
              "text-muted-foreground"
            )}
            strokeWidth={1.75}
          />
          <CircleCheck
            className={cn(
              GLYPH_SWAP,
              checked ? GLYPH_SHOWN : GLYPH_HIDDEN,
              "text-success-600 dark:text-success-400"
            )}
            strokeWidth={1.75}
          />
        </span>
      </Button>
    </span>
  );
}
