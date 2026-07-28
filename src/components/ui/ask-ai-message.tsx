import {
  BotMessageSquare,
  Copy,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ─── Ask AI chat bubbles ────────────────────────────────────────────────────
 * Figma (Research file): thread `1125:4374` is the authority for type styles
 * and copy; `1096:5471` + `1114:7141` are the LIGHT twins and `1108:4193` /
 * `1107:2962` the DARK ones, diffed to confirm every surface and ink here is a
 * token that actually flips rather than a light-mode guess.
 *
 * Surfaces (light / dark, transcribed from the twin nodes — all four agree):
 *   user bubble   neutral-100 / neutral-800 → --chat-bubble-user
 *   user ink      neutral-950 / neutral-100 → --chat-bubble-user-foreground
 *   agent bubble  white       / neutral-950 → --chat-bubble-agent
 *   agent ink     neutral-900 / neutral-200 → --chat-bubble-agent-foreground
 *   inline code   neutral-100 / neutral-800 → --muted   (exact in both)
 *   border + rule neutral-200 / neutral-800 → --border
 *
 * The two bubble pairs are their own tokens because no existing pair inverts
 * the way the agent bubble has to (lighter than the panel in light, DARKER in
 * dark), and because --secondary/--muted are both neutral-800 in dark, which
 * would collapse the user chip into the composer. See index.css for the full
 * reasoning at the definitions.
 *
 * Radius ladder is concentric per design.md: 8px bubble (rounded-md) → 4px
 * inline code / code block (rounded-xs). ─────────────────────────────────── */

/* ─── ReplyProse — scoped typographic treatment for RENDERED MARKDOWN ────────
 * The agent is a placeholder; a real LLM will soon emit markdown rendered to
 * plain HTML. So this is a SCOPE keyed off element type, not a set of bespoke
 * components — swapping in a markdown renderer later requires no restyling.
 *
 * Why the recipes are written out instead of `[&_h3]:type-heading-16`: the
 * `type-*` voices live in `@layer components` in index.css, which Tailwind v4
 * does NOT register as utilities, so they cannot be composed with a variant.
 * Each line below therefore reproduces one voice EXACTLY and names it. If the
 * voices were promoted from `@layer components` to `@utility`, this scope
 * could reference them by name — a token-layer change, deliberately not made
 * here.
 *
 * Element → voice map (see the handoff for the full list + open questions):
 *   p, li, td      type-copy-14-tight   ← inherited from the wrapper
 *   h3             type-heading-16      ← the ONLY heading Figma exercises
 *                                         (its source markdown used `###`),
 *                                         plus the 1px rule under it
 *   h1 / h2 / h4   type-heading-20 / -18 / -14  ← nearest rungs of the same
 *                                         existing ladder, not from Figma
 *   strong         font-medium (weight ceiling)
 *   a              underline only — Figma changes no colour or size
 *   code, pre      type-copy-14-tight on --muted — SANS, not the mono Data
 *                  voice. See design.md "Exception: Ask AI reply prose"
 *                  (2026-07-27). Do not revert to mono.
 *   hr             --border hairline
 * NOT styled on purpose — no obvious design.md voice, escalated instead:
 *   blockquote, table/thead/tbody/th/td chrome, em
 * ────────────────────────────────────────────────────────────────────────── */

const REPLY_PROSE = cn(
  // Base voice for everything: type-copy-14-tight (font-sans text-sm/5 font-normal).
  // `break-words` is Figma's `word-break: break-word` — without it a bare URL
  // (the reply is full of them) runs past the bubble's padding edge. Ink is
  // deliberately NOT set here — the scope inherits it, so <AgentMessage> owns
  // --chat-bubble-agent-foreground in exactly one place.
  /* Block rhythm.
     Derived by pixel-measuring the RENDERED Figma node `1125:4382`, because
     the declared auto-layout gaps (8px) and the rendered result disagree: the
     mock's text frames carry pasted-markdown blank lines that a real renderer
     will not emit. Measured blank bands, minus the 6.2px intra-paragraph
     baseline: paragraph→paragraph 27.9 → ~20px; paragraph→heading 35.7 → ~28px.
     That 7.8px difference is exactly Figma's declared 8px frame gap, so the
     model is "one blank line box (20px) between blocks, plus 8px more above a
     heading". Both land on the 4px grid.

     Implemented as flex `gap-5` rather than `[&>*+*]:mt-5` on purpose: a
     universal-selector margin (0,1,0) LOSES to the typed `[&_p]:m-0` reset
     (0,1,1), so the margin form silently did nothing. A flex gap takes no part
     in specificity, and it applies only BETWEEN children — no leading or
     trailing space inside the bubble, whatever sequence a renderer emits. */
  "type-copy-14-tight flex flex-col gap-5 break-words",
  // Reset UA margins on direct children only; the gap owns the base rhythm.
  "[&>*]:m-0",
  // Nested resets (the `>*` reset does not reach these).
  "[&_li>p]:m-0 [&_li]:m-0 [&_ol]:my-0 [&_ul]:my-0",
  "[&_h1]:text-pretty [&_h2]:text-pretty [&_h3]:text-pretty [&_h4]:text-pretty [&_li]:text-pretty [&_p]:text-pretty",
  /* Headings take 8px MORE above than a plain block (20 + 8 = 28px). Margin
     adds on top of the flex gap. Typed selectors (0,1,1) outrank the `[&>*]`
     reset (0,1,0), so this wins deterministically rather than by emit order,
     and `*+` keeps a leading heading flush with the bubble's padding. */
  "[&>*+h1]:mt-2 [&>*+h2]:mt-2 [&>*+h3]:mt-2 [&>*+h4]:mt-2",
  // h3 — Figma `heading/16`: Geist Medium 16/24, tracking -0.16px. That is
  // exactly type-heading-16 (text-base/6 font-medium tracking-snug; snug =
  // -0.01em = -0.16px at 16px). The rule under it is Figma's `Line 7`,
  // 8px below the text, reproduced as a bottom border so any markdown h3 gets it.
  "[&_h3]:border-border [&_h3]:border-b [&_h3]:pb-2 [&_h3]:font-medium [&_h3]:font-sans [&_h3]:text-base/6 [&_h3]:tracking-snug",
  // h1 / h2 / h4 — not exercised by Figma. Nearest rungs of the same ladder:
  // type-heading-20 / type-heading-18 / type-heading-14.
  "[&_h1]:font-medium [&_h1]:font-sans [&_h1]:text-xl/7 [&_h1]:tracking-snug",
  "[&_h2]:font-medium [&_h2]:font-sans [&_h2]:text-lg/7 [&_h2]:tracking-snug",
  "[&_h4]:font-medium [&_h4]:font-sans [&_h4]:text-sm",
  // Lists — 4px between rows (Figma's 24px pitch on a 20px line box).
  "[&_ol]:flex [&_ol]:list-decimal [&_ol]:flex-col [&_ol]:gap-1 [&_ol]:pl-4",
  "[&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1 [&_ul]:pl-4",
  "[&_li>ol]:mt-1 [&_li>ul]:mt-1",
  // Inline runs.
  "[&_strong]:font-medium",
  "[&_a:hover]:no-underline [&_a]:underline [&_a]:decoration-solid [&_a]:underline-offset-2",
  "[&_a:focus-visible]:rounded-xs [&_a:focus-visible]:outline-none [&_a:focus-visible]:ring-3 [&_a:focus-visible]:ring-ring/50",
  /* Inline code + fenced code. BOTH render in the SANS body voice, not the
     mono Data voice — see design.md "Exception: Ask AI reply prose"
     (2026-07-27). Replies are long-form reading and mono degrades legibility
     across that length. `font-sans` is explicit because the UA default for
     <code>/<pre> is monospace, which would silently override the inherited
     voice. DO NOT "fix" this back to mono; the exception is deliberate and
     scoped to reply prose only.
     Chip radius is 4px — one step down from the 8px bubble (concentric
     ladder). Horizontal padding is Figma's 2px rounded to the nearest grid
     step. Figma exercises the inline chip (e.g. `1125:4391`) but contains no
     fenced block, so `pre` follows the same ruling by extension. */
  "[&_:not(pre)>code]:rounded-xs [&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:px-1",
  "[&_:not(pre)>code]:font-normal [&_:not(pre)>code]:font-sans [&_:not(pre)>code]:text-sm/5",
  "[&_pre]:overflow-x-auto [&_pre]:rounded-xs [&_pre]:bg-muted [&_pre]:p-3",
  "[&_pre]:font-normal [&_pre]:font-sans [&_pre]:text-sm/5",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:font-sans",
  // Rule.
  "[&_hr]:h-px [&_hr]:border-0 [&_hr]:bg-border"
);

/** Scoped markdown treatment. Pass rendered-markdown HTML or JSX children. */
export function ReplyProse({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(REPLY_PROSE, className)}>{children}</div>;
}

/* ── Turns ───────────────────────────────────────────────────────────────── */

export function UserMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="type-copy-14-tight max-w-[85%] text-pretty rounded-md border border-border bg-chat-bubble-user px-4 py-3 text-chat-bubble-user-foreground shadow-xs">
        {" "}
        {children}
      </div>
    </div>
  );
}

/* Completion affordances, Figma `1125:6296`: 14px glyphs, sitting BELOW the
   bubble as a sibling (not inside it) with an 8px gap. Unwired — real buttons
   with labels so wiring them later is a visual no-op. Figma also holds a
   hidden `copy/12` "Thanks for your feedback!" confirmation at opacity-0;
   not built, since there is no feedback event to reveal it yet. */
const REPLY_ACTIONS = [
  { icon: ThumbsUp, label: "Good response" },
  { icon: ThumbsDown, label: "Bad response" },
  { icon: Copy, label: "Copy reply" },
  { icon: RotateCcw, label: "Regenerate reply" },
] as const;

const REPLY_ACTION_BUTTON =
  "flex size-6 shrink-0 select-none items-center justify-center rounded-xs text-muted-foreground outline-none transition-[colors,scale] duration-150 ease-out will-change-transform hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100";

export function AgentMessage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-col gap-3 rounded-md border border-border bg-chat-bubble-agent p-4 text-chat-bubble-agent-foreground shadow-xs">
        <BotMessageSquare
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground"
          strokeWidth={1.75}
        />
        <ReplyProse>{children}</ReplyProse>
      </div>
      <div className="flex items-center gap-1 px-1">
        {REPLY_ACTIONS.map(({ icon: Icon, label }) => (
          <button
            aria-label={label}
            className={REPLY_ACTION_BUTTON}
            key={label}
            type="button"
          >
            <Icon aria-hidden className="size-3.5" strokeWidth={1.75} />
          </button>
        ))}
      </div>
    </div>
  );
}

/** The scrolling turn list. 16px between turns — Figma's 8px thread gap plus
    the 8px bottom padding on each turn row. */
export function MessageThread({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>;
}
