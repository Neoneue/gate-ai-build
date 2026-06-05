import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ChevronLeft, ExternalLink } from 'lucide-react';

import { DashboardChrome } from '@/layouts/DashboardChrome';
import { Button } from '@/components/ui/button';

import {
  RequestDetailBodyV2,
  REQUEST_ROWS_ALL,
  requestRowId,
  type RequestRow,
} from './Requests';

/* ─── /requests-findings/:requestId ─────────────────────────────────────────
 * URL-addressable page for one request's findings — shareable, multi-tab
 * (the GitHub model). This is the default target when a Requests table row is
 * clicked. Renders the V2 Findings content EXACTLY as the dialog (same
 * sections / format) but as a page: no modal card shell, flowing full-width,
 * no internal scroll. Reuses the same `RequestDetailBodyV2` in `variant="page"`
 * so the (stored) modal and this page never drift.
 * ────────────────────────────────────────────────────────────────────────── */

export function RequestsFindings() {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  const row: RequestRow | undefined = requestId
    ? REQUEST_ROWS_ALL.find((r) => requestRowId(r) === requestId)
    : undefined;

  return (
    <DashboardChrome
      activeNavId="requests"
      sidebarExpanded={sidebarExpanded}
      onToggleSidebar={toggleSidebar}
      onNavigate={(path: string) => navigate(path)}
    >
      {/* Back breadcrumb to Requests (top-left); View Conversation (top-right). */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/requests')}
          className="group relative inline-flex items-center gap-1 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-[colors,scale] duration-150 ease-out active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100 rounded-xs focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 after:absolute after:inset-x-0 after:-inset-y-3 after:content-['']"
        >
          <ChevronLeft
            className="size-4 transition-transform duration-150 ease-out group-hover:-translate-x-px motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
            strokeWidth={1.75}
            aria-hidden
          />
          Requests
        </button>
        {row && (
          <Button
            type="button"
            size="sm"
            onClick={() => navigate(`/conversations-trace/${row.conversation}`)}
          >
            View Conversation
            <ExternalLink data-icon="inline-end" aria-hidden />
          </Button>
        )}
      </div>

      {row ? (
        /* No modal card — the findings content flows directly on the page:
           title + badge, KPI rail, banner, tabs, then the body. `-mx-6` cancels
           the chrome's page gutter so the body's own px-6 lands at the standard
           gutter (no double padding). */
        <div className="-mx-6">
          <RequestDetailBodyV2 key={requestId} row={row} variant="page" />
        </div>
      ) : (
        <div role="alert" className="rounded-md border border-border bg-card p-8 text-center">
          <h2 className="font-sans text-sm font-medium text-neutral-900 m-0 text-balance">Request not found</h2>
          <p className="mt-1 font-sans text-sm text-neutral-500">
            No request matches <span className="font-mono">{requestId}</span>.
          </p>
        </div>
      )}
    </DashboardChrome>
  );
}
