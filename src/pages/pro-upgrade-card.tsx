import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PlanComparisonDialog } from '@/pages/plan-comparison-dialog';

// Shared Pro-upsell card for the `-free` feature pages. The icon and body copy
// vary per feature; everything else (icon chip, 18px balanced title, button
// row, and the Compare-plans dialog wiring) is baked in so a stylistic change
// here lands on every page that uses it.
export function ProUpgradeCard({
	icon: Icon,
	body,
	title = 'Upgrade to use this feature',
}: {
	icon: LucideIcon;
	body: string;
	title?: string;
}) {
	const navigate = useNavigate();
	const [compareOpen, setCompareOpen] = useState(false);
	return (
		<>
			<EmptyState
				className="[&_h3]:text-lg [&_h3]:text-balance"
				icon={
					<div
						aria-hidden
						className="size-12 rounded-full bg-muted flex items-center justify-center"
					>
						<Icon className="size-5 text-neutral-700" />
					</div>
				}
				title={title}
				body={body}
				action={
					<div className="flex items-center gap-2 pt-4">
						<Button onClick={() => navigate('/billing')}><Sparkles className="size-4" aria-hidden /> Upgrade to Pro</Button>
						<Button variant="outline" onClick={() => setCompareOpen(true)}>Compare plans</Button>
					</div>
				}
			/>
			<PlanComparisonDialog open={compareOpen} onOpenChange={setCompareOpen} onUpgrade={() => navigate('/billing')} />
		</>
	);
}
