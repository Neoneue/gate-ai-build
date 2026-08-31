import { Check, ChevronsUpDown } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import {
  isDefaultSurface,
  isEnterpriseSurface,
  isFreeSurface,
  toDefaultPath,
  toEnterprisePath,
  toFreePath,
  toProPath,
} from "@/lib/plan";

/* Workspace switcher — top-bar scope chrome. The trigger shows the workspace
 * name + current-tier badge. The dropdown lists all four tiers, each with
 * its own badge, so switching is a single click. */

export function WorkspaceSwitcher({
  className,
  compactBadge = false,
}: {
  className?: string;
  /** The tight-band rail topSlot is narrower than the top bar — abbreviate
   *  the long Enterprise badge there so the workspace name keeps its room.
   *  Mobile/tablet Sheet and top-bar mounts show the full badge; menu items
   *  always carry the full tier name. */
  compactBadge?: boolean;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isDefault = isDefaultSurface(pathname);
  const isFree = isFreeSurface(pathname);
  const isEnterprise = isEnterpriseSurface(pathname);
  const isPro = !(isDefault || isFree || isEnterprise);

  const plan = isEnterprise
    ? "Enterprise"
    : isPro
      ? "Pro"
      : isDefault
        ? "Default"
        : "Free";
  const badgeLabel = compactBadge && isEnterprise ? "ENT." : plan;
  const badgeVariant = isEnterprise || isPro ? "info" : "success";

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button className={className} size="default" variant="outline" />
        }
      >
        <span className="type-label-14 text-foreground">Chad's workspace</span>
        <Badge variant={badgeVariant}>{badgeLabel}</Badge>
        <ChevronsUpDown
          aria-hidden
          className="ml-auto size-4 text-muted-foreground"
          data-icon="inline-end"
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
          active={isEnterprise}
          onClick={() => navigate(toEnterprisePath(pathname))}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate">Chad's workspace</span>
            <Badge variant="info">Enterprise</Badge>
          </span>
          {isEnterprise ? (
            <Check aria-hidden className="text-primary" strokeWidth={1.75} />
          ) : null}
        </MenuItem>
        <MenuItem active={isPro} onClick={() => navigate(toProPath(pathname))}>
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate">Chad's workspace</span>
            <Badge variant="info">Pro</Badge>
          </span>
          {isPro ? (
            <Check aria-hidden className="text-primary" strokeWidth={1.75} />
          ) : null}
        </MenuItem>
        <MenuItem
          active={isDefault}
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
          active={isFree}
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
