"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import * as React from "react";
import { usePortalTarget } from "@/lib/portal-target-context";
import { cn } from "@/lib/utils";

// Base UI's Select.Value renders the raw value, not the selected item's label.
// We mirror Radix's behavior by collecting (value → children) from any nested
// SelectItem at render time and exposing them via context for SelectValue.
const SelectLabelContext = React.createContext<Map<
  string,
  React.ReactNode
> | null>(null);

function collectItemLabels(
  nodes: React.ReactNode,
  into: Map<string, React.ReactNode>
) {
  React.Children.forEach(nodes, (node) => {
    if (
      !React.isValidElement<{ value?: unknown; children?: React.ReactNode }>(
        node
      )
    ) {
      return;
    }
    if (node.type === SelectItem && node.props.value !== undefined) {
      into.set(String(node.props.value), node.props.children);
    }
    if (node.props.children !== undefined) {
      collectItemLabels(node.props.children, into);
    }
  });
}

// Base UI's Root is generic over Value/Multiple; defaulting to string here so
// every consumer can pass plain `(v: string) => …` callbacks without per-call
// generic params or `unknown` casts.
//
// SelectProps is a discriminated union on `multiple`:
//   • single mode (default, `multiple` absent/false) — the original shape, so
//     every existing single-select call site keeps compiling unchanged.
//   • multiple mode (`multiple` true) — array value/defaultValue and an
//     array onValueChange, matching Base UI's native multi-select. Base UI
//     handles the per-item checkmark (ItemIndicator) for selected items.
type BaseRootProps = React.ComponentProps<typeof SelectPrimitive.Root>;
type SelectCommonProps = Omit<
  BaseRootProps,
  "value" | "defaultValue" | "onValueChange" | "multiple"
>;
type SingleSelectProps = SelectCommonProps & {
  multiple?: false;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};
type MultipleSelectProps = SelectCommonProps & {
  multiple: true;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
};
type SelectProps = SingleSelectProps | MultipleSelectProps;

function Select({ children, onValueChange, ...props }: SelectProps) {
  const labels = React.useMemo(() => {
    const map = new Map<string, React.ReactNode>();
    collectItemLabels(children, map);
    return map;
  }, [children]);
  // Base UI emits a string in single mode and string[] in multiple mode; the
  // discriminated union has already constrained the consumer's callback to the
  // matching signature, so one runtime forward covers both.
  const handleValueChange = onValueChange
    ? (v: unknown) =>
        (onValueChange as (value: string | string[]) => void)(
          v as string | string[]
        )
    : undefined;
  return (
    <SelectLabelContext.Provider value={labels}>
      <SelectPrimitive.Root {...props} onValueChange={handleValueChange}>
        {children}
      </SelectPrimitive.Root>
    </SelectLabelContext.Provider>
  );
}

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      className={cn("scroll-my-1 p-1", className)}
      data-slot="select-group"
      {...props}
    />
  );
}

function SelectValue({
  className,
  children,
  ...props
}: SelectPrimitive.Value.Props) {
  const labels = React.useContext(SelectLabelContext);
  return (
    <SelectPrimitive.Value
      className={cn("flex flex-1 text-left", className)}
      data-slot="select-value"
      {...props}
    >
      {children ??
        ((value) => labels?.get(String(value)) ?? (value as React.ReactNode))}
    </SelectPrimitive.Value>
  );
}

const selectTriggerVariants = cva(
  // Surface mirrors <Input /> so triggers and inputs share a row.
  // Skill: performance.md — only colors + focus-ring shadow animate; never `transition-all`.
  "group/select flex w-fit select-none items-center justify-between whitespace-nowrap rounded-sm border border-border bg-neutral-50 text-neutral-800 outline-none transition-[colors,box-shadow] duration-150 ease-out focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-neutral-400 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      size: {
        xs: "h-7 gap-2 pr-2 pl-3 text-xs",
        sm: "h-8 gap-2 pr-2 pl-3 text-xs",
        default: "h-9 gap-2 pr-3 pl-4 text-sm",
        lg: "h-10 gap-2 pr-3 pl-4 text-sm",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & VariantProps<typeof selectTriggerVariants>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(selectTriggerVariants({ size, className }))}
      data-slot="select-trigger"
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          // Chevron rotates 180° while the popup is open, back to 0 on close.
          // Transform-only + the project's strong --ease-out curve (Emil), 150ms
          // (his dropdown range); reduced-motion drops the rotation.
          <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground transition-transform duration-150 ease-out group-aria-expanded/select:rotate-180 motion-reduce:transition-none" />
        }
      />
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 8,
  align = "end",
  alignOffset = 0,
  // false = render as a real dropdown BELOW the trigger (8px gap, right-
  // aligned) that flips up near the viewport bottom — not the macOS-style
  // overlay that centers the selected item over the trigger. House standard.
  alignItemWithTrigger = false,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  // Optional override (defaults to <body>). See @/lib/portal-target.
  const portalContainer = usePortalTarget();
  return (
    <SelectPrimitive.Portal container={portalContainer ?? undefined}>
      <SelectPrimitive.Positioner
        align={align}
        alignItemWithTrigger={alignItemWithTrigger}
        alignOffset={alignOffset}
        className="isolate z-50"
        side={side}
        sideOffset={sideOffset}
      >
        <SelectPrimitive.Popup
          className={cn(
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:fade-in-0 data-open:zoom-in-95 data-closed:fade-out-0 data-closed:zoom-out-95 relative isolate z-50 max-h-(--available-height) min-w-(--anchor-width) origin-(--transform-origin) overflow-y-auto rounded-sm border border-border bg-card p-1 text-popover-foreground shadow-(--shadow-popup) duration-150 ease-out data-[align-trigger=true]:animate-none data-closed:animate-out data-open:animate-in data-closed:fill-mode-forwards motion-reduce:animate-none motion-reduce:duration-0",
            className
          )}
          data-align-trigger={alignItemWithTrigger}
          data-slot="select-content"
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      className={cn("px-2 py-1 text-muted-foreground text-xs", className)}
      data-slot="select-label"
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex h-8 w-full cursor-pointer select-none items-center gap-2 rounded-xs py-0 pr-8 pl-3 text-sm outline-hidden focus:bg-neutral-100 data-disabled:pointer-events-none data-[highlighted]:bg-neutral-100 data-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      data-slot="select-item"
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <CheckIcon className="pointer-events-none" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      data-slot="select-separator"
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      data-slot="select-scroll-up-button"
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpArrow>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      data-slot="select-scroll-down-button"
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownArrow>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
