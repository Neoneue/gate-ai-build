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
 *   font-mono text-sm text-neutral-900
 *   break-all            (long JSON one-liners must break inside tokens
 *                         to fit a message bubble's content width)
 *
 * Tracking is `normal` — mono never gets sub-pixel tightening on this
 * site (the monospace grid carries its own optical density).
 * ───────────────────────────────────────────────────────────────────────── */

const TOOL_RESULT_CODE_BASE = "font-mono text-sm text-foreground break-all";

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
