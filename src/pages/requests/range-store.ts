import { useSyncExternalStore } from "react";
import type { CustomRange, RangeKey } from "./types";

// Module-scoped range store. RequestsTableSection writes via the existing
// SegmentedPill onValueChange; HeroMetricCard subscribes via useRange().
// This keeps Requests() untouched (no state lifting) and avoids a context
// Provider mismatch (Hero and Table are siblings, not ancestor/descendant).
export const rangeStore = {
  current: "all" as RangeKey,
  // Populated alongside `current = 'custom'` when the user applies a
  // custom range. Reading both from a single store keeps Hero and Table
  // pinned to the same source of truth.
  customRange: null as CustomRange | null,
  listeners: new Set<() => void>(),
  set(next: RangeKey) {
    this.current = next;
    this.listeners.forEach((l) => {
      l();
    });
  },
  setCustom(next: CustomRange | null) {
    this.customRange = next;
    this.listeners.forEach((l) => {
      l();
    });
  },
  subscribe(l: () => void) {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  },
};

export function useRange(): RangeKey {
  return useSyncExternalStore(
    (cb) => rangeStore.subscribe(cb),
    () => rangeStore.current,
    () => rangeStore.current
  );
}

export function useCustomRange(): CustomRange | null {
  return useSyncExternalStore(
    (cb) => rangeStore.subscribe(cb),
    () => rangeStore.customRange,
    () => rangeStore.customRange
  );
}
