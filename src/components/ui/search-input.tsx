import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * SearchInput — table toolbar search field with leading icon.
 *
 * Extracted 2026-05-16 after the WDG audit found 7 hand-rolled copies of
 * the same recipe across Requests / Conversations / Activity / Security /
 * AuditTrail / Models / Team toolbars. Locked recipe:
 *   wrapper:  `relative w-96 min-w-0 shrink-0`
 *   icon:     Lucide `Search`, `size-3.5 text-neutral-500 strokeWidth={1.75}`,
 *             absolutely positioned at `left-3 top-1/2 -translate-y-1/2`.
 *   input:    `size="sm" type="search" autoComplete="off" spellCheck={false}
 *             className="pl-8"` plus `name`, `placeholder`, `aria-label`.
 *
 * Controlled (`value` + `onChange`) and uncontrolled (no props) are both
 * supported. The wrapper width is locked at `w-96` (384px) — override via
 * `className` only when a specific toolbar needs a different shape.
 *
 * `surface` forwards to the inner <Input>: `'card'` (default, bg-neutral-50)
 * for toolbars inside white/card surfaces; `'elevated'` (bg-card + shadow-xs)
 * for search fields that sit OUTSIDE table cards on the page background.
 * ───────────────────────────────────────────────────────────────────── */

export interface SearchInputProps {
  /** Required accessible label. */
  ariaLabel: string;
  /** Wrapper-level className override. Layout-only; do not pass `w-*` */
  className?: string;
  /** Form `name` attribute. Defaults to `'q'`. */
  name?: string;
  /** Controlled change handler. Receives the input's new string value. */
  onChange?: (value: string) => void;
  /** Placeholder copy. Should end with `…`. */
  placeholder: string;
  /** Inner input resting fill. `'card'` (default) inside white/card surfaces; `'elevated'` (white + shadow) for search bars outside table cards. */
  surface?: "card" | "elevated";
  /** Controlled value. Omit for uncontrolled. */
  value?: string;
}

export function SearchInput({
  placeholder,
  ariaLabel,
  value,
  onChange,
  name = "q",
  className,
  surface = "card",
}: SearchInputProps) {
  return (
    <div className={cn("relative w-96 min-w-0 shrink-0", className)}>
      <Search
        aria-hidden
        className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
        strokeWidth={1.75}
      />
      <Input
        aria-label={ariaLabel}
        autoComplete="off"
        className="pl-8"
        name={name}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        size="lg"
        spellCheck={false}
        surface={surface}
        type="search"
        value={value}
      />
    </div>
  );
}
