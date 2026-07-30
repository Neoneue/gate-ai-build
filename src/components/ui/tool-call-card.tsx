import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * ToolCallCard — the nested "CALL <Tool>" card that sits INSIDE an assistant
 * bubble on the Conversations trace, one per tool the model invoked on that
 * turn. Matches the real Gate build's assistant-reply pattern: optional prose
 * first, then a stacked card per call. The tool RESULT is a separate
 * `role: "tool"` MessageBlock that follows, rendered through ToolResultCode —
 * this primitive is the INPUT side.
 *
 * Surface — the inner card inverts relative to its parent bubble:
 *   light  parent bubble grey wash → this card WHITE  (lighter)
 *   dark   parent bubble raised     → this card DARKER
 * That is exactly what `--card` does against a `--card-muted` / `--muted`
 * parent (white/neutral-900 against neutral-50/neutral-800), so the pair is
 * `bg-card` here + a muted parent — no new token, no raw ramp step. See
 * design.md §7 "ToolCallCard" for the parent-surface note.
 *
 * Flat (border, no shadow): this is an inset panel inside a bubble, not a
 * card lifted off a canvas — same call as CodeCard's flat treatment
 * (design.md §5.1).
 *
 * Radius steps down concentrically (design.md §6, ladder 24 → 16 → 8 → 4):
 * the bubble is `rounded-md` (8px), so this card is `rounded-xs` (4px).
 *
 * Typography:
 *   CALL   Eyebrow voice — mono, uppercase, tracked, 12px. It is chrome that
 *          names the row, and the Eyebrow recipe is locked at the primitive.
 *   name   `type-mono-14` — a machine identifier (`Bash`,
 *          `mcp__chrome-devtools__evaluate_script`) per the data-voice rule,
 *          at the 14px the design calls for (the real build renders 12px).
 *   args   `type-mono-14` on a `<code>` element — machine INPUT, and the
 *          reference keeps this face mono. (ToolResultCode went sans on
 *          2026-07-30 for dense multi-line RESULT walls; these args are
 *          short — p50 91 chars — so that reasoning does not carry over.)
 *
 * Clamped to 3 lines. The longest captured value is 7,612 chars; without the
 * clamp one `evaluate_script` payload blows out the bubble. `break-words`
 * (not `break-all`) so a long path or command wraps at word boundaries and
 * only splits inside a token wider than the line — same reasoning as
 * ToolResultCode's 2026-07-30 change.
 *
 * Elements are flex `<span>`s, not `<div>`s: MessageBlock's bubble renders as
 * a `<button>` whenever the message is cross-link selectable (which is every
 * message on this surface), and a `<button>` may only contain phrasing
 * content. `display:flex` on a span gives the same box with valid markup.
 * ───────────────────────────────────────────────────────────────────────── */

export type ToolCallCardProps = {
  /** Tool name, rendered after the CALL eyebrow. */
  name: string;
  /** Captured arguments, verbatim. Never reformatted or pretty-printed. */
  args: string;
  /** Layout only — how the card sits in its parent. */
  className?: string;
};

export function ToolCallCard({ name, args, className }: ToolCallCardProps) {
  return (
    <span
      className={cn(
        "flex min-w-0 flex-col gap-2 rounded-xs border border-border bg-card p-3",
        className
      )}
      data-slot="tool-call-card"
    >
      <span className="flex min-w-0 items-baseline gap-2">
        <Eyebrow className="shrink-0">Call</Eyebrow>
        <span className="type-mono-14 min-w-0 break-words text-foreground">
          {name}
        </span>
      </span>
      {args ? (
        <code className="type-mono-14 line-clamp-3 break-words text-muted-foreground">
          {args}
        </code>
      ) : null}
    </span>
  );
}
