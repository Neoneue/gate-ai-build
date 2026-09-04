import { ExternalLink } from "lucide-react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { REQUEST_ROWS_ALL, requestRowId } from "@/data/requests";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { useBudgetBlockRows } from "@/pages/requests/budget-block-rows";
import { RequestDetailBodyV2 } from "./requests/RequestDetailBody";
import type { RequestRow } from "./requests/types";

/* ─── /messages-findings/:requestId ─────────────────────────────────────────
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

  const blockRows = useBudgetBlockRows();
  const row: RequestRow | undefined = requestId
    ? [...blockRows, ...REQUEST_ROWS_ALL].find(
        (r) => requestRowId(r) === requestId
      )
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
        <BackLink label="Messages" onClick={() => navigate("/messages")} />
        {row && (
          <Button
            onClick={() => navigate(`/conversations-trace/${row.conversation}`)}
            size="sm"
            type="button"
          >
            View conversation
            <ExternalLink aria-hidden data-icon="inline-end" />
          </Button>
        )}
      </div>

      {row ? (
        /* No modal card — the findings content flows directly on the page:
           title + badge, KPI rail, tabs, then the body. `-mx-6` cancels
           the chrome's page gutter so the body's own px-6 lands at the standard
           gutter (no double padding). */
        <div className="-mx-6">
          <RequestDetailBodyV2 key={requestId} row={row} />
        </div>
      ) : (
        <div
          className="rounded-md border border-border bg-card p-8 text-center"
          role="alert"
        >
          <h2 className="type-label-14 m-0 text-balance text-foreground">
            Request not found
          </h2>
          <p className="type-copy-14 mt-1 text-muted-foreground">
            No request matches <span className="type-mono-14">{requestId}</span>
            .
          </p>
        </div>
      )}
    </DashboardChrome>
  );
}
