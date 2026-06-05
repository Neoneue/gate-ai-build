import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ChevronLeft, ExternalLink } from 'lucide-react';

import { DashboardChrome } from '@/layouts/DashboardChrome';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';

import {
  ConversationDetailBody,
  CONVERSATION_ROWS,
  type ConversationRow,
} from './Conversations';
import { REQUEST_ROWS_RECENT } from './Requests';

/* ─── /conversations-trace/:conversationId ──────────────────────────────────
 * URL-addressable page for one conversation's messages + request trace —
 * shareable, multi-tab (the GitHub model). This is the default target when a
 * Conversations table row is clicked. Renders the SAME `ConversationDetailBody`
 * EXACTLY as the dialog (same sections / format) but as a page via
 * `variant="page"`: no modal card shell, static header, banner + step tabs, and
 * the two-panel grid bounded to a fixed height so each column scrolls
 * internally. The modal (`ConversationDetailDialog`) is kept and still opens via
 * the `?open=` deep-link. Mirrors `RequestsFindings.tsx` 1:1.
 * ────────────────────────────────────────────────────────────────────────── */
export function ConversationsTrace() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  const row: ConversationRow | undefined = conversationId
    ? CONVERSATION_ROWS.find((r) => r.conversationId === conversationId)
    : undefined;

  return (
    <DashboardChrome
      activeNavId="conversations"
      sidebarExpanded={sidebarExpanded}
      onToggleSidebar={toggleSidebar}
      onNavigate={(path: string) => navigate(path)}
    >
      {/* Back breadcrumb to Conversations (top-left); Copy ID + View Request
          (top-right), mirroring the Requests findings page. */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/conversations')}
          className="group relative inline-flex items-center gap-1 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-[colors,scale] duration-150 ease-out active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100 rounded-xs focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 after:absolute after:inset-x-0 after:-inset-y-3 after:content-['']"
        >
          <ChevronLeft
            className="size-4 transition-transform duration-150 ease-out group-hover:-translate-x-px motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
            strokeWidth={1.75}
            aria-hidden
          />
          Conversations
        </button>
        {row && (
          <div className="flex items-center gap-2">
            <CopyButton
              mode="label"
              size="sm"
              text="Copy ID"
              value={row.conversationId}
              label="conversation ID"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const linkedRequest = REQUEST_ROWS_RECENT.find(
                  (r) => r.conversation === row.conversationId && !!r.requestId,
                );
                if (linkedRequest?.requestId) {
                  navigate(`/requests-findings/${linkedRequest.requestId}`);
                } else {
                  navigate('/requests');
                }
              }}
            >
              View Request
              <ExternalLink data-icon="inline-end" aria-hidden />
            </Button>
          </div>
        )}
      </div>

      {row ? (
        /* No modal card — the trace content flows directly on the page:
           static title, KPI rail, finding banner, step tabs, then the
           two-panel body. `-mx-6` cancels the chrome's page gutter so the
           body's own px-6 lands at the standard gutter (no double padding). */
        <div className="-mx-6 pb-8">
          <ConversationDetailBody key={conversationId} row={row} variant="page" />
        </div>
      ) : (
        <div role="alert" className="rounded-md border border-border bg-card p-8 text-center">
          <h2 className="font-sans text-sm font-medium text-neutral-900 m-0 text-balance">
            Conversation not found
          </h2>
          <p className="mt-1 font-sans text-sm text-neutral-500">
            No conversation matches <span className="font-mono">{conversationId}</span>.
          </p>
        </div>
      )}
    </DashboardChrome>
  );
}
