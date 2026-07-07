/** Module-level snapshot of the user's reduced-motion preference, read once. */
export const REDUCE_MOTION =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
