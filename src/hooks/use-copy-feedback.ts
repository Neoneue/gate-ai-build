import * as React from "react";
import { toast } from "sonner";

/** How long the success state holds before reverting. */
const HOLD_MS = 2000;

/**
 * Custom hook — owns the click→success→revert state machine and the toast
 * call. Exposed as a hook (rather than only via the component) so the rare
 * caller that needs to wire its own button chrome can still get the
 * canonical behaviour without re-implementing the timer.
 *
 * `holdMs` and `notify` exist for consumers whose confirmation is INLINE
 * rather than a toast — the Ask AI reply feedback row (Figma `1125:6235`)
 * shows "Copied!" next to the glyph and holds it for 3s alongside a rating
 * confirmation on the same clock. They default to the canonical 2s + toast,
 * so every existing caller is unchanged. Duplicating this state machine in
 * the consumer would have been the alternative; parameterising keeps one
 * clipboard/timer/error path for the whole app.
 */
export function useCopyFeedback({
  value,
  label,
  holdMs = HOLD_MS,
  notify = true,
}: {
  value: string;
  label: string;
  /** How long `copied` stays true. Defaults to the canonical 2000ms. */
  holdMs?: number;
  /** Fire the success toast. Set false when the consumer confirms inline. */
  notify?: boolean;
}) {
  const [copied, setCopied] = React.useState(false);
  const timerRef = React.useRef<number | null>(null);

  React.useEffect(
    () => () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    },
    []
  );

  const trigger = React.useCallback(() => {
    // Ignore re-clicks during the 2s success hold so spam-clicking can't
    // flood the clipboard / fire a stack of toasts. A live `timerRef` means
    // we're still inside the hold window.
    if (timerRef.current !== null) {
      return;
    }
    void navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true);
        if (notify) {
          toast(`Copied ${label} to clipboard`);
        }
        timerRef.current = window.setTimeout(() => {
          setCopied(false);
          timerRef.current = null;
        }, holdMs);
      })
      .catch(() => {
        // Permission denied or no clipboard (non-secure context): tell the
        // user instead of silently doing nothing.
        // The FAILURE toast is not opt-out: an inline consumer's confirmation
        // never appears, so with no toast the click would look like a no-op.
        toast.error(`Couldn't copy ${label} — clipboard unavailable`);
      });
  }, [value, label, holdMs, notify]);

  return { copied, trigger };
}
