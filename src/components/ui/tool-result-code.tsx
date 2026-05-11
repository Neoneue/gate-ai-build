import * as React from 'react';

import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────
 * ToolResultCode — inline <code> recipe for tool-result JSON blobs.
 *
 * Codified 2026-05-10 after extract-before-handrolling pass. The recipe
 * was inlined 4× in CMP-014 (Conversations) on consecutive tool-result
 * message bodies — clear "two-or-more sites = mandatory primitive"
 * trigger.
 *
 * Recipe (locked):
 *   <code> element (semantic — these blobs ARE machine output)
 *   font-mono text-sm text-ink-900
 *   -tracking-[0.14px]   (matches the data-tier mono tracking used in
 *                         table cells / TopKeys / IDs throughout the
 *                         operational surfaces; not invented here)
 *   break-all            (long JSON one-liners must break inside tokens
 *                         to fit a message bubble's content width)
 *
 * If a wider tracking review touches the data-tier mono register, update
 * the primitive once — every consumer follows.
 * ───────────────────────────────────────────────────────────────────────── */

const TOOL_RESULT_CODE_BASE =
  'font-mono text-sm text-ink-900 -tracking-[0.14px] break-all';

export type ToolResultCodeProps = React.HTMLAttributes<HTMLElement>;

export function ToolResultCode({
  className,
  children,
  ...props
}: ToolResultCodeProps) {
  return (
    <code className={cn(TOOL_RESULT_CODE_BASE, className)} {...props}>
      {children}
    </code>
  );
}
