---
status: accepted
---

# One CM360 campaign per Campaign Type, not one per media plan

We originally agreed a media plan translates to exactly one CM360 campaign (decisions-status.md §1 #12), matching a `HierarchySchema.campaign` singular object. Revisited during grilling: a plan can contain tactics of different Campaign Types (e.g. Display and Standard Tracking), and forcing them into one campaign either loses the distinction CM360 itself makes between campaign types or requires awkward workarounds within a single campaign's entity graph.

Decided instead: **one CM360 campaign per distinct Campaign Type present in the plan**. `campaign` becomes `campaigns[]`; Step 2 emits one hierarchy per Campaign Type; each gets independent Hierarchy Versioning; the review UI renders one collapsible card per Campaign Type. A plan with only Display tactics still produces exactly one campaign, so the common case is unaffected.

Scope stays at the three already-agreed Campaign Types (Display, Standard Tracking, YouTube) — this ADR is about cardinality per type, not about adding types.

Consequences: `schemas.ts`, the persistence model (`hierarchy_versions` keyed by campaign type, not just job), and chat editing (fan out each message to every existing campaign-type hierarchy, let each decide relevance) all need to reflect the plural shape.
