// In-app notifications feed — the data behind the top-bar bell menu.
// Phase 1 of the notifications PRD (AG-505…): the bell is the in-app
// delivery channel; this feed doubles as the "recent firings" history that
// later also renders on the My Notifications workspace page.
//
// No synthetic data: every item derives from a real entity row and carries
// an id tracing back to it. Only PRD catalog types with backing rows appear
// here — spend-limit-reached and payment-failed have no rows yet (limits
// seed empty; no failure variant in billing history), so they wait for the
// My Notifications phase.

import { CreditCard, KeyRound, Mail, Users } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { API_KEY_SEED_ROWS } from "@/data/api-keys";
import { EVENT_ROWS as AUDIT_EVENT_ROWS } from "@/data/audit-trail";
import { HISTORY_ROWS } from "@/data/billing-history";
import { REQUEST_ROWS_RECENT, requestRowId } from "@/data/requests";
import { formatCurrency } from "@/lib/formatters";
import type { GuardrailAction, GuardrailReason } from "@/pages/requests/types";
import {
  parseEventTime,
  EVENT_ROWS as SECURITY_EVENT_ROWS,
  TYPE_META,
} from "@/pages/security-data";

export type NotificationKind =
  | "security"
  | "message"
  | "billing"
  | "api-key"
  | "team";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export type NotificationItem = {
  /** `n-<kind>-<source row id>` — every item traces to a real row. */
  id: string;
  kind: NotificationKind;
  /** PRD §4 catalog naming ("Security event", "API key created", …). */
  title: string;
  copy: string;
  at: Date;
  /** Deep link to the fired thing. */
  href: string;
  /** Static default; the menu layers runtime read state on top. */
  unread: boolean;
  Icon: IconType;
  /** Inline-styled on the glyph (`var(--color-*)`), same idiom as
   *  TYPE_META on the Security page. Unset = muted-foreground. */
  iconColor?: string;
};

/** Kind → destination nav glyph, so the dropdown icon matches the nav icon
 *  of where the item takes you. Security items override per-category from
 *  TYPE_META so the bell and the Security page agree on threat iconography.
 *  Exported for the completeness test. */
export const KIND_META: Record<NotificationKind, { Icon: IconType }> = {
  // TriangleAlert is the nav glyph for /security, but per-category
  // TYPE_META icons win on every security item; see securityItems().
  security: { Icon: TYPE_META.injection.Icon },
  message: { Icon: Mail },
  billing: { Icon: CreditCard },
  "api-key": { Icon: KeyRound },
  team: { Icon: Users },
};

/** The feed's mock clock: the design-agent key's lastUsed — the latest
 *  instant across the mock data, so every item is honestly in the past.
 *  2026-06-06 18:30:12. Relative labels render via
 *  `fmtRelative(item.at, NOTIFICATIONS_NOW)` from `@/data/audit-trail`. */
export const NOTIFICATIONS_NOW = new Date(2026, 5, 6, 18, 30, 12);

/** How many items the bell menu shows — the site-wide preview cap. */
export const NOTIFICATIONS_CAP = 8;

/** "design-agent (sk-gw-ef7)" → "design-agent". The masked id suffix stays
 *  on the Security page; prose copy carries only the key name. */
const keyName = (key: string) => key.replace(/\s*\(.*\)$/, "");

const MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

/** RequestRow stores "Jun 6" + "00:50:51" strings; recompose the instant.
 *  All request mock data lives in 2026. */
function parseRequestTime(day: string, time: string): Date {
  const [mon, dom] = day.split(" ");
  const [h, m, s] = time.split(":").map(Number);
  return new Date(2026, MONTHS[mon] ?? 0, Number(dom), h, m, s);
}

const GUARDRAIL_TITLE: Record<Exclude<GuardrailAction, "allow">, string> = {
  block: "Message blocked",
  flagged: "Message flagged",
  redacted: "Message redacted",
};

const REASON_LABEL: Record<GuardrailReason, string> = {
  injection: "Prompt injection",
  pii: "PII",
  credential: "Credential",
};

/** Three newest security events. Two rows can share a requestId (one
 *  request, two findings), so the id also carries the category. */
function securityItems(): NotificationItem[] {
  return [...SECURITY_EVENT_ROWS]
    .sort(
      (a, b) =>
        parseEventTime(b.time).getTime() - parseEventTime(a.time).getTime()
    )
    .slice(0, 3)
    .map((row) => ({
      id: `n-security-${row.requestId}-${row.type}`,
      kind: "security" as const,
      title: "Security event",
      copy: `${TYPE_META[row.type].label} ${row.action} on ${keyName(row.key)}`,
      at: parseEventTime(row.time),
      href: `/security?open=${row.requestId}`,
      unread: true,
      Icon: TYPE_META[row.type].Icon,
      iconColor: TYPE_META[row.type].color,
    }));
}

/** Two newest guardrail-touched messages. The route param is the row's
 *  canonical UUID from requestRowId() — never the `req_*` display id,
 *  which /messages-findings/:requestId cannot resolve. */
function messageItems(): NotificationItem[] {
  return REQUEST_ROWS_RECENT.filter((row) => row.guardrail !== "allow")
    .slice(0, 2)
    .map((row) => ({
      id: `n-message-${requestRowId(row)}`,
      kind: "message" as const,
      title:
        GUARDRAIL_TITLE[row.guardrail as Exclude<GuardrailAction, "allow">],
      copy: row.guardrailReason
        ? `${REASON_LABEL[row.guardrailReason]} finding on ${row.keyId}`
        : `Guardrail finding on ${row.keyId}`,
      at: parseRequestTime(row.day, row.time),
      href: `/messages-findings/${requestRowId(row)}`,
      unread: true,
      Icon: Mail,
    }));
}

/** The newest key mint. */
function apiKeyItem(): NotificationItem | null {
  const newest = [...API_KEY_SEED_ROWS].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )[0];
  if (!newest) {
    return null;
  }
  return {
    id: `n-api-key-${newest.id}`,
    kind: "api-key",
    title: "API key created",
    copy: `Key "${newest.name}" is live in this workspace`,
    at: newest.createdAt,
    href: "/api-keys",
    unread: true,
    Icon: KeyRound,
  };
}

/** The newest credits top-up from billing history. */
function billingItem(): NotificationItem | null {
  const topUp = HISTORY_ROWS.filter((row) => row.type === "Credits added").sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  )[0];
  if (!topUp) {
    return null;
  }
  return {
    id: `n-billing-${topUp.id}`,
    kind: "billing",
    title: "Credits added",
    copy: `${formatCurrency(topUp.amount)} added to your balance`,
    at: topUp.date,
    href: "/billing",
    unread: false,
    Icon: CreditCard,
  };
}

/** Workspace membership changes from the audit trail. */
function teamItems(): NotificationItem[] {
  return AUDIT_EVENT_ROWS.filter(
    (row) =>
      row.kind === "EVENT" && row.description.includes("added to the workspace")
  )
    .slice(0, 1)
    .map((row) => ({
      id: `n-team-${row.id}`,
      kind: "team" as const,
      title: "Member added",
      copy: row.description,
      at: row.at,
      href: "/team",
      unread: false,
      Icon: Users,
    }));
}

/** The bell feed: newest first, capped at NOTIFICATIONS_CAP. */
export const NOTIFICATION_ITEMS: NotificationItem[] = [
  ...securityItems(),
  ...messageItems(),
  apiKeyItem(),
  billingItem(),
  ...teamItems(),
]
  .filter((item): item is NotificationItem => item !== null)
  .sort((a, b) => b.at.getTime() - a.at.getTime())
  .slice(0, NOTIFICATIONS_CAP);
