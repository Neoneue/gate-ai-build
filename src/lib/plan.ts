/** A surface is on the FREE / default experience when its route ends in
 * `-default` or `-free`; everything else is the PRO surface. Single source of
 * truth for the workspace plan badge and the sidebar PRO-feature lock icons —
 * if the badge says PRO, the locks are hidden, and vice versa. */
export const FREE_SURFACE = /-(default|free)$/;

export const isFreeSurface = (pathname: string): boolean =>
  FREE_SURFACE.test(pathname);
