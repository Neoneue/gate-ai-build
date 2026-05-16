import { useNavigate, useOutletContext } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { PageTitle } from '@/components/ui/page-title';
import { DashboardChrome } from '@/layouts/DashboardChrome';

/* ─────────────────────────────────────────────────────────────────────────
 * AuditTrail page (route: /audit-trail, sidebar: "Audit Trail")
 *
 * Stub. The full surface lands in a follow-up — this page exists so the
 * sidebar entry can navigate to a real route instead of being inert. Real
 * implementation will surface a tamper-evident, cryptographically verifiable
 * event ledger anchored to Constellation's Digital Evidence layer.
 * ───────────────────────────────────────────────────────────────────────── */

export function AuditTrail() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  return (
    <DashboardChrome
      activeNavId="audit-trail"
      sidebarExpanded={sidebarExpanded}
      onToggleSidebar={toggleSidebar}
      onNavigate={(path: string) => navigate(path)}
    >
      <PageHeader />
      <EmptyState
        icon={
          <div
            aria-hidden
            className="size-12 rounded-full bg-muted flex items-center justify-center"
          >
            <Lock className="size-5 text-ink-700" strokeWidth={1.75} />
          </div>
        }
        title="Audit Trail surface in progress"
        body="A tamper-evident ledger of every routed request, anchored to Constellation's Digital Evidence layer for cryptographically verifiable replay. Lands in a follow-up."
      />
    </DashboardChrome>
  );
}

function PageHeader() {
  return (
    <div className="flex flex-col gap-2 max-w-1/2">
      <PageTitle>Audit Trail</PageTitle>
      <p className="font-sans text-muted-foreground text-base tracking-tight m-0">
        Tamper-evident, cryptographically verifiable log of every routed request — anchored to Constellation's Digital Evidence layer.
      </p>
    </div>
  );
}
