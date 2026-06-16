import { Check, ChevronsUpDown } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { isFreeSurface } from "@/lib/plan";

/* Workspace switcher — top-bar scope chrome (promoted out of the sidebar on
 * 2026-05-17 so the sidebar reads as pure navigation). Styled for the top
 * bar's compact h-8 chrome (auto-sized to content; no truncation since the
 * top bar has room).
 *
 * The plan badge reflects the current surface: FREE on the billing-free page
 * and the default / free-tier experience pages (routes ending in `-default`
 * or `-free`), PRO everywhere else. Shares `isFreeSurface` with the sidebar
 * lock icons so the badge and the locks never disagree. */

export function WorkspaceSwitcher() {
  const { pathname } = useLocation();
  const plan = isFreeSurface(pathname) ? "Free" : "Pro";
  return (
    <Menu>
      <MenuTrigger
        render={
          <button
            className="inline-flex h-8 items-center gap-2 rounded-sm border border-border bg-card px-2 outline-none transition-[colors,box-shadow,scale] duration-150 ease-out hover:bg-neutral-50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.99] aria-expanded:bg-neutral-50 motion-reduce:transition-none motion-reduce:active:scale-100"
            type="button"
          />
        }
      >
        <span className="font-sans text-neutral-900 text-sm">
          Chad's workspace
        </span>
        <Badge variant={plan === "Pro" ? "info" : "neutral"}>{plan}</Badge>
        <ChevronsUpDown
          aria-hidden
          className="size-4 text-neutral-500"
          strokeWidth={1.75}
        />
      </MenuTrigger>
      <MenuContent
        align="start"
        className="min-w-[var(--anchor-width)] p-2"
        side="bottom"
        sideOffset={8}
      >
        <MenuItem className="bg-neutral-100 data-[highlighted]:bg-neutral-100">
          <span className="min-w-0 flex-1 truncate text-left">
            Chad's workspace
          </span>
          <Check aria-hidden strokeWidth={1.75} />
        </MenuItem>
        <MenuItem>
          <span className="min-w-0 flex-1 truncate text-left">
            OpenClaw org
          </span>
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
