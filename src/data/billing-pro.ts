// Pro and Free bindings of the seat-billing engine (`billing-seats.ts`).
//
// Pro is billed PER SEAT (H2 PRD §3: Pro adoption drives seat purchases;
// H1's flat "$X TBD" superseded, design-lead decision 2026-09-16) on the
// workspace's billing ANNIVERSARY (H1 Billing PRD, "Subscription"), so its
// periods end on `BILLING_PERIOD_END_DATE` and step back a month at a time.
// Free has no subscription; its invoice list is the PAYG top-up receipts
// only (H1: the balance is plan-independent).

import { BILLING_PERIOD_END_DATE } from "@/data/billing-history";
import {
  type BillingPeriod,
  byDateDesc,
  creditReceiptRows,
  type InvoiceRow,
  periodsEndingAt,
  seatInvoiceRows,
} from "@/data/billing-seats";

/** Published Pro price per seat per month, the figure the plan-comparison
 *  dialog quotes. One constant so the Seats sub-card, the next-invoice total
 *  and the invoice rows derive from the same number. */
export const PRO_SEAT_RATE_USD = 20;

/** Anniversary periods shown: the current one plus one month of history. */
const PRO_PERIODS_SHOWN = 2;

/** Pro periods, oldest first, ending on the renewal date. */
export function proPeriods(): BillingPeriod[] {
  return periodsEndingAt(BILLING_PERIOD_END_DATE, PRO_PERIODS_SHOWN);
}

/** Pro invoice history: seat charges on each anniversary, prorated
 *  mid-period additions, plus PAYG top-up receipts. Newest first. */
export function proInvoiceRows(): InvoiceRow[] {
  return [
    ...seatInvoiceRows(proPeriods(), PRO_SEAT_RATE_USD),
    ...creditReceiptRows(),
  ].sort(byDateDesc);
}

/** Free invoice history: top-up receipts only. Newest first. */
export function freeInvoiceRows(): InvoiceRow[] {
  return creditReceiptRows().sort(byDateDesc);
}
