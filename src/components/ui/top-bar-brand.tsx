import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { IconCrossFade } from "@/components/ui/icon-cross-fade";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * Top-bar brand chrome — the sidebar collapse toggle and the logo mark.
 *
 * Extracted verbatim from `DashTopBar` (layouts/DashboardChrome.tsx) when Gate
 * Chat needed the same two controls in its own top bar, so the dashboard and
 * the chat draw ONE recipe rather than two copies that can drift:
 *
 *   SidebarToggleButton  ghost `icon` Button, `-ml-2`, desktop only (the rail
 *                        it collapses exists at `lg`+ only), `aria-expanded`,
 *                        "Collapse sidebar" / "Expand sidebar", and the shared
 *                        IconCrossFade over PanelLeftClose / PanelLeftOpen.
 *   LogoMarkLink         the logomark PNG inside the focus-ringed Link to the
 *                        workspace's Overview. Visibility is the caller's: the
 *                        dashboard hides it at `lg`+ because its rail carries
 *                        the brand; Gate Chat's top bar is its only brand, so
 *                        it always shows.
 * ───────────────────────────────────────────────────────────────────────── */

export function SidebarToggleButton({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      aria-expanded={expanded}
      aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
      className="-ml-2 hidden text-muted-foreground hover:text-foreground aria-expanded:bg-transparent aria-expanded:text-muted-foreground hover:aria-expanded:text-muted-foreground lg:inline-flex"
      onClick={onToggle}
      size="icon"
      variant="ghost"
    >
      {/* Contextual icon cross-fade — shared recipe, see IconCrossFade. */}
      <IconCrossFade
        active={!expanded}
        first={<PanelLeftClose aria-hidden strokeWidth={1.75} />}
        second={<PanelLeftOpen aria-hidden strokeWidth={1.75} />}
      />
    </Button>
  );
}

export function LogoMarkLink({
  to,
  className,
}: {
  to: string;
  className?: string;
}) {
  return (
    <Link
      aria-label="Go to overview"
      className={cn(
        "flex items-center justify-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      to={to}
    >
      <img
        alt=""
        aria-hidden
        className="h-8 w-auto"
        height={226}
        src="/gate-ai-logo-mark.png"
        width={195}
      />
    </Link>
  );
}
