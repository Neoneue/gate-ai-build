import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="text-muted-foreground hover:text-foreground"
      onClick={toggle}
      size="icon"
      variant="ghost"
    >
      <span className="relative inline-flex size-4 items-center justify-center">
        <Sun
          aria-hidden
          className={cn(
            "absolute size-4 transition-[opacity,transform,filter] duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none",
            isDark
              ? "scale-[0.25] opacity-0 blur-[1px]"
              : "scale-100 opacity-100 blur-0"
          )}
          strokeWidth={1.75}
        />
        <Moon
          aria-hidden
          className={cn(
            "absolute size-4 transition-[opacity,transform,filter] duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none",
            isDark
              ? "scale-100 opacity-100 blur-0"
              : "scale-[0.25] opacity-0 blur-[1px]"
          )}
          strokeWidth={1.75}
        />
      </span>
    </Button>
  );
}
