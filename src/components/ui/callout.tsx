import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * Callout — a persistent INFO banner for scope-setting context that belongs
 * near the surface it qualifies (e.g. "Locked by your organization"). Blue
 * info tint (user direction 2026-09-03) so it reads as a banner, not a card,
 * and sits in the same family as the danger banner (`BudgetBreachBanner`):
 * light = blue-50 wash / blue-300 border / blue-900 ink; dark = the same
 * 10% wash + 30% border ladder the danger banner uses, blue-300 ink. No
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
        "flex items-start gap-2 rounded-md border border-blue-300 bg-blue-50 px-4 py-3 dark:border-blue-500/30 dark:bg-blue-500/10",
        className
      )}
      role="note"
    >
      {/* h-5 wrapper centers the 16px glyph on the first 20px text line, so
          the icon stays aligned when the copy wraps. */}
      <span aria-hidden className="flex h-5 shrink-0 items-center">
        <Info
          className="size-4 text-blue-900 dark:text-blue-300"
          strokeWidth={1.75}
        />
      </span>
      <p className="type-copy-14 m-0 text-pretty text-blue-900 dark:text-blue-300">
        {children}
      </p>
    </div>
  );
}
