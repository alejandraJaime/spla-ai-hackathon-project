# Campaign-spec — CM360 (Campaign Manager 360)

> **What this document is.** The structural rulebook the STEP 2 translator and
> STEP 3 editor consult to turn a normalised media plan into a CM360 entity
> hierarchy. The **field dictionary** (`taxonomy-fields.json`) governs *allowed
> values and names*; this document governs *what entities each tactic builds and
> how they fan out*. Load both into the translator/editor prompts as context.
>
> Scope: **Standard Display** (§4A), **Standard Tracking** (§4B), and a **minimal
> YouTube** pattern (§4C) — the three Campaign Types in the dictionary.

---

## 0. How the two documents divide the work

| Concern | Owned by |
|---|---|
| Allowed values (sizes, countries, audiences, etc.) and their exact spelling | **Field dictionary** |
| Which entities a tactic expands into, and fan-out | **This spec** |
| CM360 mechanics with no taxonomy value (compatibility, creative type, ad type) | **This spec** (§5) |
| Entity *display names* (token order) | **This spec** §3 — *default, confirm with your house convention* |

> **Sizes** use one canonical form everywhere — plan, hierarchy, and output — the
> dictionary spelling `WIDTH x HEIGHT` with spaces (`300 x 250`, `1 x 1`,
> `1920 x 1080`). When numeric width/height are needed, split the string with the
> `splitSize()` helper in `translation.size.ts`; there is no second size representation.
>
> **Naming order:** your dictionary lists allowed values but not the token *order*
> per entity level. §3 proposes a default taxonomy — replace it with your real
> convention if you have one; the rest of the spec doesn't change.

---

## 1. Cardinality rule: one CM360 campaign per Campaign Type (ADR-0001)

A media plan maps to **one CM360 campaign per distinct Campaign Type** present
in its tactics — not one campaign for the whole plan. Each tactic carries a
**Campaign Type** (`Display`, `Standard Tracking`, or `YouTube`) that selects
both which campaign it belongs to and its build pattern. `hierarchy-schema`'s
`campaigns[]` holds one entry per Campaign Type found; a plan with only Display
tactics still produces exactly one campaign, so the common case is unaffected.

See [ADR-0001](../adr/0001-one-campaign-per-campaign-type.md) for the reasoning
(this superseded an earlier one-campaign-per-plan decision).

**Resolving a tactic's Campaign Type** (translator does this):
- `trackingOnly === true`, or format/channel is `TRACKING`, or size is `1 x 1` → **Standard Tracking** (§4B)
- channel/format is `DISPLAY` (Image / Rich Media) → **Standard Display** (§4A)
- channel is `VIDEO`, or format `IN_STREAM_VIDEO`, or media partner is YouTube → **YouTube** (§4C)

---

## 2. ID conventions

Stable, human-readable local ids, assigned per job and **never renumbered across
versions** for untouched entities (id stability is what lets the UI diff versions):

`cmp_1` campaign · `site_1` sites · `lp_1` landing pages · `plc_1` placements ·
`cre_1` creatives · `ad_1` ads. Number within each type in creation order.

---

## 3. Naming taxonomy (DEFAULT — confirm)

Delimiter `|`, dictionary spelling for every token, `{}` = value slot.

- **Campaign:** `{Advertiser} | {Campaign Type} | {Campaign Objective} | {FlightStart}-{FlightEnd}`
- **Site:** the media partner / publisher name as given (CM360 site names are freeform, e.g. `Epicurious`, `YouTube`).
- **Landing page:** `{Advertiser} | {short-slug-of-url}`
- **Placement:** `{Campaign Type} | {Publisher} | {Size} | {Media Format} | {Country}`
- **Creative:** `{Campaign Type} | {Media Type} | {Size}`
- **Ad:** `{Campaign Type} | {Tactic} | {Size}`

Where a token's value is missing and no default applies, drop the token (don't
emit an empty `| |`) and record the omission in `assumptions`.

---

## 4. Entity build patterns

### 4A. STANDARD DISPLAY

**Builds, per display tactic:**

| Entity | How many | Key fields |
|---|---|---|
| Campaign | 1 per Job (shared by all Display tactics) | name §3; `campaignType:"Display"`; `startDate`/`endDate` = plan flight; `defaultLandingPageId` |
| Site | 1 per distinct media partner in the tactic | name = media partner |
| Landing page | 1 per distinct landing URL | `url` from tactic |
| **Creative** | **1 per distinct Size** | `type` per §5; `isTracking:false`; `landingPageId` |
| **Placement** | **1 per (Site × Size)** | `compatibility:"DISPLAY"`; `pricingModel`/`rate` from tactic; dates |
| **Ad** | **1 per Placement** | `type:"AD_SERVING_STANDARD"`; `placementIds:[thePlacement]`; `creativeIds:[the size-matched creative]` |

**Fan-out rule (Standard Display):**
> Primary axis = **Size**. Secondary axis = **Site**.
> Creatives = one per unique size (reused across sites).
> Placements = one per (site × size).
> Ads = one per placement, linking it to the creative whose size matches.

**Worked example** — tactic: GDN, sizes `300 x 250, 728 x 90, 160 x 600`, 1 landing page:
- 1 site (`Google Display Network`), 1 landing page
- 3 creatives, 3 placements, 3 ads (each ad links its size-matched pair)

Same tactic across **2 sites** → **6 placements, 3 creatives (reused), 6 ads**.

### 4B. STANDARD TRACKING

**Builds, per tracking tactic (no size fan-out — always 1 × 1):**

| Entity | How many | Key fields |
|---|---|---|
| Campaign | 1 per Job (shared by all Standard Tracking tactics) | name §3; `campaignType:"Standard Tracking"` |
| Site | 1 (the advertiser's own site) | name = advertiser domain / given site |
| Landing page | 1 | advertiser root URL |
| Placement | 1 | `compatibility:"TRACKING"`; `size:"1 x 1"`; `isTracking:true`; `pricingModel:"FLAT"`, `rate:0` |
| Creative | 1 | `type:"TRACKING_TEXT"`; `size:"1 x 1"`; `isTracking:true` |
| Ad | 1 | `type:"AD_SERVING_TRACKING"`; links the 1 × 1 placement + 1 × 1 creative |

**Fan-out rule (Standard Tracking):** none. Exactly one placement + one creative
+ one ad, all 1 × 1. Multiple tracking lines → repeat this set once per line.

### 4C. YOUTUBE (minimal)

In-stream video, kept deliberately minimal for the prototype: same shape as
display, fanned out by video size only.

**Builds, per YouTube / video tactic:**

| Entity | How many | Key fields |
|---|---|---|
| Campaign | 1 per Job (shared by all YouTube tactics) | name §3; `campaignType:"YouTube"` |
| Site | 1 | name = media partner, default `YouTube` |
| Landing page | 1 | `url` from tactic (else advertiser root) |
| **Creative** | **1 per distinct video Size** | `type:"IN_STREAM_VIDEO"`; `isTracking:false`; `landingPageId` |
| **Placement** | **1 per (Site × video Size)** | `compatibility:"IN_STREAM_VIDEO"`; `pricingModel`/`rate` from tactic (default `CPV`); dates |
| **Ad** | **1 per Placement** | `type:"AD_SERVING_STANDARD"`; links the placement + its size-matched video creative |

**Fan-out rule (YouTube):**
> Axis = **video Size** (usually one, e.g. `1920 x 1080`). One creative + one
> placement + one ad per distinct video size. If no size is given, use the §6
> default and log an assumption.

---

## 5. CM360 mechanics (no dictionary value; set from this spec)

- **Placement `compatibility`:** `DISPLAY` for display · `TRACKING` for tracking · `IN_STREAM_VIDEO` for YouTube.
- **Creative `type`:** `IMAGE` when Media Type = Image · `HTML5_BANNER` when Media
  Type = Rich Media · `IN_STREAM_VIDEO` for YouTube/video · `TRACKING_TEXT` for tracking.
- **Ad `type`:** `AD_SERVING_STANDARD` for display and YouTube · `AD_SERVING_TRACKING` for tracking.

---

## 6. Defaults & assumption rules (drive brownfield behaviour)

When a field is missing/ambiguous, apply the default **and** append a one-line
entry to `assumptions` naming what was filled and why. Never fill silently.

| Missing / ambiguous | Default |
|---|---|
| Display sizes absent, or `"responsive"` / `"standard IAB"` | `DEFAULT_DISPLAY_SIZES` = `300 x 250, 728 x 90, 160 x 600, 320 x 50` |
| Video size absent (YouTube) | `1920 x 1080` |
| Size not in dictionary | snap to nearest allowed size |
| Media partner / site absent (display) | one site named `Programmatic - Open Exchange` |
| Media partner absent (YouTube) | site `YouTube` |
| Site absent (tracking) | advertiser root domain |
| Landing page URL absent | advertiser root domain |
| Start date absent | plan `flightStart` (else today) |
| End date absent | plan `flightEnd` (else start + 30d) |
| Pricing / rate `TBD` (display) | `pricingModel` from dictionary if inferable else `CPM`; `rate: null` |
| Pricing / rate `TBD` (YouTube) | `CPV`; `rate: null` |
| Country absent | `US` |
| Media Type absent (display) | `Image` |
| Media Type absent (YouTube) | `Video` |
| Tactic absent | `Brand Awareness` |
| Campaign Objective absent | derive from Tactic, else `Brand Awareness` |
| Any value not in the dictionary | snap to nearest allowed value |

---

## 7. Out of scope (record, don't build)

- Placement groups, audience/targeting objects as first-class entities, floodlight
  activity configs, real CM360 IDs / API push.
- Non-video, non-display, non-tracking channels (audio, native as its own pattern):
  append to `assumptions`: *"Tactic '<name>' is <channel>; no build pattern in the
  prototype, not built."*

---

## 8. Validation invariants (post-generation check, enforce in code)

1. Every `ad.placementIds[*]` and `ad.creativeIds[*]` resolves to an existing entity.
2. Every non-tracking `ad` links **exactly one** creative whose `size` equals its placement's size.
3. Every tracking placement/creative is `1 x 1` with `compatibility:"TRACKING"` / `isTracking:true`.
4. Every YouTube placement/creative uses `IN_STREAM_VIDEO`.
5. Every referenced `campaignId` / `siteId` / `landingPageId` exists.
6. Every `size` used appears in the dictionary's allowed Size list.
7. Exactly one `campaign` per distinct Campaign Type present in the plan — no
   two campaigns share a `campaignType`, and no placement/creative/ad's
   `campaignId` points at a campaign of a different `campaignType` than its own
   build pattern implies.
