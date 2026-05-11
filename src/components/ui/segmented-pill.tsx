import { useLayoutEffect, useRef, useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

export interface SegmentedPillOption {
  value: string;
  label: string;
}

export interface SegmentedPillProps {
  value: string;
  onValueChange?: (value: string) => void;
  options: SegmentedPillOption[];
  /** Mirrors button conventions — `sm` for inline header chrome, `default` for standalone use. */
  size?: 'sm' | 'default';
  className?: string;
  'aria-label'?: string;
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
  size = 'default',
  className,
  'aria-label': ariaLabel,
}: SegmentedPillProps) {
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    ready: boolean;
  }>({ x: 0, y: 0, width: 0, height: 0, ready: false });

  useLayoutEffect(() => {
    const active = itemRefs.current[value];
    if (!active) return;
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
      value={[value]}
      onValueChange={(v) => v.length > 0 && onValueChange?.(v[0])}
      spacing={0}
      aria-label={ariaLabel}
      className={cn(
        // Paper spec WW0-0: h-10 container, py-px px-1, rounded-md (8px),
        // bg ink-100, border ink-100 (effectively borderless track).
        // `size="sm"` drops the container to h-8 for inline header chrome
        // (toolbars next to size="sm" buttons / selects); items shrink to h-6.
        'relative bg-ink-100 border border-ink-100 py-px px-1 rounded-sm gap-0',
        size === 'sm' ? 'h-8' : 'h-10',
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          // Paper spec WW9-0: rounded-[4px], white, shadow #11141714 0 1 2.
          // The hardcoded shadow has been replaced with `shadow-xs`, which
          // collapses to the same 1px/2px rgba(17,20,23) ramp.
          'absolute top-0 left-0 bg-white rounded-xs shadow-xs',
          indicator.ready ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          transform: `translate(${indicator.x}px, ${indicator.y}px)`,
          width: indicator.width,
          height: indicator.height,
          transition: indicator.ready
            ? 'transform 220ms cubic-bezier(0.77, 0, 0.175, 1), width 220ms cubic-bezier(0.77, 0, 0.175, 1)'
            : undefined,
        }}
      />
      {options.map((opt) => (
        <ToggleGroupItem
          key={opt.value}
          value={opt.value}
          ref={(el: HTMLButtonElement | null) => {
            itemRefs.current[opt.value] = el;
          }}
          className={cn(
            // Paper spec WW7-0: h-8, px-3 (12px), text 12px/16px Geist medium.
            'relative z-10 px-3 min-w-0 rounded-xs! text-xs leading-4 font-sans font-medium',
            size === 'sm' ? 'h-6' : 'h-8',
            'text-ink-600 bg-transparent border-0',
            'hover:text-ink-900 hover:bg-transparent',
            'data-[pressed]:text-ink-900 data-[pressed]:bg-transparent',
            'aria-pressed:text-ink-900 aria-pressed:bg-transparent',
          )}
        >
          {opt.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
