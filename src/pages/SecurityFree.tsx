import { useNavigate, useOutletContext } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import { PageTitle } from '@/components/ui/page-title';
import { DashboardChrome } from '@/layouts/DashboardChrome';
import { ProUpgradeCard } from '@/pages/pro-upgrade-card';

export function SecurityFree() {
	const navigate = useNavigate();
	const { sidebarExpanded, toggleSidebar } = useOutletContext<{
		sidebarExpanded: boolean;
		toggleSidebar: () => void;
	}>();
	return (
		<DashboardChrome
			activeNavId="security-events"
			sidebarExpanded={sidebarExpanded}
			onToggleSidebar={toggleSidebar}
			onNavigate={(path: string) => navigate(path)}
		>
			<PageHeader />
			<ProUpgradeCard
				icon={TriangleAlert}
				body="Security scanning is a Pro feature. Upgrade in Billing to gate prompt injection, redact PII and credentials, and inspect every request inline."
			/>
		</DashboardChrome>
	);
}

/* ─── Page header ───────────────────────────────────────────────────── */

function PageHeader() {
	return (
		<div className="flex flex-col gap-2 max-w-1/2">
			<PageTitle>Security events</PageTitle>
			<p className="font-sans text-neutral-500 text-base tracking-tight text-pretty m-0">
				Every injection, PII, and credential event your policies caught, anchored to Constellation's Digital Evidence layer. Blocked, flagged, or redacted.
			</p>
		</div>
	);
}
