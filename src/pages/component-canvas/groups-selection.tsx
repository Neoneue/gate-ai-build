import { KeyRound } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { MiniRadio, MiniRadioGroup } from "@/components/ui/mini-radio-group";
import { OptionTile } from "@/components/ui/option-tile";
import { Segmented } from "@/components/ui/segmented";
import { SegmentedPill } from "@/components/ui/segmented-pill";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsCount } from "@/components/ui/tabs-count";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ViewRoleSwitch } from "@/components/ui/view-role-switch";
import type { CanvasGroup } from "@/pages/component-canvas/canvas-types";
import { Stateful } from "@/pages/component-canvas/demos";
import { RANGE_OPTIONS } from "@/pages/requests/data";

/* Selectors (design.md "Selectors"): tabs, segmented controls, toggle
 * groups, radio tiles and date pickers. Same options in every example of a
 * group; only the prop named in the caption changes. */

const TAB_ITEMS = [
  { value: "keys", label: "Keys", count: 4 },
  { value: "usage", label: "Usage", count: 12 },
  { value: "settings", label: "Settings", count: 0 },
];

function tabsExample({
  variant,
  orientation = "horizontal",
  counts = false,
  disabledLast = false,
  icon = false,
}: {
  variant: "default" | "line";
  orientation?: "horizontal" | "vertical";
  counts?: boolean;
  disabledLast?: boolean;
  icon?: boolean;
}) {
  return (
    <Tabs className="w-full" defaultValue="keys" orientation={orientation}>
      <TabsList variant={variant}>
        {TAB_ITEMS.map((item, index) => (
          <TabsTrigger
            disabled={disabledLast && index === TAB_ITEMS.length - 1}
            key={item.value}
            value={item.value}
          >
            {icon && index === 0 ? (
              <KeyRound
                aria-hidden
                data-icon="inline-start"
                strokeWidth={1.75}
              />
            ) : null}
            {item.label}
            {counts ? <TabsCount>{item.count}</TabsCount> : null}
          </TabsTrigger>
        ))}
      </TabsList>
      {TAB_ITEMS.map((item) => (
        <TabsContent key={item.value} value={item.value}>
          <p className="type-copy-14 m-0 py-2 text-muted-foreground">
            {item.label} panel
          </p>
        </TabsContent>
      ))}
    </Tabs>
  );
}

const tabs: CanvasGroup = {
  id: "tabs",
  title: "Tabs",
  files: ["tabs.tsx"],
  columns: 2,
  examples: [
    {
      label: 'TabsList variant="default"',
      render: () => tabsExample({ variant: "default" }),
    },
    {
      label: 'TabsList variant="line"',
      render: () => tabsExample({ variant: "line" }),
    },
    {
      label: 'orientation="vertical"',
      render: () =>
        tabsExample({ variant: "default", orientation: "vertical" }),
    },
    {
      label: "TabsTrigger disabled",
      render: () => tabsExample({ variant: "line", disabledLast: true }),
    },
    {
      label: 'TabsTrigger data-icon="inline-start"',
      render: () => tabsExample({ variant: "line", icon: true }),
    },
  ],
};

const tabsCount: CanvasGroup = {
  id: "tabs-count",
  title: "TabsCount",
  files: ["tabs-count.tsx"],
  columns: 2,
  examples: [
    { label: "standalone", render: () => <TabsCount>12</TabsCount> },
    {
      label: "inside line tabs",
      render: () => tabsExample({ variant: "line", counts: true }),
    },
  ],
};

const SEGMENT_OPTIONS = RANGE_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

const SEGMENT_SIZES = ["sm", "default"] as const;

const segmented: CanvasGroup = {
  id: "segmented",
  title: "Segmented",
  files: ["segmented.tsx"],
  columns: 2,
  examples: [
    {
      label: 'variant="pill" (default)',
      render: () => (
        <Stateful initial="7d">
          {(value, setValue) => (
            <Segmented
              aria-label="Range"
              onChange={setValue}
              options={SEGMENT_OPTIONS}
              value={value}
              variant="pill"
            />
          )}
        </Stateful>
      ),
    },
    {
      label: 'variant="group"',
      render: () => (
        <Stateful initial="7d">
          {(value, setValue) => (
            <Segmented
              aria-label="Range"
              onChange={setValue}
              options={SEGMENT_OPTIONS}
              value={value}
              variant="group"
            />
          )}
        </Stateful>
      ),
    },
    ...SEGMENT_SIZES.map((size) => ({
      label: `size="${size}"`,
      render: () => (
        <Stateful initial="7d">
          {(value, setValue) => (
            <Segmented
              aria-label="Range"
              onChange={setValue}
              options={SEGMENT_OPTIONS}
              size={size}
              value={value}
            />
          )}
        </Stateful>
      ),
    })),
    {
      label: "option count",
      render: () => (
        <Stateful initial="unread">
          {(value, setValue) => (
            <Segmented
              aria-label="Filter"
              onChange={setValue}
              options={[
                { value: "unread", label: "Unread", count: 3 },
                { value: "all", label: "All" },
              ]}
              value={value}
            />
          )}
        </Stateful>
      ),
    },
    {
      label: "disabled",
      render: () => (
        <Segmented
          aria-label="Range"
          disabled
          options={SEGMENT_OPTIONS}
          value="7d"
        />
      ),
    },
  ],
};

const segmentedPill: CanvasGroup = {
  id: "segmented-pill",
  title: "SegmentedPill",
  files: ["segmented-pill.tsx"],
  columns: 2,
  examples: SEGMENT_SIZES.map((size) => ({
    label: `size="${size}"`,
    render: () => (
      <Stateful initial="7d">
        {(value, setValue) => (
          <SegmentedPill
            aria-label="Range"
            onValueChange={setValue}
            options={SEGMENT_OPTIONS}
            size={size}
            value={value}
          />
        )}
      </Stateful>
    ),
  })),
};

const TOGGLE_SIZES = ["sm", "default", "lg"] as const;

function toggleItems() {
  return SEGMENT_OPTIONS.map((option) => (
    <ToggleGroupItem key={option.value} value={option.value}>
      {option.label}
    </ToggleGroupItem>
  ));
}

const toggleGroup: CanvasGroup = {
  id: "toggle-group",
  title: "ToggleGroup",
  files: ["toggle-group.tsx"],
  columns: 3,
  examples: [
    {
      label: 'variant="default"',
      render: () => (
        <ToggleGroup aria-label="Range" defaultValue={["7d"]} variant="default">
          {toggleItems()}
        </ToggleGroup>
      ),
    },
    {
      label: 'variant="outline"',
      render: () => (
        <ToggleGroup aria-label="Range" defaultValue={["7d"]} variant="outline">
          {toggleItems()}
        </ToggleGroup>
      ),
    },
    ...TOGGLE_SIZES.map((size) => ({
      label: `size="${size}"`,
      render: () => (
        <ToggleGroup aria-label="Range" defaultValue={["7d"]} size={size}>
          {toggleItems()}
        </ToggleGroup>
      ),
    })),
    {
      label: "spacing={2}",
      render: () => (
        <ToggleGroup aria-label="Range" defaultValue={["7d"]} spacing={2}>
          {toggleItems()}
        </ToggleGroup>
      ),
    },
    {
      label: 'orientation="vertical"',
      render: () => (
        <ToggleGroup
          aria-label="Range"
          defaultValue={["7d"]}
          orientation="vertical"
        >
          {toggleItems()}
        </ToggleGroup>
      ),
    },
    {
      label: "multiple",
      render: () => (
        <ToggleGroup aria-label="Range" defaultValue={["7d", "30d"]} multiple>
          {toggleItems()}
        </ToggleGroup>
      ),
    },
    {
      label: "disabled",
      render: () => (
        <ToggleGroup aria-label="Range" defaultValue={["7d"]} disabled>
          {toggleItems()}
        </ToggleGroup>
      ),
    },
  ],
};

const miniRadioGroup: CanvasGroup = {
  id: "mini-radio-group",
  title: "MiniRadioGroup",
  files: ["mini-radio-group.tsx"],
  columns: 2,
  examples: [
    {
      label: "MiniRadio selected (DashboardDefault.tsx precedent)",
      render: () => (
        <Stateful initial="byok">
          {(mode, setMode) => (
            <MiniRadioGroup aria-label="Gateway billing mode">
              {(["byok", "payg"] as const).map((m) => (
                <MiniRadio
                  key={m}
                  onClick={() => setMode(m)}
                  selected={mode === m}
                >
                  {m.toUpperCase()}
                </MiniRadio>
              ))}
            </MiniRadioGroup>
          )}
        </Stateful>
      ),
    },
  ],
};

const CREDIT_AMOUNTS = [10, 25, 50, 100];

function optionTiles(size: "md" | "lg", tone: "neutral" | "accent") {
  return (
    <Stateful initial={25}>
      {(amount, setAmount) => (
        <div
          aria-label="Credit amount"
          className="grid w-full grid-cols-4 gap-3"
          role="radiogroup"
        >
          {CREDIT_AMOUNTS.map((value) => (
            <OptionTile
              key={value}
              onClick={() => setAmount(value)}
              selected={amount === value}
              size={size}
              tone={tone}
            >
              ${value}
            </OptionTile>
          ))}
        </div>
      )}
    </Stateful>
  );
}

const optionTile: CanvasGroup = {
  id: "option-tile",
  title: "OptionTile",
  files: ["option-tile.tsx"],
  columns: 2,
  examples: [
    {
      label: 'tone="neutral" (default, size="md")',
      render: () => optionTiles("md", "neutral"),
    },
    { label: 'tone="accent"', render: () => optionTiles("md", "accent") },

    { label: 'size="lg"', render: () => optionTiles("lg", "neutral") },
    {
      label: "disabled",
      render: () => (
        <OptionTile disabled selected={false}>
          $10
        </OptionTile>
      ),
    },
  ],
};

const SAMPLE_RANGE = {
  from: new Date(2026, 9, 6, 9, 0),
  to: new Date(2026, 9, 12, 17, 30),
};

const dateRangePicker: CanvasGroup = {
  id: "date-range-picker",
  title: "DateRangePicker",
  files: ["date-range-picker.tsx"],
  columns: 2,
  examples: [
    {
      label: 'size="sm" (default), value={null}',
      render: () => (
        <Stateful<{ from: Date; to: Date } | null> initial={null}>
          {(value, setValue) => (
            <DateRangePicker onChange={setValue} size="sm" value={value} />
          )}
        </Stateful>
      ),
    },
    {
      label: 'size="default"',
      render: () => (
        <Stateful<{ from: Date; to: Date } | null> initial={null}>
          {(value, setValue) => (
            <DateRangePicker onChange={setValue} size="default" value={value} />
          )}
        </Stateful>
      ),
    },
    {
      label: "with a value (clear button)",
      render: () => (
        <Stateful<{ from: Date; to: Date } | null> initial={SAMPLE_RANGE}>
          {(value, setValue) => (
            <DateRangePicker onChange={setValue} size="sm" value={value} />
          )}
        </Stateful>
      ),
    },
    {
      label: 'emptyLabel="Pick dates"',
      render: () => (
        <Stateful<{ from: Date; to: Date } | null> initial={null}>
          {(value, setValue) => (
            <DateRangePicker
              emptyLabel="Pick dates"
              onChange={setValue}
              size="sm"
              value={value}
            />
          )}
        </Stateful>
      ),
    },
  ],
};

const calendar: CanvasGroup = {
  id: "calendar",
  title: "Calendar",
  files: ["calendar.tsx"],
  columns: 3,
  examples: [
    {
      label: 'mode="single"',
      render: () => (
        <Stateful<Date | undefined> initial={SAMPLE_RANGE.from}>
          {(selected, setSelected) => (
            <Calendar
              defaultMonth={SAMPLE_RANGE.from}
              mode="single"
              onSelect={setSelected}
              selected={selected}
            />
          )}
        </Stateful>
      ),
    },
    {
      label: 'mode="range"',
      render: () => (
        <Stateful<{ from: Date | undefined; to?: Date } | undefined>
          initial={SAMPLE_RANGE}
        >
          {(selected, setSelected) => (
            <Calendar
              defaultMonth={SAMPLE_RANGE.from}
              mode="range"
              onSelect={setSelected}
              selected={selected}
            />
          )}
        </Stateful>
      ),
    },
    {
      label: "disabled days (after Oct 13)",
      render: () => (
        <Calendar
          defaultMonth={SAMPLE_RANGE.from}
          disabled={{ after: new Date(2026, 9, 13) }}
          mode="single"
        />
      ),
    },
  ],
};

const viewRoleSwitch: CanvasGroup = {
  id: "view-role-switch",
  title: "ViewRoleSwitch",
  files: ["view-role-switch.tsx"],
  columns: 2,
  examples: [
    {
      label: "default (canvas-local teams store)",
      render: () => <ViewRoleSwitch />,
    },
  ],
};

export const SELECTION_GROUPS: CanvasGroup[] = [
  tabs,
  tabsCount,
  segmented,
  segmentedPill,
  toggleGroup,
  miniRadioGroup,
  optionTile,
  dateRangePicker,
  calendar,
  viewRoleSwitch,
];
