# 02: Hierarchy validation and taxonomy helpers (pure)

**What to build:** The deterministic heart of the feature, callable and densely tested with no LLM and no database anywhere near it. A generated hierarchy gets checked for referential integrity in code, not just schema shape, so a plausible-looking hierarchy with a dangling ad reference never reaches the user. The check is a pure function: hierarchy in, structured list of violations out — never a thrown string, because ticket 07 feeds those violations back into the model as retry context and ticket 11 renders them in the tree.

Alongside it, the pure rules every other ticket leans on: the canonical size form and the only sanctioned way to get numbers out of it, the naming-taxonomy builder, the Campaign Type resolution rules, and the function that splits one multi-campaign hierarchy into one single-campaign hierarchy per Campaign Type.

The one non-mechanical judgment in the whole build lives here: a tracking line is also, technically, a display-shaped line, so tracking must be checked *before* the display branch. Getting this wrong builds tracking pixels as served display ads and is the most likely source of a convincing-looking wrong hierarchy.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] A valid hierarchy returns no violations
- [ ] One test per campaign-spec §8 invariant, each asserting the specific structured violation: unresolvable ad→placement or ad→creative reference; a non-tracking ad not linking exactly one creative whose size matches its placement's size; a tracking placement or creative that isn't `1 x 1` / `TRACKING` / `isTracking: true`; a YouTube placement or creative not using `IN_STREAM_VIDEO`; an unresolvable `campaignId` / `siteId` / `landingPageId`; a size absent from the dictionary's allowed list; two campaigns sharing a Campaign Type, or an entity assigned across types
- [ ] Splitting a size out of the canonical form yields width and height; no second size representation is stored anywhere
- [ ] The taxonomy name builder produces the campaign, site, landing page, placement, creative and ad names in campaign-spec §3's token order with dictionary spelling
- [ ] A taxonomy token whose value is genuinely missing is dropped rather than emitted as an empty delimiter, and the omission comes back as an assumption
- [ ] Campaign Type resolution follows campaign-spec §1, with a test proving a `1 x 1` tracking-only line resolves to Standard Tracking and not Display
- [ ] Splitting a two-Campaign-Type hierarchy returns two single-campaign hierarchies with entities partitioned by their `campaignId` and nothing duplicated or dropped
- [ ] The module has no knowledge of tRPC, Next.js or the database
