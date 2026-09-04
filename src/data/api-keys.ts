// API key rows shared by the API Keys page and the notifications feed.
// Lifted out of ApiKeys.tsx (2026-08-24) so chrome-level surfaces can read
// the seed without importing the page chunk. The page still owns mutation:
// it seeds `useState(API_KEY_SEED_ROWS)` and creates/revokes from there.
//
// Named API_KEY_SEED_ROWS, not API_KEY_ROWS — activity-data.ts already
// exports a different ApiKeyRow/API_KEY_ROWS pair for the Activity tables.
// The two registries are aligned 1:1 by `name` ↔ `key`: activity-data owns
// each key's traffic numbers (requests, spend, path), this file owns its
// identity (id, masked form, dates, owner). `ownerId` mirrors activity-data's
// `owner` (a MEMBER_ROWS name) as the member id, so Teams surfaces can join
// keys to people without string-matching display names.

import { authoredDate } from "@/lib/demo-clock";

export type ApiKeyRow = {
  id: string; // full id used for matching / dedup
  name: string; // user-supplied label
  masked: string; // `sk-gw-…3a8f` display form
  /** MEMBER_ROWS id of the key's owner. Matches activity-data's `owner`. */
  ownerId: string;
  requests7d: number[]; // sparkline series; 7 daily buckets
  createdAt: Date; // when the key was minted
  lastUsed: Date | null; // null = never used (freshly-minted or revoked-untouched)
  revoked?: boolean; // greys out the row + disables actions when true
};

// TEMP PREVIEW SEED — every org key, mirroring activity-data's ten rows:
// Chad's three active keys plus a revoked test-key, and the six member keys
// (Kira, Mateus, Jordan × 2 each). Replace with `[]` at the page's useState
// to exercise the real add-key flow.
export const API_KEY_SEED_ROWS: ApiKeyRow[] = [
  {
    id: "sk-gw-c4aeb3a8",
    name: "prod-web",
    masked: "sk-gw-…c4ae",
    ownerId: "usr_chad",
    // Steady climb — prod-web traffic grows day-over-day.
    requests7d: [3, 5, 7, 6, 10, 9, 14],
    createdAt: authoredDate(2026, 3, 28, 10, 14, 22), // authored 2026-04-28 10:14:22
    lastUsed: authoredDate(2026, 4, 17, 9, 41, 6), // authored 2026-05-17 09:41:06
  },
  {
    id: "sk-gw-9f3064ce",
    name: "prod-agent",
    masked: "sk-gw-…9f30",
    ownerId: "usr_chad",
    // Spiky — agent runs burst irregularly across the week.
    requests7d: [1, 8, 2, 11, 3, 9, 4],
    createdAt: authoredDate(2026, 4, 8, 16, 2, 51), // authored 2026-05-08 16:02:51
    lastUsed: authoredDate(2026, 4, 18, 10, 12, 33), // authored 2026-05-18 10:12:33
  },
  {
    id: "sk-gw-255e1d3a",
    name: "test-key",
    masked: "sk-gw-…255e",
    ownerId: "usr_chad",
    requests7d: [0, 0, 0, 0, 0, 0, 0],
    createdAt: authoredDate(2026, 3, 18, 9, 0, 0), // authored 2026-04-18 09:00:00
    lastUsed: null,
    revoked: true,
  },
  {
    id: "sk-gw-ef72d1a9",
    name: "design-agent",
    masked: "sk-gw-…ef72",
    ownerId: "usr_chad",
    // Active — the design-dashboard session runs on this key.
    requests7d: [2, 4, 3, 7, 6, 9, 13],
    createdAt: authoredDate(2026, 5, 6, 18, 24, 22), // authored 2026-06-06 18:24:22
    lastUsed: authoredDate(2026, 5, 6, 18, 30, 12), // today
  },
  {
    id: "sk-gw-7d21c05b",
    name: "openclaw",
    masked: "sk-gw-…7d21",
    ownerId: "usr_kira",
    // Steady daily driver — Kira's BYOK desktop client.
    requests7d: [6, 7, 5, 8, 7, 9, 8],
    createdAt: authoredDate(2026, 4, 2, 11, 5, 44), // authored 2026-05-02 11:05:44
    lastUsed: authoredDate(2026, 4, 18, 8, 57, 21), // authored 2026-05-18 08:57:21
  },
  {
    id: "sk-gw-3b84f6e2",
    name: "nova-chat",
    masked: "sk-gw-…3b84",
    ownerId: "usr_kira",
    // Heaviest member key by volume — the shared chat frontend.
    requests7d: [10, 12, 11, 14, 13, 16, 15],
    createdAt: authoredDate(2026, 3, 22, 14, 31, 9), // authored 2026-04-22 14:31:09
    lastUsed: authoredDate(2026, 4, 18, 9, 48, 2), // authored 2026-05-18 09:48:02
  },
  {
    id: "sk-gw-a95d02c7",
    name: "hermes-agent",
    masked: "sk-gw-…a95d",
    ownerId: "usr_mate",
    // Batchy — Mateus's BYOK agent runs in clumps.
    requests7d: [2, 6, 1, 7, 2, 8, 3],
    createdAt: authoredDate(2026, 4, 11, 9, 20, 37), // authored 2026-05-11 09:20:37
    lastUsed: authoredDate(2026, 4, 17, 22, 4, 55), // authored 2026-05-17 22:04:55
  },
  {
    id: "sk-gw-58e19d4f",
    name: "atlas-eval",
    masked: "sk-gw-…58e1",
    ownerId: "usr_mate",
    // Low volume, metered — eval sweeps on the cheap catalog models.
    requests7d: [1, 2, 1, 3, 2, 2, 3],
    createdAt: authoredDate(2026, 4, 14, 15, 46, 18), // authored 2026-05-14 15:46:18
    lastUsed: authoredDate(2026, 4, 18, 7, 33, 40), // authored 2026-05-18 07:33:40
  },
  {
    id: "sk-gw-e60c37ba",
    name: "development",
    masked: "sk-gw-…e60c",
    ownerId: "usr_jordan",
    // Workday rhythm — Jordan's dev loop, quiet on the weekend.
    requests7d: [8, 9, 7, 10, 9, 3, 2],
    createdAt: authoredDate(2026, 3, 30, 10, 2, 12), // authored 2026-04-30 10:02:12
    lastUsed: authoredDate(2026, 4, 18, 11, 26, 5), // authored 2026-05-18 11:26:05
  },
  {
    id: "sk-gw-14f7ab90",
    name: "ci-runner",
    masked: "sk-gw-…14f7",
    ownerId: "usr_jordan",
    // Spiky — fires on merges, silent between them.
    requests7d: [3, 0, 6, 1, 5, 0, 4],
    createdAt: authoredDate(2026, 4, 5, 8, 15, 29), // authored 2026-05-05 08:15:29
    lastUsed: authoredDate(2026, 4, 18, 6, 12, 48), // authored 2026-05-18 06:12:48
  },
];
