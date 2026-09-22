import * as React from "react";
import type { TooltipValueType } from "recharts";
import * as RechartsPrimitive from "recharts";

import { formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const;

const INITIAL_DIMENSION = { width: 320, height: 200 } as const;
type TooltipNameType = number | string;

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
>;

type ChartContextProps = {
  config: ChartConfig;
  /** The chart's outer div. Tooltips portal to `document.body`, so they read
   *  this element's rect to turn a chart-relative `coordinate` into viewport
   *  coordinates. */
  containerRef: React.RefObject<HTMLDivElement | null>;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  initialDimension = INITIAL_DIMENSION,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"];
  initialDimension?: {
    width: number;
    height: number;
  };
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;
  const containerRef = React.useRef<HTMLDivElement>(null);

  const contextValue = React.useMemo(
    () => ({ config, containerRef }),
    [config]
  );

  return (
    <ChartContext.Provider value={contextValue}>
      {/* The '#ccc' / '#fff' below are ATTRIBUTE SELECTORS matching Recharts'
      own default strokes so they can be re-pointed to tokens; no colour
      is applied (design-allow-raw-color). */}
      <div
        className={cn(
          "flex justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-hidden [&_.recharts-surface]:outline-hidden",
          className
        )}
        data-chart={chartId}
        data-slot="chart"
        ref={containerRef}
        {...props}
      >
        <ChartStyle config={config} id={chartId} />
        <RechartsPrimitive.ResponsiveContainer
          initialDimension={initialDimension}
        >
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme ?? config.color
  );

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      // biome-ignore lint/security/noDangerouslySetInnerHtml: shadcn chart theme CSS generated from repo-controlled config constants, no user data
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ??
      itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  );
};

/** Every chart tooltip escapes its Card. `Card` is `overflow-hidden`, and a
 *  Recharts tooltip renders inside the chart container, so any box taller than
 *  the chart band used to clip. Portalling to `document.body` lifts it out;
 *  Recharts gives a portalled wrapper NO positioning, so `ChartTooltipContent`
 *  positions itself (fixed, from the container rect + `coordinate`). */
function ChartTooltip(
  props: React.ComponentProps<typeof RechartsPrimitive.Tooltip>
) {
  const portal = typeof document === "undefined" ? null : document.body;

  return <RechartsPrimitive.Tooltip portal={portal} {...props} />;
}

const TOOLTIP_CURSOR_GAP = 12;
const TOOLTIP_VIEWPORT_MARGIN = 8;

/** Turns the chart-relative `coordinate` Recharts hands the content into fixed
 *  viewport coordinates, clamped to the viewport: right of the cursor by
 *  default, flipped to its left when the box would overflow the right edge,
 *  vertically centred on the cursor and clamped 8px off either edge. */
function usePortalPosition(
  containerRef: React.RefObject<HTMLDivElement | null>,
  boxRef: React.RefObject<HTMLDivElement | null>,
  coordinate: { x?: number; y?: number } | undefined,
  active: boolean | undefined
) {
  const [style, setStyle] = React.useState<React.CSSProperties | null>(null);
  const x = coordinate?.x;
  const y = coordinate?.y;

  React.useLayoutEffect(() => {
    const box = boxRef.current;
    const chart =
      containerRef.current?.querySelector(".recharts-wrapper") ??
      containerRef.current;

    if (!(active && box && chart) || x == null || y == null) {
      return;
    }

    const rect = chart.getBoundingClientRect();
    const { width, height } = box.getBoundingClientRect();
    const cursorX = rect.left + x;
    const cursorY = rect.top + y;

    let left = cursorX + TOOLTIP_CURSOR_GAP;

    if (left + width > window.innerWidth - TOOLTIP_VIEWPORT_MARGIN) {
      left = cursorX - TOOLTIP_CURSOR_GAP - width;
    }

    left = Math.min(
      Math.max(left, TOOLTIP_VIEWPORT_MARGIN),
      Math.max(window.innerWidth - width - TOOLTIP_VIEWPORT_MARGIN, 0)
    );

    const top = Math.min(
      Math.max(cursorY - height / 2, TOOLTIP_VIEWPORT_MARGIN),
      Math.max(window.innerHeight - height - TOOLTIP_VIEWPORT_MARGIN, 0)
    );

    setStyle({ left, position: "fixed", top });
  }, [active, boxRef, containerRef, x, y]);

  return style;
}

/** The ONE chart-tooltip recipe (design.md "Chart tooltip & legend",
 *  2026-09-20). Consumers pass data plus a `valueFormatter`; they never draw a
 *  row. Recharts' `formatter` prop is deliberately NOT honoured here — a JSX
 *  formatter bypasses the recipe and is how three drifted tooltips happened. */
function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  valueFormatter,
  color,
  nameKey,
  labelKey,
  coordinate,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<"div"> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
    /** Formats every numeric value in the box. Falls back to `formatNumber`. */
    valueFormatter?: (value: number) => string;
    /** Cursor position, chart-relative. Recharts passes it to `content`; the
     *  portalled box turns it into viewport coordinates. */
    coordinate?: { x?: number; y?: number };
  } & Omit<
    RechartsPrimitive.DefaultTooltipContentProps<
      TooltipValueType,
      TooltipNameType
    >,
    "accessibilityLayer"
  >) {
  const { config, containerRef } = useChart();
  const boxRef = React.useRef<HTMLDivElement>(null);
  const positionStyle = usePortalPosition(
    containerRef,
    boxRef,
    coordinate,
    active
  );

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null;
    }

    const [item] = payload;
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? "value"}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value =
      !labelKey && typeof label === "string"
        ? (config[label]?.label ?? label)
        : itemConfig?.label;

    if (labelFormatter) {
      return (
        <div className={cn("type-label-12 text-foreground", labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      );
    }

    if (!value) {
      return null;
    }

    return (
      <div className={cn("type-label-12 text-foreground", labelClassName)}>
        {value}
      </div>
    );
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ]);

  if (!(active && payload?.length)) {
    return null;
  }

  const nestLabel = payload.length === 1 && indicator !== "dot";

  return (
    <div
      className={cn(
        "pointer-events-none z-50 grid min-w-32 items-start gap-2 rounded-sm border border-border bg-card px-3 py-2 text-foreground text-xs shadow-md",
        className
      )}
      ref={boxRef}
      style={
        positionStyle ?? {
          left: 0,
          position: "fixed",
          top: 0,
          visibility: "hidden",
        }
      }
    >
      {nestLabel ? null : tooltipLabel}
      <div className="grid gap-2">
        {payload
          .filter((item) => item.type !== "none")
          .map((item, index) => {
            const key = `${nameKey ?? item.name ?? item.dataKey ?? "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            // Config colour first (2026-09-17): the config is what the legend
            // reads, so a row's dot matches the legend even when the drawn
            // series uses a different stroke (Security's Total row is blue
            // in the tooltip while the trace stays red). Every other chart
            // sets config colour === stroke, so nothing else moves.
            const indicatorColor =
              color ?? itemConfig?.color ?? item.payload?.fill ?? item.color;
            const seriesName = hideIndicator
              ? null
              : (itemConfig?.label ?? item.name);
            // `hideIndicator` is the single-series-spark signal (design.md):
            // the date line already names the series, so the row drops BOTH
            // the dot and the name and the value sits alone under the date —
            // the geometry those sparks had before this recipe landed.
            const showLead = !hideIndicator || nestLabel;
            const formattedValue =
              typeof item.value === "number"
                ? (valueFormatter ?? formatNumber)(item.value)
                : String(item.value);

            return (
              <div
                className={cn(
                  "flex w-full gap-6",
                  indicator === "dot" ? "items-center" : "items-stretch"
                )}
                key={`${item.dataKey ?? item.name ?? index}`}
              >
                {showLead ? (
                  <div className="flex min-w-0 flex-1 items-center gap-2 [&>svg]:size-2 [&>svg]:text-muted-foreground">
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-full border-(--color-border) bg-(--color-bg)",
                            {
                              "size-2": indicator === "dot",
                              "w-1 self-stretch rounded-xs":
                                indicator === "line",
                              "w-0 self-stretch rounded-none border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-1": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div className="grid gap-2">
                      {nestLabel ? tooltipLabel : null}
                      {seriesName ? (
                        <span className="type-copy-12 text-muted-foreground">
                          {seriesName}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                {item.value != null && (
                  <span className="type-mono-12 text-foreground">
                    {formattedValue}
                  </span>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey,
}: React.ComponentProps<"div"> & {
  hideIcon?: boolean;
  nameKey?: string;
} & RechartsPrimitive.DefaultLegendContentProps) {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      )}
    >
      {payload
        .filter((item) => item.type !== "none")
        .map((item, index) => {
          const key = `${nameKey ?? item.dataKey ?? "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);

          return (
            <div
              className={cn(
                "flex items-center gap-2 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
              )}
              key={`${item.dataKey ?? index}`}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="size-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: itemConfig?.color ?? item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          );
        })}
    </div>
  );
}

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return;
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string;
  }

  return configLabelKey in config ? config[configLabelKey] : config[key];
}

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
};
