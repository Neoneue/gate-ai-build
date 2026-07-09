import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DayPickerProps } from "react-day-picker";

import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * Calendar — thin wrapper over react-day-picker styled to the project's
 * design tokens. Day cells are 32px (4px grid), font-mono tabular-nums
 * for digit alignment, selected = neutral-900 / white, range middle =
 * neutral-100 / neutral-900. Today is hinted with a ring rather than a fill so
 * it never competes visually with a selection.
 *
 * RDP applies each entry of the `classNames` prop to its matching DOM
 * node — `day` ends up on the <td>, `day_button` on the inner <button>.
 * Range fills sit on the cell (so the band runs edge-to-edge across the
 * row); selected end states paint the button (so they keep their own
 * rounded corners inside the cell).
 *
 * Pass through any `react-day-picker` v10 prop (mode, selected, onSelect,
 * fromDate, toDate, …). For range usage, see `date-range-picker.tsx`.
 * ───────────────────────────────────────────────────────────────────────── */

type CalendarProps = DayPickerProps & {
  className?: string;
};

export function Calendar({
  className,
  classNames,
  components,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      className={cn("flex flex-col gap-3 p-4", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "flex flex-col gap-3",
        month_caption: "relative flex items-center justify-center h-10",
        caption_label: "font-sans text-sm font-medium text-foreground",
        nav: "absolute inset-x-2 top-1 flex items-center justify-between h-8 pointer-events-none",
        button_previous: cn(
          "pointer-events-auto relative z-10 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-xs",
          "text-muted-foreground hover:bg-neutral-100 hover:text-foreground",
          "outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:opacity-40"
        ),
        button_next: cn(
          "pointer-events-auto relative z-10 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-xs",
          "text-muted-foreground hover:bg-neutral-100 hover:text-foreground",
          "outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:opacity-40"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "flex-1 font-sans uppercase text-xs text-muted-foreground font-normal pb-2",
        weeks: "flex flex-col gap-1",
        week: "flex w-full",
        // Base cell — range fills land here as a continuous band. The
        // button inside owns the rounded press target. `flex-1` keeps
        // the seven cells equal-width so the band aligns to the
        // weekday header above.
        day: "flex-1 p-0 text-center font-mono text-sm tabular-nums",
        // The actual pressable target. 32px square sits on the 4px
        // grid; default radius is `rounded-xs` so unselected hover
        // reads as a soft swatch instead of a circle.
        day_button: cn(
          "mx-auto inline-flex size-8 items-center justify-center rounded-xs",
          "text-foreground hover:bg-neutral-100 hover:text-foreground",
          "outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          "transition-colors duration-100 ease-out motion-reduce:transition-none"
        ),
        // Range fills land on the <td>; end-caps round only the outer
        // edge so consecutive cells visually flow into each other.
        range_start: "bg-neutral-100 rounded-l-xs",
        range_end: "bg-neutral-100 rounded-r-xs",
        range_middle: "bg-neutral-100",
        // End caps repaint the button so the selected day reads as
        // the anchor of the band. `aria-selected:` reaches the button
        // through RDP's per-day `aria-selected` attribute on the <td>.
        selected:
          "[&_button]:bg-neutral-900 [&_button]:text-white [&_button]:hover:bg-neutral-900 [&_button]:hover:text-white",
        // Today: subtle ring on the button, no fill — so it never
        // outranks a real selection.
        today:
          "[&_button]:font-medium [&_button]:ring-1 [&_button]:ring-neutral-300",
        outside: "[&_button]:text-muted-foreground",
        disabled: "[&_button]:opacity-40 [&_button]:pointer-events-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevClassName }) => {
          const Icon = orientation === "right" ? ChevronRight : ChevronLeft;
          return (
            <Icon
              aria-hidden
              className={cn("pointer-events-none size-4", chevClassName)}
              strokeWidth={1.75}
            />
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}
