"use client";

import { ChevronDownIcon, Search } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { selectTriggerVariants } from "@/components/ui/select-variants";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * MultiSelect — checkbox-based multiselect on a Popover surface.
 *
 * Base UI's Select is a type-ahead listbox; a pinned search input and a
 * two-state "Select All" checkbox fight that primitive. This builds the same
 * value/onValueChange contract on a plain Popover so the page wiring stays a
 * drop-in for <Select multiple>.
 *
 * Trigger reuses selectTriggerVariants() + the same call-site overrides the
 * Audit Trail Selects apply (border-border bg-card font-normal text-foreground)
 * so it sits flush in the row with the other fields.
 *
 * Two behaviours are OPT-IN so the Notifications / Audit Trail filter pickers
 * keep the shape they shipped with (added 2026-09-01 for the Teams Add
 * members / Add keys pickers):
 *   · `maxVisibleOptions` — caps the option scrollport to N rows.
 *   · `commitMode`        — stages selection behind an Apply / Cancel footer.
 *   · `minSelected`       — floors a commitMode picker's selection; Apply
 *                           stays disabled below it (Teams budget windows).
 *   · `showSelectedLabels` — trigger lists the chosen option labels instead
 *                           of "N selected" (Teams budget windows: 3 options,
 *                           the names fit and the count says nothing).
 * All default off. See design.md §Selects & pickers.
 * ───────────────────────────────────────────────────────────────────────── */

/* Row geometry, so the visible-row cap is derived rather than guessed. A row
   is `px-2 py-1.5` (6px top + 6px bottom) around `type-label-14`, whose line
   box is 20px; the Checkbox is size-4 (16px) and so never drives the height,
   and `line-clamp-1` keeps every line count fixed. A described row adds the
   `type-copy-12` second line at 16px. The scrollport's own `p-1` is 4px top +
   4px bottom. Every number is a 4px multiple, and 4 rows land on 136px
   (single-line) or 200px (described). */
const OPTION_ROW_PX = 32;
const OPTION_ROW_WITH_DESCRIPTION_PX = 48;
const SCROLLPORT_PADDING_PX = 8;

type MultiSelectOption = {
  value: string;
  label: string;
  /** Optional second line under the label — context the user needs BEFORE
   *  they commit, not after. Added 2026-08-28 for the Teams "Add members"
   *  picker, where a candidate already on another team shows that team so
   *  the move is visible while choosing. Omit it and the row renders as a
   *  single line exactly as before. */
  description?: string;
};

type MultiSelectProps = {
  value: string[];
  onValueChange: (value: string[]) => void;
  options: MultiSelectOption[];
  /** Empty-selection label, e.g. "All members". */
  placeholder: string;
  /** Pins a case-insensitive search input above the list. */
  searchable?: boolean;
  /** Pins the two-state "(Select All)" row above the list. On by default —
   *  pass `false` on a picker where selecting the whole list is not a real
   *  intent (the Teams Add members / Add keys pickers, 2026-09-01: the Apply
   *  footer is the affordance there, and "add everyone" is not a move anyone
   *  makes). */
  selectAll?: boolean;
  /** Caps the option scrollport to N rows of the real row geometry; the rows
   *  beyond scroll, and the search input stays pinned OUTSIDE the scrollport.
   *  Unset (default) keeps the original `max-h-56` scrollport. */
  maxVisibleOptions?: number;
  /** STAGES selection behind an Apply / Cancel footer instead of writing every
   *  toggle straight through. Apply commits the staged selection and closes;
   *  Cancel, Escape and click-away all discard it, so the trigger label always
   *  reads committed state. Off by default: the filter pickers apply live. */
  commitMode?: boolean;
  /** Floor on how many options a `commitMode` picker may commit. While the
   *  staged selection sits below it, Apply is disabled — the popup states the
   *  rule rather than letting an invalid selection through and failing at the
   *  form. Unset (default) means no floor, so every existing picker keeps its
   *  current behaviour byte for byte. Only meaningful with `commitMode`. */
  minSelected?: number;
  /** Trigger reads the selected labels, comma-joined in option order
   *  ("Weekly, Monthly"), instead of "N selected". For short fixed lists
   *  where the names fit; long rosters keep the count. Default off. */
  showSelectedLabels?: boolean;
  "aria-label": string;
  className?: string;
  disabled?: boolean;
};

function MultiSelect({
  value,
  onValueChange,
  options,
  placeholder,
  searchable = false,
  selectAll = true,
  maxVisibleOptions,
  showSelectedLabels = false,
  commitMode = false,
  minSelected,
  className,
  disabled,
  "aria-label": ariaLabel,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  // Staged selection while `commitMode` is on. `null` = nothing staged (the
  // popup is closed, or a close discarded it), which is why the fallback below
  // tests for null rather than truthiness: an empty array is a legitimate
  // staged selection.
  const [staged, setStaged] = React.useState<string[] | null>(null);

  // Reset the search each time the menu closes so a stale filter never hides
  // options on the next open. Done in the open-change handler (not an effect)
  // so the reset is tied to the actual close transition. Closing is also the
  // one discard path for staged selection: Cancel, Escape and click-away all
  // arrive here, so a staged change can never leak into the consumer's value
  // without Apply.
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      if (commitMode) {
        setStaged(value);
      }
      return;
    }
    setQuery("");
    setStaged(null);
  };

  const filteredOptions = React.useMemo(() => {
    if (!(searchable && query.trim())) {
      return options;
    }
    const needle = query.trim().toLowerCase();
    // Search covers the second line too — on the Teams picker that is the
    // candidate's current team, which is a thing you would type to find them.
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(needle) ||
        (o.description?.toLowerCase().includes(needle) ?? false)
    );
  }, [options, searchable, query]);

  // What the ROWS read. Identical to `value` unless a staged edit is in
  // flight, so the non-commit path is unchanged.
  const selection = commitMode && staged !== null ? staged : value;

  const selectedSet = React.useMemo(() => new Set(selection), [selection]);

  const allSelected = options.length > 0 && selection.length === options.length;

  // The TRIGGER always reads committed state — a staged edit must not retitle
  // the closed control it is going to be discarded from.
  const triggerLabel = (() => {
    if (value.length === 0) {
      return placeholder;
    }
    if (showSelectedLabels) {
      // Option order, not click order, so the label reads the same way the
      // list does regardless of how the user arrived at the selection.
      return options
        .filter((o) => value.includes(o.value))
        .map((o) => o.label)
        .join(", ");
    }
    return `${value.length} selected`;
  })();

  const publish = (next: string[]) => {
    if (commitMode) {
      setStaged(next);
    } else {
      onValueChange(next);
    }
  };

  const toggleOption = (optionValue: string) => {
    if (selectedSet.has(optionValue)) {
      publish(selection.filter((v) => v !== optionValue));
    } else {
      publish([...selection, optionValue]);
    }
  };

  const toggleAll = () => {
    if (allSelected) {
      publish([]);
    } else {
      publish(options.map((o) => o.value));
    }
  };

  const applySelection = () => {
    onValueChange(selection);
    handleOpenChange(false);
  };

  // Only cap when the list actually overflows: a maxHeight computed from a
  // short list would clip the "No options found" line, and an uncapped short
  // list scrolls no differently. Heights come from the first N rows, so a
  // described row and a single-line row both land on exactly N visible.
  const scrollportMaxHeight =
    maxVisibleOptions && filteredOptions.length > maxVisibleOptions
      ? filteredOptions
          .slice(0, maxVisibleOptions)
          .reduce(
            (total, option) =>
              total +
              (option.description
                ? OPTION_ROW_WITH_DESCRIPTION_PX
                : OPTION_ROW_PX),
            SCROLLPORT_PADDING_PX
          )
      : undefined;

  return (
    <Popover onOpenChange={handleOpenChange} open={open}>
      <PopoverTrigger
        aria-label={ariaLabel}
        className={cn(
          selectTriggerVariants(),
          // Match the call-site overrides the AuditTrail Selects apply so the
          // trigger reads identically in the filter row.
          "w-full border-border bg-card text-foreground",
          value.length === 0 && "text-muted-foreground",
          className
        )}
        disabled={disabled}
        type="button"
      >
        <span className="line-clamp-1">{triggerLabel}</span>
        <ChevronDownIcon className="pointer-events-none size-4 shrink-0 text-muted-foreground transition-transform duration-150 ease-out group-aria-expanded/select:rotate-180 motion-reduce:transition-none" />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-(--anchor-width) p-0">
        {searchable ? (
          <div className="border-border border-b p-2">
            <div className="flex h-8 items-center gap-2 rounded-sm border border-border bg-card px-2 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                aria-label="Search options"
                className="type-copy-14 w-full min-w-0 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search options…"
                type="text"
                value={query}
              />
            </div>
          </div>
        ) : null}

        {selectAll ? (
          <div className="border-border border-b p-1">
            <button
              className="type-label-14 flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-left text-foreground outline-none transition-colors duration-150 ease-out hover:bg-accent-muted focus-visible:bg-accent-muted motion-reduce:transition-none"
              onClick={toggleAll}
              type="button"
            >
              <Checkbox
                aria-hidden="true"
                checked={allSelected}
                tabIndex={-1}
              />
              <span>(Select All)</span>
            </button>
          </div>
        ) : null}

        <div
          className="max-h-56 overflow-y-auto overscroll-contain p-1"
          style={
            scrollportMaxHeight ? { maxHeight: scrollportMaxHeight } : undefined
          }
        >
          {filteredOptions.length === 0 ? (
            <p className="type-copy-14 px-2 py-3 text-center text-muted-foreground">
              No options found
            </p>
          ) : (
            filteredOptions.map((option) => (
              <label
                className="type-label-14 flex w-full cursor-pointer items-center gap-2 rounded-xs px-2 py-1.5 text-foreground transition-colors duration-150 ease-out hover:bg-accent-muted has-focus-visible:bg-accent-muted motion-reduce:transition-none"
                key={option.value}
              >
                <Checkbox
                  checked={selectedSet.has(option.value)}
                  onCheckedChange={() => toggleOption(option.value)}
                />
                {option.description ? (
                  <span className="flex min-w-0 flex-col">
                    <span className="line-clamp-1">{option.label}</span>
                    <span className="type-copy-12 line-clamp-1 text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                ) : (
                  <span className="line-clamp-1">{option.label}</span>
                )}
              </label>
            ))
          )}
        </div>

        {/* Action footer. Same shape as DialogScrollFooter / CardFooter —
            border-t hairline plus tighter padding than the content above, so
            the band reads as chrome; right-aligned with the primary last.
            `type="button"` is load-bearing: these pickers sit inside the Add
            members / Add keys <form>, and a default submit button would file
            the whole dialog. */}
        {commitMode ? (
          <div className="flex items-center justify-end gap-2 border-border border-t p-2">
            <Button
              onClick={() => handleOpenChange(false)}
              size="sm"
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={
                minSelected !== undefined && selection.length < minSelected
              }
              onClick={applySelection}
              size="sm"
              type="button"
            >
              Apply
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

export type { MultiSelectOption, MultiSelectProps };
export { MultiSelect };
