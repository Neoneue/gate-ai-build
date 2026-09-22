# UI Changelog: 2026-09-22

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-9-21.md`](./changelog-9-21.md)

---

## Conventions

### Enterprise gets a tinted surface wash (`src/index.css`, design.md §2 "Plan tier colours") · [48aa4a8]

- Before: the tier family had `--tier-pro-surface-wash` but no violet twin;
  design.md said to add the pair here first if a tinted Enterprise banner
  ever shipped.
- After: `--tier-enterprise-surface-wash`, light and dark, same construction
  as the Pro wash: the whole gradient rather than its stops, no `--color-*`
  alias because no colour utility reads it. Light runs violet-50 to
  violet-50 mixed half-way to white: `index.css` declares no violet ramp and
  Tailwind's violet starts at 50, and that mix reproduces exactly what
  blue-25 is to blue-50 (0.970 to 0.985 lightness, chroma halved), so no new
  ramp step enters the system. Dark runs violet-500 at 10% to 5%, the rungs
  the status washes already use. Its consumer is the focal Enterprise card
  on the Enterprise-org view of Manage subscription. The flat
  `--tier-enterprise-surface` is still absent; nothing needs one.

### The 12px line box goes to 12/18 (`src/index.css`, design.md §3 Typography) · [48aa4a8]

- Before: `type-copy-12`, `type-label-12` and `type-mono-12` all inherited
  the `text-xs` default of 12/16, a 1.333 ratio.
- After: all three carry an explicit `text-xs/[18px]`, 12/18, ratio 1.5. Copy
  moved first because it carries the densest prose on the site and at 1.333 a
  two-line detail sat close enough to the row beneath that title/detail pairs
  stopped reading as units; label and mono followed so the three 12px voices
  share ONE line box and a mixed row keeps one baseline. 1.5 is where the
  rest of the ladder already lives (10/14 is 1.40, 14/20 1.43, 16/24 1.50,
  18/28 1.56). 12/20 was measured and rejected as the loosest ratio in the
  set, looser than the 18px voice, for no legibility gain. Consumers:
  `type-copy-12` 57 call sites in 32 files, `type-label-12` 34 in 21,
  `type-mono-12` 37 in 18. Nothing else moved, and no row or control height
  changed: those come from `h-*` on the primitives (`TableHead` `h-10`,
  `Badge` `h-5`, the `h-12` row floor), not from the 12px line box. Swept 19
  pages at 1440 and 390: no clipped 12px text, no document overflow, badge
  height 20px and table rows 48px+ throughout.

## Sections & surfaces

### Manage subscription is a page, and Enterprise is the third rung (`pages/ManageSubscription.tsx`, `data/plans.ts`, `App.tsx`, `pages/Billing.tsx`, `pages/BillingFree.tsx`, `pages/BillingEnterprise.tsx`) · [48aa4a8]

- Before: every Billing twin's "Manage subscription" button opened a modal
  (`plan-comparison-dialog.tsx` on Free, `plan-comparison-dialog-pro.tsx` on
  Pro) holding two plan cards, Free and Pro, each wearing a plan-name badge.
  Enterprise had no plan ladder at all: its footer offered a no-op "Contact
  support" button. The sidebar
  upgrade CTA and the Free Models banner deep-linked `?manage=1` to open
  that modal on arrival.
- After: a nested page at `/billing/plans` and its `-free`, `-default` and
  `-enterprise` twins, all four rendering one `ManageSubscription` component
  that reads its tier from `tierSuffixOf(pathname)` (`-default` is the Free
  plan). Shell is `DashboardChrome activeNavId="billing"` + `BackLink` to
  that tier's Billing page + `PageTitle` "Manage subscription". Every
  Billing twin's button is now a `Button render={<Link>}` to
  `withTierOf(pathname, "/billing/plans")`, same label and
  `SquareArrowUpIcon`; on Enterprise it replaces "Contact support" in the
  same footer slot, so that org sees Enterprise marked as its current plan.
  The two dialogs stay on disk, unmounted, and `/upgrade` is now unmounted
  by link as well.
- Ladder: three `<article>` cards, always Free then Pro then Enterprise,
  each `row-span-5 grid grid-rows-subgrid` inside
  `grid @4xl:grid-cols-3 grid-cols-1 grid-rows-[auto_auto_auto_1fr_auto] gap-4`.
  Five shared slots: header, price, rule, body, caption. Only the body is
  `1fr`, and there is exactly ONE rule on the card, above the benefits label.
  The CTA buttons are NOT a shared row: they live inside the body, pushed to
  its bottom edge with `mt-auto`, so each card's action band is sized by ITS
  OWN buttons. That puts the LAST button of all three cards on one baseline
  and leaves no dead space under a card that offers a single control. The
  band carries `pt-6`, which compounds with the body's `gap-4` to hold the
  first button at least 40px off the feature list. Three columns only from
  `@4xl` (896px inline-size, 288px per card at the threshold); below it one
  column in ladder order, never two, because a two-up step orphans the third
  rung. Measured clean at 1440, 1440 at 200% zoom, 390 and 390 at 200% zoom,
  light and dark: no clipped element, no document overflow, equal card
  heights per row.
- Outline controls on these cards take a call-site `bg-transparent`. The
  `outline` variant ships an opaque `bg-card`, correct on the page
  background but a visibly darker patch when it sits on a focal card's tier
  wash. Only the fill is overridden, so the border, the `hover:bg-muted` and
  the focus ring still come from the primitive, and the primitive itself is
  untouched for the rest of the app (user direction). If a second surface
  ever needs it, it becomes a Button variant.
- Focal-card rule: exactly ONE card per view is tinted, in its OWN tier's
  ink (wash, border, `CircleCheck` glyphs). That is the Pro rung on the
  Free-org and Pro-org views, including when Pro is the org's own plan, and
  the Enterprise rung on the Enterprise-org view, which has no plan above it
  and so marks the one it is on. The Free card is never focal, and
  Enterprise is never focal on the other two views. Every other card is
  plain `border-border bg-card` with muted icons. The Enterprise-org tint is
  what finally gives `--tier-enterprise-surface-wash` a consumer.
- Fill rule: at most ONE filled control per view, and it need not sit on the
  focal card. "Upgrade to Pro" (`variant="promo"`, SparklesIcon) on the
  Free-org and Default views; "Contact support" (`variant="default"`) on the
  Enterprise card on the Pro-org view, which has no upgrade left to sell.
  Everything else is `outline`, including "Back to Billing", which keeps its
  ArrowLeft and its transparent fill on every view. The Enterprise-org view
  deliberately has NO filled control: the violet tint and the "Current plan"
  badge already mark that card, and a fill would be a third signal saying
  the same thing.
- Badges: exactly ONE per view, saying one of two things. "Most popular"
  where the view still has an upsell to make, "Current plan" where it names
  the rung the org is already on. Per view: Free-org and Default "Most
  popular" on Pro; Pro-org "Current plan" on Pro; Enterprise-org "Current
  plan" on Enterprise, plus "Current plan" on the FREE card on those first
  two views, which is the one case where a view carries two: one naming the
  current plan, one selling the next. The badge takes its CARD's tier tone
  rather than neutral grey, so the pill belongs to the wash under it: Badge
  `pro` on the Pro card, Badge `enterprise` on the Enterprise card, both
  primitive variants used unchanged, no border and no call-site override.
  Free is the exception and takes `neutral`, having no tier colour of its
  own and sitting on a plain card; measured 7.17:1 ink-on-pill in light and
  5.86:1 in dark. The plan-name pills the dialog used ("PRO PLAN") are gone.
  The header row carries `min-h-7` so an unbadged card keeps the badged
  card's height.
- An Enterprise org shows no empty slot: its own card is the focal one and
  takes the same "Back to Billing" link every current plan wears, while
  the Free and Pro rungs each take an `outline` "Contact support" with the
  Headset glyph opening the contact dialog, which is the PRD's "Support
  routing in place of self-serve upgrade". No `ghost` buttons on the page.
- Enterprise rung: a bare "Custom" price with no unit beside it (the card
  renders a unit only when its data names one, so nothing trails "Custom"),
  four features (org and team forced settings per §8.5, private cloud
  deployment, custom retention, procurement support) and the actions
  "Contact support" + "Book a demo" on the Free and Pro views: the first
  card in the system to carry two. The seat basis lives in the caption,
  "Billed per seat, changes go through Support." (seat-based Stripe billing,
  H2 PRD §3 and §10); on the Enterprise-org view it is "Plan changes go
  through Support.", dropping the seat half because that org's Billing page
  already shows the seat charge. Both captions carry the same two facts the
  longer sentence did and add none.
- The card for the plan the org is already on carries an `outline` "Back to
  Billing" link (`Button render={<Link>} nativeButton={false}`) with a
  `data-icon="inline-start"` `ArrowLeft`, rather than a disabled "Your
  current plan" label, on all three views. Arrow, not the `ChevronLeft`
  `BackLink` uses: the site's only button uses of the chevron are icon-only
  (Pagination previous, Calendar nav), and a labelled button takes the Arrow
  family, as `ArrowRight data-icon="inline-end"` does on SignIn / SignUp /
  onboarding. There is no disabled control anywhere on the page.
- Copy: the Free rung's action on the Pro-org view reads "Downgrade plan",
  the ticket's own wording, which is why this one string departs from the
  dialog copy the rest of the ladder preserves verbatim. Its aria-label is
  "Downgrade to the Free plan", the same register. It still opens the shared
  `CancelPlanDialog` unchanged and stays `outline`.
- Copy: the Enterprise card's primary action reads "Contact support" on
  every view, with the site's `Headset` glyph in the inline-start slot, the
  same label and glyph the Free and Pro rungs use on the Enterprise-org
  view: one label for every route to a human. The dialog it opens is titled
  "Contact support" to match. "Book a demo" keeps its label, stays `outline`
  and takes no glyph, there being no site precedent for one on a scheduling
  action.
- Copy: the Pro rung's caption on the Enterprise-org view reads "Available
  through Support." rather than "Available through Constellation Support",
  matching the two Enterprise captions beside it. "Constellation Support" is
  untouched everywhere else in the repo.
- Plan data moved verbatim out of both dialogs into `src/data/plans.ts`
  (`plansFor(tier)`). The per-org label differences the two dialogs carried
  ("Included in your Free plan:" vs "Included with the Free plan:", "What
  you'll get going Pro:" vs "What you're getting with Pro plan:") are
  preserved as per-tier variants, so each org still reads exactly the copy
  it read before. No Free or Pro string changed.
- Feature rows sit `gap-4` (16px) apart, up from `gap-3`, and the title and
  its detail line sit `gap-1` (4px) apart inside each row: the pair groups
  four times more tightly than it separates. Together with the 12/18 line
  box the cards grew to 591px on the Free and Pro views and 547px on
  Enterprise (from 547 / 503), still inside a 900px viewport without
  scrolling.
- Feature rows take ONE shared glyph, lucide `CircleCheck` (site precedent:
  `copy-button.tsx`, `ask-ai-message.tsx`), at the same `size-4 mt-1
  shrink-0` / stroke 1.75 the per-feature icons used, `text-tier-pro` on the
  featured Pro card and `text-muted-foreground` elsewhere. The eleven
  per-feature lucide icons the dialog carried are gone, and `PlanFeature`
  lost its `Icon` field: a benefits list is a set of things you get, not a
  legend of unrelated symbols. Titles and detail lines are unchanged.
- Motion: none. The dialog's GSAP card stagger did NOT come across; a
  dashboard surface does not animate on load, so the page has no mount
  entrance and `gsap` / `@gsap/react` are not imported here.
  `[data-plan-card]` survives only as the hook the tests scope to.

### Contact support / Book a demo placeholder dialog (`pages/ManageSubscription.tsx`) · [48aa4a8]

- Before: nothing. Enterprise had no self-serve surface of any kind.
- After: ONE Base UI `Dialog` serving both actions; `kind` picks the title
  ("Contact support" / "Book a demo"), the prompt field and the submit verb
  ("Send" / "Book"). Its body is a bordered `rounded-md` `aria-busy` frame
  standing in for the embedded HubSpot form and scheduler, with four states
  driven by a one-way `?form=loading|error|done` preview param (absent or
  unknown is `ready`), read on every render and never stripped: the same
  contract `?state=` has on Billing. `ready` is a mock Name / Work email /
  prompt form; `loading` is the `Skeleton` primitive; `error` is the site's
  `OctagonAlert` inline pattern plus a no-op "Try again" outline button;
  `done` is a confirmation with a "Done" close. Footer is "Cancel" ghost
  plus the primary, 24px above the buttons from `DialogFooter`'s `mt-2` on
  the content grid's `gap-4`. Width capped at `!max-w-[560px]` with
  `w-[calc(100%-2rem)]` keeping the phone gutters. Escape closes and returns
  focus to the exact button that opened it (`finalFocus`). No network, no
  analytics; the two confirmation strings are marked draft in code.

### `?manage=1` retired; upgrade CTAs point at the page (`layouts/DashboardChrome.tsx`, `pages/models/FreeModels.tsx`, `test/deep-links.test.tsx`) · [48aa4a8]

- Before: the sidebar upgrade card and the Free Models upgrade banner
  navigated to `/billing-free?manage=1` / `/billing-default?manage=1`, and
  `BillingFree.tsx` read the param on mount and stripped it on dialog close.
- After: both go straight to `/billing-free/plans` / `/billing-default/plans`
  and the read-and-strip logic is gone. `deep-links.test.tsx` drops the
  `/billing-free manage` rows and its doc-table line, documents `?form=`
  in their place, and gains three cases asserting the two CTAs land on the
  `/plans` paths.

## Tests

### Manage subscription ladder (`test/manage-subscription.test.tsx`) · [48aa4a8]

- 15 cases, `renderToString` inside a `MemoryRouter` at each of the four
  `/plans` paths: three plan cards everywhere; Free and Default promote Pro
  with the "Upgrade to Pro" filled CTA and leave Enterprise unfilled; Pro
  promotes Enterprise, marks Pro current and keeps "Cancel Pro plan" on the
  Free rung; Enterprise offers no "Upgrade" anywhere, carries exactly one
  "Current plan" badge and that badge is on the Enterprise card, and no card
  carries a filled CTA. Assertions are scoped to the `data-plan-card`
  articles so sidebar chrome cannot satisfy them.
