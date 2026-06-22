import type * as React from "react";

import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * EmptyState — page-level empty surface with icon + heading + body + action.
 *
 * Codified 2026-05-09 after rams audit caught the same h2-should-be-h3 bug
 * in two parallel inline implementations (CMP-017's local `EmptyState` and
 * CMP-018's `IntegrationEmptyState`). When the same bug appears in two
 * files, those files are de-facto running parallel implementations of one
 * primitive — extract before fixing.
 *
 * Heading is `<h3>` (page already owns h2). Card chrome matches the <Card>
 * primitive exactly — `border border-border shadow-xs` (the 2026-05-15
 * everyday material tier; updated 2026-06-09 from the prior
 * `shadow-(--shadow-border)` ring so empty states match real cards). The
 * `icon` slot is optional — CMP-017's invitations pane omits it; CMP-018's
 * integrations tab includes a Layers chip above the heading. The `action`
 * slot accepts any React node — typically a `<Button>`, sometimes wired
 * to a click handler, sometimes inert in showcase contexts.
 *
 * Note: this is the *page-level* empty state. CMP-007's modal-internal
 * empty state (CMP007ModalEmptyState.tsx) is a different shape and
 * remains its own specimen.
 * ───────────────────────────────────────────────────────────────────────── */

export interface EmptyStateProps {
  /** Optional action node (typically a `<Button>`). */
  action?: React.ReactNode;
  body: string;
  className?: string;
  /** Optional decorative element rendered above the heading (typically an
   *  icon chip wrapped in `aria-hidden`). */
  icon?: React.ReactNode;
  title: string;
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-md border border-border bg-card px-6 py-12 text-center shadow-xs",
        className
      )}
    >
      {icon}
      <div className="flex flex-col gap-3">
        <h3 className="m-0 font-medium font-sans text-lg text-neutral-900">
          {title}
        </h3>
        <p className="m-0 max-w-md text-pretty font-sans text-neutral-500 text-sm">
          {body}
        </p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
