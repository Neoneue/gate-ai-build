import * as React from 'react';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────
 * SettingsRow — title + subtitle on the left, control on the right.
 *
 * Codified 2026-05-10 after extract-before-handrolling pass. The recipe
 * was local to CMP-018 (Logging tab, 4× consumers). The same shape was
 * hand-rolled in CMP-018's SecurityCard (passkey row) with two minor
 * variants: `items-start` alignment (instead of items-center) and an
 * `<h4>` heading (instead of Label/span). The primitive accepts both via
 * `alignTop` and `titleAs`.
 *
 * Modes:
 *   default (input-bearing)  title renders as <Label htmlFor={id}> tying
 *                            the click target to the inner control. Pass
 *                            `id` matching the control's id.
 *   static                   title renders as a heading-styled <span>.
 *                            Used when the right-side affordance is a
 *                            Badge or other non-focusable read-only state.
 *   titleAs="h4"             title renders as <h4>. Used when the row sits
 *                            inside a Card whose CardTitle is the section
 *                            heading and this row needs to nest a sub-
 *                            heading semantically (e.g. SecurityCard
 *                            passkey row).
 *
 * Rhythm:
 *   first        first row in the list — no top border.
 *   default      subsequent rows get `border-t border-ink-200` so the
 *                rhythm reads as a list of independent settings.
 *
 * Vertical alignment:
 *   default      items-center — for rows where title doesn't wrap and the
 *                control is a single-line affordance.
 *   alignTop     items-start — for rows where title or subtitle may wrap
 *                and the control should stay top-aligned with the title.
 * ───────────────────────────────────────────────────────────────────────── */

export interface SettingsRowProps {
  /** Id of the inner control — required when titleAs="label" (default
   *  behavior). Wires the click target via `<Label htmlFor={id}>`. */
  id?: string;
  title: string;
  subtitle: string;
  control: React.ReactNode;
  /** First row in the list — omit the top divider. */
  first?: boolean;
  /** Title renders as a non-label span (no `htmlFor`). Used when the
   *  right-side affordance is read-only (Badge, etc.). */
  static?: boolean;
  /** Override the title rendering element. Defaults: 'label' when
   *  `static` is false, 'span' when `static` is true. Pass 'h4' to render
   *  as a heading (e.g. when the row sits inside a Card with a CardTitle
   *  section heading and needs to nest semantically). */
  titleAs?: 'label' | 'span' | 'h4';
  /** Vertical alignment of the row's two columns. Defaults to
   *  `items-center`. Pass `alignTop` for `items-start` when the title or
   *  subtitle may wrap. */
  alignTop?: boolean;
  className?: string;
}

export function SettingsRow({
  id,
  title,
  subtitle,
  control,
  first = false,
  static: isStatic = false,
  titleAs,
  alignTop = false,
  className,
}: SettingsRowProps) {
  const effectiveTitleAs: 'label' | 'span' | 'h4' =
    titleAs ?? (isStatic ? 'span' : 'label');

  const titleClass =
    effectiveTitleAs === 'h4'
      ? 'font-sans text-sm font-medium text-ink-900 m-0'
      : 'font-sans text-ink-900 font-medium text-sm leading-none';

  return (
    <div
      className={cn(
        'flex justify-between gap-6 py-4',
        alignTop ? 'items-start' : 'items-center',
        first ? '' : 'border-t border-ink-200',
        className,
      )}
    >
      <div className="flex flex-col gap-1 min-w-0">
        {effectiveTitleAs === 'label' ? (
          <Label htmlFor={id} className="text-ink-900 font-medium text-sm">
            {title}
          </Label>
        ) : effectiveTitleAs === 'h4' ? (
          <h4 className={titleClass}>{title}</h4>
        ) : (
          <span className={titleClass}>{title}</span>
        )}
        <p className="font-sans text-sm text-ink-500 text-pretty m-0">
          {subtitle}
        </p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}
