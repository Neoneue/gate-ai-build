import { describe, expect, it } from "vitest";
import { REQUEST_ROWS_ALL } from "@/data/requests";
import { messagePreview } from "./message-preview";

describe("messagePreview", () => {
  // The Messages table renders this string on a row. A value the gateway
  // caught on ingress must never reach it — see the PII/credential masking
  // criterion on the Message-column PRD. Four rows regressed this once:
  // real email addresses were in the DOM and the tooltip, hidden only by
  // the column's truncation width.
  it("never renders a value that a finding masks", () => {
    const leaks: string[] = [];
    for (const row of REQUEST_ROWS_ALL) {
      const preview = messagePreview(row);
      if (!preview) {
        continue;
      }
      for (const f of row.findings ?? []) {
        if (f.match && preview.includes(f.match)) {
          leaks.push(`${row.conversation}: ${f.entityType} "${f.match}"`);
        }
      }
    }
    expect(leaks).toEqual([]);
  });

  it("substitutes the upstream placeholder when a finding fires", () => {
    const masked = REQUEST_ROWS_ALL.filter((row) => {
      const preview = messagePreview(row);
      return (row.findings ?? []).some(
        (f) => preview?.includes(f.redactedAs) && f.redactedAs.startsWith("<")
      );
    });
    // Regression guard on the mask being applied at all, not just on the
    // absence of raw values (an empty preview would satisfy that vacuously).
    expect(masked.length).toBeGreaterThan(0);
  });

  it("collapses to a single line so row height cannot change", () => {
    for (const row of REQUEST_ROWS_ALL) {
      expect(messagePreview(row) ?? "").not.toContain("\n");
    }
  });

  it("prefers the tool call over the bare tool name", () => {
    const bashRow = REQUEST_ROWS_ALL.find((r) => r.toolName === "Bash");
    expect(bashRow).toBeDefined();
    const preview = messagePreview(bashRow!);
    // `summary` for these rows is the useless "tool: Bash"; the args carry
    // the command the operator needs to tell one row from the next.
    expect(preview).not.toBe("tool: Bash");
    expect(preview?.length).toBeGreaterThan("tool: Bash".length);
  });
});
