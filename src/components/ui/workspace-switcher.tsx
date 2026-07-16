import { Check, ChevronsUpDown } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import {
  isDefaultSurface,
  isFreeSurface,
  toDefaultPath,
  toFreePath,
  toProPath,
} from "@/lib/plan";
import { cn } from "@/lib/utils";

/* Workspace switcher — top-bar scope chrome. The trigger shows the workspace
 * name + current-tier badge. The dropdown lists all three tiers, each with
 * its own badge, so switching is a single click. */

const ACTIVE_ITEM = "bg-accent data-[highlighted]:bg-accent";

export function WorkspaceSwitcher({ className }: { className?: string }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isDefault = isDefaultSurface(pathname);
  const isFree = isFreeSurface(pathname);
  const isPro = !(isDefault || isFree);

  const plan = isPro ? "Pro" : isDefault ? "Default" : "Free";
  const badgeVariant = isPro ? "info" : "success";

  return (
    <Menu>
      <MenuTrigger
        render={
          <button
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-sm border border-border bg-card pr-2 pl-3 outline-none transition-[colors,box-shadow,scale] duration-150 ease-out hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] aria-expanded:bg-accent motion-reduce:transition-none motion-reduce:active:scale-100",
              className
            )}
            type="button"
          />
        }
      >
        <span className="type-copy-14 text-foreground">Chad's workspace</span>
        <Badge variant={badgeVariant}>{plan}</Badge>
        <ChevronsUpDown
          aria-hidden
          className="ml-auto size-4 text-muted-foreground"
          strokeWidth={1.75}
        />
      </MenuTrigger>
      <MenuContent
        align="start"
        className="min-w-[var(--anchor-width)] p-2"
        side="bottom"
        sideOffset={8}
      >
        <MenuItem
          className={isPro ? ACTIVE_ITEM : undefined}
          onClick={() => navigate(toProPath(pathname))}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate">Chad's workspace</span>
            <Badge variant="info">Pro</Badge>
          </span>
          {isPro ? (
            <Check aria-hidden className="text-primary" strokeWidth={1.75} />
          ) : null}
        </MenuItem>
        <MenuItem
          className={isDefault ? ACTIVE_ITEM : undefined}
          onClick={() => navigate(toDefaultPath(pathname))}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate">Chad's workspace</span>
            <Badge variant="success">Default</Badge>
          </span>
          {isDefault ? (
            <Check aria-hidden className="text-primary" strokeWidth={1.75} />
          ) : null}
        </MenuItem>
        <MenuItem
          className={isFree ? ACTIVE_ITEM : undefined}
          onClick={() => navigate(toFreePath(pathname))}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate">Chad's workspace</span>
            <Badge variant="success">Free</Badge>
          </span>
          {isFree ? (
            <Check aria-hidden className="text-primary" strokeWidth={1.75} />
          ) : null}
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
