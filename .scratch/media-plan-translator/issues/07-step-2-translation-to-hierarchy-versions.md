# 07: Step 2 — the Plan becomes CM360 hierarchies

**What to build:** The Plan turns into a CM360-shaped entity hierarchy, and a mixed plan models the way CM360 actually models it: one campaign per distinct Campaign Type present, not one per plan (ADR-0001). A plan of only Display tactics still produces exactly one campaign, so the common case stays simple. Each Tactic's Campaign Type is resolved by the campaign-spec's stated rules, so classification is predictable rather than vibes.

The fan-out the trafficker would otherwise hand-build: a Display tactic with three sizes expands into three creatives, three placements and three ads, each ad linking its size-matched pair; the same tactic across two sites gives six placements, three reused creatives and six ads, because the site axis doesn't duplicate creatives. A tracking tactic produces exactly one `1 x 1` placement, one `1 x 1` tracking creative and one tracking ad linking them. A YouTube or video tactic is built with the minimal in-stream pattern fanned out by video size. Every entity is named from the naming taxonomy with dictionary spelling, so nothing needs renaming afterwards. Values that aren't in the dictionary snap to the nearest allowed value with the snap recorded, so the output is always dictionary-valid and the trafficker can see where it bent. Missing fields come from the campaign-spec's documented defaults rather than the model's imagination, so defaults are reviewable and consistent between runs. A channel with no build pattern — audio, say — is recorded as an assumption rather than built or silently dropped, so the trafficker knows it was seen and skipped. Plan-level assumptions carry forward alongside the new structural ones, so the review panel is the single place to check.

Then persistence: Step 2's `campaigns[]` output is split by Campaign Type into one single-campaign Hierarchy Version per type, each starting at Hierarchy Version 1 with entities partitioned by their `campaignId`, and Plan Version 1 is written pointing at them.

Shape failures (Zod) and referential-integrity failures (the §8 pass) share **one** 2-retry / 3-attempt budget, so behaviour is predictable regardless of which check tripped, and each retry is fed the named violations. On exhaustion the non-conforming output is persisted as a `needs_clarification` Hierarchy Version together with its structured errors rather than thrown away, so the trafficker can see how close it got — rendering that state is ticket 11.

**Blocked by:** 02, 06

**Status:** ready-for-agent

- [ ] Translating a Display-only plan produces exactly one campaign and one Hierarchy Version at number 1
- [ ] A mixed Display + Tracking plan produces two campaigns, two independently numbered Hierarchy Versions, and no entity assigned across types
- [ ] A three-size Display tactic on one site produces three creatives, three placements and three ads, each ad linking its size-matched pair
- [ ] The same tactic across two sites produces six placements, three creatives and six ads
- [ ] A tracking tactic produces exactly one `1 x 1` placement, one `1 x 1` tracking creative and one tracking ad linking them
- [ ] A YouTube tactic is built on the in-stream pattern, fanned out by video size, defaulting the size when absent and recording the default
- [ ] Entity names match the taxonomy token order with dictionary spelling; a missing token's value drops the token and records an assumption
- [ ] An out-of-dictionary size or value is snapped to the nearest allowed one with the snap recorded as an assumption
- [ ] Every documented default that applies to the brownfield plan is applied and recorded; assumptions split correctly between plan-level and structural
- [ ] A tactic on a channel with no build pattern is recorded as an assumption and no entities are built for it
- [ ] Every stored Hierarchy Version holds exactly one campaign, with entities partitioned by `campaignId`
- [ ] Plan Version 1 exists with a pointer map covering every Campaign Type present
- [ ] A mock returning an integrity-violating hierarchy once then a valid one persists the valid result with no `needs_clarification` row
- [ ] A mock that always violates makes exactly three attempts, then writes one `needs_clarification` Hierarchy Version holding the raw output and the structured errors
- [ ] Entity ids follow the campaign-spec's id conventions and are stable within a version
