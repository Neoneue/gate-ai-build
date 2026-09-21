// @vitest-environment happy-dom
/**
 * Module-scoped store contracts.
 *
 * `notifications-store.ts` does not export its store object — the snapshot is
 * reachable only through `useNotificationsReadState`, so that third needs a
 * React host and the whole file runs under happy-dom rather than the node
 * default. `auditStore` and `teamsStore` are plain objects and are driven
 * directly.
 *
 * The contract under test is the one the file's own header states: snapshots
 * are REPLACED, never mutated, and every mutator no-ops when it would change
 * nothing — `useSyncExternalStore` compares by identity, so a mutated-in-place
 * Set leaves subscribers unrendered and a churned snapshot re-renders every
 * subscriber for nothing.
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { auditStore, useAuditRows } from "@/data/audit-trail-store";
import {
  archiveOne,
  markAllRead,
  markRead,
  useNotificationsReadState,
} from "@/data/notifications-store";
import { teamsStore, type ViewRole } from "@/pages/teams/teams-store";

afterEach(() => {
  teamsStore.setViewRole("admin");
});

describe("notifications-store: snapshots are replaced, mutators no-op", () => {
  it("markRead fires subscribers and swaps the snapshot identity", () => {
    const { result } = renderHook(() => useNotificationsReadState());
    const before = result.current;
    act(() => markRead("test-notif-a"));
    expect(result.current).not.toBe(before);
    expect(result.current.readIds.has("test-notif-a")).toBe(true);
    // Archived is passed through untouched, not rebuilt from scratch.
    expect(result.current.archivedIds).toBe(before.archivedIds);
  });

  it("markRead on an already-read id no-ops (snapshot identity stable)", () => {
    const { result } = renderHook(() => useNotificationsReadState());
    act(() => markRead("test-notif-b"));
    const after = result.current;
    act(() => markRead("test-notif-b"));
    expect(result.current).toBe(after);
  });

  it("markAllRead no-ops when every id is already read", () => {
    const { result } = renderHook(() => useNotificationsReadState());
    act(() => markAllRead(["test-notif-c", "test-notif-d"]));
    const after = result.current;
    act(() => markAllRead(["test-notif-c", "test-notif-d"]));
    expect(result.current).toBe(after);
  });

  it("archiveOne files a row without reading it, and no-ops on repeat", () => {
    const { result } = renderHook(() => useNotificationsReadState());
    const before = result.current;
    act(() => archiveOne("test-notif-e"));
    expect(result.current.archivedIds.has("test-notif-e")).toBe(true);
    expect(result.current.readIds).toBe(before.readIds);
    const after = result.current;
    act(() => archiveOne("test-notif-e"));
    expect(result.current).toBe(after);
  });
});

describe("audit-trail-store: append notifies and prepends a new row array", () => {
  it("subscribe fires on append", () => {
    let fired = 0;
    const unsubscribe = auditStore.subscribe(() => {
      fired += 1;
    });
    const before = auditStore.rows;
    const row = auditStore.append({
      kind: "AUDIT",
      description: "test append",
      member: "Test",
    });
    unsubscribe();
    expect(fired).toBe(1);
    expect(auditStore.rows).not.toBe(before);
    expect(auditStore.rows[0]).toBe(row);
    expect(auditStore.rows.length).toBe(before.length + 1);
  });

  it("does not notify after unsubscribe", () => {
    let fired = 0;
    const unsubscribe = auditStore.subscribe(() => {
      fired += 1;
    });
    unsubscribe();
    auditStore.append({
      kind: "AUDIT",
      description: "test after unsubscribe",
      member: "Test",
    });
    expect(fired).toBe(0);
  });

  it("useAuditRows serves a stable snapshot when nothing changes", () => {
    const { result, rerender } = renderHook(() => useAuditRows());
    const before = result.current;
    rerender();
    expect(result.current).toBe(before);
  });
});

describe("teams-store: setViewRole round-trips", () => {
  const roles: ViewRole[] = ["admin", "manager", "member"];

  it.each(roles)("setViewRole(%s) is readable back off the store", (role) => {
    teamsStore.setViewRole(role);
    expect(teamsStore.viewRole).toBe(role);
  });

  it("notifies subscribers on every role change", () => {
    let fired = 0;
    const unsubscribe = teamsStore.subscribe(() => {
      fired += 1;
    });
    teamsStore.setViewRole("manager");
    teamsStore.setViewRole("member");
    teamsStore.setViewRole("admin");
    unsubscribe();
    expect(fired).toBe(3);
  });
});
