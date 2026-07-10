import { type ReactNode, useEffect, useRef, useState } from "react";

import { Eyebrow } from "@/components/ui/eyebrow";

export interface ArtboardProps {
  children: ReactNode;
  id: string;
  left: number;
  name: string;
  top: number;
}

/**
 * 2D-positioned artboard wrapper. Mirrors a Paper artboard:
 * label above, white shell below.
 */
export function Artboard({ id, name, top, left, children }: ArtboardProps) {
  return (
    <div className="absolute" style={{ top, left, width: 1440 }}>
      <Eyebrow as="div" className="pb-2 pl-1">
        {id} · {name}
      </Eyebrow>
      <div className="artboard-shell overflow-hidden rounded-sm bg-card shadow-(--shadow-popup)">
        {children}
      </div>
    </div>
  );
}

/**
 * Pinch-zoom + two-finger pan canvas. Same pattern Tldraw / Excalidraw / Figma
 * plugins use on the web:
 *
 *   wheel + ctrlKey  → zoom (centered on cursor, clamped delta)
 *   wheel (no mod)   → pan via deltaX / deltaY
 *
 * On macOS Chrome / Safari the trackpad pinch gesture fires WheelEvent with
 * ctrlKey:true automatically — no extra setup needed. Cmd/Ctrl + scroll also
 * works as a fallback.
 */
const MIN_SCALE = 0.1;
const MAX_SCALE = 4;
const ZOOM_CLAMP = 10;

export function Canvas({ children }: { children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [tx, setTx] = useState(40);
  const [ty, setTy] = useState(40);
  const [scale, setScale] = useState(1);

  // Refs mirror state for the wheel handler (avoid stale closures + extra renders).
  const txRef = useRef(tx);
  const tyRef = useRef(ty);
  const scaleRef = useRef(scale);

  useEffect(() => {
    txRef.current = tx;
    tyRef.current = ty;
    scaleRef.current = scale;
  }, [tx, ty, scale]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return;
    }

    const onWheel = (e: WheelEvent) => {
      // Don't hijack wheel inside a real form control (textarea scrolls itself)
      const target = e.target as HTMLElement | null;
      if (target?.closest("textarea, [data-radix-scroll-area-viewport]")) {
        return;
      }

      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // ── ZOOM ──
        const rect = wrapper.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const clamped = Math.max(-ZOOM_CLAMP, Math.min(ZOOM_CLAMP, e.deltaY));
        const factor = 2 ** (-clamped * 0.01);
        const prev = scaleRef.current;
        const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev * factor));
        if (next === prev) {
          return;
        }
        // Keep the point under the cursor stationary.
        const ratio = next / prev;
        const newTx = mx - (mx - txRef.current) * ratio;
        const newTy = my - (my - tyRef.current) * ratio;
        setScale(next);
        setTx(newTx);
        setTy(newTy);
      } else {
        // ── PAN ──
        setTx(txRef.current - e.deltaX);
        setTy(tyRef.current - e.deltaY);
      }
    };

    wrapper.addEventListener("wheel", onWheel, { passive: false });
    return () => wrapper.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <>
      <div
        className="fixed inset-0 overflow-hidden"
        ref={wrapperRef}
        style={{ touchAction: "none" }}
      >
        <div
          className="relative"
          style={{
            width: 6800,
            height: 5200,
            padding: 120,
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transformOrigin: "0 0",
            willChange: "transform",
          }}
        >
          {children}
        </div>
      </div>
      <CanvasControls
        onReset={() => {
          setScale(1);
          setTx(40);
          setTy(40);
        }}
        scale={scale}
      />
    </>
  );
}

function CanvasControls({
  scale,
  onReset,
}: {
  scale: number;
  onReset: () => void;
}) {
  return (
    <div
      className="fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-sm border border-border bg-card px-2 py-1 shadow-(--shadow-popup)"
      onWheel={(e) => e.stopPropagation()}
    >
      <span className="px-1 font-mono text-muted-foreground text-xs tabular-nums">
        {Math.round(scale * 100)}%
      </span>
      <button
        className="inline-flex h-7 items-center justify-center rounded-sm px-3 font-mono text-muted-foreground text-xs transition-[colors,scale] duration-150 ease-out hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
        onClick={onReset}
        type="button"
      >
        Reset
      </button>
    </div>
  );
}
