import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * Checkbox — Base UI checkbox with the house control recipe.
 *
 * DISABLED IS `data-disabled:`, NOT `disabled:` (fixed 2026-08-25). Base UI
 * renders the Root as a `<span role="checkbox">` carrying `data-disabled` +
 * `aria-disabled` — never a native `<button disabled>` — so the `:disabled`
 * pseudo-class has nothing to match and `disabled:opacity-50` was a silent
 * no-op: a disabled checkbox blocked clicks but painted at full opacity.
 * Caught on My Notifications, where turning a delivery channel's master
 * switch off disables that whole checkbox column and nothing looked
 * different. `data-disabled:cursor-not-allowed data-disabled:opacity-50` is
 * the same recipe Switch, Menu, and Select already use for exactly this
 * reason — one dimmed-control treatment across every Base UI control.
 *
 * `RadioGroupItem` still carries the pseudo-class form and has the same
 * latent no-op; it is left alone here because nothing disables a radio yet.
 * ───────────────────────────────────────────────────────────────────────── */

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input outline-none transition-colors after:absolute after:-inset-x-3 after:-inset-y-2 hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 group-has-disabled/field:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary data-disabled:cursor-not-allowed data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground data-disabled:opacity-50 dark:bg-input/30 dark:data-checked:bg-primary dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      data-slot="checkbox"
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
        data-slot="checkbox-indicator"
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
