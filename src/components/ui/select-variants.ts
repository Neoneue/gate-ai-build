import { cva } from "class-variance-authority";

// Shared trigger styling for SelectTrigger and the MultiSelect trigger. Kept in
// its own module so component files only export components (react-refresh).
const selectTriggerVariants = cva(
  // Surface mirrors <Input /> so triggers and inputs share a row.
  // Skill: performance.md — only colors + focus-ring shadow animate; never `transition-all`.
  "group/select flex w-fit select-none items-center justify-between whitespace-nowrap rounded-sm border border-border bg-muted font-medium text-foreground shadow-xs outline-none transition-[colors,box-shadow] duration-150 ease-out focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      size: {
        // TWO SIZES (2026-08-10) — sm 32 / default 36. `default` IS shadcn's
        // `h-9` and is what every filter/form trigger uses; `sm` (h-8, text-xs)
        // is for compact chrome that has to sit inside an already-dense row —
        // the date-range picker's four month/year triggers, the table
        // pagination footer's rows-per-page, and a handful of card-header
        // range selectors. `xs` (h-7) was deleted unused, and `lg` was renamed
        // to `default` (pixel-identical — `lg` was already
        // `defaultVariants.size`, so every trigger was already 36px).
        //
        // Select keeps `sm` where <Input> does not: a trigger is something you
        // read and click, so it can go compact, while a field you type into
        // stays at 36px. See design.md §Selectors.
        //
        // Asymmetric padding (pl-3 pr-2 = 12px text side / 8px chevron side)
        // per design.md.
        sm: "h-8 gap-2 pr-2 pl-3 text-xs",
        default: "h-9 gap-2 pr-2 pl-3 text-sm",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export { selectTriggerVariants };
