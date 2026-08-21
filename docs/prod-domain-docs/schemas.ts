/**
 * Tentative Data contracts for the media-plan → CM360 hierarchy translator.
 *
 *   - PlanSchema      is the output of STEP 1 (extraction)  -> "output-plan.json"
 *   - HierarchySchema is the output of STEP 2 (translation) -> "output-hierarchy.json"
 *
 * Pass each schema directly to the Vercel AI SDK:
 *   const { object } = await generateObject({ model, schema: PlanSchema, prompt });
 *
 * The .describe() calls are not decoration — the model reads them.
 *
 * SIZE FORMAT: sizes are the dictionary spelling "WIDTH x HEIGHT" (spaces around
 * the x), e.g. "300 x 250", "1 x 1", "1920 x 1080" — used everywhere, plan
 * through hierarchy through output. When you need width/height as numbers, split
 * the string (see splitSize below) rather than storing a second representation.
 *
 * Enum values below are ILLUSTRATIVE. The real allowed values live in your
 * field dictionary. For the hard-constrained ones, generate the enum from the
 * dictionary at build time so code enforces what the prompt only suggests.
 */

import { z } from 'zod'

/* -------------------------------------------------------------------------- */
/*  Shared primitives                                                          */
/* -------------------------------------------------------------------------- */

const IsoDate = z
  .string()
  .describe(
    'ISO 8601 date, e.g. 2026-09-01. If the source is vague, make a documented assumption and record it in `assumptions`.',
  )

// Canonical size form matches the field dictionary exactly: "WIDTH x HEIGHT"
// with single spaces around the x. Used in the plan AND the hierarchy.
const Size = z
  .string()
  .regex(/^\d{1,4} x \d{1,4}$/)
  .describe(
    'Ad size as "WIDTH x HEIGHT" using the dictionary spelling with spaces, e.g. "300 x 250". Tracking pixels are "1 x 1".',
  )

// Helper for the rare case where you need the parts as numbers.
export function splitSize(size: string): { width: number; height: number } {
  const [w, h] = size.split(/\s*x\s*/i).map((n) => parseInt(n, 10))
  return { width: w ?? 0, height: h ?? 0 }
}

const PricingModel = z
  .enum(['CPM', 'CPC', 'CPV', 'CPD', 'FLAT'])
  .describe('Buy type. Values come from the field dictionary.')

// Matches the field dictionary's "Campaign Type" values exactly (taxonomy-fields.json).
// One CM360 campaign is built per distinct value present in the plan (ADR-0001) —
// this is also the grouping key for independent per-Campaign-Type Hierarchy Versioning.
const CampaignType = z
  .enum(['Display', 'Standard Tracking', 'YouTube'])
  .describe(
    'Campaign Type from the field dictionary. Determines the build/fan-out pattern (campaign-spec §4) and which CM360 campaign this entity belongs to.',
  )

/* -------------------------------------------------------------------------- */
/*  STEP 1 — PLAN SCHEMA  (normalised, platform-agnostic media plan)           */
/* -------------------------------------------------------------------------- */

export const TacticSchema = z.object({
  sourceLine: z
    .union([z.string(), z.number()])
    .nullable()
    .describe('Line/row identifier from the original media plan, for traceability.'),
  name: z.string().describe('Human-readable tactic / placement name from the plan.'),
  channel: z
    .enum(['DISPLAY', 'VIDEO', 'NATIVE', 'TRACKING', 'OTHER'])
    .describe(
      "Normalised channel. Map free-text like 'banners' -> DISPLAY, 'pre-roll'/'YouTube' -> VIDEO.",
    ),
  format: z
    .enum(['DISPLAY', 'IN_STREAM_VIDEO', 'NATIVE', 'TRACKING', 'UNKNOWN'])
    .describe('Delivery format. TRACKING is for pixel/floodlight-style tags.'),
  mediaPartner: z
    .string()
    .nullable()
    .describe('Site / publisher / partner. Null if the plan omits it.'),
  adSizes: z
    .array(Size)
    .describe(
      'All creative sizes for this tactic, in "WIDTH x HEIGHT" form. Empty array if unspecified — do NOT invent sizes silently; record an assumption instead.',
    ),
  startDate: IsoDate.nullable(),
  endDate: IsoDate.nullable(),
  pricingModel: PricingModel.nullable(),
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

export const PlanSchema = z.object({
  plan: z.object({
    advertiser: z.string().describe('Advertiser / client name.'),
    campaignName: z.string(),
    objective: z.string().nullable().describe("e.g. 'Awareness', 'Site Traffic'. Null if absent."),
    flightStart: IsoDate.nullable(),
    flightEnd: IsoDate.nullable(),
    currency: z
      .string()
      .nullable()
      .describe('ISO currency code, e.g. "USD". Default per dictionary if absent.'),
    totalBudget: z.number().nullable(),
  }),
  tactics: z.array(TacticSchema).min(1),
  assumptions: z
    .array(z.string())
    .describe(
      'Plan-level assumptions (missing flight dates, ambiguous budget, platform guessed, etc.).',
    ),
})

export type Plan = z.infer<typeof PlanSchema>
export type Tactic = z.infer<typeof TacticSchema>

/* -------------------------------------------------------------------------- */
/*  STEP 2 — HIERARCHY SCHEMA  (CM360-shaped entity graph)                     */
/* -------------------------------------------------------------------------- */
/*
 * CM360 is relational, not a strict tree: an Ad links Placements AND Creatives
 * by id (many-to-many). So entities live in flat arrays and reference each
 * other by id, including which campaign they belong to (`campaignId`). This
 * mirrors the real CM360 API and is straightforward to render.
 *
 * Per ADR-0001, a Job produces one CM360 campaign per distinct Campaign Type
 * present in the plan, not one campaign per plan — hence `campaigns` below is
 * an array. Step 2 (translate) fills it with one entry per distinct Campaign
 * Type found in the tactics; each Hierarchy Version (independently versioned
 * per Campaign Type) stores this same shape with exactly one entry.
 */

const Compatibility = z
  .enum(['DISPLAY', 'IN_STREAM_VIDEO', 'TRACKING'])
  .describe('Placement compatibility. Values come from the field dictionary / campaign-spec §5.')

const CreativeType = z
  .enum(['DISPLAY', 'IMAGE', 'HTML5_BANNER', 'IN_STREAM_VIDEO', 'TRACKING_TEXT'])
  .describe('CM360 creative type. Values come from campaign-spec §5.')

const AdType = z
  .enum(['AD_SERVING_STANDARD', 'AD_SERVING_TRACKING', 'AD_SERVING_DEFAULT'])
  .describe('CM360 ad type. Tracking ads carry no served creative payload.')

export const CampaignEntity = z.object({
  id: z.string().describe("Stable local id, e.g. 'cmp_1'. Referenced by child entities."),
  name: z.string().describe("Built from the field dictionary's naming taxonomy for campaigns."),
  campaignType: CampaignType,
  advertiser: z.string(),
  startDate: IsoDate,
  endDate: IsoDate,
  defaultLandingPageId: z.string().nullable(),
})

export const SiteEntity = z.object({
  id: z.string(),
  name: z.string(),
})

export const LandingPageEntity = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
})

export const PlacementEntity = z.object({
  id: z.string(),
  name: z.string().describe('Built from the placement naming taxonomy in the field dictionary.'),
  campaignId: z.string(),
  siteId: z.string(),
  compatibility: Compatibility,
  size: Size.describe('Placement size as "WIDTH x HEIGHT". Tracking placements are "1 x 1".'),
  pricingModel: PricingModel,
  rate: z.number().nullable(),
  startDate: IsoDate,
  endDate: IsoDate,
  isTracking: z.boolean(),
  sourceTacticName: z.string().describe('Which plan tactic this came from, for traceability.'),
})

export const CreativeEntity = z.object({
  id: z.string(),
  name: z.string().describe('Built from the creative naming taxonomy in the field dictionary.'),
  campaignId: z.string(),
  type: CreativeType,
  size: Size.describe('Creative size as "WIDTH x HEIGHT".'),
  isTracking: z.boolean(),
  landingPageId: z.string().nullable(),
  sourceTacticName: z.string(),
})

export const AdEntity = z.object({
  id: z.string(),
  name: z.string().describe('Built from the ad naming taxonomy in the field dictionary.'),
  campaignId: z.string(),
  type: AdType,
  placementIds: z.array(z.string()).min(1).describe('Placements this ad is assigned to.'),
  creativeIds: z
    .array(z.string())
    .describe('Creatives assigned to this ad. Empty for tracking ads.'),
  sourceTacticName: z.string(),
})

export const HierarchySchema = z.object({
  platform: z.literal('CM360'),
  campaigns: z
    .array(CampaignEntity)
    .min(1)
    .describe(
      'One entry per distinct Campaign Type present in the plan (ADR-0001) — not one per plan. A plan with only Display tactics still has exactly one entry. A single stored Hierarchy Version (one Campaign Type) always has exactly one entry here.',
    ),
  sites: z.array(SiteEntity),
  landingPages: z.array(LandingPageEntity),
  placements: z.array(PlacementEntity),
  creatives: z.array(CreativeEntity),
  ads: z.array(AdEntity),
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

export type Hierarchy = z.infer<typeof HierarchySchema>
export type PlacementEntityT = z.infer<typeof PlacementEntity>
export type CreativeEntityT = z.infer<typeof CreativeEntity>
export type AdEntityT = z.infer<typeof AdEntity>
