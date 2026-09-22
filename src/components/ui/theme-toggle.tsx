import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconCrossFade } from "@/components/ui/icon-cross-fade";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
 * ThemeToggle — top-bar sun/moon switch. Binary light/dark.
 *
 * Same chrome + icon cross-fade as the sidebar toggle in DashboardChrome:
 * both icons stay mounted, absolute-positioned, and swap via scale/opacity/
 * blur so the change reads as a dissolve, not a pop. Colours route through
 * `text-muted-foreground` / `hover:text-foreground` so hover brightens in
 * both themes (a raw neutral hover would darken in dark mode).
 * ───────────────────────────────────────────────────────────────────────── */

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn("text-muted-foreground hover:text-foreground", className)}
      onClick={toggle}
      size="icon"
      variant="ghost"
    >
      <IconCrossFade
        active={isDark}
        first={<Sun aria-hidden strokeWidth={1.75} />}
        second={<Moon aria-hidden strokeWidth={1.75} />}
      />
    </Button>
  );
}
