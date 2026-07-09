import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface SegmentedProps {
  /** Accessible label for the option group (WCAG 1.3.1). Required when there
   *  is no adjacent visible label that describes the segmented control's purpose. */
  "aria-label"?: string;
  className?: string;
  onChange?: (value: string) => void;
  options: { value: string; label: string }[];
  /** Mirrors button conventions — `sm` for inline header chrome, `default` for standalone use. */
  size?: "sm" | "default";
  value: string;
  variant?: "pill" | "group";
}

/**
 * Two visual modes (matches CMP-001.5):
 *  - "pill": gray container, selected gets a sliding white pill
 *  - "group": adjacent borders, selected gets neutral-900 fill
 */
export function Segmented({
  options,
  value,
  onChange,
  variant = "pill",
  size = "default",
  className,
  "aria-label": ariaLabel,
}: SegmentedProps) {
  if (variant === "group") {
    return (
      <div
        aria-label={ariaLabel}
        className={cn(
          "inline-flex self-start overflow-clip rounded-sm",
          className
        )}
        role="group"
      >
        {options.map((opt, i) => {
          const selected = opt.value === value;
          return (
            <button
              aria-pressed={selected}
              className={cn(
                // Skill: emil-design-eng — color/border-only transition (never `transition-all`).
                "inline-flex items-center justify-center px-3 font-medium font-sans text-xs transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
                size === "sm" ? "h-7" : "h-8",
                selected
                  ? "border border-neutral-900 bg-neutral-900 text-white"
                  : "border-border border-t border-r border-b bg-card text-foreground",
                i === 0 && !selected && "border-l"
              )}
              key={opt.value}
              onClick={() => onChange?.(opt.value)}
              type="button"
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <SegmentedPillVariant
      ariaLabel={ariaLabel}
      className={className}
      onChange={onChange}
      options={options}
      size={size}
      value={value}
    />
  );
}

/**
 * Pill variant with a sliding white indicator. Same machinery as
 * <SegmentedPill /> (see segmented-pill.tsx) — refs measure the active
 * button and translate/width animate over a 220ms cubic-bezier. Lives
 * inline rather than calling SegmentedPill directly because Segmented's
 * <SegmentedProps> uses `onChange` (not `onValueChange`) and plain HTML
 * buttons, while SegmentedPill is a ToggleGroup wrapper.
 */
function SegmentedPillVariant({
  options,
  value,
  onChange,
  size,
  className,
  ariaLabel,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange?: (value: string) => void;
  size: "sm" | "default";
  className?: string;
  ariaLabel?: string;
}) {
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    ready: boolean;
  }>({ x: 0, y: 0, width: 0, height: 0, ready: false });
  // Transitions stay off until one frame after the first measurement, so the
  // indicator paints in its resting place on mount (incl. when this control
  // mounts inside an opening popover, whose enter animation paints the
  // zero-width indicator and would otherwise defeat the skip-first-paint
  // trick). Only user selection — which happens after this frame — animates.
  const [animate, setAnimate] = useState(false);

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

  // One frame after mount the resting indicator has painted, so turning
  // transitions on now animates only subsequent (user-driven) moves.
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex self-start rounded-sm border border-border bg-neutral-100 p-1",
        className
      )}
      role="group"
    >
      <div
        aria-hidden
        className={cn(
          "absolute top-0 left-0 rounded-xs bg-card shadow-xs",
          indicator.ready ? "opacity-100" : "opacity-0",
          // Transition lives in a class so `motion-reduce:transition-none`
          // can override it. Gated on `animate` (flips true one frame after
          // mount) so the indicator paints in place on first render and only
          // user selection slides — robust even inside an opening popover.
          animate &&
            "transition-[transform,width] duration-[220ms] [transition-timing-function:cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none"
        )}
        style={{
          transform: `translate(${indicator.x}px, ${indicator.y}px)`,
          width: indicator.width,
          height: indicator.height,
        }}
      />
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            aria-pressed={selected}
            className={cn(
              // z-10 keeps text above the indicator. Color-only transition
              // (skill: performance.md — never `transition-all`).
              "relative z-10 inline-flex items-center justify-center rounded-xs font-medium font-sans text-xs transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
              size === "sm" ? "px-3 py-1" : "px-4 py-2",
              selected
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            key={opt.value}
            onClick={() => onChange?.(opt.value)}
            ref={(el) => {
              itemRefs.current[opt.value] = el;
            }}
            type="button"
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
