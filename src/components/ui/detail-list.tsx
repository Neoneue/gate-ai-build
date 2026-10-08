import type * as React from "react";
import { createContext, use } from "react";

import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * DetailList / DetailRow — bordered label/value list for modal "Details"
 * sections (Requests, Security threat events, Audit record, the Data
 * retention shorten dialog).
 *
 * Universal pattern (2026-05-16): label left, value left-aligned in a fixed
 * 2nd column. Replaces the prior right-aligned recipe — left-align absorbs
 * every value shape (prose, badge, icon-prefixed, mono hex, short atoms)
 * without forcing consumers to negotiate a right edge. Reads as a record
 * being read top-to-bottom, not a table being compared row-to-row.
 *
 * Recipe:
 *   list   rounded-md border border-border overflow-hidden
 *   row    flex items-start gap-4 px-4 py-3
 *          border-b border-border last:border-b-0
 *   label  w-32 shrink-0 text-sm text-muted-foreground
 *   value  flex-1 min-w-0 text-sm (consumer styles inner content)
 * `labelClassName` widens the label column for a list whose longest label
 * wraps at w-32 (layout only, never color or type).
 *
 * `variant="flush"` (2026-10-08, Settings Data retention facts): the same
 * label column / value column record, for a list that sits INSIDE a card.
 * The card is already the region, so the list drops its own box (a bordered
 * box in a card would be a card in a card) and keeps only the hairlines:
 * one above the list, one between rows. It is the Stripe horizontal
 * PropertyList shape, and it renders a real `dl` / `dt` / `dd`, so the term
 * takes the Label voice (design.md §3, `<dt>` terms).
 *   list   @container/detail-list border-t border-border
 *   row    py-3 border-b last:border-b-0 last:pb-0 (the card pads the end)
 *   term   type-label-14 text-muted-foreground, a w-44 column from @sm
 *   value  type-copy-14 min-w-0 flex-1 (consumer styles inner content)
 * The widest term in use is "Oldest retained record", so the column is w-44
 * (176px), never wrapping it. The row lays out label beside value once the
 * LIST is @sm (384px) wide: 176 + 16 gap + the widest value, 193px ("Oct 29,
 * 2026, 03:00 UTC"), is 385px, so below @md the term sits over its value,
 * 4px apart, Stripe's vertical orientation, and nothing wraps.
 * ───────────────────────────────────────────────────────────────────── */

type DetailListVariant = "boxed" | "flush";

const DetailListVariantContext = createContext<DetailListVariant>("boxed");

export interface DetailListProps extends React.HTMLAttributes<HTMLElement> {
  /** `boxed` (default): a bordered list for a modal body section.
   *  `flush`: no box, hairline rows, a `dl`, for a list inside a card. */
  variant?: DetailListVariant;
}

export function DetailList({
  variant = "boxed",
  className,
  ...props
}: DetailListProps) {
  if (variant === "flush") {
    return (
      <DetailListVariantContext value="flush">
        <dl
          className={cn(
            "@container/detail-list m-0 border-border border-t",
            className
          )}
          data-slot="detail-list"
          data-variant="flush"
          {...props}
        />
      </DetailListVariantContext>
    );
  }
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border",
        className
      )}
      data-slot="detail-list"
      {...props}
    />
  );
}

export interface DetailRowProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  label: React.ReactNode;
  /** Boxed label column width override (layout only), e.g. `w-52`. */
  labelClassName?: string;
  value: React.ReactNode;
}

export function DetailRow({
  label,
  value,
  labelClassName,
  className,
  ...props
}: DetailRowProps) {
  const variant = use(DetailListVariantContext);
  if (variant === "flush") {
    return (
      <div
        className={cn(
          "flex @md/detail-list:flex-row flex-col @md/detail-list:items-start @md/detail-list:gap-4 gap-1 border-border border-b py-3 last:border-b-0 last:pb-0",
          className
        )}
        data-slot="detail-row"
        {...props}
      >
        <dt className="type-label-14 @md/detail-list:w-44 shrink-0 whitespace-nowrap text-muted-foreground">
          {label}
        </dt>
        <dd className="type-copy-14 m-0 min-w-0 flex-1 whitespace-nowrap">
          {value}
        </dd>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex items-start gap-4 border-border border-b px-4 py-3 last:border-b-0",
        className
      )}
      data-slot="detail-row"
      {...props}
    >
      <span
        className={cn(
          "type-copy-14 w-32 shrink-0 text-muted-foreground",
          labelClassName
        )}
      >
        {label}
      </span>
      <div className="type-copy-14 min-w-0 flex-1">{value}</div>
    </div>
  );
}
