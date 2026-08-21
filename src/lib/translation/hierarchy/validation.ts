/**
 * The shape of a campaign-spec §8 violation. It is a *contract*, not just an
 * internal type: ticket 07 persists these on a `needs_clarification` Hierarchy
 * Version as jsonb and feeds them back to the model as retry context, and the
 * review UI renders each one against the entity it names.
 */
import { z } from 'zod'

export const Schema_HierarchyViolationCode = z.enum([
  'AD_PLACEMENT_UNRESOLVED',
  'AD_CREATIVE_UNRESOLVED',
  'AD_CREATIVE_COUNT_INVALID',
  'AD_CREATIVE_SIZE_MISMATCH',
  'TRACKING_ENTITY_MALFORMED',
  'YOUTUBE_ENTITY_NOT_IN_STREAM_VIDEO',
  'CAMPAIGN_REFERENCE_UNRESOLVED',
  'SITE_REFERENCE_UNRESOLVED',
  'LANDING_PAGE_REFERENCE_UNRESOLVED',
  'SIZE_NOT_IN_DICTIONARY',
  'DUPLICATE_CAMPAIGN_TYPE',
  'ENTITY_ASSIGNED_ACROSS_CAMPAIGN_TYPES',
])

/** The entity a violation is reported against — where the fix belongs. */
export const Schema_HierarchyEntityType = z.enum(['campaign', 'placement', 'creative', 'ad'])

export const Schema_HierarchyViolation = z.object({
  code: Schema_HierarchyViolationCode,
  /** Which campaign-spec §8 invariant was broken, 1-7. */
  invariant: z.number().int().min(1).max(7),
  entityType: Schema_HierarchyEntityType,
  entityId: z.string(),
  /** One sentence naming the problem, readable by a person and by the model. */
  message: z.string(),
})

export const Schema_HierarchyViolations = z.array(Schema_HierarchyViolation)
