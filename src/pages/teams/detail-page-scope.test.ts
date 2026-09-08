import { describe, expect, it } from "vitest";
import { CONVERSATION_ROWS } from "@/data/conversations";
import { REQUEST_ROWS_ALL } from "@/data/requests";
import { TEAM_SEED_ROWS } from "@/data/teams";
import { ADMIN_USER_ID, MANAGER_USER_ID } from "./teams-store";
import { inScope, viewScopeFor } from "./view-scope";

/* The URL-addressable detail pages (`/messages-findings/:id`,
 * `/conversations-trace/:id`) gate the resolved row with `inScope` on the
 * same field their list pages use: `keyId` for requests, `initiator` for
 * conversations. These pin that decision against the real seed rows. */
describe("detail pages: a row outside the viewer's scope reads as missing", () => {
  const manager = viewScopeFor("manager", MANAGER_USER_ID, TEAM_SEED_ROWS);
  const admin = viewScopeFor("admin", ADMIN_USER_ID, TEAM_SEED_ROWS);

  it("Kira (manager) opens her own request but not another owner's", () => {
    const own = REQUEST_ROWS_ALL.find((r) => r.keyId === "openclaw");
    const other = REQUEST_ROWS_ALL.find(
      (r) => !(manager.keyNames?.has(r.keyId) ?? false)
    );
    expect(own).toBeDefined();
    expect(other).toBeDefined();
    expect(inScope(manager, own!.keyId)).toBe(true);
    expect(inScope(manager, other!.keyId)).toBe(false);
  });

  it("Kira (manager) opens her own conversation but not another owner's", () => {
    const own = CONVERSATION_ROWS.find((c) => c.initiator === "openclaw");
    const other = CONVERSATION_ROWS.find(
      (c) => !(manager.keyNames?.has(c.initiator) ?? false)
    );
    expect(own).toBeDefined();
    expect(other).toBeDefined();
    expect(inScope(manager, own!.initiator)).toBe(true);
    expect(inScope(manager, other!.initiator)).toBe(false);
  });

  it("Chad (admin) is unscoped: every request and conversation opens", () => {
    expect(REQUEST_ROWS_ALL.every((r) => inScope(admin, r.keyId))).toBe(true);
    expect(CONVERSATION_ROWS.every((c) => inScope(admin, c.initiator))).toBe(
      true
    );
  });
});
