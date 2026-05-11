import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

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
  'font-sans font-medium tabular-nums tracking-tight text-ink-900',
  {
    variants: {
      size: {
        default: 'text-2xl/8',
        lg: 'text-3xl/9',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

export type HeroNumericProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof heroNumericVariants>;

export function HeroNumeric({
  size,
  className,
  children,
  ...props
}: HeroNumericProps) {
  return (
    <div
      className={cn(heroNumericVariants({ size, className }))}
      {...props}
    >
      {children}
    </div>
  );
}

export { heroNumericVariants };
