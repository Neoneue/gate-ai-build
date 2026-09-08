import { createContext, type RefObject, useContext } from "react";

/** See portal-target.tsx for the full contract. */
const PortalTargetContext = createContext<RefObject<HTMLElement | null> | null>(
  null
);

/**
 * Returns the current portal target ref, or `null` if no provider is in
 * scope (in which case Portals should default to <body>).
 */
export function usePortalTarget(): RefObject<HTMLElement | null> | null {
  return useContext(PortalTargetContext);
}
