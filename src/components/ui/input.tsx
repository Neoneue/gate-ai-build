import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  // Surface mirrors <SelectTrigger /> so inputs and triggers share a row.
  "w-full min-w-0 rounded-sm border border-border text-foreground outline-none transition-colors file:inline-flex file:h-6 file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 motion-reduce:transition-none",
  {
    variants: {
      size: {
        // Paper CMP-001.2 spec — heights and L/R padding step together.
        xs: "h-7 px-3 text-xs",
        sm: "h-8 px-3 text-xs",
        default: "h-9 px-4 text-sm",
        lg: "h-10 px-4 text-sm",
      },
      // `card` (default) reads as recessed: one step darker than the white/card
      // surface it sits on. `elevated` is the opposite — a white, raised field
      // for search bars that sit OUTSIDE table cards on the page background,
      // matching the adjacent outline buttons (bg-card + shadow-xs).
      surface: {
        card: "bg-muted",
        elevated: "bg-card shadow-xs",
      },
    },
    defaultVariants: {
      size: "default",
      surface: "card",
    },
  }
);

function Input({
  className,
  type,
  size = "default",
  surface = "card",
  ...props
}: Omit<React.ComponentProps<"input">, "size"> &
  VariantProps<typeof inputVariants>) {
  return (
    <input
      className={cn(inputVariants({ size, surface, className }))}
      data-slot="input"
      type={type}
      {...props}
    />
  );
}

export { Input };
