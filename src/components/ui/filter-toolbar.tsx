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
 * Layout contract — CONTAINER width, not viewport width. `<main>` declares
 * `@container`, so `@2xl:` (672px inline-size) reads the column the toolbar
 * actually sits in. That distinction is the whole point: the Ask AI panel
 * narrows the content column to ~370-630px while the viewport stays wide, so
 * a `md:` ladder never fired and the controls stayed crammed on one line.
 *   - below @2xl: stacked (search full-width on its own row, trailing
 *     controls splitting the row below evenly, edge to edge); gap-2 (8px)
 *   - @2xl and up: flex row, gap-2 (8px — compound tier per design.md §4)
 *   - p-4 (16px — surface tier, dominant step)
 *   - items-center (vertically aligned row)
 *
 * Callers give the SearchInput `w-full @2xl:w-96` (or `@2xl:flex-1`) and each
 * trailing control `flex-1 @2xl:flex-none` so the narrow-column split works
 * and the wide-column inline row is unchanged. A control with an intrinsic
 * content width — any SelectTrigger — also needs `min-w-0`, or its label
 * keeps the cell from shrinking to an even 50/50 on the wrapped row.
 * Never reach for `md:`/`lg:` here; the window is not the layout constraint.
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
