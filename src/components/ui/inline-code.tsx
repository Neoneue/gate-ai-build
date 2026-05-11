import * as React from 'react';

import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────
 * InlineCode — short identifier chip rendered as a `<code>` element.
 * Recipe: `font-mono text-ink-800 bg-ink-100 rounded-xs px-1.5 py-0.5`.
 *
 * Extracted 2026-05-11 after the 5-agent audit found the same recipe
 * hand-rolled 5 times in CMP-016 (model handles inline in prose,
 * detail-section rows, table cells).
 *
 * Distinct from `<ToolResultCode>` (which is for JSON-blob tool-result
 * payloads — no chip background, `break-all` for wrapping, different
 * tracking). InlineCode is the chip variant: short identifiers like
 * `claude-haiku-4-5` or `bedrock/claude-haiku-4-5` inline in prose.
 *
 * `size="sm"` drops to a smaller chip (text-xs) for table-cell density;
 * default is text-sm.
 * ───────────────────────────────────────────────────────────────────── */

export interface InlineCodeProps
  extends React.HTMLAttributes<HTMLElement> {
  /** Chip size. `default` = text-sm; `sm` = text-xs (table-cell density). */
  size?: 'default' | 'sm';
}

export function InlineCode({
  size = 'default',
  className,
  children,
  ...props
}: InlineCodeProps) {
  return (
    <code
      data-slot="inline-code"
      data-size={size}
      className={cn(
        'font-mono text-ink-800 bg-ink-100 rounded-xs px-1.5 py-0.5',
        size === 'sm' ? 'text-xs' : 'text-sm',
        className,
      )}
      {...props}
    >
      {children}
    </code>
  );
}
