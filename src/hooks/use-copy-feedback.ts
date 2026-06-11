import * as React from "react";
import { toast } from "sonner";

/** How long the success state holds before reverting. */
const HOLD_MS = 2000;

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
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      toast(`Copied ${label} to clipboard`);
      timerRef.current = window.setTimeout(() => {
        setCopied(false);
        timerRef.current = null;
      }, HOLD_MS);
    });
  }, [value, label]);

  return { copied, trigger };
}
