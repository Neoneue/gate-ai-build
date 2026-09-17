import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
    // Pins Date so demo-clock shifts are stable across real days; see the file.
    setupFiles: ["src/test/setup.ts"],
  },
});
