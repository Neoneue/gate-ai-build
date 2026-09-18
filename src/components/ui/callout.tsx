import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * Callout — a persistent INFO banner for scope-setting context that belongs
 * near the surface it qualifies (e.g. "Locked by your organization"). Blue
 * info tint (user direction 2026-09-03) so it reads as a banner, not a card,
 * and sits in the same family as the danger banner (`BudgetBreachBanner`).
 * Colour is the --info-* family (design.md §2 "Status info family"):
 * --info-surface wash, --info-border edge, --info-foreground-strong ink.
 * Each of those tokens carries its own dark twin, so the recipe below names
 * no theme variant; the values are unchanged (blue-50 / blue-300 / blue-900
 * light, the 10% wash + 30% border ladder and blue-300 ink dark). No
 * dismiss affordance: it states a fact about the page, it does not report
 * an event. Spec in design.md §Callout.
 * ───────────────────────────────────────────────────────────────────────── */

export function Callout({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border border-info-border bg-info-surface px-4 py-3",
        className
      )}
      role="note"
    >
      {/* h-5 wrapper centers the 16px glyph on the first 20px text line, so
          the icon stays aligned when the copy wraps. */}
      <span aria-hidden className="flex h-5 shrink-0 items-center">
        <Info
          className="size-4 text-info-foreground-strong"
          strokeWidth={1.75}
        />
      </span>
      <p className="type-copy-14 m-0 text-pretty text-info-foreground-strong">
        {children}
      </p>
    </div>
  );
}
