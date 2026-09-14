import { MODELS, type Model } from "@/data/models";
import { isDefaultSurface, isFreeSurface } from "@/lib/plan";

/**
 * Free model access (Notion "Free models", AG-829, Approved 2026-09-07).
 *
 * Operators pick catalog models and enable them for Free, Pro or both plans
 * with per-user weekly and monthly allowances. Customers see them at the top
 * of the Models page under a Constellation ID (`constellation/<model-name>`),
 * with THEIR OWN usage ("Your usage") as Week and Month progress with a
 * percentage used, and the UTC reset time when a period is exhausted.
 * Internal USD limits never reach the customer surface, so this module
 * carries percentages only.
 *
 * Mock data: two operator-configured rows, chosen as the two cheapest
 * tool-capable models in the live catalog (2026-09-14: gpt-oss-20b at
 * $0.03 / $0.14 per million, DeepSeek V4 Flash 0731 at $0.07 / $0.13 with a
 * 1M context), the price band where Gate can fund them as unpaid access.
 * The more capable of the two is Pro-only so both plan states render.
 * Usage percentages are sample values for the logged-in user; the shared
 * reset calendar is real (Monday 00:00 UTC weekly, first of the month
 * 00:00 UTC monthly).
 */

export type FreeAccess = "free-and-pro" | "pro-only";

export type FreeModel = {
  /** Catalog id, resolves to a `Model` row for name, vendor, context. */
  id: string;
  /** The id customers copy and send. */
  constellationId: string;
  access: FreeAccess;
  /** Two or three word positioning line, same vocabulary as the Featured
   *  badges (a property, not a rank). The plan lives in the price text. */
  tagline: string;
  /** Logged-in user's consumption of the current periods, 0 to 100. */
  usage: { weekPct: number; monthPct: number };
};

export const FREE_MODELS: readonly FreeModel[] = [
  {
    id: "openai/gpt-oss-20b",
    constellationId: "constellation/gpt-oss-20b",
    access: "free-and-pro",
    tagline: "Lightweight",
    usage: { weekPct: 42, monthPct: 18 },
  },
  {
    id: "deepseek/deepseek-v4-flash-0731",
    constellationId: "constellation/deepseek-v4-flash-0731",
    access: "pro-only",
    tagline: "Long context",
    usage: { weekPct: 100, monthPct: 63 },
  },
];

export type EffectivePlan = "free" | "pro";

/** A user has Pro access while they belong to at least one active Pro
 *  workspace; the Default and Free surfaces model a user with none. */
export function effectivePlan(pathname: string): EffectivePlan {
  return isDefaultSurface(pathname) || isFreeSurface(pathname) ? "free" : "pro";
}

export function canUseFreeModel(row: FreeModel, plan: EffectivePlan): boolean {
  return row.access === "free-and-pro" || plan === "pro";
}

export const FREE_ACCESS_LABEL: Record<FreeAccess, string> = {
  "free-and-pro": "Free + Pro",
  "pro-only": "Pro only",
};

export function freeModelRows(
  models: Model[] = MODELS
): { free: FreeModel; model: Model }[] {
  return FREE_MODELS.map((free) => ({
    free,
    model: models.find((m) => m.id === free.id),
  })).filter(
    (r): r is { free: FreeModel; model: Model } => r.model !== undefined
  );
}

const clampPct = (n: number) => Math.min(100, Math.max(0, Math.round(n)));

/** Percentage used, clamped to 0..100 (remaining allowance floors at zero). */
export function usedPct(n: number): number {
  return clampPct(n);
}

export function isExhausted(row: FreeModel): "week" | "month" | null {
  if (usedPct(row.usage.weekPct) >= 100) {
    return "week";
  }
  if (usedPct(row.usage.monthPct) >= 100) {
    return "month";
  }
  return null;
}

/** Shared UTC reset calendar. Weekly: next Monday 00:00 UTC. Monthly: first
 *  of next month 00:00 UTC. */
export function nextResetUtc(period: "week" | "month", now: Date): Date {
  if (period === "week") {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    const day = d.getUTCDay(); // 0 Sun .. 6 Sat
    const untilMonday = day === 1 ? 7 : (8 - day) % 7 || 7;
    d.setUTCDate(d.getUTCDate() + untilMonday);
    return d;
  }
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

/** "Resets Mon 21 Sep, 00:00 UTC" */
export function formatResetUtc(d: Date): string {
  const day = d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return `Resets ${day}, 00:00 UTC`;
}
