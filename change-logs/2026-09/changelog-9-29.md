# UI Changelog: 2026-09-29

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-9-26.md`](./changelog-9-26.md)

---

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
