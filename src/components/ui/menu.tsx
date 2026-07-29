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
            "min-w-44 origin-[var(--transform-origin)] overflow-hidden rounded-sm border border-border bg-card p-1 text-foreground shadow-md outline-none",
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

/* Active vs hover, expressed once.
 *
 * `active` = the row that is currently selected (the chat you are in, the
 * workspace you are on). It carries the full `bg-accent`. Hover/highlight is
 * `bg-accent-muted` — the same accent at half strength — so the two states can
 * never be confused: a hovered row always reads lighter than the selected one.
 *
 * Precedence is by SPECIFICITY, not source order: the active-and-highlighted
 * rules stack two data-attribute selectors (0,3,0) against the plain
 * highlighted rule's one (0,2,0), so hovering the active row provably keeps
 * the full fill regardless of how Tailwind orders its output. This is exactly
 * why the state lives on the primitive instead of a pasted call-site string —
 * a call-site `data-[highlighted]:bg-accent` would tie on specificity with the
 * recipe's muted fill and the winner would be an accident of CSS order. */
const ACTIVE_STATE =
  "data-[active=true]:bg-accent data-[active=true]:data-[highlighted]:bg-accent data-[active=true]:focus-visible:bg-accent";

function MenuItem({
  active = false,
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Item> & {
  /** Marks the currently-selected row: full `bg-accent`, and hovering it does
      not lighten it. Non-active rows highlight at `bg-accent-muted`. */
  active?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <MenuPrimitive.Item
      className={cn(
        "relative flex h-8 cursor-pointer select-none items-center gap-2 rounded-xs px-2 text-sm outline-none transition-colors duration-100 ease-out data-disabled:pointer-events-none data-disabled:opacity-50 motion-reduce:transition-none",
        variant === "destructive"
          ? "text-danger-700 focus-visible:bg-danger-50 data-[highlighted]:bg-danger-50 data-[highlighted]:text-danger-700 dark:text-danger-300 dark:data-[highlighted]:bg-danger-500/15 dark:data-[highlighted]:text-danger-300 dark:focus-visible:bg-danger-500/15 [&_svg]:text-danger-700 dark:[&_svg]:text-danger-300"
          : cn(
              "text-foreground focus-visible:bg-accent-muted data-[highlighted]:bg-accent-muted [&_svg]:text-muted-foreground",
              ACTIVE_STATE
            ),
        "[&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      data-active={active ? "true" : undefined}
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
      className={cn("my-1 h-px bg-border", className)}
      data-slot="menu-separator"
      {...props}
    />
  );
}

export { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger };
