import type * as React from "react";

import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * IconActionButton — 24px icon-only button with expanded hit target.
 *
 * Codified 2026-05-10. Hand-rolled at CMP-012 (TopKeysCard overflow
 * MoreHorizontal); the recipe is dense enough that any second site would
 * silently drift. Extract first.
 *
 * Recipe (locked):
 *   size-6 (24px) target, rounded-xs, text-neutral-500 default
 *   inline-flex centered children
 *   touch-manipulation (kills 300ms tap delay on mobile)
 *   transition-[color,background-color,transform,box-shadow] duration-150 ease-out
 *   hover: text-neutral-900 + bg-neutral-100
 *   focus-visible: ring-3 ring-ring/50
 *   active: scale-[0.99] (press affordance — subtle scale-down; gated for reduced-motion)
 *   after:absolute after:-inset-2 — pseudo-element expands the hit area
 *     by 8px in every direction (44×44 effective tap target without
 *     inflating the visual footprint). The button itself is `relative`
 *     so the pseudo-element anchors correctly.
 *
 * `aria-label` is required — icon-only buttons have no accessible name
 * from text content. Don't pass an empty string.
 * ───────────────────────────────────────────────────────────────────────── */

const ICON_ACTION_BUTTON_BASE =
  'relative inline-flex items-center justify-center size-6 rounded-xs text-neutral-500 outline-none touch-manipulation will-change-transform transition-[color,background-color,transform,box-shadow] duration-150 ease-out hover:text-neutral-900 hover:bg-neutral-100 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 disabled:pointer-events-none disabled:opacity-50 after:absolute after:-inset-2 after:content-[""]';

export type IconActionButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "aria-label"
> & {
  "aria-label": string;
};

export function IconActionButton({
  className,
  children,
  ...props
}: IconActionButtonProps) {
  return (
    <button
      className={cn(ICON_ACTION_BUTTON_BASE, className)}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}
