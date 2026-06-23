import type * as React from "react";

import { cn } from "@/lib/utils";

function Card({
  className,
  size = "default",
  density = "default",
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm";
  /**
   * Internal density. `default` = py-4 + gap-4 (canonical card). `flush`
   * = py-0 + gap-0, for cards hosting full-bleed content like tables
   * (toolbar + Table + pagination siblings butt edges; Table's own
   * border-t handles section breaks). Use `flush` whenever a `<Table>`
   * is a direct child of `<Card>`.
   */
  density?: "default" | "flush";
}) {
  return (
    <div
      className={cn(
        // Skill: surfaces.md — `--shadow-border` provides a layered ring
        // (1px neutral-800/6%) plus subtle ambient lift in one token, replacing
        // the old hard `border + shadow-xs` combo. Adapts to any background
        // without re-tinting the edge.
        "group/card flex flex-col overflow-hidden rounded-md border border-border bg-card text-neutral-900 text-sm shadow-xs has-[>img:first-child]:pt-0! has-data-[slot=card-footer]:pb-0! data-[size=sm]:data-[density=default]:gap-3 data-[size=sm]:data-[density=default]:py-3 data-[density=default]:gap-4 data-[density=flush]:gap-0 data-[density=default]:py-4 data-[density=flush]:py-0 data-[size=sm]:has-data-[slot=card-footer]:pb-0! *:[img:first-child]:rounded-t-md *:[img:last-child]:rounded-b-md",
        className
      )}
      data-density={density}
      data-size={size}
      data-slot="card"
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        // gap-y-0 collapses the additive 4px between title and description;
        // their leading already supplies enough air. gap-x-2 keeps 8px
        // between the title column and any CardAction so a long title
        // doesn't butt against the action button.
        "group/card-header @container/card-header grid auto-rows-min items-start gap-x-2 gap-y-0 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] group-data-[size=sm]/card:px-3 [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className
      )}
      data-slot="card-header"
      {...props}
    />
  );
}

function CardTitle({
  as: Tag = "h3",
  className,
  ...props
}: React.ComponentProps<"h3"> & { as?: React.ElementType }) {
  return (
    <Tag
      className={cn(
        "font-heading font-medium text-base leading-snug group-data-[size=sm]/card:text-sm",
        className
      )}
      data-slot="card-title"
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("font-sans text-neutral-500 text-sm/5", className)}
      data-slot="card-description"
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      data-slot="card-action"
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("px-4 group-data-[size=sm]/card:px-3", className)}
      data-slot="card-content"
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      // Card stays white throughout — no border, no wash. Structural
      // separation between content and the action zone comes from the
      // CardContent's bottom margin + the footer's `p-4`, matching how
      // DialogFooter and the rest of the action-zone pattern work in
      // this system. Surfaces that want a divider can opt in via className.
      className={cn(
        "flex items-center p-4 group-data-[size=sm]/card:p-3",
        className
      )}
      data-slot="card-footer"
      {...props}
    />
  );
}

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
