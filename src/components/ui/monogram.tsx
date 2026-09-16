import { cn } from "@/lib/utils";
import { AVATAR_TONE_CLS, type MonogramProps } from "./monogram-types";

/* ─────────────────────────────────────────────────────────────────────────
 * Monogram — avatar initial chip.
 *
 * Extracted 2026-05-17 from duplicated `Avatar` (Team.tsx) and
 * `UserMonogram` (Activity.tsx). Unifies AvatarTone type, AVATAR_TONE_CLS
 * map, and the rendering logic into one primitive.
 *
 * Size variants:
 * 'sm' → size-4 (16px), text-[10px], single initial
 * 'md' → size-7 (28px), text-xs (12px), two initials
 *
 * The `initials` prop accepts the pre-computed initials string. `initialsOf`
 * below is the 2-char derivation (first + last word), exported here because
 * it now has two call sites — the Members table (Team.tsx) and the seat-change
 * list on the Enterprise Billing page. Single-char derivations (Activity.tsx)
 * stay local to their page.
 *
 * All tones use saturated 700-step bg + white fg — same recipe as the
 * DashTopBar `CP` monogram. Tones cycle through the existing 700-step
 * palette ramps (no chart-palette borrowing).
 *
 * Non-component types (AvatarTone, AVATAR_TONE_CLS, MonogramProps) live in
 * `./monogram-types` so this file exports only the React component and
 * React Fast Refresh can work correctly.
 * ─────────────────────────────────────────────────────────────────────── */

export function Monogram({ tone, initials, size = "md" }: MonogramProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium font-sans",
        size === "sm" ? "size-4 text-[10px]" : "size-7 text-xs",
        AVATAR_TONE_CLS[tone]
      )}
    >
      {initials}
    </span>
  );
}
