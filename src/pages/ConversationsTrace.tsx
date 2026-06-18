import { ChevronLeft } from "lucide-react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { CONVERSATION_ROWS } from "@/data/conversations";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { ConversationDetailBody, type ConversationRow } from "./Conversations";

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
        <button
          className="group relative inline-flex items-center gap-1 rounded-xs font-medium text-neutral-500 text-sm transition-[colors,scale] duration-150 ease-out after:absolute after:inset-x-0 after:-inset-y-3 after:content-[''] hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
          onClick={() => navigate("/conversations")}
          type="button"
        >
          <ChevronLeft
            aria-hidden
            className="size-4 transition-transform duration-150 ease-out group-hover:-translate-x-px motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
            strokeWidth={1.75}
          />
          Conversations
        </button>
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
          <h2 className="m-0 text-balance font-medium font-sans text-neutral-900 text-sm">
            Conversation not found
          </h2>
          <p className="mt-1 font-sans text-neutral-500 text-sm">
            No conversation matches{" "}
            <span className="font-mono">{conversationId}</span>.
          </p>
        </div>
      )}
    </DashboardChrome>
  );
}
