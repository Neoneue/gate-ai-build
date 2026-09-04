import { describe, expect, it } from "vitest";
import { CONVERSATION_ROWS } from "@/data/conversations";
import { REQUEST_ROWS_ALL } from "@/data/requests";
import { TEAM_SEED_ROWS, usageForTeam } from "@/data/teams";
import { EVENT_ROWS } from "@/pages/security-data";
import { ADMIN_USER_ID, MANAGER_USER_ID, MEMBER_USER_ID } from "./teams-store";
import { eventKeyName, ownKeyNames, viewScopeFor } from "./view-scope";

const OTHER_OWNERS_KEYS = new Set([
  "openclaw",
  "nova-chat",
  "hermes-agent",
  "atlas-eval",
]);

describe("view scope: managers and members read their own keys", () => {
  it("Admin is unscoped", () => {
    const s = viewScopeFor("admin", ADMIN_USER_ID, TEAM_SEED_ROWS);
    expect(s.scoped).toBe(false);
    expect(s.keyNames).toBeNull();
    expect(s.requestShare).toBe(1);
  });

  it("Kira (manager) owns openclaw + nova-chat and manages Development", () => {
    const s = viewScopeFor("manager", MANAGER_USER_ID, TEAM_SEED_ROWS);
    expect([...(s.keyNames ?? [])].sort()).toEqual(["nova-chat", "openclaw"]);
    expect(s.managedTeam?.name).toBe("Development");
    expect(s.requestShare).toBeGreaterThan(0);
    expect(s.requestShare).toBeLessThan(1);
  });

  it("Mateus (member) owns hermes-agent + atlas-eval and manages nothing", () => {
    const s = viewScopeFor("member", MEMBER_USER_ID, TEAM_SEED_ROWS);
    expect([...(s.keyNames ?? [])].sort()).toEqual([
      "atlas-eval",
      "hermes-agent",
    ]);
    expect(s.managedTeam).toBeNull();
  });

  it("every conversation sits on exactly one owner's keys", () => {
    for (const seed of CONVERSATION_ROWS) {
      const keys = new Set(
        REQUEST_ROWS_ALL.filter(
          (r) => r.conversation === seed.conversationId
        ).map((r) => r.keyId)
      );
      const owners = new Set(
        [...keys].map((k) =>
          ownKeyNames(MANAGER_USER_ID).has(k)
            ? "kira"
            : ownKeyNames(MEMBER_USER_ID).has(k)
              ? "mate"
              : "org"
        )
      );
      expect(owners.size, seed.conversationId).toBe(1);
      // The initiator names the key that owns the conversation.
      expect(keys.has(seed.initiator), seed.conversationId).toBe(true);
    }
  });

  it("Kira and Mateus each see two conversations; Chad keeps the real session", () => {
    const byInitiator = (names: Set<string>) =>
      CONVERSATION_ROWS.filter((c) => names.has(c.initiator)).map(
        (c) => c.conversationId
      );
    expect(byInitiator(ownKeyNames(MANAGER_USER_ID)).sort()).toEqual([
      "cnv_polaris_55",
      "cnv_skylark_18",
    ]);
    expect(byInitiator(ownKeyNames(MEMBER_USER_ID)).sort()).toEqual([
      "cnv_lyra_92",
      "cnv_orion_70",
    ]);
    const chad = byInitiator(ownKeyNames(ADMIN_USER_ID));
    expect(chad).toContain("cnv_7a3f9e2b");
    expect(chad.some((id) => OTHER_OWNERS_KEYS.has(id))).toBe(false);
  });

  it("security events follow their conversation's key", () => {
    const keyFor = new Map(
      CONVERSATION_ROWS.map((c) => [c.conversationId, c.initiator])
    );
    for (const row of EVENT_ROWS) {
      const expected = keyFor.get(row.conversationId);
      if (expected && !OTHER_OWNERS_KEYS.has(expected)) {
        continue; // Chad's conversations may span his several keys
      }
      expect(eventKeyName(row.key), row.requestId).toBe(expected);
    }
  });

  it("the virtual own-team derives usage like a team; org roll-ups unchanged", () => {
    const kira = viewScopeFor("manager", MANAGER_USER_ID, TEAM_SEED_ROWS);
    const usage = usageForTeam(kira.ownTeam!);
    expect(usage.requests).toBeGreaterThan(0);
    expect(usage.byUser.map((u) => u.id)).toEqual([MANAGER_USER_ID]);
    // Pinned in teams.test.ts; restated here so the re-attribution of
    // conversations (which never feeds these) is provably neutral.
    const org = TEAM_SEED_ROWS.reduce((a, t) => a + usageForTeam(t).spend, 0);
    expect(org).toBeCloseTo(247.59, 2);
  });
});

describe("scoped derivations have data for both personas", () => {
  it("usage, models and security are non-empty for Kira and Mateus", async () => {
    const { scopedUsageTotals } = await import("@/pages/activity-data");
    const { scopedSecurity } = await import("./scoped-security");
    for (const [role, id] of [
      ["manager", MANAGER_USER_ID],
      ["member", MEMBER_USER_ID],
    ] as const) {
      const s = viewScopeFor(role, id, TEAM_SEED_ROWS);
      const totals = scopedUsageTotals(s.keyNames);
      expect(Object.keys(totals.tokens.model).length, role).toBeGreaterThan(0);
      expect(Object.keys(totals.tokens.apiKey).length, role).toBeGreaterThan(0);
      const sec = scopedSecurity(s, "all", null, TEAM_SEED_ROWS);
      expect(sec?.findings ?? 0, role).toBeGreaterThan(0);
      const events = EVENT_ROWS.filter(
        (r) =>
          (s.managedTeam ? true : s.keyNames?.has(eventKeyName(r.key))) ?? false
      );
      expect(events.length, role).toBeGreaterThan(0);
    }
  });
});
