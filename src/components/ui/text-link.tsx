import * as React from 'react';

import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────
 * TextLink — inline link affordance, button-by-default.
 *
 * Codified 2026-05-10. The repo's link visual contract is "ink + permanent
 * faint underline" (decoration-ink-200, bumps to ink-500 on hover/focus).
 * Blue is reserved for info/completed/active-tab/focus and is NOT used for
 * links. See feedback_link-affordance.md.
 *
 * Semantics:
 *   default          renders <button type="button"> — correct for this
 *                    repo's no-router architecture (cmd/middle-click on
 *                    an <a href="#"> was never navigating anywhere).
 *   as="a" + href    renders an <a> for real navigation.
 *
 * Visual recipe (locked):
 *   text-ink-800 bg-transparent p-0 outline-none rounded-xs
 *   underline decoration-ink-200 underline-offset-2
 *   hover:decoration-ink-500 focus-visible:decoration-ink-500
 *   focus-visible:ring-3 focus-visible:ring-ring/50
 *
 * Pass `className` for typography overrides (font-mono, text-sm, etc.).
 * The recipe composes cleanly via twMerge; later utilities win.
 * ───────────────────────────────────────────────────────────────────────── */

const TEXT_LINK_BASE =
  'text-ink-800 bg-transparent p-0 outline-none rounded-xs underline decoration-ink-200 underline-offset-2 hover:decoration-ink-500 focus-visible:decoration-ink-500 focus-visible:ring-3 focus-visible:ring-ring/50';

type ButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'type'
> & {
  as?: 'button';
};

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  as: 'a';
  href: string;
};

export type TextLinkProps = ButtonProps | AnchorProps;

export function TextLink(props: TextLinkProps) {
  if (props.as === 'a') {
    const { as: _as, className, children, ...rest } = props;
    return (
      <a className={cn(TEXT_LINK_BASE, className)} {...rest}>
        {children}
      </a>
    );
  }
  const { as: _as, className, children, ...rest } = props as ButtonProps;
  return (
    <button
      type="button"
      className={cn(TEXT_LINK_BASE, className)}
      {...rest}
    >
      {children}
    </button>
  );
}
