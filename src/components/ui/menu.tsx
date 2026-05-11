import * as React from 'react';
import { Menu as MenuPrimitive } from '@base-ui/react/menu';

import { cn } from '@/lib/utils';

function Menu(props: React.ComponentProps<typeof MenuPrimitive.Root>) {
  return <MenuPrimitive.Root {...props} />;
}

function MenuTrigger(props: React.ComponentProps<typeof MenuPrimitive.Trigger>) {
  return <MenuPrimitive.Trigger {...props} />;
}

type MenuContentProps = React.ComponentProps<typeof MenuPrimitive.Popup> & {
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
};

function MenuContent({
  className,
  side = 'bottom',
  align = 'end',
  sideOffset = 4,
  children,
  ...props
}: MenuContentProps) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <MenuPrimitive.Popup
          data-slot="menu-content"
          className={cn(
            'min-w-44 overflow-hidden rounded-sm bg-white text-ink-900 border border-ink-200 shadow-(--shadow-popup) p-1 outline-none origin-[var(--transform-origin)]',
            'duration-150 ease-out data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 motion-reduce:animate-none motion-reduce:duration-0',
            className,
          )}
          {...props}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

function MenuItem({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Item> & {
  variant?: 'default' | 'destructive';
}) {
  return (
    <MenuPrimitive.Item
      data-slot="menu-item"
      data-variant={variant}
      className={cn(
        'relative flex cursor-pointer items-center gap-2 rounded-xs h-8 px-2 text-sm outline-none select-none transition-colors duration-100 ease-out motion-reduce:transition-none',
        variant === 'destructive'
          ? 'text-danger-700 [&_svg]:text-danger-700 data-[highlighted]:bg-danger-50 data-[highlighted]:text-danger-700 focus-visible:bg-danger-50'
          : 'text-ink-900 [&_svg]:text-ink-500 data-[highlighted]:bg-ink-100 focus-visible:bg-ink-100',
        '[&_svg]:size-4 [&_svg]:shrink-0',
        className,
      )}
      {...props}
    />
  );
}

function MenuLabel({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="menu-label"
      className={cn('flex flex-col gap-1 px-2 py-2 min-w-0', className)}
      {...props}
    />
  );
}

function MenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Separator>) {
  return (
    <MenuPrimitive.Separator
      data-slot="menu-separator"
      className={cn('my-1 h-px bg-ink-200', className)}
      {...props}
    />
  );
}

export {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
};
