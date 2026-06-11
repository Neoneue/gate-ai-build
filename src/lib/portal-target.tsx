import type { ReactNode, RefObject } from "react";

/**
 * Optional override for where shadcn primitives' Portals mount.
 *
 * - DEFAULT (no provider): portals render into <body>. This is what you
 *   want in a normal web app and matches the shadcn / Radix conventions
 *   your devs already know.
 *
 * - WITH provider: portals render into the supplied element. Useful for
 *   anything that lives inside a transformed, clipped, or sandboxed
 *   container (zoomable canvases, iframes, modals, fullscreen surfaces).
 *
 * shadcn primitives that own a popup (Select, Popover, Tooltip, Dialog,
 * Menu, etc.) read this context and pass `container` to their Portal —
 * with a `null` fallback so production behavior is unchanged.
 */
import { PortalTargetContext } from "@/lib/portal-target-context";

export interface PortalTargetProviderProps {
  children: ReactNode;
  value: RefObject<HTMLElement | null>;
}

export function PortalTargetProvider({
  value,
  children,
}: PortalTargetProviderProps) {
  return (
    <PortalTargetContext.Provider value={value}>
      {children}
    </PortalTargetContext.Provider>
  );
}
