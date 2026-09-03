import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  // Surface mirrors <SelectTrigger /> so inputs and triggers share a row.
  //
  // ONE SIZE, and no `size` prop at all (2026-08-10). Every <Input> in the app
  // is 36px: `h-9 px-3 text-sm`, shadcn's own default, folded into the base
  // recipe. The old scale carried xs (h-7) / sm (h-8) / lg (h-9) with `lg` as
  // the de facto default; `lg` was renamed to `default`, then xs and sm were
  // deleted because ZERO of the 32 call sites passed a size — they were dead
  // API that only invited drift. A text field below 36px reads as chrome
  // rather than something you type into, so the small steps had no job here.
  // <SelectTrigger> is deliberately different and keeps `sm` for compact
  // toolbar and footer chrome; a trigger is a control you read, not a field
  // you type in. Deleting the variant outright (rather than leaving a
  // one-entry cva) makes `size` a TYPE ERROR instead of a silent 4px
  // regression. See design.md §Inputs & Forms.
  "h-9 w-full min-w-0 rounded-sm border border-border px-3 text-foreground text-sm outline-none transition-colors file:inline-flex file:h-6 file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 motion-reduce:transition-none",
  {
    variants: {
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
      surface: "card",
    },
  }
);

function Input({
  className,
  type,
  surface = "card",
  ...props
}: Omit<React.ComponentProps<"input">, "size"> &
  VariantProps<typeof inputVariants>) {
  return (
    <input
      // Default OFF: dialogs autofocus their first field, and the browser's
      // saved-form-history dropdown popped over the form (user 2026-09-03).
      // Call sites that want autofill (Settings name / email) pass their own.
      autoComplete="off"
      className={cn(inputVariants({ surface, className }))}
      data-slot="input"
      type={type}
      {...props}
    />
  );
}

export { Input };
