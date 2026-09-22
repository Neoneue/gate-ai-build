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

### A four-rung lift ramp, and a Button family that uses it (`src/index.css`, `components/ui/button.tsx`, design.md §2 "Lift ramp") · [a8901a2]

- Before: `outline` and `ghost` hover to `bg-muted`, an opaque grey. On the
  Manage subscription plan cards that grey covered the Pro card's blue wash
  and the Enterprise card's violet, so a card lost its colour under its own
  button. The page had been papering over the rest state with a call-site
  `bg-transparent`, which did nothing for the hover.
- After: `--lift-4` / `-8` / `-16` / `-24`, pure alpha over whatever sits
  beneath, black in light and white in dark, each aliased so it reads as
  `hover:bg-lift-16` with the rung number visible at the call site. The ramp
  is the unit, not the step: rung 8 is the hover default and the other
  three are named for a row touch (4), a heavier deliberate hover (16) and a
  press (24). Three have no consumer today and design.md records that as
  deliberate, so the next weight is a lookup rather than a fresh ad-hoc
  alpha. Rung 16 was built and measured first, read about five times heavier
  than the `bg-muted` hover the rest of the app uses, and 8 is the settled
  default.
- It flips by theme, unlike `--overlay` beside it: a scrim dims a page the
  same way in both themes, a lift has to work WITH the surface under it, and
  a white veil over a near-white card does nothing.
- Four ADDITIVE Button variants, `lift` / `lift-pro` / `lift-enterprise` /
  `lift-ghost`: transparent fill, `hover:bg-lift-8`, edge and ink from
  `--border` or the matching tier family. `outline` and `ghost` are
  untouched, so no existing consumer moves. `shadow-xs` is deliberately
  absent: a drop shadow under a transparent control on a tinted card reads
  as a seam.
- On the plan cards the focal card's button wears that card's tier
  (`lift-pro` on the Pro view, `lift-enterprise` on the Enterprise view),
  every plain card's button is neutral `lift`, and "Book a demo" is
  `lift-ghost`, so the whole page hovers on one rung and differs only in
  edge. The mapping lives in one `liftVariant()` on the page, because it
  depends on the CARD, not on the action; the data keeps saying what a
  control means. The call-site `bg-transparent` is gone, the variant covers
  it. "Upgrade to Pro" keeps `promo` untouched; a fill has no tint to
  protect.
- Measured at rung 8, card to hover: plain `rgb(255,255,255)` to
  `rgb(235,235,235)` light and `rgb(23,23,23)` to `rgb(41,41,41)` dark; Pro
  `rgb(246,250,255)` to `rgb(227,229,235)` and `rgb(13,15,23)` to
  `rgb(32,34,41)`; Enterprise `rgb(249,248,255)` to `rgb(229,229,235)` and
  `rgb(17,14,23)` to `rgb(36,33,41)`. Every hovered value keeps its card's
  channel spread, which is the whole test. Focus rings hold at 6.94:1 to
  7.81:1 against every card surface in both themes.

### Plan cards get the Card tier elevation they never had (`pages/ManageSubscription.tsx`) · [a8901a2]

- Before: the plan cards are a hand-rolled `div` (`rounded-md border p-4`)
  rather than a `<Card>`, because they subgrid across the ladder, so they
  never picked up the primitive's `shadow-xs` and sat flat on the canvas
  while every other card on the site is raised.
- After: `shadow-xs` on all three cards, on every view, the tinted focal card
  included. Same rung the `Card` primitive uses (design.md §5.1 Card /
  Surface tier, `border border-border shadow-xs` at `rounded-md`), not a
  bespoke value. Measured in light: 1px under a card the canvas reads
  `rgb(247,247,247)` against `rgb(250,250,250)` 14px away, so the lift is
  visible on all three. In dark it reads `rgb(10,10,10)` against
  `rgb(10,10,10)`, effectively invisible, which is the documented and
  knowingly accepted behaviour of the single Tailwind scale (§5.1, "Dark
  mode reads softer... the `border-border` hairline is now doing most of the
  separation work"). The tinted cards need nothing different and get
  nothing different. A test now asserts the elevation so it cannot be
  dropped again.

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
- Fill rule: the ONLY filled control on the page is "Upgrade to Pro"
  (`variant="promo"`, SparklesIcon), so only the Free-org and Default views
  carry one. The Pro-org and Enterprise-org views have none: a Pro org has
  nowhere left to upgrade and an Enterprise org is already at the top, and
  on both the tint plus the "Current plan" badge already mark the card. The
  contact primary is `outline` on every view (it was briefly `default` on
  the Pro-org view; with "Book a demo" ghost beneath it the outline already
  carries the hierarchy, and the fill made Enterprise shout at a Pro
  customer). Everything else is `outline`, apart from the one fenced ghost.
- "Book a demo" is `variant="ghost"`, sitting directly under the bordered
  contact primary so the pair reads primary-then-quieter. It is the only
  ghost on the page and `PlanAction.variant` documents the fence: ghost is
  allowed ONLY for a paired secondary with a bordered sibling above it. A
  ghost on a LONE button was tried and rejected the same day; with nothing
  to anchor it an unbordered control floats in an empty slot and stops
  reading as a button.
- Badges say one of two things: "Most popular" where the view still has an
  upsell to make, "Current plan" where they name the rung the org is already
  on. Per view: Free-org and Default carry TWO, "Current plan" on Free plus
  "Most popular" on Pro, the one case where a view names the current plan
  and sells the next at once; Pro-org carries one, "Current plan" on Pro;
  Enterprise-org carries one, "Current plan" on Enterprise. The badge takes its CARD's tier tone
  rather than neutral grey, so the pill belongs to the wash under it: Badge
  `pro` on the Pro card, Badge `enterprise` on the Enterprise card, both
  primitive variants used unchanged, no border and no call-site override.
  Free is the exception and takes `neutral`, having no tier colour of its
  own and sitting on a plain card; measured 7.17:1 ink-on-pill in light and
  5.86:1 in dark. The plan-name pills the dialog used ("PRO PLAN") are gone.
  The header row carries `min-h-7` so an unbadged card keeps the badged
  card's height.
- An Enterprise org shows no empty slot: its own card is the focal one and
  takes the same "Go to Overview" link every current plan wears, while
  the Free and Pro rungs each take an `outline` "Contact support" opening
  the contact dialog, which is the PRD's "Support routing in place of
  self-serve upgrade".
- Enterprise rung: a bare "Custom" price with no unit beside it (the card
  renders a unit only when its data names one, so nothing trails "Custom"),
  four features (org and team forced settings per §8.5, private cloud
  deployment, custom retention, procurement support) and the actions
  "Contact us" (`outline`) + "Book a demo" (`ghost`) on the Free and Pro
  views: the first
  card in the system to carry two. The seat basis lives in the caption,
  "Billed per seat, changes go through Support." (seat-based Stripe billing,
  H2 PRD §3 and §10); on the Enterprise-org view it is "Plan changes go
  through Support.", dropping the seat half because that org's Billing page
  already shows the seat charge. Both captions carry the same two facts the
  longer sentence did and add none.
- The card for the plan the org is already on carries a label-only
  `outline` "Go to Overview" link (`Button render={<Link>}
  nativeButton={false}` to `withTierOf(pathname, "/overview")`). That card
  has no plan action to offer, so
  the slot first held a disabled "Your current plan" label and then a "Back
  to Billing" link that only duplicated the page's own BackLink; sending the
  user INTO the product instead is the v0 "Start Building" pattern. No
  back-pointing arrow, because this is forward navigation, and returning to
  Billing remains the BackLink's job. Applies on the Free, Default, Pro and
  Enterprise views, resolving to `/overview-free`, `/overview-default`,
  `/overview` and `/overview-enterprise`. There is no disabled control
  anywhere on the page.
- Copy: the Free rung's action on the Pro-org view reads "Downgrade to
  Free", from the ticket's "Downgrade plan", which is why this one string
  departs from the dialog copy the rest of the ladder preserves verbatim.
  It names its TARGET the way every other button on the page does ("Upgrade
  to Pro", "Go to Overview"); a bare "Downgrade plan" read as an action
  against the Free card rather than a move to it. Its aria-label is
  "Downgrade to the Free plan", the same register. It still opens the shared
  `CancelPlanDialog` unchanged and stays `outline`.
- Copy: TWO contact paths, two labels. On the Free-org, Default and Pro-org
  views the Enterprise card's primary reads "Contact us", the ticket's own
  wording for the sales action: that org is a prospect. On the
  Enterprise-org view the Free and Pro rungs read "Contact support": that
  org is an existing customer routing to Support, not a prospect reaching
  sales. Both open the same dialog, which takes its TITLE from the label of
  the button that opened it, so the heading always matches the control the
  user clicked. "Book a demo" keeps its label and takes no glyph, there
  being no site precedent for one on a scheduling action.
- Copy (PRD-sourced, after a `triage-copy` pass): on the Enterprise-org view
  the FREE rung's caption reads "Available through Support." instead of
  "Free to use, forever", so both downgrade paths on that view read alike.
  Source: the Pro rung's existing caption on the same view plus the org/team
  PRD scope line that the Enterprise entitlement is granted and revoked by
  Support in the admin portal, with no self-upgrade. The Free-org, Default
  and Pro-org views keep "Free to use, forever" unchanged; the string is now
  one `SUPPORT_ROUTE_CAPTION` constant shared by both rungs.
- Copy (PRD-sourced): the forced-settings feature detail reads "Compression
  and security policies every team follows." instead of "Compression and
  security policies teams cannot override." Same fact, stated positively,
  dropping the negative mechanism. Source: PRD 8.5, "Forced settings apply
  to the team's traffic and are enforced at the gateway; teams see them as
  locked." The TITLE "Org and team forced settings" deliberately stays: it
  is the PRD's own term, which is also why `lint:copy` scores it
  prd-echo 0.78 without flagging it (`mechanic` 0.55, and both questions
  must clear 0.7). The six benefits labels are untouched, as inherited.
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
- Only the PROMOTED button wears a glyph, at most one per view: the
  SparklesIcon on "Upgrade to Pro". The cards already carry a `CircleCheck`
  on every feature row, so a glyph on every control read as decoration
  rather than as signal. The contact primary lost its Headset, "Go to
  Overview" is label-only, and "Downgrade to Free" and "Book a demo" were
  already bare. `PlanAction.icon` narrows to `"sparkles"` and the `Headset`
  / `Home` imports are gone.
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

### Contact and Book a demo: one modal, our own form (`pages/ManageSubscription.tsx`, `data/plans.ts`, `data/team-members.ts`) · [a8901a2]

- Before: a bordered placeholder frame in a Dialog, three generic fields,
  standing in for an embedded HubSpot form on both flows. It was briefly
  converted to a nested page earlier in the day and reverted the same day:
  the flow is a short form, not a detail surface, so it is a modal.
- The dialog carries the LABEL of the button that opened it, and that label
  is `contactFlowTitle(tier, flow)` from `data/plans.ts`, the same function
  that builds the button. Heading and control say the same string by
  construction, not by wiring: "Contact us" on the Free, Default and Pro
  views, "Contact support" on the Enterprise view, "Book a demo" from
  either. Escape closes and `finalFocus` returns focus to the exact opener.
- TWO bodies now, and the BORDER is the difference. The demo really does
  host a vendor-rendered scheduler in an iframe we cannot style, so its
  region keeps a visible `rounded-md` edge: the border says "this is theirs".
  The contact body is our own form on our own dialog, so it has no inner
  frame at all, because a card inside a card is chrome with nothing to say.
  `aria-busy` moved onto whichever region wraps the content, so loading is
  still announced in both.
- CONTACT is now OUR form, not an embed placeholder: on a signed-in surface
  the guidance is to build the form in our own framework and submit to
  HubSpot's Forms Submission API, so it uses our tokens, our voices and our
  own submit. Four fields and no more, Name, Work email, Company, Notes.
  Work email is the only one HubSpot requires by default and is what links a
  later booking to the same contact record; Company routes the enquiry;
  Notes captures the intent the ticket says we have no way to capture today.
  No phone, country, job title or employee count.
- All four are PREFILLED and all four stay EDITABLE. Name and Work email
  come from `signedInMember()` and Company from `WORKSPACE_NAME`, both new
  exports on `data/team-members.ts`: the owner row is who this build is
  signed in as, and the workspace name was a JSX literal repeated five times
  in `workspace-switcher.tsx` and is now read from one place. Notes has no
  prefill, it is the only thing we cannot know.
- Per-field error affordances, inline and never a summary block: validation
  fires on BLUR and on submit, never per keystroke, so a half-typed address
  is not flagged mid-entry. The invalid control takes `aria-invalid` plus
  `aria-describedby`, its `Field` takes `data-invalid`, and the message
  renders under its own field through `FieldError`, the pattern
  `BillingFree.tsx` already uses. Email checks FORMAT only; MX and
  deliverability are server-side and this is a mockup. The three required
  fields are marked with the word "Required" in the label row, never colour
  alone. Field errors and the frame-level `?form=error` state are separate
  and both previewable.
- DEMO reserves 480px, and that number is a PLACEHOLDER, not a measurement.
  No scheduling link exists yet, so the real widget has never been measured
  and its height is not controllable by the host; 480 is reasoned from the
  four-screen flow and the developer should size the container against the
  live scheduling page. It is a `min-h`, never a fixed height, so a shorter
  embed cannot leave a gap and a taller one grows the region. Its own
  booking form always collects first name, last name and email, HubSpot's
  documented default and not ours to change, so we draw none of our own
  fields in it and our footer carries only Cancel. It keeps the frame-level
  error, because a blocked script renders an empty container with no message
  of its own.
- The dialog now caps at `max-h-[90vh]` on an `auto 1fr auto` row template,
  with the body as the scrolling middle row. That is what lets a body of
  UNKNOWN height be safe: the popup can never grow past the viewport, the
  header and footer stay put, and anything taller scrolls. Verified across
  18 combinations, two flows by three simulated embed heights by three
  viewport heights (1000 / 700 / 520): nothing renders off-screen, the
  footer stays visible in every one, and the body scrolls exactly when it
  needs to.
- Labels: the contact submit reads "Submit form". Cancel is unchanged.
- On the ladder, contact and demo are buttons again rather than links, since
  they open a surface in place. Everything that still NAVIGATES stays a real
  anchor through one `hrefByIntent` map: "Go to Overview" and "Upgrade to
  Pro". Only the downgrade confirm and the two dialog openers are buttons.

### `?manage=1` retired; upgrade CTAs point at the page (`layouts/DashboardChrome.tsx`, `pages/models/FreeModels.tsx`, `test/deep-links.test.tsx`) · [48aa4a8]

- Before: the sidebar upgrade card and the Free Models upgrade banner
  navigated to `/billing-free?manage=1` / `/billing-default?manage=1`, and
  `BillingFree.tsx` read the param on mount and stripped it on dialog close.
- After: both go straight to `/billing-free/plans` / `/billing-default/plans`
  and the read-and-strip logic is gone. `deep-links.test.tsx` drops the
  `/billing-free manage` rows and its doc-table line, documents `?form=`
  in their place, and gains three cases asserting the two CTAs land on the
  `/plans` paths.

### Payment method: the action moves into the card-on-file row (`pages/billing/PaymentMethodCard.tsx`, `pages/BillingFree.tsx`) · [8e26eb6]

- Before: the row inside `CardContent` held only the brand badge and the card
  digits, with the right half of it empty, and the action sat below in a
  `CardFooter` with a `border-t`. Both states did this: `Update card` on the
  paid tiers and `Add card` on the `empty` state and on the Free page's own
  copy of the card.
- After: the button is the last child of the row, pushed right with
  `ml-auto shrink-0`, and the footer is gone from both files (the shared
  component no longer imports `CardFooter`). Vercel's placement, and the
  reason it is right here: the action operates on THIS card on file, not on
  the section, so a second saved card would take its own row action instead
  of one footer button that cannot say which card it means. Labels, variants,
  glyphs and `size="sm"` are untouched.
- The row is `flex flex-wrap items-center gap-4 rounded-xs border
  border-border bg-card-muted px-4 py-3`. `flex-wrap` plus `ml-auto` is what
  holds it together under pressure: one line wherever it fits, and the button
  drops to its own right-aligned line when the text and the button run out of
  room, rather than squeezing either. The badge gained `shrink-0` and the text
  column `min-w-0` so the badge never squashes and the copy wraps first.
- Vertical padding went `p-4` to `px-4 py-3` (user direction): the inset read
  too airy against a 40px badge. Measured at 1440 and 390 on `/billing`,
  `/billing-free` and `/billing-enterprise`: row 66px in every case except
  Free at 390, where the longer "No payment method on file" wraps the button
  to a second line at 114px. No card overflow anywhere, no `card-footer` left
  in the DOM, and the button's right edge sits on the row's 16px inset.
- Removing the footer also gives the card its bottom padding back:
  `has-data-[slot=card-footer]:pb-0!` on `Card` no longer matches, so the
  surface closes on the same `py-4` it opens with.

## Tests

### Payment method card placement (`test/payment-method-card.test.tsx`) · [8e26eb6]

- New suite, 4 cases, `render` under happy-dom: in both the default and the
  `empty` state the action is a descendant of the `bg-card-muted` row, that
  row also carries the badge and the card text, and the card renders no
  `[data-slot="card-footer"]` at all. A third case pins the two classes the
  layout rests on, `ml-auto` on the button and `flex-wrap` on the row. The
  fourth reads `BillingFree.tsx` and asserts its local copy of the card has
  the same shape, since the Free page owns its own markup and the two tiers
  have drifted before.

### Manage subscription ladder (`test/manage-subscription.test.tsx`) · [48aa4a8]

- 15 cases, `renderToString` inside a `MemoryRouter` at each of the four
  `/plans` paths: three plan cards everywhere; Free and Default promote Pro
  with the "Upgrade to Pro" filled CTA and leave Enterprise unfilled; Pro
  promotes Enterprise, marks Pro current and keeps "Cancel Pro plan" on the
  Free rung; Enterprise offers no "Upgrade" anywhere, carries exactly one
  "Current plan" badge and that badge is on the Enterprise card, and no card
  carries a filled CTA. Assertions are scoped to the `data-plan-card`
  articles so sidebar chrome cannot satisfy them.

### Contact dialog behaviour, and the ladder suite grows (`test/contact-dialog.test.tsx`, `test/manage-subscription.test.tsx`) · [a8901a2]

- New suite, 28 cases, `render` inside a `MemoryRouter`: the contact and
  demo controls open a dialog rather than navigating, Escape closes and
  returns focus to the exact opener, and each of the four `?form=` states
  renders its own affordance (enabled submit on `ready`, `aria-busy` with
  the fields gone on `loading`, a retained `role="alert"` plus retry on
  `error`, a `role="status"` confirmation with the submit collapsed on
  `done`). Submitting the mock form reaches `done` without touching the URL.
- The form's own contract is asserted, not assumed: exactly four fields in
  order, prefilled from `signedInMember()` and `WORKSPACE_NAME`, every one
  still editable rather than read-only or disabled, and the three required
  ones marked with a word rather than colour alone. Per-field errors fire on
  BLUR and never mid-entry, wire to their control, never flag the optional
  Notes field, and stay separate from the frame-level `?form=error` state.
- Two cases pin the border rule that distinguishes the bodies: only the demo
  keeps a visible boundary, and the demo draws none of our fields and no
  submit of ours, so a future refactor cannot quietly give the contact form
  a frame or the scheduler a submit button.
- The ladder suite gains groups for the Card tier elevation, the per-view
  lift treatment, the single promoted glyph, the Enterprise price row and
  its caption, and slot order inside a card; it now runs 131 cases.
