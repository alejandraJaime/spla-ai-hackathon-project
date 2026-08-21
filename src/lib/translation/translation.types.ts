import type { z } from 'zod'
import type {
  Schema_AdEntity,
  Schema_AdType,
  Schema_Audience,
  Schema_CampaignEntity,
  Schema_CampaignObjective,
  Schema_CampaignType,
  Schema_CanonicalSize,
  Schema_Compatibility,
  Schema_Country,
  Schema_CreativeEntity,
  Schema_CreativeType,
  Schema_Device,
  Schema_DictionarySize,
  Schema_Hierarchy,
  Schema_Inventory,
  Schema_IsoDate,
  Schema_LandingPageEntity,
  Schema_MediaFormat,
  Schema_MediaPlatform,
  Schema_MediaType,
  Schema_PlacementEntity,
  Schema_Plan,
  Schema_PricingModel,
  Schema_Publisher,
  Schema_Region,
  Schema_SiteEntity,
  Schema_Tactic,
  Schema_TacticChannel,
  Schema_TacticFormat,
  Schema_TacticToken,
} from './translation.validation'

/* Hard-constrained dictionary values. These infer as `string`: the allowed
 * values are derived from `taxonomy-fields.json` at runtime, and a JSON import
 * widens to `string[]`, so there is no literal union to infer. The dictionary
 * is the constraint — pinning a union here would let the type drift from it. */
export type DictionarySize = z.infer<typeof Schema_DictionarySize>
export type MediaType = z.infer<typeof Schema_MediaType>
export type Inventory = z.infer<typeof Schema_Inventory>
export type CampaignType = z.infer<typeof Schema_CampaignType>
export type MediaPlatform = z.infer<typeof Schema_MediaPlatform>
export type TacticToken = z.infer<typeof Schema_TacticToken>
export type CampaignObjective = z.infer<typeof Schema_CampaignObjective>
export type Audience = z.infer<typeof Schema_Audience>
export type Publisher = z.infer<typeof Schema_Publisher>
export type MediaFormat = z.infer<typeof Schema_MediaFormat>
export type Device = z.infer<typeof Schema_Device>
export type Country = z.infer<typeof Schema_Country>
export type Region = z.infer<typeof Schema_Region>

/* Shared primitives */
export type IsoDate = z.infer<typeof Schema_IsoDate>
export type CanonicalSize = z.infer<typeof Schema_CanonicalSize>
export type PricingModel = z.infer<typeof Schema_PricingModel>

/* Step 1 — the Plan */
export type TacticChannel = z.infer<typeof Schema_TacticChannel>
export type TacticFormat = z.infer<typeof Schema_TacticFormat>
export type Tactic = z.infer<typeof Schema_Tactic>
export type Plan = z.infer<typeof Schema_Plan>

/* Step 2 / Step 3 — the Hierarchy */
export type Compatibility = z.infer<typeof Schema_Compatibility>
export type CreativeType = z.infer<typeof Schema_CreativeType>
export type AdType = z.infer<typeof Schema_AdType>
export type CampaignEntity = z.infer<typeof Schema_CampaignEntity>
export type SiteEntity = z.infer<typeof Schema_SiteEntity>
export type LandingPageEntity = z.infer<typeof Schema_LandingPageEntity>
export type PlacementEntity = z.infer<typeof Schema_PlacementEntity>
export type CreativeEntity = z.infer<typeof Schema_CreativeEntity>
export type AdEntity = z.infer<typeof Schema_AdEntity>
export type Hierarchy = z.infer<typeof Schema_Hierarchy>

/** Width and height as numbers, from `splitSize()`. */
export interface ISizeParts {
  width: number
  height: number
}
