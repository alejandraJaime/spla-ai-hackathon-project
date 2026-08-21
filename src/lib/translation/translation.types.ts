import type { z } from 'zod'

import type { HierarchyViolation } from './hierarchy/types'
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

export type HierarchyVersionStatus = 'ok' | 'needs_clarification'
export type TranslationMessageRole = 'user' | 'assistant'
export type HierarchyVersionPointerMap = Partial<Record<CampaignType, string>>

export type CreateJobInput = {
  platform: MediaPlatform
  sourceFileRef: string
  modelId: string
  plan: Plan
}

export type AppendHierarchyVersionInput = {
  jobId: string
  campaignType: CampaignType
  hierarchy: Hierarchy
  status: HierarchyVersionStatus
  validationErrors: HierarchyViolation[] | null
  changeSummary: string | null
}

export type CreatePlanVersionInput = {
  jobId: string
  messageId: string | null
  pointerMap: HierarchyVersionPointerMap
}

export type CreateMessageInput = {
  jobId: string
  role: TranslationMessageRole
  content: string
  resultingVersionIds: string[]
}

export type DemoUserRecord = {
  id: string
  name: string
  createdAt: Date
}

export type JobRecord = {
  id: string
  ownerId: string
  platform: MediaPlatform
  sourceFileRef: string
  modelId: string
  plan: Plan
  createdAt: Date
  updatedAt: Date
}

export type HierarchyVersionRecord = {
  id: string
  jobId: string
  campaignType: CampaignType
  versionNumber: number
  hierarchy: Hierarchy
  status: HierarchyVersionStatus
  validationErrors: HierarchyViolation[] | null
  changeSummary: string | null
  createdAt: Date
}

export type PlanVersionRecord = {
  id: string
  jobId: string
  versionNumber: number
  messageId: string | null
  pointerMap: HierarchyVersionPointerMap
  createdAt: Date
}

export type MessageRecord = {
  id: string
  jobId: string
  role: TranslationMessageRole
  content: string
  resultingVersionIds: string[]
  createdAt: Date
}

export type ResolvedPlanVersion = {
  planVersion: PlanVersionRecord
  hierarchyVersions: HierarchyVersionRecord[]
}

export interface ITranslationRepository {
  ensureDemoUser(): Promise<DemoUserRecord>
  createJob(input: CreateJobInput): Promise<JobRecord>
  findJobById(id: string): Promise<JobRecord | null>
  appendHierarchyVersion(input: AppendHierarchyVersionInput): Promise<HierarchyVersionRecord>
  createPlanVersion(input: CreatePlanVersionInput): Promise<PlanVersionRecord>
  resolvePlanVersion(id: string): Promise<ResolvedPlanVersion | null>
  createMessage(input: CreateMessageInput): Promise<MessageRecord>
  findMessageById(id: string): Promise<MessageRecord | null>
}
