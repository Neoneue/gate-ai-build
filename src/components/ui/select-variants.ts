import { cva } from "class-variance-authority";

// Shared trigger styling for SelectTrigger and the MultiSelect trigger. Kept in
// its own module so component files only export components (react-refresh).
const selectTriggerVariants = cva(
  // Surface mirrors <Input /> so triggers and inputs share a row.
  // Skill: performance.md — only colors + focus-ring shadow animate; never `transition-all`.
  "group/select flex w-fit select-none items-center justify-between whitespace-nowrap rounded-sm border border-border bg-muted text-foreground shadow-(--shadow-xs) outline-none transition-[colors,box-shadow] duration-150 ease-out focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      size: {
        // shadcn-aligned scale — default 32px / lg 36px. Asymmetric padding
        // (pl-3 pr-2 = 12px text side / 8px chevron side) per design.md.
        xs: "h-7 gap-2 pr-2 pl-3 text-xs",
        sm: "h-8 gap-2 pr-2 pl-3 text-xs",
        default: "h-8 gap-2 pr-2 pl-3 text-sm",
        lg: "h-9 gap-2 pr-2 pl-3 text-sm",
      },
    },
    defaultVariants: {
      size: "lg",
    },
  }
);

export { selectTriggerVariants };
