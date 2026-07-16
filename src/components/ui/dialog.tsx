import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      className={cn(
        // `fill-mode-forwards` on the closed state holds opacity 0 after
        // the 100ms exit animation finishes. Without it the overlay snaps
        // back to opacity 1 (its base style) and flashes the backdrop
        // while waiting for the popup's longer 200ms exit to complete —
        // a clearly visible flicker on dismiss.
        "data-open:fade-in-0 data-closed:fade-out-0 fixed inset-0 isolate z-50 bg-neutral-900/40 duration-100 data-closed:animate-out data-open:animate-in data-closed:fill-mode-forwards supports-backdrop-filter:backdrop-blur-xs motion-reduce:animate-none motion-reduce:duration-0",
        className
      )}
      data-slot="dialog-overlay"
      {...props}
    />
  );
}

function DialogContent({
  className,
  overlayClassName,
  nestedBackdrop = false,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
  /** Optional override for the backdrop (e.g. darker scrim on nested dialogs). */
  overlayClassName?: string;
  /** Render a manual (non-deduped) backdrop. Base UI's Dialog.Backdrop
   *  dedups when dialogs nest — only the outermost backdrop reaches the
   *  DOM, leaving inner dialogs without a scrim over the parent surface.
   *  Set this on the *inner* dialog when nesting. */
  nestedBackdrop?: boolean;
}) {
  return (
    <DialogPortal>
      {nestedBackdrop ? (
        // Manual scrim — sits in the child's portal AFTER the parent's
        // popup in DOM order, same z-50, so it paints above the parent
        // and dims it. No dedup.
        <div
          aria-hidden
          className={cn(
            "data-open:fade-in-0 fixed inset-0 z-50 bg-neutral-900/40 data-open:animate-in supports-backdrop-filter:backdrop-blur-xs motion-reduce:animate-none",
            overlayClassName
          )}
          data-open=""
        />
      ) : (
        <DialogOverlay className={overlayClassName} />
      )}
      <DialogPrimitive.Popup
        className={cn(
          // Skill: emil-design-eng — modals belong in the 200–500ms range
          // (slower than dropdowns; the surface is visually heavy enough that
          // a 100ms snap reads as a glitch). Origin stays centered (modal
          // exception — they aren't anchored to a trigger).
          // `fill-mode-forwards` on data-closed holds opacity/scale at
          // their end state after the 200ms exit animation finishes, so
          // the popup doesn't snap back to opacity 1 / zoom 1 for the
          // ~28ms between animation-end and React unmount.
          "data-open:fade-in-0 data-open:zoom-in-95 data-closed:fade-out-0 data-closed:zoom-out-95 fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overscroll-contain rounded-xl border border-border bg-card p-6 text-foreground text-sm shadow-(--shadow-modal) outline-none duration-200 ease-out data-closed:animate-out data-open:animate-in data-closed:fill-mode-forwards data-closed:duration-[120ms] motion-reduce:animate-none motion-reduce:duration-0 sm:max-w-sm",
          className
        )}
        data-slot="dialog-content"
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                className="absolute top-3 right-3"
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
    </DialogPortal>
  );
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
      // `gap-0 p-0 overflow-hidden flex flex-col max-h-[90vh]` is the
      // structural contract — sections inside manage their own padding so
      // a fixed footer can sit flush at the modal's bottom edge while the
      // body scrolls between fixed header/footer.
      className={cn(
        "flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0",
        className
      )}
      data-slot="dialog-scroll-content"
      {...props}
    />
  );
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
  onClose?: () => void;
  showCloseButton?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col overflow-clip rounded-xl border border-border bg-card shadow-(--shadow-modal)",
        className
      )}
      data-slot="dialog-static-content"
      {...props}
    >
      {children}
      {showCloseButton && onClose ? (
        <Button
          aria-label="Close"
          className="absolute top-3 right-3"
          data-slot="dialog-static-close"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <XIcon />
          <span className="sr-only">Close</span>
        </Button>
      ) : null}
    </div>
  );
}

function DialogScrollHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      // Fixed header band — eyebrow / title / identity meta. `pr-12` on
      // the title block in consumers is OK to clear the absolute close
      // button when needed, but the primitive itself doesn't bake it in
      // (some headers don't need it).
      className={cn("flex shrink-0 flex-col gap-2 px-6 pt-6", className)}
      data-slot="dialog-scroll-header"
      {...props}
    />
  );
}

function DialogScrollSummary({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      // Optional fixed summary band between header and scrollable body —
      // typically a KPI rail or status tile. `pt-4` separates it from
      // the header above; bottom spacing comes from the next section's
      // own padding.
      className={cn("shrink-0 px-6 pt-6", className)}
      data-slot="dialog-scroll-summary"
      {...props}
    />
  );
}

function DialogScrollBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      // Scrollable middle. `flex-1 min-h-0` lets it consume remaining
      // height between fixed sections; `overflow-y-auto` does the
      // scrolling. `pt-4 pb-4` provides internal breathing room from
      // the fixed sections above and below.
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-6 pb-6",
        className
      )}
      data-slot="dialog-scroll-body"
      {...props}
    />
  );
}

function DialogScrollFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      // Fixed footer band. `border-t` is intentional in this pattern
      // (unlike CardFooter / DialogFooter which run dividerless): the
      // body above scrolls and content can run right up to the footer's
      // top edge — the hairline visually anchors the action band so it
      // reads as chrome, not as more content.
      className={cn(
        "flex shrink-0 items-center justify-end gap-2 border-border border-t px-6 py-4",
        className
      )}
      data-slot="dialog-scroll-footer"
      {...props}
    />
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-2", className)}
      data-slot="dialog-header"
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
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
      data-slot="dialog-footer"
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button size="lg" variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      className={cn(
        "font-heading font-medium text-base leading-none",
        className
      )}
      data-slot="dialog-title"
      {...props}
    />
  );
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
//   - `meta`:    optional meta line below the title — text-xs neutral-500
//                wrapper; content classes (font-mono, etc.) come from
//                the consumer to match content kind (timestamp/ID vs
//                prose).
//   - `titleFont`: "sans" (default) or "mono" — the latter for cases
//                where the title text IS an identifier (CMP-013).
//   - `mode`:   "dialog" (default — uses `DialogTitle` for ARIA labeling
//                via base-ui) or "static" (renders <h2>; used by the
//                CMP-007 spec-sheet specimens that live outside a
//                <Dialog> root).
// `pr-12` clears the absolute close button at top-right and is applied
// only in mode="dialog"; in mode="static" (page specimens, no close
// button) it's dropped so the title/badge sit flush at the gutter.
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
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  titleFont?: "sans" | "mono";
  titleAriaLabel?: string;
  mode?: "dialog" | "static";
}) {
  const titleClassName = cn(
    titleFont === "mono" ? "font-mono" : "font-sans",
    "m-0 font-medium text-foreground text-lg leading-none"
  );
  const titleNode =
    mode === "static" ? (
      <h2 aria-label={titleAriaLabel} className={titleClassName}>
        {children}
      </h2>
    ) : (
      <DialogTitle aria-label={titleAriaLabel} className={titleClassName}>
        {children}
      </DialogTitle>
    );
  // Title row alignment: when an icon is present, it clusters tightly with
  // the title (`gap-2` / 8px) so they read as one visual unit. The badge
  // sits at the same `gap-2` (8px layout grid) as a separate entity.
  // Without an icon, title and badge sit at gap-2 in a flat row. (Icon
  // belongs to title; badge is meta.)
  const titleRow = icon ? (
    <>
      <div className="flex min-w-0 items-center gap-2">
        <span className="inline-flex shrink-0 items-center">{icon}</span>
        {titleNode}
      </div>
      {badge}
    </>
  ) : (
    <>
      {titleNode}
      {badge}
    </>
  );
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-2",
        mode === "dialog" && "pr-12",
        className
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {titleRow}
      </div>
      {meta ? (
        <div className="type-copy-12 m-0 text-pretty text-muted-foreground">
          {meta}
        </div>
      ) : null}
    </div>
  );
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      className={cn(
        "type-copy-14 text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      data-slot="dialog-description"
      {...props}
    />
  );
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
};
