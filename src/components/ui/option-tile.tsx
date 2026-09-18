import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

/* ─── OptionTile — one choice in a radiogroup ───────────────────────────────
 * Extracted 2026-07-28 from three hand-rolled copies: the credit-preset grids
 * in `Billing.tsx`, `BillingFree.tsx`, and `SetupCredits.tsx`.
 *
 * Deliberately NOT a `Button`. These live inside `role="radiogroup"` and carry
 * `role="radio"` + `aria-checked` — they are a single-choice control, and a
 * screen reader must hear "2 of 4 selected", not "button". Routing them into
 * `Button` would have given correct chrome and wrong semantics. The element
 * stays a native `<button>` (focusable, Enter/Space) with the radio role on
 * top, which is the standard composite-widget pattern; the PARENT owns arrow-
 * key roving tabindex where it wants it (Billing does, SetupCredits doesn't).
 *
 * `tone` and `size` exist ONLY to preserve the three call sites exactly as
 * they render today — see the note under `tone`. They are not an invitation
 * to add a fourth look.
 * ───────────────────────────────────────────────────────────────────────── */

const optionTileVariants = cva(
  "flex items-center justify-center border tabular-nums outline-none transition-[color,background-color,border-color,box-shadow] duration-150 ease-out focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      size: {
        /** 40px — the billing credit grid. */
        md: "h-10 rounded-md font-medium font-sans text-sm",
        /** 48px — the setup-credits grid, which sits on a roomier page. */
        lg: "type-label-14 h-12 rounded-sm",
      },
      /* NOTE (2026-07-28): `neutral` and `accent` encode a REAL inconsistency
         that predates this extraction — /billing marks the chosen amount with
         a neutral fill, /setup-credits marks it blue. Both are reproduced
         verbatim so this refactor moves no pixels. Picking one is a design
         decision, not a refactor; flagged in docs/button-audit-7-28.md.

         2026-09-18: `accent`+`selected` now binds to the Pro plan-tier
         family (design.md §2 "Plan tier colours") instead of raw blue
         steps. One accepted shift: the dark border moves blue-400/30 ->
         blue-500/30, because `--tier-pro-border` carries Card `tone="pro"`s
         documented rung and the two edges must not disagree. */
      tone: {
        neutral: "",
        accent: "",
      },
      selected: { true: "", false: "" },
    },
    compoundVariants: [
      {
        tone: "neutral",
        selected: true,
        className: "border-border bg-muted text-foreground",
      },
      {
        tone: "neutral",
        selected: false,
        className:
          "border-border bg-card text-foreground hover:bg-accent-muted",
      },
      {
        tone: "accent",
        selected: true,
        className:
          "border-tier-pro-border bg-tier-pro-surface text-tier-pro-foreground",
      },
      {
        tone: "accent",
        selected: false,
        className: "border-border bg-card text-foreground hover:border-input",
      },
    ],
    defaultVariants: { size: "md", tone: "neutral", selected: false },
  }
);

export type OptionTileProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "role" | "aria-checked"
> &
  VariantProps<typeof optionTileVariants> & {
    /** Drives both `aria-checked` and the selected styling. */
    selected: boolean;
  };

export function OptionTile({
  className,
  selected,
  size,
  tone,
  children,
  ref,
  ...rest
}: OptionTileProps & { ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <button
      aria-checked={selected}
      className={cn(optionTileVariants({ size, tone, selected }), className)}
      ref={ref}
      role="radio"
      type="button"
      {...rest}
    >
      {children}
    </button>
  );
}
