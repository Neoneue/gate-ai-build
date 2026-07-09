import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Menu(props: React.ComponentProps<typeof MenuPrimitive.Root>) {
  return <MenuPrimitive.Root {...props} />;
}

function MenuTrigger(
  props: React.ComponentProps<typeof MenuPrimitive.Trigger>
) {
  return <MenuPrimitive.Trigger {...props} />;
}

type MenuContentProps = React.ComponentProps<typeof MenuPrimitive.Popup> & {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

function MenuContent({
  className,
  side = "bottom",
  align = "end",
  sideOffset = 8,
  children,
  ...props
}: MenuContentProps) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        align={align}
        className="isolate z-50"
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          className={cn(
            "min-w-44 origin-[var(--transform-origin)] overflow-hidden rounded-sm border border-border bg-card p-1 text-foreground shadow-(--shadow-popup) outline-none",
            "data-open:fade-in-0 data-open:zoom-in-95 data-closed:fade-out-0 data-closed:zoom-out-95 duration-150 ease-out data-closed:animate-out data-open:animate-in data-closed:fill-mode-forwards data-closed:duration-100 motion-reduce:animate-none motion-reduce:duration-0",
            className
          )}
          data-slot="menu-content"
          {...props}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

function MenuItem({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Item> & {
  variant?: "default" | "destructive";
}) {
  return (
    <MenuPrimitive.Item
      className={cn(
        "relative flex h-8 cursor-pointer select-none items-center gap-2 rounded-xs px-2 text-sm outline-none transition-colors duration-100 ease-out data-disabled:pointer-events-none data-disabled:opacity-50 motion-reduce:transition-none",
        variant === "destructive"
          ? "text-danger-700 focus-visible:bg-danger-50 data-[highlighted]:bg-danger-50 data-[highlighted]:text-danger-700 [&_svg]:text-danger-700"
          : "text-foreground focus-visible:bg-neutral-100 data-[highlighted]:bg-neutral-100 [&_svg]:text-muted-foreground",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      data-slot="menu-item"
      data-variant={variant}
      {...props}
    />
  );
}

function MenuLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex min-w-0 flex-col gap-1 px-2 py-2", className)}
      data-slot="menu-label"
      {...props}
    />
  );
}

function MenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Separator>) {
  return (
    <MenuPrimitive.Separator
      className={cn("my-1 h-px bg-neutral-200", className)}
      data-slot="menu-separator"
      {...props}
    />
  );
}

export { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger };
