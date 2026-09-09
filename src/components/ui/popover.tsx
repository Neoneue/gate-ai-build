import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * Popover — click-triggered floating panel for the chrome ladder
 * (filters, pickers, small forms). Wraps `@base-ui/react/popover`.
 *
 * Surface style sits on the menu/chrome ladder per design.md:
 *   rounded-sm (6px) · border neutral-200 · shadow-md.
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
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  /** Classes on the Positioner, the element Base UI places with an inline
   *  `transform`. Reach for it only to change WHERE the panel sits at a
   *  breakpoint (see the notifications bell: a full-width drop-down under
   *  the top bar below `lg`); every visual class still goes on the Popup. */
  positionerClassName?: string;
  /** Renders a Base UI Backdrop behind the panel when set. Off by default:
   *  a popover is a light, anchored surface and does not dim the page. The
   *  one consumer is the notifications bell below `lg`, where the panel is a
   *  full-width top sheet and takes the Sheet overlay's scrim so it reads as
   *  the front layer. Pass the responsive gate in the class itself. */
  backdropClassName?: string;
};

function PopoverContent({
  className,
  positionerClassName,
  backdropClassName,
  side = "bottom",
  align = "end",
  sideOffset = 8,
  children,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      {backdropClassName ? (
        <PopoverPrimitive.Backdrop
          className={cn(
            // The Sheet overlay recipe (sheet.tsx): fade-only, 300ms in and
            // 200ms out in lockstep with the panel, `fill-mode-forwards`
            // against the dismiss flicker. Behind the Positioner (z-50).
            "data-open:fade-in-0 data-closed:fade-out-0 fixed inset-0 z-40 duration-300 data-closed:animate-out data-open:animate-in data-closed:fill-mode-forwards data-closed:duration-200 motion-reduce:animate-none motion-reduce:duration-0",
            backdropClassName
          )}
          data-slot="popover-backdrop"
        />
      ) : null}
      <PopoverPrimitive.Positioner
        align={align}
        className={cn("isolate z-50 outline-none", positionerClassName)}
        side={side}
        sideOffset={sideOffset}
      >
        <PopoverPrimitive.Popup
          className={cn(
            "origin-[var(--transform-origin)] rounded-sm border border-border bg-card text-foreground shadow-md outline-none",
            "data-open:fade-in-0 data-open:zoom-in-95 data-closed:fade-out-0 data-closed:zoom-out-95 duration-150 ease-out data-closed:animate-out data-open:animate-in data-closed:fill-mode-forwards data-closed:duration-100 motion-reduce:animate-none motion-reduce:duration-0",
            className
          )}
          data-slot="popover-content"
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverContent, PopoverTrigger };
