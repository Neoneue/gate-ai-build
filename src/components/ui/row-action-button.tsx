import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────
 * RowActionButton — drill-in button inside a TableRow's primary cell.
 *
 * Codified 2026-05-09 after WIG audit: <tr role="button" tabIndex={0}> is
 * invalid ARIA (<tr> only legally carries role="row"). Instead, the row's
 * primary identifier cell wraps content in a real <button>; the <tr> keeps
 * default semantics with `onClick` as a mouse-only convenience.
 *
 * The button:
 *   - carries the row's `aria-label` (the canonical accessible name)
 *   - carries the focus-visible ring (the only keyboard target)
 *   - stops click propagation so the parent <tr>'s onClick doesn't
 *     double-fire when the button itself is clicked
 *   - resets default <button> styling (bg-transparent, p-0) so the cell
 *     content renders identically to a plain <span>/<div>
 *
 * Layout variants:
 *   row     — `flex items-center gap-2 min-w-0 w-full` — for cells with
 *             icon + text (e.g. VendorAvatar + model name)
 *   stack   — `flex flex-col gap-1 min-w-0 w-full` — for stacked title +
 *             sub-id cells (e.g. CMP-014 conversation title + cnv_id)
 *   inline  — no layout class — for single-text cells (e.g. CMP-015
 *             API key handle); pass typography classes via `className`
 *
 * Don't restyle the focus ring or padding-reset across consumers — this
 * primitive is the canonical home. If a new layout shape is needed, add
 * a variant here rather than inlining the recipe.
 * ───────────────────────────────────────────────────────────────────────── */

const rowActionButtonVariants = cva(
  'text-left bg-transparent p-0 outline-none rounded-xs focus-visible:ring-3 focus-visible:ring-ring/50',
  {
    variants: {
      layout: {
        row: 'flex items-center gap-2 min-w-0 w-full',
        stack: 'flex flex-col gap-1 min-w-0 w-full',
        inline: '',
      },
    },
    defaultVariants: {
      layout: 'row',
    },
  },
);

export type RowActionButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'type'
> &
  VariantProps<typeof rowActionButtonVariants> & {
    'aria-label': string;
  };

export function RowActionButton({
  layout,
  className,
  onClick,
  children,
  ...props
}: RowActionButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className={cn(rowActionButtonVariants({ layout, className }))}
      {...props}
    >
      {children}
    </button>
  );
}

export { rowActionButtonVariants };
