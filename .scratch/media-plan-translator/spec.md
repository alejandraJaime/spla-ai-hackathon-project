# Spec: Media Plan → CM360 Hierarchy Translator (prototype)

Status: ready-for-agent

Sources: `docs/prod-domain-docs/decisions-status.md`,
`.scratch/prompts/product-prompt.md`, `CONTEXT.md`, `docs/adr/0001-one-campaign-per-campaign-type.md`,
`docs/prod-domain-docs/campaign-spec.md`, `docs/prod-domain-docs/taxonomy-fields.json`,
`docs/prod-domain-docs/schemas.ts`, `docs/prod-domain-docs/s{1,2,3}-*-prompt.md`,
`docs/prod-domain-docs/flow-diagram.mermaid`.

---

## Problem Statement

A media planner hands over a media plan as a spreadsheet with no fixed schema — a non-tabular
header block, inconsistent columns, blank cells, `TBD` values, vague dates, free-text notes.
Turning that into the correct entity hierarchy inside Campaign Manager 360 is manual,
repetitive and error-prone: the trafficker has to know which Campaign Type each line is, which
entities that type builds, how creative sizes fan out into placements and ads, which values are
allowed, and what naming taxonomy every entity must follow. Doing it by hand for a
three-size display line means creating a campaign, a site, a landing page, three creatives,
three placements and three ads, each correctly named and correctly linked.

Two failure modes make it worse. First, plans are incomplete — a size column says
"responsive", a rate says TBD — and the trafficker silently fills the gap from experience, so
nobody downstream knows which values came from the plan and which were invented. Second, the
first pass is never the last: the client changes a size, drops a line, renames the campaign, and
the trafficker re-does the fan-out by hand with no record of what changed between passes.

## Solution

A local web tool. The user uploads one `.xlsx` media plan, picks CM360 as the target platform,
and clicks translate. The backend parses the workbook to text, then runs a deterministic chain
of two schema-constrained LLM calls: **Step 1** normalises the messy grid into a platform-agnostic
Plan, **Step 2** translates that Plan into a CM360-shaped entity hierarchy, applying the
campaign-spec's build patterns and fan-out rules, snapping every value to the field dictionary,
and building every entity name from the naming taxonomy. Per ADR-0001 it emits one CM360
campaign per distinct Campaign Type present in the plan.

Every inference the model had to make is surfaced as an explicit, reviewable Assumption — never
silently applied — split into plan-level gaps ("From your plan") and structural modeling choices
("Structural inference"). The result renders as a friendly tree, one collapsible card per
Campaign Type, alongside an assumptions panel and a Plan Version history.

The user then refines it in plain language through a single job-wide chat panel: "add a 100x100
display placement", "drop the contextual line", "make the banners CPC". Each message fans out to
every Campaign Type's current hierarchy; each independently decides whether the instruction
applies to it, and returns either a full new Hierarchy Version with a one-line change summary or
"No change". A message that changes at least one campaign produces a new Plan Version, so the
whole history is browsable.

The prototype produces the hierarchy **as data**. It does not call the CM360 API.

## User Stories

**Upload and job creation**

1. As a trafficker, I want a home screen with a file dropzone, so that I can start a translation without reading documentation.
2. As a trafficker, I want to pick the target platform (CM360, the only option in the prototype), so that the tool's output is explicitly scoped to the platform I traffic in.
3. As a trafficker, I want a "Translate media plan for CM360" button that is disabled until a file is selected, so that I can't start an empty run.
4. As a trafficker, I want to pick which model runs the translation from a picker that only offers models whose API key is actually configured, so that I never select an option that will fail.
5. As a trafficker, I want the picker to default to Gemini Flash, so that the cheap iteration path is the zero-effort path.
6. As a trafficker, I want to upload a `.xlsx` with a non-tabular header block and merged/inconsistent columns and have it accepted as-is, so that I don't have to reformat the planner's file first.
7. As a trafficker, I want a clear rejection message when I upload something that isn't an `.xlsx`, so that I know the problem is my file and not the tool.
8. As a trafficker, I want a clear rejection message when the workbook can't be parsed, so that I'm not left staring at a spinner.
9. As a trafficker, I want clicking translate to create a Job with its own id and URL, so that I can come back to this translation later.
10. As a trafficker, I want the Job to record which model produced it, so that a later comparison of Flash vs. Sonnet output is traceable.
11. As a trafficker, I want a progress/loading state while the pipeline runs, so that I know the tool is working and roughly where it is.
12. As a demo presenter, I want both sample plans (greenfield and brownfield) reachable in one click from the upload screen, so that I can show the happy path and the assumptions story without hunting for files.

**Step 1 — extraction into a Plan**

13. As a trafficker, I want each media-plan line item to become exactly one Tactic, so that nothing in the plan is silently merged or dropped.
14. As a trafficker, I want each Tactic to carry its source row identifier, so that I can trace any generated entity back to the line it came from.
15. As a trafficker, I want free-text channel/format wording ("banners", "pre-roll", "floodlight") normalised to the schema's coarse values, so that the plan's vocabulary doesn't leak into the hierarchy.
16. As a trafficker, I want vague dates resolved to ISO dates where the context allows and left null where it doesn't, so that I can see which dates are real.
17. As a trafficker, I want approximate money ("~30k") parsed to a number with the approximation recorded, so that the budget is usable but not falsely precise.
18. As a trafficker, I want tracking/pixel/floodlight lines flagged as tracking-only, so that they aren't built as served ads.
19. As a trafficker, I want missing sizes left empty rather than invented at this step, so that the defaulting decision happens once, visibly, in Step 2.
20. As a trafficker, I want every gap and inference recorded as a plan-level or tactic-level assumption, so that nothing is filled in behind my back.

**Step 2 — translation into a CM360 hierarchy**

21. As a trafficker, I want one CM360 campaign per distinct Campaign Type in my plan, so that a mixed Display + Tracking plan models the way CM360 actually models it.
22. As a trafficker, I want a plan containing only Display tactics to still produce exactly one campaign, so that the common case stays simple.
23. As a trafficker, I want each Tactic's Campaign Type resolved by the campaign-spec's stated rules, so that classification is predictable rather than vibes.
24. As a trafficker, I want a Display tactic with three sizes to expand into three creatives, three placements and three ads with each ad linking its size-matched pair, so that I don't hand-build the fan-out.
25. As a trafficker, I want the same Display tactic across two sites to produce six placements, three reused creatives and six ads, so that the site axis is handled without duplicating creatives.
26. As a trafficker, I want a tracking tactic to produce exactly one 1 x 1 placement, one 1 x 1 tracking creative and one tracking ad linking them, so that tracking lines follow the standard tracking pattern.
27. As a trafficker, I want a YouTube/video tactic built with the minimal in-stream pattern fanned out by video size, so that video lines aren't forced into the display pattern.
28. As a trafficker, I want every entity named from the naming taxonomy with dictionary spelling, so that the output matches house convention without me renaming anything.
29. As a trafficker, I want a taxonomy token whose value is genuinely missing to be dropped rather than emitted as an empty delimiter, so that names stay clean, with the omission recorded as an assumption.
30. As a trafficker, I want values that aren't in the field dictionary snapped to the nearest allowed value, with the snap recorded, so that the output is always dictionary-valid and I can see where it bent.
31. As a trafficker, I want sizes in one canonical `WIDTH x HEIGHT` form everywhere — plan, hierarchy and display — so that I never have to reconcile two spellings.
32. As a trafficker, I want missing fields filled from the campaign-spec's documented defaults rather than the model's imagination, so that defaults are reviewable and consistent between runs.
33. As a trafficker, I want a channel with no build pattern (e.g. audio) recorded as an assumption rather than built or silently dropped, so that I know it was seen and skipped.
34. As a trafficker, I want entity ids stable and never renumbered for untouched entities, so that version-to-version comparison is meaningful.
35. As a trafficker, I want plan-level assumptions carried forward into the hierarchy alongside new structural ones, so that the review panel is the single place I check.

**Validation, retry and failure**

36. As a trafficker, I want the generated hierarchy checked for referential integrity in code, not just schema shape, so that a plausible-looking hierarchy with a dangling ad reference never reaches me.
37. As a trafficker, I want the check to confirm every ad's placement and creative references resolve, so that nothing points at a non-existent entity.
38. As a trafficker, I want the check to confirm every non-tracking ad links exactly one creative whose size matches its placement's size, so that the fan-out is actually correct and not just plausible.
39. As a trafficker, I want the check to confirm every tracking placement and creative is 1 x 1 and marked as tracking, so that tracking lines can't be built as served ads.
40. As a trafficker, I want the check to confirm exactly one campaign per Campaign Type and no cross-type entity assignment, so that ADR-0001's cardinality rule holds in the data and not just in the prompt.
41. As a trafficker, I want a failed generation retried automatically within a small budget, so that a one-off bad response doesn't cost me a re-upload.
42. As a trafficker, I want shape failures and integrity failures to share one retry budget, so that behaviour is predictable regardless of which check tripped.
43. As a trafficker, I want an exhausted retry budget to persist what the model produced with a `needs_clarification` status instead of throwing it away, so that I can see how close it got.
44. As a trafficker, I want a `needs_clarification` Hierarchy Version rendered in the same tree with the failing parts flagged, so that I don't have to learn a second UI for the failure case.
45. As a trafficker, I want to resolve a `needs_clarification` version by typing a plain-language clarification into the chat, so that the failure is a conversation rather than a dead end.
46. As a trafficker, I want a Step 1 extraction that fails after all attempts to surface an error and not leave a half-created Job, so that my job list stays trustworthy.

**Review screen**

47. As a trafficker, I want the hierarchy rendered as a tree rather than raw JSON, so that I can read it at a glance.
48. As a trafficker, I want one collapsible card per Campaign Type, so that a mixed plan doesn't overwhelm me with everything at once.
49. As a trafficker, I want an open card fully expanded internally, so that I'm not clicking through nested disclosure to see a placement's creative.
50. As a trafficker, I want each placement to show its size, compatibility, pricing model, rate and dates, so that I can spot a wrong default without opening a JSON view.
51. As a trafficker, I want each ad to show which placement and which creative it links, so that I can verify the linking myself.
52. As a trafficker, I want each entity to show which Tactic it came from, so that I can trace anything back to the plan.
53. As a trafficker, I want the assumptions panel split into "From your plan" and "Structural inference", so that I can tell a gap in the planner's file from a modeling choice the tool made.
54. As a trafficker, I want each Campaign Type card to show its own current Hierarchy Version number, so that I can see which parts of the plan have been edited.
55. As a trafficker, I want a job-wide Plan Version selector, so that I can browse the plan as it stood at any point.
56. As a trafficker, I want selecting an earlier Plan Version to render the exact hierarchy each Campaign Type was at then, so that history is real and not approximate.
57. As a trafficker, I want the counts (campaigns, placements, creatives, ads) visible per card, so that I can sanity-check the fan-out arithmetic at a glance.

**Chat editing**

58. As a trafficker, I want one chat panel for the whole Job rather than one per card, so that I don't have to decide which campaign an instruction belongs to.
59. As a trafficker, I want to add an entity in plain language ("add a 300 x 600 display placement"), so that I don't hand-wire the placement, creative and ad myself.
60. As a trafficker, I want adding a size to also add its creative and its linking ad per the fan-out pattern, so that the edit leaves a complete, valid hierarchy.
61. As a trafficker, I want to remove a line in plain language and have the ads that referenced it removed or repointed, so that no dangling references survive my edit.
62. As a trafficker, I want to rename or re-date the campaign in plain language, so that a late client change is one sentence, not a re-run.
63. As a trafficker, I want a plan-wide instruction ("change the country to GB") to reach every Campaign Type at once, so that I don't repeat myself per card.
64. As a trafficker, I want an instruction that doesn't apply to a Campaign Type to leave that hierarchy untouched, so that a Display-only edit doesn't churn my Tracking campaign.
65. As a trafficker, I want a no-op to create no new Hierarchy Version for that Campaign Type, so that version history stays a record of real changes.
66. As a trafficker, I want a message where nothing applied anywhere to create no new Plan Version, so that the version counter means something.
67. As a trafficker, I want each changed campaign to report a one-line change summary in my own terms, so that I can confirm the tool understood me.
68. As a trafficker, I want an out-of-dictionary request (100x100) snapped to the nearest allowed size, applied, and explained, so that the tool bends rather than refuses.
69. As a trafficker, I want my edits to preserve everything I didn't mention, so that a small instruction doesn't quietly rewrite the hierarchy.
70. As a trafficker, I want entity ids preserved across an edit for untouched entities, so that the version history remains comparable.
71. As a trafficker, I want the chat log to persist with the Job, so that reopening it shows how the plan got to where it is.
72. As a trafficker, I want the chat input disabled while a message is being processed, so that I can't fire two overlapping edits at the same hierarchy.
73. As a trafficker, I want the tree and the assumptions panel to re-render after each message, so that I always see the current state.
74. As a trafficker, I want to type only in chat and never inline-edit a field, so that every change to the hierarchy has a recorded, summarised provenance.

**Persistence and demo user**

75. As a trafficker, I want my Job and every version persisted in Postgres, so that a page reload doesn't lose the work.
76. As a demo presenter, I want a single seeded demo user owning everything with auth stubbed, so that the demo has no login step.
77. As a demo presenter, I want the greenfield sample to run clean end-to-end with few assumptions, so that the happy path reads as a happy path.
78. As a demo presenter, I want the brownfield sample to produce a genuinely populated assumptions panel, so that the "we surface every inference" claim demonstrates itself.

## Implementation Decisions

### Architecture

- **Typed transformation pipeline, not an agent.** Three fixed `generateObject` calls with Zod
  schemas. No tool-calling loop, no agent framework. Code owns the schemas, the prompts, the
  deterministic validation and the plumbing; the model only does the semantic transformation.
- **Module layout follows `docs/FILE_CONVENTIONS.md`, rebased onto this repo's actual root.**
  The conventions document describes `app/web/src/lib/<module>/`; this repo is a plain T3
  scaffold with `src/` at the root, so modules live at `src/lib/<module>/`. Everything else in
  that document applies as written: `.repository.ts` / `.service.ts` / `.validation.ts` /
  `.types.ts` / `.schema.ts` / `.router.ts` suffixes, `Schema_` prefix on Zod exports with
  inferred types in `.types.ts`, `I` prefix on interfaces, per-module `errors.ts`, routers
  mounted in `src/server/api/root.ts` and table schemas re-exported from
  `src/server/db/schema.ts` — two independent wiring points, appended at the end of each list.
- **Modules.** Four: a translation/job module (jobs, versions, messages, the pipeline
  orchestration), an llm provider module (model resolution + the single test seam), a
  hierarchy-validation module (the §8 invariants and taxonomy helpers, pure), and an
  xlsx-parsing module (SheetJS). The provider and validation modules have no knowledge of
  tRPC, Next.js or the database.
- **Transports are thin.** The upload Route Handler and every tRPC procedure only parse input,
  resolve the demo user, and call a service function. No business logic in either
  (`docs/CODING_STANDARDS.md` §1.4, §2).
- **Errors.** Every user-visible message comes from a named `MyAppError` subclass with a literal
  `code`, named after the business condition — e.g. unsupported file type, workbook parse
  failure, extraction exhausted, job not found. Services throw them; procedures attach them as
  `cause` on a `TRPCError`; the global `errorFormatter` is the only place that unpacks them.
  Anything not an app error gets a generic client message and a full server-side log.

### Data contracts

- `docs/prod-domain-docs/schemas.ts` is promoted into the codebase as the module's Zod
  validation source. Two contracts: the Plan (Step 1 output) and the Hierarchy (Step 2 and
  Step 3 output). Renamed to the `Schema_` convention on the way in, with inferred types moved
  to the module's `.types.ts`.
- **Hierarchy entities are flat arrays with id references** (`campaigns`, `sites`,
  `landingPages`, `placements`, `creatives`, `ads`), mirroring CM360's relational model — not a
  strict tree. An ad references placements _and_ creatives by id.
- **`campaigns` is an array** (ADR-0001). Step 2 returns one entry per distinct Campaign Type
  found in the tactics. A **stored Hierarchy Version always holds exactly one entry**, because
  Step 2's output is split by Campaign Type before persistence.
- **Enums are generated from `taxonomy-fields.json`**, not hand-copied. The dictionary is the
  single source of truth for allowed Size, Media Type, Campaign Type, Tactic, Campaign
  Objective, Country and the rest; the Zod enums that code enforces derive from it so the
  prompt and the schema cannot drift apart. `schemas.ts`'s current enum values are explicitly
  illustrative.
- **One canonical size form**, the dictionary spelling `"WIDTH x HEIGHT"` with spaces, used in
  the plan, the hierarchy, the UI and the taxonomy names. `splitSize()` is the only way numbers
  are obtained; no second representation is stored.
- **`s1-extractor-prompt.md` rule 3 must be corrected.** It currently instructs the model to
  emit `"300x250"` with no spaces, which fails the Plan schema's size regex on every attempt and
  would burn the whole retry budget deterministically. The prompt changes to emit the spaced
  dictionary form; the canonical-size decision stands unchanged.
- `campaign-spec.md`'s references to `taxonomy-fields.md` are corrected to `.json` when it is
  loaded as prompt context.

### Persistence (Drizzle / Postgres, jsonb)

Four tables, using the scaffold's existing `createTable` prefix helper, each defined in a
module `.schema.ts` and re-exported from `src/server/db/schema.ts`:

- **`jobs`** — id, owner (the demo user), platform, source-file reference, the model id used,
  the extracted Plan as `jsonb`, timestamps.
- **`hierarchy_versions`** — append-only, keyed by **(job, Campaign Type)** with version numbers
  **numbered independently per Campaign Type**; the hierarchy as `jsonb`; a status
  (`ok` | `needs_clarification`); structured validation errors as `jsonb` when the status is
  `needs_clarification`; the `changeSummary` for the message that produced it; created_at.
- **`job_versions`** — the Plan Version: job id, version number, created_at, the originating
  message id (null for Plan Version 1), and a **pointer map** `{campaignType: hierarchyVersionId}`.
  It stores pointers, never a duplicated copy of hierarchy jsonb. Unchanged Campaign Types point
  at their prior Hierarchy Version.
- **`messages`** — job id, role, content, and **`resulting_version_ids`** (plural — one message
  fans out to N campaigns and may produce 0..N new Hierarchy Versions).
- **`users`** — the single seeded demo user. Auth is stubbed: a fixed demo-user id resolved
  server-side, not from a session.

The plan and hierarchy are `jsonb` blobs rendered from JSON. The entity graph is deliberately
**not** normalised into relational tables. Append-only versions are what give version history
for free.

### Pipeline: Step 1 → Step 2

- **Ingest** happens in a Next.js Route Handler (not tRPC — a multipart file upload is a poor
  fit for tRPC's batching/superjson transport, and `docs/CODING_STANDARDS.md` §1.4 keeps the two
  transports separate). It validates the extension, parses the workbook with SheetJS into
  CSV-ish text, and rejects with a message on wrong extension or parse failure. There is no
  recovery flow beyond the rejection. The resulting text is handed to tRPC for the rest.
- **The raw grid is handed to the model as-is**, header block included. Absorbing the lack of
  schema is the model's job, not a pre-processing step's.
- Step 1 produces the Plan; Step 2 takes the Plan plus the field dictionary and the
  campaign-spec as prompt context and produces the Hierarchy.
- **After Step 2, the `campaigns[]` output is split by Campaign Type** into one
  single-campaign Hierarchy Version per type, each starting at Hierarchy Version 1, with the
  entities partitioned by their `campaignId`. **Plan Version 1** is then written pointing at
  those.
- **Blocking `generateObject` with a loading state.** `streamObject` is explicitly
  time-permitting polish, not a requirement.
- **Model resolution feature-detects configured keys.** `src/env.js` gains optional provider key
  variables; a query exposes which models are usable so the picker can only offer those. Default
  is Gemini Flash. There is no runtime API-key-entry UI — `.env` only. The chosen model id is
  stored on the Job for provenance.

### Validation and retry

- **Two checks, one budget.** Zod conformance (enforced by the AI SDK) and the campaign-spec §8
  referential-integrity pass (enforced in code) share a **2-retry / 3-attempt-total budget per
  step**. No special-casing by failure type — both resolve the same way.
- **The §8 pass is a pure function**: hierarchy in, structured list of violations out. It
  enforces resolvable ad→placement and ad→creative references; exactly one size-matched creative
  per non-tracking ad; tracking entities 1 x 1 / `TRACKING` / `isTracking: true`; YouTube
  entities `IN_STREAM_VIDEO`; resolvable `campaignId`/`siteId`/`landingPageId`; sizes present in
  the dictionary's allowed list; and exactly one campaign per Campaign Type with no cross-type
  entity assignment.
- **On retry**, the failed attempt's validation errors are fed back into the next attempt as
  context, so the model is correcting a named problem rather than re-rolling.
- **On exhaustion at Step 2 or Step 3**, the non-conforming output is persisted as a
  `needs_clarification` Hierarchy Version together with the structured errors, and rendered in
  the same tree UI with the failing parts flagged. The user resolves it by adding a
  natural-language clarification, which becomes input to the next attempt.
- **On exhaustion at Step 1**, no Job is created and the error surfaces to the user — there is
  no partial-Job state.

### Chat editing (Step 3)

- **Full hierarchy regeneration per edit**, not structured edit-ops or JSON-patch.
- **One shared chat panel per Job.** Every message runs the Step 3 call **once per existing
  Campaign Type hierarchy**, each given the full instruction plus that campaign's own current
  hierarchy. Each call decides relevance itself. There is no message-routing or
  target-inference layer — that was considered and rejected.
- A call that finds nothing to do returns the hierarchy **unchanged** with
  `changeSummary: "No change"`, and **no new Hierarchy Version row is written** for that type.
- **A single-campaign edit and a plan-wide edit are literally the same code path**; only how
  many of the parallel calls produce a real diff differs.
- **A new Plan Version is created only if ≥1 campaign produced a real change.** Its pointer map
  carries the new Hierarchy Version ids for changed types and the prior ones for unchanged types.
- **Custom tRPC mutation returning `{planVersion, perCampaignResults}`** plus a locally-held
  message list — deliberately **not** the AI SDK's `useChat`, because the response is a
  structured object, not streamed text.
- **`s3-editor-prompt.md` rule 5 has already been reconciled** with the fan-out design (rule 0
  decides relevance first and no-ops; rule 5 now applies only to instructions that _are_
  relevant). No further change needed there.
- **Id stability is a hard requirement of the edit path**, since the UI's version comparison
  keys on ids. New ids continue the existing numbering rather than renumbering.

### Domain knowledge as prompt context

The field dictionary, the campaign-spec and the three step prompts are **versioned documents
loaded into prompts as context**, not hard-coded logic. They move from
`docs/prod-domain-docs/` into a location the server can read at runtime. Hard-constrained
dictionary values are additionally encoded as Zod enums so code enforces what the prompt only
suggests.

### UI

- **shadcn/ui primitives + AI Elements** for the chat panel. Per `docs/UI_CONVENTIONS.md`,
  primitives are added via the shadcn CLI into `components/ui/`, not hand-written or imported
  speculatively; `cn()` is used wherever a component takes a `className`; theme tokens are
  preferred over raw Tailwind colors.
- **Plan Version history maps to the AI Elements `checkpoint` component.**
- **The hierarchy tree is a custom component** — one collapsible card per Campaign Type, fully
  expanded internals within an open card, no further per-node collapsing.
- **The assumptions panel is one component with two visually distinct labeled children**:
  "From your plan" (plan-level) and "Structural inference" (structural).
- Feature components are colocated under `src/app/**/_components/`. One convention, not mixed
  with a top-level feature-components folder.
- Two screens: an upload/new-translation screen, and a per-Job review screen at its own URL.

### Scale note

The version selector and the tree render a single Job's data with a bounded entity count, so
`docs/UI_CONVENTIONS.md`'s server-side pagination/query-object requirement does not apply here —
there is no listable, growable table in this feature. If a job list is added later, it follows
that convention.

## Testing Decisions

### What makes a good test here

A good test asserts **external behavior at a stable boundary**: given this media plan text and
this model output, what does the user get back and what is persisted? It does not assert how
many internal functions were called, what a service passed its repository, or the shape of an
intermediate value that isn't part of a contract. Prompt wording, module file layout and
internal helper signatures must all be free to change without touching a test. Concretely: assert
on the returned hierarchy, the persisted rows, the version numbers, the assumption lists and the
change summaries — never on prompt strings or call counts.

### The seam: one, at the LanguageModel

**There is exactly one test seam in the codebase: the LanguageModel.** The llm provider module
exposes model resolution as its only injection point, and tests substitute the AI SDK's mock
language model with canned structured responses.

```
tests ──> createCaller(appRouter)      [real tRPC]
            ├─> services / repositories [real]
            ├─> Postgres (docker)       [real]
            └─> getModel()  ◀── SEAM ── mock LanguageModel (canned results)
```

Everything below the seam runs for real: real tRPC procedures via `createCaller`, real services,
real Drizzle repositories, real Postgres from `docker-compose.yml`. This is the highest available
seam and it keeps the retry budget, the §8 pass, the campaign-splitting, the version numbering,
the pointer map and the chat fan-out all inside the tested region rather than mocked around.

Rejected alternatives, recorded so they aren't reintroduced: a repository interface seam with an
in-memory fake (more doubles to maintain, and the versioning logic _is_ persistence logic, so
faking it removes what most needs testing); and a seam below the AI SDK at the provider
transport (higher fidelity on the SDK's own JSON-schema coercion, but a lot more fixture
plumbing for a hackathon prototype).

### Modules and cases

**Through the seam, via `createCaller` (integration):**

- Translate a greenfield plan → asserts one campaign per Campaign Type present, the Display
  fan-out arithmetic (sizes × sites → placements, creatives, ads), correct ad linking, and
  Plan Version 1 with one Hierarchy Version per type at number 1.
- Translate a brownfield plan → asserts assumptions are populated and split correctly between
  plan-level and structural, and that documented defaults were applied rather than invented
  values.
- A mixed Display + Tracking plan → asserts two campaigns, two independently numbered Hierarchy
  Versions, and no cross-type entity assignment.
- Retry behaviour → a mock that returns an integrity-violating hierarchy once then a valid one
  asserts the valid result is persisted with no `needs_clarification` row; a mock that always
  violates asserts exactly three attempts, then one `needs_clarification` Hierarchy Version
  holding the raw output and structured errors.
- Step 1 exhaustion → asserts the named app error surfaces and **no Job row exists**.
- Chat fan-out, relevant to one type → asserts the targeted type's Hierarchy Version increments,
  the other type's does not, one new Plan Version, and its pointer map carries the prior version
  id for the unchanged type.
- Chat fan-out, relevant to all types → asserts every type increments under a single Plan
  Version bump.
- Chat fan-out, relevant to none → asserts **zero** new Hierarchy Version rows and **no** new
  Plan Version.
- Id stability across an edit → asserts untouched entity ids are byte-identical before and after.
- Plan Version history → asserts selecting an earlier Plan Version resolves, through the pointer
  map, to exactly the hierarchies that were current then.

**Directly, no seam needed (pure functions):**

- The §8 referential-integrity validator — one case per invariant, each asserting the specific
  structured violation, plus a valid-hierarchy case returning none. This is the deterministic
  heart of the feature and gets the densest coverage.
- `splitSize` and the canonical size form.
- The taxonomy name builder, including the drop-the-token-and-record-an-assumption rule for a
  missing value.
- The Campaign Type resolution rules from campaign-spec §1.
- The campaign-splitting function that turns Step 2's `campaigns[]` into one single-campaign
  hierarchy per type.

**Not tested:** the Route Handler's SheetJS parse gets one accept case using the real
`media-plan-greenfield.xlsx` fixture and one reject case for a wrong extension — enough to pin
the rejection contract, not a parser test suite. React components are not unit-tested in the
prototype; the review screen is verified by running the app against the two sample plans.

### Prior art

`src/server/db/__tests__/posts.test.ts` is the existing pattern for a DB-backed integration test:
Jest with `@swc/jest`, `testEnvironment: node`, a real `postgres`/Drizzle client built from
`DATABASE_URL`, and `afterAll` closing the connection. New tests follow it, with per-test data
isolation added since these tests write more than one row. Tests are colocated under each
module's `__tests__/`. Note `docs/CODING_STANDARDS.md` §4 names Vitest, but this repo is wired
for **Jest** (`jest.config.cjs`, `npm test`, the `~/*` module mapper) — follow the repo, don't
introduce a second runner.

## Out of Scope

- **Calling the CM360 API.** The prototype produces hierarchy data; CM360 is a modeling target
  only. No OAuth, no platform credentials, no push.
- **Deployment.** Local-only, Dockerized. No hosting, no CI deploy step.
- **Other platforms** (DV360 etc.). The platform picker exists but offers only CM360.
- **Other input formats.** `.xlsx` only. No CSV, Google Sheets or PDF.
- **Inline editing** of hierarchy fields. Chat is the only mutation path in v1.
- **Multi-user and real auth.** One seeded demo user, auth stubbed.
- **A 4th Campaign Type** (e.g. a generic non-YouTube video pattern). Deferred: the code lift is
  small but it needs a real decision about what such a campaign fans out _by_ (duration? device?
  size, like Display?), which isn't worth hackathon time without a concrete need.
- **Runtime API-key entry UI.** `.env` only.
- **Placement groups, first-class audience/targeting objects, floodlight activity configs, real
  CM360 ids.** Recorded as assumptions where relevant, not built.
- **Non-display / non-video / non-tracking channels** (audio, native as its own pattern) — seen
  and recorded as an assumption, never built.
- **Normalising the entity graph into relational tables.** `jsonb` for the prototype.
- **`streamObject` streaming.** Blocking calls with a loading state; streaming only if time
  allows.
- **Approval workflows, richer fan-out and targeting, richer plan variety.** Future scope.
- **Server-side pagination for a job list.** There is no job list in this feature.

## Further Notes

**Asset state, verified against the repo.** `decision-log.md`'s "loose ends" section is stale.
`schemas.ts` already has the plural `campaigns[]` shape, `s2-translator-prompt.md` rule 1 already
states one campaign per Campaign Type, `s3-editor-prompt.md` already has the relevance-first
rule 0, and `flow-diagram.mermaid` already reflects both ADR-0001 and the
retry/`needs_clarification` design. The only live contradiction found is
`s1-extractor-prompt.md` rule 3's unspaced size format, addressed in Implementation Decisions.

**`product-prompt.md` is superseded in three places** by later decisions and should not be read
as current: it describes one campaign per plan (now ADR-0001's one per Campaign Type), a
singular `resulting_version_id` on messages (now plural), and one golden sample plan (now two —
greenfield as the happy path, brownfield to demonstrate the assumptions panel doing real work).

**The one non-mechanical judgment in the build** is the Campaign Type resolution order in
campaign-spec §1: a tracking line is also, technically, a display-shaped line, so
`trackingOnly` / `TRACKING` / `1 x 1` must be checked _before_ the display branch. Getting this
wrong builds tracking pixels as served display ads and is the most likely source of a
convincing-looking wrong hierarchy.

**Non-functional intent, in priority order:** speed of build over polish; maximum use of
prebuilt UI components; reliability of schema conformance over model autonomy; and every model
inference on incomplete data surfaced to the user as an explicit, reviewable assumption. Where
those conflict, the assumption-surfacing requirement wins — it is the product's actual claim.

**Suggested issue ordering** for the implementation tickets that follow this spec, so a runnable
demo exists as early as possible: (1) schema + migrations + demo-user seed; (2) llm provider
module with the model seam and key feature-detection; (3) hierarchy-validation module — the pure
§8 pass and taxonomy helpers, with its dense unit tests; (4) upload Route Handler + SheetJS
parse; (5) the Step 1 → Step 2 pipeline with the shared retry budget, campaign splitting and
Plan Version 1 persistence; (6) the review screen — tree cards, assumptions panel, version
selector; (7) the Step 3 chat mutation with fan-out and Plan Version bumping; (8) the chat panel
UI; (9) `needs_clarification` rendering and clarification-retry; (10) sample-plan demo wiring.
