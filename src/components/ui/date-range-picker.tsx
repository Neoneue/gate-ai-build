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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface DateRangePickerProps {
  value: { from: Date; to: Date } | null;
  onChange: (range: { from: Date; to: Date } | null) => void;
  className?: string;
  /** Trigger button height. Defaults to `sm` (h-8) to match the inline
   *  toolbar usage on Requests; pass `default` for h-10 page-header chrome. */
  size?: 'sm' | 'default';
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// 24-hour, zero-padded option lists for the time Selects.
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, '0'),
);
// 5-minute grid: 00, 05, 10, … 55.
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, '0'),
);

// Round a minute value to the nearest 5 and clamp to the 0–55 grid so it
// always maps to a real MINUTE_OPTIONS entry. 58 → 55, 48 → 50, 2 → 00.
function snapMinute(m: number): number {
  const snapped = Math.round(m / 5) * 5;
  return Math.min(55, Math.max(0, snapped));
}

// Zero-padded "HH:MM". The minute is snapped to the 5-minute grid so a
// value seeded from a parent (which may carry an off-grid minute) always
// has a matching option in the minute Select.
function timeOf(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(snapMinute(date.getMinutes())).padStart(2, '0');
  return `${h}:${m}`;
}

// The two halves of a "HH:MM" draft string. Each time Select edits one
// half and leaves the other untouched.
function withHour(time: string, hour: string): string {
  return `${hour}:${time.split(':')[1] ?? '00'}`;
}
function withMinute(time: string, minute: string): string {
  return `${time.split(':')[0] ?? '00'}:${minute}`;
}

// Merge a draft date with a draft "HH:MM" string into a single Date.
// Returns a fresh instance so we never mutate the calendar's draft.
function combineDateTime(date: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const out = new Date(date);
  out.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return out;
}

function formatRange(value: { from: Date; to: Date }): string {
  const { from, to } = value;
  const f = `${MONTH_LABELS[from.getMonth()]} ${from.getDate()} ${timeOf(from)}`;
  const t = `${MONTH_LABELS[to.getMonth()]} ${to.getDate()} ${timeOf(to)}`;
  return `${f} – ${t}`;
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

export function DateRangePicker({ value, onChange, className, size = 'sm' }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  // Draft mirrors the applied value when the popover opens, then diverges
  // until Apply commits or Cancel/outside-press resets it.
  const [draft, setDraft] = useState<DateRange | undefined>(
    value ? { from: value.from, to: value.to } : undefined,
  );
  // Time-of-day drafts, mirroring the `draft` DateRange pattern. Stored as
  // "HH:MM" strings, edited via the hour/minute Selects below. Defaults
  // give a date-only selection a sensible full-day span — the end default
  // is 23:55 (not :59) so it lands on the 5-minute Select grid.
  const [fromTime, setFromTime] = useState('00:00');
  const [toTime, setToTime] = useState('23:55');

  // When the popover opens, seed the drafts from the current applied value.
  // The effect runs only on `open` transitions so a parent-side value
  // change while the popover is closed doesn't stomp an in-progress draft.
  useEffect(() => {
    if (open) {
      setDraft(value ? { from: value.from, to: value.to } : undefined);
      // timeOf() snaps the minute to the 5-minute grid, so a parent value
      // with an off-grid minute (e.g. :48) still maps to a real option.
      setFromTime(value ? timeOf(value.from) : '00:00');
      setToTime(value ? timeOf(value.to) : '23:55');
    }
  }, [open, value]);

  const handleApply = () => {
    if (draft?.from && draft?.to) {
      onChange({
        from: combineDateTime(draft.from, fromTime),
        to: combineDateTime(draft.to, toTime),
      });
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
            size={size}
            className={cn(value ? 'pr-2' : undefined, className)}
            aria-label={value ? `Custom: ${formatRange(value)}` : 'Pick a custom date range'}
          >
            <CalendarIcon data-icon="inline-start" aria-hidden />
            <span>{value ? formatRange(value) : 'Custom'}</span>
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
        <div className="grid grid-cols-2 gap-3 border-t border-ink-200 p-3">
          <div className="flex flex-col gap-1">
            <span className="font-sans text-xs font-medium text-ink-600">
              Start time
            </span>
            <div className="flex items-center gap-1">
              <Select
                value={fromTime.split(':')[0]}
                onValueChange={(h) => setFromTime((t) => withHour(t, h))}
              >
                <SelectTrigger
                  size="sm"
                  aria-label="Start time hour"
                  className="flex-1 font-mono tabular-nums"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-50">
                  {HOUR_OPTIONS.map((h) => (
                    <SelectItem key={h} value={h} className="font-mono tabular-nums">
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="font-mono text-xs text-ink-400" aria-hidden>
                :
              </span>
              <Select
                value={fromTime.split(':')[1]}
                onValueChange={(m) => setFromTime((t) => withMinute(t, m))}
              >
                <SelectTrigger
                  size="sm"
                  aria-label="Start time minute"
                  className="flex-1 font-mono tabular-nums"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-50">
                  {MINUTE_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m} className="font-mono tabular-nums">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-sans text-xs font-medium text-ink-600">
              End time
            </span>
            <div className="flex items-center gap-1">
              <Select
                value={toTime.split(':')[0]}
                onValueChange={(h) => setToTime((t) => withHour(t, h))}
              >
                <SelectTrigger
                  size="sm"
                  aria-label="End time hour"
                  className="flex-1 font-mono tabular-nums"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-50">
                  {HOUR_OPTIONS.map((h) => (
                    <SelectItem key={h} value={h} className="font-mono tabular-nums">
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="font-mono text-xs text-ink-400" aria-hidden>
                :
              </span>
              <Select
                value={toTime.split(':')[1]}
                onValueChange={(m) => setToTime((t) => withMinute(t, m))}
              >
                <SelectTrigger
                  size="sm"
                  aria-label="End time minute"
                  className="flex-1 font-mono tabular-nums"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-50">
                  {MINUTE_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m} className="font-mono tabular-nums">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
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
