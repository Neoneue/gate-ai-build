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

const WHITESPACE_RE = /\s+/;

/** Two-character initials: first letter of the first and last word, or the
 *  first two letters when the name is a single word. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(WHITESPACE_RE);
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
