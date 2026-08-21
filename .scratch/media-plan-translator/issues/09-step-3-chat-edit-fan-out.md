# 09: Step 3 — one chat message fans out to every Campaign Type

**What to build:** The edit path. The trafficker refines the hierarchy in plain language — "add a 300 x 600 display placement", "drop the contextual line", "make the banners CPC", "change the country to GB" — and never has to decide which campaign an instruction belongs to. One instruction runs the Step 3 call once per existing Campaign Type hierarchy, each call given the full instruction plus that campaign's own current hierarchy, and each deciding for itself whether the instruction applies. There is deliberately no message-routing or target-inference layer.

A call that finds something to do returns a full new hierarchy with a one-line change summary in the user's own terms, so they can confirm the tool understood them. Adding a size also adds its creative and its linking ad per the fan-out pattern, so the edit leaves a complete, valid hierarchy. Removing a line removes or repoints the ads that referenced it, so no dangling references survive. An out-of-dictionary request like `100x100` is snapped to the nearest allowed size, applied, and explained — the tool bends rather than refuses. Everything the trafficker didn't mention is preserved, so a small instruction doesn't quietly rewrite the hierarchy.

A call that finds nothing to do returns the hierarchy unchanged with "No change", and **no new Hierarchy Version row is written** for that type — version history stays a record of real changes, and a Display-only edit doesn't churn the Tracking campaign. A new Plan Version is created only if at least one campaign really changed; its pointer map carries the new Hierarchy Version ids for changed types and the prior ones for unchanged types. A message where nothing applied anywhere creates no new Plan Version at all.

This is full hierarchy regeneration per edit, not structured edit-ops or JSON-patch, and a single-campaign edit and a plan-wide edit are literally the same code path — only how many of the parallel calls produce a real diff differs. Id stability is a hard requirement, not a nicety: the UI's version comparison keys on ids, so untouched entities keep theirs and new entities continue the existing numbering rather than triggering a renumber. The mutation returns the new Plan Version plus the per-campaign results as a structured object.

**Blocked by:** 07

**Status:** ready-for-agent

- [ ] An instruction relevant to one Campaign Type increments that type's Hierarchy Version, leaves the other type's alone, creates one new Plan Version, and that Plan Version's pointer map carries the prior version id for the unchanged type
- [ ] An instruction relevant to every Campaign Type increments each of them under a single Plan Version bump
- [ ] An instruction relevant to none writes zero new Hierarchy Version rows and no new Plan Version
- [ ] Adding a size adds its placement, its creative and its linking ad, and the result passes the §8 integrity pass
- [ ] Removing a line leaves no ad referencing a removed placement or creative
- [ ] Renaming or re-dating the campaign applies without re-running the pipeline
- [ ] An out-of-dictionary size in an instruction is snapped, applied, and explained in the change summary and assumptions
- [ ] Untouched entity ids are byte-identical before and after an edit; new entities continue the existing numbering
- [ ] Fields the instruction didn't mention are unchanged
- [ ] Each changed campaign returns a one-line change summary; unchanged ones return "No change"
- [ ] The message and its resulting version ids persist with the Job
- [ ] Step 3 output runs through the same shared retry budget and §8 pass as Step 2
