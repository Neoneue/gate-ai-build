import { Maximize, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { domAnimation, LazyMotion } from "motion/react";
import { type ReactNode, useRef } from "react";
import { MemoryRouter } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AskAiThreadProvider } from "@/hooks/ask-ai-thread-provider";
import { CANVAS_COLUMNS } from "@/pages/component-canvas/canvas-columns";
import type { CanvasGroup } from "@/pages/component-canvas/canvas-types";
import {
  GROUP_ID_PREFIX,
  useCanvasCamera,
} from "@/pages/component-canvas/use-canvas-camera";

/* The component canvas shell (owner 2026-10-13; skill
 * agents/front-end-developer/skills/component-canvas).
 *
 * Provider stack mirrors the app (main.tsx, App.tsx, DashboardChrome.tsx)
 * with safe stand-ins: MemoryRouter instead of BrowserRouter, so every Link
 * and navigate() inside a preview moves an in-memory history and never the
 * page; AskAiThreadProvider runs the local scripted responder only;
 * LazyMotion carries the animated icons' features exactly as the chrome
 * does; the Toaster sits where the app puts it.
 *
 * Layout: columns of groups in normal flow inside one transformed "world",
 * so a group that grows pushes the groups below it down and nothing can
 * overlap; the camera never rearranges anything. Groups cannot be dragged
 * and the canvas has no undo, editing or history. */

const GRID_COLUMNS: Record<CanvasGroup["columns"], string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

function GroupFrame({ group }: { group: CanvasGroup }) {
  const titleId = `${GROUP_ID_PREFIX}${group.id}-title`;
  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-2"
      id={`${GROUP_ID_PREFIX}${group.id}`}
    >
      <h2
        className="type-label-14 m-0 select-none text-muted-foreground"
        id={titleId}
      >
        {group.title}
      </h2>
      <div
        className={`grid ${GRID_COLUMNS[group.columns]} gap-x-8 gap-y-10 rounded-md border border-muted-foreground/25 border-dashed p-8`}
      >
        {group.examples.map((example) => (
          <div
            className="flex min-w-0 flex-col justify-between gap-3"
            key={example.label}
          >
            <div
              className="@container flex min-w-0 flex-col items-start"
              data-canvas-preview
            >
              {example.render()}
            </div>
            <p className="type-mono-12 m-0 select-none text-muted-foreground">
              {example.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CameraButton({
  label,
  shortcut,
  onClick,
  children,
}: {
  label: string;
  shortcut: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-keyshortcuts={shortcut}
            aria-label={label}
            className="text-muted-foreground hover:text-foreground"
            onClick={onClick}
            size="icon"
            type="button"
            variant="ghost"
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

function CanvasBoard() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const camera = useCanvasCamera(viewportRef, worldRef);

  return (
    <>
      {/* Controls first in the tab order, fixed in screen space, so they
          stay reachable however far the view is lost. */}
      <div
        aria-label="Canvas view"
        className="fixed top-4 right-4 z-40 flex items-center gap-1 rounded-sm border border-border bg-popover p-1 shadow-md"
        role="group"
      >
        <CameraButton label="Zoom out" onClick={camera.zoomOut} shortcut="-">
          <ZoomOut aria-hidden strokeWidth={1.75} />
        </CameraButton>
        <CameraButton label="Zoom in" onClick={camera.zoomIn} shortcut="+">
          <ZoomIn aria-hidden strokeWidth={1.75} />
        </CameraButton>
        <CameraButton
          label="Fit all components"
          onClick={camera.fitAll}
          shortcut="Shift+1"
        >
          <Maximize aria-hidden strokeWidth={1.75} />
        </CameraButton>
        <CameraButton
          label="Reset view to 100%"
          onClick={camera.reset}
          shortcut="Shift+0"
        >
          <RotateCcw aria-hidden strokeWidth={1.75} />
        </CameraButton>
        <ThemeToggle />
      </div>
      {/* The shell. `overflow-clip` (not hidden) so focus and find-in-page
          can never scroll it; the camera moves the board instead.
          `touch-none` is on this shell only: touches that start inside a
          nested scroller still scroll it natively, because touch-action is
          resolved up to the nearest scroll container. */}
      {/* design-allow-clip: the viewport edge IS the canvas edge; focus that
          lands outside it is revealed by moving the camera (onFocusIn). */}
      <div
        aria-describedby="component-canvas-keys"
        aria-label="Component canvas"
        aria-roledescription="canvas"
        className="fixed inset-0 touch-none overflow-clip bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-[panning=true]:cursor-grabbing data-[space=true]:cursor-grab"
        ref={viewportRef}
        role="region"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the canvas shell takes focus so its arrow, +/- and Shift+1/0 camera keys work (a focusable region, as WAI-ARIA scrollable panes do)
        tabIndex={0}
      >
        <p className="sr-only" id="component-canvas-keys">
          Drag empty space or scroll to pan. Hold Control or Command and scroll
          to zoom. With the canvas focused: arrow keys pan, plus and minus zoom,
          Shift+1 fits all components, Shift+0 resets to 100%.
        </p>
        <div
          className="invisible absolute top-0 left-0 flex origin-top-left items-start gap-24 p-24 data-[ready=true]:visible"
          ref={worldRef}
        >
          {CANVAS_COLUMNS.map((column) => (
            <div
              className="flex w-272 shrink-0 flex-col gap-20"
              key={column[0]?.id}
            >
              {column.map((group) => (
                <GroupFrame group={group} key={group.id} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function ComponentCanvas() {
  return (
    <MemoryRouter initialEntries={["/overview"]}>
      <AskAiThreadProvider>
        <LazyMotion features={domAnimation} strict>
          <CanvasBoard />
          <Toaster position="bottom-right" />
        </LazyMotion>
      </AskAiThreadProvider>
    </MemoryRouter>
  );
}
