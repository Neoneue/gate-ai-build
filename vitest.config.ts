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
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "html"],
      reportsDirectory: "coverage",
      // The pure layer: mock data, derivations, formatters. Pages and
      // primitives are exercised by the route smoke and Playwright tiers,
      // where line coverage is not the useful signal.
      include: [
        "src/data/**",
        "src/lib/**",
        "src/hooks/**",
        "src/layouts/nav-sections.ts",
        "src/pages/**/*-data.ts",
        "src/pages/**/data.ts",
        "src/pages/token-savings-summary.ts",
      ],
      exclude: [
        "src/data/request-bodies.ts",
        "src/data/models-catalog.ts",
        "src/**/*.test.*",
      ],
      // Floor sits a few points under the 2026-09-20 baseline (lines 62.5,
      // statements 63.4, branches 48, functions 68.5) so a regression fails
      // CI without making every refactor fight the number.
      thresholds: { lines: 58, statements: 58, branches: 44, functions: 63 },
    },
  },
});
