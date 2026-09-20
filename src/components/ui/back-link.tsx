import { ChevronLeft } from "lucide-react";
import type * as React from "react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";

/* ─── BackLink — the back-breadcrumb above a detail page ────────────────────
 * Extracted 2026-07-28 from three byte-identical hand-rolled copies:
 * `ConversationsTrace.tsx`, `RequestsFindings.tsx`, and `SetupBackLink` in
 * `onboarding-shared.tsx`. The recipe below is those copies VERBATIM — this
 * extraction moves no pixels.
 *
 * NOT `TextLink`. TextLink is the underlined inline-prose affordance; this is
 * a chevron + label breadcrumb with no underline at all. Routing one into the
 * other would have added an underline to every detail page.
 *
 * The pieces that matter, none of which a call site should restate:
 *   · `after:-inset-y-3` — an invisible 12px vertical hit area, so a 20px-tall
 *     label is a comfortable target without occupying the space.
 *   · `group-hover:-translate-x-px` — the chevron nudges 1px left on hover.
 *   · `active:scale-[0.98]` press + the reduced-motion opt-outs, matching
 *     every other pressable control (design.md §5).
 * ───────────────────────────────────────────────────────────────────────── */

const BACK_LINK_BASE =
  "type-label-14 group relative inline-flex w-fit items-center gap-1 rounded-xs text-muted-foreground transition-[color,background-color,border-color,scale] duration-150 ease-out after:absolute after:inset-x-0 after:-inset-y-3 after:content-[''] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100";

export type BackLinkProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "children"
> & {
  /** The destination's name — "Conversations", "Messages", "Setup". */
  label: string;
  /** The route to go back to. When set the breadcrumb renders a real
   *  `<a href>` (React Router `<Link>`) instead of a `<button>` — a back
   *  breadcrumb IS navigation, so it gets cmd/middle-click and "Copy link
   *  address" (same contract as `RowActionButton.href`). Omit it only for a
   *  back step that is an in-place action. */
  href?: string;
};

export function BackLink({ label, className, href, ...rest }: BackLinkProps) {
  const glyph = (
    <ChevronLeft
      aria-hidden
      className="size-4 transition-transform duration-150 ease-out group-hover:-translate-x-px motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
      strokeWidth={1.75}
    />
  );
  if (href) {
    return (
      <Link className={cn(BACK_LINK_BASE, className)} to={href}>
        {glyph}
        {label}
      </Link>
    );
  }
  return (
    <button className={cn(BACK_LINK_BASE, className)} type="button" {...rest}>
      {glyph}
      {label}
    </button>
  );
}
