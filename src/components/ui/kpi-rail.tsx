import * as React from 'react';

import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────
 * KpiRail — bordered single-row container with inset divider hairlines
 * between children.
 *
 * Codified 2026-05-10 after the "same recipe in 4 sites" extract pass:
 * CMP-012, CMP-013, CMP-014 (table + modal), CMP-015, CMP-016 all ran
 * parallel implementations of the same shell.
 *
 * Recipe:
 *   container  rounded-md bg-white shadow-(--shadow-border) overflow-hidden
 *              grid grid-cols-{columns}
 *   divider    on every child after the first — a wrapper <div> with a
 *              `before:` pseudo-element drawing a 1px hairline at
 *              `inset-y-4 left-0 w-px bg-ink-200`. The inset keeps the
 *              hairline off the rounded corners and away from the spark's
 *              lower edge, reading as "section break inside one
 *              container" rather than spreadsheet ruling.
 *
 * The primitive takes any children — the tile shape (CompactKpi, custom
 * mono tiles, plain divs) is the caller's call. It only enforces the
 * shell + divider treatment.
 *
 * Don't hand-roll the recipe. If a new shape is needed (e.g. a different
 * divider geometry), add a variant here rather than re-inlining the
 * `dividerCls` string.
 * ───────────────────────────────────────────────────────────────────────── */

const DIVIDER_CLS =
  'relative before:absolute before:left-0 before:inset-y-4 before:w-px before:bg-ink-200';

const COLUMN_CLS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
};

export interface KpiRailProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of columns. Defaults to 4 — the most common shape. */
  columns?: 2 | 3 | 4 | 5 | 6;
}

export function KpiRail({
  columns = 4,
  className,
  children,
  ...props
}: KpiRailProps) {
  const items = React.Children.toArray(children);
  return (
    <div
      className={cn(
        'grid rounded-md bg-white shadow-(--shadow-border) overflow-hidden',
        COLUMN_CLS[columns],
        className,
      )}
      {...props}
    >
      {items.map((child, i) =>
        i === 0 ? (
          <React.Fragment key={i}>{child}</React.Fragment>
        ) : (
          <div key={i} className={DIVIDER_CLS}>
            {child}
          </div>
        ),
      )}
    </div>
  );
}
