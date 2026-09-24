# UI Changelog: 2026-09-24

Running log of every UI change to the dashboard, written to diff against and
replicate across surfaces. What changed, before to after, and where.

Prior day: [`changelog-9-23.md`](./changelog-9-23.md)

---

## Sections & surfaces

### Plans: the Enterprise card lists four scoped features (`data/plans.ts`) · [82bad79]

The Enterprise card on the plans ladder (ManageSubscription) takes the
user's copy verbatim.

- **Benefits label**, both Enterprise returns: "Included with the Enterprise
  plan:" to "Everything in Pro, plus what we scope with you:".
- **`ENTERPRISE_FEATURES`**, before: Org and team forced settings, Private
  cloud deployment, Custom retention, Procurement support. After: Private
  cloud deployment, Custom limits and retention, Security review and
  contracting, Premium support. Details carry no trailing periods.
- "Org and team forced settings" is removed. `BillingEnterprise.tsx` is
  unchanged.
