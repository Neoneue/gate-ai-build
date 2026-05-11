import * as React from 'react';

import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────
 * PageTitle — top-of-surface heading on composed pages (CMP-012 through
 * CMP-018). Recipe: `font-sans font-medium text-ink-900 text-3xl/9
 * -tracking-[1px] text-balance m-0`.
 *
 * Extracted 2026-05-11 after the 5-agent audit found this exact recipe
 * hand-rolled in 8 sites (every composed page's PageHeader plus the
 * shared ArtboardHeader). Each re-inline carried the same arbitrary
 * `-tracking-[1px]` value — drift waiting to happen the next time
 * someone polished one site without touching the others.
 *
 * Renders an `<h2>` by default — composed pages sit inside a
 * `<DashboardChrome>` that owns the document h1 implicitly; the
 * in-surface page title reads as h2 in the outline so child cards
 * can use h3 without level skips.
 *
 * Recipe is locked at the primitive. Type size / weight / tracking /
 * balance / margin are not overridable. Spec-sheet ArtboardHeader
 * (which uses `text-ink-800` not 900) is a separate surface and
 * doesn't compose this primitive.
 * ───────────────────────────────────────────────────────────────────── */

export interface PageTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Heading level. Defaults to `h2` (composed-page convention). */
  as?: 'h1' | 'h2';
}

export function PageTitle({
  as: Tag = 'h2',
  className,
  children,
  ...props
}: PageTitleProps) {
  return (
    <Tag
      data-slot="page-title"
      className={cn(
        'font-sans font-medium text-ink-900 text-3xl/9 -tracking-[1px] text-balance m-0',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
