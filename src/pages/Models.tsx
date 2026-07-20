import { Bot, ChevronDown, ChevronLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { AnthropicIcon, OpenAIIcon } from "@/components/icons/model-providers";
import {
  MarketplaceAvatar,
  VendorAvatar,
} from "@/components/icons/vendor-avatar";
import {
  MARKETPLACE_META,
  type MarketplaceProvider,
  VENDOR_META,
  type Vendor,
} from "@/components/icons/vendor-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CodeBlock,
  type CodeLine,
  type CodeToken,
} from "@/components/ui/code-card";
import { CodePanel } from "@/components/ui/code-panel";
import { CopyButton } from "@/components/ui/copy-button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { HeroNumeric } from "@/components/ui/hero-numeric";
import { InlineCode } from "@/components/ui/inline-code";
import { KpiRail as KpiRailShell } from "@/components/ui/kpi-rail";
import { PageTitle } from "@/components/ui/page-title";
import { RowActionButton } from "@/components/ui/row-action-button";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SortableTableHead,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { TablePaginationFooter } from "@/components/ui/table-pagination-footer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsCount } from "@/components/ui/tabs-count";
import { TextLink } from "@/components/ui/text-link";
import {
  CAPABILITY_META,
  CAPABILITY_ORDER,
  type Capability,
  MODALITY_COUNTS,
  MODELS,
  type Modality,
  type Model,
  PROVIDER_LABELS,
  PROVIDER_VENDOR,
  type ProviderId,
  type ProviderOffering,
  TOTAL_PROVIDERS,
} from "@/data/models";
import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { formatCurrency, formatNumber, linesToString } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  PAYG_TOOL_CAPTIONS,
  type PaygToolId,
  paygConfigSnippet,
} from "@/pages/payg-config";

/* ─────────────────────────────────────────────────────────────────────────
 * CMP-016 — Models
 *
 * Operational catalog of every model routable through the gateway. Same
 * production frame as CMP-012 / CMP-013 / CMP-014 / CMP-015. The page is
 * a routing-config tool, not a marketplace: surface capabilities, context,
 * pricing, and which providers serve each model. No status column (every
 * model is "available" — health belongs on a separate surface).
 *
 * Synthesis target: best parts of OpenRouter (modality tabs), Helicone
 * (code-sample tabs in detail), Vercel AI Gateway (dense table + per-row
 * capabilities + multi-provider per model). Skip Helicone's left filter
 * sidebar — DashboardChrome's outer sidebar is enough; toolbar carries
 * search / vendor / provider / sort.
 *
 * Filtering: search (name + handle + per-offering handle), modality,
 * vendor, provider, and sort are all wired to the in-memory MODELS list.
 * No URL sync — controls are local state, same pattern as CMP-013 / CMP-014.
 * ───────────────────────────────────────────────────────────────────────── */

export function Models() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  // selectedModel lives at the top so list ↔ detail view switching doesn't
  // re-mount DashboardChrome.
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  return (
    <DashboardChrome
      activeNavId="models"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      {selectedModel ? (
        <div className="flex flex-col gap-6">
          <ModelDetailPage
            model={selectedModel}
            onBack={() => setSelectedModel(null)}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <ModelsSurface onSelect={setSelectedModel} />
        </div>
      )}
    </DashboardChrome>
  );
}

/* ─── Formatting helpers ─────────────────────────────────────────────────── */

function formatContext(contextK: number, modality: Modality): string {
  if (modality === "audio") {
    return "30 min";
  }
  if (modality === "rerank") {
    return `${contextK}K`;
  }
  if (contextK >= 1000) {
    return `${(contextK / 1000).toFixed(0)}M`;
  }
  if (contextK >= 1) {
    return `${contextK}K`;
  }
  return `${Math.round(contextK * 1000)}`;
}

function formatPrice(amount: number, modality: Modality): string {
  if (amount === 0) {
    return "—";
  }
  // Audio pricing is per minute (per spec); rerank is per 1k searches.
  if (modality === "audio") {
    return formatCurrency(amount, { minFrac: 3, maxFrac: 3 }) + "/min";
  }
  if (modality === "rerank") {
    return formatCurrency(amount, { minFrac: 2, maxFrac: 2 }) + "/1k";
  }
  // 0.05 → "$0.05/M", 15 → "$15.00/M"
  return formatCurrency(amount, { minFrac: 2, maxFrac: 2 }) + "/M";
}

function formatNumeric(value: number | undefined, suffix: string): string {
  if (value === undefined || value === 0) {
    return "—";
  }
  return `${formatNumber(value)}${suffix}`;
}

function formatPriceCell(
  amount: number | undefined,
  modality: Modality
): string {
  if (amount === undefined || amount === 0) {
    return "—";
  }
  return formatPrice(amount, modality);
}

function matchesQuery(model: Model, q: string): boolean {
  if (model.name.toLowerCase().includes(q)) {
    return true;
  }
  if (model.defaultHandle.toLowerCase().includes(q)) {
    return true;
  }
  return model.offerings.some((o) => o.handle.toLowerCase().includes(q));
}

// "popular" has no telemetry in mock data — offering count is the proxy
// (more providers ≈ more demand routing through the gateway).
function sortModels(rows: Model[], sort: string): Model[] {
  const sorted = rows.slice();
  switch (sort) {
    case "cheapest":
      return sorted.sort((a, b) => minInputPrice(a) - minInputPrice(b));
    case "largest-context":
      return sorted.sort((a, b) => maxContextK(b) - maxContextK(a));
    case "popular":
      return sorted.sort((a, b) => b.offerings.length - a.offerings.length);
    case "newest":
    default:
      return sorted;
  }
}

function minInputPrice(model: Model): number {
  let min = Number.POSITIVE_INFINITY;
  for (const o of model.offerings) {
    if (o.inputPricePerM > 0 && o.inputPricePerM < min) {
      min = o.inputPricePerM;
    }
  }
  return min === Number.POSITIVE_INFINITY ? 0 : min;
}

function maxContextK(model: Model): number {
  let max = 0;
  for (const o of model.offerings) {
    if (o.contextK > max) {
      max = o.contextK;
    }
  }
  return max;
}

/* ─── Surface ────────────────────────────────────────────────────────────── */

function ModelsSurface({ onSelect }: { onSelect: (model: Model) => void }) {
  const [modality, setModality] = useState<"all" | Modality>("all");
  const [search, setSearch] = useState("");
  const [vendor, setVendor] = useState("all");
  const [provider, setProvider] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("25");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = MODELS.filter((m) => {
      if (modality !== "all" && m.modality !== modality) {
        return false;
      }
      if (vendor !== "all" && m.vendor !== vendor) {
        return false;
      }
      if (
        provider !== "all" &&
        !m.offerings.some((o) => o.provider === provider)
      ) {
        return false;
      }
      if (q && !matchesQuery(m, q)) {
        return false;
      }
      return true;
    });
    return sortModels(rows, sort);
  }, [modality, search, vendor, provider, sort]);

  const resetToFirstPage = () => setPage(1);

  const isEmpty = filtered.length === 0;

  const clearFilters = () => {
    setSearch("");
    setModality("all");
    setVendor("all");
    setProvider("all");
    resetToFirstPage();
  };

  return (
    <>
      <PageHeader modelCount={MODELS.length} providerCount={TOTAL_PROVIDERS} />

      {/* Modality tabs — promoted out of the filter-pill row so each
          modality is a visible peer scope. Underline `line` variant
          matches the Settings / Team tab register elsewhere in the
          shell. Count chip uses the shared <TabsCount> primitive. */}
      <Tabs
        className="gap-4"
        onValueChange={(v) => {
          setModality(v as "all" | Modality);
          resetToFirstPage();
        }}
        value={modality}
      >
        <TabsList className="mt-2 px-0" variant="line">
          <TabsTrigger value="all">
            All types
            <TabsCount>{MODELS.length}</TabsCount>
          </TabsTrigger>
          <TabsTrigger value="text">
            Text
            <TabsCount>{MODALITY_COUNTS.text}</TabsCount>
          </TabsTrigger>
          <TabsTrigger value="embeddings">
            Embeddings
            <TabsCount>{MODALITY_COUNTS.embeddings}</TabsCount>
          </TabsTrigger>
          <TabsTrigger value="audio">
            Audio
            <TabsCount>{MODALITY_COUNTS.audio}</TabsCount>
          </TabsTrigger>
          <TabsTrigger value="rerank">
            Rerank
            <TabsCount>{MODALITY_COUNTS.rerank}</TabsCount>
          </TabsTrigger>
        </TabsList>

        {isEmpty ? null : (
          <Toolbar
            onProviderChange={(v) => {
              setProvider(v);
              resetToFirstPage();
            }}
            onSearchChange={(v) => {
              setSearch(v);
              resetToFirstPage();
            }}
            onSortChange={(v) => {
              setSort(v);
              resetToFirstPage();
            }}
            onVendorChange={(v) => {
              setVendor(v);
              resetToFirstPage();
            }}
            provider={provider}
            search={search}
            sort={sort}
            vendor={vendor}
          />
        )}

        <Card density="flush">
          {isEmpty ? (
            <TableEmptyState
              action={
                <Button
                  className="border-border bg-card text-foreground"
                  onClick={clearFilters}
                  size="sm"
                  variant="outline"
                >
                  Clear filters
                </Button>
              }
              body="Try a broader search, a different modality, or clear the filter pills to see every routable model."
              title="No models match these filters"
            />
          ) : (
            <>
              <ModelsTable onSelect={onSelect} rows={filtered} />

              <TablePaginationFooter
                onPageChange={setPage}
                onRowsPerPageChange={setRowsPerPage}
                page={page}
                rowsPerPage={rowsPerPage}
                total={filtered.length}
              />
            </>
          )}
        </Card>
      </Tabs>

      <p className="type-copy-12 m-0 text-muted-foreground tracking-snug">
        Pass <InlineCode size="sm">claude-haiku-4-5</InlineCode> to use the
        preferred provider, or{" "}
        <InlineCode size="sm">bedrock/claude-haiku-4-5</InlineCode> to pin a
        specific one.
      </p>
    </>
  );
}

/* ─── Page header ────────────────────────────────────────────────────────── */

function PageHeader({
  modelCount,
  providerCount,
}: {
  modelCount: number;
  providerCount: number;
}) {
  return (
    <div className="flex max-w-full flex-col gap-2 xl:max-w-1/2">
      <PageTitle>Models</PageTitle>
      <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
        Route to{" "}
        <span className="text-foreground tabular-nums">{modelCount}</span>{" "}
        models across{" "}
        <span className="text-foreground tabular-nums">{providerCount}</span>{" "}
        providers, with per-provider pricing and code samples on every detail
        page.
      </p>
    </div>
  );
}

/* ─── Toolbar ────────────────────────────────────────────────────────────── */

function Toolbar({
  search,
  onSearchChange,
  vendor,
  onVendorChange,
  provider,
  onProviderChange,
  sort,
  onSortChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  vendor: string;
  onVendorChange: (v: string) => void;
  provider: string;
  onProviderChange: (v: string) => void;
  sort: string;
  onSortChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        ariaLabel="Search models"
        className="w-full min-w-0 md:w-auto md:flex-1"
        name="model-search"
        onChange={onSearchChange}
        placeholder="Search by name or handle…"
        surface="elevated"
        value={search}
      />

      <Select onValueChange={onVendorChange} value={vendor}>
        <SelectTrigger
          aria-label="Filter by vendor"
          className="min-w-0 flex-1 border-border bg-card font-normal text-foreground md:flex-none"
          size="lg"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All vendors</SelectItem>
          <SelectItem value="anthropic">Anthropic</SelectItem>
          <SelectItem value="cohere">Cohere</SelectItem>
          <SelectItem value="deepseek">DeepSeek</SelectItem>
          <SelectItem value="google">Google</SelectItem>
          <SelectItem value="meta">Meta</SelectItem>
          <SelectItem value="mistral">Mistral</SelectItem>
          <SelectItem value="openai">OpenAI</SelectItem>
          <SelectItem value="xai">xAI</SelectItem>
        </SelectContent>
      </Select>

      <Select onValueChange={onProviderChange} value={provider}>
        <SelectTrigger
          aria-label="Filter by provider"
          className="min-w-0 flex-1 border-border bg-card font-normal text-foreground md:flex-none"
          size="lg"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All providers</SelectItem>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>First-party</SelectLabel>
            <SelectItem value="anthropic">Anthropic Direct</SelectItem>
            <SelectItem value="cohere">Cohere Direct</SelectItem>
            <SelectItem value="deepseek">DeepSeek Direct</SelectItem>
            <SelectItem value="google">Google Direct</SelectItem>
            <SelectItem value="meta">Meta Direct</SelectItem>
            <SelectItem value="mistral">Mistral Direct</SelectItem>
            <SelectItem value="openai">OpenAI Direct</SelectItem>
            <SelectItem value="xai">xAI Direct</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Marketplace</SelectLabel>
            <SelectItem value="azure">Azure OpenAI</SelectItem>
            <SelectItem value="bedrock">AWS Bedrock</SelectItem>
            <SelectItem value="fireworks">Fireworks AI</SelectItem>
            <SelectItem value="groq">Groq</SelectItem>
            <SelectItem value="together">Together AI</SelectItem>
            <SelectItem value="vertex">Google Vertex</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select onValueChange={onSortChange} value={sort}>
        <SelectTrigger
          aria-label="Sort"
          className="min-w-0 flex-1 border-border bg-card font-normal text-foreground md:flex-none"
          size="sm"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="popular">Most popular</SelectItem>
          <SelectItem value="cheapest">Cheapest input</SelectItem>
          <SelectItem value="largest-context">Largest context</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

/* ─── Models table ───────────────────────────────────────────────────────── */

// Numeric columns sort on the raw underlying value of the default (head)
// offering — the same anchor the row's formatted cells render from. Output
// price of 0 ("—") sorts last via the null contract.
function modelSortValue(model: Model, key: string): string | number | null {
  const head = model.offerings[0];
  switch (key) {
    case "name":
      return model.name;
    case "handle":
      return model.defaultHandle;
    case "context":
      return head.contextK;
    case "input":
      return head.inputPricePerM || null;
    case "output":
      return head.outputPricePerM || null;
    default:
      return null;
  }
}

function ModelsTable({
  rows,
  onSelect,
}: {
  rows: Model[];
  onSelect: (model: Model) => void;
}) {
  const { sort, toggle: toggleSort } = useTableSort();
  const sortedRows = useMemo(
    () => sortRows(rows, sort, modelSortValue),
    [rows, sort]
  );
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <SortableTableHead
            className="whitespace-nowrap"
            onSort={toggleSort}
            sort={sort}
            sortKey="name"
          >
            Model
          </SortableTableHead>
          <SortableTableHead
            className="whitespace-nowrap"
            onSort={toggleSort}
            sort={sort}
            sortKey="handle"
          >
            Model ID
          </SortableTableHead>
          <SortableTableHead
            className="whitespace-nowrap"
            numeric
            onSort={toggleSort}
            sort={sort}
            sortKey="context"
          >
            Context
          </SortableTableHead>
          <SortableTableHead
            className="whitespace-nowrap"
            numeric
            onSort={toggleSort}
            sort={sort}
            sortKey="input"
          >
            Input
          </SortableTableHead>
          <SortableTableHead
            className="whitespace-nowrap"
            numeric
            onSort={toggleSort}
            sort={sort}
            sortKey="output"
          >
            Output
          </SortableTableHead>
          <TableHead className="whitespace-nowrap">Capabilities</TableHead>
          <TableHead className="whitespace-nowrap">Providers</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedRows.map((model) => {
          // Default offering is the first one — typically the vendor-direct
          // entry. Pricing in the row reflects that anchor; the modal shows
          // every provider's price alongside.
          const head = model.offerings[0];
          const inputPrice = formatPrice(head.inputPricePerM, model.modality);
          const outputPrice = formatPrice(head.outputPricePerM, model.modality);
          const context = formatContext(head.contextK, model.modality);
          return (
            <TableRow
              className="cursor-pointer transition-[background-color] duration-150 ease-out hover-fine:bg-accent motion-reduce:transition-none"
              key={model.id}
              onClick={() => onSelect(model)}
            >
              <TableCell className="max-w-[280px]">
                <RowActionButton
                  aria-label={`Inspect ${model.name}`}
                  onClick={() => onSelect(model)}
                >
                  <VendorAvatar vendor={model.vendor} />
                  <span
                    className="type-copy-14 truncate text-foreground"
                    title={model.name}
                  >
                    {model.name}
                  </span>
                </RowActionButton>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {/* Handle + CopyButton paired — matches the detail-page recipe
                    so the row's handle is one click away from the clipboard
                    without opening the model. Both targets stopPropagation
                    so the row's onClick drill-in doesn't double-fire. */}
                <span
                  className="inline-flex items-center gap-1 align-middle"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <span className="type-mono-14 select-text text-foreground">
                    {model.defaultHandle}
                  </span>
                  <CopyButton
                    ariaLabel={`Copy ${model.defaultHandle}`}
                    label="model handle"
                    size="inline-xs"
                    value={model.defaultHandle}
                  />
                </span>
              </TableCell>
              <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                {context}
              </TableCell>
              <TableCell className="type-mono-14 whitespace-nowrap text-right text-foreground">
                {inputPrice}
              </TableCell>
              <TableCell
                className={
                  outputPrice === "—"
                    ? "whitespace-nowrap text-right font-mono text-muted-foreground text-sm tabular-nums"
                    : "whitespace-nowrap text-right font-mono text-foreground text-sm tabular-nums"
                }
              >
                {outputPrice}
              </TableCell>
              <TableCell>
                <CapabilityStrip capabilities={model.capabilities} />
              </TableCell>
              <TableCell>
                <ProviderStack offerings={model.offerings} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function CapabilityStrip({ capabilities }: { capabilities: Capability[] }) {
  if (capabilities.length === 0) {
    return <span className="type-mono-12 text-muted-foreground">—</span>;
  }
  // Render in canonical order so cross-row scanning lands on the same icon
  // in the same x-slot (Vision is always leftmost when present). Each icon
  // carries `aria-label` for SR identification AND a native `title` so
  // sighted-mouse users get the capability name on hover — without
  // introducing a Tooltip primitive (the showcase doesn't ship one yet
  // and a single-purpose addition would be a primitive proliferation).
  const ordered = (() => {
    const have = new Set(capabilities);
    return CAPABILITY_ORDER.filter((c) => have.has(c));
  })();
  return (
    <div className="flex items-center gap-1">
      {ordered.map((c) => {
        const meta = CAPABILITY_META[c];
        const Icon = meta.icon;
        return (
          <span className="inline-flex shrink-0" key={c}>
            <Icon
              aria-label={meta.label}
              className="size-4 shrink-0 text-muted-foreground"
              role="img"
              strokeWidth={1.75}
            />
          </span>
        );
      })}
    </div>
  );
}

function ProviderStack({ offerings }: { offerings: ProviderOffering[] }) {
  // Deduplicate by vendor (marketplace providers w/o a Vendor identity are
  // counted in the +n overflow). First three vendor-glyphs render as an
  // overlapping stack; remainder collapses to a +N chip.
  const vendors: Vendor[] = [];
  const vendorSet = new Set<Vendor>();
  const unmappedNames: string[] = [];
  for (const o of offerings) {
    const v = PROVIDER_VENDOR[o.provider];
    if (v && !vendorSet.has(v)) {
      vendors.push(v);
      vendorSet.add(v);
    } else if (!v) {
      const meta =
        o.provider in MARKETPLACE_META
          ? MARKETPLACE_META[o.provider as keyof typeof MARKETPLACE_META]
          : null;
      if (meta) {
        unmappedNames.push(meta.label);
      }
    }
  }
  const unmappedCount = unmappedNames.length;
  const visible = vendors.slice(0, 3);
  const overflow = vendors.length - visible.length + unmappedCount;
  const totalProviders = vendors.length + unmappedCount;
  const allNames = [
    ...vendors.map((v) => VENDOR_META[v].label),
    ...unmappedNames,
  ].join(", ");
  const ariaLabel = `Available from ${totalProviders} providers: ${allNames}`;
  return (
    <div aria-label={ariaLabel} className="flex items-center gap-1" role="img">
      <div className="flex items-center">
        {visible.map((v, i) => (
          // `inline-flex items-center` on the wrapper so the inline-flex
          // VendorAvatar inside centers vertically. A plain `<span>` here
          // inherits the cell's 21px line-box and the SVG hangs from the
          // baseline instead — visibly higher than the sibling +N text.
          //
          // Stacked drop-shadows synthesize a 1px white ring around the
          // SVG paths so overlapping glyphs read as a separated stack
          // rather than a collided silhouette. (No chip wrapper — the
          // bare-icon VendorAvatar treatment is preserved.)
          <span
            className={`inline-flex items-center ${i === 0 ? "" : "-ml-1"}`}
            key={v}
            style={{
              filter:
                "drop-shadow(0 0 1.5px var(--card)) drop-shadow(0 0 1.5px var(--card))",
            }}
          >
            <VendorAvatar decorative vendor={v} />
          </span>
        ))}
      </div>
      {overflow > 0 ? (
        // h-4 matches the icon's `size-4` so items-center on the parent
        // aligns the visual middle of the glyph with the visual middle
        // of the avatar. leading-none collapses the line-box to the
        // glyph height; inline-flex centers the text inside h-4.
        <span
          aria-hidden
          className="type-mono-12 inline-flex h-4 items-center text-muted-foreground leading-none"
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}

/* ─── Detail page ────────────────────────────────────────────────────────── */

// Platform link list — names provided by the user. Hrefs are placeholders
// (design-system showcase, not a docs site). Notes are generic; per-tool
// setup paths can be filled in later when the docs are wired up.
function ModelDetailPage({
  model,
  onBack,
}: {
  model: Model;
  onBack: () => void;
}) {
  // Default offering anchors the KPI strip + hero code preview — same pattern
  // as the table row's pricing.
  const head = model.offerings[0];
  const [lang, setLang] = useState<"TypeScript" | "Python" | "cURL">(
    "TypeScript"
  );
  const [showFullDesc, setShowFullDesc] = useState(false);
  const activeLines = useMemo(() => {
    if (lang === "TypeScript") {
      return tsSnippet(model.defaultHandle, model.modality);
    }
    if (lang === "Python") {
      return pySnippet(model.defaultHandle, model.modality);
    }
    return curlSnippet(model.defaultHandle, model.modality);
  }, [lang, model.defaultHandle, model.modality]);

  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* Top utility bar — back affordance only for now. */}
      <div className="flex items-center justify-between gap-4">
        <TextLink
          aria-label="Back to Models"
          className="type-copy-14 inline-flex items-center gap-1 transition-colors duration-150 ease-out motion-reduce:transition-none"
          onClick={onBack}
        >
          <ChevronLeft
            aria-hidden="true"
            className="size-4 shrink-0"
            strokeWidth={1.75}
          />
          Models
        </TextLink>
      </div>

      {/* Hero — logo + H2 inline, then handle / capabilities / description.
          The old vendor-eyebrow tier was removed 2026-05-16 (Eyebrow rule:
          only nav + KPI tiles); the model handle below (`anthropic/claude-sonnet-4.8`)
          still encodes the vendor for anyone scanning, and the avatar's
          sr-only label fires now that there's no adjacent eyebrow text
          to double-announce. */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <VendorAvatar size="md" vendor={model.vendor} />
            {/* Scaled down from text-3xl/9 (32px) → text-xl (20px). The
                page-level h1 ("Models") on ArtboardHeader and the
                breadcrumb already carry the model name, so a third
                32px appearance over-anchors identity. */}
            <h2 className="type-heading-20 m-0 text-foreground">
              {model.name}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="type-mono-14 text-foreground">
              {model.defaultHandle}
            </span>
            <CopyButton
              ariaLabel={`Copy ${model.defaultHandle}`}
              label="model handle"
              size="inline-xs"
              value={model.defaultHandle}
            />
          </div>
        </div>

        {model.capabilities.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {CAPABILITY_ORDER.filter((c) => model.capabilities.includes(c)).map(
              (c) => {
                const meta = CAPABILITY_META[c];
                const Icon = meta.icon;
                return (
                  <Badge className="h-6" key={c} variant="neutral">
                    <Icon aria-hidden="true" data-icon="inline-start" />
                    {meta.label}
                  </Badge>
                );
              }
            )}
          </div>
        ) : null}

        <div className="flex max-w-[75ch] flex-col gap-1">
          <p
            className={cn(
              // text-pretty would only take effect once line-clamp is off
              // (line-clamp uses -webkit-box, which short-circuits text-wrap).
              // Apply it conditionally so the rule is only present where it
              // can actually do work.
              "m-0 font-sans text-base text-foreground",
              showFullDesc ? "text-pretty" : "line-clamp-3"
            )}
            id="model-description"
          >
            {model.description}
          </p>
          <TextLink
            aria-controls="model-description"
            aria-expanded={showFullDesc}
            className="type-copy-14 group inline-flex w-fit items-center gap-1 hover:text-foreground focus-visible:text-foreground"
            onClick={() => setShowFullDesc((v) => !v)}
          >
            {showFullDesc ? "Show less" : "Show more"}
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 ease-out group-hover:text-foreground motion-reduce:transition-none",
                showFullDesc && "rotate-180"
              )}
              strokeWidth={1.75}
            />
          </TextLink>
        </div>
      </div>

      {/* KPI strip — locked recipe from prior modal. */}
      <ModelKpiRail head={head} model={model} />

      {/* Providers */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="type-heading-16 m-0 text-foreground">Providers</h3>
          <p className="type-copy-14 m-0 text-muted-foreground">
            Route messages across multiple providers. Copy a provider handle to
            pin a specific one.
          </p>
        </div>
        <ProvidersTable model={model} />
      </section>

      {/* Quick start + Example request — two-column grid (24px gap),
          stacks below lg. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="type-heading-16 m-0 text-foreground">Quick start</h3>
            <p className="type-copy-14 m-0 text-pretty text-muted-foreground">
              Point your tool at the gateway base URL{" "}
              <span className="inline-flex items-center gap-1 align-middle">
                <InlineCode size="sm">
                  https://gateway-staging.constellationgate.ai
                </InlineCode>
                <CopyButton
                  label="base URL"
                  size="inline-xs"
                  value="https://gateway-staging.constellationgate.ai"
                />
              </span>{" "}
              and authenticate with your gateway key (
              <InlineCode size="sm">sk-gw-…</InlineCode>). Pick a tool below for
              the exact configuration.
            </p>
          </div>
          {/* Per-tool terminal/CLI config. Shared with the PAYG Manual setup
            page via <PaygToolConfigCard>. */}
          <PaygToolConfigCard handle={model.defaultHandle} />
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="type-heading-16 m-0 text-foreground">
              Example request
            </h3>
            <p className="type-copy-14 m-0 text-muted-foreground">
              Once your client is pointed at the gateway, you can send this to
              make your first call and confirm everything works. The model ID is
              already filled in. Just add your API key and run it.
            </p>
          </div>
          {/* Mirrors the Quick start card on the left: flush Card chrome, line
            tabs, a 208px scroll area, and a floating Copy button bottom-right
            (no grey header strip, no caption row). */}
          <Card className="relative" density="flush">
            <Tabs
              className="flex flex-col gap-0"
              onValueChange={(v) =>
                setLang(v as "TypeScript" | "Python" | "cURL")
              }
              value={lang}
            >
              <div className="flex items-center border-border border-b px-4">
                <TabsList className="h-12 border-b-0 px-0" variant="line">
                  <TabsTrigger value="TypeScript">
                    <img
                      alt=""
                      aria-hidden
                      className="size-4"
                      src="/icons/languages/typescript.svg"
                    />
                    TypeScript
                  </TabsTrigger>
                  <TabsTrigger value="Python">
                    <img
                      alt=""
                      aria-hidden
                      className="size-4"
                      src="/icons/languages/python.svg"
                    />
                    Python
                  </TabsTrigger>
                  <TabsTrigger value="cURL">
                    <img
                      alt=""
                      aria-hidden
                      className="h-4 w-auto"
                      src="/icons/languages/curl.svg"
                    />
                    cURL
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="h-[256px] overflow-y-auto">
                <CodeBlock density="compact" lines={activeLines} />
              </div>
            </Tabs>
            <div className="absolute right-4 bottom-4">
              <CopyButton
                className="shadow-sm"
                label={`${lang} snippet`}
                mode="label"
                size="sm"
                text="Copy code"
                value={linesToString(activeLines)}
              />
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}

function ModelKpiRail({
  model,
  head,
}: {
  model: Model;
  head: ProviderOffering;
}) {
  return (
    <KpiRailShell columns={4}>
      <ModelKpiTile
        label="Context"
        value={formatContext(head.contextK, model.modality)}
      />
      <ModelKpiTile
        label="Max output"
        value={head.maxOutputK === 0 ? "—" : `${head.maxOutputK}K`}
      />
      <ModelKpiTile
        label="Input"
        value={formatPrice(head.inputPricePerM, model.modality)}
      />
      <ModelKpiTile
        label="Output"
        value={
          head.outputPricePerM === 0
            ? "—"
            : formatPrice(head.outputPricePerM, model.modality)
        }
      />
    </KpiRailShell>
  );
}

function ModelKpiTile({ label, value }: { label: string; value: string }) {
  // HeroNumeric default = 24px sans tabular — the locked recipe for KPI
  // values ≥24px. Sub-20px numerics elsewhere stay mono. Padding `p-4`
  // matches the 16px card-padding rule (CompactKpi primitive).
  const isMissing = value === "—";
  return (
    <div className="flex flex-col gap-1 p-4">
      <Eyebrow>{label}</Eyebrow>
      {isMissing ? (
        <HeroNumeric className="text-muted-foreground">
          <span aria-hidden="true">—</span>
          <span className="sr-only">Not available</span>
        </HeroNumeric>
      ) : (
        <HeroNumeric>{value}</HeroNumeric>
      )}
    </div>
  );
}

// Numeric columns sort on the raw offering value; undefined/0 (rendered as
// "—") sorts last via the null contract.
function offeringSortValue(
  o: ProviderOffering,
  key: string
): string | number | null {
  switch (key) {
    case "provider":
      return PROVIDER_LABELS[o.provider];
    case "context":
      return o.contextK || null;
    case "latency":
      return o.latencyP50Ms || null;
    case "throughput":
      return o.throughputTps || null;
    case "input":
      return o.inputPricePerM || null;
    case "output":
      return o.outputPricePerM || null;
    case "cacheRead":
      return o.cacheReadPerM ?? null;
    case "cacheWrite":
      return o.cacheWritePerM ?? null;
    default:
      return null;
  }
}

function ProvidersTable({ model }: { model: Model }) {
  const { sort, toggle: toggleSort } = useTableSort();
  const sortedOfferings = useMemo(
    () => sortRows(model.offerings, sort, offeringSortValue),
    [model.offerings, sort]
  );
  return (
    <Card density="flush">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SortableTableHead
              className="whitespace-nowrap"
              onSort={toggleSort}
              sort={sort}
              sortKey="provider"
            >
              Provider
            </SortableTableHead>
            <SortableTableHead
              className="whitespace-nowrap"
              numeric
              onSort={toggleSort}
              sort={sort}
              sortKey="context"
            >
              Context
            </SortableTableHead>
            <SortableTableHead
              className="whitespace-nowrap"
              numeric
              onSort={toggleSort}
              sort={sort}
              sortKey="latency"
            >
              Latency P50
            </SortableTableHead>
            <SortableTableHead
              className="whitespace-nowrap"
              numeric
              onSort={toggleSort}
              sort={sort}
              sortKey="throughput"
            >
              Throughput
            </SortableTableHead>
            <SortableTableHead
              className="whitespace-nowrap"
              numeric
              onSort={toggleSort}
              sort={sort}
              sortKey="input"
            >
              Input
            </SortableTableHead>
            <SortableTableHead
              className="whitespace-nowrap"
              numeric
              onSort={toggleSort}
              sort={sort}
              sortKey="output"
            >
              Output
            </SortableTableHead>
            <SortableTableHead
              className="whitespace-nowrap"
              numeric
              onSort={toggleSort}
              sort={sort}
              sortKey="cacheRead"
            >
              Cache read
            </SortableTableHead>
            <SortableTableHead
              className="whitespace-nowrap"
              numeric
              onSort={toggleSort}
              sort={sort}
              sortKey="cacheWrite"
            >
              Cache write
            </SortableTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedOfferings.map((o) => (
            <TableRow className="hover:bg-transparent" key={o.handle}>
              <TableCell>
                <div className="flex min-w-0 items-center gap-2">
                  <ProviderMark provider={o.provider} />
                  <span
                    className="type-copy-14 truncate text-foreground"
                    title={PROVIDER_LABELS[o.provider]}
                  >
                    {PROVIDER_LABELS[o.provider]}
                  </span>
                  <CopyButton
                    ariaLabel={`Copy ${o.handle}`}
                    label="provider handle"
                    size="inline-xs"
                    value={o.handle}
                  />
                </div>
              </TableCell>
              <ProviderNumeric
                value={formatContext(o.contextK, model.modality)}
              />
              <ProviderNumeric value={formatNumeric(o.latencyP50Ms, "ms")} />
              <ProviderNumeric
                value={
                  o.throughputTps === undefined || o.throughputTps === 0
                    ? "—"
                    : `${formatNumber(o.throughputTps)} t/s`
                }
              />
              <ProviderNumeric
                value={formatPrice(o.inputPricePerM, model.modality)}
              />
              <ProviderNumeric
                value={
                  o.outputPricePerM === 0
                    ? "—"
                    : formatPrice(o.outputPricePerM, model.modality)
                }
              />
              <ProviderNumeric
                value={formatPriceCell(o.cacheReadPerM, model.modality)}
              />
              <ProviderNumeric
                value={formatPriceCell(o.cacheWritePerM, model.modality)}
              />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function ProviderMark({ provider }: { provider: ProviderId }) {
  if (provider in VENDOR_META) {
    return <VendorAvatar decorative vendor={provider as Vendor} />;
  }
  if (provider in MARKETPLACE_META) {
    return (
      <MarketplaceAvatar
        decorative
        provider={provider as MarketplaceProvider}
      />
    );
  }
  // Fallback for providers that aren't yet mapped in either meta table.
  // Renders an neutral-400 placeholder dot so the row keeps its leading-glyph
  // slot (cross-row scanning lands on the same x position) and the
  // PROVIDER_LABELS text still anchors identification.
  return (
    <span
      aria-hidden
      className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
      title={PROVIDER_LABELS[provider]}
    >
      <span className="size-2 rounded-full bg-muted-foreground" />
    </span>
  );
}

function ProviderNumeric({ value }: { value: string }) {
  const isMissing = value === "—";
  return (
    <TableCell
      className={
        isMissing
          ? "whitespace-nowrap text-right font-mono text-muted-foreground text-sm tabular-nums"
          : "whitespace-nowrap text-right font-mono text-foreground text-sm tabular-nums"
      }
    >
      {isMissing ? (
        <>
          <span aria-hidden="true">—</span>
          <span className="sr-only">Not available</span>
        </>
      ) : (
        value
      )}
    </TableCell>
  );
}

/* ─── Code samples ───────────────────────────────────────────────────────── */

function endpointFor(modality: Modality): string {
  switch (modality) {
    case "embeddings":
      return "/v1/embeddings";
    case "audio":
      return "/v1/audio/transcriptions";
    case "rerank":
      return "/v1/rerank";
    case "text":
      return "/v1/chat/completions";
  }
}

type Lang = "ts" | "py" | "bash";

const STRING_TOKEN_RE = /^(['"`])((?:\\.|(?!\1).)*)\1/;
const TMPL_TOKEN_RE = /^\$\{[^}]+\}/;
const ENV_VAR_RE = /^\$[A-Z_][A-Z0-9_]*/;
const WORD_BOUNDARY_RE = /\w/;
const NUMBER_TOKEN_RE = /^\d+(\.\d+)?/;
const PROP_TOKEN_RE = /^[A-Za-z_]\w*(?=:[\s"'[{])/;

const KEYWORDS: Record<Lang, RegExp> = {
  ts: /^(import|from|const|let|var|new|await|return|function|null|true|false)\b/,
  py: /^(import|from|with|as|def|return|None|True|False|in|not|and|or|is|for|if|else)\b/,
  bash: /^(curl)\b/,
};

// Greedy left-to-right tokenizer per line. Patterns tried in order; whichever
// matches at the cursor wins. Unmatched chars accumulate as `default`. Strings
// are matched whole (including any `${…}` interpolations inside) — token-level
// interpolation parsing isn't worth the complexity for these snippets.
function tokenizeLine(line: string, lang: Lang): CodeLine {
  const tokens: CodeToken[] = [];
  let pending = "";
  const flushPending = () => {
    if (pending) {
      tokens.push({ text: pending });
      pending = "";
    }
  };
  let i = 0;
  while (i < line.length) {
    const sub = line.slice(i);

    // Strings — single, double, backtick — greedy through closing quote.
    const stringMatch = STRING_TOKEN_RE.exec(sub);
    if (stringMatch) {
      flushPending();
      tokens.push({ text: stringMatch[0], tone: "string" });
      i += stringMatch[0].length;
      continue;
    }

    // Variable substitution `${...}` (TS template).
    const tmplMatch = TMPL_TOKEN_RE.exec(sub);
    if (tmplMatch) {
      flushPending();
      tokens.push({ text: tmplMatch[0], tone: "variable" });
      i += tmplMatch[0].length;
      continue;
    }

    // Bash $VAR.
    const envMatch = ENV_VAR_RE.exec(sub);
    if (envMatch) {
      flushPending();
      tokens.push({ text: envMatch[0], tone: "variable" });
      i += envMatch[0].length;
      continue;
    }

    // Keyword (must be at a word boundary — only fire when previous char is
    // non-word).
    const prev = i === 0 ? "" : line[i - 1];
    if (!WORD_BOUNDARY_RE.test(prev)) {
      const kwMatch = KEYWORDS[lang].exec(sub);
      if (kwMatch) {
        flushPending();
        tokens.push({ text: kwMatch[0], tone: "keyword" });
        i += kwMatch[0].length;
        continue;
      }
    }

    // Number literal at word boundary.
    if (!WORD_BOUNDARY_RE.test(prev)) {
      const numMatch = NUMBER_TOKEN_RE.exec(sub);
      if (numMatch) {
        flushPending();
        tokens.push({ text: numMatch[0], tone: "number" });
        i += numMatch[0].length;
        continue;
      }
    }

    // JSON / JS object property — identifier directly before `:` followed by
    // space or end. Excludes URL schemes (`https://…`) since `:` is followed
    // by `/`.
    if (!WORD_BOUNDARY_RE.test(prev)) {
      const propMatch = PROP_TOKEN_RE.exec(sub);
      if (propMatch) {
        flushPending();
        tokens.push({ text: propMatch[0], tone: "property" });
        i += propMatch[0].length;
        continue;
      }
    }

    pending += line[i];
    i++;
  }
  flushPending();
  return tokens;
}

function tokenize(src: string, lang: Lang): CodeLine[] {
  return src.split("\n").map((line) => tokenizeLine(line, lang));
}

/* ── Quick start: per-tool agent configuration (PAYG) ───────────────────────
 * Shared snippets live in DashboardDefault.paygConfigSnippet — keep in sync. */

export function PaygToolConfigCard({ handle }: { handle: string }) {
  const [tool, setTool] = useState<PaygToolId>("claude-code");
  return (
    <Card className="relative" density="flush">
      <Tabs
        className="flex flex-col gap-0"
        onValueChange={(v) => setTool(v as PaygToolId)}
        value={tool}
      >
        <div className="flex items-center border-border border-b px-4">
          <TabsList className="h-12 border-b-0 px-0" variant="line">
            <TabsTrigger value="claude-code">
              <AnthropicIcon className="size-4" />
              Claude Code
            </TabsTrigger>
            <TabsTrigger value="codex">
              <OpenAIIcon className="size-4" />
              Codex
            </TabsTrigger>
            <TabsTrigger value="hermes">
              <Bot aria-hidden className="size-4" />
              Hermes
            </TabsTrigger>
            <TabsTrigger value="openclaw">
              <img
                alt=""
                aria-hidden
                className="size-4"
                src="/icons/providers/openclaw.svg"
              />
              OpenClaw
            </TabsTrigger>
          </TabsList>
        </div>
        <div className="flex h-10 items-center border-border border-b px-4">
          <span className="type-copy-12 text-muted-foreground">
            {PAYG_TOOL_CAPTIONS[tool]}
          </span>
        </div>
        <div className="h-[216px] overflow-y-auto">
          <CodePanel snippet={paygConfigSnippet(tool, handle)} />
        </div>
      </Tabs>
      <div className="absolute right-4 bottom-4">
        <CopyButton
          className="shadow-sm"
          label="setup"
          mode="label"
          size="sm"
          text="Copy code"
          value={paygConfigSnippet(tool, handle)}
        />
      </div>
    </Card>
  );
}

function tsSnippet(handle: string, modality: Modality): CodeLine[] {
  if (modality === "embeddings") {
    return tokenize(
      `import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://gateway.constellationgate.ai/v1',
  apiKey: process.env.CONSTELLATION_API_KEY,
});

const result = await client.embeddings.create({
  model: '${handle}',
  input: 'The quick brown fox jumps over the lazy dog.',
});`,
      "ts"
    );
  }
  if (modality === "audio") {
    return tokenize(
      `import OpenAI from 'openai';
import fs from 'fs';

const client = new OpenAI({
  baseURL: 'https://gateway.constellationgate.ai/v1',
  apiKey: process.env.CONSTELLATION_API_KEY,
});

const transcript = await client.audio.transcriptions.create({
  model: '${handle}',
  file: fs.createReadStream('audio.mp3'),
});`,
      "ts"
    );
  }
  if (modality === "rerank") {
    return tokenize(
      `const res = await fetch('https://gateway.constellationgate.ai/v1/rerank', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${process.env.CONSTELLATION_API_KEY}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: '${handle}',
    query: 'What is the capital of France?',
    documents: ['Paris is the capital.', 'Berlin is in Germany.'],
  }),
});`,
      "ts"
    );
  }
  return tokenize(
    `const res = await fetch('https://gateway-staging.constellationgate.ai/v1/messages', {
  method: 'POST',
  headers: {
    'x-gate-api-key': process.env.GATEWAY_KEY!,
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    model: '${handle}',
    messages: [{ role: 'user', content: 'Hello!' }],
    provider: 'openai_compatible',
  }),
});`,
    "ts"
  );
}

function pySnippet(handle: string, modality: Modality): CodeLine[] {
  if (modality === "embeddings") {
    return tokenize(
      `from openai import OpenAI

client = OpenAI(
    base_url="https://gateway.constellationgate.ai/v1",
    api_key=os.environ["CONSTELLATION_API_KEY"],
)

result = client.embeddings.create(
    model="${handle}",
    input="The quick brown fox jumps over the lazy dog.",
)`,
      "py"
    );
  }
  if (modality === "audio") {
    return tokenize(
      `from openai import OpenAI

client = OpenAI(
    base_url="https://gateway.constellationgate.ai/v1",
    api_key=os.environ["CONSTELLATION_API_KEY"],
)

with open("audio.mp3", "rb") as f:
    transcript = client.audio.transcriptions.create(
        model="${handle}",
        file=f,
    )`,
      "py"
    );
  }
  if (modality === "rerank") {
    return tokenize(
      `import os, requests

res = requests.post(
    "https://gateway.constellationgate.ai/v1/rerank",
    headers={"Authorization": f"Bearer {os.environ['CONSTELLATION_API_KEY']}"},
    json={
        "model": "${handle}",
        "query": "What is the capital of France?",
        "documents": ["Paris is the capital.", "Berlin is in Germany."],
    },
)`,
      "py"
    );
  }
  return tokenize(
    `import os, requests

res = requests.post(
    "https://gateway-staging.constellationgate.ai/v1/messages",
    headers={
        "x-gate-api-key": os.environ["GATEWAY_KEY"],
        "content-type": "application/json",
    },
    json={
        "model": "${handle}",
        "messages": [{"role": "user", "content": "Hello!"}],
        "provider": "openai_compatible",
    },
)`,
    "py"
  );
}

function curlSnippet(handle: string, modality: Modality): CodeLine[] {
  const endpoint = endpointFor(modality);
  if (modality === "embeddings") {
    return tokenize(
      `curl https://gateway.constellationgate.ai${endpoint} \\
  -H "Authorization: Bearer $CONSTELLATION_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${handle}",
    "input": "The quick brown fox jumps over the lazy dog."
  }'`,
      "bash"
    );
  }
  if (modality === "audio") {
    return tokenize(
      `curl https://gateway.constellationgate.ai${endpoint} \\
  -H "Authorization: Bearer $CONSTELLATION_API_KEY" \\
  -F model="${handle}" \\
  -F file="@audio.mp3"`,
      "bash"
    );
  }
  if (modality === "rerank") {
    return tokenize(
      `curl https://gateway.constellationgate.ai${endpoint} \\
  -H "Authorization: Bearer $CONSTELLATION_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${handle}",
    "query": "What is the capital of France?",
    "documents": ["Paris is the capital.", "Berlin is in Germany."]
  }'`,
      "bash"
    );
  }
  return tokenize(
    `curl https://gateway-staging.constellationgate.ai/v1/messages \\
  -H "x-gate-api-key: $GATEWAY_KEY" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "${handle}",
    "messages": [{"role": "user", "content": "Hello!"}],
    "provider": "openai_compatible"
  }'`,
    "bash"
  );
}
