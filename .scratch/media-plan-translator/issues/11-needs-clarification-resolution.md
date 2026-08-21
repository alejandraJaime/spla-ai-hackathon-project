# 11: `needs_clarification` is a conversation, not a dead end

**What to build:** The failure case, made survivable. A Hierarchy Version whose generation exhausted the retry budget is already persisted with its non-conforming hierarchy and structured validation errors (ticket 07). This ticket renders it in the same tree UI with the failing parts flagged — the trafficker doesn't learn a second interface for the failure case — and lets them resolve it by typing a plain-language clarification into the existing chat panel, which becomes input to the next attempt. A successful clarification produces a normal `ok` Hierarchy Version and, since something really changed, a new Plan Version.

**Blocked by:** 10

**Status:** ready-for-agent

- [ ] A `needs_clarification` Hierarchy Version renders in the same card and tree as an `ok` one, visibly marked as awaiting clarification
- [ ] Each structured validation error is surfaced against the entity it concerns, so the trafficker can see which part failed rather than just that something did
- [ ] The card's state makes clear this hierarchy hasn't been accepted, without hiding what the model produced
- [ ] A clarification typed into the chat feeds the next attempt along with the stored errors and the non-conforming hierarchy
- [ ] A clarification that succeeds writes an `ok` Hierarchy Version for that type and bumps the Plan Version
- [ ] A clarification that fails again leaves a `needs_clarification` version with the newer errors, and can be clarified again
- [ ] A Job where one Campaign Type is `needs_clarification` and another is `ok` renders both correctly side by side, and ordinary edits to the `ok` type still work
