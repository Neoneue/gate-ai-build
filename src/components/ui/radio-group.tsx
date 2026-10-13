"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      className={cn("grid w-full gap-2", className)}
      data-slot="radio-group"
      {...props}
    />
  );
}

/** `indicator`: `dot` (default) is the 16px radio with a centre dot.
 *  `check` (added 2026-10-09, owner direction) is a 24px circle that fills
 *  primary with a check when chosen, for a radio that marks a whole
 *  selectable card from its corner (the onboarding setup-method picker). */
function RadioGroupItem({
  className,
  indicator = "dot",
  ...props
}: RadioPrimitive.Root.Props & { indicator?: "dot" | "check" }) {
  return (
    <RadioPrimitive.Root
      className={cn(
        // Skill: emil-design-eng — checkbox sibling uses `transition-colors`
        // for the bg → primary transition; mirror that here so radio + check
        // animate consistently.
        "group/radio-group-item peer relative flex aspect-square size-4 shrink-0 rounded-full border border-input bg-muted outline-none transition-colors after:absolute after:-inset-x-3 after:-inset-y-2 hover:border-border-hover focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground motion-reduce:transition-none dark:bg-input/30 dark:data-checked:bg-primary dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        indicator === "check" &&
          "size-6 items-center justify-center bg-card dark:bg-card",
        className
      )}
      data-slot="radio-group-item"
      {...props}
    >
      {indicator === "check" ? (
        <RadioPrimitive.Indicator
          className="flex items-center justify-center"
          data-slot="radio-group-indicator"
        >
          <Check aria-hidden className="size-3.5" strokeWidth={1.75} />
        </RadioPrimitive.Indicator>
      ) : (
        <RadioPrimitive.Indicator
          className="flex size-4 items-center justify-center"
          data-slot="radio-group-indicator"
        >
          <span className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground" />
        </RadioPrimitive.Indicator>
      )}
    </RadioPrimitive.Root>
  );
}

export { RadioGroup, RadioGroupItem };
