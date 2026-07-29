import { Dotm3x3_11 } from "@/components/ui/dotm-3x3-11";

/* ─── AskAiThinkingRow — "Thinking …" placeholder before the reply lands ─────
 * The mark is the `@dotmatrix` 3×3 glyph-pulse loader, held to 16px so it sits
 * on the same optical line as the 16px lucide icons everywhere else. It takes
 * no `colorPreset` on purpose: the component's default is `currentColor`, so
 * it inherits the row's `text-muted-foreground` and flips with the theme —
 * every preset it ships instead hardcodes a hex/gradient that would not.
 * It carries its own reduced-motion guard and its own CSS import.
 *
 * Left-aligned and bubble-less so it occupies the same column the reply will,
 * and sized so the swap to the real bubble does not jump the scroll.
 * The ellipsis is the repo's pure-CSS `animate-ellipsis` (reduced-motion safe,
 * decorative — "Thinking" carries the meaning). ─────────────────────────── */

export function AskAiThinkingRow() {
  return (
    <div className="flex items-center gap-2 px-1 py-3 text-muted-foreground">
      {/* 16px exactly, with the gap set rather than derived: 3 dots × 4px +
          2 gaps × 2px = 16. Passing `size` alone makes the component infer the
          gap (`floor((size - dotSize × 3) / 2)`), and at this scale the value
          it infers disagrees with the box it draws into, which reads as a
          horizontal squish. `cellPadding` pins it, and these numbers need no
          fractional scaling to hit the slot. */}
      <span aria-hidden className="shrink-0">
        <Dotm3x3_11 cellPadding={2} dotSize={4} />
      </span>
      <span className="type-copy-14-tight">
        Thinking
        <span aria-hidden className="animate-ellipsis" />
      </span>
    </div>
  );
}
