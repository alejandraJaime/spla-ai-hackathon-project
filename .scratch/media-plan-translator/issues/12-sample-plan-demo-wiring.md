# 12: Both sample plans demo themselves

**What to build:** The demo, verified end to end rather than assumed. The greenfield sample runs clean from upload through hierarchy with few assumptions, so the happy path actually reads as a happy path. The brownfield sample produces a genuinely populated assumptions panel with real entries in both halves — plan-level gaps from the planner's file and structural inferences the tool made — so the product's central claim, that every inference on incomplete data is surfaced for review, demonstrates itself instead of being asserted.

Both are reachable in one click from the upload screen (built in ticket 05); this ticket is where the two runs are actually driven against the real app and the prompts, defaults and assumption wording are tuned until each sample tells its intended story. Where the two conflict, assumption-surfacing wins: it is the product's actual claim.

**Blocked by:** 10, 11

**Status:** ready-for-agent

- [ ] The greenfield sample runs upload → Plan → hierarchy with no `needs_clarification` version and a short assumptions panel
- [ ] The greenfield fan-out arithmetic is correct against a hand-checked count of the plan's line items, sizes and sites
- [ ] The brownfield sample produces assumptions in both "From your plan" and "Structural inference", each entry naming what was filled and why
- [ ] Every documented default the brownfield plan triggers appears as an assumption rather than a silent fill
- [ ] At least one chat edit is run against each sample, producing a new Plan Version, a correct change summary and stable ids
- [ ] Both runs are verified against the running app, not only in tests
- [ ] Any prompt or default adjustments made for the samples keep every existing test green
