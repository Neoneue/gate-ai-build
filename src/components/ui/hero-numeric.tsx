import { cva, type VariantProps } from "class-variance-authority";

import { SkeletonText } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * HeroNumeric — sans-tabular display tier for summary numerics ≥24px.
 *
 * Codified 2026-05-07 as the "look at this — summary" register, distinct
 * from operational mono numerics (table cells, IDs, badge contents). Uses
 * `tabular-nums` so digits sit on a fixed grid; `font-sans` carries the
 * presentation tier; `font-medium` matches the type-scale heading weight.
 *
 * Sizes:
 *   default  text-2xl/8  (24px) — KPI rail value, panel hero (Top Keys total)
 *   lg       text-3xl/9  (32px) — page-level hero metric (CMP-013 "8,241")
 *
 * Below ~20px, numerics revert to mono regardless of role — modal KpiTile,
 * table cells, badge contents stay font-mono. Don't extend HeroNumeric to
 * smaller sizes without re-examining that boundary.
 * ───────────────────────────────────────────────────────────────────────── */

const heroNumericVariants = cva(
  "font-medium font-sans text-foreground tabular-nums tracking-tight",
  {
    variants: {
      size: {
        default: "text-2xl/8",
        lg: "text-3xl/9",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export type HeroNumericProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof heroNumericVariants> & {
    /** Swap the number for a skeleton bar of the same line box while the
     *  value is in flight. Optional and off by default, so no existing
     *  consumer changes. The wrapper keeps its typography classes, so the
     *  height and the baseline any `items-baseline` sibling aligns to are
     *  identical loading and loaded. */
    loading?: boolean;
  };

export function HeroNumeric({
  size,
  loading = false,
  className,
  children,
  ...props
}: HeroNumericProps) {
  return (
    <div className={cn(heroNumericVariants({ size, className }))} {...props}>
      {loading ? (
        <SkeletonText
          className={size === "lg" ? "w-32" : "w-24"}
          size={size === "lg" ? "heroLg" : "hero"}
        />
      ) : (
        children
      )}
    </div>
  );
}

// heroNumericVariants: internal use only — not exported
