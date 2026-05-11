import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-ink-900/40 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 motion-reduce:animate-none motion-reduce:duration-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          // Skill: emil-design-eng — modals belong in the 200–500ms range
          // (slower than dropdowns; the surface is visually heavy enough that
          // a 100ms snap reads as a glitch). Origin stays centered (modal
          // exception — they aren't anchored to a trigger).
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-white p-6 text-sm text-ink-900 border border-ink-200 shadow-(--shadow-modal) overscroll-contain duration-200 ease-out outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 motion-reduce:animate-none motion-reduce:duration-0",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-3 right-3"
                size="icon-sm"
              />
            }
          >
            <XIcon
            />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

/* ─── Scroll-shell variant ────────────────────────────────────────────────
 * Detail-modal pattern: fixed header band → optional fixed summary band
 * (KPI rail) → scrollable body → fixed footer. Used by CMP-013 Request
 * detail and CMP-014 Conversation detail. The plain `DialogContent` works
 * for short forms; this set ships the structural wiring so consumers
 * don't hand-roll `flex-col / overflow-hidden / flex-1 / min-h-0 /
 * px-4 pt-4 / border-t` every time.
 *
 * Composition:
 *   <DialogScrollContent>
 *     <DialogScrollHeader>...</DialogScrollHeader>
 *     <DialogScrollSummary>...</DialogScrollSummary>   // optional
 *     <DialogScrollBody>...</DialogScrollBody>
 *     <DialogScrollFooter>...</DialogScrollFooter>
 *   </DialogScrollContent>
 *
 * `DialogScrollContent` capacities: `max-h-[90vh] flex flex-col gap-0 p-0
 * overflow-hidden` — consumer passes width override (`sm:max-w-2xl` etc.).
 * Each section owns its own `px-4` so they all line up against the modal
 * edge at 16px regardless of which sections are present.
 * ───────────────────────────────────────────────────────────────────── */

function DialogScrollContent({
  className,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      data-slot="dialog-scroll-content"
      // `gap-0 p-0 overflow-hidden flex flex-col max-h-[90vh]` is the
      // structural contract — sections inside manage their own padding so
      // a fixed footer can sit flush at the modal's bottom edge while the
      // body scrolls between fixed header/footer.
      className={cn(
        "max-h-[90vh] gap-0 p-0 overflow-hidden flex flex-col",
        className,
      )}
      {...props}
    />
  )
}

// Static spec-sheet variant of the modal chrome — renders the same outer
// shell as `DialogContent` (rounded-xl, white, border, modal shadow) but
// without portal/popup behavior, so spec artboards like CMP-007 can show
// modal mockups inline on the page. Composes with the same
// `DialogScrollHeader / Body / Footer` slots as `DialogScrollContent`,
// so padding cascades from one source of truth. `relative` is baked in
// so the close button can absolute-position against the shell.
//
// Close button is rendered by the primitive (matches `DialogContent`'s
// `showCloseButton` contract) — consumers pass `onClose` and inherit the
// canonical position/size/variant; they never hand-roll the close
// button styles or remember the `top-3 right-3` placement.
function DialogStaticContent({
  className,
  children,
  onClose,
  showCloseButton = true,
  ...props
}: React.ComponentProps<"div"> & {
  onClose?: () => void
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-static-content"
      className={cn(
        "relative flex flex-col rounded-xl bg-white border border-ink-200 shadow-(--shadow-modal) overflow-clip",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && onClose ? (
        <Button
          data-slot="dialog-static-close"
          variant="ghost"
          size="icon-sm"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-3 right-3"
          type="button"
        >
          <XIcon />
          <span className="sr-only">Close</span>
        </Button>
      ) : null}
    </div>
  )
}

function DialogScrollHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-scroll-header"
      // Fixed header band — eyebrow / title / identity meta. `pr-12` on
      // the title block in consumers is OK to clear the absolute close
      // button when needed, but the primitive itself doesn't bake it in
      // (some headers don't need it).
      className={cn("shrink-0 flex flex-col gap-3 px-6 pt-6", className)}
      {...props}
    />
  )
}

function DialogScrollSummary({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-scroll-summary"
      // Optional fixed summary band between header and scrollable body —
      // typically a KPI rail or status tile. `pt-4` separates it from
      // the header above; bottom spacing comes from the next section's
      // own padding.
      className={cn("shrink-0 px-6 pt-6", className)}
      {...props}
    />
  )
}

function DialogScrollBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-scroll-body"
      // Scrollable middle. `flex-1 min-h-0` lets it consume remaining
      // height between fixed sections; `overflow-y-auto` does the
      // scrolling. `pt-4 pb-4` provides internal breathing room from
      // the fixed sections above and below.
      className={cn("flex-1 min-h-0 overflow-y-auto px-6 pt-6 pb-6", className)}
      {...props}
    />
  )
}

function DialogScrollFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-scroll-footer"
      // Fixed footer band. `border-t` is intentional in this pattern
      // (unlike CardFooter / DialogFooter which run dividerless): the
      // body above scrolls and content can run right up to the footer's
      // top edge — the hairline visually anchors the action band so it
      // reads as chrome, not as more content.
      className={cn(
        "shrink-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-ink-200",
        className,
      )}
      {...props}
    />
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      // `mt-2` (8px) compounds with a parent `gap-4` (16px) to land at
      // 24px between the last form element and the action zone — clearer
      // gestalt than the field-to-field 16px rhythm. Consumers don't
      // need to remember to add it; it's part of the primitive contract.
      // CardFooter gets the equivalent breath naturally from Card's
      // gap-4 + CardFooter's p-4 (= 32px total, similar story).
      className={cn(
        "mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
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

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className
      )}
      {...props}
    />
  )
}

// Canonical title block for detail modals. Owns the title / meta
// typography + spacing rhythm so every modal across the project shares
// one type contract.
//
// Eyebrow intentionally OMITTED (2026-05-11): drilled-in modals
// already carry surface context from how the user got there (clicked a
// row in the Requests table → request detail modal); stacking
// "REQUEST" above the title is dashboard/card-pattern leakage into
// modal chrome. Title + adjacent badge + meta carry the meaning.
// Competitors (Linear, Vercel, Stripe, Helicone) all skip eyebrows on
// drilled-in modals. If a future modal genuinely needs a surface label,
// add the slot back with intent — don't keep dead API surface.
//
// Slots:
//   - `icon`:    optional glyph placed to the left of the title (CMP-015
//                threat type icon).
//   - `badge`:   optional pill placed to the right of the title (status
//                badge, action badge).
//   - `meta`:    optional meta line below the title — text-xs ink-500
//                wrapper; content classes (font-mono, etc.) come from
//                the consumer to match content kind (timestamp/ID vs
//                prose).
//   - `titleFont`: "sans" (default) or "mono" — the latter for cases
//                where the title text IS an identifier (CMP-013).
//   - `mode`:   "dialog" (default — uses `DialogTitle` for ARIA labeling
//                via base-ui) or "static" (renders <h2>; used by the
//                CMP-007 spec-sheet specimens that live outside a
//                <Dialog> root).
// `pr-12` is baked in so the title block always clears the absolute
// close button at top-right; no consumer needs to remember it.
function DialogTitleBlock({
  icon,
  badge,
  meta,
  children,
  className,
  titleFont = "sans",
  titleAriaLabel,
  mode = "dialog",
}: {
  icon?: React.ReactNode
  badge?: React.ReactNode
  meta?: React.ReactNode
  children: React.ReactNode
  className?: string
  titleFont?: "sans" | "mono"
  titleAriaLabel?: string
  mode?: "dialog" | "static"
}) {
  const titleClassName = cn(
    titleFont === "mono" ? "font-mono" : "font-sans",
    "text-lg leading-none font-medium text-ink-900 m-0",
  )
  const titleNode =
    mode === "static" ? (
      <h2 aria-label={titleAriaLabel} className={titleClassName}>
        {children}
      </h2>
    ) : (
      <DialogTitle aria-label={titleAriaLabel} className={titleClassName}>
        {children}
      </DialogTitle>
    )
  // Title row alignment: when an icon is present, it clusters tightly with
  // the title (`gap-2` / 8px) so they read as one visual unit. The badge
  // sits at the outer `gap-3` (12px) since it's a separate entity. Without
  // an icon, the title and badge sit at gap-3 in a flat row. Matches the
  // pre-extraction CMP-015 hand-roll shape (icon belongs to title; badge
  // is meta).
  const titleRow = icon ? (
    <>
      <div className="flex items-center gap-2 min-w-0">
        <span className="shrink-0 inline-flex items-center">{icon}</span>
        {titleNode}
      </div>
      {badge}
    </>
  ) : (
    <>
      {titleNode}
      {badge}
    </>
  )
  return (
    <div className={cn("flex flex-col gap-3 pr-12 min-w-0", className)}>
      <div className="flex items-center gap-3 flex-wrap min-w-0">
        {titleRow}
      </div>
      {meta ? (
        <div className="text-xs text-ink-500 text-pretty m-0">{meta}</div>
      ) : null}
    </div>
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-ink-600 *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-ink-900",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogScrollBody,
  DialogScrollContent,
  DialogScrollFooter,
  DialogScrollHeader,
  DialogScrollSummary,
  DialogStaticContent,
  DialogTitle,
  DialogTitleBlock,
  DialogTrigger,
}
