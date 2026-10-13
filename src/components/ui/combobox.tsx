"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import type { VariantProps } from "class-variance-authority";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { selectTriggerVariants } from "@/components/ui/select-variants";
import { usePortalTarget } from "@/lib/portal-target-context";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * Combobox — shadcn's base-nova `combobox` (Base UI Combobox), added
 * 2026-10-09 with owner approval for the onboarding model picker: a
 * searchable single-select over the ~416-model Gate catalog.
 *
 * Only this file came from the registry: `shadcn add combobox` would also
 * have overwritten button / input / textarea / input-group, so it was
 * written from the registry source instead. Aligned to this repo:
 *   · popup, rows, group label and empty line use the Select recipe
 *     (select.tsx) so a combobox and a Select read as one family;
 *   · `ComboboxTrigger` takes Select's `size` to render the Select
 *     trigger (selectTriggerVariants) for the "input inside popup"
 *     pattern; without `size` it stays the bare upstream trigger that
 *     `ComboboxInput` renders as its chevron button;
 *   · the multi-select chips parts were left out (unused; off-token).
 * See design.md §Selects & pickers.
 * ───────────────────────────────────────────────────────────────────────── */

const Combobox = ComboboxPrimitive.Root;

// Base UI's Value renders no element; this span gives the trigger the same
// value box SelectValue has (icon + label row, left-aligned, can shrink).
function ComboboxValue({
  className,
  ...props
}: ComboboxPrimitive.Value.Props & { className?: string }) {
  return (
    <span
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2 text-left",
        className
      )}
      data-slot="combobox-value"
    >
      <ComboboxPrimitive.Value {...props} />
    </span>
  );
}

function ComboboxTrigger({
  className,
  children,
  size,
  ...props
}: ComboboxPrimitive.Trigger.Props &
  VariantProps<typeof selectTriggerVariants>) {
  return (
    <ComboboxPrimitive.Trigger
      className={cn(
        "[&_svg:not([class*='size-'])]:size-4",
        size && selectTriggerVariants({ size }),
        className
      )}
      data-slot="combobox-trigger"
      {...props}
    >
      {children}
      {/* Same chevron as SelectTrigger: rotates while the popup is open. */}
      <ChevronDownIcon
        aria-hidden
        className="pointer-events-none size-4 text-muted-foreground transition-transform duration-150 ease-out group-aria-expanded/select:rotate-180 motion-reduce:transition-none"
      />
    </ComboboxPrimitive.Trigger>
  );
}

function ComboboxClear({ className, ...props }: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      className={cn(className)}
      data-slot="combobox-clear"
      render={<InputGroupButton size="icon-xs" variant="ghost" />}
      {...props}
    >
      <XIcon aria-hidden className="pointer-events-none" />
    </ComboboxPrimitive.Clear>
  );
}

function ComboboxInput({
  className,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  ...props
}: ComboboxPrimitive.Input.Props & {
  showTrigger?: boolean;
  showClear?: boolean;
}) {
  return (
    <InputGroup className={cn("w-auto", className)}>
      {/* InputGroupInput zeroes Input's ring but not its 2px ring offset,
          which paints a background-colour halo over the group's border on
          focus. The group already draws the focus ring, so drop it here. */}
      <ComboboxPrimitive.Input
        render={
          <InputGroupInput
            className="focus-visible:ring-offset-0"
            disabled={disabled}
          />
        }
        {...props}
      />
      {showTrigger || showClear ? (
        <InputGroupAddon align="inline-end">
          {showTrigger ? (
            <InputGroupButton
              className="group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent"
              data-slot="input-group-button"
              disabled={disabled}
              render={<ComboboxTrigger />}
              size="icon-xs"
              variant="ghost"
            />
          ) : null}
          {showClear ? <ComboboxClear disabled={disabled} /> : null}
        </InputGroupAddon>
      ) : null}
      {children}
    </InputGroup>
  );
}

function ComboboxContent({
  className,
  side = "bottom",
  sideOffset = 8,
  align = "start",
  alignOffset = 0,
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<
    ComboboxPrimitive.Positioner.Props,
    "side" | "align" | "sideOffset" | "alignOffset" | "anchor"
  >) {
  // Optional override (defaults to <body>). See @/lib/portal-target.
  const portalContainer = usePortalTarget();
  return (
    <ComboboxPrimitive.Portal container={portalContainer ?? undefined}>
      <ComboboxPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="isolate z-50"
        side={side}
        sideOffset={sideOffset}
      >
        {/* SelectContent's surface and motion; a search input placed inside
            the popup gets a 32px field inset 8px, room for its 2px ring and
            2px offset inside the clipped popup. */}
        <ComboboxPrimitive.Popup
          className={cn(
            "group/combobox-content data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:fade-in-0 data-open:zoom-in-95 data-closed:fade-out-0 data-closed:zoom-out-95 relative max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) overflow-hidden rounded-sm border border-border bg-card text-popover-foreground shadow-md duration-150 ease-out data-closed:animate-out data-open:animate-in data-closed:fill-mode-forwards data-closed:duration-100 *:data-[slot=input-group]:m-2 *:data-[slot=input-group]:mb-1 *:data-[slot=input-group]:h-8 motion-reduce:animate-none motion-reduce:duration-0",
            className
          )}
          data-slot="combobox-content"
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      className={cn(
        "max-h-[min(calc(--spacing(72)---spacing(9)),calc(var(--available-height)---spacing(9)))] scroll-py-1 overflow-y-auto overscroll-contain p-1 data-empty:p-0",
        className
      )}
      data-slot="combobox-list"
      {...props}
    />
  );
}

function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      className={cn(
        "relative flex h-8 w-full cursor-pointer select-none items-center gap-2 rounded-xs py-0 pr-8 pl-3 text-sm outline-hidden data-disabled:pointer-events-none data-highlighted:bg-accent-muted data-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      data-slot="combobox-item"
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <CheckIcon aria-hidden className="pointer-events-none" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  );
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return (
    <ComboboxPrimitive.Group
      className={cn(className)}
      data-slot="combobox-group"
      {...props}
    />
  );
}

function ComboboxLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      className={cn("type-copy-12 px-2 py-1 text-muted-foreground", className)}
      data-slot="combobox-label"
      {...props}
    />
  );
}

function ComboboxCollection({ ...props }: ComboboxPrimitive.Collection.Props) {
  return (
    <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
  );
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      className={cn(
        "type-copy-14 hidden w-full justify-center px-2 py-3 text-center text-muted-foreground group-data-empty/combobox-content:flex",
        className
      )}
      data-slot="combobox-empty"
      {...props}
    />
  );
}

function ComboboxSeparator({
  className,
  ...props
}: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      data-slot="combobox-separator"
      {...props}
    />
  );
}

export {
  Combobox,
  ComboboxClear,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
};
