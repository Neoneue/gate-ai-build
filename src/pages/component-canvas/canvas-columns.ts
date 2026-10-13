import type {
  CanvasColumn,
  SkippedFile,
} from "@/pages/component-canvas/canvas-types";
import { ACTION_GROUPS } from "@/pages/component-canvas/groups-actions";
import { ASK_AI_GROUPS } from "@/pages/component-canvas/groups-ask-ai";
import { CHART_GROUPS } from "@/pages/component-canvas/groups-charts";
import { CODE_GROUPS } from "@/pages/component-canvas/groups-code";
import { DATA_GROUPS } from "@/pages/component-canvas/groups-data";
import { FORM_GROUPS } from "@/pages/component-canvas/groups-forms";
import { MOTION_GROUPS } from "@/pages/component-canvas/groups-motion";
import { NAVIGATION_GROUPS } from "@/pages/component-canvas/groups-navigation";
import { OVERLAY_GROUPS } from "@/pages/component-canvas/groups-overlays";
import { SELECTION_GROUPS } from "@/pages/component-canvas/groups-selection";
import { SURFACE_GROUPS } from "@/pages/component-canvas/groups-surfaces";
import { TYPOGRAPHY_GROUPS } from "@/pages/component-canvas/groups-typography";

/* The board's columns, left to right, by job. Each column stacks its groups
 * in normal flow. Nine columns of 4,000 to 6,000px (measured 2026-10-13)
 * give the board roughly the screen's aspect, so fit-all lands near 12%
 * instead of 9% on a 1440 x 900 window. */
export const CANVAS_COLUMNS: CanvasColumn[] = [
  [...ACTION_GROUPS, ...TYPOGRAPHY_GROUPS],
  FORM_GROUPS,
  SELECTION_GROUPS,
  [...OVERLAY_GROUPS, ...NAVIGATION_GROUPS],
  DATA_GROUPS,
  SURFACE_GROUPS,
  [...CHART_GROUPS, ...CODE_GROUPS],
  ASK_AI_GROUPS,
  MOTION_GROUPS,
];

/* Files in `src/components/ui` that are not components, so they get no
 * group. `canvas-coverage.test.ts` fails when a file is in neither list. */
export const SKIPPED_FILES: SkippedFile[] = [
  {
    file: "chart-geometry.ts",
    reason:
      "helpers and constants for chart sizing; rendered through Chart and the axis ticks",
  },
  {
    file: "monogram-types.ts",
    reason: "types, the tone class table and initialsOf(); Monogram renders it",
  },
  {
    file: "select-variants.ts",
    reason: "the trigger cva table; Select, Combobox and MultiSelect render it",
  },
  {
    file: "toggle-variants.ts",
    reason: "the toggle cva table; ToggleGroup renders it",
  },
  {
    file: "table-pagination.ts",
    reason: "rows-per-page helpers; TablePaginationFooter renders their output",
  },
  {
    file: "table-pagination.test.ts",
    reason: "a test file",
  },
  {
    file: "table-pagination-footer.test.tsx",
    reason: "a test file",
  },
];
