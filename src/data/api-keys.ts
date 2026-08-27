// API key rows shared by the API Keys page and the notifications feed.
// Lifted out of ApiKeys.tsx (2026-08-24) so chrome-level surfaces can read
// the seed without importing the page chunk. The page still owns mutation:
// it seeds `useState(API_KEY_SEED_ROWS)` and creates/revokes from there.
//
// Named API_KEY_SEED_ROWS, not API_KEY_ROWS — activity-data.ts already
// exports a different ApiKeyRow/API_KEY_ROWS pair for the Activity tables.

export type ApiKeyRow = {
  id: string; // full id used for matching / dedup
  name: string; // user-supplied label
  masked: string; // `sk-gw-…3a8f` display form
  requests7d: number[]; // sparkline series; 7 daily buckets
  createdAt: Date; // when the key was minted
  lastUsed: Date | null; // null = never used (freshly-minted or revoked-untouched)
  revoked?: boolean; // greys out the row + disables actions when true
};

// TEMP PREVIEW SEED — Chad's two active keys (prod-web, prod-agent) plus
// a revoked test-key. Replace with `[]` at the page's useState to exercise
// the real add-key flow.
export const API_KEY_SEED_ROWS: ApiKeyRow[] = [
  {
    id: "sk-gw-c4aeb3a8",
    name: "prod-web",
    masked: "sk-gw-…c4ae",
    // Steady climb — prod-web traffic grows day-over-day.
    requests7d: [3, 5, 7, 6, 10, 9, 14],
    createdAt: new Date(2026, 3, 28, 10, 14, 22), // 2026-04-28 10:14:22
    lastUsed: new Date(2026, 4, 17, 9, 41, 6), // 2026-05-17 09:41:06
  },
  {
    id: "sk-gw-9f3064ce",
    name: "prod-agent",
    masked: "sk-gw-…9f30",
    // Spiky — agent runs burst irregularly across the week.
    requests7d: [1, 8, 2, 11, 3, 9, 4],
    createdAt: new Date(2026, 4, 8, 16, 2, 51), // 2026-05-08 16:02:51
    lastUsed: new Date(2026, 4, 18, 10, 12, 33), // 2026-05-18 10:12:33
  },
  {
    id: "sk-gw-255e1d3a",
    name: "test-key",
    masked: "sk-gw-…255e",
    requests7d: [0, 0, 0, 0, 0, 0, 0],
    createdAt: new Date(2026, 3, 18, 9, 0, 0), // 2026-04-18 09:00:00
    lastUsed: null,
    revoked: true,
  },
  {
    id: "sk-gw-ef72d1a9",
    name: "design-agent",
    masked: "sk-gw-…ef72",
    // Active — the design-dashboard session runs on this key.
    requests7d: [2, 4, 3, 7, 6, 9, 13],
    createdAt: new Date(2026, 5, 6, 18, 24, 22), // 2026-06-06 18:24:22
    lastUsed: new Date(2026, 5, 6, 18, 30, 12), // today
  },
];
