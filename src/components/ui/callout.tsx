import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * Callout — a quiet, persistent info banner for scope-setting context that
 * belongs near the surface it qualifies (e.g. "these tables cover the budget
 * window, not the page range"). Deliberately NOT alert chrome: card-muted
 * band, hairline border, muted ink, no dismiss affordance — it states a fact
 * about the page, it does not report an event. Spec in design.md §Callout.
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
        "flex items-start gap-2 rounded-md border border-border bg-card px-4 py-3",
        className
      )}
      role="note"
    >
      {/* h-5 wrapper centers the 16px glyph on the first 20px text line, so
          the icon stays aligned when the copy wraps. */}
      <span aria-hidden className="flex h-5 shrink-0 items-center">
        <Info className="size-4 text-muted-foreground" strokeWidth={1.75} />
      </span>
      <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
        {children}
      </p>
    </div>
  );
}
