// Billing history rows shared by the Billing page and the notifications
// feed. Lifted out of Billing.tsx (2026-08-24) so chrome-level surfaces can
// read the rows without importing the page chunk.

export type HistoryRow = {
  id: string;
  date: Date;
  type: "Gateway request" | "Credits added" | "Adjustment";
  amount: number; // positive = credit, negative = debit
  balanceAfter: number;
};

// Newest first. Credits-added rows render the amount in success-700 to mark
// the inflow; debits use the default foreground tone.
export const HISTORY_ROWS: HistoryRow[] = [
  {
    id: "h-6",
    date: new Date(2026, 5, 6, 9, 14, 38),
    type: "Credits added",
    amount: 25.0,
    balanceAfter: 49.992_38,
  },
  {
    id: "h-5",
    date: new Date(2026, 4, 29, 14, 30, 0),
    type: "Adjustment",
    amount: 0.005_29,
    balanceAfter: 24.992_38,
  },
  {
    id: "h-4",
    date: new Date(2026, 4, 29, 10, 15, 0),
    type: "Adjustment",
    amount: 0.007_09,
    balanceAfter: 24.987_09,
  },
  {
    id: "h-3",
    date: new Date(2026, 4, 12, 16, 47, 12),
    type: "Gateway request",
    amount: -0.01,
    balanceAfter: 24.98,
  },
  {
    id: "h-2",
    date: new Date(2026, 4, 12, 14, 22, 5),
    type: "Gateway request",
    amount: -0.01,
    balanceAfter: 24.99,
  },
  {
    id: "h-1",
    date: new Date(2026, 4, 12, 9, 14, 38),
    type: "Credits added",
    amount: 25.0,
    balanceAfter: 25.0,
  },
];
