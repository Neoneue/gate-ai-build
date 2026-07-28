import { ChevronsUpDown, PanelRightClose, SquarePen } from "lucide-react";
import { AskAiComposer } from "@/components/ui/ask-ai-composer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─── AskAiPanel — right-docked "Ask AI" chat shell ─────────────────────────
 * Skeleton only: header (unwired "New session" caret + optional secondary
 * action + wired collapse) and an empty body surface. The inner chat elements
 * live elsewhere. Surface + borders come from the wrapper (the docked column's
 * `border-l bg-card`, or SheetContent below lg), so this component owns layout
 * only and stays single-bordered in both mounts.
 *
 * The header is `h-16` to line up flush with the 64px DashTopBar so the collapse
 * control sits on the same baseline as the top-bar actions. ──────────────── */

export interface AskAiPanelProps {
  className?: string;
  /** Collapse the panel (push-out on desktop, close the Sheet below lg). */
  onClose: () => void;
}

export function AskAiPanel({ onClose, className }: AskAiPanelProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-col text-foreground",
        className
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-border border-b px-4">
        {/* Session picker affordance — visual only (unwired). Matches the
            WorkspaceSwitcher trigger: outline button, copy-14 label, muted
            ChevronsUpDown caret. */}
        <Button size="lg" type="button" variant="outline">
          <span className="type-copy-14 text-foreground">New session</span>
          <ChevronsUpDown
            aria-hidden
            className="size-4 text-muted-foreground"
            strokeWidth={1.75}
          />
        </Button>
        <div className="flex items-center gap-1">
          {/* Secondary action for visual fidelity with the mock — unwired. */}
          <Button
            aria-label="New chat"
            size="icon-lg"
            type="button"
            variant="ghost"
          >
            <SquarePen aria-hidden strokeWidth={1.75} />
          </Button>
          <Button
            aria-label="Collapse Ask AI panel"
            onClick={onClose}
            size="icon-lg"
            type="button"
            variant="ghost"
          >
            <PanelRightClose aria-hidden strokeWidth={1.75} />
          </Button>
        </div>
      </div>
      {/* Body — 16px inset on left/right/bottom; the scrolling message region
          carries its own 16px top padding so the first message clears the top
          bar by 16px while the scroll track still runs edge-to-edge. */}
      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
        {/* Message region — intentionally empty; bubbles are a later step. */}
        <div className="min-h-0 flex-1 overflow-y-auto pt-4" />
        <AskAiComposer className="shrink-0" />
      </div>
    </div>
  );
}
