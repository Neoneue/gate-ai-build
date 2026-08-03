import type * as React from "react";

import { cn } from "@/lib/utils";

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
 *   type-copy-14 text-foreground
 *   break-words          (2026-07-30, was `break-all`. `break-all` splits
 *                         at ANY character — the trace showed "sta/rted"
 *                         and "$0.025/8" broken mid-token. `break-words`
 *                         breaks at word boundaries and only splits inside
 *                         a word when that word alone is wider than the
 *                         line, so a long unbroken JSON token still cannot
 *                         overflow the bubble: same overflow protection,
 *                         no gratuitous mid-word splits. `break-all` was
 *                         right when the face was mono and the body was
 *                         assumed to be one-line JSON; this content is
 *                         mixed prose-plus-data.)
 *
 * Sans since 2026-07-30 (was `font-mono text-sm`). The tool-result blobs
 * on the Conversations trace are dense multi-line walls, and mono degraded
 * legibility across that length. Sans at the same 14px matches how Ask AI
 * already renders `code` / `pre` inside a reply — see design.md
 * "Exception: Ask AI reply prose". The <code> element is unchanged: only
 * the face moved, the content is still machine output.
 *
 * Tracking is `normal` — the voice token carries no tightening, and only
 * the page-title display tier is tight on this site.
 * ───────────────────────────────────────────────────────────────────────── */

const TOOL_RESULT_CODE_BASE = "type-copy-14 text-foreground break-words";

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
