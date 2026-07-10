import type * as React from "react";

import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * SectionTitle — the single source of truth for page-level section titles
 * ("Get started", "Activity This Week", "Recent Requests", …).
 *
 * Renders an <h3> at text-xl (20px) per the heading-scale contract. Distinct
 * from `SectionHeading` (text-sm, used for modal body sections). The element
 * is overridable via `as` so the heading LEVEL can follow the document
 * outline without changing the visual voice.
 * ─────────────────────────────────────────────────────────────────────── */

type SectionTitleProps = React.ComponentPropsWithoutRef<"h3"> & {
  as?: React.ElementType;
};

export function SectionTitle({
  as: Tag = "h3",
  className,
  children,
  ...props
}: SectionTitleProps) {
  return (
    <Tag
      className={cn("type-heading-20 m-0 text-foreground", className)}
      data-slot="section-title"
      {...props}
    >
      {children}
    </Tag>
  );
}
