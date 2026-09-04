import { useEffect, useState } from "react";

/* ─── useHorizontalScrollOverflow — scroll-shadow state for a scrollport ────
 * Reports whether a horizontally scrolling element has content hidden to its
 * left and/or right, so a consumer can paint the Carbon/Material "scroll
 * shadow" edge fades. Both flags are false when the content fits, which is
 * how a non-overflowing table renders exactly as it did before the fades
 * existed.
 *
 * Two things this hook does deliberately.
 *
 * The element arrives via a CALLBACK REF written into state, not a `useRef`
 * plus a mount effect. An effect keyed on a ref (or on a render flag) runs
 * once, before the node necessarily exists, and never re-runs when it
 * appears — the measured state then stays stuck at its initial value. Keying
 * the effect on the node itself means the listeners attach the moment the
 * node mounts and re-attach if it is ever swapped.
 *
 * It observes BOTH the scrollport and its first element child. The scrollport
 * covers container resizes (the Ask AI push panel narrowing the content
 * column, the sidebar rail expanding/collapsing); the child covers the
 * content growing or shrinking — a `table-fixed` table redistributing column
 * widths changes `scrollWidth` without the container ever resizing, and a
 * scroll-only listener would never hear about it.
 * ────────────────────────────────────────────────────────────────────────── */

/** Sub-pixel slack, in px. Browsers report fractional `scrollWidth` /
 * `scrollLeft` at non-integer zoom and DPR, so an exact
 * `scrollLeft === scrollWidth - clientWidth` comparison never settles at the
 * far edge and the trailing fade would never fully clear. */
const EDGE_TOLERANCE_PX = 1;

export interface HorizontalScrollOverflow {
  /** Content is hidden to the LEFT of the visible box. */
  canScrollLeft: boolean;
  /** Content is hidden to the RIGHT of the visible box. */
  canScrollRight: boolean;
  /** Attach to the element that carries `overflow-x-auto`. */
  ref: (node: HTMLElement | null) => void;
}

export function useHorizontalScrollOverflow(): HorizontalScrollOverflow {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [edges, setEdges] = useState({
    canScrollLeft: false,
    canScrollRight: false,
  });

  useEffect(() => {
    if (!node) {
      return;
    }

    const measure = () => {
      const maxScroll = node.scrollWidth - node.clientWidth;
      const overflowing = maxScroll > EDGE_TOLERANCE_PX;
      const canScrollLeft = overflowing && node.scrollLeft > EDGE_TOLERANCE_PX;
      const canScrollRight =
        overflowing && node.scrollLeft < maxScroll - EDGE_TOLERANCE_PX;
      // Bail on an unchanged read: `scroll` fires per frame while dragging and
      // every one of those would otherwise re-render the whole table.
      setEdges((prev) =>
        prev.canScrollLeft === canScrollLeft &&
        prev.canScrollRight === canScrollRight
          ? prev
          : { canScrollLeft, canScrollRight }
      );
    };

    measure();
    node.addEventListener("scroll", measure, { passive: true });

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    const content = node.firstElementChild;
    if (content) {
      observer.observe(content);
    }

    return () => {
      node.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [node]);

  return { ref: setNode, ...edges };
}
