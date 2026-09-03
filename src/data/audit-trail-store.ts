import { useSyncExternalStore } from "react";
import { EVENT_ROWS, type EventKind, type EventRow } from "@/data/audit-trail";

/* ─────────────────────────────────────────────────────────────────────────
 * Audit trail store — the seeded EVENT_ROWS plus every entry written this
 * session. AG-624 acceptance criterion: "Setting changes are recorded in the
 * audit log", so the org / team settings writes (lock, policies, savings)
 * append here and the Audit trail page reads the union. In-session actions
 * stamp real time (same rule as a deleted team's `deletedAt`); the seed
 * returns on full reload.
 * ───────────────────────────────────────────────────────────────────────── */

const listeners = new Set<() => void>();
const emit = () => {
  for (const l of listeners) {
    l();
  }
};

let seq = 0;

/** 64 hex chars from a string, the shape every seeded `anchor` has. FNV-1a
 *  over the input, rolled eight times with a different salt so the eight
 *  32-bit words differ. Deterministic for a given (description, time). */
function fingerprint(input: string): string {
  let out = "";
  for (let word = 0; word < 8; word++) {
    let h = 0x81_1c_9d_c5 ^ word;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 0x01_00_01_93) >>> 0;
    }
    out += h.toString(16).padStart(8, "0");
  }
  return out;
}

export const auditStore = {
  rows: EVENT_ROWS as EventRow[],
  append(entry: {
    kind: EventKind;
    description: string;
    member: string;
  }): EventRow {
    seq += 1;
    const at = new Date();
    const seed = `${entry.description}|${at.getTime()}|${seq}`;
    const row: EventRow = {
      id: `e-live-${seq}`,
      at,
      eventId: `e_${crypto.randomUUID()}`,
      kind: entry.kind,
      description: entry.description,
      member: entry.member,
      anchor: fingerprint(seed),
    };
    this.rows = [row, ...this.rows];
    emit();
    return row;
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useAuditRows(): EventRow[] {
  return useSyncExternalStore(
    (cb) => auditStore.subscribe(cb),
    () => auditStore.rows,
    () => auditStore.rows
  );
}
