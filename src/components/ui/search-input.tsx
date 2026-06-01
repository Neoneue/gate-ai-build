import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
 * for toolbars on white/card surfaces; `'background'` (bg-neutral-100) when the
 * search field sits directly on the page background layer.
 * ───────────────────────────────────────────────────────────────────── */

export interface SearchInputProps {
  /** Placeholder copy. Should end with `…`. */
  placeholder: string;
  /** Required accessible label. */
  ariaLabel: string;
  /** Controlled value. Omit for uncontrolled. */
  value?: string;
  /** Controlled change handler. Receives the input's new string value. */
  onChange?: (value: string) => void;
  /** Form `name` attribute. Defaults to `'q'`. */
  name?: string;
  /** Wrapper-level className override. Layout-only; do not pass `w-*` */
  className?: string;
  /** Inner input resting fill. `'card'` (default) on white/card surfaces; `'background'` on the page background layer. */
  surface?: 'card' | 'background';
}

export function SearchInput({
  placeholder,
  ariaLabel,
  value,
  onChange,
  name = 'q',
  className,
  surface = 'card',
}: SearchInputProps) {
  return (
    <div className={cn('relative w-96 min-w-0 shrink-0', className)}>
      <Search
        aria-hidden
        strokeWidth={1.75}
        className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-500"
      />
      <Input
        size="sm"
        surface={surface}
        type="search"
        name={name}
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="pl-8"
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      />
    </div>
  );
}
