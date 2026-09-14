import { useEffect, useState } from "react";

/* ─── useIsTruncated — is this element's text actually clipped? ─────────────
 * Reports whether a single-line, `truncate`d element is overflowing its own
 * box, so a consumer can mount a Tooltip carrying the full string ONLY when
 * the ellipsis is really there. A short name gets no tooltip at all, which is
 * the whole point: a tooltip that repeats text already fully visible is noise.
 *
 * Same two deliberate choices as `useHorizontalScrollOverflow`, for the same
 * reasons.
 *
 * The element arrives via a CALLBACK REF written into state, not a `useRef`
 * plus a mount effect. An effect keyed on a ref runs once, before the node
 * necessarily exists, and never re-runs when it appears — the measured flag
 * then stays stuck at its initial `false` and the tooltip never mounts.
 *
 * It observes BOTH the element and its parent. The element covers its own box
 * shrinking (the card column narrowing at a breakpoint); the parent covers a
 * sibling growing and squeezing it — a flex row where an avatar or a badge
 * changes width re-clips the text without the text node itself being resized,
 * and an element-only observer would never hear about it.
 * ────────────────────────────────────────────────────────────────────────── */

/** Sub-pixel slack, in px. Browsers report fractional `scrollWidth` /
 * `clientWidth` at non-integer zoom and DPR, so an exact `>` comparison
 * reports a 0.5px rounding artifact as a clip and mounts a tooltip on text
 * that is plainly fully visible. */
const CLIP_TOLERANCE_PX = 1;

export interface IsTruncated {
  /** The element's text does not fit its box — an ellipsis is showing. */
  isTruncated: boolean;
  /** Attach to the element that carries `truncate`. */
  ref: (node: HTMLElement | null) => void;
}

export function useIsTruncated(): IsTruncated {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    if (!node) {
      return;
    }

    const measure = () => {
      const clipped = node.scrollWidth - node.clientWidth > CLIP_TOLERANCE_PX;
      // Bail on an unchanged read: a ResizeObserver fires on every frame of a
      // window drag, and each one would otherwise re-render the consumer.
      setIsTruncated((prev) => (prev === clipped ? prev : clipped));
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    const parent = node.parentElement;
    if (parent) {
      observer.observe(parent);
    }

    return () => observer.disconnect();
  }, [node]);

  return { ref: setNode, isTruncated };
}
