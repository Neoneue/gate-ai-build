"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { usePortalTarget } from "@/lib/portal-target"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"

// Base UI's Select.Value renders the raw value, not the selected item's label.
// We mirror Radix's behavior by collecting (value → children) from any nested
// SelectItem at render time and exposing them via context for SelectValue.
const SelectLabelContext = React.createContext<Map<string, React.ReactNode> | null>(null)

function collectItemLabels(nodes: React.ReactNode, into: Map<string, React.ReactNode>) {
  React.Children.forEach(nodes, (node) => {
    if (!React.isValidElement<{ value?: unknown; children?: React.ReactNode }>(node)) return
    if (node.type === SelectItem && node.props.value !== undefined) {
      into.set(String(node.props.value), node.props.children)
    }
    if (node.props.children !== undefined) {
      collectItemLabels(node.props.children, into)
    }
  })
}

// Base UI's Root is generic over Value/Multiple; defaulting to string here so
// every consumer can pass plain `(v: string) => …` callbacks without per-call
// generic params or `unknown` casts.
type BaseRootProps = React.ComponentProps<typeof SelectPrimitive.Root>
type SelectProps = Omit<BaseRootProps, 'value' | 'defaultValue' | 'onValueChange'> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

function Select({ children, onValueChange, ...props }: SelectProps) {
  const labels = React.useMemo(() => {
    const map = new Map<string, React.ReactNode>()
    collectItemLabels(children, map)
    return map
  }, [children])
  return (
    <SelectLabelContext.Provider value={labels}>
      <SelectPrimitive.Root
        {...props}
        onValueChange={
          onValueChange ? (v: unknown) => onValueChange(v as string) : undefined
        }
      >
        {children}
      </SelectPrimitive.Root>
    </SelectLabelContext.Provider>
  )
}

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  )
}

function SelectValue({ className, children, ...props }: SelectPrimitive.Value.Props) {
  const labels = React.useContext(SelectLabelContext)
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 text-left", className)}
      {...props}
    >
      {children ?? ((value) => labels?.get(String(value)) ?? (value as React.ReactNode))}
    </SelectPrimitive.Value>
  )
}

const selectTriggerVariants = cva(
  // Surface mirrors <Input /> so triggers and inputs share a row.
  // Skill: performance.md — only colors + focus-ring shadow animate; never `transition-all`.
  "flex w-fit items-center justify-between rounded-sm border border-border bg-neutral-50 text-neutral-800 whitespace-nowrap transition-[colors,box-shadow] duration-150 ease-out outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-neutral-400 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      size: {
        xs: "h-7 gap-2 pl-3 pr-2 text-xs",
        sm: "h-8 gap-2 pl-3 pr-2 text-xs",
        default: "h-9 gap-2 pl-4 pr-3 text-sm",
        lg: "h-10 gap-2 pl-4 pr-3 text-sm",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props &
  VariantProps<typeof selectTriggerVariants>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(selectTriggerVariants({ size, className }))}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
        }
      />
    </SelectPrimitive.Trigger>
  )
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
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn(
            "relative isolate z-50 max-h-(--available-height) min-w-(--anchor-width) origin-(--transform-origin) overflow-y-auto rounded-sm bg-card text-popover-foreground border border-border shadow-(--shadow-popup) py-1 duration-150 ease-out data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:fill-mode-forwards motion-reduce:animate-none motion-reduce:duration-0",
            className,
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn("px-2 py-1 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-pointer items-center gap-2 rounded-xs h-8 py-0 pr-8 pl-3 text-sm outline-hidden select-none data-[highlighted]:bg-neutral-100 focus:bg-neutral-100 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
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
  )
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronUpIcon
      />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronDownIcon
      />
    </SelectPrimitive.ScrollDownArrow>
  )
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
}
