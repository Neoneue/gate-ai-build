import { X } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TagProps {
  children: ReactNode;
  className?: string;
  onRemove?: (e: MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Removable chip — pill-shaped tag with an inline X button.
 * Used for active filters, scopes, dismissible labels.
 */
export function Tag({ children, onRemove, className }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full border border-border bg-neutral-100",
        "gap-2 font-sans text-neutral-900 text-xs",
        onRemove ? "pr-1 pl-2" : "px-3",
        className
      )}
    >
      <span>{children}</span>
      {onRemove && (
        // Skill: surfaces.md — visible target is 14px but pointers need
        // ~40px. Pseudo-element extends the hit area inwardly so
        // adjacent tags don't collide. `transition-colors` is explicit
        // (skill: performance.md — never `transition: all`).
        <button
          aria-label={
            typeof children === "string" ? `Remove ${children}` : "Remove"
          }
          className="relative inline-flex size-3.5 items-center justify-center rounded-full text-neutral-600 transition-colors duration-150 ease-out after:absolute after:-inset-2 after:content-[''] hover:bg-neutral-200 hover:text-neutral-900"
          onClick={onRemove}
          type="button"
        >
          <X size={10} strokeWidth={2} />
        </button>
      )}
    </span>
  );
}
