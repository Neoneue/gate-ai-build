import type * as React from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * FilterToolbar — table toolbar wrapper.
 *
 * Extracted 2026-05-17 from 7 duplicated `<div className="flex items-center
 * gap-2 p-4">` blocks across Team / Conversations / Requests / Models /
 * Activity / AuditTrail / Security. Renders its children (SearchInput,
 * Select controls, trailing buttons) inside the standard layout shell.
 *
 * Layout contract:
 *   - below md: stacked column (search full-width own row, trailing controls
 *     split evenly on the row below); gap-2 (8px)
 *   - md+: flex row, gap-2 (8px — compound tier per design.md §4)
 *   - p-4 (16px — surface tier, dominant step)
 *   - items-center (vertically aligned row)
 *
 * Callers give the SearchInput `w-full md:w-96` (or `md:flex-1`) and each
 * trailing control `flex-1 md:flex-none` so the mobile split works and the
 * md+ inline row is unchanged.
 *
 * Children are caller-supplied primitives — SearchInput, Select, Button, etc.
 * No baked-in select shapes; callers pass their own fully-configured selects.
 *
 * Usage (always inside a Card density="flush"):
 *   <FilterToolbar>
 *     <SearchInput ... />
 *     <Select ...><SelectTrigger ... /></Select>
 *   </FilterToolbar>
 * ─────────────────────────────────────────────────────────────────────── */

export type FilterToolbarProps = React.ComponentProps<"div">;

export function FilterToolbar({
  className,
  children,
  ...props
}: FilterToolbarProps) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-2 p-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}
