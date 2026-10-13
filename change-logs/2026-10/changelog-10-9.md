# UI Changelog: 2026-10-09

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-10-8.md`](./changelog-10-8.md)

---

## Sections

### Onboarding setup: Claude Code starts on an Anthropic model `4d02614`

`/overview-onboarding` setup step (`improved-setup.tsx`, `improved-data.ts`).
Before: choosing Claude Code kept the default pay-as-you-go model, and the
catalog picker listed models in plain catalog order. After: choosing Claude
Code sets the model to Claude Sonnet 5 (`CATALOG_DEFAULT_MODEL`) unless the
user already picked one, and the picker lists Anthropic's models first,
then the rest, each part in catalog order.

### Onboarding setup: route motion and model picker `83e06ae`

`/overview-onboarding` setup step (`src/pages/onboarding/improved-setup.tsx`,
`improved-art.tsx`, `onboarding-motion.css`, `use-onboarding-motion.ts`).

- **Route figure motion:** before, a static figure. After, it plays the
  ConnectArt beats: an 8px packet with a 36px blue dash trail, the Gate
  tile border gray to blue to gray, replayed when the app, billing or model
  changes (React key `app:billing:model`). Hover replay is off on this stage
  only (`data-motion-no-replay`). Reduced motion shows the end state.
- **Verify step live pulse:** before, clipped by a 0px padding box. After,
  fully visible.
- **Model picker:** before, Claude Code with Gate credits offered the same
  3-model Select as every app. After, it opens a searchable, scrolling
  `Combobox` over the whole catalog (`CATALOG_MODELS`, `improved-data.ts`),
  with "Search models…" and an empty line for no match; the route figure
  target follows the pick. Other apps keep the 3-model Select, and switching
  back to Claude Code restores the pick.

### Onboarding start page (phone and desktop picker) `df20e22`

`/overview-onboarding` (`src/pages/onboarding/improved-start.tsx`).

- **Phone Gate Chat card:** before, a Lisbon itinerary illustration
  (`MiniChat`) in a 156px inset. After, the desktop `ChatArt` at 75% scale,
  full inset width, in a 204px inset (`h-51`) with a `border-border`
  hairline; it loops (play, 3s hold on the end frame, 200ms clear, replay)
  while in view (`data-motion-loop`, `use-onboarding-motion.ts`).
- **Phone buttons:** 44px via Button `size="touch"` (start card and
  "Check your email" card); start cards use Card `elevation="raised"`.
- **Continue on desktop:** the laptop illustration became an inline 16px
  `Monitor` icon in the title.
- **Email setup link button:** before, sending navigated the phone to the
  handoff screen. After, it stays put: "Sending link…" with a spinner (3s),
  "Email sent!" with no icon (2s), then "Re-send email".
- **Copy:** Gate Chat description "Start chatting with a model of your
  choice" (desktop and phone); returning-user line "Your first conversation
  is saved in your chat history"; mock email `user@example.com`.
- **Desktop picker:** "Free model" badge removed. Method cards are now a
  `<label>` around `RadioGroupItem indicator="check"` (same 24px corner
  check, same look); focus ring sits on the check.

### Onboarding setup page `df20e22`

`/improved-connect-onboarding` (`src/pages/onboarding/improved-setup.tsx`),
Gate Connect and Manual setup.

- **Breadcrumb** "Setup method" (`BackLink`) above the title; the bottom
  "Change setup method" button is gone.
- **Right column,** 16px between sections: "Select an app" (`Field` +
  `FieldLabel`, 40px `SelectTrigger size="lg"`, grouped Anthropic /
  OpenAI / Other apps); "Select your billing type" (`FieldSet` +
  `RadioGroup`; selected card `shadow-sm`, other `shadow-xs`; card 1 now
  "Existing subscriptions"); with Gate credits, "Select a model" (40px,
  vendor icons) and an "Add credits" card ("Credit balance" mono value,
  Add credits / Add more credits on the right).
- **Progressive disclosure:** "Install Gate Connect" (or "API key" on Manual
  setup) appears only once credits exist; with Existing subscriptions it
  shows at once.
- **Gate Connect card:** Download / I already have, then "Start routing your
  app" with numbered steps (`StepIndicator`), "Turn routing on for {app}",
  "I've connected {app}" and a "Re-download Gate Connect" text trigger.
- **Route illustration:** dashes run tile edge to tile edge; Gate tile is a
  card-fill tile with the full-colour mark and gray border; labels reserve
  two lines so a wrapping model name moves nothing; the tile row sits 16px
  above centre; caption pinned top-left, 16px in ("Uses Gate credits" /
  "Billed by your provider"); stage 300px min, 16px padding,
  `border-border`; "Your provider" tile uses `Cloud` (was `KeyRound`).

### Retention helper carries the way past the ceiling `95cdb4b`

Settings > Data retention (`src/pages/settings/DataRetentionCard.tsx`).

- **Pro helper.** Before: the range only ("Your plan allows any window from
  0 to 90 days."), with the Enterprise path disclosed in the over-limit
  error. After: the range, then "For a longer window, contact us about an
  Enterprise contract." The link opens the contact dialog in place, titled
  "Contact us", the same way Enterprise's "contact support" link does.
- **Over-limit error.** Before (Pro): "Enter 90 or less. On Enterprise, a
  contract can extend it further; contact us." After, every tier: the fix
  only, "Enter 90 or less."
- **Free.** Before: the note sat in the footer beside Upgrade to Pro. After:
  it is the subtitle under "Free plan details": "Retention on the Free plan
  is fixed at 30 days. Pro plan lets you shorten the window or extend it to
  90 days." During a scheduled clamp it reads "Pro plan keeps your current
  window." The footer keeps only Upgrade to Pro, right-aligned.
- Enterprise unchanged.

### Messages retention statement `0279899`

Messages (`src/pages/requests/RetentionStatement.tsx`, mounted by
`Requests.tsx` through `RequestsTableSection`'s new `statement` slot), PRD
"Configurable data retention v1" mockup 04, AG-1021 Chunk 2.

- **New banner** between the toolbar (search, Filters, Export CSV) and the
  table, an info `Callout`: "Showing the last {days} days, back to {date}.
  Older messages are deleted, and their fingerprints remain verifiable."
  Free 30 days, Pro and Enterprise 90; the date is the oldest message inside
  the window. Same sources as the Settings card (`retentionCeilingDays`,
  `oldestInWindow` over `MESSAGE_TIMES`).
- **"Retention settings"** button (Button `info-outline`, in the Callout
  `action` slot) goes to that tier's Settings page. Admins only; Managers and
  Members see the statement without it.
- **Routes:** `/messages`, `/messages-free`, `/messages-enterprise`. Not on
  `/messages-default` (no messages). New preview route
  `/messages-free/clamp`: "Showing the last 90 days, back to {date}. On
  {clamp date}, messages older than 30 days are deleted and their
  fingerprints remain verifiable.", with the button going to
  `/settings-free/clamp`.
- The table is not filtered to the window (the real build's job).

### Retention copy: "fingerprints" only `0279899`

Before: "Digital Evidence fingerprints". After: "fingerprints". In the
Settings retention card description ("Audit hashes, proofs, and fingerprints
are kept, …"), the lengthen toast ("Their fingerprints remain verifiable."),
the downgrade dialog (`cancel-plan-dialog.tsx`, "Their fingerprints stay,
…") and the Messages banner. Other features' "Digital Evidence" copy is
unchanged.

## Components

### `Combobox` primitive `83e06ae`

New `src/components/ui/combobox.tsx`, from the shadcn base-nova `combobox`
registry source (written by hand; `shadcn add` would have overwritten
button, input, textarea and input-group). Popup, row, label and empty
styles follow the Select recipe; it portals like `SelectContent`;
`ComboboxTrigger size` (opt-in) renders `selectTriggerVariants`; the search
input sits inset `m-2 mb-1` so its focus ring is not clipped. The chips parts
were dropped (unused). Documented in `design.md` beside MultiSelect.

### RadioGroupItem `indicator="check"`, Select `lg`, download link trigger `df20e22`

- **`RadioGroupItem`** (`src/components/ui/radio-group.tsx`): new
  `indicator="check"`, a 24px circle that fills primary with a 14px check,
  for a radio marking a whole card from its corner. Default `dot` unchanged.
- **`SelectTrigger` `size="lg"`** (`select-variants.ts`): 40px, for a
  lone field leading a setup step. `sm` / `default` unchanged.
- **`DownloadGateConnectDialog`** (`DashboardDefault.tsx`): `trigger="link"`
  renders a `TextLink` trigger with a custom label; its three other call
  sites keep the primary button.
- design.md: Radio and Input entries record the new options (net-zero lines).

### Button shadow rule, `touch` size `32354e2`

`src/components/ui/button.tsx`, documented in `design.md` (Buttons, Touch
Targets).

- **Shadow rule.** Before: `default` and `secondary` had no shadow while
  `outline` carried `shadow-xs`. After: every variant with a surface (a fill
  or an edge) carries `shadow-xs` (`default`, `secondary`, `outline`,
  `ghost-to-outline` from `lg`); tinted variants (`destructive`, `promo`,
  `info-outline`, the lift family) stay flat and `raised` keeps `shadow-sm`.
  Every primary and secondary button on the site gains the shadow.
- **`touch` size.** New: 44px (`h-11`), otherwise `default`, for full-width
  actions in a phone-only layout. The one exception to "`default` is the
  largest size". No consumer yet.

### Card `elevation` prop `32354e2`

`src/components/ui/card.tsx`, documented in `design.md` (Cards &
Containers). New prop: `default` keeps the card tier's `shadow-xs`; `raised`
is `shadow-sm`, for a standalone choice card on a phone layout. No consumer
yet. `CardTitle` also accepts `htmlFor` when rendered `as="label"`.

### Callout icon gap 12px on every Callout `903ff0a`

`src/components/ui/callout.tsx`. Before: plain Callouts put the icon 8px
(`gap-2`) from the text; only Callouts with an action used 12px. After:
every Callout uses 12px (`gap-3`): Billing plan notes, BillingEnterprise
state banners, team Settings locked notes, the retention card and shorten
dialog notes, the Site Map note, the Messages banner. design.md Callout spec
updated.

### Retention plan details values right-aligned `903ff0a`

Settings > Data retention, every tier (`DataRetentionCard.tsx`). Before:
values left-aligned beside their labels. After: once label and value share a
row, values sit flush right in tabular figures, on one right edge with the
window input and the footer buttons, so Current window lines up under the
input. Stacked on a narrow list they stay left. The column is capped at
1024px, so the gap never stretches further.

### Callout `action` slot, Button `info-outline` `0279899`

- **`Callout`** (`src/components/ui/callout.tsx`): optional `action` prop,
  one control at the right edge. With it, the icon and text are one group,
  12px apart, centred against the control (before, the icon sat at the top
  while the text centred, so it floated); the group keeps a 16rem floor so
  the control wraps below on a narrow column. Without it the Callout is
  unchanged (8px icon gap).
- **`Button` `info-outline`** (`src/components/ui/button.tsx`): `border-info-border
  bg-transparent text-info-foreground-strong hover:bg-info-wash`, existing
  `--info-*` tokens only, for a control on an info Callout.
- Both documented in `design.md` (Button variants, Callout).
