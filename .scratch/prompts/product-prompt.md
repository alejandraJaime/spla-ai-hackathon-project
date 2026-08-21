# Product description — "Media Plan → Programmatic Hierarchy Translator" (hackathon prototype)

> Use this document as a seed prompt: feed it to an LLM and ask it to enumerate
> the full feature list / user stories / task breakdown needed to build the
> prototype. It is written to be exhaustive about intent and scope so the
> generated feature list is complete.

## One-line summary

A web tool that ingests a messy, schema-less media plan file and translates it
into a structured, platform-specific advertising hierarchy (campaigns →
placements → creatives → ads) for a programmatic platform, then lets the user
refine that hierarchy through natural-language chat, versioning every change.

## Problem it solves

Media planners hand off plans as spreadsheets with no fixed schema. Turning one
into the correct entity hierarchy inside an ad platform (Campaign Manager 360)
is manual, repetitive, error-prone, and requires knowing each platform's rules
(what a "tracking campaign" is, how creative sizes fan out into placements and
ads, what naming taxonomy each entity must follow). This tool automates that
translation and makes the result editable in plain language.

## Users (prototype)

- Single hard-coded **demo user** owns everything. User model exists (name,
  email) but auth is stubbed. Multi-user is explicitly a future iteration.

## Core concept: a typed transformation pipeline, NOT autonomous agents

The system is a deterministic chain of structured-output LLM calls (Vercel AI
SDK `generateObject` with Zod schemas), not a tool-calling agent loop. Each step
takes text/JSON in and returns JSON conforming to a fixed schema. The model does
the semantic transformation; the code owns the schemas, the prompts (which carry
the domain knowledge), deterministic validation of hard constraints, and the
plumbing.

## The pipeline

**Step 0 — Ingest.** User uploads one `.xlsx` media plan and selects the target
platform (CM360 for the prototype). Backend parses the workbook to CSV/JSON text
(SheetJS). The raw grid — including any non-tabular header block — is handed to
the model as-is; absorbing the lack of schema is the model's job.

**Step 1 — Extract (`generateObject`, schema = plan-schema).** Reads the messy
plan text and returns `output-plan.json`, a normalised, platform-agnostic
representation: advertiser, campaign, flight dates, budget, and a list of
tactics (channel, format, sizes, dates, pricing, targeting, landing page, KPI,
tracking-only flag). It records every inference it had to make in an
`assumptions` list (crucial for incomplete "brownfield" plans).

**Step 2 — Translate (`generateObject`, schema = hierarchy-schema).** Takes
`output-plan.json` plus the field dictionary and the campaign-spec, and returns
`output-hierarchy.json`: a CM360-shaped entity graph (one campaign; sites;
landing pages; placements; creatives; ads linking placements↔creatives). Applies
**fan-out rules** — e.g. one display tactic with three creative sizes expands
into three placements + three creatives + ads linking each size. Builds each
entity's name from the dictionary's naming taxonomy. Carries assumptions forward
and adds any new structural assumptions.

**Step 3 — Edit (`generateObject`, schema = hierarchy-schema).** In the review
UI, each chat message from the user (e.g. "add a 100×100 display placement",
"drop the contextual line", "rename the campaign to …") takes the *current*
hierarchy JSON + the instruction and returns a *new full hierarchy version*
plus a one-line `changeSummary`. Every message produces a new version.

## Domain knowledge inputs (authored as .md, loaded into prompts)

- **Field dictionary** — the master list of allowed fields and values per
  hierarchy level, and the naming/taxonomy order for each entity. The user
  supplies this. Hard-constrained values should also be encoded as Zod enums so
  code enforces them, not just the prompt.
- **Campaign-spec** — the structural rulebook: for each campaign/tactic type,
  which entities it expands into, the required fields/defaults per entity, and
  the fan-out rules. Example: a *standard tracking campaign* = 1 campaign + 1
  site + 1 landing page + one 1×1 tracking placement + one 1×1 tracking creative
  + one tracking ad linking them. A *standard display campaign* = 1 campaign +
  1+ sites + 1 landing page + per creative size {1 placement + 1 creative} + ads
  linking each placement to its size-matched creative.
- **Step prompts / rules** — per-step system prompts (extraction rules,
  translation rules, edit rules).

## User journey

1. Home / new-translation screen: file dropzone + platform picker + "Translate
   media plan for [platform]" button. Clicking it creates a new **job** (has an
   id) and kicks off Steps 1–2.
2. Progress/loading state while the pipeline runs (optionally streamed).
3. Review screen for the job: version 1 of the hierarchy rendered as a friendly
   tree (campaign → placements/creatives/ads), an assumptions panel, a version
   selector, and a chat panel.
4. User types edits in chat; each message generates a new version, re-renders
   the tree, appends to the chat log, and shows the change summary. User can
   browse previous versions.

## Persistence model

- `users` (demo user seeded)
- `jobs` — id, owner, platform, source-file reference, `output-plan.json`
  (jsonb), pointer to current version
- `hierarchy_versions` — job_id, version_number, `output-hierarchy.json`
  (jsonb), created_at (append-only → free version history)
- `messages` — job_id, role, content, resulting_version_id

The plan and hierarchy are stored as `jsonb` blobs and rendered from JSON. The
entity graph is NOT normalised into relational tables for the prototype.

## Explicit scope boundaries (prototype)

- One input file type: `.xlsx`.
- One target platform: CM360. The tool **produces the hierarchy as data; it does
  NOT call the CM360 API** — the platform is only a modeling target.
- Hierarchy is edited **only via chat**; no inline field editing.
- Single demo user; auth stubbed.
- One golden sample plan drives the demo; real-world plan variety is out of scope.

## Explicit future scope (not in prototype)

Multiple platforms (DV360, etc.), real platform API push, multi-user + auth,
inline editing, additional input formats, richer fan-out and targeting, approval
workflows.

## Non-functional intent

Speed of build over polish; maximise use of prebuilt UI components; reliability
of schema conformance over model autonomy; every model inference on incomplete
data must be surfaced to the user as an explicit, reviewable assumption.
