import * as React from "react"

import { cn } from "@/lib/utils"

function Card({
  className,
  size = "default",
  density = "default",
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm"
  /**
   * Internal density. `default` = py-4 + gap-4 (canonical card). `flush`
   * = py-0 + gap-0, for cards hosting full-bleed content like tables
   * (toolbar + Table + pagination siblings butt edges; Table's own
   * border-t handles section breaks). Use `flush` whenever a `<Table>`
   * is a direct child of `<Card>`.
   */
  density?: "default" | "flush"
}) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-density={density}
      className={cn(
        // Skill: surfaces.md — `--shadow-border` provides a layered ring
        // (1px ink-800/6%) plus subtle ambient lift in one token, replacing
        // the old hard `border + shadow-xs` combo. Adapts to any background
        // without re-tinting the edge.
        "group/card flex flex-col overflow-hidden rounded-md bg-white text-sm text-ink-900 shadow-(--shadow-border) has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[density=default]:gap-4 data-[density=default]:py-4 data-[density=flush]:gap-0 data-[density=flush]:py-0 data-[size=sm]:data-[density=default]:gap-3 data-[size=sm]:data-[density=default]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-md *:[img:last-child]:rounded-b-md",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        // gap-y-0 collapses the additive 4px between title and description;
        // their leading already supplies enough air. gap-x-2 keeps 8px
        // between the title column and any CardAction so a long title
        // doesn't butt against the action button.
        "group/card-header @container/card-header grid auto-rows-min items-start gap-x-2 gap-y-0 rounded-t-sm px-4 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("font-sans text-sm/5 tracking-tight text-ink-500", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-4 group-data-[size=sm]/card:px-3", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      // Card stays white throughout — no border, no wash. Structural
      // separation between content and the action zone comes from the
      // CardContent's bottom margin + the footer's `p-4`, matching how
      // DialogFooter and the rest of the action-zone pattern work in
      // this system. Surfaces that want a divider can opt in via className.
      className={cn(
        "flex items-center rounded-b-sm p-4 group-data-[size=sm]/card:p-3",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
