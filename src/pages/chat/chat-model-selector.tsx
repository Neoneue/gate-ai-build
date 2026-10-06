import { Boxes, Check, Search, ShieldCheck, Star } from "lucide-react";
import { type ReactElement, type ReactNode, useMemo, useState } from "react";
import {
  isKnownVendor,
  VENDOR_META,
  type Vendor,
} from "@/components/icons/vendor-meta";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogScrollBody,
  DialogScrollContent,
  DialogScrollHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextLink } from "@/components/ui/text-link";
import { cn } from "@/lib/utils";
import { CapabilityStrip } from "@/pages/Models";
import { modelUnavailableLabel } from "./chat-data";
import { CHAT_TOUCH_TARGET } from "./chat-layout";
import { ChatModelLogo } from "./chat-model-logo";
import { CHAT_COPY, modelCountLabel } from "./copy";
import type { ChatModel } from "./types";

/**
 * Favourites first, then most recently used, then alphabetical. Unavailable
 * models stay in their natural position rather than sinking to the bottom.
 */
function compareModels(a: ChatModel, b: ChatModel): number {
  if (a.favorite !== b.favorite) {
    return a.favorite ? -1 : 1;
  }
  if (a.lastUsedAt !== b.lastUsedAt) {
    if (a.lastUsedAt === null) {
      return 1;
    }
    if (b.lastUsedAt === null) {
      return -1;
    }
    return a.lastUsedAt > b.lastUsedAt ? -1 : 1;
  }
  return a.label.localeCompare(b.label);
}

function sortModels(models: readonly ChatModel[]): ChatModel[] {
  return [...models].sort(compareModels);
}

function sortRecommendedModels(
  models: readonly ChatModel[],
  selectedId: string
): ChatModel[] {
  return [...models].sort((a, b) => {
    if ((a.id === selectedId) !== (b.id === selectedId)) {
      return a.id === selectedId ? -1 : 1;
    }
    return compareModels(a, b);
  });
}

const ALL_PROVIDERS = "all";
const OTHER_PROVIDERS = "other";
const MODEL_VIEWS = ["featured", "favorites", "free", "recent", "all"] as const;

type ModelView = (typeof MODEL_VIEWS)[number];

/** Categories built but not offered yet (the site's own flag). Their
 *  filtering stays live, so putting a view back is a one-line change. */
const HIDDEN_MODEL_VIEWS: readonly ModelView[] = ["featured", "free"];

const VISIBLE_MODEL_VIEWS = MODEL_VIEWS.filter(
  (view) => !HIDDEN_MODEL_VIEWS.includes(view)
);

/** All models, because it is the only category search can never come up empty
 *  in for a model the catalog has. */
const DEFAULT_MODEL_VIEW: ModelView = "all";

/** Recent is a shortcut back to what you just used, not a history. */
const RECENT_MODEL_LIMIT = 5;

const MODEL_VIEW_LABELS: Record<ModelView, string> = {
  featured: "Featured",
  favorites: "Favorites",
  free: "Free",
  recent: "Recent",
  all: "All models",
};

/** The house vendor order: VENDOR_META's own key order. */
const VENDOR_ORDER = Object.keys(VENDOR_META) as Vendor[];

function modelVendor(model: Pick<ChatModel, "provider">): Vendor | null {
  return isKnownVendor(model.provider) ? model.provider : null;
}

export interface ChatModelSelectorProps {
  /** The trigger's visual content. */
  children: ReactNode;
  /** Non-null means the catalog failed to load. */
  error?: unknown;
  isLoading?: boolean;
  models: readonly ChatModel[];
  onRetry?: () => void;
  onSelect: (modelId: string) => void | Promise<void>;
  onToggleFavorite?: (
    modelId: string,
    favorite: boolean
  ) => void | Promise<void>;
  selectedId: string;
  /** Which comparison lane this picker changes, e.g. "Model 2". Set only in a
   *  comparison: with one lane there is nothing to disambiguate. */
  slotLabel?: string;
  /** The trigger element; the dialog renders it as its trigger. */
  trigger: ReactElement;
}

export function ChatModelSelector({
  children,
  trigger,
  models,
  selectedId,
  slotLabel,
  onSelect,
  onToggleFavorite,
  isLoading,
  error,
  onRetry,
}: ChatModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState<string>(ALL_PROVIDERS);
  const [view, setView] = useState<ModelView>(DEFAULT_MODEL_VIEW);
  const [pendingModelId, setPendingModelId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Only vendors present in the catalog, in the house order, plus one bucket
  // for anything Gate has no logo for.
  const providerOptions = useMemo(() => {
    const present = new Set<Vendor>();
    let other = false;
    for (const model of models) {
      const vendor = modelVendor(model);
      if (vendor) {
        present.add(vendor);
      } else {
        other = true;
      }
    }
    const vendors = VENDOR_ORDER.filter((vendor) => present.has(vendor)).map(
      (vendor) => ({
        value: vendor as string,
        label: VENDOR_META[vendor].label,
      })
    );
    return other
      ? [
          ...vendors,
          { value: OTHER_PROVIDERS, label: CHAT_COPY.otherProviders },
        ]
      : vendors;
  }, [models]);

  const categoryModels = useMemo(() => {
    switch (view) {
      case "featured":
        return sortRecommendedModels(
          models.filter((model) => model.available),
          selectedId
        ).slice(0, 4);
      case "favorites":
        return sortModels(models.filter((model) => model.favorite));
      case "free":
        return sortModels(models.filter((model) => model.isFree === true));
      case "recent":
        return models
          .filter((model) => model.lastUsedAt !== null)
          .sort((a, b) =>
            (b.lastUsedAt ?? "").localeCompare(a.lastUsedAt ?? "")
          )
          .slice(0, RECENT_MODEL_LIMIT);
      default:
        return sortModels(models);
    }
  }, [models, selectedId, view]);

  const visibleModels = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categoryModels.filter((model) => {
      if (provider !== ALL_PROVIDERS) {
        const vendor = modelVendor(model);
        if (
          provider === OTHER_PROVIDERS ? vendor !== null : vendor !== provider
        ) {
          return false;
        }
      }
      return (
        !q ||
        model.label.toLowerCase().includes(q) ||
        model.id.toLowerCase().includes(q)
      );
    });
  }, [categoryModels, query, provider]);

  const resultSummary =
    view === "all"
      ? modelCountLabel(visibleModels.length, models.length)
      : `${visibleModels.length} ${MODEL_VIEW_LABELS[view].toLowerCase()} · ${models.length} available`;

  const select = async (model: ChatModel) => {
    if (!model.available || pendingModelId) {
      return;
    }
    setPendingModelId(model.id);
    setMutationError(null);
    try {
      await onSelect(model.id);
      setOpen(false);
    } catch {
      setMutationError("The model could not be selected. Try again.");
    } finally {
      setPendingModelId(null);
    }
  };

  const toggleFavorite = async (model: ChatModel) => {
    if (!onToggleFavorite || pendingModelId) {
      return;
    }
    setPendingModelId(model.id);
    setMutationError(null);
    try {
      await onToggleFavorite(model.id, !model.favorite);
    } catch {
      setMutationError("The favourite could not be updated. Try again.");
    } finally {
      setPendingModelId(null);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
      setProvider(ALL_PROVIDERS);
      setView(DEFAULT_MODEL_VIEW);
      setMutationError(null);
    }
  };

  const recommendationLabel = (model: ChatModel) => {
    if (model.id === selectedId) {
      return CHAT_COPY.currentModel;
    }
    if (model.favorite) {
      return CHAT_COPY.favouriteModel;
    }
    if (model.lastUsedAt !== null) {
      return CHAT_COPY.recentModel;
    }
    return CHAT_COPY.availableModel;
  };

  const renderModelList = (
    items: readonly ChatModel[],
    featuredList = false
  ) => (
    <ul
      aria-label={
        featuredList
          ? CHAT_COPY.recommendedModels
          : `${MODEL_VIEW_LABELS[view]} models`
      }
      className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain rounded-md border border-border bg-card p-1 pr-2"
    >
      {items.map((model) => {
        const selected = model.id === selectedId;
        return (
          <li
            className={cn(
              "flex items-center gap-2 rounded-sm pr-0 pl-3 transition-colors duration-150 ease-out motion-reduce:transition-none sm:gap-3",
              selected
                ? "bg-accent"
                : model.available
                  ? "hover:bg-accent-muted"
                  : "opacity-60"
            )}
            key={model.id}
          >
            <button
              aria-pressed={selected}
              className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xs py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed"
              disabled={!model.available || pendingModelId !== null}
              onClick={() => select(model)}
              type="button"
            >
              <ChatModelLogo model={model} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="type-label-14 truncate text-foreground">
                  {model.label}
                </span>
                {/* The reason, not the bare status. */}
                {model.available ? null : (
                  <span className="type-copy-12 text-muted-foreground">
                    {modelUnavailableLabel(model)}
                  </span>
                )}
              </span>
              {model.capabilities.length > 0 ? (
                <span className="hidden shrink-0 sm:flex">
                  <CapabilityStrip capabilities={[...model.capabilities]} />
                </span>
              ) : null}
              {featuredList ? (
                <span className="type-label-12 inline-flex h-5 shrink-0 items-center rounded-full bg-muted px-2 text-muted-foreground">
                  {recommendationLabel(model)}
                </span>
              ) : null}
            </button>
            <Check
              aria-hidden
              className={cn(
                "size-4 shrink-0",
                selected ? "text-primary" : "text-transparent"
              )}
              strokeWidth={1.75}
            />
            {onToggleFavorite ? (
              <Button
                aria-label={
                  model.favorite ? "Remove favourite" : "Add favourite"
                }
                aria-pressed={model.favorite}
                className={cn(
                  CHAT_TOUCH_TARGET,
                  "shrink-0 text-muted-foreground"
                )}
                disabled={pendingModelId !== null}
                onClick={() => toggleFavorite(model)}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <Star
                  aria-hidden
                  className={cn(
                    "size-4",
                    model.favorite && "fill-current text-primary"
                  )}
                  strokeWidth={1.75}
                />
              </Button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );

  const content = (
    <>
      <DialogScrollHeader className="gap-3 pb-3 sm:gap-4 sm:pb-4">
        <div className="flex items-start gap-3 pr-8 sm:gap-4">
          <span className="hidden size-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-foreground sm:inline-flex">
            <Boxes aria-hidden className="size-5" strokeWidth={1.75} />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <DialogTitle>{CHAT_COPY.chooseModel}</DialogTitle>
              {slotLabel ? (
                <span className="type-label-12 inline-flex h-5 shrink-0 items-center rounded-full bg-muted px-2 text-muted-foreground">
                  {slotLabel}
                </span>
              ) : null}
            </div>
            <DialogDescription>
              {CHAT_COPY.chooseModelDescription}
            </DialogDescription>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:grid sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.75}
            />
            <Input
              aria-label={CHAT_COPY.searchModels}
              autoFocus
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") {
                  return;
                }
                const first = visibleModels.find((model) => model.available);
                if (first) {
                  select(first);
                }
              }}
              placeholder={CHAT_COPY.searchModels}
              value={query}
            />
          </div>
          <Select
            onValueChange={(value) => setProvider(value ?? ALL_PROVIDERS)}
            value={provider}
          >
            {/* Full width under the search field on a phone; beside it from sm. */}
            <SelectTrigger
              aria-label={CHAT_COPY.allProviders}
              className="w-full sm:w-fit"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_PROVIDERS}>
                {CHAT_COPY.allProviders}
              </SelectItem>
              {providerOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p
          aria-live="polite"
          className="type-copy-12 text-muted-foreground"
          role="status"
        >
          {resultSummary}
        </p>
      </DialogScrollHeader>

      <DialogScrollBody className="flex min-h-0 flex-1 flex-col pt-0">
        {mutationError ? (
          <div
            className="mb-3 rounded-md border border-destructive-subtle bg-danger-50 p-3 dark:bg-destructive/15"
            role="alert"
          >
            <span className="type-copy-12 text-danger-800 dark:text-danger-300">
              {mutationError}
            </span>
          </div>
        ) : null}
        {error ? (
          <div
            className="flex flex-col items-start gap-2 rounded-md border border-border p-4"
            role="alert"
          >
            <span className="type-copy-12 text-muted-foreground">
              The model catalog could not be loaded.
            </span>
            {onRetry ? (
              <TextLink className="type-label-12" onClick={onRetry}>
                Retry
              </TextLink>
            ) : null}
          </div>
        ) : isLoading && models.length === 0 ? (
          <div className="type-copy-12 p-4 text-muted-foreground" role="status">
            Loading models…
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
            <Tabs
              onValueChange={(value) => setView(value as ModelView)}
              value={view}
            >
              <TabsList
                aria-label="Model categories"
                className="h-auto w-full px-0"
                variant="line"
              >
                {VISIBLE_MODEL_VIEWS.map((modelView) => (
                  <TabsTrigger
                    className="shrink-0"
                    key={modelView}
                    value={modelView}
                  >
                    {MODEL_VIEW_LABELS[modelView]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {visibleModels.length === 0 ? (
              <div
                className="type-copy-12 p-4 text-muted-foreground"
                role="status"
              >
                {query.trim() || provider !== ALL_PROVIDERS
                  ? "No models in this tab match your filters."
                  : view === "favorites"
                    ? "No favorites yet. Star a model in All models to add it here."
                    : view === "recent"
                      ? "Models you use will appear here."
                      : view === "free"
                        ? "No models have confirmed free input and output pricing."
                        : "No models in this category yet."}
              </div>
            ) : (
              <>
                {view === "featured" ? (
                  <div className="flex items-start gap-3 px-1">
                    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-sm bg-muted text-foreground">
                      <ShieldCheck
                        aria-hidden
                        className="size-4"
                        strokeWidth={1.75}
                      />
                    </span>
                    <div className="flex min-w-0 flex-col gap-1">
                      <h3 className="type-label-14 text-foreground">
                        {CHAT_COPY.recommendedModels}
                      </h3>
                      <p className="type-copy-12 text-muted-foreground">
                        {CHAT_COPY.recommendedModelsDescription}
                      </p>
                    </div>
                  </div>
                ) : null}
                {renderModelList(visibleModels, view === "featured")}
              </>
            )}
          </div>
        )}
      </DialogScrollBody>
    </>
  );

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger render={trigger}>{children}</DialogTrigger>
      <DialogScrollContent className="h-[min(88dvh,42rem)] max-w-[calc(100%-1rem)] sm:h-[min(76dvh,38rem)] sm:max-w-2xl lg:max-w-4xl">
        {content}
      </DialogScrollContent>
    </Dialog>
  );
}
