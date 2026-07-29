"use client";

import { ChevronDownIcon, Search } from "lucide-react";
import * as React from "react";
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
 * ───────────────────────────────────────────────────────────────────────── */

type MultiSelectOption = {
  value: string;
  label: string;
};

type MultiSelectProps = {
  value: string[];
  onValueChange: (value: string[]) => void;
  options: MultiSelectOption[];
  /** Empty-selection label, e.g. "All members". */
  placeholder: string;
  /** Pins a case-insensitive search input above the list. */
  searchable?: boolean;
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
  className,
  disabled,
  "aria-label": ariaLabel,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  // Reset the search each time the menu closes so a stale filter never hides
  // options on the next open. Done in the open-change handler (not an effect)
  // so the reset is tied to the actual close transition.
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery("");
    }
  };

  const filteredOptions = React.useMemo(() => {
    if (!(searchable && query.trim())) {
      return options;
    }
    const needle = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(needle));
  }, [options, searchable, query]);

  const selectedSet = React.useMemo(() => new Set(value), [value]);

  const allSelected = options.length > 0 && value.length === options.length;

  const triggerLabel =
    value.length === 0 ? placeholder : `${value.length} selected`;

  const toggleOption = (optionValue: string) => {
    if (selectedSet.has(optionValue)) {
      onValueChange(value.filter((v) => v !== optionValue));
    } else {
      onValueChange([...value, optionValue]);
    }
  };

  const toggleAll = () => {
    if (allSelected) {
      onValueChange([]);
    } else {
      onValueChange(options.map((o) => o.value));
    }
  };

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

        <div className="border-border border-b p-1">
          <button
            className="type-label-14 flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-left text-foreground outline-none transition-colors duration-150 ease-out hover:bg-accent-muted focus-visible:bg-accent-muted motion-reduce:transition-none"
            onClick={toggleAll}
            type="button"
          >
            <Checkbox aria-hidden="true" checked={allSelected} tabIndex={-1} />
            <span>(Select All)</span>
          </button>
        </div>

        <div className="max-h-56 overflow-y-auto overscroll-contain p-1">
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
                <span className="line-clamp-1">{option.label}</span>
              </label>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export type { MultiSelectOption, MultiSelectProps };
export { MultiSelect };
