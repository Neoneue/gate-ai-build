import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // **Badge contract (locked 2026-05-11):**
  //   1. **Text-only.** Color tone (bg + text) IS the status indicator.
  //      Do NOT nest <StatusDot/>, lucide icons, or any other glyph
  //      inside a Badge — redundant signal, asymmetric padding, bad UI.
  //   2. **Symmetric `px-2.5` padding always.** Removed the prior
  //      `has-data-[icon=*]:p*-1.5` asymmetric-padding rules along with
  //      icon support — they enabled the dot-in-badge anti-pattern.
  //   3. **First letter capitalized.** `text-transform: capitalize` is
  //      baked in so `<Badge>blocked</Badge>` renders "Blocked".
  //      Consumers can write the data as it lives in their model;
  //      visual case is the primitive's job. Digits and already-uppercase
  //      letters unchanged ("200 OK" stays "200 OK").
  //   4. **Variants encode tone**, not severity-mix-with-icon. `success`
  //      / `warning` / `destructive` / `info` / `neutral` / `outline` /
  //      `ghost` / `secondary` / `link` / `default`.
  // First-letter cascade fix: prior `first-letter:uppercase` did not
  // apply to inline-flex (CSS ::first-letter is block-level only);
  // switched to `capitalize` which works on any display type.
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center overflow-hidden rounded-xs border border-transparent px-2.5 font-mono text-xs font-medium tabular-nums whitespace-nowrap capitalize transition-[colors,box-shadow] duration-150 ease-out focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",

        /* ─── Constellation Gate AI status variants ────────────── */
        success:
          "bg-success-100 text-success-700 [a]:hover:bg-success-200",
        warning:
          "bg-warning-100 text-warning-700 [a]:hover:bg-warning-200",
        info:
          "bg-blue-700/10 text-blue-600 [a]:hover:bg-blue-700/20",
        neutral:
          "bg-ink-100 text-ink-700 [a]:hover:bg-ink-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
