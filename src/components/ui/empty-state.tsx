import * as React from 'react';

import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────
 * EmptyState — page-level empty surface with icon + heading + body + action.
 *
 * Codified 2026-05-09 after rams audit caught the same h2-should-be-h3 bug
 * in two parallel inline implementations (CMP-017's local `EmptyState` and
 * CMP-018's `IntegrationEmptyState`). When the same bug appears in two
 * files, those files are de-facto running parallel implementations of one
 * primitive — extract before fixing.
 *
 * Heading is `<h3>` (page already owns h2). Bordered-white card chrome
 * matches the everyday material tier (`shadow-(--shadow-border)`). The
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
  /** Optional decorative element rendered above the heading (typically an
   *  icon chip wrapped in `aria-hidden`). */
  icon?: React.ReactNode;
  title: string;
  body: string;
  /** Optional action node (typically a `<Button>`). */
  action?: React.ReactNode;
  className?: string;
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
        'flex flex-col items-center justify-center gap-3 py-12 px-6 rounded-md bg-white shadow-(--shadow-border) text-center',
        className,
      )}
    >
      {icon}
      <h3 className="font-sans text-base font-medium text-ink-900 m-0">
        {title}
      </h3>
      <p className="font-sans text-sm text-ink-500 max-w-md text-pretty m-0">
        {body}
      </p>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
