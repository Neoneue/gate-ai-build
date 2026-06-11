import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─── Sheet ───────────────────────────────────────────────────────────────
 * Right-docked drawer for inspection workflows (row drill-ins, detail
 * panels). Built on the same `@base-ui/react/dialog` primitive that the
 * Dialog wrap uses, so focus management, escape-to-close, scroll-lock,
 * and aria wiring come for free.
 *
 * Why a separate primitive instead of a `position` prop on Dialog:
 *   - Visual ladder is different. Centered modals are surface-floated
 *     (12px radius, all sides shadowed). Sheets are flush against the
 *     viewport edge — rounding the right edge while the left is anchored
 *     reads disconnected, so SheetContent has zero corner radius and
 *     only a left border + modal-tier shadow.
 *   - Animation is different. Modals zoom-in from center (200ms);
 *     sheets slide-in from the right (250ms cubic-bezier 0,2,0,0,1).
 *   - Width policy is different. Modals cap at sm:max-w-sm; sheets
 *     fill the right rail at sm:max-w-2xl.
 *
 * `modal` prop (default true) passes through to Base UI's modal mode.
 * Scaffold for future non-modal mode (background interaction allowed —
 * e.g. an inspector that lets you click another row to swap context)
 * without touching the primitive again. ────────────────────────────── */

function Sheet({ modal = true, ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" modal={modal} {...props} />;
}

function SheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      className={cn(
        // Fade-only on the backdrop — the panel owns the slide motion.
        // Durations stay in lockstep with the panel: 300ms enter, 200ms exit
        // (asymmetric per the emil-design-eng skill — exits snappier than
        // enters). On close, a shorter backdrop fade than the panel slide
        // produces a visible flicker as the keyframe element reverts to its
        // resting opacity early; matching the panel keeps the dim leaving
        // alongside it.
        "data-open:fade-in-0 data-closed:fade-out-0 fixed inset-0 isolate z-50 bg-neutral-900/40 duration-300 data-closed:animate-out data-open:animate-in data-closed:fill-mode-forwards data-closed:duration-200 supports-backdrop-filter:backdrop-blur-xs motion-reduce:animate-none motion-reduce:duration-0",
        className
      )}
      data-slot="sheet-overlay"
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
}) {
  // Dev-only guard: Base UI wires `aria-labelledby` from <SheetTitle> onto
  // the popup, so a missing title leaves the dialog unnamed for AT. CMP-013
  // shipped without one before being caught in audit; this warns next time.
  const popupRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }
    const popup = popupRef.current;
    if (popup && !popup.hasAttribute("aria-labelledby")) {
      console.warn(
        "[Sheet] SheetContent rendered without a <SheetTitle>. Add one (wrap in sr-only if the design has no visible title) so the dialog has an accessible name."
      );
    }
  }, []);
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Popup
        className={cn(
          // Anchoring: full viewport height, flush against the right edge.
          // No rounded corners — the right edge is the viewport edge, and
          // rounding the left edge while the right edge is anchored reads
          // as a disconnected card rather than a docked panel.
          // Default gap-6 (24px) between header / body / footer — sheets are
          // wider inspector surfaces than centered modals (which ship gap-4),
          // so the section rhythm wants more air. Tightening at the call
          // site is allowed via `className` override.
          "fixed inset-y-0 right-0 z-50 flex w-full flex-col gap-6 overscroll-contain border-border border-l bg-card p-4 text-neutral-900 text-sm shadow-(--shadow-modal) outline-none sm:max-w-2xl",
          // Slide animation. Uses tw-animate keyframes (same plugin Dialog
          // uses for fade-in/zoom-in) — NOT a CSS `transition-transform`.
          // Mixing tw-animate keyframes for the backdrop with CSS transitions
          // for the panel runs them on different schedulers and reads as
          // choppy. Using tw-animate for both keeps the slide and the dim
          // synced. 300ms is longer than Dialog's 200ms because the slide
          // distance (640px across) is bigger than a center zoom; matches
          // shadcn Sheet's open duration. `will-change-transform` keeps the
          // panel on its own compositor layer so the GPU doesn't allocate
          // mid-slide.
          "data-open:slide-in-from-right data-closed:slide-out-to-right duration-300 ease-out will-change-transform data-closed:animate-out data-open:animate-in data-closed:fill-mode-forwards data-closed:duration-200 motion-reduce:animate-none motion-reduce:duration-0",
          className
        )}
        data-slot="sheet-content"
        ref={popupRef}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                className="absolute top-2 right-2"
                size="icon-sm"
                variant="ghost"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-2", className)}
      data-slot="sheet-header"
      {...props}
    />
  );
}

function SheetFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  // Pinned-at-bottom footer pattern: flex-col-reverse on mobile,
  // flex-row + justify-end on sm+. Negative-margin trick (-mx-4 -mb-4)
  // bleeds the footer past SheetContent's p-4 so the border-t spans
  // the full panel width, with px-4 / pb-3 restoring inner padding.
  // Mirrors the inline footer style in CMP013 and DialogFooter.
  return (
    <div
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 border-border border-t px-4 pt-3 pb-3 sm:flex-row sm:justify-end",
        className
      )}
      data-slot="sheet-footer"
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      className={cn(
        "font-heading font-medium text-base leading-none",
        className
      )}
      data-slot="sheet-title"
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      className={cn(
        "text-neutral-600 text-sm *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-neutral-900",
        className
      )}
      data-slot="sheet-description"
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
