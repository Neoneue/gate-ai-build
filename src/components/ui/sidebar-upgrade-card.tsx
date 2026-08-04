import { SparklesIcon } from "@/components/ui/sparkles";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * SidebarUpgradeCard — the "Upgrade to Pro plan" promo pinned beneath the
 * nav in the expanded rail (and in the mobile nav Sheet, which shares the
 * same <SidebarPanel>).
 *
 * Transcribed 1:1 from the Figma twins `sidebar-footer-light` (1255:6256)
 * and `sidebar-footer-dark` (1256:6340). Every value below traces to a node
 * property on one of those two frames:
 *
 *   card      8px radius · 12px padding · vertical, content-hugging, cross-
 *             axis start · `bg-card` (white / #171717 = neutral-900, both
 *             already the --card value) · 1px inside border on
 *             --promo-border · Tailwind `shadow-sm` geometry tinted
 *             --promo-shadow · clips content
 *   texture   a full-bleed child sized to the card (219x69 in the 220x70
 *             light twin, 248x69 in the 248x70 dark one) carrying the dot
 *             pattern + wash — see `.sidebar-upgrade-texture` in index.css
 *   copy      12/16 Geist Medium title over a 4px gap and a 10/14 Geist
 *             Regular line. The copy is NOT on the promo ink: title is
 *             --foreground, description --muted-foreground (2026-08-04). The
 *             blue chrome is the card's — border, texture, sparkle — and the
 *             words read as the app's own voice on top of it, which is also
 *             what keeps the small 10px line legible on both themes without
 *             an opacity knock-back.
 *   sparkle   24px lucide `sparkles` at 50% opacity, 8px in from the top
 *             right, on --promo-accent
 *
 * The card is width-flexible by design, not fixed: the two Figma twins draw
 * it at 220 and 248 wide inside 236 / 264 rails, i.e. it fills whatever
 * content width its container has. Height follows content (70px at the
 * design's two-line description) — nothing here is pinned to a pixel height.
 *
 * The one thing NOT in the Figma frames is what happens on interaction.
 * Rest state is exactly the design; hover, press and focus come from the
 * house conventions rather than being invented: the shared <SparklesIcon>
 * already animates on hover of its closest button ancestor (the same
 * retrofit every other lucide-animated icon in the app uses), press is the
 * global `active:scale-[0.98]`, and focus is the standard 3px ring.
 * ───────────────────────────────────────────────────────────────────────── */

export interface SidebarUpgradeCardProps {
  /** Layout-only escape hatch for the consumer (width / margin). */
  className?: string;
  /** Fired on click. Wire this to the tier's billing route. */
  onClick?: () => void;
}

export function SidebarUpgradeCard({
  className,
  onClick,
}: SidebarUpgradeCardProps) {
  return (
    <button
      className={cn(
        "shadow-(color:--promo-shadow) relative flex w-full flex-col items-start justify-center overflow-hidden rounded-md border border-promo-border bg-card p-3 text-left shadow-sm transition-transform duration-150 ease-out focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
        className
      )}
      onClick={onClick}
      type="button"
    >
      {/* Decorative dot field + wash. Full-bleed under the copy; the card's
          own `overflow-hidden` is what rounds its corners. */}
      <span
        aria-hidden
        className="sidebar-upgrade-texture pointer-events-none absolute inset-0"
      />
      {/* `user-meta` in Figma: a full-width column. Figma draws 2px between
          the two lines; this is `gap-1` (4px), the nearest step on the grid —
          the half-step carve-out that once justified 2px was reverted
          2026-08-04, so `gap-0.5` is off-token again. */}
      <span className="relative flex w-full flex-col items-start gap-1">
        <span className="type-label-12 whitespace-nowrap text-foreground">
          Upgrade to Pro plan
        </span>
        <span className="type-copy-10 text-pretty text-muted-foreground">
          Unlock premium security and compression settings for your team
        </span>
      </span>
      <SparklesIcon
        aria-hidden
        className="pointer-events-none absolute top-2 right-2 text-promo-accent opacity-50"
        size={24}
      />
    </button>
  );
}
