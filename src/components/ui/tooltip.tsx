import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import type * as React from "react";

import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * Tooltip — short hover/focus explanation for inline affordances.
 *
 * Surface style mirrors the rest of the floating-popup ladder (white bg,
 * neutral-200 border, --shadow-popup, 4px sub-element radius). Used for things
 * like column-header info icons that explain a domain term — "what's BYOK
 * vs Gate?" — without taking permanent visual real estate.
 *
 * Wraps `@base-ui/react/tooltip`. For a single tooltip you don't need a
 * <TooltipProvider>; only wrap if multiple tooltips on the page need
 * shared open-delay behavior.
 * ───────────────────────────────────────────────────────────────────────── */

function TooltipProvider(
  props: React.ComponentProps<typeof TooltipPrimitive.Provider>
) {
  return <TooltipPrimitive.Provider delay={200} {...props} />;
}

function Tooltip(props: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root {...props} />;
}

function TooltipTrigger({
  delay = 200,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  // Snappy 200ms global open delay so every inline tooltip across the app
  // shows quickly (no <TooltipProvider> required). Override per-instance
  // via the `delay` prop.
  return <TooltipPrimitive.Trigger delay={delay} {...props} />;
}

type TooltipContentProps = React.ComponentProps<
  typeof TooltipPrimitive.Popup
> & {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

function TooltipContent({
  className,
  side = "top",
  align = "center",
  sideOffset = 6,
  children,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        className="isolate z-50"
        side={side}
        sideOffset={sideOffset}
      >
        <TooltipPrimitive.Popup
          className={cn(
            "max-w-xs origin-[var(--transform-origin)] rounded-xs border border-border bg-card px-2 py-1 text-neutral-700 text-xs leading-snug shadow-(--shadow-popup)",
            "data-open:fade-in-0 data-open:zoom-in-95 data-closed:fade-out-0 data-closed:zoom-out-95 duration-150 ease-out data-closed:animate-out data-open:animate-in data-closed:fill-mode-forwards data-[instant]:duration-0 data-closed:duration-100 motion-reduce:animate-none motion-reduce:duration-0",
            className
          )}
          data-slot="tooltip-content"
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
