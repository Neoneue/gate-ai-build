import type * as React from "react";

import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * PageTitle — top-of-surface heading on composed pages (CMP-012 through
 * CMP-018). Voice maps to the semantic type scale: `h1` → `type-heading-32`,
 * `h2` → `type-heading-24`, plus `text-balance text-neutral-900 m-0`.
 *
 * Extracted 2026-05-11 after the 5-agent audit found this exact recipe
 * hand-rolled in 8 sites (every composed page's PageHeader plus the
 * shared ArtboardHeader). Each re-inline carried the same arbitrary
 * `-tracking-[1px]` value — drift waiting to happen the next time
 * someone polished one site without touching the others.
 *
 * Renders an `<h1>` by default — page title should be the primary
 * heading for each surface.
 *
 * Recipe is locked at the primitive. Type size / weight / tracking /
 * balance / margin are not overridable. Spec-sheet ArtboardHeader
 * (which uses `text-neutral-800` not 900) is a separate surface and
 * doesn't compose this primitive.
 * ───────────────────────────────────────────────────────────────────── */

export interface PageTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Heading level. Defaults to `h1` (page-title convention). */
  as?: "h1" | "h2";
}

export function PageTitle({
  as: Tag = "h1",
  className,
  children,
  ...props
}: PageTitleProps) {
  const headingClass = Tag === "h1" ? "type-heading-32" : "type-heading-24";

  return (
    <Tag
      className={cn(
        headingClass,
        "m-0 text-balance text-foreground",
        className
      )}
      data-slot="page-title"
      {...props}
    >
      {children}
    </Tag>
  );
}
