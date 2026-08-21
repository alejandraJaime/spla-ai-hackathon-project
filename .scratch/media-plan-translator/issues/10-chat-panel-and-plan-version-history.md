# 10: Chat panel and Plan Version history

**What to build:** The refinement UI on the review screen. One chat panel for the whole Job rather than one per card, wired to ticket 09's mutation. Typing in chat is the *only* way to change the hierarchy — no inline field editing — so every change carries a recorded, summarised provenance. The input is disabled while a message is being processed, so two overlapping edits can't hit the same hierarchy. The chat log persists with the Job, so reopening it shows how the plan got to where it is. After each message the tree and the assumptions panel re-render, so the trafficker always sees current state, and each campaign's reported change summary is visible in the log.

Plus the job-wide Plan Version selector, which is what makes the history real rather than approximate: selecting an earlier Plan Version resolves its pointer map and renders the exact hierarchy each Campaign Type was at then — including a type that was already several versions old at that point.

The chat panel is built on AI Elements over shadcn/ui primitives, and Plan Version history maps to the AI Elements checkpoint component. Deliberately not the AI SDK's chat hook: the response is a structured object, not streamed text, so the message list is held locally alongside the custom mutation.

**Blocked by:** 08, 09

**Status:** ready-for-agent

- [ ] One chat panel serves the whole Job; there is no per-card chat and no inline field editing anywhere
- [ ] Sending a message disables the input until the response lands, then re-enables it
- [ ] The tree, the per-card Hierarchy Version numbers, the counts and the assumptions panel all reflect the new state after a message
- [ ] Each response shows the per-campaign change summaries, including "No change" for untouched types
- [ ] Reloading the page shows the full prior chat log
- [ ] The Plan Version selector lists every Plan Version, newest state selected by default
- [ ] Selecting an earlier Plan Version renders exactly the hierarchies that were current then, including for a Campaign Type whose version didn't change at that point
- [ ] A message that changed nothing anywhere adds no entry to the version selector
- [ ] Primitives come from the shadcn CLI and AI Elements rather than hand-written or speculatively imported, with `cn()` on `className` props and theme tokens over raw colors
