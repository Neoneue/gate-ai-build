import { VendorAvatar } from "@/components/icons/vendor-avatar";
import { VENDOR_META } from "@/components/icons/vendor-meta";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EM_DASH,
  listPrice,
  modelById,
  PAYG_PRICING_MODEL_IDS,
} from "@/data/models";
import { formatCurrency } from "@/lib/formatters";
import { SetupScaffold } from "@/pages/onboarding-shared";

/* ─── /setup-models-default ─────────────────────────────────────────────────
 * Pooled pay-as-you-go pricing, reached from the Manual setup PAYG note. Back
 * breadcrumb → Manual setup (PAYG).
 * ────────────────────────────────────────────────────────────────────────── */

type PricingRow = {
  /** Canonical catalog id. Name, vendor, and both prices are read off it. */
  id: string;
};

/* Nothing on this page is authored: the row set, the name, the provider, and
 * both per-1M rates all come from `@/data/models`, which is verbatim from the
 * production `available-models` payload. Until 2026-08-03 all four columns
 * were hand-typed here, and four of the seven rows (GPT-5.2, o4, Grok 4,
 * Llama 4 Maverick) named models the gateway does not serve — a pricing page
 * quoting a fictional price list.
 *
 * `listPrice` (not the raw `pricing` field) is the number the Models page's
 * own table shows, so the two pages cannot quote different figures for the
 * same model. */
const PRICING_ROWS: PricingRow[] = PAYG_PRICING_MODEL_IDS.map((id) => ({ id }));

/** Per-1M rate for the table cell. The header already says "per 1M tokens",
 *  so this drops the `/M` suffix `formatPricePerM` carries on the Models
 *  page — same number, one place it is spelled out. */
function ratePerM(value: number | null): string {
  if (value === null) {
    return EM_DASH;
  }
  const frac = value > 0 && value < 0.01 ? 4 : 2;
  return formatCurrency(value, { maxFrac: frac, minFrac: frac });
}

export function SetupModels() {
  return (
    <SetupScaffold
      backLabel="Manual setup"
      backTo="/setup-manual-default?bill=payg"
      subtitle="Pooled pay-as-you-go pricing, per 1M tokens."
      title="Models"
    >
      <Card density="flush">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead className="text-right">Input</TableHead>
              <TableHead className="text-right">Output</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PRICING_ROWS.map((row) => {
              const model = modelById(row.id);
              if (!model) {
                return null;
              }
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-foreground">
                    {model.name}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <VendorAvatar decorative vendor={model.vendor} />
                      {VENDOR_META[model.vendor].label}
                    </span>
                  </TableCell>
                  <TableCell className="type-mono-14 text-right text-muted-foreground">
                    {ratePerM(listPrice(model, "inputPer1M"))}
                  </TableCell>
                  <TableCell className="type-mono-14 text-right text-muted-foreground">
                    {ratePerM(listPrice(model, "outputPer1M"))}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">Available</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </SetupScaffold>
  );
}
