import type * as React from "react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * TextLink — inline link affordance, button-by-default.
 *
 * Codified 2026-05-10. The repo's link visual contract is "ink + permanent
 * faint underline" (decoration-border, bumps to decoration-muted-foreground
 * on hover/focus).
 * Blue is reserved for info/completed/active-tab/focus and is NOT used for
 * links. See feedback_link-affordance.md.
 *
 * Semantics:
 *   default          renders <button type="button"> — for in-place actions
 *                    (open a dialog, toggle something) that read as a link.
 *   to="/route"      renders a React Router <Link> — a real <a href> that
 *                    routes client-side. This is the branch for every
 *                    in-app route change; a plain <a href="/route"> would
 *                    full-reload the SPA.
 *   as="a" + href    renders a plain <a> — for EXTERNAL destinations only.
 *
 * Visual recipe (locked):
 *   text-foreground bg-transparent p-0 outline-none rounded-xs
 *   underline decoration-border underline-offset-2
 *   hover:decoration-muted-foreground focus-visible:decoration-muted-foreground
 *   focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
 *   transition-[color,text-decoration-color] duration-150 ease-out
 *   motion-reduce:transition-none
 *
 * The transition lives on the recipe (2026-09-17): `hover:decoration-*` and
 * every call-site `hover:text-foreground` used to snap, and call sites papered
 * over it one at a time, so the same link eased on one line and cut on the next.
 *
 * Pass `className` for typography overrides (font-mono, text-sm, etc.).
 * The recipe composes cleanly via twMerge; later utilities win.
 * ───────────────────────────────────────────────────────────────────────── */

const TEXT_LINK_BASE =
  "text-foreground bg-transparent p-0 outline-none rounded-xs underline decoration-border underline-offset-2 hover:decoration-muted-foreground focus-visible:decoration-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 transition-[color,text-decoration-color] duration-150 ease-out motion-reduce:transition-none";

type ButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> & {
  as?: "button";
  to?: never;
};

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  as: "a";
  href: string;
  to?: never;
};

type RouterProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> & {
  as?: never;
  /** In-app route. Renders a React Router <Link>. */
  to: string;
};

export type TextLinkProps = ButtonProps | AnchorProps | RouterProps;

export function TextLink(props: TextLinkProps) {
  if (props.to !== undefined) {
    const { to, className, children, ...rest } = props;
    return (
      <Link className={cn(TEXT_LINK_BASE, className)} to={to} {...rest}>
        {children}
      </Link>
    );
  }
  if (props.as === "a") {
    const { as: _as, className, children, ...rest } = props;
    return (
      <a className={cn(TEXT_LINK_BASE, className)} {...rest}>
        {children}
      </a>
    );
  }
  const { as: _as, className, children, ...rest } = props as ButtonProps;
  return (
    <button className={cn(TEXT_LINK_BASE, className)} type="button" {...rest}>
      {children}
    </button>
  );
}
