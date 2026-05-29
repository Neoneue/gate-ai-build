import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────
 * AnimatedExternalLink — drop-in replacement for lucide-react's
 * <ExternalLink>. The glyph is pixel-exact (path `d` values copied
 * verbatim from lucide-react v1.14.0). On hover of the host button/anchor
 * the arrow "sends off": it flies out the top-right and fades, then a
 * single element re-enters from the bottom-left — one element, not two
 * clones. The box never moves.
 *
 * No `size-*` class is baked in: the Button primitive sizes child svgs via
 * `[&_svg:not([class*='size-'])]:size-3.5`, so leaving size off keeps this
 * a true 1:1 swap for the plain <ExternalLink> it replaces.
 *
 * Motion is one-shot per hover and gated by `prefers-reduced-motion` via
 * `gsap.matchMedia()` — under `reduce` no listener and no timeline are
 * created, so the icon stays completely static.
 * ───────────────────────────────────────────────────────────────────────── */
export function AnimatedExternalLink({ className, ...props }: React.SVGProps<SVGSVGElement>) {
	const ref = useRef<SVGSVGElement>(null);

	useGSAP(
		() => {
			const svg = ref.current;
			const arrow = svg?.querySelector('[data-arrow]');
			const host = svg?.closest('button, a');
			if (!svg || !arrow || !host) return;

			const mm = gsap.matchMedia();

			mm.add('(prefers-reduced-motion: no-preference)', () => {
				// Paused "send-off": fly out top-right + fade, snap to
				// bottom-left (invisible), re-enter to rest. One element.
				const tl = gsap
					.timeline({ paused: true })
					.to(arrow, { x: 5, y: -5, opacity: 0, duration: 0.26, ease: 'power2.in' })
					.set(arrow, { x: -5, y: 5 })
					.to(arrow, { x: 0, y: 0, opacity: 1, duration: 0.28, ease: 'power2.out' });

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
			{/* Box — direct child, must not move. */}
			<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
			{/* Arrow — animated as a single group. */}
			<g data-arrow>
				<path d="M15 3h6v6" />
				<path d="M10 14 21 3" />
			</g>
		</svg>
	);
}
