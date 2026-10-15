import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { ThemeProvider } from "@/hooks/use-theme";
import App from "./App.tsx";

// A deploy replaces the hashed page chunks, so a tab opened before it fails
// to load the next lazy page and would go blank until a refresh (seen on
// the Mobile B signup, 2026-10-15). Vite reports that failure here; reload
// once onto the new build (Vite docs, "Load Error Handling"). The session
// flag stops a loop if the chunk is truly broken; a clean load clears it.
const RELOAD_FLAG = "gate-chunk-reload";
window.addEventListener("vite:preloadError", (event) => {
  try {
    if (sessionStorage.getItem(RELOAD_FLAG)) {
      return;
    }
    sessionStorage.setItem(RELOAD_FLAG, "1");
  } catch {
    // Storage blocked: reload anyway; a loop needs a broken chunk too.
  }
  event.preventDefault();
  window.location.reload();
});
window.addEventListener("load", () => {
  try {
    sessionStorage.removeItem(RELOAD_FLAG);
  } catch {
    // Storage blocked: nothing to clear.
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
