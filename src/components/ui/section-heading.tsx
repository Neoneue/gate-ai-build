import * as React from 'react';

import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────
 * SectionHeading — h3-class heading used inside modal body sections
 * ("Evidence", "Detection", "Context", "Details", "Security scan").
 *
 * Extracted 2026-05-11 after the 5-agent audit found the same recipe
 * (`font-sans text-sm font-medium text-ink-900 m-0`) hand-rolled in 5
 * modal body sections across CMP-007 + CMP-015.
 *
 * Renders an `<h3>` by default — modal body sections sit inside a
 * `<DialogTitle>` (h2 via Base UI), so h3 is the natural next level.
 * Pass `as` to override when the heading-level math differs.
 *
 * Recipe is locked at the primitive — type size / weight / margin are
 * not overridable. Consumers may pass layout-only className.
 * ───────────────────────────────────────────────────────────────────── */

export interface SectionHeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Heading level. Defaults to `h3` (matches modal body section use). */
  as?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export function SectionHeading({
  as: Tag = 'h3',
  className,
  children,
  ...props
}: SectionHeadingProps) {
  return (
    <Tag
      data-slot="section-heading"
      className={cn(
        'font-sans text-sm font-medium text-ink-900 m-0',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
