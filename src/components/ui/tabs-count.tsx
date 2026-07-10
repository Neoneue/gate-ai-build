import type * as React from "react";

import { cn } from "@/lib/utils";

function TabsCount({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-xs bg-muted px-2 font-medium font-mono text-muted-foreground text-xs tabular-nums",
        className
      )}
      data-slot="tabs-count"
      {...props}
    />
  );
}

export { TabsCount };
