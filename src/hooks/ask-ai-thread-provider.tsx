import type { ReactNode } from "react";
import {
  AskAiThreadContext,
  useAskAiThreadState,
} from "@/hooks/use-ask-ai-thread";

/**
 * Mount ABOVE the router outlet so the Ask AI thread survives navigation,
 * the same way `askAiOpen` does. Split from the hook module so the fast-refresh
 * boundary stays clean (a file may export components OR hooks, not both).
 */
export function AskAiThreadProvider({ children }: { children: ReactNode }) {
  const value = useAskAiThreadState();
  return (
    <AskAiThreadContext.Provider value={value}>
      {children}
    </AskAiThreadContext.Provider>
  );
}
