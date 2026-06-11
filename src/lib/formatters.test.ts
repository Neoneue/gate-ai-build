import { describe, expect, it } from "vitest";
import type { CodeLine } from "@/components/ui/code-card";
import { formatCurrency, formatNumber, linesToString } from "@/lib/formatters";
import { randomHex } from "@/lib/utils";

describe("linesToString", () => {
  it("joins token texts per line and lines with newlines", () => {
    const lines: CodeLine[] = [
      [{ text: "const " }, { text: "x = 1;" }] as CodeLine,
      [{ text: "x++;" }] as CodeLine,
    ];
    expect(linesToString(lines)).toBe("const x = 1;\nx++;");
  });

  it("returns an empty string for no lines", () => {
    expect(linesToString([])).toBe("");
  });
});

describe("formatters", () => {
  it("formatNumber groups thousands", () => {
    expect(formatNumber(63_793)).toBe("63,793");
  });

  it("formatCurrency renders dollars", () => {
    expect(formatCurrency(238)).toMatch(/^\$238/);
  });
});

describe("randomHex", () => {
  it("returns lowercase hex of the requested length", () => {
    for (const n of [4, 8, 64]) {
      const out = randomHex(n);
      expect(out).toHaveLength(n);
      expect(out).toMatch(/^[0-9a-f]+$/);
    }
  });
});
