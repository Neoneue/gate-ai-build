import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // **Badge contract:**
  //   1. **Tone IS the signal.** Color (bg + text) carries status. Do NOT
  //      nest StatusDot inside a Badge — redundant signal and the only
  //      "icon" pattern that was a real anti-pattern.
  //   2. **Icons allowed for capability/category labels** (e.g., "Vision",
  //      "Streaming" — where the glyph is the affordance, not redundant
  //      signal). Any inner `<svg>` without an explicit `size-*` class is
  //      auto-sized to `size-3` (12px) to match `text-xs` glyph height;
  //      `gap-1` (4px) handles icon↔label spacing. Mirrors Button's
  //      `[&_svg:not([class*='size-'])]:size-3.5` pattern.
  //   3. **Symmetric `px-2` (8px) padding always.** On the 4px grid.
  //      Was `px-2.5` (10px), broke the grid.
  //   4. **Uppercase.** `uppercase` is baked in so `<Badge>blocked</Badge>`
  //      renders "BLOCKED". Digits and symbols unchanged ("200 OK" stays
  //      "200 OK").
  //   5. **Variants encode tone.** `success` / `warning` / `destructive` /
  //      `info` / `neutral` / `outline` / `ghost` / `secondary` / `link` /
  //      `default`.
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-xs border border-transparent px-2 font-medium font-mono text-xs uppercase tabular-nums transition-[color,background-color,border-color,box-shadow] duration-150 ease-out focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      /* Size. `default` is the 20px pill at 12px type every status badge
       * uses. `xs` (added 2026-09-14) is a 16px pill at 10px type through the
       * fenced `--text-2xs` step (design.md §3 "Micro tier"); its one
       * consumer is the positioning tagline on the Models page's Featured
       * cards, where a 12px mono badge outweighed the model name beside it.
       * A second consumer edits the micro-tier paragraph in design.md. */
      size: {
        default: "",
        xs: "h-4 text-2xs",
      },
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive:
          "bg-danger-100 text-danger-800 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:text-danger-300 dark:focus-visible:ring-destructive/40",
        outline: "border-border text-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",

        /* ─── Constellation Gate AI status variants ────────────── */
        success:
          "bg-success-100 text-success-800 dark:bg-success-500/15 dark:text-success-300",
        warning:
          "bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300",
        info: "bg-info-wash text-info-foreground",
        neutral: "bg-muted text-muted-foreground",
        /* Plan tier, not a status: it says which plan you are on, never that
           something succeeded or failed, so it takes the tier family
           (--tier-enterprise-wash / --tier-enterprise-foreground, §2 "Plan
           tier colours") rather than a status ramp. Enterprise is violet
           (user direction 2026-09-16). Named by ROLE so a tier badge never
           reads as a status. */
        enterprise: "bg-tier-enterprise-wash text-tier-enterprise-foreground",
        /* Pro's plan-tier badge, on the same tier family
           (--tier-pro-wash / --tier-pro-foreground). Brand blue: indigo was
           tried 2026-09-16 and reverted the same day, it read off-brand next
           to the blue nav. Distinct from `info` by token, not hue. */
        pro: "bg-tier-pro-wash text-tier-pro-foreground",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant = "default",
  size = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ size, variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      size,
      variant,
    },
  });
}

export { Badge };
