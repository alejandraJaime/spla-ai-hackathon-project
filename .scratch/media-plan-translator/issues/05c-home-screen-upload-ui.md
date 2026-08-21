# 05c: Home screen — drop a file, pick CM360, pick a model, hit translate

**What to build:** The home screen a trafficker can use without reading documentation: a file dropzone, a target-platform picker (CM360, the only option in the prototype, so the output is explicitly scoped to the platform they traffic in), a model picker fed by ticket 04c and defaulting to Gemini Flash, and a "Translate media plan for CM360" button that stays disabled until a file is selected so an empty run can't be started. Both sample plans — greenfield and brownfield — are reachable in one click, each leaving the form in the same state a manual upload would, so a demo doesn't start by hunting for files.

04c's usable-models function has no knowledge of tRPC, so this ticket adds the thin query that exposes it: parse input, call the function, return the list plus the default. The translate button sends the chosen file through the 05b Route Handler and surfaces that handler's accept or named-error response. Creating the Job and navigating to its URL is ticket 06 — this screen stops once the file is in, the pickers are set, and ingest has either accepted the workbook or told the user why not.

**Blocked by:** 04c, 05b

**Status:** ready-for-agent

- [ ] The screen renders a dropzone, a platform picker offering only CM360, a model picker listing only configured models and preselecting Gemini Flash, and a translate button disabled until a file is chosen
- [ ] A thin tRPC query returns 04c's usable models plus the default; with only a Gemini key configured the picker shows the Gemini options and nothing else
- [ ] One click loads the greenfield sample and one click loads the brownfield sample, each leaving the form in the same state a manual upload would
- [ ] Submitting a valid `.xlsx` calls the 05b Route Handler and surfaces success; submitting a rejected file surfaces that handler's named error as a readable message
- [ ] UI primitives are added through the shadcn CLI rather than hand-written, `cn()` is used wherever a component takes a `className`, and theme tokens are preferred over raw colors
- [ ] Feature components are colocated under the route's `_components/`
