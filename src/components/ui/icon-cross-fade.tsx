import type * as React from "react";
import { cloneElement } from "react";

import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * IconCrossFade — the one icon dissolve recipe, extracted 2026-09-21 from
 * the two hand copies in `DashboardChrome` (sidebar toggle) and
 * `ThemeToggle`. Both icons stay mounted inside a size-4 box, absolute
 * positioned, and swap via scale / opacity / blur so the change reads as a
 * dissolve, not a pop.
 *
 * The skill's reference 4px blur dissolves a 16px icon into fuzz at
 * scale 0.25 — 1px here softens the edge instead of vanishing the glyph.
 *
 * `active` picks which node shows: false = `first`, true = `second`.
 * ───────────────────────────────────────────────────────────────────────── */

const ICON_CLASS =
  "absolute size-4 transition-[opacity,scale,filter] duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none";
const SHOWN = "scale-100 opacity-100 blur-0";
const HIDDEN = "scale-[0.25] opacity-0 blur-[1px]";

export function IconCrossFade({
  active,
  first,
  second,
  className,
}: {
  /** false shows `first`, true shows `second`. */
  active: boolean;
  first: React.ReactElement<{ className?: string }>;
  second: React.ReactElement<{ className?: string }>;
  className?: string;
}) {
  const style = (shown: boolean) => cn(ICON_CLASS, shown ? SHOWN : HIDDEN);
  return (
    <span
      className={cn(
        "relative inline-flex size-4 items-center justify-center",
        className
      )}
    >
      {cloneElement(first, { className: style(!active) })}
      {cloneElement(second, { className: style(active) })}
    </span>
  );
}
