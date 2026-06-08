import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────
 * AnimatedLogOut — drop-in replacement for lucide-react's <LogOut>. The
 * glyph is pixel-exact (path `d` values copied verbatim from lucide-react
 * v1.14.0). On hover of the host menu item / button / anchor the arrow
 * "sends off" through the door: it flies out to the right and fades, then
 * a single element re-enters from the left — one element, not two clones.
 * The doorframe bracket never moves.
 *
 * Mirrors AnimatedExternalLink, but the send-off is horizontal (out the
 * door) rather than diagonal. Timing matches the tuned external-link
 * send-off (0.26s exit / 0.28s re-enter).
 *
 * No `size-*` class is baked in: the MenuItem sizes child svgs via
 * `[&_svg]:size-4`, so leaving size off keeps this a true 1:1 swap for the
 * plain <LogOut> it replaces. `strokeWidth` (and everything else) passes
 * through, so the caller's `strokeWidth={1.75}` still wins.
 *
 * Motion is one-shot per hover and gated by `prefers-reduced-motion` via
 * `gsap.matchMedia()` — under `reduce` no listener and no timeline are
 * created, so the icon stays completely static.
 * ───────────────────────────────────────────────────────────────────────── */
export function AnimatedLogOut({ className, ...props }: React.SVGProps<SVGSVGElement>) {
	const ref = useRef<SVGSVGElement>(null);

	useGSAP(
		() => {
			const svg = ref.current;
			const arrow = svg?.querySelector('[data-arrow]');
			const host = svg?.closest('[role="menuitem"], button, a');
			if (!svg || !arrow || !host) return;

			const mm = gsap.matchMedia();

			mm.add('(prefers-reduced-motion: no-preference)', () => {
				// Paused "send-off": fly out the door to the right + fade,
				// snap to the left (invisible), re-enter to rest. One element.
				const tl = gsap
					.timeline({ paused: true })
					.to(arrow, { x: 6, opacity: 0, duration: 0.26, ease: 'power2.inOut' })
					.set(arrow, { x: -6 })
					.to(arrow, { x: 0, opacity: 1, duration: 0.28, ease: 'power2.out' });

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
			{/* Doorframe bracket — direct child, must not move. */}
			<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
			{/* Arrow — animated as a single group. */}
			<g data-arrow>
				<path d="m16 17 5-5-5-5" />
				<path d="M21 12H9" />
			</g>
		</svg>
	);
}
