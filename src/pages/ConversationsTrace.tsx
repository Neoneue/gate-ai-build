import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { BackLink } from "@/components/ui/back-link";
import { CONVERSATION_ROWS } from "@/data/conversations";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { ConversationDetailBody } from "./conversations/ConversationDetail";
import type { ConversationRow } from "./conversations/types";

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
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      {/* Back breadcrumb to Conversations (top-left); Copy ID + View Request
          (top-right), mirroring the Requests findings page. */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <BackLink
          label="Conversations"
          onClick={() => navigate("/conversations")}
        />
      </div>

      {row ? (
        /* No modal card — the trace content flows directly on the page:
           static title, KPI rail, finding banner, step tabs, then the
           two-panel body. `-mx-6` cancels the chrome's page gutter so the
           body's own px-6 lands at the standard gutter (no double padding). */
        <div className="-mx-6 pb-8">
          <ConversationDetailBody
            key={conversationId}
            row={row}
            variant="page"
          />
        </div>
      ) : (
        <div
          className="rounded-md border border-border bg-card p-8 text-center"
          role="alert"
        >
          <h2 className="type-label-14 m-0 text-balance text-foreground">
            Conversation not found
          </h2>
          <p className="type-copy-14 mt-1 text-muted-foreground">
            No conversation matches{" "}
            <span className="type-mono-14">{conversationId}</span>.
          </p>
        </div>
      )}
    </DashboardChrome>
  );
}
