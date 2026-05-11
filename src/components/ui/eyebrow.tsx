import * as React from 'react';

import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────
 * Eyebrow — small mono-uppercase chrome label used above KPI values,
 * inside sidebar nav-section headers, atop CompactKpi titles, on
 * artboard / spec-sheet headers, and (formerly) on modal title blocks.
 *
 * Extracted 2026-05-11 after the 5-agent audit found 13 hand-rolled
 * occurrences of the same recipe across CMP-013/14/15/16/18 + sidebar
 * + CompactKpi + Artboard.tsx + spec sheets. Every prior occurrence
 * was a verbatim re-inline of `font-mono text-xs uppercase
 * tracking-[0.1em] font-medium text-ink-500`.
 *
 * Recipe is locked at the primitive — consumers compose, never override
 * type sizes / weight / tracking. Layout-only className (`px-N`, etc.)
 * is forwarded so the eyebrow can sit inside tight containers.
 *
 * Element: `<span>` by default (inline label semantics). Pass `as="div"`
 * if a block element is needed (rare).
 * ───────────────────────────────────────────────────────────────────── */

export interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Element to render as. Defaults to `<span>` (inline). */
  as?: 'span' | 'div';
}

export function Eyebrow({
  as: Tag = 'span',
  className,
  children,
  ...props
}: EyebrowProps) {
  return (
    <Tag
      data-slot="eyebrow"
      className={cn(
        'font-mono text-xs uppercase tracking-[0.1em] font-medium text-ink-500',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
