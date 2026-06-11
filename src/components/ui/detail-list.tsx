import type * as React from "react";

import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * DetailList / DetailRow — bordered label/value list for modal "Details"
 * sections (Requests, Security threat events, Audit record).
 *
 * Universal pattern (2026-05-16): label left, value left-aligned in a fixed
 * 2nd column. Replaces the prior right-aligned recipe — left-align absorbs
 * every value shape (prose, badge, icon-prefixed, mono hex, short atoms)
 * without forcing consumers to negotiate a right edge. Reads as a record
 * being read top-to-bottom, not a table being compared row-to-row.
 *
 * Recipe:
 *   list   rounded-md border border-border overflow-hidden
 *   row    flex items-start gap-4 px-4 py-3
 *          border-b border-border last:border-b-0
 *   label  w-32 shrink-0 text-sm text-neutral-500
 *   value  flex-1 min-w-0 text-sm (consumer styles inner content)
 * ───────────────────────────────────────────────────────────────────── */

export function DetailList({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border",
        className
      )}
      data-slot="detail-list"
      {...props}
    />
  );
}

export interface DetailRowProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
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
      className={cn(
        "flex items-start gap-4 border-border border-b px-4 py-3 last:border-b-0",
        className
      )}
      data-slot="detail-row"
      {...props}
    >
      <span className="w-32 shrink-0 text-neutral-500 text-sm">{label}</span>
      <div className="min-w-0 flex-1 text-sm">{value}</div>
    </div>
  );
}
