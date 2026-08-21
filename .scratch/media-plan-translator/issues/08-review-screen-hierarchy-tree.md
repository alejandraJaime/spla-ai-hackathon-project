# 08: Review screen — read the hierarchy as a tree

**What to build:** The per-Job review screen, so the trafficker reads the hierarchy at a glance instead of raw JSON. One collapsible card per Campaign Type, so a mixed plan doesn't dump everything at once; an open card is fully expanded internally, so nobody clicks through nested disclosure just to see a placement's creative. Each placement shows its size, compatibility, pricing model, rate and dates, so a wrong default is spottable without opening a JSON view. Each ad shows which placement and which creative it links, so the linking can be verified by eye. Every entity shows which Tactic it came from, so anything traces back to the plan. Each card shows its own current Hierarchy Version number, so it's visible which parts of the plan have been edited, and its own counts of campaigns, placements, creatives and ads, so the fan-out arithmetic can be sanity-checked at a glance.

The assumptions panel is one component with two visually distinct labeled children — "From your plan" for plan-level gaps and "Structural inference" for modeling choices — because telling a gap in the planner's file from a choice the tool made is the whole point of surfacing them.

There is no listable, growable table in this feature and a single Job's entity count is bounded, so the usual server-side pagination requirement doesn't apply here.

**Blocked by:** 07

**Status:** ready-for-agent

- [ ] The job URL renders one collapsible card per Campaign Type, closed cards summarised, open cards fully expanded with no further per-node collapsing
- [ ] Each card shows its current Hierarchy Version number and its campaign / placement / creative / ad counts
- [ ] Each placement shows size, compatibility, pricing model, rate and dates
- [ ] Each ad shows the placement and the creative it links, by name
- [ ] Each entity shows its originating Tactic
- [ ] The assumptions panel renders plan-level and structural assumptions as two visually distinct labeled groups
- [ ] Running the app against the greenfield sample shows a readable tree with correct counts; running it against the brownfield sample shows a populated assumptions panel
- [ ] The hierarchy tree is a custom component; surrounding primitives come from the shadcn CLI, with `cn()` on `className` props and theme tokens over raw colors
- [ ] Feature components are colocated under the route's `_components/`
