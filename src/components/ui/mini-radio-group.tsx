import type * as React from "react";

import { cn } from "@/lib/utils";

/* ─── MiniRadioGroup — 32px bordered track of 24px choices ──────────────────
 * Extracted 2026-07-28 from the hand-rolled BYOK / PAYG mode switch in
 * `DashboardDefault.tsx`. Recipe verbatim; this moves no pixels.
 *
 * NOT `Segmented`, and the difference is not size. Segmented is a MUTED track
 * with a raised card thumb; this is a CARD track with a muted thumb — the two
 * are inverted, so routing this into Segmented would have repainted it. It is
 * also a `role="radiogroup"` (single choice, announced as radios), where
 * Segmented is a view switcher.
 *
 * If a second consumer ever appears, reconcile the two rather than adding a
 * third look.
 * ───────────────────────────────────────────────────────────────────────── */

export function MiniRadioGroup({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1 rounded-sm border border-border bg-card px-1",
        className
      )}
      role="radiogroup"
      {...rest}
    >
      {children}
    </div>
  );
}

export type MiniRadioProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "role" | "aria-checked"
> & {
  selected: boolean;
};

export function MiniRadio({
  className,
  selected,
  children,
  ...rest
}: MiniRadioProps) {
  return (
    <button
      aria-checked={selected}
      className={cn(
        "type-label-12 flex h-6 items-center rounded-xs px-2 transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-muted-foreground",
        className
      )}
      role="radio"
      type="button"
      {...rest}
    >
      {children}
    </button>
  );
}
