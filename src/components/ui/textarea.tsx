import type * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        // Surface mirrors <Input /> · padding x=16 y=12 matches Input default.
        "field-sizing-content flex min-h-16 w-full rounded-sm border border-border bg-muted px-4 py-3 text-foreground text-sm outline-none transition-colors placeholder:text-muted-foreground hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className
      )}
      data-slot="textarea"
      {...props}
    />
  );
}

export { Textarea };
