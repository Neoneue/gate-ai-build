import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      data-slot="pagination"
      role="navigation"
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn("flex items-center gap-1", className)}
      data-slot="pagination-content"
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"button">;

function PaginationLink({
  className,
  isActive,
  size = "icon-sm",
  type = "button",
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "border-border font-normal text-muted-foreground tabular-nums -tracking-[0.01em]",
        "hover:bg-accent hover:text-foreground",
        isActive &&
          "border-primary bg-primary font-medium text-primary-foreground hover:bg-primary hover:text-primary-foreground dark:border-primary dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary",
        className
      )}
      data-active={isActive}
      data-slot="pagination-link"
      size={size}
      type={type}
      variant="outline"
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      className={className}
      size="icon-sm"
      {...props}
    >
      <ChevronLeftIcon />
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      className={className}
      size="icon-sm"
      {...props}
    >
      <ChevronRightIcon />
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      className={cn(
        // `relative` is load-bearing: the nested .sr-only span is
        // position:absolute, so without a positioned ancestor its containing
        // block is the ICB. Deep inside the scrolled table it then lands at a
        // document offset past the viewport and inflates <html>'s scroll
        // height, letting the whole page scroll past the app shell.
        "relative flex size-8 items-center justify-center text-muted-foreground [&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      data-slot="pagination-ellipsis"
      {...props}
    >
      <MoreHorizontalIcon />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
