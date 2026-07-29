import type { LucideIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

/* ─── ExpandingAction — 32px icon key that opens to reveal its label ────────
 * Extracted 2026-07-28 from the hand-rolled "Mark invalid" control in
 * `security/EventsTable.tsx`. Recipe verbatim; this moves no pixels.
 *
 * Deliberately NOT a `Button` variant. Width-on-hover is not button behavior —
 * a Button is a fixed box whose contents may change, this is a box that
 * CHANGES SIZE under the pointer and reflows what sits next to it. Putting
 * that on `Button` would make every button in the app capable of resizing
 * itself, which is not a capability the primitive should have.
 *
 * The mechanics, none of which a call site should restate:
 *   · `w-8` → `hover:w-30` / `focus-visible:w-30`, eased on the drawer curve
 *     over 300ms while the press scale stays on the standard 150ms out curve.
 *   · The label is present in the DOM at all times (`opacity-0` → `100`), so
 *     the accessible name and the hit target never depend on hover state.
 *   · `after:-inset-2` keeps a comfortable target at the collapsed 32px.
 * ───────────────────────────────────────────────────────────────────────── */

export type ExpandingActionProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "children" | "aria-label"
> & {
  "aria-label": string;
  icon: LucideIcon;
  /** The text revealed on hover / focus. */
  label: string;
};

export function ExpandingAction({
  className,
  icon: Icon,
  label,
  ...rest
}: ExpandingActionProps) {
  return (
    <button
      className={cn(
        "type-label-12 group/mark relative inline-flex h-8 w-8 shrink-0 items-center overflow-hidden whitespace-nowrap rounded-sm border border-border bg-card text-foreground outline-none [transition:width_300ms_var(--ease-drawer),scale_150ms_var(--ease-out)] after:absolute after:-inset-2 after:content-[''] hover:w-30 hover:bg-accent focus-visible:w-30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
        className
      )}
      type="button"
      {...rest}
    >
      <span className="inline-flex size-8 shrink-0 items-center justify-center">
        <Icon aria-hidden className="size-3.5" strokeWidth={1.75} />
      </span>
      <span className="pr-3 opacity-0 transition-opacity duration-200 ease-out group-hover/mark:opacity-100 group-focus-visible/mark:opacity-100">
        {label}
      </span>
    </button>
  );
}
