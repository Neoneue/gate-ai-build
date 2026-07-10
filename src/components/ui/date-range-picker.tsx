import { XIcon } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDaysIcon } from "@/components/ui/calendar-days";
import { IconActionButton } from "@/components/ui/icon-action-button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface DateRangePickerProps {
  className?: string;
  /** Trigger label when no range is selected. Defaults to "Custom". */
  emptyLabel?: string;
  onChange: (range: { from: Date; to: Date } | null) => void;
  /** Trigger button height. Defaults to `sm` (h-8) to match the inline
   *  toolbar usage on Requests; pass `default` for h-10 (40px) page-header
   *  chrome (Button's native default size), matching a sibling SegmentedPill. */
  size?: "sm" | "default";
  value: { from: Date; to: Date } | null;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// 24-hour, zero-padded option lists for the time Selects.
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0")
);
// 5-minute grid: 00, 05, 10, … 55.
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, "0")
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
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(snapMinute(date.getMinutes())).padStart(2, "0");
  return `${h}:${m}`;
}

// The two halves of a "HH:MM" draft string. Each time Select edits one
// half and leaves the other untouched.
function withHour(time: string, hour: string): string {
  return `${hour}:${time.split(":")[1] ?? "00"}`;
}
function withMinute(time: string, minute: string): string {
  return `${time.split(":")[0] ?? "00"}:${minute}`;
}

// Merge a draft date with a draft "HH:MM" string into a single Date.
// Returns a fresh instance so we never mutate the calendar's draft.
function combineDateTime(date: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
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

export function DateRangePicker({
  value,
  onChange,
  className,
  emptyLabel = "Custom",
  size = "sm",
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  // Draft mirrors the applied value when the popover opens, then diverges
  // until Apply commits or Cancel/outside-press resets it.
  const [draft, setDraft] = useState<DateRange | undefined>(
    value ? { from: value.from, to: value.to } : undefined
  );
  // Time-of-day drafts, mirroring the `draft` DateRange pattern. Stored as
  // "HH:MM" strings, edited via the hour/minute Selects below. Defaults
  // give a date-only selection a sensible full-day span — the end default
  // is 23:55 (not :59) so it lands on the 5-minute Select grid.
  const [fromTime, setFromTime] = useState("00:00");
  const [toTime, setToTime] = useState("23:55");

  const handleOpenChange = (next: boolean) => {
    // Seed drafts exactly when the popover opens so parent changes while
    // closed never stomp an in-progress edit session.
    if (next) {
      setDraft(value ? { from: value.from, to: value.to } : undefined);
      // timeOf() snaps the minute to the 5-minute grid, so a parent value
      // with an off-grid minute (e.g. :48) still maps to a real option.
      setFromTime(value ? timeOf(value.from) : "00:00");
      setToTime(value ? timeOf(value.to) : "23:55");
    }
    setOpen(next);
  };

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
    <Popover onOpenChange={handleOpenChange} open={open}>
      {/* Trigger = real Button (outline variant) consuming the primitive's
          recipe. Clear ✕ sits as a sibling IconActionButton — independent
          focus stop, own aria-label, stopPropagation on click so it does
          not also open the popover. No shared border, no hand-rolled
          chrome; the two clickable surfaces are visually adjacent with a
          small gap. */}
      <div className={cn("inline-flex shrink-0 items-center gap-1", className)}>
        <PopoverTrigger
          render={
            <Button
              aria-label={
                value
                  ? `Custom: ${formatRange(value)}`
                  : "Pick a custom date range"
              }
              size={size === "sm" ? "sm" : "default"}
              variant="outline"
            >
              <CalendarDaysIcon
                aria-hidden
                data-icon="inline-start"
                size={16}
              />
              <span>{value ? formatRange(value) : emptyLabel}</span>
            </Button>
          }
        />
        {value ? (
          <IconActionButton
            aria-label="Clear custom range"
            onClick={handleClear}
          >
            <XIcon aria-hidden className="size-3" strokeWidth={1.75} />
          </IconActionButton>
        ) : null}
      </div>
      <PopoverContent
        align="end"
        className="w-auto"
        side="bottom"
        sideOffset={8}
      >
        <Calendar
          // Default to the month containing `from` when one exists;
          // otherwise the calendar opens on the current month, which
          // matches the user's expectation of "where am I starting".
          defaultMonth={draft?.from ?? value?.from}
          mode="range"
          numberOfMonths={1}
          onSelect={setDraft}
          selected={draft}
        />
        <div className="grid grid-cols-2 gap-3 border-border border-t p-3">
          <div className="flex flex-col gap-1">
            <span className="type-label-12 text-muted-foreground">
              Start time
            </span>
            <div className="flex items-center gap-1">
              <Select
                onValueChange={(h) => setFromTime((t) => withHour(t, h))}
                value={fromTime.split(":")[0]}
              >
                <SelectTrigger
                  aria-label="Start time hour"
                  className="flex-1 font-mono tabular-nums"
                  size="sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-50">
                  {HOUR_OPTIONS.map((h) => (
                    <SelectItem
                      className="font-mono tabular-nums"
                      key={h}
                      value={h}
                    >
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span
                aria-hidden
                className="font-mono text-muted-foreground text-xs"
              >
                :
              </span>
              <Select
                onValueChange={(m) => setFromTime((t) => withMinute(t, m))}
                value={fromTime.split(":")[1]}
              >
                <SelectTrigger
                  aria-label="Start time minute"
                  className="flex-1 font-mono tabular-nums"
                  size="sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-50">
                  {MINUTE_OPTIONS.map((m) => (
                    <SelectItem
                      className="font-mono tabular-nums"
                      key={m}
                      value={m}
                    >
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="type-label-12 text-muted-foreground">
              End time
            </span>
            <div className="flex items-center gap-1">
              <Select
                onValueChange={(h) => setToTime((t) => withHour(t, h))}
                value={toTime.split(":")[0]}
              >
                <SelectTrigger
                  aria-label="End time hour"
                  className="flex-1 font-mono tabular-nums"
                  size="sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-50">
                  {HOUR_OPTIONS.map((h) => (
                    <SelectItem
                      className="font-mono tabular-nums"
                      key={h}
                      value={h}
                    >
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span
                aria-hidden
                className="font-mono text-muted-foreground text-xs"
              >
                :
              </span>
              <Select
                onValueChange={(m) => setToTime((t) => withMinute(t, m))}
                value={toTime.split(":")[1]}
              >
                <SelectTrigger
                  aria-label="End time minute"
                  className="flex-1 font-mono tabular-nums"
                  size="sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-50">
                  {MINUTE_OPTIONS.map((m) => (
                    <SelectItem
                      className="font-mono tabular-nums"
                      key={m}
                      value={m}
                    >
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-border border-t p-3">
          <Button onClick={handleCancel} size="sm" variant="ghost">
            Cancel
          </Button>
          <Button disabled={!canApply} onClick={handleApply} size="sm">
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
