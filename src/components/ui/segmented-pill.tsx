import { useLayoutEffect, useRef, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export interface SegmentedPillOption {
  label: string;
  value: string;
}

export interface SegmentedPillProps {
  "aria-label"?: string;
  className?: string;
  onValueChange?: (value: string) => void;
  options: SegmentedPillOption[];
  /** Mirrors button conventions — `sm` for inline header chrome, `default` for standalone use. */
  size?: "sm" | "default";
  value: string;
}

/**
 * Pill-style segmented control with a sliding white indicator.
 * Wraps shadcn <ToggleGroup /> + <ToggleGroupItem /> (base-ui primitives).
 *
 * The indicator measures the active item's position on every value change
 * and animates `translateX` + `width` with a 220ms expressive cubic-bezier.
 */
export function SegmentedPill({
  value,
  onValueChange,
  options,
  size = "default",
  className,
  "aria-label": ariaLabel,
}: SegmentedPillProps) {
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    ready: boolean;
  }>({ x: 0, y: 0, width: 0, height: 0, ready: false });

  // biome-ignore lint/correctness/useExhaustiveDependencies: options is a deliberate extra dep — option changes resize the rail, so re-measure
  useLayoutEffect(() => {
    const active = itemRefs.current[value];
    if (!active) {
      return;
    }
    setIndicator({
      x: active.offsetLeft,
      y: active.offsetTop,
      width: active.offsetWidth,
      height: active.offsetHeight,
      ready: true,
    });
  }, [value, options]);

  return (
    <ToggleGroup
      aria-label={ariaLabel}
      className={cn(
        // Paper spec WW0-0: h-10 container, py-px px-1, rounded-md (8px),
        // bg neutral-100, with a `border-border` hairline so the pill reads as a
        // bordered container consistent with adjacent Select triggers and outline
        // Buttons (e.g. the "Custom" range button) and the segmented.tsx pill. The
        // border slot was always reserved (previously transparent) — no layout shift.
        // `size="sm"` drops the container to h-8 for inline header chrome
        // (toolbars next to size="sm" buttons / selects); items shrink to h-6.
        "relative gap-0 rounded-sm border border-border bg-background px-1 py-px",
        size === "sm" ? "h-8" : "h-10",
        className
      )}
      onValueChange={(v) => v.length > 0 && onValueChange?.(v[0])}
      spacing={0}
      value={[value]}
    >
      <div
        aria-hidden
        className={cn(
          // Paper spec WW9-0: rounded-[4px], white, shadow #11141714 0 1 2.
          // The hardcoded shadow has been replaced with `shadow-xs`, which
          // collapses to the same 1px/2px rgba(17,20,23) ramp. The
          // border-active hairline lifts the thumb off the track (subtle in
          // light, a visible step in dark) so the active state reads.
          "absolute top-0 left-0 rounded-xs border border-border-active bg-popover shadow-xs",
          indicator.ready ? "opacity-100" : "opacity-0",
          // Gate the slide behind reduced-motion; only enable the transition
          // once measured so the indicator never slides in from origin (0,0).
          indicator.ready &&
            "transition-[transform,width] duration-[220ms] ease-[cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none"
        )}
        style={{
          transform: `translate(${indicator.x}px, ${indicator.y}px)`,
          width: indicator.width,
          height: indicator.height,
        }}
      />
      {options.map((opt) => (
        <ToggleGroupItem
          className={cn(
            // Paper spec WW7-0: h-8, px-3 (12px), text 12px/16px Geist medium.
            "relative z-10 min-w-0 rounded-xs! px-3 font-medium font-sans text-xs leading-4",
            size === "sm" ? "h-6" : "h-8",
            "border-0 bg-transparent text-muted-foreground",
            "hover:bg-transparent hover:text-foreground",
            "data-[pressed]:bg-transparent data-[pressed]:text-foreground",
            "aria-pressed:bg-transparent aria-pressed:text-foreground"
          )}
          key={opt.value}
          ref={(el: HTMLButtonElement | null) => {
            itemRefs.current[opt.value] = el;
          }}
          value={opt.value}
        >
          {opt.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
