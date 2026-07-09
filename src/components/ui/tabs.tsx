import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      data-orientation={orientation}
      data-slot="tabs"
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex items-center text-muted-foreground data-[variant=line]:rounded-none group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        default:
          "w-fit justify-center rounded-sm bg-muted p-1 group-data-horizontal/tabs:h-8",
        line: "w-full justify-start gap-0 border-border border-b bg-transparent px-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function TabsList({
  className,
  variant = "default",
  children,
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      className={cn(tabsListVariants({ variant }), "relative", className)}
      data-slot="tabs-list"
      data-variant={variant}
      {...props}
    >
      {/* Sliding indicator. Base UI publishes --active-tab-{left,top,width,height}
          on the list as the active tab changes; the indicator reads them and
          rides a 200ms ease-out transition. The `default` variant renders
          a full-bounds white pill (matches the active-tab outline). The
          `line` variant renders just a 2px bottom-edge underline that
          slides horizontally between tabs — no fade. The triggers' old
          `after:` pseudo for the line variant is removed below so this
          indicator is the sole source of the underline. */}
      {variant === "default" ? (
        <TabsPrimitive.Indicator
          className="absolute top-(--active-tab-top) left-(--active-tab-left) z-0 h-(--active-tab-height) w-(--active-tab-width) rounded-xs bg-card shadow-sm transition-[left,width,top,height] duration-200 ease-out motion-reduce:transition-none"
          data-slot="tabs-indicator"
        />
      ) : null}
      {variant === "line" ? (
        <TabsPrimitive.Indicator
          className="absolute bottom-[-1px] left-(--active-tab-left) z-0 h-0.5 w-(--active-tab-width) bg-primary transition-[left,width] duration-200 ease-out motion-reduce:transition-none"
          data-slot="tabs-indicator"
        />
      ) : null}
      {children}
    </TabsPrimitive.List>
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      className={cn(
        // Skill: performance.md — `transition-all` would also animate
        // padding / sizing; we only want color + the active-state shadow
        // and the underline opacity.
        // `z-10` keeps trigger labels above the sliding TabsIndicator
        // (which sits at z-0 inside the list).
        "relative z-10 inline-flex h-[calc(100%-1px)] items-center justify-center gap-2 whitespace-nowrap rounded-xs border border-transparent text-sm transition-colors duration-150 ease-out focus-visible:border-ring focus-visible:outline-1 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 aria-disabled:pointer-events-none aria-disabled:opacity-50 group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start motion-reduce:transition-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        "group-data-[variant=default]/tabs-list:flex-1 group-data-[variant=default]/tabs-list:px-2 group-data-[variant=default]/tabs-list:py-1 group-data-[variant=default]/tabs-list:font-medium group-data-[variant=default]/tabs-list:text-foreground/60 group-data-[variant=default]/tabs-list:hover:text-foreground dark:group-data-[variant=default]/tabs-list:text-muted-foreground dark:group-data-[variant=default]/tabs-list:hover:text-foreground",
        // Default variant active text only — bg + shadow now live on
        // the sliding TabsIndicator.
        "group-data-[variant=default]/tabs-list:data-active:text-foreground dark:group-data-[variant=default]/tabs-list:data-active:text-foreground",
        "group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:px-4 group-data-[variant=line]/tabs-list:pt-2 group-data-[variant=line]/tabs-list:pb-3 group-data-[variant=line]/tabs-list:text-muted-foreground group-data-[variant=line]/tabs-list:data-active:bg-transparent group-data-[variant=line]/tabs-list:data-active:font-medium group-data-[variant=line]/tabs-list:data-active:text-foreground group-data-[variant=line]/tabs-list:hover:bg-neutral-100 group-data-[variant=line]/tabs-list:hover:text-foreground group-data-[variant=line]/tabs-list:data-active:hover:bg-transparent",
        // Per-trigger `after:` pseudo retained ONLY for the default variant
        // vertical orientation (right-edge underline on a vertical pill list,
        // not driven by Base UI's --active-tab vars). Line variant's underline
        // now lives on the sliding TabsIndicator above so it tweens between
        // triggers instead of fade-cutting.
        "after:absolute after:opacity-0 after:transition-opacity group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=default]/tabs-list:after:bg-foreground",
        className
      )}
      data-slot="tabs-trigger"
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      className={cn("type-copy-14 flex-1 outline-none", className)}
      data-slot="tabs-content"
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
