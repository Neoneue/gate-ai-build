import { useNavigate, useOutletContext } from 'react-router-dom';
import { Coins } from 'lucide-react';
import { PageTitle } from '@/components/ui/page-title';
import { DashboardChrome } from '@/layouts/DashboardChrome';
import { ProUpgradeCard } from '@/pages/pro-upgrade-card';

export function TokenSavingsFree() {
	const navigate = useNavigate();
	const { sidebarExpanded, toggleSidebar } = useOutletContext<{
		sidebarExpanded: boolean;
		toggleSidebar: () => void;
	}>();
	return (
		<DashboardChrome
			activeNavId="token-savings"
			sidebarExpanded={sidebarExpanded}
			onToggleSidebar={toggleSidebar}
			onNavigate={(path: string) => navigate(path)}
		>
			<PageHeader />
			<ProUpgradeCard
				icon={Coins}
				body="Token savings are a Pro feature. Upgrade in Billing to save 20%+ on every request, automatically."
			/>
		</DashboardChrome>
	);
}

/* ─── Page header ───────────────────────────────────────────────────── */

function PageHeader() {
	return (
		<div className="flex flex-col gap-2">
			<PageTitle>Token Savings</PageTitle>
			<p className="font-sans text-neutral-500 text-base tracking-tight text-pretty m-0 max-w-1/2">
				Cache, compress and deduplicate to spend less per request.
			</p>
		</div>
	);
}
