import { lazy, Suspense, useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * AskAiSurface — where the Ask AI panel opens, extracted verbatim from
 * `DashboardChrome` when Gate Chat needed the same surface beside its
 * conversation. Two mounts of one shell:
 *
 *   lg+    a right-docked column, the LAST flex child of its row, so animating
 *          its width 0 → 368px condenses the content beside it (the push
 *          effect). The outer column clips while the inner surface stays a
 *          fixed 368px, so panel content never reflows mid-transition;
 *          `inert` when closed drops it out of the tab order.
 *   < lg   a right-docked Sheet, since there is no horizontal room to dock.
 *
 * The panel carries react-markdown and the dot-matrix animation, so it loads
 * on first open and stays mounted afterwards so the thread survives close and
 * reopen. `isDesktop` gates which mount is live, so the Sheet never portals
 * open beside the docked column.
 * ───────────────────────────────────────────────────────────────────────── */

const AskAiPanel = lazy(() =>
  import("@/components/ui/ask-ai-panel").then((m) => ({
    default: m.AskAiPanel,
  }))
);

export function AskAiSurface({
  open,
  onOpenChange,
  isDesktop,
}: {
  isDesktop: boolean;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  // Render-phase latch, not an effect: it settles in the same render the
  // panel opens, so there is no closed-then-open frame.
  const [everOpened, setEverOpened] = useState(open);
  if (open && !everOpened) {
    setEverOpened(true);
  }
  const close = () => onOpenChange(false);

  return (
    <>
      <div
        className={cn(
          "hidden shrink-0 overflow-hidden transition-[width] duration-300 ease-out will-change-[width] motion-reduce:transition-none lg:block",
          open ? "lg:w-[368px]" : "lg:w-0"
        )}
      >
        <div
          className="flex h-full w-[368px] flex-col border-border border-l bg-card"
          inert={!open}
        >
          {everOpened ? (
            <Suspense fallback={null}>
              <AskAiPanel onClose={close} open={open} />
            </Suspense>
          ) : null}
        </div>
      </div>
      <Sheet onOpenChange={onOpenChange} open={open && !isDesktop}>
        <SheetContent
          className="w-full gap-0 p-0 sm:max-w-[368px]"
          showCloseButton={false}
          side="right"
        >
          <SheetTitle className="sr-only">Ask AI</SheetTitle>
          {everOpened ? (
            <Suspense fallback={null}>
              <AskAiPanel onClose={close} open={open} />
            </Suspense>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
