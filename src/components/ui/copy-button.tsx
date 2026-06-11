import { CircleCheck, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopyFeedback } from "@/hooks/use-copy-feedback";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * CopyButton — shared copy-with-feedback affordance.
 *
 * One primitive owns clipboard write + 2-second success state + toast across
 * every "copy this value" surface in the composed-page artboards (CMP-012 /
 * 013 / 014 / 015 / 016). The state machine is identical regardless of mode:
 *
 *   resting  → click → success (Copy ↔ CircleCheck swap, 2s hold) → resting
 *
 * Two visual modes:
 *   - 'icon'  : ghost icon button used inline next to chips, IDs, URLs.
 *   - 'label' : outline button with leading icon + text — the chrome used
 *               by CodeCardCopyButton at the top-right of code cards.
 *
 * Both modes always fire the same toast: `Copied ${label} to clipboard`.
 * The 2-second hold is intentionally not configurable — consistency is the
 * point. Don't keep parallel `setCopiedKey` / `setTimeout` boilerplate in
 * artboards; consume this primitive instead.
 *
 * Motion: icon modes (icon-sm, inline-xs) use a CSS opacity cross-fade —
 * both Copy and CircleCheck are rendered in a stacked grid slot; the
 * inactive icon sits at opacity-0. `transition-opacity duration-150
 * ease-out motion-reduce:transition-none` drives the swap. Label mode
 * retains a color-only transition because the text label also changes
 * ("Copy" → "Copied!") and the width shift makes a clean cross-fade
 * impractical without layout animation.
 *
 * Modern clipboard API only — no `document.execCommand` fallback. The app
 * targets evergreen browsers.
 * ───────────────────────────────────────────────────────────────────────── */

export type CopyButtonMode = "icon" | "label";

/** Icon-mode size variants — match the existing footprints these replace. */
export type CopyIconSize =
  | "icon-sm" // 32×32 ghost — default; mirrors `<Button size="icon-sm">`.
  | "inline-xs"; // 20×20 neutral-500 ghost — used inline inside running text
//                       next to <code> chips (CMP-016 base URL).

interface CopyButtonBaseProps {
  className?: string;
  /**
   * Toast fragment. The full toast is always
   * `Copied ${label} to clipboard` — don't pre-format.
   * Examples: "model ID", "base URL", "audit proof", "TypeScript snippet".
   */
  label: string;
  /** Text written to the clipboard. */
  value: string;
}

interface CopyButtonIconProps extends CopyButtonBaseProps {
  /**
   * Override for the resting `aria-label`. When omitted, defaults to
   * `Copy ${label}`. Success state always reads "Copied".
   */
  ariaLabel?: string;
  mode?: "icon";
  size?: CopyIconSize;
}

/**
 * Label-mode size variants.
 *   - 'compact' : 24px tall (h-6) — the default; matches the recipe used by
 *                 `CodeCardCopyButton` at the top-right of code cards.
 *   - 'sm'      : 32px tall (h-8) — matches `<Button size="sm">` so a copy
 *                 button can sit alongside other `sm` buttons in modal
 *                 footers (CMP-013 / CMP-014) without optical mismatch.
 */
export type CopyLabelSize = "compact" | "sm";

interface CopyButtonLabelProps extends CopyButtonBaseProps {
  mode: "label";
  size?: CopyLabelSize;
  /**
   * Resting button text. Defaults to "Copy". Success state always reads
   * "Copied!" — that consistency is part of the affordance contract.
   */
  text?: string;
}

export type CopyButtonProps = CopyButtonIconProps | CopyButtonLabelProps;

export function CopyButton(props: CopyButtonProps) {
  const { value, label, className } = props;
  const { copied, trigger } = useCopyFeedback({ value, label });

  // Label mode uses a direct icon swap (text also changes, so cross-fade
  // is impractical). Icon modes use CopyIconSwap for an opacity cross-fade.
  const Icon = copied ? CircleCheck : Copy;

  if (props.mode === "label") {
    const restingText = props.text ?? "Copy";
    const labelSize = props.size ?? "compact";
    // 'compact' keeps the tight h-6 / px-2 / gap-1 recipe used at the top of
    // code cards. 'sm' delegates to <Button size="sm"> so the button matches
    // the height + padding of the default-variant siblings it sits next to
    // in modal footers.
    return (
      <Button
        aria-label={copied ? "Copied" : restingText}
        className={cn(
          labelSize === "compact" &&
            "h-6 gap-1 px-2 font-medium text-neutral-600 hover:text-neutral-900",
          className
        )}
        onClick={trigger}
        size={labelSize === "sm" ? "sm" : "xs"}
        type="button"
        variant="outline"
      >
        <Icon
          aria-hidden="true"
          className={cn(
            "transition-colors duration-150 ease-out motion-reduce:transition-none",
            copied && "text-success-600"
          )}
          data-icon="inline-start"
          strokeWidth={1.8}
        />
        {copied ? "Copied!" : restingText}
      </Button>
    );
  }

  // Icon mode.
  const size = props.size ?? "icon-sm";
  const ariaLabel = copied ? "Copied" : (props.ariaLabel ?? `Copy ${label}`);

  if (size === "inline-xs") {
    // 20×20 inline ghost — preserves the exact recipe used inline next to
    // <code> chips inside running text (CMP-016 base URL) and inside dense
    // table cells (CMP-016 ProvidersTable). The visible icon stays 20×20 so
    // it doesn't bulk up the line-box, but a 24×24 transparent hit target
    // (`before:` pseudo-element) extends the actionable region to satisfy
    // WCAG 2.2 SC 2.5.8 (Target Size Minimum, AA). gap-2 contexts give
    // enough surrounding clearance that the pseudo never overlaps siblings.
    return (
      <button
        aria-label={ariaLabel}
        className={cn(
          'relative inline-flex size-5 items-center justify-center rounded-xs text-neutral-500 transition-colors duration-150 ease-out before:absolute before:inset-[-2px] before:content-[""] hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none',
          copied && "text-success-600 hover:text-success-600",
          className
        )}
        onClick={trigger}
        type="button"
      >
        <CopyIconSwap className="size-3" copied={copied} strokeWidth={1.75} />
      </button>
    );
  }

  // 'icon-sm' — default.
  return (
    <Button
      aria-label={ariaLabel}
      className={cn(
        copied && "text-success-600 hover:text-success-600",
        "transition-colors duration-150 ease-out motion-reduce:transition-none",
        className
      )}
      onClick={trigger}
      size="icon-sm"
      type="button"
      variant="ghost"
    >
      <CopyIconSwap copied={copied} />
    </Button>
  );
}

/* ─── CopyIconSwap ────────────────────────────────────────────────────────
 * Renders Copy and CircleCheck stacked in a CSS grid cell. The active icon
 * is opacity-1; the inactive is opacity-0. A 150ms opacity transition
 * produces the cross-fade. Both icons are always present in the DOM so
 * the container's intrinsic size doesn't change on swap.
 * Used by icon-sm and inline-xs modes of CopyButton.
 * Label mode retains a direct swap because its text label also changes. */
function CopyIconSwap({
  copied,
  className,
  strokeWidth,
}: {
  copied: boolean;
  className?: string;
  strokeWidth?: number;
}) {
  const shared = cn(
    "transition-opacity duration-150 ease-out [grid-area:1/1] motion-reduce:transition-none",
    className
  );
  return (
    <span aria-hidden="true" className="grid">
      <Copy
        className={cn(shared, copied ? "opacity-0" : "opacity-100")}
        strokeWidth={strokeWidth}
      />
      <CircleCheck
        className={cn(shared, copied ? "opacity-100" : "opacity-0")}
        strokeWidth={strokeWidth}
      />
    </span>
  );
}
