import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────
 * AnimatedBell — drop-in replacement for lucide-react's <Bell>. The glyph
 * is pixel-exact (path `d` values copied verbatim from lucide-react
 * v1.14.0). On hover of the host button/anchor the bell "rings": it swings
 * back and forth with a decaying amplitude, then settles.
 *
 * The craft detail (per the svg-animations skill): SVG transforms default
 * to origin (0,0), so the pivot must be set explicitly. A bell hangs from
 * the top, so we pivot at top-center (`transformOrigin: '50% 0%'`, the dome
 * apex) — pivoting at center would read as a shake, not a swing.
 *
 * No `size-*` class is baked in; the caller passes `size-4` (matching the
 * plain <Bell> it replaces), and `strokeWidth` passes through.
 *
 * Motion is one-shot per hover and gated by `prefers-reduced-motion` via
 * `gsap.matchMedia()` — under `reduce` no listener and no timeline are
 * created, so the icon stays completely static.
 * ───────────────────────────────────────────────────────────────────────── */
export function AnimatedBell({ className, ...props }: React.SVGProps<SVGSVGElement>) {
	const ref = useRef<SVGSVGElement>(null);

	useGSAP(
		() => {
			const svg = ref.current;
			const bell = svg?.querySelector('[data-bell]');
			const host = svg?.closest('button, a');
			if (!svg || !bell || !host) return;

			const mm = gsap.matchMedia();

			mm.add('(prefers-reduced-motion: no-preference)', () => {
				// Pivot at the dome apex so the bell swings like a pendulum
				// rather than shaking around its centre.
				gsap.set(bell, { transformOrigin: '50% 0%' });

				// Decaying swing, settles back to rest.
				const tl = gsap
					.timeline({ paused: true })
					.to(bell, { rotation: 12, duration: 0.12, ease: 'power2.out' })
					.to(bell, { rotation: -9, duration: 0.1, ease: 'power1.inOut' })
					.to(bell, { rotation: 6, duration: 0.1, ease: 'power1.inOut' })
					.to(bell, { rotation: -4, duration: 0.1, ease: 'power1.inOut' })
					.to(bell, { rotation: 0, duration: 0.12, ease: 'power1.inOut' });

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
			{/* Whole bell swings as one rigid body. */}
			<g data-bell>
				<path d="M10.268 21a2 2 0 0 0 3.464 0" />
				<path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
			</g>
		</svg>
	);
}
