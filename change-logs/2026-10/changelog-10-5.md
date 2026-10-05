# UI Changelog: 2026-10-05

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-10-1.md`](./changelog-10-1.md)

---

## Sections & surfaces

### Models: separate free and paid detail pages (`pages/Models.tsx`, `pages/models/FreeModels.tsx`) `a3d6e73`

- **Before:** one detail page per model. A card in "Free models from Gate"
  and the same model's catalog row opened the identical page, and the KPI
  rail read "Free" for Input and Output whenever the model was on the free
  list, even when opened from the paid catalog.
- **After:** the selection carries the path that opened it, on `/models`,
  `/models-default`, `/models-free` and `/models-enterprise` alike.
  - A free card opens the **free detail page**, an exact copy of the paid
    page with four differences: the id line shows the constellation id
    (`constellation/qwen3-8-flash-free`) with its copy button; a muted
    `Pay as you go version:` line follows, with the catalog id as a mono
    `TextLink` that switches the view to that model's paid page; the Input
    and Output tiles read "Free"; Quick start and the Example request
    snippets send the constellation id.
  - A catalog row or Featured card opens the **paid detail page**: catalog
    id, list prices on Input and Output always.
  - The detail remounts on `free:<id>` vs `paid:<id>`, so no state (snippet
    tab, expanded description, sort) carries from the free page to the paid
    one through the link.
  - Closing a free page returns focus to the free card (`data-free-model`),
    closing a paid page to the catalog row (`data-model-row`).

### Models: free models are Qwen3.8 Flash and GLM 5.3 Flash, open to every plan (`data/free-models.ts`, `pages/models/FreeModels.tsx`, `pages/models/ModelShelves.tsx`) `a3d6e73`

- **Before:** gpt-oss-20b (Free + Pro) and DeepSeek V4 Flash 0731
  (Pro only). On `/models-free` and `/models-default` the Pro-only card
  rendered dimmed at 75% with no hover, priced "Free (Pro plan only)", and
  an "Upgrade to Pro" banner sat under the two cards.
- **After:** `qwen/qwen3-8-flash` as `constellation/qwen3-8-flash-free`
  ("Lightweight") and `z-ai/glm-5-3-flash` as
  `constellation/glm-5-3-flash-free` ("Fastest"), both "Free" on every
  plan. Removed: `FreeModel.access`, `FreeAccess`, `FREE_ACCESS_LABEL`,
  `canUseFreeModel`, `effectivePlan`, `EffectivePlan`, the `dimmed` prop
  on `FeaturedCard`, the "Free (Pro plan only)" price and the
  `UpgradeBanner`. Added `findFreeModel(id)`.

### Models: Z.ai logo (`components/icons/lobe-mark.tsx`, `components/icons/vendor-meta.tsx`, `components/icons/model-providers.tsx`) `a3d6e73`

- **Before:** `z-ai` models (GLM 5.3 Flash) showed the Zhipu mark as the
  card hover watermark, and a "ZA" initials tile as the vendor avatar,
  labeled "Z Ai".
- **After:** both render the lobehub `zai` mono mark. The watermark maps
  `z-ai` to `ZaiMark` (`zhipu` keeps `ZhipuMark`). `z-ai` joins the
  `Vendor` union with label "Z.ai", a new inline `ZaiIcon` and
  `MONO_MARK_COLOR` (`var(--foreground)`), so it flips with the theme like
  OpenAI and xAI; the `zai` slug resolves to the same entry through
  `VENDOR_ALIASES`. The exhaustive `VENDOR_ENDPOINT` / `VENDOR_HOST` maps
  gain `/api/paas/v4/chat/completions` and `api.z.ai`.

### Models: "Free version" link on the paid detail page (`pages/Models.tsx`) `a3d6e73`

- **Before:** only the free detail page linked to its twin ("Pay as you go
  version"); the paid page of a model with a free companion had no way back.
- **After:** the paid page of a model with a free companion (Qwen3.8 Flash,
  GLM 5.3 Flash) shows `Free version: <constellation id>` under the id line,
  same markup as the pay as you go line (muted `type-copy-14`, id as a
  `TextLink` in a `type-mono-14` span). The link switches to that model's
  free page; the remount key moves focus to the back link. Paid pages of
  models without a free companion show no line. Tests in
  `pages/models/model-detail-paths.test.tsx` cover the link, the switch, and
  its absence on a model without a companion, on every Models surface.

### Models: Qwen3.8 Flash context, max output and capabilities (`data/models.ts`) `a3d6e73`

- **Before:** the gateway feed carries no limits or tags for
  `qwen/qwen3-8-flash`, so its free card and both detail pages showed "—"
  for Context, Max output and Features.
- **After:** `CATALOG_FILLS` layers 1,000,000 context, 131,072 max output,
  multimodal, and tools / reasoning / vision / prompt caching / JSON mode /
  video input on the generated row, from OpenRouter's public
  `/api/v1/models` and `/endpoints` listing (Alibaba, checked 2026-10-05).
  Applied in `MODELS`, so a catalog regeneration keeps it.

### Models: 24px between section headings and their content (`pages/models/ModelShelves.tsx`, `pages/models/FreeModels.tsx`, `pages/Models.tsx`) `a3d6e73`

- **Before:** "Featured models", "Free models from Gate" and "Explore our
  catalog" each sat 16px (`gap-4`) above their content (card grid, card
  grid, search toolbar).
- **After:** `gap-6` (24px) on those three section columns. Heading to
  description (`gap-2`), card-to-card (`gap-4`), section-to-section and the
  detail page are unchanged.

## Conventions

### Tests: model detail paths (`pages/models/model-detail-paths.test.tsx`, `data/free-models.test.ts`, `test/deep-links.test.tsx`) `a3d6e73`

- **Before:** no test covered which detail page a model opens; the
  free-models test asserted the Pro-only lock; a deep-link test clicked the
  Free Models upgrade banner.
- **After:** a route test per Models surface asserts the free card opens
  the constellation id, "Free" KPIs and the pay as you go link, that the
  link lands on the paid page (catalog id, `$` prices, snippet on the
  catalog id), and that a catalog row opens the paid page. The Pro-only and
  banner tests are gone with the feature. No UI change.
