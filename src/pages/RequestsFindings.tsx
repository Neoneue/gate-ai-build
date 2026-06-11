import { ChevronLeft, ExternalLink } from "lucide-react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { REQUEST_ROWS_ALL, requestRowId } from "@/data/requests";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { RequestDetailBodyV2, type RequestRow } from "./Requests";

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
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      {/* Back breadcrumb to Requests (top-left); View Conversation (top-right). */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          className="group relative inline-flex items-center gap-1 rounded-xs font-medium text-neutral-500 text-sm transition-[colors,scale] duration-150 ease-out after:absolute after:inset-x-0 after:-inset-y-3 after:content-[''] hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
          onClick={() => navigate("/requests")}
          type="button"
        >
          <ChevronLeft
            aria-hidden
            className="size-4 transition-transform duration-150 ease-out group-hover:-translate-x-px motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
            strokeWidth={1.75}
          />
          Requests
        </button>
        {row && (
          <Button
            onClick={() => navigate(`/conversations-trace/${row.conversation}`)}
            size="sm"
            type="button"
          >
            View Conversation
            <ExternalLink aria-hidden data-icon="inline-end" />
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
        <div
          className="rounded-md border border-border bg-card p-8 text-center"
          role="alert"
        >
          <h2 className="m-0 text-balance font-medium font-sans text-neutral-900 text-sm">
            Request not found
          </h2>
          <p className="mt-1 font-sans text-neutral-500 text-sm">
            No request matches <span className="font-mono">{requestId}</span>.
          </p>
        </div>
      )}
    </DashboardChrome>
  );
}
