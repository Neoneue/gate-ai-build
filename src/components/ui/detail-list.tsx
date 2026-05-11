import * as React from 'react';

import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────
 * DetailList / DetailRow — bordered label/value list for modal body
 * "Details" / "Context" sections.
 *
 * Extracted 2026-05-11 after the third occurrence of the same recipe
 * (CMP-013 Request detail / CMP-015 Threat event / CMP-007 generation
 * details). Three sites, two visual implementations — the CMP-007
 * `DetailGrid` was drifting from the CMP-013/15 `grid-cols-4 + border-b`
 * shape. Canonicalize on the CMP-013/15 recipe.
 *
 * Recipe:
 *   list   rounded-xs border border-ink-200 overflow-hidden
 *   row    grid grid-cols-4 gap-4 items-center py-3
 *          border-b border-ink-200 last:border-b-0
 *   label  col-span-1 pl-4 font-sans text-sm font-medium text-ink-500
 *   value  col-span-3 pr-4 (consumer styles the inner content)
 * ───────────────────────────────────────────────────────────────────── */

export function DetailList({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="detail-list"
      className={cn(
        'rounded-xs border border-ink-200 overflow-hidden',
        className,
      )}
      {...props}
    />
  );
}

export interface DetailRowProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  label: React.ReactNode;
  value: React.ReactNode;
}

export function DetailRow({
  label,
  value,
  className,
  ...props
}: DetailRowProps) {
  return (
    <div
      data-slot="detail-row"
      className={cn(
        'grid grid-cols-4 gap-4 items-center py-3 border-b border-ink-200 last:border-b-0',
        className,
      )}
      {...props}
    >
      <span className="pl-4 font-sans text-sm font-medium text-ink-500">
        {label}
      </span>
      <div className="col-span-3 pr-4">{value}</div>
    </div>
  );
}
