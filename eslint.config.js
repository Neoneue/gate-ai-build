import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  // `src/lib/dotmatrix-*` and `src/components/ui/dotm-*` are vendored verbatim
  // from the `@dotmatrix` shadcn registry — third-party code we re-pull, not
  // code we author. Linting it to house rules produced 79 errors that are all
  // vendor style (`react-refresh/only-export-components` on a module that
  // exports both components and helpers), and any fix would be overwritten on
  // the next `shadcn add`. Correctness still runs through `tsc -b`.
  globalIgnores([
    "dist",
    ".claude/**",
    "src/lib/dotmatrix-*",
    "src/components/ui/dotm-*",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
]);
