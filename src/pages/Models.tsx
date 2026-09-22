import { Bot, ChevronDown } from "lucide-react";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { AnthropicIcon, OpenAIIcon } from "@/components/icons/model-providers";
import { ProviderAvatar, VendorAvatar } from "@/components/icons/vendor-avatar";
import { PROVIDER_META, PROVIDER_ORDER } from "@/components/icons/vendor-meta";
import { BackLink } from "@/components/ui/back-link";
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
import { MultiSelect } from "@/components/ui/multi-select";
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
import { Separator } from "@/components/ui/separator";
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
import { resolveRowsPerPage } from "@/components/ui/table-pagination";
import { TablePaginationFooter } from "@/components/ui/table-pagination-footer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsCount } from "@/components/ui/tabs-count";
import { TextLink } from "@/components/ui/text-link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CAPABILITY_INLINE_MAX,
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
import { useIsTruncated } from "@/hooks/use-is-truncated";
import { sortRows, useTableSort } from "@/hooks/use-table-sort";
import { DashboardChrome } from "@/layouts/DashboardChrome";
import { formatNumber, linesToString } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { FreeModels } from "@/pages/models/FreeModels";
import { FeaturedModels } from "@/pages/models/ModelShelves";
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

/** Module constant, not a render-time `.map`: `MultiSelect` lists `options`
 *  in a `useMemo` dep array (`multi-select.tsx:161`), so a fresh array
 *  identity every render defeated that memo on every search keystroke. */
const CAPABILITY_OPTIONS = CAPABILITY_ORDER.map((c) => ({
  value: c,
  label: CAPABILITY_META[c].label,
}));

export function Models() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();

  // selectedModel lives at the top so list ↔ detail view switching doesn't
  // re-mount DashboardChrome.
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  // Focus handoff between list and detail (WCAG 2.4.3). The swap is in-place,
  // not a route change, so nothing moves focus on its own: opening a model
  // would leave focus on a button that just unmounted, dropping the keyboard
  // user to <body>. Opening moves focus to the detail's back link (handled in
  // ModelDetailPage); closing restores it to the row button that opened it.
  // The id sits in a ref so the restore survives the list re-mount without
  // re-rendering the page on every selection.
  const restoreFocusId = useRef<string | null>(null);

  const handleSelect = useCallback((model: Model) => {
    restoreFocusId.current = model.id;
    setSelectedModel(model);
  }, []);

  useEffect(() => {
    const id = restoreFocusId.current;
    if (selectedModel || !id) {
      return;
    }
    restoreFocusId.current = null;
    // The row button carries `data-model-row`; querySelector rather than a ref
    // because the list unmounts while the detail is open, so no ref survives.
    document
      .querySelector<HTMLElement>(`[data-model-row="${CSS.escape(id)}"]`)
      ?.focus();
  }, [selectedModel]);

  return (
    <DashboardChrome
      activeNavId="models"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      {/* Announces the view swap. Lives outside the conditional so the live
          region is already mounted when its text changes: a region that
          mounts with content does not reliably announce. */}
      <span aria-live="polite" className="sr-only">
        {selectedModel ? `${selectedModel.name} details` : ""}
      </span>
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
          <ModelsSurface onSelect={handleSelect} />
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
  // Empty = no capability filter. A non-empty selection INTERSECTS: a row has
  // to carry every capability picked, so each addition narrows the catalog.
  const [features, setFeatures] = useState<Capability[]>([]);
  const [sort, setSort] = useState<ModelSort>("popular");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("25");

  // The query the catalog filters against lags the input by a frame under
  // load: 390 rows and up to 25 tooltip-bearing rows reconcile per keystroke,
  // and `search` stays bound to the SearchInput so typing never stalls.
  const deferredSearch = useDeferredValue(search);
  const stale = search !== deferredSearch;

  // Filter and sort are two memos, not one: changing only the sort Select
  // must not re-run a 390-row filter for a result that cannot change.
  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return MODELS.filter((m) => {
      if (modality !== "all" && m.modality !== modality) {
        return false;
      }
      if (provider !== "all" && !m.providers.some((p) => p.id === provider)) {
        return false;
      }
      if (
        features.length > 0 &&
        !features.every((c) => m.capabilities.includes(c))
      ) {
        return false;
      }
      if (q && !matchesQuery(m, q)) {
        return false;
      }
      return true;
    });
  }, [modality, deferredSearch, provider, features]);

  const rows = useMemo(() => sortModels(filtered, sort), [filtered, sort]);

  const resetToFirstPage = () => setPage(1);

  // Page the visible rows by the footer's rows-per-page selector. The footer
  // only computes labels; slicing is the caller's job (see AuditTrail).
  const perPage = resolveRowsPerPage(rowsPerPage, rows.length);
  const pageRows = rows.slice((page - 1) * perPage, page * perPage);

  const isEmpty = rows.length === 0;

  const clearFilters = () => {
    setSearch("");
    setModality("all");
    setProvider("all");
    setFeatures([]);
    resetToFirstPage();
  };

  return (
    <>
      <PageHeader modelCount={MODELS.length} providerCount={TOTAL_PROVIDERS} />

      {/* Curated blocks. Three MAIN sections on this page, Featured, the
          free models, and the catalog, separated by a rule. */}
      <Separator />

      <FeaturedModels onSelect={onSelect} />

      <Separator />

      <FreeModels onSelect={onSelect} />

      <Separator />

      {/* The four curated shelves (`ModelShelves`) are HIDDEN as of
          2026-09-14 on the CTO's call: "drop the subcategory pages, we
          didn't want to suggest tons of different models, 4 to 6 to make it
          easy to pick, then the full catalog". Component, data
          (`src/pages/models/curation.ts`) and tests stay so the block can
          return by re-mounting it here. */}

      {/* Catalog header + Tabs share one gap-4 column so the header reads as
          the Tabs' own heading rather than as a third free-floating block. */}
      <div className="flex flex-col gap-4">
        <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
          <h2 className="type-heading-24 m-0 text-foreground">
            Explore our catalog
          </h2>
          <p className="type-copy-16 m-0 text-pretty text-muted-foreground">
            Every model Gate can send your requests to. Search by name, filter
            by provider, and compare what each one costs and can do.
          </p>
        </div>

        {/* Modality tabs — promoted out of the filter-pill row so each
          modality is a visible peer scope. Underline `line` variant
          matches the Settings / Team tab register elsewhere in the
          shell. Count chip uses the shared <TabsCount> primitive.
          Three tabs from the feed's `type`: language -> Text, multimodal ->
          Multimodal (2026-09-14, matches the marketing catalog). */}
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
            <TabsTrigger value="multimodal">
              Multimodal
              <TabsCount>{MODALITY_COUNTS.multimodal}</TabsCount>
            </TabsTrigger>
          </TabsList>

          {/* The Toolbar stays mounted when the result set empties. Typing a
              query down to zero rows used to unmount it mid-keystroke, taking
              the focused search input with it and dropping focus to <body>
              (WCAG 2.4.3); the empty state renders below it instead. */}
          <Toolbar
            features={features}
            onFeaturesChange={(v) => {
              setFeatures(v);
              resetToFirstPage();
            }}
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

          {/* The dim is the only cue that the catalog is a frame behind the
              input. The transition is unconditional so it runs in BOTH
              directions; toggling `transition-opacity` alongside `opacity-70`
              would add the property in the same frame as the change and snap. */}
          <Card
            className={cn(
              "transition-opacity duration-150 ease-out motion-reduce:transition-none",
              stale && "opacity-70"
            )}
            density="flush"
          >
            {isEmpty ? (
              <TableEmptyState
                action={
                  <Button onClick={clearFilters} size="sm" variant="outline">
                    Clear filters
                  </Button>
                }
                body="Try a broader search, a different type, fewer features, or clear the filters to see every routable model."
                title="No models match these filters"
              />
            ) : (
              <>
                <ModelsTable onSelect={onSelect} rows={pageRows} />

                <TablePaginationFooter
                  onPageChange={setPage}
                  onRowsPerPageChange={setRowsPerPage}
                  page={page}
                  rowsPerPage={rowsPerPage}
                  total={rows.length}
                />
              </>
            )}
          </Card>
        </Tabs>
      </div>

      <p className="type-copy-12 m-0 text-muted-foreground">
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
      <p className="type-copy-18 m-0 text-pretty text-muted-foreground">
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
  features,
  onFeaturesChange,
  sort,
  onSortChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  provider: string;
  onProviderChange: (v: string) => void;
  features: Capability[];
  onFeaturesChange: (v: Capability[]) => void;
  sort: ModelSort;
  onSortChange: (v: ModelSort) => void;
}) {
  return (
    /* Container queries, not viewport ones — same conversion as
       RequestsTable. `<main>` declares `@container`, so `@2xl:` (672px
       inline-size) reads the column the toolbar lives in rather than the
       window, which the Ask AI panel narrows without touching. Below it:
       search full-width on row 1, the provider Select, the features
       MultiSelect and the sort Select splitting row 2 evenly via
       `min-w-0 flex-1`. */
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
          className="min-w-0 @2xl:flex-none @xl:flex-1 @xl:basis-auto basis-full border-border bg-card text-foreground"
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

      {/* Capabilities, in CAPABILITY_ORDER so the picker reads the same way
          the row strip and the detail page do. Live-applying (no commitMode):
          it is a filter, and each toggle is a cheap, reversible narrowing. */}
      <MultiSelect
        aria-label="Filter by features"
        className="w-auto min-w-0 @2xl:flex-none @xl:flex-1 @xl:basis-auto basis-full"
        onValueChange={(v) => onFeaturesChange(v as Capability[])}
        options={CAPABILITY_OPTIONS}
        placeholder="All features"
        popupWidth="content"
        value={features}
      />

      <Select onValueChange={(v) => onSortChange(v as ModelSort)} value={sort}>
        <SelectTrigger
          aria-label="Sort"
          className="min-w-0 @2xl:flex-none @xl:flex-1 @xl:basis-auto basis-full border-border bg-card text-foreground"
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
            className="w-[20%] whitespace-nowrap"
            onSort={toggleSort}
            sort={sort}
            sortKey="name"
          >
            Model
          </SortableTableHead>
          <SortableTableHead
            className="w-[28%] whitespace-nowrap"
            onSort={toggleSort}
            sort={sort}
            sortKey="handle"
          >
            Model ID
          </SortableTableHead>
          <SortableTableHead
            className="w-[8.5%] whitespace-nowrap"
            numeric
            onSort={toggleSort}
            sort={sort}
            sortKey="context"
          >
            Context
          </SortableTableHead>
          <SortableTableHead
            className="w-[8.5%] whitespace-nowrap"
            numeric
            onSort={toggleSort}
            sort={sort}
            sortKey="input"
          >
            Input
          </SortableTableHead>
          <SortableTableHead
            className="w-[8.5%] whitespace-nowrap"
            numeric
            onSort={toggleSort}
            sort={sort}
            sortKey="output"
          >
            Output
          </SortableTableHead>
          <TableHead className="w-[18%] whitespace-nowrap">Features</TableHead>
          <TableHead className="w-[8.5%] whitespace-nowrap">
            Providers
          </TableHead>
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
              className="cursor-pointer"
              key={model.id}
              onClick={() => onSelect(model)}
            >
              <TableCell className="max-w-[280px]">
                <RowActionButton
                  aria-label={`Inspect ${model.name}`}
                  data-model-row={model.id}
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
export function NumericCell({ value }: { value: string }) {
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

export function CapabilityStrip({
  capabilities,
}: {
  capabilities: Capability[];
}) {
  if (capabilities.length === 0) {
    return (
      <span className="type-mono-12 text-muted-foreground">{EM_DASH}</span>
    );
  }
  // Render in canonical order so cross-row scanning lands on the same icon
  // in the same x-slot (Tool use is always leftmost when present). Each icon
  // carries `aria-label` + `role="img"` for SR identification AND a hover
  // tooltip, so sighted-mouse users get the capability name on hover. The
  // tooltip is the project primitive, not a native `title`: one hover voice
  // across the page, and the `+N` chip beside it already reads that way.
  //
  // Only the first CAPABILITY_INLINE_MAX render as glyphs (2026-09-14).
  // CAPABILITY_ORDER is decision value, so the four that survive are the four
  // a reader actually picks a model on; the tail collapses into one +N chip.
  // Ten glyphs on the widest row made the column the widest thing in the
  // table while carrying the least signal per pixel, and no row could be
  // read at a glance because every row had a different strip length.
  const have = new Set(capabilities);
  const ordered = CAPABILITY_ORDER.filter((c) => have.has(c));
  const inline = ordered.slice(0, CAPABILITY_INLINE_MAX);
  const hidden = ordered.slice(CAPABILITY_INLINE_MAX);
  const hiddenLabels = hidden.map((c) => CAPABILITY_META[c].label);
  return (
    // 8px between glyphs (user call 2026-09-15, up from 4px): at 4px the four
    // marks read as one smear, at 8px each one is its own object and the strip
    // still scans as a single group.
    <div className="flex items-center gap-2">
      {inline.map((c) => {
        const meta = CAPABILITY_META[c];
        const Icon = meta.icon;
        return (
          // The wrapping span IS the trigger (Base UI `render`), never a
          // nested <button> — this strip renders inside the catalog row's
          // drill-in button and inside the Featured card's, and a button in a
          // button is invalid markup that swallows the click.
          <Tooltip key={c}>
            <TooltipTrigger render={<span className="inline-flex shrink-0" />}>
              <Icon
                aria-label={meta.label}
                className="size-4 shrink-0 text-muted-foreground"
                role="img"
                strokeWidth={1.75}
              />
            </TooltipTrigger>
            <TooltipContent>{meta.label}</TooltipContent>
          </Tooltip>
        );
      })}
      {hidden.length > 0 ? (
        // The chip carries the hidden labels in its `aria-label`, so a screen
        // reader hears every capability the row has even though only four are
        // drawn — the tooltip is the sighted equivalent of the same string.
        // The Badge is the trigger itself (Base UI `render`), never a nested
        // <button>, so a click still reaches the row's drill-in; Base UI's
        // `closeOnClick` default keeps the tooltip from riding along to the
        // next view.
        <Tooltip>
          <TooltipTrigger
            render={
              <Badge
                aria-label={`${hidden.length} more: ${hiddenLabels.join(", ")}`}
                className="shrink-0"
                role="img"
                variant="neutral"
              />
            }
          >
            {`+${hidden.length}`}
          </TooltipTrigger>
          <TooltipContent>
            <span className="flex flex-col">
              {hiddenLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </span>
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}

export function ProviderStack({ providers }: { providers: ModelProvider[] }) {
  // Marks render in PROVIDER_ORDER (Alibaba, Vertex, OpenRouter) on every
  // row, so the column scans as one axis. Until 2026-09-14 the stack kept
  // each model's own API order, which flipped Vertex / OpenRouter between
  // neighbouring rows; prod still does that, this build deliberately does not.
  const byId = new Map(providers.map((p) => [p.id, p]));
  const ordered = PROVIDER_ORDER.filter((id) => byId.has(id)).map(
    (id) => byId.get(id) as ModelProvider
  );
  const names = ordered.map((p) => PROVIDER_META[p.id].label);
  const ariaLabel = `Available from ${ordered.length} providers: ${names.join(", ")}`;
  return (
    <div aria-label={ariaLabel} className="flex items-center gap-2" role="img">
      {ordered.map((p) => (
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
  // The toggle only earns its place when the description is REALLY clamped:
  // a 75-character blurb never engages `line-clamp-3`, and the control then
  // toggled text that already fit and moved nothing (ModelShelves.tsx is the
  // precedent for measuring instead of assuming).
  const { ref: descRef, isTruncated: descClipped } = useIsTruncated();
  const activeLines = useMemo(() => {
    if (lang === "TypeScript") {
      return tsSnippet(model.id);
    }
    if (lang === "Python") {
      return pySnippet(model.id);
    }
    return curlSnippet(model.id);
  }, [lang, model.id]);

  // Hand focus to the back link once the detail is on screen. See the comment
  // on the link itself for why this is a query and not a ref.
  useEffect(() => {
    document.querySelector<HTMLElement>("[data-model-back-link]")?.focus();
  }, []);

  // Same membership test CapabilityStrip uses: CAPABILITY_ORDER fixes the
  // display order, the Set answers "does this model have it".
  const have = new Set(model.capabilities);
  const orderedCapabilities = CAPABILITY_ORDER.filter((c) => have.has(c));

  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* Top utility bar — back affordance only for now. The back link takes
          focus on mount so the keyboard user lands inside the detail instead
          of at <body> (the row button that opened it has just unmounted).
          querySelector, not a ref: BackLink does not forward one. */}
      <div className="flex items-center justify-between gap-4">
        <BackLink data-model-back-link="" label="Models" onClick={onBack} />
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
            {orderedCapabilities.map((c) => {
              const meta = CAPABILITY_META[c];
              const Icon = meta.icon;
              return (
                <Badge className="h-6" key={c} variant="neutral">
                  <Icon aria-hidden="true" data-icon="inline-start" />
                  {meta.label}
                </Badge>
              );
            })}
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
              "type-copy-16 m-0 whitespace-pre-line text-foreground",
              showFullDesc ? "text-pretty" : "line-clamp-3"
            )}
            id="model-description"
            ref={descRef}
          >
            {model.description}
          </p>
          {/* Expanded, the clamp is off and nothing is clipped, so the measure
              reads false — `showFullDesc` keeps "Show less" on screen. */}
          {descClipped || showFullDesc ? (
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
                  "size-3.5 shrink-0 text-muted-foreground transition-[color,rotate] duration-150 ease-out group-hover:text-foreground motion-reduce:transition-none",
                  showFullDesc && "rotate-180"
                )}
                strokeWidth={1.75}
              />
            </TextLink>
          ) : null}
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
                      height={16}
                      src="/icons/languages/typescript.svg"
                      width={16}
                    />
                    TypeScript
                  </TabsTrigger>
                  <TabsTrigger value="Python">
                    <img
                      alt=""
                      aria-hidden
                      className="size-4"
                      height={16}
                      src="/icons/languages/python.svg"
                      width={16}
                    />
                    Python
                  </TabsTrigger>
                  <TabsTrigger value="cURL">
                    <img
                      alt=""
                      aria-hidden
                      className="h-4 w-auto"
                      height={854}
                      src="/icons/languages/curl.svg"
                      width={1021}
                    />
                    cURL
                  </TabsTrigger>
                </TabsList>
              </div>
              {/* tabIndex so the snippet can be scrolled from the keyboard:
                  Chrome and Safari only focus a scrollport that opts in. Ring
                  is inset because the flush Card clips an outset one. */}
              <div
                aria-label="Code sample"
                className="h-[256px] overflow-y-auto outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                role="region"
                // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollport must be focusable or keyboard users cannot scroll it (axe scrollable-region-focusable, WCAG 2.1.1)
                tabIndex={0}
              >
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
                      className="type-label-14 truncate text-foreground"
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
    <Tooltip>
      <TooltipTrigger render={<Badge variant="neutral" />}>
        +{percent}%
      </TooltipTrigger>
      <TooltipContent>
        Gateway markup over this provider's list price
      </TooltipContent>
    </Tooltip>
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
                height={16}
                src="/icons/providers/openclaw.svg"
                width={16}
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
        {/* Same keyboard-scroll opt-in as the Example request snippet. */}
        <div
          aria-label="Setup configuration"
          className="h-[216px] overflow-y-auto outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          role="region"
          // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollport must be focusable or keyboard users cannot scroll it (axe scrollable-region-focusable, WCAG 2.1.1)
          tabIndex={0}
        >
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
