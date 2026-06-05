import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ShieldAlert, EyeOff, Recycle, SlidersHorizontal, BarChart3, Route, Fingerprint, MessagesSquare, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

export type PlanFeature = { Icon: LucideIcon; title: string; detail: string };

type PlanCardData = {
	badge: { label: string; tone: 'neutral' | 'pro' };
	price: string;
	benefitsLabel: string;
	features: PlanFeature[];
	featured?: boolean;
	cta: { label: string; variant: 'default' | 'outline'; icon?: LucideIcon; onClick?: () => void; disabled?: boolean; ariaLabel?: string };
	ctaCaption: string;
};

const FREE_PLAN: PlanCardData = {
	badge: { label: 'FREE', tone: 'neutral' },
	price: '$0',
	benefitsLabel: "Included in your Free plan:",
	features: [
		{ Icon: Route,			title: 'Multi-provider routing',		detail: 'One base URL for OpenAI, Anthropic, and more' },
		{ Icon: Fingerprint,			title: 'Immutable audit trail',			detail: 'Every request fingerprinted to Constellation Digital Evidence (30 day retention)' },
		{ Icon: BarChart3,		title: 'Activity & request logs',		detail: 'Cost, tokens, and latency across the workspace' },
		{ Icon: MessagesSquare,	title: 'Conversation threading',		detail: 'Follow agent runs and chats end-to-end' },
	],
	cta: { label: 'Your current plan', variant: 'outline', disabled: true, ariaLabel: 'Free plan is your current plan' },
	ctaCaption: 'Free to use, forever',
};

const PRO_PLAN: PlanCardData = {
	featured: true,
	badge: { label: 'PRO PLAN', tone: 'pro' },
	price: '$30',
	benefitsLabel: "What you'll get going Pro:",
	features: [
		{ Icon: ShieldAlert,		title: 'Prompt injection scanning',	detail: 'Block or flag before tokens reach the model' },
		{ Icon: EyeOff,		title: 'PII, PHI & credential redaction',	detail: 'Redacted before the response returns' },
		{ Icon: SlidersHorizontal,	title: 'Spend, token & rate limits',	detail: 'Caps at the org, project, or key level.' },
		{ Icon: Recycle,		title: 'Token savings',					detail: '20%+ tokens saved per request via lossless compression and cache injection.' },
	],
	cta: { label: 'Go to Billing', variant: 'default' },
	ctaCaption: '$30/month after your 14 day trial ends',
};

function PlanCard({ plan, onUpgrade }: { plan: PlanCardData; onUpgrade: () => void }) {
	const CtaIcon = plan.cta.icon;
	return (
		<div
			data-plan-card
			className={`flex flex-col gap-4 rounded-md border bg-card p-4 ${plan.featured ? 'border-blue-600/30 ring-1 ring-blue-600/20' : 'border-border'}`}
		>
			<Badge
				variant={plan.badge.tone === 'pro' ? 'info' : 'neutral'}
				className={`self-start ${plan.badge.tone === 'pro' ? '' : 'border border-border'}`}
			>
				{plan.badge.label}
			</Badge>

			<h3 className="text-3xl font-medium tracking-tight text-neutral-900 tabular-nums m-0">
				{plan.price}
				<span className="text-lg text-muted-foreground"> per month</span>
			</h3>

			<div className="flex flex-col gap-4">
				<p className="text-xs font-medium text-neutral-900 m-0">{plan.benefitsLabel}</p>
				<ul className="flex flex-col gap-3 m-0 p-0 list-none">
					{plan.features.map(({ Icon, title, detail }) => (
						<li key={title} className="flex items-start gap-3">
							<span aria-hidden className="shrink-0 size-7 rounded-sm bg-muted flex items-center justify-center mt-1">
								<Icon className="size-3.5 text-neutral-700" strokeWidth={1.75} />
							</span>
							<div className="flex flex-col">
								<span className="text-sm text-neutral-900">{title}</span>
								<span className="text-xs text-neutral-500 text-pretty">{detail}</span>
							</div>
						</li>
					))}
				</ul>
			</div>

			<div className="mt-auto pt-2 flex flex-col gap-4">
				<Button
					variant={plan.cta.variant}
					disabled={plan.cta.disabled}
					aria-label={plan.cta.ariaLabel}
					onClick={plan.cta.disabled ? undefined : (plan.cta.onClick ?? onUpgrade)}
					className="w-full"
				>
					{CtaIcon ? <CtaIcon className="size-4" /> : null}
					{plan.cta.label}
				</Button>
				<p className="text-xs text-neutral-500 text-center m-0">{plan.ctaCaption}</p>
			</div>
		</div>
	);
}

export function PlanComparisonDialog({
	open,
	onOpenChange,
	onUpgrade,
}: {
	open: boolean;
	onOpenChange: (next: boolean) => void;
	onUpgrade: () => void;
}) {
	const cardsRef = useRef<HTMLDivElement>(null);

	// Stagger the plan cards in just after the Dialog primitive's own
	// enter animation, scoped to this content so cleanup is automatic.
	useGSAP(() => {
		if (!open || !cardsRef.current) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const cards = cardsRef.current.querySelectorAll('[data-plan-card]');
		gsap.fromTo(
			cards,
			{ opacity: 0, y: 8 },
			{ opacity: 1, y: 0, duration: 0.32, stagger: 0.08, ease: 'power3.out', delay: 0.12 },
		);
	}, { scope: cardsRef, dependencies: [open] });

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-3xl p-4 gap-4">
				<DialogHeader>
					<DialogTitle className="font-sans text-lg/6 font-medium text-neutral-900">
						Compare plans
					</DialogTitle>
				</DialogHeader>
				<div ref={cardsRef} className="grid grid-cols-2 gap-4">
					<PlanCard plan={FREE_PLAN} onUpgrade={onUpgrade} />
					<PlanCard plan={PRO_PLAN} onUpgrade={() => { onOpenChange(false); onUpgrade(); }} />
				</div>
			</DialogContent>
		</Dialog>
	);
}
