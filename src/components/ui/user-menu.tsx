import { UserRound } from "lucide-react";
import type * as React from "react";

import { LogoutIcon } from "@/components/ui/logout";

import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";

type UserMenuProps = {
  children: React.ReactElement;
  onNavigate?: (pageId: string) => void;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

function UserMenu({
  children,
  onNavigate,
  side = "bottom",
  align = "end",
  sideOffset = 8,
}: UserMenuProps) {
  return (
    <Menu>
      <MenuTrigger render={children} />
      <MenuContent
        align={align}
        className="w-54"
        side={side}
        sideOffset={sideOffset}
      >
        <MenuLabel className="flex-row items-center gap-2 py-3">
          <span
            aria-hidden
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-700 font-medium font-mono text-white text-xs"
          >
            CP
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate font-medium font-sans text-neutral-900 text-sm leading-tight">
              Chad Ponticas
            </span>
            <span
              className="truncate font-sans text-neutral-500 text-xs leading-tight"
              title="chad@constellationnetwork.io"
            >
              chad@constellationnetwork.io
            </span>
          </div>
        </MenuLabel>
        <MenuSeparator />
        <MenuItem onClick={() => onNavigate?.("/settings")}>
          <UserRound aria-hidden strokeWidth={1.75} />
          Settings
        </MenuItem>
        <MenuSeparator />
        <MenuItem variant="destructive">
          <LogoutIcon aria-hidden size={16} strokeWidth={1.75} />
          Sign out
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

export { UserMenu };
