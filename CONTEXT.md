# Media Plan → CM360 Hierarchy Translator

Ingests a schema-less media plan spreadsheet and translates it into a structured, CM360-shaped advertising entity hierarchy via a deterministic pipeline of schema-constrained LLM calls, then lets the user refine it through chat.

## Language

**Job**:
The persistence record for one uploaded media plan: id, owner, platform, source-file reference, the extracted `output-plan.json`. The internal/technical name for "a translation in progress or done."
_Avoid_: Translation, session (as a stored-record name)

**Plan Version**:
A user-facing, job-wide counter that increments once per chat message that produces at least one real change to any campaign's hierarchy. Plan Version 1 is the initial Step 1→2 output, before any chat. It is a derived snapshot — a pointer to which Hierarchy Version each Campaign Type was at — not a duplicate copy of hierarchy data.
_Avoid_: Job version (internal-only, don't surface to users), version (ambiguous — always qualify as Plan Version or Hierarchy Version)

**Hierarchy Version**:
The version number of one Campaign Type's hierarchy within a Job, incremented independently per Campaign Type. Editing the Display hierarchy bumps only Display's Hierarchy Version; Standard Tracking and YouTube (if present) keep theirs unless a message also changes them.
_Avoid_: Version (ambiguous alone)

**Campaign Type**:
The classification (Display, Standard Tracking, or YouTube) that determines which build/fan-out pattern a tactic expands into, and the grouping key for how many CM360 campaigns a Job produces — one campaign per distinct Campaign Type present in the plan, not one campaign per Job.
_Avoid_: Tactic type, channel

**Tactic**:
One line item from the source media plan (channel, format, sizes, dates, pricing, targeting, landing page, KPI, tracking-only flag), as normalized into `output-plan.json` by Step 1. Tactics fan out into hierarchy entities per their Campaign Type's build pattern.

**Assumption**:
An explicit, user-reviewable record of an inference the model made on incomplete or ambiguous input. Split into two distinct kinds, shown separately in the UI: **plan-level** (a Step 1 data gap — the source plan was missing or ambiguous about something) and **structural** (a Step 2+ modeling choice — how an inference was translated into entities). Never silently applied; always surfaced.

**Fan-out**:
The rule, defined per Campaign Type in the campaign-spec, by which one tactic expands into multiple hierarchy entities — e.g. one Display tactic with three creative sizes expands into three placements + three creatives + ads linking each size.

**Field dictionary**:
The authored list of allowed fields/values per hierarchy level and the naming-taxonomy token order for each entity (`taxonomy-fields.json`, plus taxonomy order in campaign-spec §3). Hard-constrained values are also encoded as Zod enums so code enforces them, not just the prompt.
_Avoid_: Taxonomy (alone — the dictionary is the values; campaign-spec §3 is the taxonomy order)

**Campaign-spec**:
The structural rulebook (`campaign-spec.md`): for each Campaign Type, which entities it builds, required fields/defaults, fan-out rules (§4A/B/C), and the referential-integrity invariants a generated hierarchy must satisfy (§8).

**`needs_clarification`** (Hierarchy Version status):
The status of a Hierarchy Version whose generation failed both schema (Zod) and/or referential-integrity (§8) validation after the retry budget was exhausted. Stored as-is (non-conforming JSON + structured validation errors), rendered in the same tree UI with the failing parts flagged, and resolved by the user adding a natural-language clarification as input to the next attempt.
_Avoid_: Failed version, invalid version (imprecise — it's specifically awaiting user clarification, not simply broken)
