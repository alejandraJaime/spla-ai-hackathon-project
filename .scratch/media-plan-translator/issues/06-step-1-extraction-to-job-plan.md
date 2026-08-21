# 06: Step 1 — a media plan becomes a Job with an extracted Plan

**What to build:** Clicking translate creates a Job with its own id and URL, so the trafficker can come back to this translation later, and records which model produced it so a later comparison of Flash against a bigger model is traceable. While the pipeline runs the user sees a progress state rather than a dead screen.

The Job holds the Plan: the messy grid normalised into something platform-agnostic. Every media-plan line item becomes exactly one Tactic — nothing silently merged, nothing dropped — and each Tactic carries its source row identifier so any generated entity can later be traced back to the line it came from. Free-text channel and format wording ("banners", "pre-roll", "floodlight") is normalised to the schema's coarse values so the plan's vocabulary doesn't leak into the hierarchy. Vague dates resolve to ISO dates where the context allows and stay null where it doesn't, so the trafficker can see which dates are real. Approximate money parses to a number with the approximation recorded, so the budget is usable but not falsely precise. Tracking, pixel and floodlight lines are flagged tracking-only so they aren't built as served ads. Missing sizes are left empty rather than invented, because the defaulting decision happens once, visibly, in ticket 07. Every gap and inference is recorded as a plan-level or tactic-level assumption — nothing filled in behind the user's back.

This is a single schema-constrained model call, not an agent: no tool-calling loop, no agent framework. Code owns the schema, the prompt, the validation and the plumbing; the model only does the semantic transformation. It runs on a 2-retry / 3-attempt budget, and a failed attempt's validation errors are fed into the next attempt as context so the model corrects a named problem rather than re-rolling. If the budget is exhausted the error surfaces and **no Job row exists** — there is no partial-Job state, because a job list with half-created jobs isn't trustworthy.

**Blocked by:** 01, 03, 04, 05

**Status:** ready-for-agent

- [ ] Translating the greenfield plan creates one Job at its own URL, owned by the demo user, recording the platform and the chosen model id
- [ ] The Plan has exactly one Tactic per source line item, each carrying its source row identifier
- [ ] Free-text channel and format wording is normalised to schema values; a "banners" line and a "pre-roll" line land on the right coarse values
- [ ] A resolvable vague date becomes an ISO date; an unresolvable one stays null
- [ ] `~30k` parses to a number with the approximation recorded as an assumption
- [ ] A floodlight or pixel line is flagged tracking-only
- [ ] A line with no size leaves the size empty rather than defaulting it
- [ ] Plan-level and tactic-level assumptions are populated for the brownfield plan
- [ ] A mock model returning malformed output once then valid output persists the valid Plan; the retry carries the prior attempt's validation errors as context
- [ ] A mock model that always fails makes exactly three attempts, surfaces the named extraction-exhausted error, and leaves no Job row
- [ ] The job page shows a progress state while the pipeline runs and the extracted Plan once it lands
- [ ] Tests run through the real tRPC caller with only the language model mocked
