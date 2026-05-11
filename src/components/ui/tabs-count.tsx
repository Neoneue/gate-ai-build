import * as React from 'react';

import { cn } from '@/lib/utils';

function TabsCount({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="tabs-count"
      className={cn(
        'inline-flex items-center justify-center min-w-5 h-5 px-2 rounded-xs bg-ink-100 text-ink-500 font-mono text-xs font-medium tabular-nums',
        className,
      )}
      {...props}
    />
  );
}

export { TabsCount };
