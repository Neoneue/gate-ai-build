import * as React from 'react';
import { LogOut, Sparkles, UserRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu';

type UserMenuProps = {
  children: React.ReactElement;
  onNavigate?: (pageId: string) => void;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
};

function UserMenu({
  children,
  onNavigate,
  side = 'bottom',
  align = 'end',
  sideOffset = 8,
}: UserMenuProps) {
  return (
    <Menu>
      <MenuTrigger render={children} />
      <MenuContent side={side} align={align} sideOffset={sideOffset} className="min-w-50">
        <MenuLabel className="flex-row items-center gap-3">
          <span
            className="size-7 shrink-0 inline-flex items-center justify-center rounded-full bg-blue-700 text-white font-mono text-xs font-medium"
            aria-hidden
          >
            CP
          </span>
          <div className="flex flex-col gap-1 min-w-0">
            <span className="font-sans text-sm font-medium text-ink-900 truncate leading-tight">
              Chad Ponticas
            </span>
            <Badge variant="info" className="self-start">Free plan</Badge>
          </div>
        </MenuLabel>
        <MenuSeparator />
        <MenuItem>
          <Sparkles strokeWidth={1.75} aria-hidden />
          Upgrade to Pro
        </MenuItem>
        <MenuItem onClick={() => onNavigate?.('cmp-018')}>
          <UserRound strokeWidth={1.75} aria-hidden />
          Account
        </MenuItem>
        <MenuSeparator />
        <MenuItem variant="destructive">
          <LogOut strokeWidth={1.75} aria-hidden />
          Sign out
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

export { UserMenu };
