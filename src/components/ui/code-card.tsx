import type * as React from "react";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * CodeCard family — primitives for CMP-012.
 *
 * Five Paper layouts (A hero, B1 light tabbed, B2 dark terminal, B3
 * request/response, C steps) all paint code in roughly the same visual
 * vocabulary: a card shell, an optional header strip with tabs / title
 * actions, and a monospaced code body with semantically coloured tokens.
 *
 * We ship a compound family (Card-style) rather than a single variant
 * component because the dark terminal flavour has a distinct surface +
 * chrome (traffic lights, no tabs, dark background) that would force
 * heavy variant overrides in a one-component design. Composition wins.
 *
 *   <CodeCard>                       light card shell
 *     <CodeCardHeader>               grey strip with tabs + actions
 *       <CodeCardTabs items active />
 *       <CodeCardCopyButton />
 *     </CodeCardHeader>
 *     <CodeBlock lines={…} />
 *   </CodeCard>
 *
 *   <TerminalCard title="…">         dark surface + traffic lights
 *     <CodeBlock tone="dark" lines={…} />
 *   </TerminalCard>
 *
 * Token model: every span colour is a semantic Tailwind class — no inline
 * hex / oklch literals. The four syntax tones (keyword / variable /
 * property / terminal-blue) live in src/index.css alongside the existing
 * ink / blue / success / warning / danger ramps.
 * ───────────────────────────────────────────────────────────────────────── */

/* ── Token model ─────────────────────────────────────────────────────────── */

export type CodeTone =
  | "default" // neutral-900 light · neutral-100 (faint white) on dark
  | "muted" // neutral-500 light · neutral-400 on dark — comments, slashes, dividers
  | "keyword" // syntax-keyword — curl, -H, -d, export, npm
  | "string" // success-2 — quoted strings
  | "variable" // syntax-variable — $KEY, interpolated values
  | "property" // syntax-property — JSON keys
  | "number" // syntax-terminal-blue — numeric values, status codes
  | "success"; // success — exit codes, "OK"

export interface CodeToken {
  /** Amber highlight (e.g. a matched finding substring). Marked with
   *  `data-code-highlight` so callers can scroll it into view. */
  highlight?: boolean;
  text: string;
  tone?: CodeTone;
}

export type CodeLine = CodeToken[];

const TONE_CLASS_LIGHT: Record<CodeTone, string> = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  keyword: "text-[var(--color-syntax-keyword)]",
  // Brand palette: keys = blue-700 (--color-syntax-property), all literal
  // values = success-700 green (--color-syntax-terminal-blue). One hue per
  // role — keys vs values — using the codebase's own ramp instead of an
  // external palette so the JSON view stays on-brand.
  string: "text-[var(--color-syntax-terminal-blue)]",
  variable: "text-[var(--color-syntax-variable)]",
  property: "text-[var(--color-syntax-property)]",
  number: "text-[var(--color-syntax-terminal-blue)]",
  success: "text-success-700",
};

const TONE_CLASS_DARK: Record<CodeTone, string> = {
  default: "text-neutral-100",
  muted: "text-neutral-400",
  keyword: "text-[var(--color-syntax-variable)]", // dark terminal: keywords render as amber, matches Paper
  string: "text-success-500",
  variable: "text-[var(--color-syntax-variable)]",
  property: "text-[var(--color-syntax-terminal-blue)]",
  number: "text-[var(--color-syntax-terminal-blue)]",
  success: "text-success-500",
};

/* ── Outer card shells ───────────────────────────────────────────────────── */

interface CodeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: "flat" | "raised";
}

export function CodeCard({
  className,
  elevation = "flat",
  ...props
}: CodeCardProps) {
  return (
    <div
      className={cn(
        // flat default uses the everyday material tier (shadow-as-border);
        // raised promotes to the popup elevation token so all floating
        // surfaces (cards, selects, dialogs, tooltips) read as one family.
        "flex flex-col overflow-hidden rounded-md bg-card shadow-(--shadow-border)",
        elevation === "raised" && "shadow-(--shadow-popup)",
        className
      )}
      data-slot="code-card"
      {...props}
    />
  );
}

export function CodeCardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-border border-b bg-neutral-100 px-4 py-2",
        className
      )}
      data-slot="code-card-header"
      {...props}
    />
  );
}

/* ── Tabs strip (visual; behaviour is opt-in via onChange) ───────────────── */

export interface CodeCardTabsProps {
  active: string;
  className?: string;
  items: string[];
  onChange?: (value: string) => void;
}

export function CodeCardTabs({
  items,
  active,
  onChange,
  className,
}: CodeCardTabsProps) {
  const interactive = typeof onChange === "function";
  // We do NOT declare `role="tablist"`/`role="tab"` here. The full WAI-ARIA
  // tab pattern requires arrow-key focus management, Home/End jumps,
  // tabIndex={-1} on inactive tabs, and `role="tabpanel"` + aria-controls
  // wiring on the content. Half-implementing the pattern is worse than not
  // claiming it — screen readers announce these as plain buttons (which is
  // honest), and `aria-pressed` carries the active state.
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {items.map((item) => {
        const isActive = item === active;
        const sharedClass = cn(
          // Skill: emil-design-eng — explicit `transition-colors duration-150
          // ease-out`; the active pill uses `shadow-xs` to match the segmented
          // family's lift instead of inlining its own rgba shadow.
          "inline-flex h-6 items-center rounded-xs px-3 font-sans text-sm transition-colors duration-150 ease-out",
          isActive
            ? "border border-border bg-card font-medium text-foreground shadow-xs"
            : "border border-transparent font-medium text-muted-foreground",
          interactive && !isActive && "hover:bg-white/60 hover:text-foreground"
        );
        if (interactive) {
          return (
            <button
              aria-pressed={isActive}
              className={sharedClass}
              key={item}
              onClick={() => onChange?.(item)}
              type="button"
            >
              {item}
            </button>
          );
        }
        return (
          <span className={sharedClass} key={item}>
            {item}
          </span>
        );
      })}
    </div>
  );
}

/* ── Copy button — thin wrapper around the shared CopyButton primitive ──── */

/**
 * Code-card-flavoured copy button. Now a thin shim over `<CopyButton
 * mode="label">` — the export name is preserved so existing call sites
 * (CMP-008c, CMP-016) keep working without churn, but every use picks up
 * the unified copy/feedback/toast behaviour from `copy-button.tsx`.
 */
export function CodeCardCopyButton({
  value,
  label,
  className,
}: {
  /** Text written to the clipboard. */
  value: string;
  /** Toast fragment. Full toast: `Copied ${label} to clipboard`. */
  label: string;
  className?: string;
}) {
  return (
    <CopyButton
      className={className}
      label={label}
      mode="label"
      value={value}
    />
  );
}

/** Flatten a `CodeLine[]` to a plain string for clipboard writes. */

/* ── Code body ───────────────────────────────────────────────────────────── */

interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Compact inline snippet — used inside the steps card. */
  density?: "default" | "compact" | "inline";
  /** When set, highlighted tokens become a hover Tooltip with this content
   *  (e.g. a finding's detector / score / threshold). */
  highlightTooltip?: React.ReactNode;
  lines: CodeLine[];
  tone?: "light" | "dark";
  /** Wrap long lines instead of scrolling horizontally (e.g. a JSON body
   *  with a long string value). Lines grow to fit; indentation is preserved. */
  wrap?: boolean;
}

export function CodeBlock({
  lines,
  tone = "light",
  density = "default",
  wrap = false,
  className,
  highlightTooltip,
  ...props
}: CodeBlockProps) {
  const toneMap = tone === "dark" ? TONE_CLASS_DARK : TONE_CLASS_LIGHT;
  const density_cls =
    density === "inline"
      ? "px-4 py-3"
      : density === "compact"
        ? "px-4 py-3"
        : "px-4 py-4";
  const text_cls = density === "inline" ? "text-xs/4" : "text-xs/5";
  return (
    <div
      className={cn(
        "flex flex-col font-mono",
        wrap
          ? "whitespace-pre-wrap break-words"
          : "overflow-x-auto whitespace-pre",
        text_cls,
        density_cls,
        className
      )}
      data-slot="code-block"
      {...props}
    >
      {lines.map((line, idx) => (
        <div
          className={wrap ? "min-h-5" : "flex h-5 min-h-5 shrink-0"}
          key={idx}
        >
          {line.length === 0 ? (
            // Blank line spacer — keep the line height
            <span aria-hidden="true">&nbsp;</span>
          ) : (
            line.map((tok, j) =>
              tok.highlight && highlightTooltip ? (
                <Tooltip key={j}>
                  <TooltipTrigger
                    render={(p) => (
                      <span
                        {...p}
                        className={cn(
                          toneMap[tok.tone ?? "default"],
                          "cursor-help rounded-xs bg-warning-100 text-warning-800"
                        )}
                        data-code-highlight=""
                      >
                        {tok.text}
                      </span>
                    )}
                  />
                  <TooltipContent className="p-2 text-left">
                    {highlightTooltip}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span
                  className={cn(
                    toneMap[tok.tone ?? "default"],
                    tok.highlight &&
                      "rounded-xs bg-warning-100 text-warning-800"
                  )}
                  data-code-highlight={tok.highlight ? "" : undefined}
                  key={j}
                >
                  {tok.text}
                </span>
              )
            )
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Terminal card (B2) — dark sibling of CodeCard ───────────────────────── */

export function TerminalCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-md bg-neutral-800",
        className
      )}
      data-slot="terminal-card"
    >
      <div className="flex items-center gap-2 border-neutral-900/60 border-b bg-neutral-700 px-4 py-2">
        {/* macOS traffic-light affordances live in their own token family
            (--color-traffic-red/amber/green) so we don't reuse the semantic
            danger/warning/success ramps for chrome decoration. */}
        <div aria-hidden="true" className="flex gap-1">
          <span className="size-2 rounded-full bg-traffic-red" />
          <span className="size-2 rounded-full bg-traffic-amber" />
          <span className="size-2 rounded-full bg-traffic-green" />
        </div>
        <span className="ml-auto font-mono text-neutral-400 text-xs/4">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}
