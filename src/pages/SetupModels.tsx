import { VendorAvatar } from "@/components/icons/vendor-avatar";
import type { Vendor } from "@/components/icons/vendor-meta";
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
import { SetupScaffold } from "@/pages/onboarding-shared";

/* ─── /setup-models-default ─────────────────────────────────────────────────
 * Pooled pay-as-you-go pricing, reached from the Manual setup PAYG note. Back
 * breadcrumb → Manual setup (PAYG).
 * ────────────────────────────────────────────────────────────────────────── */

type PricingRow = {
  name: string;
  vendor: Vendor;
  input: string;
  output: string;
};

const PRICING_ROWS: PricingRow[] = [
  {
    name: "Claude Opus 4.8",
    vendor: "anthropic",
    input: "$15.00",
    output: "$75.00",
  },
  {
    name: "Claude Sonnet 4.6",
    vendor: "anthropic",
    input: "$3.00",
    output: "$15.00",
  },
  { name: "GPT-5.2", vendor: "openai", input: "$2.50", output: "$10.00" },
  { name: "o4", vendor: "openai", input: "$5.00", output: "$20.00" },
  {
    name: "Gemini 2.5 Pro",
    vendor: "google",
    input: "$1.25",
    output: "$10.00",
  },
  { name: "Grok 4", vendor: "xai", input: "$3.00", output: "$15.00" },
  { name: "Llama 4 Maverick", vendor: "meta", input: "$0.20", output: "$0.60" },
];

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
            {PRICING_ROWS.map((row) => (
              <TableRow key={row.name}>
                <TableCell className="font-medium text-foreground">
                  {row.name}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <VendorAvatar decorative vendor={row.vendor} />
                    {VENDOR_META[row.vendor].label}
                  </span>
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {row.input}
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {row.output}
                </TableCell>
                <TableCell>
                  <Badge variant="success">Available</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </SetupScaffold>
  );
}
