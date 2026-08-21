import type { z } from 'zod'

import type {
  CampaignEntity,
  CampaignType,
  CreativeEntity,
  PlacementEntity,
  Tactic,
} from '../translation.types'
import type {
  Schema_HierarchyEntityType,
  Schema_HierarchyViolation,
  Schema_HierarchyViolationCode,
} from './validation'

/**
 * The parts of a Tactic that decide its Campaign Type (campaign-spec §1). A
 * whole `Tactic` satisfies this structurally, so callers pass one directly.
 */
export type CampaignTypeSignals = Pick<
  Tactic,
  'adSizes' | 'channel' | 'format' | 'mediaPartner' | 'trackingOnly'
>

/** A Campaign Type, or `null` for a tactic the prototype has no build pattern for. */
export type ResolvedCampaignType = CampaignType | null

/* -------------------------------------------------------------------------- */
/*  The naming taxonomy (campaign-spec §3)                                     */
/* -------------------------------------------------------------------------- */

/** A built taxonomy name, plus one assumption per token that had to be dropped. */
export interface ITaxonomyName {
  name: string
  assumptions: string[]
}

/**
 * One slot in a taxonomy name: the field it names, and the value for it. `field`
 * is a plain string rather than a `DictionaryFieldName` because §3's token list
 * includes slots the dictionary does not define — `Advertiser`, the flight
 * window, the landing page's url slug.
 */
export interface ITaxonomyToken {
  field: string
  value: string | null | undefined
}

export interface ICampaignNameTokens {
  advertiser: string | null
  campaignType: string | null
  campaignObjective: string | null
  flightStart: string | null
  flightEnd: string | null
}

export interface ISiteNameTokens {
  mediaPartner: string | null
}

export interface ILandingPageNameTokens {
  advertiser: string | null
  url: string | null
}

export interface IPlacementNameTokens {
  campaignType: string | null
  publisher: string | null
  size: string | null
  mediaFormat: string | null
  country: string | null
}

export interface ICreativeNameTokens {
  campaignType: string | null
  mediaType: string | null
  size: string | null
}

export interface IAdNameTokens {
  campaignType: string | null
  tactic: string | null
  size: string | null
}

/* -------------------------------------------------------------------------- */
/*  campaign-spec §8 violations                                                */
/* -------------------------------------------------------------------------- */

export type HierarchyViolationCode = z.infer<typeof Schema_HierarchyViolationCode>
export type HierarchyEntityType = z.infer<typeof Schema_HierarchyEntityType>
export type HierarchyViolation = z.infer<typeof Schema_HierarchyViolation>

/** Every lookup the §8 pass needs, built once per call. */
export interface IHierarchyIndex {
  campaignsById: Map<string, CampaignEntity>
  placementsById: Map<string, PlacementEntity>
  creativesById: Map<string, CreativeEntity>
  siteIds: Set<string>
  landingPageIds: Set<string>
  allowedSizes: Set<string>
}
