import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

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
  return <DialogPrimitive.Root data-slot="sheet" modal={modal} {...props} />
}

function SheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        // Fade-only on the backdrop — the panel owns the slide motion.
        // Duration MUST match the panel's slide duration (300ms). On close,
        // a shorter backdrop fade finishes early and the keyframe element
        // can revert to its resting opacity for the remaining tail of the
        // panel's slide-out, producing a visible flicker. Matching them
        // keeps the dim and the panel leaving in lockstep.
        "fixed inset-0 isolate z-50 bg-ink-900/40 duration-300 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 motion-reduce:animate-none motion-reduce:duration-0",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
}) {
  // Dev-only guard: Base UI wires `aria-labelledby` from <SheetTitle> onto
  // the popup, so a missing title leaves the dialog unnamed for AT. CMP-013
  // shipped without one before being caught in audit; this warns next time.
  const popupRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!import.meta.env.DEV) return;
    const popup = popupRef.current;
    if (popup && !popup.hasAttribute('aria-labelledby')) {
      console.warn(
        '[Sheet] SheetContent rendered without a <SheetTitle>. Add one (wrap in sr-only if the design has no visible title) so the dialog has an accessible name.'
      );
    }
  }, []);
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Popup
        ref={popupRef}
        data-slot="sheet-content"
        className={cn(
          // Anchoring: full viewport height, flush against the right edge.
          // No rounded corners — the right edge is the viewport edge, and
          // rounding the left edge while the right edge is anchored reads
          // as a disconnected card rather than a docked panel.
          // Default gap-6 (24px) between header / body / footer — sheets are
          // wider inspector surfaces than centered modals (which ship gap-4),
          // so the section rhythm wants more air. Tightening at the call
          // site is allowed via `className` override.
          "fixed inset-y-0 right-0 z-50 flex flex-col gap-6 w-full sm:max-w-2xl bg-white border-l border-ink-200 shadow-(--shadow-modal) p-4 text-sm text-ink-900 outline-none overscroll-contain",
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
          "will-change-transform data-open:animate-in data-closed:animate-out data-open:slide-in-from-right data-closed:slide-out-to-right duration-300 ease-out motion-reduce:animate-none motion-reduce:duration-0",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-2 right-2"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function SheetFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  // Pinned-at-bottom footer pattern: flex-col-reverse on mobile,
  // flex-row + justify-end on sm+. Negative-margin trick (-mx-4 -mb-4)
  // bleeds the footer past SheetContent's p-4 so the border-t spans
  // the full panel width, with px-4 / pb-3 restoring inner padding.
  // Mirrors the inline footer style in CMP013 and DialogFooter.
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end border-t border-ink-200 pt-3 -mx-4 px-4 -mb-4 pb-3",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn(
        "text-sm text-ink-600 *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-ink-900",
        className
      )}
      {...props}
    />
  )
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
}
