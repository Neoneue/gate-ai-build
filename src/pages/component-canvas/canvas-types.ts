import type { ReactNode } from "react";

/* Component canvas data model (owner 2026-10-13, skill
 * agents/front-end-developer/skills/component-canvas).
 *
 * One `CanvasGroup` per component. `files` names the `src/components/ui`
 * file(s) the group renders, which is what `canvas-coverage.test.ts` checks
 * against the folder: every component file is covered by a group or listed
 * in `SKIPPED_FILES` with its reason. Examples compare ONE prop at a time
 * (skill "Variants"); `label` is the prop or state the example shows. */

export interface CanvasExample {
  /** The one prop or state this example shows, e.g. `variant="outline"`. */
  label: string;
  render: () => ReactNode;
}

export interface CanvasGroup {
  /** Equal-width example slots per row; wraps when there are more. */
  columns: 1 | 2 | 3 | 4;
  examples: CanvasExample[];
  /** `src/components/ui` file names this group renders. */
  files: string[];
  /** Slug; the frame's DOM id is `canvas-group-<id>`. */
  id: string;
  /** The component name, shown above the frame. */
  title: string;
}

/** A canvas column: groups stacked top to bottom in normal flow. */
export type CanvasColumn = CanvasGroup[];

export interface SkippedFile {
  file: string;
  reason: string;
}
