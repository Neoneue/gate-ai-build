import type * as React from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * Skeleton — the loading placeholder for a value that has not arrived.
 *
 * The shadcn primitive shape, unchanged: a `bg-muted` block that pulses.
 * `animate-pulse` is the ONLY sanctioned loading motion on this site — no
 * spinners, no shimmer sweep, no progress bars. `motion-reduce:animate-none`
 * is on the primitive so every consumer inherits the reduced-motion gate.
 *
 * `aria-hidden` is also on the primitive: a skeleton has no content to
 * announce. The surface that owns the wait announces it once, with
 * `aria-busy` on the region root plus a single `sr-only role="status"`
 * element (see `pages/teams/use-theatre-loading.ts` consumers).
 *
 * SKELETON THE VALUE, KEEP THE CHROME. Column heads, section titles, card
 * titles, eyebrows, toolbars, range pills, tabs and units are known before
 * the fetch resolves — they render as themselves. Only what the request
 * answers (numbers, names, timestamps, bars, sparklines) gets a skeleton.
 * ───────────────────────────────────────────────────────────────────────── */

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-sm bg-muted motion-reduce:animate-none",
        className
      )}
      data-slot="skeleton"
      {...props}
    />
  );
}

/** Bar height per type voice. The bar is inset inside the voice's own line
 *  box rather than filling it, so a 14px value reads as a 16px bar in a 20px
 *  row instead of a slab. */
const SKELETON_TEXT_BAR = {
  sm: "h-3", // type-copy-12 / type-mono-12 — 16px leading
  default: "h-4", // type-copy-14 / type-mono-14 / type-label-14 — 20px leading
  hero: "h-6", // HeroNumeric default — text-2xl/8, 32px leading
  heroLg: "h-7", // HeroNumeric lg — text-3xl/9, 36px leading
} as const;

/** A value skeleton that CANNOT shift the layout when the real string swaps
 *  in. Two mechanics do that work:
 *
 *  1. An invisible non-breaking space carries the parent's own line box and
 *     baseline, so the row keeps its height and any `items-baseline` sibling
 *     (a delta chip beside a KPI value) stays put.
 *  2. The bar itself is absolutely positioned and vertically centred, so its
 *     height is decorative — it can never add to the line box.
 *
 *  Width comes from a Tailwind `w-*` class on `className`, the way every
 *  shadcn skeleton sizes itself; without one the span collapses to the width
 *  of the placeholder space. */
export function SkeletonText({
  className,
  size = "default",
}: {
  className?: string;
  size?: keyof typeof SKELETON_TEXT_BAR;
}) {
  return (
    <span
      aria-hidden
      className={cn("relative inline-block", className)}
      data-slot="skeleton-text"
    >
      <span className="invisible">&nbsp;</span>
      <Skeleton
        className={cn(
          "absolute inset-x-0 top-1/2 -translate-y-1/2",
          SKELETON_TEXT_BAR[size]
        )}
      />
    </span>
  );
}
