import { ArrowDown } from "lucide-react";
import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─── ScrollToLatestFab — jump-to-bottom control for the Ask AI thread ───────
 * Figma: `1149:10955` (light, in frame `1096:5471`) and `1125:4280` (dark, in
 * frame `1107:2962`). Both twins agree on geometry:
 *
 *   32×32 · rounded-full (999px) · p-8px · 16px ArrowDown
 *   fill    white / neutral-700       → --control-raised (exact in both)
 *   border  neutral-200 / neutral-600 → --border (exact in light)
 *   shadow  Figma `shadow/md`         → --shadow-card-soft
 *   offset  16px from the panel's right edge, 16px above the composer
 *
 * Both offsets fall out of the panel's existing box for free: the FAB is
 * absolutely positioned against the message region's wrapper, whose right edge
 * is the body's `px-4` (16px) and whose bottom edge is the body's `gap-4`
 * (16px) above the composer. Nothing is hard-coded, and nothing shifts when
 * the FAB toggles — it is out of flow, so the composer grows independently.
 *
 * DETECTION — a zero-height sentinel as the last child of the scroll region,
 * observed by an IntersectionObserver with the region as root. No scroll
 * handler: this fires only on the two transitions we care about instead of on
 * every pixel, and needs no rAF throttling.
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Zero-height marker. Must be the LAST child of the scroll region.
 *
 * Serves two purposes: it is the IntersectionObserver target below, and it
 * carries `overflow-anchor: auto` (against `none` on the content beside it) so
 * the browser does not jump the scroll position when content changes above it.
 *
 * It does NOT produce stick-to-bottom. Measured 2026-07-28: while a reply
 * streams, scroll anchoring holds only until the thread outgrows the region,
 * after which the gap climbs monotonically (0 → 819px over ~10s). CSS anchoring
 * stabilises content changing ABOVE the viewport; it never follows content
 * appended BELOW it. Auto-follow, if wanted, is a separate JS decision.
 */
export function ScrollBottomSentinel({
  ref,
}: {
  ref: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div aria-hidden className="h-0 w-full [overflow-anchor:auto]" ref={ref} />
  );
}

export interface ScrollToLatestFabProps {
  className?: string;
  onClick: () => void;
  /** From `useStickToBottom`. */
  visible: boolean;
}

export function ScrollToLatestFab({
  visible,
  onClick,
  className,
}: ScrollToLatestFabProps) {
  return (
    <Button
      aria-hidden={!visible}
      aria-label="Scroll to latest"
      className={cn(
        // Visibility STATE only — the chrome (circle, raised surface, press,
        // focus ring, reduced-motion) all comes from the primitive.
        visible
          ? "scale-100 opacity-100"
          : "pointer-events-none scale-95 opacity-0",
        className
      )}
      onClick={onClick}
      shape="circle"
      size="icon-sm"
      tabIndex={visible ? 0 : -1}
      type="button"
      variant="raised"
    >
      <ArrowDown aria-hidden strokeWidth={1.75} />
    </Button>
  );
}
