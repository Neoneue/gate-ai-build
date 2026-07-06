// Audit Trail mock data + presentation helpers, shared by the Audit Trail
// pages and their record dialogs. NOW is the mock
// clock every relative timestamp and range cutoff derives from.

export const NOW = new Date(2026, 4, 16, 16, 0, 0); // 2026-05-16 16:00:00

export function fmtRelative(at: Date): string {
  const seconds = Math.max(
    0,
    Math.floor((NOW.getTime() - at.getTime()) / 1000)
  );
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }
  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    return `${weeks}w ago`;
  }
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function truncateHex(s: string, start = 6, end = 6): string {
  if (s.length <= start + end + 1) {
    return s;
  }
  return `${s.slice(0, start)}…${s.slice(-end)}`;
}

const hex = (...parts: string[]) => parts.join("");

const uuid = (a: string, b: string, c: string, d: string, e: string) =>
  [a, b, c, d, e].join("-");

export type EventKind = "AUDIT" | "REQUEST" | "POLICY" | "EVENT" | "LIMITS";

export type EventRow = {
  id: string;
  at: Date;
  eventId: string;
  kind: EventKind;
  description: string;
  member: string;
  anchor: string;
};

export const EVENT_ROWS: EventRow[] = [
  {
    id: "e-01",
    at: new Date(2026, 4, 14, 13, 42, 21),
    eventId: "e_" + uuid("cc8ae185", "a267", "4b1c", "ae7b", "a618713b5cac"),
    kind: "AUDIT",
    description: 'API key "design-agent" created',
    member: "Chad Ponticas",
    anchor: hex(
      "9fa072b3",
      "c41d85e2",
      "f7a630d1",
      "94bc58e0",
      "7f2c9a1d",
      "3e46b058",
      "21f7893d",
      "04c62e23"
    ),
  },
  {
    id: "e-02",
    at: new Date(2026, 4, 14, 9, 44, 58),
    eventId: "e_" + uuid("ac2525f1", "3b74", "4d92", "bf1e", "9c03d78afe59"),
    kind: "REQUEST",
    description:
      'Request error: Set it to "https://api.anthropic.com" for Anthropic API keys, or to your custom upstream URL.',
    member: "Chad Ponticas",
    anchor: hex(
      "ab40eb92",
      "c5f17d03",
      "4a9b82e1",
      "c06d3f45",
      "b8712e9a",
      "4c0d56f8",
      "73b2190a",
      "687f0b42"
    ),
  },
  {
    id: "e-03",
    at: new Date(2026, 4, 14, 9, 43, 13),
    eventId: "e_" + uuid("5ea003d8", "c92f", "4a17", "b836", "e501d4cbfc55"),
    kind: "REQUEST",
    description:
      'Request error: Set it to "https://api.anthropic.com" for Anthropic API keys, or to your custom upstream URL.',
    member: "Chad Ponticas",
    anchor: hex(
      "a96fc5e2",
      "14b873d0",
      "f591c4a8",
      "2e3070b6",
      "d19f25c8",
      "a7e43d96",
      "1b208475",
      "31d967a"
    ),
  },
  {
    id: "e-04",
    at: new Date(2026, 4, 13, 7, 49, 6),
    eventId: "e_" + uuid("5ec325a9", "7b31", "4e08", "9d2f", "c8413852a5f7"),
    kind: "REQUEST",
    description:
      "Streaming proxy request completed: POST /v1/messages?beta=true",
    member: "Jordan Lee",
    anchor: hex(
      "e5c4f2a1",
      "0d738b29",
      "65f401c7",
      "e8920a3b",
      "56d14f8c",
      "7291e30b",
      "4d85762a",
      "01116544"
    ),
  },
  {
    id: "e-05",
    at: new Date(2026, 4, 13, 7, 49, 2),
    eventId: "e_" + uuid("f390ab62", "1d4e", "4c83", "a075", "b219e53b7abc2"),
    kind: "REQUEST",
    description:
      "Streaming proxy request completed: POST /v1/messages?beta=true",
    member: "Jordan Lee",
    anchor: hex(
      "e5c4f2a1",
      "0d738b29",
      "65f401c7",
      "e8920a3b",
      "56d14f8c",
      "7291e30b",
      "4d85762a",
      "01116544"
    ),
  },
  {
    id: "e-06",
    at: new Date(2026, 4, 13, 7, 48, 59),
    eventId: "e_" + uuid("38508b47", "9e2a", "4f61", "bc93", "d72058c8a045"),
    kind: "REQUEST",
    description:
      "Streaming proxy request completed: POST /v1/messages?beta=true",
    member: "Jordan Lee",
    anchor: hex(
      "e5c4f2a1",
      "0d738b29",
      "65f401c7",
      "e8920a3b",
      "56d14f8c",
      "7291e30b",
      "4d85762a",
      "01116544"
    ),
  },
  {
    id: "e-07",
    at: new Date(2026, 4, 13, 7, 47, 29),
    eventId: "e_" + uuid("7e0402c8", "5a93", "4b72", "d81f", "e046f3067e63"),
    kind: "REQUEST",
    description:
      "Streaming proxy request completed: POST /v1/messages?beta=true",
    member: "Jordan Lee",
    anchor: hex(
      "36c1b2d7",
      "a4e95f0c",
      "8310b627",
      "4d82a93f",
      "15e6c481",
      "0d927b53",
      "f4812069",
      "1012192cc"
    ),
  },
  {
    id: "e-08",
    at: new Date(2026, 4, 12, 9, 23, 49),
    eventId: "e_" + uuid("644008f2", "2c57", "4d1a", "93be", "7f10628581d9"),
    kind: "POLICY",
    description: "Request blocked by security policy",
    member: "Jordan Lee",
    anchor: hex(
      "53b6a5c9",
      "f2e0178d",
      "4b3960a7",
      "c825e14f",
      "93d07b26",
      "1f4a8e5d",
      "9c130247",
      "805cfd97"
    ),
  },
  {
    id: "e-09",
    at: new Date(2026, 4, 12, 9, 21, 7),
    eventId: "e_" + uuid("eccc67b1", "8f4d", "4e29", "a153", "c09715baba9"),
    kind: "REQUEST",
    description: "Proxy request completed: POST /v1/messages",
    member: "Jordan Lee",
    anchor: hex(
      "b8d5af3e",
      "76c2190d",
      "4b05f8a1",
      "3e92c647",
      "d30f819a",
      "25b7e40c",
      "16834d09",
      "257dd92"
    ),
  },
  {
    id: "e-10",
    at: new Date(2026, 4, 12, 9, 18, 12),
    eventId: "e_" + uuid("e77116a3", "d058", "4b7f", "9c21", "e3a540b318ae"),
    kind: "AUDIT",
    description: "API key <API_KEY> revoked",
    member: "Chad Ponticas",
    anchor: hex(
      "a0eb4a27",
      "f91c5083",
      "b6d24e17",
      "a39c850f",
      "72d68b14",
      "c30e9f5a",
      "28461b07",
      "3d9fe5bf"
    ),
  },
  {
    id: "e-11",
    at: new Date(2026, 4, 12, 9, 16, 57),
    eventId: "e_" + uuid("9e0d73c4", "6b12", "4f85", "a047", "b83294cee5d1"),
    kind: "REQUEST",
    description: "Proxy request completed: POST /v1/messages",
    member: "Jordan Lee",
    anchor: hex(
      "eb81261c",
      "7d4a93f0",
      "b285e6c4",
      "0917d58a",
      "32f0c19b",
      "674e20d8",
      "3a95b047",
      "f1855ab1"
    ),
  },
  {
    id: "e-12",
    at: new Date(2026, 4, 12, 9, 16, 11),
    eventId: "e_" + uuid("a707dd59", "3e8c", "4a06", "b172", "940c51a3837b"),
    kind: "AUDIT",
    description: 'API key "test1" created',
    member: "Chad Ponticas",
    anchor: hex(
      "daa135e7",
      "2b4c09f1",
      "836d57a0",
      "e29b4c80",
      "f16a3d72",
      "e85c14b0",
      "97f43621",
      "873735f"
    ),
  },
  {
    id: "e-13",
    at: new Date(2026, 4, 12, 9, 13, 54),
    eventId: "e_" + uuid("6a58e5d7", "4b21", "4f93", "a860", "c73921418752"),
    kind: "AUDIT",
    description: 'API key "test-key" created',
    member: "Chad Ponticas",
    anchor: hex(
      "7c1ddaf3",
      "b8260e94",
      "a15c072d",
      "38b91e45",
      "0c2897f6",
      "a13d48b0",
      "25e79c30",
      "41e2e8737"
    ),
  },
  {
    id: "e-14",
    at: new Date(2026, 4, 12, 9, 8, 9),
    eventId: "e_" + uuid("9bb46bf0", "7c35", "4d18", "b092", "5e1a3118a027"),
    kind: "AUDIT",
    description: "Admin inspected workspace orgs",
    member: "Mateus Silva",
    anchor: hex(
      "8d4fa5c3",
      "b70e192d",
      "46a8f01e",
      "37c984b2",
      "5d71f360",
      "9e2a58b1",
      "c04d3760",
      "29388f8"
    ),
  },
  {
    id: "e-15",
    at: new Date(2026, 4, 12, 9, 3, 22),
    eventId: "e_" + uuid("6b544c2a", "91f7", "4e53", "bc80", "d4372aec522e"),
    kind: "AUDIT",
    description: "Admin inspected workspace orgs",
    member: "Mateus Silva",
    anchor: hex(
      "d00ed9f1",
      "b3a82c40",
      "75e96d31",
      "b87f05c2",
      "9a4e16d3",
      "0b72f58c",
      "19043a87",
      "50cf402"
    ),
  },
  {
    id: "e-16",
    at: new Date(2026, 4, 12, 9, 1, 14),
    eventId: "e_" + uuid("921bcd37", "2e04", "4c61", "a895", "f18360b4954e"),
    kind: "AUDIT",
    description: "Admin inspected workspace orgs",
    member: "Mateus Silva",
    anchor: hex(
      "02d0e2c7",
      "f4b9310a",
      "58e72d46",
      "b01c93f8",
      "5a17d24e",
      "6930b78c",
      "5f219a04",
      "7016b025"
    ),
  },
  {
    id: "e-17",
    at: new Date(2026, 4, 12, 9, 1, 4),
    eventId: "e_" + uuid("4e92b8f6", "c031", "4d7a", "b259", "a07185479d54"),
    kind: "AUDIT",
    description: "Admin inspected workspace orgs",
    member: "Mateus Silva",
    anchor: hex(
      "02d0e2c7",
      "f4b9310a",
      "58e72d46",
      "b01c93f8",
      "5a17d24e",
      "6930b78c",
      "5f219a04",
      "7016b025"
    ),
  },
  {
    id: "e-18",
    at: new Date(2026, 4, 9, 15, 16, 13),
    eventId: "e_" + uuid("a54fac81", "b0d6", "4e39", "9c72", "f83410a2636c"),
    kind: "EVENT",
    description: "Kira Tan added to the workspace as a member",
    member: "Kira Tan",
    anchor: hex(
      "4f3382d6",
      "e91c07b2",
      "a543f08c",
      "7d25e3b9",
      "4a10f681",
      "2c97d30e",
      "4b586291",
      "a12bec3"
    ),
  },
];

export const KIND_BADGE_VARIANT: Record<
  EventKind,
  "warning" | "info" | "destructive" | "secondary" | "neutral"
> = {
  AUDIT: "warning",
  REQUEST: "info",
  POLICY: "destructive",
  LIMITS: "secondary",
  EVENT: "neutral",
};
