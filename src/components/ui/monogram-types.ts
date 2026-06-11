/* ─────────────────────────────────────────────────────────────────────────
 * monogram-types.ts
 *
 * Non-component exports from the Monogram primitive — split out so that
 * `monogram.tsx` exports only the React component, which is required for
 * React Fast Refresh to work correctly.
 *
 * Consumers that need AvatarTone or AVATAR_TONE_CLS should import from
 * this file; consumers that need the Monogram component import from
 * `./monogram`.
 * ─────────────────────────────────────────────────────────────────────── */

export type AvatarTone = "blue" | "rose" | "emerald" | "amber" | "ink";

export const AVATAR_TONE_CLS: Record<AvatarTone, string> = {
  blue: "bg-blue-700 text-white",
  rose: "bg-danger-700 text-white",
  emerald: "bg-success-700 text-white",
  amber: "bg-warning-700 text-white",
  ink: "bg-neutral-700 text-white",
};

export interface MonogramProps {
  initials: string;
  size?: "sm" | "md";
  tone: AvatarTone;
}
