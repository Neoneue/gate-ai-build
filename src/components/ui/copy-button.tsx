import * as React from 'react';
import { CircleCheck, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
 * Motion: the icon swap is a direct render swap (no animated cross-fade) so
 * the transition is instant on click. Only the icon's `color` transitions
 * (default ink → success-600) — explicit `transition-colors`, not
 * `transition-all`, with `motion-reduce:transition-none`.
 *
 * Modern clipboard API only — no `document.execCommand` fallback. The app
 * targets evergreen browsers.
 * ───────────────────────────────────────────────────────────────────────── */

const HOLD_MS = 2000;

export type CopyButtonMode = 'icon' | 'label';

/** Icon-mode size variants — match the existing footprints these replace. */
export type CopyIconSize =
  | 'icon-sm'    // 32×32 ghost — default; mirrors `<Button size="icon-sm">`.
  | 'inline-xs'; // 20×20 ink-500 ghost — used inline inside running text
                 //                       next to <code> chips (CMP-016 base URL).

interface CopyButtonBaseProps {
  /** Text written to the clipboard. */
  value: string;
  /**
   * Toast fragment. The full toast is always
   * `Copied ${label} to clipboard` — don't pre-format.
   * Examples: "model ID", "base URL", "audit proof", "TypeScript snippet".
   */
  label: string;
  className?: string;
}

interface CopyButtonIconProps extends CopyButtonBaseProps {
  mode?: 'icon';
  /**
   * Override for the resting `aria-label`. When omitted, defaults to
   * `Copy ${label}`. Success state always reads "Copied".
   */
  ariaLabel?: string;
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
export type CopyLabelSize = 'compact' | 'sm';

interface CopyButtonLabelProps extends CopyButtonBaseProps {
  mode: 'label';
  /**
   * Resting button text. Defaults to "Copy". Success state always reads
   * "Copied!" — that consistency is part of the affordance contract.
   */
  text?: string;
  size?: CopyLabelSize;
}

export type CopyButtonProps = CopyButtonIconProps | CopyButtonLabelProps;

/**
 * Custom hook — owns the click→success→revert state machine and the toast
 * call. Exposed as a hook (rather than only via the component) so the rare
 * caller that needs to wire its own button chrome can still get the
 * canonical behaviour without re-implementing the timer.
 */
export function useCopyFeedback({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const timerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const trigger = React.useCallback(() => {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      toast(`Copied ${label} to clipboard`);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setCopied(false);
        timerRef.current = null;
      }, HOLD_MS);
    });
  }, [value, label]);

  return { copied, trigger };
}

export function CopyButton(props: CopyButtonProps) {
  const { value, label, className } = props;
  const { copied, trigger } = useCopyFeedback({ value, label });

  // Icon swap is a direct render swap — no cross-fade. The colour transition
  // on the resting Copy icon (ink-500 → ink-900 on hover) handles the only
  // moving piece.
  const Icon = copied ? CircleCheck : Copy;

  if (props.mode === 'label') {
    const restingText = props.text ?? 'Copy';
    const labelSize = props.size ?? 'compact';
    // 'compact' keeps the tight h-6 / px-2 / gap-1 recipe used at the top of
    // code cards. 'sm' delegates to <Button size="sm"> so the button matches
    // the height + padding of the default-variant siblings it sits next to
    // in modal footers.
    return (
      <Button
        type="button"
        variant="outline"
        size={labelSize === 'sm' ? 'sm' : 'xs'}
        onClick={trigger}
        aria-label={copied ? 'Copied' : restingText}
        className={cn(
          labelSize === 'compact' &&
            'h-6 gap-1 px-2 font-medium text-ink-600 hover:text-ink-900',
          className,
        )}
      >
        <Icon
          data-icon="inline-start"
          strokeWidth={1.8}
          aria-hidden="true"
          className={cn(
            'transition-colors duration-150 ease-out motion-reduce:transition-none',
            copied && 'text-success-600',
          )}
        />
        {copied ? 'Copied!' : restingText}
      </Button>
    );
  }

  // Icon mode.
  const size = props.size ?? 'icon-sm';
  const ariaLabel = copied ? 'Copied' : (props.ariaLabel ?? `Copy ${label}`);

  if (size === 'inline-xs') {
    // 20×20 inline ghost — preserves the exact recipe used inline next to
    // <code> chips inside running text (CMP-016 base URL) and inside dense
    // table cells (CMP-016 ProvidersTable). The visible icon stays 20×20 so
    // it doesn't bulk up the line-box, but a 24×24 transparent hit target
    // (`before:` pseudo-element) extends the actionable region to satisfy
    // WCAG 2.2 SC 2.5.8 (Target Size Minimum, AA). gap-2 contexts give
    // enough surrounding clearance that the pseudo never overlaps siblings.
    return (
      <button
        type="button"
        onClick={trigger}
        aria-label={ariaLabel}
        className={cn(
          'relative inline-flex items-center justify-center size-5 rounded-xs text-ink-500 hover:text-ink-900 transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 before:absolute before:inset-[-2px] before:content-[""]',
          copied && 'text-success-600 hover:text-success-600',
          className,
        )}
      >
        <Icon className="size-3" strokeWidth={1.75} aria-hidden="true" />
      </button>
    );
  }

  // 'icon-sm' — default.
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={trigger}
      aria-label={ariaLabel}
      className={cn(
        copied && 'text-success-600 hover:text-success-600',
        'transition-colors duration-150 ease-out motion-reduce:transition-none',
        className,
      )}
    >
      <Icon aria-hidden="true" />
    </Button>
  );
}
