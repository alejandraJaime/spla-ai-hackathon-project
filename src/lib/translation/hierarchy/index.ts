/**
 * The pure rules of the hierarchy: campaign-spec §8's referential-integrity
 * pass, §3's naming taxonomy, §1's Campaign Type resolution, and the split of
 * one multi-campaign hierarchy into one single-campaign hierarchy per Campaign
 * Type (ADR-0001).
 *
 * Nothing here knows about tRPC, Next.js, the database or the model. Every
 * function is pure: same input, same output, no I/O beyond reading the field
 * dictionary that ships with the code. That is what lets the pipeline retry
 * against it (ticket 07) and the UI render against it (ticket 11) without
 * either of them owning a rule.
 */
export { validateHierarchy } from './hierarchy.validator'

export { CAMPAIGN_TYPES, resolveCampaignType, TRACKING_SIZE } from './hierarchy.rules'

export { splitByCampaignType } from './hierarchy.split'

export {
  buildAdName,
  buildCampaignName,
  buildCreativeName,
  buildLandingPageName,
  buildPlacementName,
  buildSiteName,
} from './hierarchy.taxonomy'

export {
  Schema_HierarchyEntityType,
  Schema_HierarchyViolation,
  Schema_HierarchyViolationCode,
  Schema_HierarchyViolations,
} from './validation'

export type {
  CampaignTypeSignals,
  HierarchyEntityType,
  HierarchyViolation,
  HierarchyViolationCode,
  IAdNameTokens,
  ICampaignNameTokens,
  ICreativeNameTokens,
  ILandingPageNameTokens,
  IPlacementNameTokens,
  ISiteNameTokens,
  ITaxonomyName,
  ITaxonomyToken,
  ResolvedCampaignType,
} from './types'
