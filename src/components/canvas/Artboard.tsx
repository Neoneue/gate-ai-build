import { useEffect, useRef, useState, type ReactNode } from 'react';

import { Eyebrow } from '@/components/ui/eyebrow';

export interface ArtboardProps {
  id: string;
  name: string;
  top: number;
  left: number;
  children: ReactNode;
}

/**
 * 2D-positioned artboard wrapper. Mirrors a Paper artboard:
 * label above, white shell below.
 */
export function Artboard({ id, name, top, left, children }: ArtboardProps) {
  return (
    <div className="absolute" style={{ top, left, width: 1440 }}>
      <Eyebrow as="div" className="pb-2.5 pl-1">
        {id} · {name}
      </Eyebrow>
      <div
        className="artboard-shell bg-white rounded-sm overflow-hidden"
        style={{
          boxShadow:
            '0 1px 2px rgba(17,20,23,0.06), 0 8px 24px -8px rgba(17,20,23,0.10)',
        }}
      >
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
  txRef.current = tx;
  tyRef.current = ty;
  scaleRef.current = scale;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const onWheel = (e: WheelEvent) => {
      // Don't hijack wheel inside a real form control (textarea scrolls itself)
      const target = e.target as HTMLElement | null;
      if (target?.closest('textarea, [data-radix-scroll-area-viewport]')) return;

      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // ── ZOOM ──
        const rect = wrapper.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const clamped = Math.max(-ZOOM_CLAMP, Math.min(ZOOM_CLAMP, e.deltaY));
        const factor = Math.pow(2, -clamped * 0.01);
        const prev = scaleRef.current;
        const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev * factor));
        if (next === prev) return;
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

    wrapper.addEventListener('wheel', onWheel, { passive: false });
    return () => wrapper.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <>
      <div
        ref={wrapperRef}
        className="fixed inset-0 overflow-hidden"
        style={{ touchAction: 'none' }}
      >
        <div
          className="relative"
          style={{
            width: 6800,
            height: 5200,
            padding: 120,
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transformOrigin: '0 0',
            willChange: 'transform',
          }}
        >
          {children}
        </div>
      </div>
      <CanvasControls
        scale={scale}
        onReset={() => {
          setScale(1);
          setTx(40);
          setTy(40);
        }}
      />
    </>
  );
}

function CanvasControls({ scale, onReset }: { scale: number; onReset: () => void }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-sm bg-white border border-ink-200 shadow-[0_4px_16px_rgba(17,20,23,0.10)] px-2 py-1"
      onWheel={(e) => e.stopPropagation()}
    >
      <span className="font-mono text-xs tabular-nums text-ink-500 px-1">
        {Math.round(scale * 100)}%
      </span>
      <button
        type="button"
        onClick={onReset}
        className="h-7 px-3 inline-flex items-center justify-center rounded-sm text-ink-600 hover:text-ink-900 hover:bg-ink-50 font-mono text-xs"
      >
        Reset
      </button>
    </div>
  );
}
