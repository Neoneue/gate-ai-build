import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────
 * AnimatedDownload — drop-in replacement for lucide-react's <Download>. The
 * glyph is pixel-exact (path `d` values copied verbatim from lucide-react
 * v1.14.0). On hover of the host button/anchor the arrow "drops": it falls
 * down into the tray and fades, then a single element re-enters from the
 * top — one element, not two clones. The tray never moves.
 *
 * Mirrors AnimatedLogOut, but the send-off is vertical (down into the tray)
 * rather than horizontal. Timing matches the tuned send-off
 * (0.26s exit / 0.28s re-enter).
 *
 * No `size-*` class is baked in: the Button primitive sizes child svgs via
 * `[&_svg:not([class*='size-'])]:size-…`, so leaving size off keeps this a
 * true 1:1 swap for the plain <Download> it replaces. `data-icon`,
 * `strokeWidth`, etc. pass through.
 *
 * Motion is one-shot per hover and gated by `prefers-reduced-motion` via
 * `gsap.matchMedia()` — under `reduce` no listener and no timeline are
 * created, so the icon stays completely static.
 * ───────────────────────────────────────────────────────────────────────── */
export function AnimatedDownload({ className, ...props }: React.SVGProps<SVGSVGElement>) {
	const ref = useRef<SVGSVGElement>(null);

	useGSAP(
		() => {
			const svg = ref.current;
			const arrow = svg?.querySelector('[data-arrow]');
			const host = svg?.closest('button, a');
			if (!svg || !arrow || !host) return;

			const mm = gsap.matchMedia();

			mm.add('(prefers-reduced-motion: no-preference)', () => {
				// Paused "drop": fall into the tray + fade, snap to the top
				// (invisible), re-enter to rest. One element.
				const tl = gsap
					.timeline({ paused: true })
					.to(arrow, { y: 6, opacity: 0, duration: 0.26, ease: 'power2.in' })
					.set(arrow, { y: -6 })
					.to(arrow, { y: 0, opacity: 1, duration: 0.28, ease: 'power2.out' });

				const onEnter = () => tl.restart();
				host.addEventListener('mouseenter', onEnter);

				return () => {
					host.removeEventListener('mouseenter', onEnter);
				};
			});
		},
		{ scope: ref },
	);

	return (
		<svg
			ref={ref}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			className={cn(className)}
			{...props}
		>
			{/* Tray — direct child, must not move. */}
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
			{/* Arrow (shaft + head) — animated as a single group. */}
			<g data-arrow>
				<path d="M12 15V3" />
				<path d="m7 10 5 5 5-5" />
			</g>
		</svg>
	);
}
