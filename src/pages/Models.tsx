import { Bot, ChevronDown, ChevronLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { AnthropicIcon, OpenAIIcon } from "@/components/icons/model-providers";
import { ProviderAvatar, VendorAvatar } from "@/components/icons/vendor-avatar";
import { PROVIDER_META, PROVIDER_ORDER } from "@/components/icons/vendor-meta";
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
  SelectItem,
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
  EM_DASH,
  formatPricePerM,
  formatTokenCount,
  hasTelemetry,
  listPrice,
  MODALITY_COUNTS,
  MODELS,
  type Modality,
  type Model,
  type ModelProvider,
  type ModelSort,
  providerHandle,
  providerPrice,
  sortModels,
  TOTAL_PROVIDERS,
} from "@/data/models";
import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { formatNumber, linesToString } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  PAYG_TOOL_CAPTIONS,
  type PaygToolId,
  paygConfigSnippet,
} from "@/pages/payg-config";

/* ─────────────────────────────────────────────────────────────────────────
 * CMP-016 — Models
 *
 * Operational catalog of every model routable through the gateway. The page
 * is a routing-config tool, not a marketplace: surface capabilities, context,
 * pricing, and which providers serve each model. No status column (every
 * model is "available" — health belongs on a separate surface).
 *
 * REBUILT 2026-08-03 against the production build. The catalog, the provider
 * set, the filter chrome, and the sort options are all prod's, sourced from
 * `GET /api/v1/available-models` — see the header of `data/models.ts`. What
 * changed structurally:
 *   · 14 invented providers → the 3 real ones, as ONE flat list. Prod has no
 *     First-party / Marketplace grouping, so the grouped <SelectGroup> chrome
 *     is gone with it.
 *   · The "All vendors" filter is REMOVED. Prod has no such control.
 *   · Tabs are All types + Text. Embeddings / Audio / Rerank went with the
 *     invented catalog; no model in prod's is anything but text.
 *   · Sort gained Newest / Cheapest input / Largest context alongside the
 *     default Most popular, and all four actually sort (see sortModels).
 *
 * Filtering: search (name + id + per-provider native id), provider, and sort
 * are wired to the in-memory MODELS list. No URL sync — controls are local
 * state, same pattern as CMP-013 / CMP-014.
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
            // Remount on id change so no state from a previously inspected
            // model (expanded description, column sort) can leak into the
            // next one. Detail parity is per-model.
            key={selectedModel.id}
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

/* ─── Filtering helpers ──────────────────────────────────────────────────── */

function matchesQuery(model: Model, q: string): boolean {
  if (model.name.toLowerCase().includes(q)) {
    return true;
  }
  if (model.id.toLowerCase().includes(q)) {
    return true;
  }
  return model.providers.some((p) => p.nativeModelId.toLowerCase().includes(q));
}

/* ─── Surface ────────────────────────────────────────────────────────────── */

function ModelsSurface({ onSelect }: { onSelect: (model: Model) => void }) {
  const [modality, setModality] = useState<"all" | Modality>("all");
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState("all");
  const [sort, setSort] = useState<ModelSort>("popular");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("25");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = MODELS.filter((m) => {
      if (modality !== "all" && m.modality !== modality) {
        return false;
      }
      if (provider !== "all" && !m.providers.some((p) => p.id === provider)) {
        return false;
      }
      if (q && !matchesQuery(m, q)) {
        return false;
      }
      return true;
    });
    return sortModels(rows, sort);
  }, [modality, search, provider, sort]);

  const resetToFirstPage = () => setPage(1);

  const isEmpty = filtered.length === 0;

  const clearFilters = () => {
    setSearch("");
    setModality("all");
    setProvider("all");
    resetToFirstPage();
  };

  return (
    <>
      <PageHeader modelCount={MODELS.length} providerCount={TOTAL_PROVIDERS} />

      {/* Modality tabs — promoted out of the filter-pill row so each
          modality is a visible peer scope. Underline `line` variant
          matches the Settings / Team tab register elsewhere in the
          shell. Count chip uses the shared <TabsCount> primitive.
          Two tabs, because prod has two: every model is text. */}
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
            provider={provider}
            search={search}
            sort={sort}
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
              body="Try a broader search, a different type, or clear the filters to see every routable model."
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
        <InlineCode size="sm">openrouter/claude-haiku-4-5</InlineCode> to pin a
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
    <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
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
  provider,
  onProviderChange,
  sort,
  onSortChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  provider: string;
  onProviderChange: (v: string) => void;
  sort: ModelSort;
  onSortChange: (v: ModelSort) => void;
}) {
  return (
    /* Container queries, not viewport ones — same conversion as
       RequestsTable. `<main>` declares `@container`, so `@2xl:` (672px
       inline-size) reads the column the toolbar lives in rather than the
       window, which the Ask AI panel narrows without touching. Below it:
       search full-width on row 1, the two Selects splitting row 2 evenly
       via `min-w-0 flex-1`. */
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        ariaLabel="Search models"
        className="@2xl:w-auto w-full min-w-0 @2xl:flex-1"
        name="model-search"
        onChange={onSearchChange}
        placeholder="Search by name or handle…"
        surface="elevated"
        value={search}
      />

      {/* Flat list. The dropdown uses `filterLabel`, which is why Alibaba
          reads "Alibaba Direct" here and plain "Alibaba" in a row tooltip —
          both strings are prod's. */}
      <Select onValueChange={onProviderChange} value={provider}>
        <SelectTrigger
          aria-label="Filter by provider"
          className="min-w-0 @2xl:flex-none flex-1 border-border bg-card text-foreground"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All providers</SelectItem>
          {PROVIDER_ORDER.map((id) => (
            <SelectItem key={id} value={id}>
              {PROVIDER_META[id].filterLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select onValueChange={(v) => onSortChange(v as ModelSort)} value={sort}>
        <SelectTrigger
          aria-label="Sort"
          className="min-w-0 @2xl:flex-none flex-1 border-border bg-card text-foreground"
          size="sm"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="popular">Most popular</SelectItem>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="cheapest">Cheapest input</SelectItem>
          <SelectItem value="largest-context">Largest context</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

/* ─── Models table ───────────────────────────────────────────────────────── */

// Column sort runs on the raw underlying value, not the formatted string, so
// "1M" and "1.0M" order by their real 1,000,000 vs 1,048,576. Null context
// and null prices sort last via the null contract in `sortRows`.
function modelSortValue(model: Model, key: string): string | number | null {
  switch (key) {
    case "name":
      return model.name;
    case "handle":
      return model.id;
    case "context":
      return model.contextWindow;
    case "input":
      return listPrice(model, "inputPer1M");
    case "output":
      return listPrice(model, "outputPer1M");
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
          // Context and price are per-MODEL in prod, not per-provider: the
          // gateway quotes one list price and each provider row on the detail
          // page marks it up. So the row reads straight off the model.
          const context = formatTokenCount(model.contextWindow);
          const inputPrice = formatPricePerM(listPrice(model, "inputPer1M"));
          const outputPrice = formatPricePerM(listPrice(model, "outputPer1M"));
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
                    className="type-label-14 truncate text-foreground"
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
                    {model.id}
                  </span>
                  <CopyButton
                    ariaLabel={`Copy ${model.id}`}
                    label="model handle"
                    size="inline-xs"
                    value={model.id}
                  />
                </span>
              </TableCell>
              <NumericCell value={context} />
              <NumericCell value={inputPrice} />
              <NumericCell value={outputPrice} />
              <TableCell>
                <CapabilityStrip capabilities={model.capabilities} />
              </TableCell>
              <TableCell>
                <ProviderStack providers={model.providers} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/** Right-aligned mono numeric cell. An em dash is a real state here (Qwen3
 *  Next reports no context window; most provider rows have no telemetry yet),
 *  so it recedes to muted and carries an sr-only explanation rather than
 *  announcing as bare punctuation. */
function NumericCell({ value }: { value: string }) {
  const isMissing = value === EM_DASH;
  return (
    <TableCell
      className={cn(
        "type-mono-14 whitespace-nowrap text-right",
        isMissing ? "text-muted-foreground" : "text-foreground"
      )}
    >
      {isMissing ? (
        <>
          <span aria-hidden="true">{EM_DASH}</span>
          <span className="sr-only">Not available</span>
        </>
      ) : (
        value
      )}
    </TableCell>
  );
}

function CapabilityStrip({ capabilities }: { capabilities: Capability[] }) {
  if (capabilities.length === 0) {
    return (
      <span className="type-mono-12 text-muted-foreground">{EM_DASH}</span>
    );
  }
  // Render in canonical order so cross-row scanning lands on the same icon
  // in the same x-slot (Tool use is always leftmost when present). Each icon
  // carries `aria-label` for SR identification AND a native `title` so
  // sighted-mouse users get the capability name on hover — without
  // introducing a Tooltip primitive.
  const have = new Set(capabilities);
  const ordered = CAPABILITY_ORDER.filter((c) => have.has(c));
  return (
    <div className="flex items-center gap-1">
      {ordered.map((c) => {
        const meta = CAPABILITY_META[c];
        const Icon = meta.icon;
        return (
          <span className="inline-flex shrink-0" key={c} title={meta.label}>
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

function ProviderStack({ providers }: { providers: ModelProvider[] }) {
  // Order is the model's OWN provider order, straight from the API — it
  // varies row to row (Qwen leads with Alibaba, most Anthropic rows lead
  // with Vertex, the Gemini rows lead with OpenRouter) and the label reads
  // in that same order, exactly like prod.
  const names = providers.map((p) => PROVIDER_META[p.id].label);
  const ariaLabel = `Available from ${providers.length} providers: ${names.join(", ")}`;
  return (
    <div aria-label={ariaLabel} className="flex items-center gap-2" role="img">
      {providers.map((p) => (
        // `inline-flex items-center` on the wrapper so the inline-flex
        // ProviderAvatar inside centers vertically. A plain `<span>` here
        // inherits the cell's 21px line-box and the SVG hangs from the
        // baseline instead — visibly higher than its siblings.
        //
        // The marks sit on an 8px gap and do NOT overlap. They were a
        // `-ml-1` stack until 2026-08-03, with two stacked drop-shadows
        // synthesizing a card-colored ring so the collided silhouettes stayed
        // legible. Separating them makes the ring unnecessary, so both the
        // negative margin and the filter are gone rather than left inert.
        <span className="inline-flex items-center" key={p.id}>
          <ProviderAvatar decorative provider={p.id} />
        </span>
      ))}
    </div>
  );
}

/* ─── Detail page ────────────────────────────────────────────────────────── */

function ModelDetailPage({
  model,
  onBack,
}: {
  model: Model;
  onBack: () => void;
}) {
  const [lang, setLang] = useState<"TypeScript" | "Python" | "cURL">(
    "TypeScript"
  );
  const [showFullDesc, setShowFullDesc] = useState(false);
  const activeLines = useMemo(() => {
    if (lang === "TypeScript") {
      return tsSnippet(model.id);
    }
    if (lang === "Python") {
      return pySnippet(model.id);
    }
    return curlSnippet(model.id);
  }, [lang, model.id]);

  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* Top utility bar — back affordance only for now. */}
      <div className="flex items-center justify-between gap-4">
        <TextLink
          aria-label="Back to Models"
          className="type-label-14 inline-flex items-center gap-1 transition-colors duration-150 ease-out motion-reduce:transition-none"
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
          The vendor-eyebrow tier was removed 2026-05-16 (Eyebrow rule: only
          nav + KPI tiles); the model id below still encodes the vendor for
          anyone scanning, and the avatar's sr-only label fires now that
          there's no adjacent eyebrow text to double-announce. */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <VendorAvatar size="md" vendor={model.vendor} />
            {/* 20px, not 32px: the page-level h1 ("Models") and the back
                link already carry the model name, so a third 32px
                appearance over-anchors identity. */}
            <h2 className="type-heading-20 m-0 text-foreground">
              {model.name}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="type-mono-14 text-foreground">{model.id}</span>
            <CopyButton
              ariaLabel={`Copy ${model.id}`}
              label="model handle"
              size="inline-xs"
              value={model.id}
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
              // (line-clamp uses -webkit-box, which short-circuits
              // text-wrap). Apply it conditionally so the rule is only
              // present where it can actually do work. `whitespace-pre-line`
              // preserves the paragraph breaks prod's descriptions carry.
              "m-0 whitespace-pre-line font-sans text-base text-foreground",
              showFullDesc ? "text-pretty" : "line-clamp-3"
            )}
            id="model-description"
          >
            {model.description}
          </p>
          <TextLink
            aria-controls="model-description"
            aria-expanded={showFullDesc}
            className="type-label-14 group inline-flex w-fit items-center gap-1 hover:text-foreground focus-visible:text-foreground"
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

      {/* KPI strip — locked 4-tile recipe. */}
      <ModelKpiRail model={model} />

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
        {hasTelemetry(model) ? null : (
          <p className="type-copy-12 m-0 text-muted-foreground">
            No telemetry yet. Call this model to populate latency and
            throughput.
          </p>
        )}
      </section>

      {/* Quick start + Example request — two-column grid (24px gap),
          stacks below lg. */}
      <div className="grid @3xl:grid-cols-2 grid-cols-1 gap-6">
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
          <PaygToolConfigCard handle={model.id} />
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
            tabs, a scroll area, and a floating Copy button bottom-right. */}
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

function ModelKpiRail({ model }: { model: Model }) {
  return (
    <KpiRailShell columns={4}>
      <ModelKpiTile
        label="Context"
        value={formatTokenCount(model.contextWindow)}
      />
      <ModelKpiTile
        label="Max output"
        value={formatTokenCount(model.maxOutputTokens)}
      />
      <ModelKpiTile
        label="Input"
        value={formatPricePerM(listPrice(model, "inputPer1M"))}
      />
      <ModelKpiTile
        label="Output"
        value={formatPricePerM(listPrice(model, "outputPer1M"))}
      />
    </KpiRailShell>
  );
}

function ModelKpiTile({ label, value }: { label: string; value: string }) {
  // HeroNumeric default = 24px sans tabular — the locked recipe for KPI
  // values ≥24px. Sub-20px numerics elsewhere stay mono. Padding `p-4`
  // matches the 16px card-padding rule (CompactKpi primitive).
  const isMissing = value === EM_DASH;
  return (
    <div className="flex flex-col gap-1 p-4">
      <Eyebrow>{label}</Eyebrow>
      {isMissing ? (
        <HeroNumeric className="text-muted-foreground">
          <span aria-hidden="true">{EM_DASH}</span>
          <span className="sr-only">Not available</span>
        </HeroNumeric>
      ) : (
        <HeroNumeric>{value}</HeroNumeric>
      )}
    </div>
  );
}

// Column sort runs on the raw value, and prices are the MARKED-UP ones so the
// order matches the numbers rendered in the cells. Null (rendered "—") sorts
// last via the null contract.
function providerSortValue(
  model: Model,
  p: ModelProvider,
  key: string
): string | number | null {
  switch (key) {
    case "provider":
      return PROVIDER_META[p.id].detailLabel;
    case "context":
      return model.contextWindow;
    case "latency":
      return p.latencyP50Ms;
    case "throughput":
      return p.throughputTps;
    case "input":
      return providerPrice(model, p, "inputPer1M");
    case "output":
      return providerPrice(model, p, "outputPer1M");
    case "cacheRead":
      return providerPrice(model, p, "cachedInputReadPer1M");
    case "cacheWrite":
      return providerPrice(model, p, "cachedInputWritePer1M");
    default:
      return null;
  }
}

function ProvidersTable({ model }: { model: Model }) {
  const { sort, toggle: toggleSort } = useTableSort();
  const sortedProviders = useMemo(
    () =>
      sortRows(model.providers, sort, (p, key) =>
        providerSortValue(model, p, key)
      ),
    [model, sort]
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
          {sortedProviders.map((p) => {
            const handle = providerHandle(model, p.id);
            return (
              <TableRow className="hover:bg-transparent" key={p.id}>
                <TableCell>
                  <div className="flex min-w-0 items-center gap-2">
                    <ProviderAvatar decorative provider={p.id} />
                    <span
                      className="type-copy-14 truncate text-foreground"
                      title={PROVIDER_META[p.id].detailLabel}
                    >
                      {PROVIDER_META[p.id].detailLabel}
                    </span>
                    <MarkupBadge markup={p.paygMarkup} />
                    <CopyButton
                      ariaLabel={`Copy ${handle}`}
                      label="provider handle"
                      size="inline-xs"
                      value={handle}
                    />
                  </div>
                </TableCell>
                <NumericCell value={formatTokenCount(model.contextWindow)} />
                <NumericCell
                  value={
                    p.latencyP50Ms === null
                      ? EM_DASH
                      : `${formatNumber(p.latencyP50Ms)}ms`
                  }
                />
                <NumericCell
                  value={
                    p.throughputTps === null
                      ? EM_DASH
                      : `${formatNumber(p.throughputTps, { maximumFractionDigits: 1 })} t/s`
                  }
                />
                <NumericCell
                  value={formatPricePerM(providerPrice(model, p, "inputPer1M"))}
                />
                <NumericCell
                  value={formatPricePerM(
                    providerPrice(model, p, "outputPer1M")
                  )}
                />
                <NumericCell
                  value={formatPricePerM(
                    providerPrice(model, p, "cachedInputReadPer1M")
                  )}
                />
                <NumericCell
                  value={formatPricePerM(
                    providerPrice(model, p, "cachedInputWritePer1M")
                  )}
                />
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

/** The gateway's per-provider markup, rendered next to the provider name.
 *  Derived from the same `paygMarkup` the prices are computed with, so the
 *  badge and the numbers physically cannot disagree. Only OpenRouter (1.1)
 *  shows one today; 1.0 renders nothing. */
function MarkupBadge({ markup }: { markup: number }) {
  if (markup <= 1) {
    return null;
  }
  const percent = Math.round((markup - 1) * 100);
  return (
    <Badge
      title="Gateway markup over this provider's list price"
      variant="neutral"
    >
      +{percent}%
    </Badge>
  );
}

/* ─── Code samples ───────────────────────────────────────────────────────── */

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
 * Shared snippets live in payg-config.paygConfigSnippet — keep in sync. */

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

// Every model in the catalog is text, so the snippets no longer branch on
// modality — the embeddings / audio / rerank variants went with the invented
// catalog they were written for.
function tsSnippet(handle: string): CodeLine[] {
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

function pySnippet(handle: string): CodeLine[] {
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

function curlSnippet(handle: string): CodeLine[] {
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
