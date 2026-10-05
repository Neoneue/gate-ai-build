import { MODELS, type Model } from "@/data/models";

/**
 * Free model access (Notion "Free models", AG-829, Approved 2026-09-07).
 *
 * Operators pick catalog models and enable them at no cost with per-user
 * weekly and monthly allowances. Every plan, Free and Pro, gets the same set.
 * Customers see them at the top of the Models page under a Constellation ID
 * (`constellation/<model-name>-free`), with THEIR OWN usage ("Your usage") as
 * Week and Month progress with a percentage used, and the UTC reset time when
 * a period is exhausted. Internal USD limits never reach the customer
 * surface, so this module carries percentages only.
 *
 * Mock data: the two operator-configured rows the live build ships
 * (2026-10-05), Qwen3.8 Flash and GLM 5.3 Flash, each a free twin of a pay
 * as you go catalog model. The detail page links the free twin to its paid
 * version through `id`. Usage percentages are sample values for the
 * logged-in user (one row exhausted for the week so that state renders); the
 * shared reset calendar is real (Monday 00:00 UTC weekly, first of the month
 * 00:00 UTC monthly).
 */

export type FreeModel = {
  /** Catalog id of the pay as you go version; resolves to a `Model` row for
   *  name, vendor, context, description and providers. */
  id: string;
  /** The id customers copy and send for the free version. */
  constellationId: string;
  /** Two or three word positioning line, same vocabulary as the Featured
   *  badges (a property, not a rank). */
  tagline: string;
  /** Logged-in user's consumption of the current periods, 0 to 100. */
  usage: { weekPct: number; monthPct: number };
};

export const FREE_MODELS: readonly FreeModel[] = [
  {
    id: "qwen/qwen3-8-flash",
    constellationId: "constellation/qwen3-8-flash-free",
    tagline: "Lightweight",
    usage: { weekPct: 42, monthPct: 18 },
  },
  {
    id: "z-ai/glm-5-3-flash",
    constellationId: "constellation/glm-5-3-flash-free",
    tagline: "Fastest",
    usage: { weekPct: 100, monthPct: 63 },
  },
];

/** The free row for a catalog id, or undefined when the model has no free
 *  twin. */
export function findFreeModel(id: string): FreeModel | undefined {
  return FREE_MODELS.find((f) => f.id === id);
}

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
