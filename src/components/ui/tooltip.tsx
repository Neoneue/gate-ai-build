import * as React from 'react';
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';

import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────
 * Tooltip — short hover/focus explanation for inline affordances.
 *
 * Surface style mirrors the rest of the floating-popup ladder (white bg,
 * ink-200 border, --shadow-popup, 4px sub-element radius). Used for things
 * like column-header info icons that explain a domain term — "what's BYOK
 * vs Gate?" — without taking permanent visual real estate.
 *
 * Wraps `@base-ui/react/tooltip`. For a single tooltip you don't need a
 * <TooltipProvider>; only wrap if multiple tooltips on the page need
 * shared open-delay behavior.
 * ───────────────────────────────────────────────────────────────────────── */

function TooltipProvider(
  props: React.ComponentProps<typeof TooltipPrimitive.Provider>,
) {
  return <TooltipPrimitive.Provider delay={250} {...props} />;
}

function Tooltip(props: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root {...props} />;
}

function TooltipTrigger(
  props: React.ComponentProps<typeof TooltipPrimitive.Trigger>,
) {
  return <TooltipPrimitive.Trigger {...props} />;
}

type TooltipContentProps = React.ComponentProps<typeof TooltipPrimitive.Popup> & {
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
};

function TooltipContent({
  className,
  side = 'top',
  align = 'center',
  sideOffset = 6,
  children,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            'max-w-xs rounded-xs border border-ink-200 bg-white px-2 py-1 text-xs leading-snug text-ink-700 shadow-(--shadow-popup) origin-[var(--transform-origin)]',
            'duration-100 ease-out data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 motion-reduce:animate-none motion-reduce:duration-0',
            className,
          )}
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent };
