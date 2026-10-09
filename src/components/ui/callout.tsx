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
  action,
}: {
  children: ReactNode;
  className?: string;
  /** One control at the right edge (added 2026-10-08, design.md Callout):
   *  a Button `info-outline`, so it stays in the banner's info family. It
   *  wraps under the text when the column is narrow. */
  action?: ReactNode;
}) {
  const message = (
    <>
      {/* h-5 wrapper centers the 16px glyph on the first 20px text line, so
          the icon stays aligned when the copy wraps. */}
      <span aria-hidden className="flex h-5 shrink-0 items-center">
        <Info
          aria-hidden
          className="size-4 text-info-foreground-strong"
          strokeWidth={1.75}
        />
      </span>
      <p className="type-copy-14 m-0 min-w-0 flex-1 text-pretty text-info-foreground-strong">
        {children}
      </p>
    </>
  );

  if (!action) {
    // 12px icon-to-text on every Callout (owner 2026-10-09), the same gap
    // as the action branch below.
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-md border border-info-border bg-info-surface px-4 py-3",
          className
        )}
        role="note"
      >
        {message}
      </div>
    );
  }

  // With an action: the icon and text are ONE group (12px apart, owner
  // 2026-10-08), centred against the button as a unit, so the icon never
  // floats above a single centred line. The group keeps a 16rem floor so on
  // a narrow column the action wraps below it instead of squeezing it.
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-md border border-info-border bg-info-surface px-4 py-3",
        className
      )}
      role="note"
    >
      <div className="flex min-w-0 flex-1 basis-64 items-start gap-3">
        {message}
      </div>
      <div className="ml-auto shrink-0">{action}</div>
    </div>
  );
}
