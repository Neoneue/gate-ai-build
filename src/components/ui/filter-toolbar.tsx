import * as React from 'react';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────
 * FilterToolbar — table toolbar wrapper.
 *
 * Extracted 2026-05-17 from 7 duplicated `<div className="flex items-center
 * gap-2 p-4">` blocks across Team / Conversations / Requests / Models /
 * Activity / AuditTrail / Security. Renders its children (SearchInput,
 * Select controls, trailing buttons) inside the standard layout shell.
 *
 * Layout contract:
 *   - flex row, gap-2 (8px — compound tier per design.md §4)
 *   - p-4 (16px — surface tier, dominant step)
 *   - items-center (vertically aligned row)
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

export interface FilterToolbarProps
  extends React.ComponentProps<'div'> {}

export function FilterToolbar({
  className,
  children,
  ...props
}: FilterToolbarProps) {
  return (
    <div
      className={cn('flex items-center gap-2 p-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}
