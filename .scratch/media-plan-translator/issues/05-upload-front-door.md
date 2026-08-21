# 05: Front door — drop an `.xlsx` and get accepted or told why not

**What to build:** The home screen a trafficker can use without reading documentation: a file dropzone, a target-platform picker (CM360, the only option in the prototype, so the output is explicitly scoped to the platform they traffic in), a model picker fed by ticket 04c's query and defaulting to Gemini Flash, and a "Translate media plan for CM360" button that stays disabled until a file is selected so an empty run can't be started. Both sample plans — greenfield and brownfield — are reachable in one click, so a demo doesn't start by hunting for files.

Behind it, ingest: a `.xlsx` with a non-tabular header block and merged, inconsistent columns is accepted exactly as the planner sent it, with no reformatting asked of the user, and parsed to CSV-ish text. Absorbing the missing schema is the model's job in ticket 06, not a pre-processing step's, so the header block is preserved rather than stripped. Anything that isn't an `.xlsx`, and any workbook that can't be parsed, is rejected with a message that makes clear the problem is the file and not the tool — no spinner to stare at, and no recovery flow beyond the rejection.

Upload is a Route Handler rather than a tRPC procedure: a multipart file upload is a poor fit for tRPC's batching and superjson transport, and the two transports stay separate. Both transports stay thin — parse input, resolve the demo user, call a service.

**Blocked by:** 04a, 04c

**Status:** ready-for-agent

- [ ] The screen renders a dropzone, a platform picker offering only CM360, a model picker listing only configured models and preselecting Gemini Flash, and a translate button disabled until a file is chosen
- [ ] One click loads the greenfield sample and one click loads the brownfield sample, each leaving the form in the same state a manual upload would
- [ ] Uploading the real greenfield `.xlsx` fixture is accepted and yields text that still contains the header block and every line item
- [ ] Uploading a non-`.xlsx` is rejected with the named unsupported-file-type error surfaced as a readable message
- [ ] Uploading a corrupt or unparseable workbook is rejected with the named parse-failure error surfaced as a readable message
- [ ] Every user-visible message originates from a named app error with a literal code; the error formatter is the only place that unpacks them, and anything unrecognised gets a generic client message plus a full server-side log
- [ ] UI primitives are added through the shadcn CLI rather than hand-written, `cn()` is used wherever a component takes a `className`, and theme tokens are preferred over raw colors
- [ ] Feature components are colocated under the route's `_components/`
