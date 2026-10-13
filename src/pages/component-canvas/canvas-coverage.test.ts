import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { ButtonVariant } from "@/components/ui/button";
import {
  CANVAS_COLUMNS,
  SKIPPED_FILES,
} from "@/pages/component-canvas/canvas-columns";
import { BUTTON_VARIANTS } from "@/pages/component-canvas/groups-actions";

/* Coverage for the component canvas (skill "Variants": keep a variant list
 * and coverage tests). Every file in src/components/ui is shown by a group
 * or skipped with a reason, so a new primitive cannot land without the
 * canvas showing it. */

const UI_DIR = path.resolve(import.meta.dirname, "../../components/ui");
const UI_FILES = readdirSync(UI_DIR).filter((file) => /\.tsx?$/.test(file));
const GROUPS = CANVAS_COLUMNS.flat();

/* Type-level: tsc fails here when button.tsx gains a variant the canvas
 * does not list. */
type MissingButtonVariant = Exclude<
  ButtonVariant,
  (typeof BUTTON_VARIANTS)[number]
>;
const everyButtonVariantShown: [MissingButtonVariant] extends [never]
  ? true
  : false = true;

describe("component canvas coverage", () => {
  it("shows or skips every file in src/components/ui", () => {
    const covered = new Set(GROUPS.flatMap((group) => group.files));
    const skipped = new Set(SKIPPED_FILES.map((entry) => entry.file));
    const missing = UI_FILES.filter(
      (file) => !(covered.has(file) || skipped.has(file))
    );
    expect(missing).toEqual([]);
  });

  it("names only files that exist", () => {
    const known = new Set(UI_FILES);
    const named = [
      ...GROUPS.flatMap((group) => group.files),
      ...SKIPPED_FILES.map((entry) => entry.file),
    ];
    expect(named.filter((file) => !known.has(file))).toEqual([]);
  });

  it("never both shows and skips a file", () => {
    const covered = new Set(GROUPS.flatMap((group) => group.files));
    expect(
      SKIPPED_FILES.filter((entry) => covered.has(entry.file)).map(
        (entry) => entry.file
      )
    ).toEqual([]);
  });

  it("gives every skipped file a reason", () => {
    expect(
      SKIPPED_FILES.filter((entry) => entry.reason.trim().length === 0)
    ).toEqual([]);
  });

  it("uses unique group ids", () => {
    const ids = GROUPS.map((group) => group.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every group at least one example with a unique label", () => {
    for (const group of GROUPS) {
      expect(group.examples.length, group.id).toBeGreaterThan(0);
      const labels = group.examples.map((example) => example.label);
      expect(new Set(labels).size, group.id).toBe(labels.length);
    }
  });

  it("lists every Button variant", () => {
    expect(everyButtonVariantShown).toBe(true);
    const shown = GROUPS.find((group) => group.id === "button")?.examples.map(
      (example) => example.label
    );
    for (const variant of BUTTON_VARIANTS) {
      expect(shown).toContain(`variant="${variant}"`);
    }
  });
});
