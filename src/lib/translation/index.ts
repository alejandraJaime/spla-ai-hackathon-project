/**
 * The translation module's public surface: the Plan and Hierarchy contracts,
 * the §8 violation contract, the domain knowledge the pipeline loads into
 * prompts, and the module's errors. Everything else in the module is internal.
 */
export {
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

export type {
  AdEntity,
  AdType,
  Audience,
  CampaignEntity,
  CampaignObjective,
  CampaignType,
  CanonicalSize,
  Compatibility,
  Country,
  CreativeEntity,
  CreativeType,
  Device,
  DictionarySize,
  Hierarchy,
  Inventory,
  IsoDate,
  ISizeParts,
  LandingPageEntity,
  MediaFormat,
  MediaPlatform,
  MediaType,
  PlacementEntity,
  Plan,
  PricingModel,
  Publisher,
  Region,
  SiteEntity,
  Tactic,
  TacticChannel,
  TacticFormat,
  TacticToken,
} from './translation.types'

export { splitSize } from './translation.size'

/*
 * The hierarchy sub-module's *contract* only. The pure rules themselves — the
 * campaign-spec §8 pass, the §3 naming taxonomy, §1's Campaign Type resolution
 * and the per-Campaign-Type split — are used by this module's own pipeline,
 * which imports './hierarchy' directly. What crosses the module boundary is the
 * violation shape: the pipeline persists it as jsonb and the review UI renders
 * each violation against the entity it names.
 */
export {
  Schema_HierarchyEntityType,
  Schema_HierarchyViolation,
  Schema_HierarchyViolationCode,
  Schema_HierarchyViolations,
} from './hierarchy'

export type { HierarchyEntityType, HierarchyViolation, HierarchyViolationCode } from './hierarchy'

export { dictionaryValues, readKnowledgeDocument } from './knowledge'

export type {
  DictionaryFieldName,
  FieldDictionary,
  FieldDictionaryEntry,
  KnowledgeDocumentName,
} from './knowledge/types'

export {
  FieldDictionaryMalformedError,
  FreeformDictionaryFieldError,
  KnowledgeDocumentUnreadableError,
  UnknownDictionaryFieldError,
} from './errors'
