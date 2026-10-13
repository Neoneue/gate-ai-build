import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import { ThemeProvider } from "@/hooks/use-theme";
import { ComponentCanvas } from "@/pages/component-canvas/ComponentCanvas";

/* Entry for the root `component-canvas.html` (dev server only; `vite build`
 * takes index.html alone, so this page never ships). Same provider root as
 * `src/main.tsx`: the real ThemeProvider, so the canvas theme toggle and
 * every portal flip with the `.dark` class on <html>. */

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ThemeProvider>
        <ComponentCanvas />
      </ThemeProvider>
    </StrictMode>
  );
}
