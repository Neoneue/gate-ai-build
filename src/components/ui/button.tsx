import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Skill: performance.md — never `transition-all`. Specify exactly the
  // properties that actually animate on this surface (color, ring, scale
  // for the press affordance). Press affordance is a subtle scale-DOWN to
  // 0.98 — the button presses inward on click.
  // `will-change-transform` promotes a compositing layer so the scaled text
  // re-rasters crisply (the "letters scale in cleanly" effect). Duration
  // sits at 150ms — fast enough for UI, long enough to read on press.
  "group/button inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-sm border border-transparent bg-clip-padding font-medium text-sm outline-none transition-[colors,opacity,box-shadow,scale] duration-150 ease-out will-change-transform focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 motion-reduce:transition-none motion-reduce:active:scale-100 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/85 [a]:hover:bg-primary/80",
        outline:
          "border-border bg-card shadow-xs hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 dark:hover:bg-destructive/30",
        link: "text-primary underline-offset-4 hover:underline active:opacity-80",
        // Raised control on a panel surface — the `--control-raised` token
        // (white in light, neutral-700 in dark, i.e. LIGHTER than a card in
        // dark). Distinct from `outline`, which sits on `--card`. Added
        // 2026-07-28 because three hand-rolled controls (the Ask AI composer's
        // add-context key, the scroll-to-latest FAB, the message copy glyph)
        // had each pasted this exact recipe rather than ask for a variant.
        raised:
          "border-border bg-control-raised text-accent-foreground shadow-sm hover:bg-muted hover:text-foreground",
      },
      size: {
        // shadcn-aligned scale (realigned 2026-07-28) — xs 24 / sm 32 /
        // default 36. `default` IS shadcn's `h-9`; the old `lg` (36px) and
        // `xl` (44px) are GONE. Before the realign this scale sat one step
        // below shadcn's (`default` was 32px), so every call site reached for
        // `lg` to get an ordinary button: 62 uses of `lg` against 0 uses of
        // `default` across 120 buttons. The rename is pixel-identical — `lg`'s
        // recipe simply became `default`'s. There is no size in this API that
        // shadcn does not have.
        //
        // Icon padding is SYMMETRIC (2026-07-28). A button holding an icon
        // draws in to 10px on BOTH sides — shadcn's `has-[>svg]:px-2.5` on the
        // h-8 size, expressed through this repo's `data-icon` markers. It
        // replaces a local `pl-2`/`pr-2` (8px icon side / 12px text side) that
        // shipped on 2026-07-16: shadcn has no asymmetric button padding, and
        // the lopsided edge was visible on every icon+label button in the app.
        // 10px is deliberately OFF the 4px grid — it is shadcn's value, and
        // the grid rule carves this one case out. See design.md §Buttons.
        xs: "h-6 gap-2 in-data-[slot=button-group]:rounded-sm px-3 text-xs has-data-[icon=inline-end]:px-2.5 has-data-[icon=inline-start]:px-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 gap-2 in-data-[slot=button-group]:rounded-sm px-3 text-xs has-data-[icon=inline-end]:px-2.5 has-data-[icon=inline-start]:px-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        default:
          "h-9 gap-2 px-3 text-sm has-data-[icon=inline-end]:px-2.5 has-data-[icon=inline-start]:px-2.5",
        // Icon-only — one square per text-size step, same heights: xs 24 /
        // sm 32 / icon 36. `icon-lg` is deleted along with `lg`; there is no
        // "lg" anywhere in this API. `icon` tracks `default` at 36px.
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-8 [&_svg:not([class*='size-'])]:size-3.5",
        icon: "size-9",
        /* The ONE responsive size (added 2026-07-29). A dense action row —
           reply feedback, message tools — wants a 24px box on a pointer
           device and a bigger TAP target on touch. 32px below `lg`, 24px from
           `lg`; the glyph steps 16 → 14px with it.

           Why it lives here and not in a call-site `className`: overriding a
           primitive's own size at the call site is hand-rolling
           (`.claude/rules/no-handrolling.md`), and `size` is a prop, so it
           cannot carry a breakpoint on its own. Putting the breakpoint INSIDE
           the recipe is the only form that stays composable and reusable.

           Pair it with `gap-0 lg:gap-1` on the row: the 8px the box gains on
           touch is exactly the gap it gives up, so the icon PITCH — and every
           glyph position — is unchanged. The target grows into space the row
           already owned. That matters because pitch caps a non-overlapping
           target: at a 32px pitch you cannot reach 44px without either
           widening the row or letting neighbouring targets overlap and steal
           each other's taps. WCAG 2.2 SC 2.5.8 (AA) asks 24×24; this clears
           it with room on the hand-held surfaces where it counts. */
        "icon-action":
          "size-8 lg:size-6 [&_svg:not([class*='size-'])]:size-4 lg:[&_svg:not([class*='size-'])]:size-3.5",
      },
      // Radius belongs to the primitive, never to a call site. `pill` is the
      // fully-rounded track used by full-width suggestion rows; `circle` is
      // the round icon button — a chat send key, a FAB, a scroll-to-latest
      // control. `circle` exists because FOUR separate files had hand-rolled
      // the same `rounded-full` + press + focus recipe rather than ask the
      // primitive for it (see docs/button-audit-7-28.md §2b).
      shape: {
        default: "",
        pill: "rounded-full",
        circle: "rounded-full",
      },
    },
    // Pill-shaped outline rows (the Ask AI suggestions) are list rows, not
    // toolbar buttons: the control IS the row, so the edge has to move on
    // hover/press, not just the fill. --border-hover is one step of extra
    // contrast against the surface in BOTH themes. Deliberately scoped to
    // `outline + pill` rather than all of `outline` — raising the edge on
    // every outline button in the app is a site-wide visual change and
    // belongs in its own decision.
    compoundVariants: [
      {
        variant: "outline",
        shape: "pill",
        className:
          "hover:border-border-hover active:border-border-hover dark:active:border-border-hover dark:hover:border-border-hover",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  shape = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      className={cn(buttonVariants({ variant, size, shape, className }))}
      data-slot="button"
      {...props}
    />
  );
}

export { Button };
