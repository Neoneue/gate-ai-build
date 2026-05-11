import { useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface SegmentedProps {
  options: { value: string; label: string }[];
  value: string;
  onChange?: (value: string) => void;
  variant?: 'pill' | 'group';
  /** Mirrors button conventions — `sm` for inline header chrome, `default` for standalone use. */
  size?: 'sm' | 'default';
  className?: string;
}

/**
 * Two visual modes (matches CMP-001.5):
 *  - "pill": gray container, selected gets a sliding white pill
 *  - "group": adjacent borders, selected gets ink-900 fill
 */
export function Segmented({ options, value, onChange, variant = 'pill', size = 'default', className }: SegmentedProps) {
  if (variant === 'group') {
    return (
      <div className={cn('inline-flex self-start rounded-sm overflow-clip', className)}>
        {options.map((opt, i) => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange?.(opt.value)}
              className={cn(
                // Skill: emil-design-eng — color/border-only transition (never `transition-all`).
                'inline-flex items-center justify-center px-3 font-sans font-medium text-xs transition-colors duration-150 ease-out',
                size === 'sm' ? 'h-7' : 'h-8',
                selected
                  ? 'bg-ink-900 text-white border border-ink-900'
                  : 'bg-white text-ink-900 border-t border-b border-r border-ink-200',
                i === 0 && !selected && 'border-l',
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  return <SegmentedPillVariant options={options} value={value} onChange={onChange} size={size} className={className} />;
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
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange?: (value: string) => void;
  size: 'sm' | 'default';
  className?: string;
}) {
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
    <div
      className={cn(
        'relative inline-flex self-start rounded-sm p-1 bg-ink-100 border border-ink-200',
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          'absolute top-0 left-0 bg-white rounded-xs shadow-xs',
          indicator.ready ? 'opacity-100' : 'opacity-0',
          // Transition lives in a class so `motion-reduce:transition-none`
          // can override it. Gated on `indicator.ready` to skip the
          // first-paint slide-from-zero — equivalent to the prior inline
          // `transition: ready ? '…' : undefined` pattern.
          indicator.ready &&
            'transition-[transform,width] duration-[220ms] [transition-timing-function:cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none',
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
            key={opt.value}
            type="button"
            ref={(el) => {
              itemRefs.current[opt.value] = el;
            }}
            onClick={() => onChange?.(opt.value)}
            className={cn(
              // z-10 keeps text above the indicator. Color-only transition
              // (skill: performance.md — never `transition-all`).
              'relative z-10 inline-flex items-center justify-center rounded-xs font-sans font-medium text-xs transition-colors duration-150 ease-out',
              size === 'sm' ? 'py-1 px-3' : 'py-2 px-4',
              selected ? 'text-ink-900' : 'text-ink-600 hover:text-ink-900',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
