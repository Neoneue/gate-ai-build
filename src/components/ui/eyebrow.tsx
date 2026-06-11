import type * as React from "react";

import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * Eyebrow — small sans-uppercase chrome label used above KPI values,
 * inside sidebar nav-section headers, atop CompactKpi titles, on
 * artboard / spec-sheet headers, and (formerly) on modal title blocks.
 *
 * Extracted 2026-05-11 after the 5-agent audit found 13 hand-rolled
 * occurrences of the same recipe across CMP-013/14/15/16/18 + sidebar
 * + CompactKpi + Artboard.tsx + spec sheets. Current recipe:
 * `font-mono text-xs uppercase tracking-widest font-medium
 * text-neutral-500` (font-mono → font-sans on 2026-05-14 → font-mono
 * on 2026-05-21 as the auth-page redesign pulled mono into hero
 * chrome; weight settled on font-medium; tracking 0.1em → normal →
 * tracking-wide on 2026-05-16 → tracking-widest on 2026-05-31, which
 * is 0.1em — back to the original eyebrow spacing via the named class).
 *
 * Recipe is locked at the primitive — consumers compose, never override
 * type sizes / weight / tracking. Layout-only className (`px-N`, etc.)
 * is forwarded so the eyebrow can sit inside tight containers.
 *
 * Element: `<span>` by default (inline label semantics). Pass `as="div"`
 * for a block element, or `as="label"` (with `htmlFor`) when the eyebrow
 * doubles as a form-control label.
 * ───────────────────────────────────────────────────────────────────── */

export interface EyebrowProps extends React.HTMLAttributes<HTMLElement> {
  /** Element to render as. Defaults to `<span>` (inline). */
  as?: "span" | "div" | "label";
  /** Associates a `label` eyebrow with a form control. Only meaningful
   *  when `as="label"`. */
  htmlFor?: string;
}

export function Eyebrow({
  as: Tag = "span",
  className,
  children,
  ...props
}: EyebrowProps) {
  return (
    <Tag
      className={cn(
        "font-medium font-mono text-neutral-500 text-xs uppercase tracking-widest",
        className
      )}
      data-slot="eyebrow"
      {...props}
    >
      {children}
    </Tag>
  );
}
