/* ─────────────────────────────────────────────────────────────────────────
 * Sparkline — tiny in-row SVG sparkline. Sized for table cells (default
 * 80×24px) where the recharts-based CompactSpark (h-9 = 36px) would
 * inflate row height. Tone variants paint stroke + fill from the
 * destructive / warning / ink semantic vars; with no tone, the line
 * picks blue or ink based on whether the trend is up or down.
 * ───────────────────────────────────────────────────────────────────────── */

export type SparklineTone = 'critical' | 'elevated' | 'normal';

export function Sparkline({
  points,
  tone,
  width = 80,
  height = 24,
  smooth = false,
}: {
  points: number[];
  tone?: SparklineTone;
  width?: number;
  height?: number;
  smooth?: boolean;
}) {
  const w = width;
  const h = height;
  const padY = 2;
  // Horizontal inset keeps the end dot + start dot fully inside the viewBox
  // — without it, a circle of r=2 at cx=0 / cx=w gets half-clipped by the
  // SVG edge, and rounded stroke caps lose their cap radius.
  const padX = 3;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = (w - padX * 2) / (points.length - 1);
  const coords = points.map((p, i) => ({
    x: padX + i * step,
    y: padY + (h - padY * 2) - ((p - min) / range) * (h - padY * 2),
  }));
  const last = coords[coords.length - 1];
  // Catmull-Rom → cubic Bezier for `smooth`; tension 0.5 softens jagged data
  // without overshoot. Straight M/L segments otherwise.
  const buildSegments = () => {
    if (!smooth || coords.length < 2) {
      return coords
        .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)},${c.y.toFixed(1)}`)
        .join(' ');
    }
    const t = 0.5;
    let d = `M ${coords[0].x.toFixed(1)},${coords[0].y.toFixed(1)}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i - 1] ?? coords[i];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2] ?? p2;
      const cp1x = p1.x + ((p2.x - p0.x) / 6) * t;
      const cp1y = p1.y + ((p2.y - p0.y) / 6) * t;
      const cp2x = p2.x - ((p3.x - p1.x) / 6) * t;
      const cp2y = p2.y - ((p3.y - p1.y) / 6) * t;
      d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  };
  const linePath = buildSegments();
  const areaPath =
    `M ${coords[0].x.toFixed(1)},${h} ` +
    `L ${coords[0].x.toFixed(1)},${coords[0].y.toFixed(1)} ` +
    linePath.replace(/^M [^ ]+ /, '') +
    ` L ${last.x.toFixed(1)},${h} Z`;

  // Chart palette only — sparklines and charts share `--color-chart-1..8`
  // (plus `--color-ink-500` for neutral). Don't mix in semantic ramps
  // (`destructive`, `warning-*`, `blue-*`, `ink-700`) — that breaks the
  // "one palette per project" rule.
  let stroke: string;
  let fill: string;
  let fillOpacity = 0.12;
  if (tone === 'critical') {
    stroke = 'var(--color-chart-5)';
    fill = 'var(--color-chart-5)';
  } else if (tone === 'elevated') {
    stroke = 'var(--color-chart-2)';
    fill = 'var(--color-chart-2)';
  } else if (tone === 'normal') {
    stroke = 'var(--color-ink-500)';
    fill = 'var(--color-ink-500)';
  } else {
    stroke = 'var(--color-chart-1)';
    fill = 'var(--color-chart-1)';
  }

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block"
      aria-hidden
    >
      <path d={areaPath} fill={fill} fillOpacity={fillOpacity} />
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r={2} fill={stroke} />
    </svg>
  );
}
