/* ─────────────────────────────────────────────────────────────────────────
 * Seed read / archive split of NOTIFICATION_HISTORY, as plain string
 * constants. This module exists so the top-bar bell (mounted on every
 * dashboard page via DashboardChrome) can show its unread badge WITHOUT
 * importing `@/data/notifications`, which drags requests, api-keys,
 * billing-history, team-members, activity-data and models into the chrome
 * chunk. The full seed loads lazily with the menu body.
 *
 * Single-sourced from the seed: `src/data/notifications.test.ts` pins both
 * arrays against `NOTIFICATION_HISTORY`, so a row edit that changes the
 * split fails the test rather than silently desyncing the badge.
 * ───────────────────────────────────────────────────────────────────────── */

/** Ids of every history item that ships `unread: true`, newest first. */
export const NOTIFICATION_SEED_UNREAD_IDS: readonly string[] = [
  "n-api-key-sk-gw-ef72d1a9",
  "n-billing-h-6",
  "n-message-5ef89e48-0545-40cb-8b7f-9f6045eace37",
  "n-security-req_ded91e-injection",
  "n-message-34fef969-7dfc-4fb4-8be5-819f4de3bdd1",
  "n-security-req_8389e4-pii",
  "n-security-req_8389e4-credential",
  "n-security-req_e9c29e-injection",
  "n-security-req_7de227-pii",
  "n-security-req_08fb0b-pii",
  "n-security-req_de1f4a-pii",
  "n-security-req_78f14b-pii",
  "n-security-req_dc4d30-pii",
  "n-security-req_31b316-injection",
  "n-team-usr_jordan",
];

/** Ids of every history item that ships `unread: false`; these start in the
 *  Archive (see `notifications-store.ts` INITIAL_STATE). */
export const NOTIFICATION_SEED_ARCHIVED_IDS: readonly string[] = [
  "n-api-key-sk-gw-58e19d4f",
  "n-security-req_aurora_4200-injection",
  "n-security-req_orion_4203-credential",
  "n-security-req_lyra_4207-injection",
  "n-security-req_meridian_4208-injection",
  "n-security-req_skylark_4209-pii",
  "n-security-req_vela_4209-injection",
  "n-security-req_polaris_4210-pii",
  "n-security-req_aurora_4212-credential",
  "n-security-req_orion_4213-phi",
  "n-security-req_lyra_4215-pii",
  "n-security-req_meridian_4218-phi",
  "n-security-req_skylark_4218-injection",
  "n-security-req_vela_4220-credential",
  "n-security-req_polaris_4221-phi",
  "n-security-req_aurora_4223-credential",
  "n-security-req_orion_4225-injection",
  "n-security-req_lyra_4229-pii",
  "n-billing-h-1",
  "n-api-key-sk-gw-a95d02c7",
  "n-api-key-sk-gw-9f3064ce",
  "n-api-key-sk-gw-14f7ab90",
  "n-api-key-sk-gw-7d21c05b",
  "n-team-usr_mate",
  "n-api-key-sk-gw-e60c37ba",
  "n-api-key-sk-gw-c4aeb3a8",
  "n-api-key-sk-gw-3b84f6e2",
  "n-team-usr_kira",
  "n-api-key-sk-gw-255e1d3a",
];
