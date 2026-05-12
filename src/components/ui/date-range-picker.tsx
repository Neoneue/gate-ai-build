import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, XIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface DateRangePickerProps {
  value: { from: Date; to: Date } | null;
  onChange: (range: { from: Date; to: Date } | null) => void;
  className?: string;
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatRange(value: { from: Date; to: Date }): string {
  const { from, to } = value;
  return `${MONTH_LABELS[from.getMonth()]} ${from.getDate()} – ${MONTH_LABELS[to.getMonth()]} ${to.getDate()}`;
}

/* ─────────────────────────────────────────────────────────────────────────
 * DateRangePicker — trigger button + popover-hosted Calendar in range
 * mode. Holds an internal draft so partial selections don't leak into
 * the parent until Apply is pressed. Cancel (and outside-press / Esc,
 * which Base UI maps to onOpenChange(false)) discards the draft.
 *
 * The clear ✕ on the trigger only renders when a value is applied —
 * unfocused affordance for resetting back to no range.
 * ───────────────────────────────────────────────────────────────────────── */

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  // Draft mirrors the applied value when the popover opens, then diverges
  // until Apply commits or Cancel/outside-press resets it.
  const [draft, setDraft] = useState<DateRange | undefined>(
    value ? { from: value.from, to: value.to } : undefined,
  );

  // When the popover opens, seed the draft from the current applied value.
  // The effect runs only on `open` transitions so a parent-side value
  // change while the popover is closed doesn't stomp an in-progress draft.
  useEffect(() => {
    if (open) {
      setDraft(value ? { from: value.from, to: value.to } : undefined);
    }
  }, [open, value]);

  const handleApply = () => {
    if (draft?.from && draft?.to) {
      onChange({ from: draft.from, to: draft.to });
    }
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    // Stop the click from bubbling to the trigger and opening the popover.
    e.stopPropagation();
    e.preventDefault();
    onChange(null);
  };

  const canApply = Boolean(draft?.from && draft?.to);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(value ? 'pr-2' : undefined, className)}
            aria-label={value ? `Custom range: ${formatRange(value)}` : 'Pick a custom date range'}
          >
            <CalendarIcon data-icon="inline-start" aria-hidden />
            <span>{value ? formatRange(value) : 'Custom range'}</span>
            {value ? (
              // Inline reset affordance. Rendered as a non-button span so
              // it doesn't nest a <button> inside the trigger button (a11y);
              // the parent button stays the single interactive node and
              // we stopPropagation to prevent it from opening the popover.
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear custom range"
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(null);
                  }
                }}
                className="inline-flex items-center justify-center size-4 rounded-xs text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition-colors duration-100 ease-out motion-reduce:transition-none"
              >
                <XIcon className="size-3" strokeWidth={1.75} aria-hidden />
              </span>
            ) : null}
          </Button>
        }
      />
      <PopoverContent side="bottom" align="end" sideOffset={6} className="w-auto">
        <Calendar
          mode="range"
          selected={draft}
          onSelect={setDraft}
          numberOfMonths={1}
          // Default to the month containing `from` when one exists;
          // otherwise the calendar opens on the current month, which
          // matches the user's expectation of "where am I starting".
          defaultMonth={draft?.from ?? value?.from}
        />
        <div className="flex items-center justify-end gap-2 border-t border-ink-200 p-3">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleApply} disabled={!canApply}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
