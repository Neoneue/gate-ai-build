import type * as React from "react";

import { cn } from "@/lib/utils";

function Card({
  className,
  size = "default",
  density = "default",
  tone = "default",
  interactive = false,
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
  /**
   * Semantic edge tone. `default` = `border-border`. `danger` repoints the
   * edge to `border-destructive-subtle` — the 30% rung of the destructive
   * alpha ladder (`index.css`), which derives from `--destructive` and so
   * flips danger-600 -> danger-400 with the theme on its own. For surfaces
   * whose only action is irreversible: the Settings "Account management"
   * cancel/delete pair.
   * Deliberately quiet: the edge only has to say "this card is dangerous",
   * and at 100% (and at 50%) it out-shouted the destructive `<Button>` it
   * frames. Use the named rung, never a bare `border-destructive/30` — the
   * alpha steps are a closed set like every other visual value.
   * EDGE ONLY: the fill stays `bg-card` and the ink stays neutral, so the
   * destructive `<Button>` inside remains the loudest thing on the card.
   * Never paint a danger border onto a call site's `className`.
   */
  tone?: "default" | "danger";
  /**
   * The whole card is one click target (it navigates or opens a detail), so
   * it takes the same hover the table rows take: `hover-fine:bg-accent` plus
   * `cursor-pointer`, 150ms ease-out on background-color only, opted out
   * under reduced motion. Added 2026-09-14 for the Models Featured cards.
   *
   * `hover-fine` (not bare `hover:`) so a touch device never latches the fill
   * after a tap — identical to `TableRow`'s recipe, which is the point: a
   * clickable card and a clickable row must not feel like two systems.
   *
   * The 0.98 press scale IS here (moved 2026-09-14): `:active` propagates
   * to ancestors, so the whole framed card presses as one object. When the
   * scale lived on the inner `RowActionButton` of a flush card only the
   * content shrank and the border stood still, which read as broken. Focus
   * stays on the interactive child, which owns the real focus ring; a card
   * cannot take focus, so it must not pretend to. Never paint this hover or
   * press onto a call site's `className`.
   */
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        // Card tier: honest border-border + shadow-xs (design.md, Material
        // ladder). Tailwind shadow scale only: xs/sm/md/lg.
        "group/card flex flex-col overflow-hidden rounded-md border border-border bg-card text-card-foreground text-sm shadow-xs has-[>img:first-child]:pt-0! has-data-[slot=card-footer]:pb-0! data-[size=sm]:data-[density=default]:gap-3 data-[size=sm]:data-[density=default]:py-3 data-[density=default]:gap-4 data-[density=flush]:gap-0 data-[tone=danger]:border-destructive-subtle data-[density=default]:py-4 data-[density=flush]:py-0 data-[size=sm]:has-data-[slot=card-footer]:pb-0! *:[img:first-child]:rounded-t-md *:[img:last-child]:rounded-b-md",
        // Interactive: `TableRow`'s hover recipe, verbatim — plain
        // `hover:bg-accent`, `transition-[background-color]` (never
        // `transition-colors`: interpolating the border smudges, see
        // table.tsx), `motion-reduce:transition-none`.
        //
        // NOT `hover-fine:` — the `@custom-variant hover-fine` in index.css
        // currently compiles to invalid nested CSS
        // (`(@media …) and (&:hover) { … }`), so every `hover-fine:*` in the
        // codebase is inert, including the ones on the shelf rows. `TableRow`
        // itself uses plain `hover:`, which is why row hover works at all.
        // When `hover-fine` is repaired site-wide, this moves with it.
        interactive &&
          "cursor-pointer transition-[background-color,scale] duration-150 ease-out hover:bg-accent active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
        className
      )}
      data-density={density}
      data-interactive={interactive}
      data-size={size}
      data-slot="card"
      data-tone={tone}
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
        "type-heading-16 leading-snug group-data-[size=sm]/card:text-sm",
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
      className={cn("type-copy-14 text-muted-foreground", className)}
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
