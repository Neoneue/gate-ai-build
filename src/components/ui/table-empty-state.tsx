import { FileText } from "lucide-react";
import type * as React from "react";
import { EmptyState } from "@/components/ui/empty-state";

/* ─────────────────────────────────────────────────────────────────────────
 * TableEmptyState — canonical empty state for any table-bearing Card.
 *
 * Codified 2026-05-16 from AuditTrail.tsx after the recipe was about to
 * land in 6+ places (Activity UsageByKey, Requests, Security, Conversations,
 * Team Members + Invitations, Models). Per design.md §Lists/Tables.
 *
 * Render inside `<Card density="flush">` in the same render branch where
 * the table would otherwise sit. Callers should ALSO hide the toolbar
 * (search / kind filter / sort dropdown) above this when the table is
 * empty — page-level range selectors stay visible for recovery.
 *
 *   {isEmpty ? null : <Toolbar />}
 *   {isEmpty ? (
 *     <TableEmptyState
 *       title="No audit events"
 *       body="…neutral copy that reads for fresh-workspace AND over-filtered…"
 *     />
 *   ) : (
 *     <>
 *       <Table>…</Table>
 *       <TablePaginationFooter … />
 *     </>
 *   )}
 *
 * Recipe (locked):
 *   - `<div className="py-6">` wrapper for 24px top/bottom breathing room
 *     outside the EmptyState's own internal py-12.
 *   - `rounded-none shadow-none` override on EmptyState so it sits flush
 *     inside the parent Card's surface (no nested card chrome).
 *   - FileText (lucide "document") at size-5 inside a size-12 rounded-md
 *     bg-muted chip — the canonical "log / record / event" affordance.
 *   - Title is `No {entity}` (e.g. "No audit events", "No requests").
 *   - Body describes what data would appear once it arrives — single-shape
 *     copy that reads cleanly for fresh-workspace AND over-filtered states.
 *
 * Override `icon` only when the table's content is non-record (e.g. a
 * settings list could pass a Shield or Sliders icon). Don't hand-roll the
 * py-6 / EmptyState shape — extend this primitive if a new variant is
 * genuinely needed.
 * ───────────────────────────────────────────────────────────────────────── */

export interface TableEmptyStateProps {
  /** Optional recovery action (e.g. "Clear filters" button). */
  action?: React.ReactNode;
  body: string;
  /** Optional icon override. Defaults to FileText (document). */
  icon?: React.ReactNode;
  title: string;
}

const DEFAULT_ICON = (
  <div
    aria-hidden
    className="flex size-12 items-center justify-center rounded-md bg-muted"
  >
    <FileText className="size-5 text-neutral-700" strokeWidth={1.75} />
  </div>
);

export function TableEmptyState({
  title,
  body,
  icon = DEFAULT_ICON,
  action,
}: TableEmptyStateProps) {
  return (
    <div className="py-6">
      <EmptyState
        action={action}
        body={body}
        className="rounded-none shadow-none"
        icon={icon}
        title={title}
      />
    </div>
  );
}
