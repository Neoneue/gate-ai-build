import { Popover as PopoverPrimitive } from '@base-ui/react/popover';

import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────
 * Popover — click-triggered floating panel for the chrome ladder
 * (filters, pickers, small forms). Wraps `@base-ui/react/popover`.
 *
 * Surface style sits on the menu/chrome ladder per design.md:
 *   rounded-sm (6px) · border ink-200 · shadow-(--shadow-popup).
 *
 * The `data-closed:fill-mode-forwards` rule on the popup mirrors Dialog
 * (see `dialog.tsx`) — without it the Base UI + tw-animate-css exit
 * animation snaps the popup back to opacity 1 / scale 1 for the ~28ms
 * between animation-end and React unmount, which reads as a flicker.
 * ───────────────────────────────────────────────────────────────────────── */

function Popover(props: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger(props: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

type PopoverContentProps = PopoverPrimitive.Popup.Props & {
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
};

function PopoverContent({
  className,
  side = 'bottom',
  align = 'end',
  sideOffset = 6,
  children,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        className="isolate z-50 outline-none"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            'rounded-sm border border-ink-200 bg-white text-ink-900 shadow-(--shadow-popup) origin-[var(--transform-origin)] outline-none',
            'duration-100 ease-out data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:fill-mode-forwards motion-reduce:animate-none motion-reduce:duration-0',
            className,
          )}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverContent };
