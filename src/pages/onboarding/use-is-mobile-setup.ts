import { useEffect, useState } from "react";

/** The mockup's phone test (`Ave`): a narrow window, or a short touch one. */
const MOBILE_QUERY =
  "(max-width: 767px), (pointer: coarse) and (max-height: 599px)";

export function useIsMobileSetup(): boolean {
  const [mobile, setMobile] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = (event: MediaQueryListEvent) => setMobile(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return mobile;
}
