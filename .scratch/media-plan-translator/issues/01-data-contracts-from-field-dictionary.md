# 01: Data contracts derived from the field dictionary

**What to build:** The Plan and Hierarchy contracts become the codebase's single source of truth, so no later ticket has to guess what a Tactic or a placement looks like. `docs/prod-domain-docs/schemas.ts` is promoted into the translation module as Zod validation under the `Schema_` convention, with its inferred types moved to the module's `.types.ts`. The hard-constrained dictionary values — Size, Media Type, Campaign Type, Tactic, Campaign Objective, Country and the rest — are *generated from* `taxonomy-fields.json` rather than hand-copied, so the prompt and the schema cannot drift apart; `schemas.ts`'s current enum values are illustrative only.

The domain knowledge the pipeline needs at runtime also moves into place: the field dictionary, the campaign-spec and the three step prompts land somewhere the server can read them when building a prompt, as versioned documents rather than hard-coded logic. Two known contradictions in those documents are corrected on the way in: `s1-extractor-prompt.md` rule 3 instructs the model to emit `"300x250"` with no spaces, which fails the Plan schema's size regex on every attempt and would burn the whole retry budget deterministically, and `campaign-spec.md` refers to `taxonomy-fields.md` where the real asset is `.json`.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] The Plan contract (Step 1 output) and the Hierarchy contract (Step 2/3 output) both parse a hand-written valid example and reject a malformed one
- [x] Hierarchy entities are flat arrays with id references (`campaigns`, `sites`, `landingPages`, `placements`, `creatives`, `ads`), mirroring CM360's relational model rather than a strict tree; an ad references placements *and* creatives by id
- [x] `campaigns` is an array per ADR-0001
- [x] Every hard-constrained enum is derived from `taxonomy-fields.json`; adding a value to the dictionary makes the schema accept it with no second edit, proven by a test
- [x] Sizes accept only the canonical dictionary spelling `WIDTH x HEIGHT` with spaces; the unspaced form is rejected
- [x] Zod exports live in `.validation.ts` with the `Schema_` prefix and nothing else; every inferred type is exported from `.types.ts`
- [x] The module has its own `errors.ts` with named error classes carrying literal codes
- [x] The field dictionary, campaign-spec and three step prompts are readable by the server at runtime and their content is unchanged apart from the two corrections
- [x] `s1-extractor-prompt.md` rule 3 asks for the spaced dictionary size form; `campaign-spec.md` points at `taxonomy-fields.json`
- [x] `npm run typecheck` and `npm test` pass
