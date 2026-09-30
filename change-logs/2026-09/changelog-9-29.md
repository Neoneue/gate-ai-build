# UI Changelog: 2026-09-29

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-9-26.md`](./changelog-9-26.md)

---

## Components

### Select: `SelectValue` renders its placeholder (`components/ui/select.tsx`) · [3b9d6c6]

- **Before:** the `SelectValue` wrapper always passed Base UI a function
  child (for the item-label lookup), which suppresses Base UI's own
  `placeholder` prop, so `<SelectValue placeholder="..." />` never
  rendered. The contact form worked around it with a local function child.
- **After:** the wrapper destructures `placeholder` and the default
  function child returns it when the selection is empty. New
  `isEmptySelection` (null, `""` or an empty array) matches Base UI's
  `hasSelectedValue` test.
- Plans contact form (`pages/ManageSubscription.tsx`): Company size uses
  `<SelectValue placeholder="Select size" />`; the workaround and its
  comment are gone. The trigger reads "Select size" with
  `data-placeholder` until a size is picked.
- The other placeholder call sites all default to "all", so they show no
  visible change; the contact form is the one surface that starts empty.

## Sections & surfaces

### Plans: the Contact us form carries the six ticket fields (`pages/ManageSubscription.tsx`) · [cc5a65b]

- **Before:** the contact modal on `/billing/plans` had one combined Name
  field, Work email, Company and an optional Notes field.
- **After:** six fields, per the ticket ("first name, last name, work
  email, company, company size, message"):
  - First name + Last name on one row (`grid-cols-2 gap-4`), both
    required, prefilled from the signed-in member via a new `splitName`
    helper.
  - Work email and Company unchanged (required).
  - New optional Company size `Select`, placeholder "Select size", with
    HubSpot's 7 default "Number of Employees" options (1-5, 5-25, 25-50,
    50-100, 100-500, 500-1000, 1000+). The real build reads them from the
    HubSpot portal.
  - Notes renamed Message (optional `Textarea`).
- Form `name` attributes use HubSpot contact property names (`firstname`,
  `lastname`, `email`, `company`, `numemployees`, `message`). Loading
  skeleton rows 4 to 5. Block comments updated.
- Tests (`test/contact-dialog.test.tsx`) cover the six fields, the name
  row, the size options and the name errors.

### Models: free models read "Free" on their detail pages (`pages/Models.tsx`) · [fd4c6af]

- **Before:** the model detail KPI rail (`ModelKpiRail`) showed the catalog
  list price for Input and Output on every model, so the two Free models
  (`openai/gpt-oss-20b`, `deepseek/deepseek-v4-flash-0731`) read a price on
  their detail page while their cards read "Free".
- **After:** a model listed in `FREE_MODELS` (`data/free-models.ts`) shows
  "Free" in both the Input and Output tiles, matching its card. Every other
  model keeps its list price (Sonnet $2.00/M and $10.00/M; DeepSeek V4
  Flash Latest $0.09/M and $0.17/M).
- One edit covers every tier: `/models`, `/models-free`, `/models-default`
  and `/models-enterprise` all render `Models.tsx`.
