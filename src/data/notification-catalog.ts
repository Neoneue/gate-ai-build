// Notification catalog — the fixed set of pre-configured notification types
// from the notifications PRD §4, plus the preference model the My
// Notifications page persists. Pure data: the page owns state and
// localStorage (key below). Delivery PREFS persist; read/unread state does
// not — that lives in the in-memory notifications-store and resets on
// refresh by design (demo lifecycle).
//
// "Default on" = delivered by email to a new user with no setup (ticket
// scope: security events, spend limit reached, payment failed, PAYG balance
// low). Catalog types may have no firings in the mock feed — preferences
// exist for every type either way; only feed ITEMS must trace to real rows.

export type NotificationGroupId =
  | "security"
  | "billing"
  | "keys"
  | "team"
  | "lifecycle";

export type NotificationTypeId =
  | "security-event"
  | "spend-limit-reached"
  | "payment-failed"
  | "payg-balance-low"
  | "receipt-invoice"
  | "api-key-created"
  | "api-key-revoked"
  | "new-sign-in"
  | "credential-changed"
  | "org-membership"
  | "ownership-transferred"
  | "plan-canceled"
  | "account-deletion";

export type NotificationType = {
  id: NotificationTypeId;
  group: NotificationGroupId;
  name: string;
  description: string;
  /** Email delivers to a new user with no setup (PRD "default on"). */
  defaultOn: boolean;
};

export const NOTIFICATION_GROUPS: Array<{
  id: NotificationGroupId;
  title: string;
}> = [
  { id: "security", title: "Security and policy" },
  { id: "billing", title: "Spend and billing" },
  { id: "keys", title: "Keys and access" },
  { id: "team", title: "Org and team" },
  { id: "lifecycle", title: "Account lifecycle" },
];

export const NOTIFICATION_CATALOG: NotificationType[] = [
  {
    id: "security-event",
    group: "security",
    name: "Security event",
    description: "A request was flagged, redacted, or blocked by a policy",
    defaultOn: true,
  },
  {
    id: "spend-limit-reached",
    group: "billing",
    name: "Spend limit reached",
    description: "A configured spend limit hit 100%",
    defaultOn: true,
  },
  {
    id: "payment-failed",
    group: "billing",
    name: "Payment failed",
    description: "A charge on your payment method did not go through",
    defaultOn: true,
  },
  {
    id: "payg-balance-low",
    group: "billing",
    name: "PAYG balance low",
    description: "Your pay-as-you-go balance is low, or auto top-up failed",
    defaultOn: true,
  },
  {
    id: "receipt-invoice",
    group: "billing",
    name: "Receipt available",
    description: "A receipt or invoice is ready to view",
    defaultOn: false,
  },
  {
    id: "api-key-created",
    group: "keys",
    name: "API key created",
    description: "A new key was minted in this workspace",
    defaultOn: false,
  },
  {
    id: "api-key-revoked",
    group: "keys",
    name: "API key revoked or expiring",
    description: "A key was revoked, expired, or is nearing expiry",
    defaultOn: false,
  },
  {
    id: "new-sign-in",
    group: "keys",
    name: "New sign-in",
    description: "Your account signed in from a new device",
    defaultOn: false,
  },
  {
    id: "credential-changed",
    group: "keys",
    name: "Credential changed",
    description: "Your password, passkey, or email was changed",
    defaultOn: false,
  },
  {
    id: "org-membership",
    group: "team",
    name: "Membership changes",
    description:
      "Invited to an org, added to or removed from a team, or role changed",
    defaultOn: false,
  },
  {
    id: "ownership-transferred",
    group: "team",
    name: "Ownership transferred",
    description: "Ownership of an org or workspace moved to another member",
    defaultOn: false,
  },
  {
    id: "plan-canceled",
    group: "lifecycle",
    name: "Plan canceled or downgraded",
    description: "Your plan was canceled or moved to a lower tier",
    defaultOn: false,
  },
  {
    id: "account-deletion",
    group: "lifecycle",
    name: "Account deletion",
    description: "Deletion requested, the pre-purge reminder, and completion",
    defaultOn: false,
  },
];

/* ─── Preferences model ─────────────────────────────────────────────────── */

export type EmailFrequency = "realtime" | "daily" | "weekly" | "monthly";

export const EMAIL_FREQUENCIES: Array<{
  id: EmailFrequency;
  label: string;
  description: string;
}> = [
  {
    id: "realtime",
    label: "Real-time",
    description: "Each notification as it fires",
  },
  { id: "daily", label: "Daily", description: "One digest per day" },
  { id: "weekly", label: "Weekly", description: "One digest per week" },
  { id: "monthly", label: "Monthly", description: "One digest per month" },
];

/** Security-event scope — all events, or narrowed by policy, action, or
 *  rate (count over a window). Modes combine per the PRD. Policy ids match
 *  the POLICIES catalog in src/pages/policies/config.ts. */
export type SecurityScope = {
  mode: "all" | "narrowed";
  policyIds: string[]; // "prompt-injection" | "pii" | "secrets"
  actions: string[]; // "flag" | "redact" | "block"
  rate: { enabled: boolean; count: number; windowHours: number };
};

export type ChannelSelection = { email: boolean; inApp: boolean };

export type NotificationPrefs = {
  /** Master channel switches — gate the whole column. SMS ships later. */
  channels: { email: boolean; inApp: boolean };
  emailFrequency: EmailFrequency[];
  types: Record<NotificationTypeId, ChannelSelection>;
  securityScope: SecurityScope;
};

export const PREFS_STORAGE_KEY = "notifications.prefs.v1";

/** A NEW user's prefs, exactly the ticket defaults: the four default-on
 *  types deliver by email with no setup; nothing else is selected. This is
 *  what the -default twin renders. */
export function buildDefaultPrefs(): NotificationPrefs {
  const types = {} as Record<NotificationTypeId, ChannelSelection>;
  for (const type of NOTIFICATION_CATALOG) {
    types[type.id] = { email: type.defaultOn, inApp: false };
  }
  return {
    channels: { email: true, inApp: true },
    emailFrequency: ["realtime"],
    types,
    securityScope: {
      mode: "all",
      policyIds: [],
      actions: [],
      rate: { enabled: false, count: 10, windowHours: 1 },
    },
  };
}

/** The PRO workspace's configured state — the demo user has turned on
 *  in-app delivery for the kinds that appear in the bell feed (security
 *  events, key mints, top-up receipts, membership changes), which is what
 *  makes the feed's items coherent with these settings. */
export function buildConfiguredPrefs(): NotificationPrefs {
  const prefs = buildDefaultPrefs();
  const inAppOn: NotificationTypeId[] = [
    "security-event",
    "api-key-created",
    "receipt-invoice",
    "org-membership",
  ];
  for (const id of inAppOn) {
    prefs.types[id] = { ...prefs.types[id], inApp: true };
  }
  prefs.types["receipt-invoice"] = {
    ...prefs.types["receipt-invoice"],
    email: true,
  };
  return prefs;
}

/* ─── Org-level catalog (admin only) ────────────────────────────────────── */

/** Org-wide notification types an org admin can additionally manage. The
 *  admin receives these across the whole org, not just their own activity. */
export const ORG_NOTIFICATION_CATALOG: Array<{
  id: string;
  name: string;
  description: string;
  defaultOn: boolean;
}> = [
  {
    id: "org-security-events",
    name: "Org-wide security events",
    description: "Any member's request is flagged, redacted, or blocked",
    defaultOn: true,
  },
  {
    id: "org-spend",
    name: "Org spend limit reached",
    description: "An org-level spend limit hit 100%",
    defaultOn: true,
  },
  {
    id: "org-members",
    name: "Member and role changes",
    description: "Anyone is invited, added, removed, or changes role",
    defaultOn: false,
  },
];
