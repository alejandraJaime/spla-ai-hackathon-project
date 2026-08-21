/**
 * Data contracts for the media-plan → CM360 hierarchy translator.
 *
 *   - `Schema_Plan`      is the output of STEP 1 (extraction)  -> "output-plan.json"
 *   - `Schema_Hierarchy` is the output of STEP 2 (translation) and STEP 3 (edit)
 *
 * Pass each schema directly to the Vercel AI SDK:
 *   const { object } = await generateObject({ model, schema: Schema_Plan, prompt })
 *
 * The `.describe()` calls are not decoration — the model reads them.
 *
 * SIZE FORMAT: sizes are the dictionary spelling "WIDTH x HEIGHT" (spaces around
 * the x), e.g. "300 x 250", "1 x 1", "1920 x 1080" — used everywhere, plan
 * through hierarchy through output. When width/height are needed as numbers,
 * split the string with `splitSize()`; no second representation is stored.
 *
 * HARD-CONSTRAINED VALUES are derived from the field dictionary
 * (`knowledge/documents/taxonomy-fields.json`) via `buildDictionaryEnum`, never
 * hand-copied — adding a value there is the only edit needed for code to accept
 * it. Enums that are *not* dictionary fields (CM360 mechanics per campaign-spec
 * §5, and Step 1's coarse normalisation values) are declared here.
 *
 * Zod inference note: dictionary-derived enums infer as `string`, because a
 * JSON import widens to `string[]`. The runtime constraint is the real one; see
 * `translation.types.ts`.
 */
import { z } from 'zod'

import { buildDictionaryEnum } from './knowledge'

/* -------------------------------------------------------------------------- */
/*  Hard-constrained dictionary values (derived, never hand-copied)            */
/* -------------------------------------------------------------------------- */

/** Sizes as the dictionary lists them. Membership is checked by campaign-spec §8. */
export const Schema_DictionarySize = buildDictionaryEnum('Size')
export const Schema_MediaType = buildDictionaryEnum('Media Type')
export const Schema_Inventory = buildDictionaryEnum('Inventory')
export const Schema_CampaignType = buildDictionaryEnum('Campaign Type').describe(
  'Campaign Type from the field dictionary. Determines the build/fan-out pattern (campaign-spec §4) and which CM360 campaign this entity belongs to.',
)
/** The dictionary's "Platform" field (Google, Meta, …) — not the CM360 target platform. */
export const Schema_MediaPlatform = buildDictionaryEnum('Platform')
/** The dictionary's "Tactic" taxonomy token — not a Plan tactic (that is `Schema_Tactic`). */
export const Schema_TacticToken = buildDictionaryEnum('Tactic')
export const Schema_CampaignObjective = buildDictionaryEnum('Campaign Objective')
export const Schema_Audience = buildDictionaryEnum('Audience')
export const Schema_Publisher = buildDictionaryEnum('Publisher')
export const Schema_MediaFormat = buildDictionaryEnum('Media Format')
export const Schema_Device = buildDictionaryEnum('Device')
export const Schema_Country = buildDictionaryEnum('Country')
export const Schema_Region = buildDictionaryEnum('Region')

/* -------------------------------------------------------------------------- */
/*  Shared primitives                                                          */
/* -------------------------------------------------------------------------- */

export const Schema_IsoDate = z
  .string()
  .describe(
    'ISO 8601 date, e.g. 2026-09-01. If the source is vague, make a documented assumption and record it in `assumptions`.',
  )

/**
 * The one canonical size form: the dictionary spelling with single spaces
 * around the x. The unspaced "300x250" is not a valid size anywhere.
 */
export const Schema_CanonicalSize = z
  .string()
  .regex(/^\d{1,4} x \d{1,4}$/)
  .describe(
    'Ad size as "WIDTH x HEIGHT" using the dictionary spelling with spaces, e.g. "300 x 250". Tracking pixels are "1 x 1".',
  )

export const Schema_PricingModel = z
  .enum(['CPM', 'CPC', 'CPV', 'CPD', 'FLAT'])
  .describe('Buy type. Not a dictionary field — these are the buy types the prototype supports.')

/* -------------------------------------------------------------------------- */
/*  STEP 1 — PLAN  (normalised, platform-agnostic media plan)                  */
/* -------------------------------------------------------------------------- */

export const Schema_TacticChannel = z
  .enum(['DISPLAY', 'VIDEO', 'NATIVE', 'TRACKING', 'OTHER'])
  .describe(
    "Normalised channel. Map free-text like 'banners' -> DISPLAY, 'pre-roll'/'YouTube' -> VIDEO.",
  )

export const Schema_TacticFormat = z
  .enum(['DISPLAY', 'IN_STREAM_VIDEO', 'NATIVE', 'TRACKING', 'UNKNOWN'])
  .describe('Delivery format. TRACKING is for pixel/floodlight-style tags.')

export const Schema_Tactic = z.object({
  sourceLine: z
    .union([z.string(), z.number()])
    .nullable()
    .describe('Line/row identifier from the original media plan, for traceability.'),
  name: z.string().describe('Human-readable tactic / placement name from the plan.'),
  channel: Schema_TacticChannel,
  format: Schema_TacticFormat,
  mediaPartner: z
    .string()
    .nullable()
    .describe('Site / publisher / partner. Null if the plan omits it.'),
  adSizes: z
    .array(Schema_CanonicalSize)
    .describe(
      'All creative sizes for this tactic, in "WIDTH x HEIGHT" form. Empty array if unspecified — do NOT invent sizes silently; record an assumption instead.',
    ),
  startDate: Schema_IsoDate.nullable(),
  endDate: Schema_IsoDate.nullable(),
  pricingModel: Schema_PricingModel.nullable(),
  rate: z.number().nullable().describe('Numeric rate for the pricing model. Null if TBD.'),
  budget: z
    .number()
    .nullable()
    .describe('Budget for this line in plan currency. Null if not given.'),
  impressionsGoal: z.number().nullable(),
  targeting: z.string().nullable().describe('Free-text targeting description, verbatim-ish.'),
  landingPageUrl: z.string().nullable(),
  kpi: z.string().nullable(),
  trackingOnly: z
    .boolean()
    .describe('True when this line is a tracking/floodlight tag rather than a served ad.'),
  notes: z.string().nullable(),
  assumptions: z
    .array(z.string())
    .describe(
      'Anything you inferred or filled in for THIS tactic because the plan was incomplete or ambiguous. One human-readable sentence each.',
    ),
})

export const Schema_Plan = z.object({
  plan: z.object({
    advertiser: z.string().describe('Advertiser / client name.'),
    campaignName: z.string(),
    objective: z.string().nullable().describe("e.g. 'Awareness', 'Site Traffic'. Null if absent."),
    flightStart: Schema_IsoDate.nullable(),
    flightEnd: Schema_IsoDate.nullable(),
    currency: z
      .string()
      .nullable()
      .describe('ISO currency code, e.g. "USD". Default per dictionary if absent.'),
    totalBudget: z.number().nullable(),
  }),
  tactics: z.array(Schema_Tactic).min(1),
  assumptions: z
    .array(z.string())
    .describe(
      'Plan-level assumptions (missing flight dates, ambiguous budget, platform guessed, etc.).',
    ),
})

/* -------------------------------------------------------------------------- */
/*  STEP 2 / STEP 3 — HIERARCHY  (CM360-shaped entity graph)                   */
/* -------------------------------------------------------------------------- */
/*
 * CM360 is relational, not a strict tree: an Ad links Placements AND Creatives
 * by id (many-to-many). So entities live in flat arrays and reference each
 * other by id, including which campaign they belong to (`campaignId`). This
 * mirrors the real CM360 API and is straightforward to render.
 *
 * Per ADR-0001, a Job produces one CM360 campaign per distinct Campaign Type
 * present in the plan, not one campaign per plan — hence `campaigns` is an
 * array. Step 2 fills it with one entry per distinct Campaign Type found in the
 * tactics; each stored Hierarchy Version (independently versioned per Campaign
 * Type) holds this same shape with exactly one entry.
 */

export const Schema_Compatibility = z
  .enum(['DISPLAY', 'IN_STREAM_VIDEO', 'TRACKING'])
  .describe('Placement compatibility. CM360 mechanic, from campaign-spec §5.')

export const Schema_CreativeType = z
  .enum(['DISPLAY', 'IMAGE', 'HTML5_BANNER', 'IN_STREAM_VIDEO', 'TRACKING_TEXT'])
  .describe('CM360 creative type. CM360 mechanic, from campaign-spec §5.')

export const Schema_AdType = z
  .enum(['AD_SERVING_STANDARD', 'AD_SERVING_TRACKING', 'AD_SERVING_DEFAULT'])
  .describe('CM360 ad type. Tracking ads carry no served creative payload.')

export const Schema_CampaignEntity = z.object({
  id: z.string().describe("Stable local id, e.g. 'cmp_1'. Referenced by child entities."),
  name: z.string().describe("Built from the field dictionary's naming taxonomy for campaigns."),
  campaignType: Schema_CampaignType,
  advertiser: z.string(),
  startDate: Schema_IsoDate,
  endDate: Schema_IsoDate,
  defaultLandingPageId: z.string().nullable(),
})

export const Schema_SiteEntity = z.object({
  id: z.string(),
  name: z.string(),
})

export const Schema_LandingPageEntity = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
})

export const Schema_PlacementEntity = z.object({
  id: z.string(),
  name: z.string().describe('Built from the placement naming taxonomy in campaign-spec §3.'),
  campaignId: z.string(),
  siteId: z.string(),
  compatibility: Schema_Compatibility,
  size: Schema_CanonicalSize.describe(
    'Placement size as "WIDTH x HEIGHT". Tracking placements are "1 x 1".',
  ),
  pricingModel: Schema_PricingModel,
  rate: z.number().nullable(),
  startDate: Schema_IsoDate,
  endDate: Schema_IsoDate,
  isTracking: z.boolean(),
  sourceTacticName: z.string().describe('Which plan tactic this came from, for traceability.'),
})

export const Schema_CreativeEntity = z.object({
  id: z.string(),
  name: z.string().describe('Built from the creative naming taxonomy in campaign-spec §3.'),
  campaignId: z.string(),
  type: Schema_CreativeType,
  size: Schema_CanonicalSize.describe('Creative size as "WIDTH x HEIGHT".'),
  isTracking: z.boolean(),
  landingPageId: z.string().nullable(),
  sourceTacticName: z.string(),
})

export const Schema_AdEntity = z.object({
  id: z.string(),
  name: z.string().describe('Built from the ad naming taxonomy in campaign-spec §3.'),
  campaignId: z.string(),
  type: Schema_AdType,
  placementIds: z.array(z.string()).min(1).describe('Placements this ad is assigned to.'),
  creativeIds: z
    .array(z.string())
    .describe('Creatives assigned to this ad. Empty for tracking ads.'),
  sourceTacticName: z.string(),
})

export const Schema_Hierarchy = z.object({
  platform: z.literal('CM360'),
  campaigns: z
    .array(Schema_CampaignEntity)
    .min(1)
    .describe(
      'One entry per distinct Campaign Type present in the plan (ADR-0001) — not one per plan. A plan with only Display tactics still has exactly one entry. A single stored Hierarchy Version (one Campaign Type) always has exactly one entry here.',
    ),
  sites: z.array(Schema_SiteEntity),
  landingPages: z.array(Schema_LandingPageEntity),
  placements: z.array(Schema_PlacementEntity),
  creatives: z.array(Schema_CreativeEntity),
  ads: z.array(Schema_AdEntity),
  assumptions: z
    .array(z.string())
    .describe(
      'Carry forward plan assumptions plus any NEW structural assumptions made while building the hierarchy (fan-out choices, defaulted sizes, etc.).',
    ),
  changeSummary: z
    .string()
    .nullable()
    .describe(
      'On an EDIT turn, a one-line natural-language summary of what changed vs the previous version. Exactly "No change" when this edit instruction was fanned out to this Campaign Type\'s hierarchy but did not apply to it. Null on first generation.',
    ),
})
