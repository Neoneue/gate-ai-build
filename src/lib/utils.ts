import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Every custom typography utility (`type-heading-*`, `type-copy-*`,
 * `type-label-*`, `type-input-helper`) sets `font-size`, so they must join
 * Tailwind's `font-size` conflict group. Without this, twMerge treats them as
 * unrelated classes and a primitive's baked-in default (e.g. `CardTitle`'s
 * `type-heading-16`) is NOT replaced by a `className` override — both land and
 * CSS source order silently decides the winner. Registering them here lets a
 * `className` (and its per-breakpoint `lg:` variants) cleanly win, so primitives
 * define a default without locking it in.
 */
const TYPE_FONT_SIZE_UTILITIES = [
  "type-heading-14",
  "type-heading-16",
  "type-heading-18",
  "type-heading-20",
  "type-heading-24",
  "type-heading-32",
  "type-heading-40",
  "type-heading-48",
  "type-heading-56",
  "type-heading-64",
  "type-heading-72",
  "type-copy-12",
  "type-copy-14",
  "type-copy-14-tight",
  "type-copy-16",
  "type-copy-18",
  "type-copy-20",
  "type-copy-24",
  "type-label-12",
  "type-label-14",
  "type-label-16",
  "type-label-18",
  "type-label-20",
  "type-input-helper",
];

const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": TYPE_FONT_SIZE_UTILITIES } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Random lowercase hex string of the given length (mock key/id material). */
export function randomHex(chars: number): string {
  let out = "";
  for (let i = 0; i < chars; i++) {
    out += Math.floor(Math.random() * 16).toString(16);
  }
  return out;
}
