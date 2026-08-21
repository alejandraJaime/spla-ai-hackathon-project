/**
 * The campaign-spec §8 referential-integrity pass: hierarchy in, structured
 * list of violations out. Never throws and never mutates its input — an empty
 * array means the hierarchy is sound.
 *
 * This is deliberately not schema validation. Zod already proved the shape; the
 * question here is whether the graph hangs together: whether an ad's references
 * resolve, whether a tracking line is actually tracking-shaped, whether every
 * entity sits in the campaign its own CM360 mechanics imply. A hierarchy can be
 * perfectly schema-valid and still be nonsense, and it is that nonsense the
 * user would otherwise have to spot by eye.
 *
 * NO DERIVED VIOLATIONS. One defect is reported once, against the entity whose
 * fix resolves it. A size mismatch is not reported for a pair that is already
 * flagged as unresolvable or as living in another campaign, because the
 * comparison is meaningless until that is fixed. What is *not* suppressed is a
 * second, independent defect on the same entity — an ad can both point at a
 * missing placement and link the wrong number of creatives, and ticket 07's
 * retry budget is too small to spend a whole attempt discovering the second one.
 */
import { dictionaryValues } from '../knowledge'
import type {
  AdEntity,
  AdType,
  CampaignEntity,
  CampaignType,
  Compatibility,
  CreativeEntity,
  CreativeType,
  Hierarchy,
  PlacementEntity,
} from '../translation.types'
import { CAMPAIGN_TYPES, TRACKING_SIZE } from './hierarchy.rules'
import type {
  HierarchyEntityType,
  HierarchyViolation,
  HierarchyViolationCode,
  IHierarchyIndex,
} from './types'

/**
 * `allowedSizes` defaults to the field dictionary's Size list and is injectable
 * so the invariant can be exercised against a list other than the one on disk,
 * the way `dictionaryValues` takes an injectable dictionary.
 */
export function validateHierarchy(
  hierarchy: Hierarchy,
  allowedSizes: readonly string[] = dictionaryValues('Size'),
): HierarchyViolation[] {
  const index = indexHierarchy(hierarchy, allowedSizes)
  return [
    ...checkCampaigns(hierarchy.campaigns, index),
    ...hierarchy.placements.flatMap((placement) => checkPlacement(placement, index)),
    ...hierarchy.creatives.flatMap((creative) => checkCreative(creative, index)),
    ...hierarchy.ads.flatMap((ad) => checkAd(ad, index)),
  ]
}

function indexHierarchy(hierarchy: Hierarchy, allowedSizes: readonly string[]): IHierarchyIndex {
  return {
    campaignsById: new Map(hierarchy.campaigns.map((campaign) => [campaign.id, campaign])),
    placementsById: new Map(hierarchy.placements.map((placement) => [placement.id, placement])),
    creativesById: new Map(hierarchy.creatives.map((creative) => [creative.id, creative])),
    siteIds: new Set(hierarchy.sites.map((site) => site.id)),
    landingPageIds: new Set(hierarchy.landingPages.map((landingPage) => landingPage.id)),
    allowedSizes: new Set(allowedSizes),
  }
}

/* -------------------------------------------------------------------------- */
/*  The two lookup tables the invariants are read off                          */
/* -------------------------------------------------------------------------- */

/** Which campaign-spec §8 invariant each violation code belongs to. */
const INVARIANT_BY_CODE: Record<HierarchyViolationCode, number> = {
  AD_PLACEMENT_UNRESOLVED: 1,
  AD_CREATIVE_UNRESOLVED: 1,
  AD_CREATIVE_COUNT_INVALID: 2,
  AD_CREATIVE_SIZE_MISMATCH: 2,
  TRACKING_ENTITY_MALFORMED: 3,
  YOUTUBE_ENTITY_NOT_IN_STREAM_VIDEO: 4,
  CAMPAIGN_REFERENCE_UNRESOLVED: 5,
  SITE_REFERENCE_UNRESOLVED: 5,
  LANDING_PAGE_REFERENCE_UNRESOLVED: 5,
  SIZE_NOT_IN_DICTIONARY: 6,
  DUPLICATE_CAMPAIGN_TYPE: 7,
  ENTITY_ASSIGNED_ACROSS_CAMPAIGN_TYPES: 7,
}

/**
 * campaign-spec §5 as one table: which campaigns each CM360 mechanic belongs
 * in. Placement `compatibility`, creative `type` and ad `type` all resolve
 * through it, so §5 is stated once. `AD_SERVING_STANDARD` covers display *and*
 * YouTube per §5; `AD_SERVING_DEFAULT` is unconstrained because §5 gives it no
 * rule, and inventing one here would fail hierarchies the spec permits.
 */
const CAMPAIGN_TYPES_BY_MECHANIC: Record<
  AdType | Compatibility | CreativeType,
  readonly CampaignType[]
> = {
  DISPLAY: [CAMPAIGN_TYPES.display],
  IMAGE: [CAMPAIGN_TYPES.display],
  HTML5_BANNER: [CAMPAIGN_TYPES.display],
  IN_STREAM_VIDEO: [CAMPAIGN_TYPES.youTube],
  TRACKING: [CAMPAIGN_TYPES.standardTracking],
  TRACKING_TEXT: [CAMPAIGN_TYPES.standardTracking],
  AD_SERVING_STANDARD: [CAMPAIGN_TYPES.display, CAMPAIGN_TYPES.youTube],
  AD_SERVING_TRACKING: [CAMPAIGN_TYPES.standardTracking],
  AD_SERVING_DEFAULT: Object.values(CAMPAIGN_TYPES),
}

const ENTITY_LABEL: Record<HierarchyEntityType, string> = {
  campaign: 'Campaign',
  placement: 'Placement',
  creative: 'Creative',
  ad: 'Ad',
}

/* -------------------------------------------------------------------------- */
/*  §8.7 campaign cardinality, and the campaign's own reference (§8.5)         */
/* -------------------------------------------------------------------------- */

function checkCampaigns(campaigns: CampaignEntity[], index: IHierarchyIndex): HierarchyViolation[] {
  const violations: HierarchyViolation[] = []
  const campaignIdByType = new Map<string, string>()

  for (const campaign of campaigns) {
    const claimant = campaignIdByType.get(campaign.campaignType)
    if (claimant === undefined) {
      campaignIdByType.set(campaign.campaignType, campaign.id)
    } else {
      violations.push(
        violation(
          'DUPLICATE_CAMPAIGN_TYPE',
          'campaign',
          campaign.id,
          `Campaign "${campaign.id}" has Campaign Type "${campaign.campaignType}", which campaign "${claimant}" already holds. A hierarchy holds exactly one campaign per Campaign Type (ADR-0001).`,
        ),
      )
    }

    if (
      campaign.defaultLandingPageId !== null &&
      !index.landingPageIds.has(campaign.defaultLandingPageId)
    ) {
      violations.push(
        unresolvedReference(
          'LANDING_PAGE_REFERENCE_UNRESOLVED',
          'campaign',
          campaign.id,
          'defaultLandingPageId',
          campaign.defaultLandingPageId,
          'landing page',
        ),
      )
    }
  }

  return violations
}

/* -------------------------------------------------------------------------- */
/*  Placements and creatives                                                   */
/* -------------------------------------------------------------------------- */

function checkPlacement(placement: PlacementEntity, index: IHierarchyIndex): HierarchyViolation[] {
  const campaign = index.campaignsById.get(placement.campaignId)
  const violations: HierarchyViolation[] = []

  if (!campaign) {
    violations.push(unresolvedCampaign('placement', placement.id, placement.campaignId))
  }
  if (!index.siteIds.has(placement.siteId)) {
    violations.push(
      unresolvedReference(
        'SITE_REFERENCE_UNRESOLVED',
        'placement',
        placement.id,
        'siteId',
        placement.siteId,
        'site',
      ),
    )
  }
  if (!index.allowedSizes.has(placement.size)) {
    violations.push(sizeNotInDictionary('placement', placement.id, placement.size))
  }

  return [
    ...violations,
    ...checkMechanics(
      {
        entityType: 'placement',
        id: placement.id,
        size: placement.size,
        isTracking: placement.isTracking,
        mechanicField: 'compatibility',
        mechanic: placement.compatibility,
        trackingMechanic: 'TRACKING',
      },
      campaign,
    ),
  ]
}

function checkCreative(creative: CreativeEntity, index: IHierarchyIndex): HierarchyViolation[] {
  const campaign = index.campaignsById.get(creative.campaignId)
  const violations: HierarchyViolation[] = []

  if (!campaign) {
    violations.push(unresolvedCampaign('creative', creative.id, creative.campaignId))
  }
  if (creative.landingPageId !== null && !index.landingPageIds.has(creative.landingPageId)) {
    violations.push(
      unresolvedReference(
        'LANDING_PAGE_REFERENCE_UNRESOLVED',
        'creative',
        creative.id,
        'landingPageId',
        creative.landingPageId,
        'landing page',
      ),
    )
  }
  if (!index.allowedSizes.has(creative.size)) {
    violations.push(sizeNotInDictionary('creative', creative.id, creative.size))
  }

  return [
    ...violations,
    ...checkMechanics(
      {
        entityType: 'creative',
        id: creative.id,
        size: creative.size,
        isTracking: creative.isTracking,
        mechanicField: 'type',
        mechanic: creative.type,
        trackingMechanic: 'TRACKING_TEXT',
      },
      campaign,
    ),
  ]
}

/**
 * One entity's CM360 mechanics, described uniformly so §8.3, §8.4 and §8.7 can
 * be read off a placement and a creative with the same code.
 */
interface IEntityMechanics {
  entityType: 'creative' | 'placement'
  id: string
  size: string
  isTracking: boolean
  /** `compatibility` on a placement, `type` on a creative. */
  mechanicField: string
  mechanic: Compatibility | CreativeType
  /** The value of `mechanicField` that marks this kind of entity as tracking. */
  trackingMechanic: Compatibility | CreativeType
}

/**
 * §8.3, §8.4 and §8.7 all read the same thing — an entity's mechanic against
 * the campaign it sits in — so their precedence lives here once. It runs
 * most-specific first: a part-tracking entity is a tracking problem, a
 * non-in-stream entity in the YouTube campaign is a YouTube problem, and only
 * what neither describes is reported as a misfiled entity.
 */
function checkMechanics(
  entity: IEntityMechanics,
  campaign: CampaignEntity | undefined,
): HierarchyViolation[] {
  const label = ENTITY_LABEL[entity.entityType]
  const trackingSignals = [
    entity.isTracking,
    entity.size === TRACKING_SIZE,
    entity.mechanic === entity.trackingMechanic,
  ]

  if (isPartlyTracking(trackingSignals)) {
    return [
      violation(
        'TRACKING_ENTITY_MALFORMED',
        entity.entityType,
        entity.id,
        `${label} "${entity.id}" is only partly tracking-shaped (size "${entity.size}", ${entity.mechanicField} "${entity.mechanic}", isTracking ${String(entity.isTracking)}). A tracking ${entity.entityType} must be size "${TRACKING_SIZE}", ${entity.mechanicField} "${entity.trackingMechanic}" and isTracking true.`,
      ),
    ]
  }

  if (!campaign) {
    return []
  }

  if (campaign.campaignType === CAMPAIGN_TYPES.youTube && entity.mechanic !== 'IN_STREAM_VIDEO') {
    return [
      violation(
        'YOUTUBE_ENTITY_NOT_IN_STREAM_VIDEO',
        entity.entityType,
        entity.id,
        `${label} "${entity.id}" is in the YouTube campaign but its ${entity.mechanicField} is "${entity.mechanic}"; every YouTube ${entity.entityType} uses "IN_STREAM_VIDEO".`,
      ),
    ]
  }

  return checkMechanicBelongsInCampaign(
    entity.entityType,
    entity.id,
    `${label} "${entity.id}" has ${entity.mechanicField} "${entity.mechanic}"`,
    entity.mechanic,
    campaign,
  )
}

/**
 * Tracking is all-or-nothing (§8.3). Some-but-not-all catches both halves of
 * the invariant: a tracking entity that isn't `1 x 1`, and a `1 x 1` entity
 * that was never marked as tracking — which §1 says is a tracking line.
 */
function isPartlyTracking(signals: boolean[]): boolean {
  return signals.some(Boolean) && !signals.every(Boolean)
}

/** §8.7's second clause, for any entity carrying a §5 mechanic. */
function checkMechanicBelongsInCampaign(
  entityType: HierarchyEntityType,
  entityId: string,
  subject: string,
  mechanic: AdType | Compatibility | CreativeType,
  campaign: CampaignEntity,
): HierarchyViolation[] {
  const belongsIn = CAMPAIGN_TYPES_BY_MECHANIC[mechanic]
  if (belongsIn.includes(campaign.campaignType)) {
    return []
  }

  const expected = belongsIn.map((campaignType) => `"${campaignType}"`).join(' or ')
  return [
    violation(
      'ENTITY_ASSIGNED_ACROSS_CAMPAIGN_TYPES',
      entityType,
      entityId,
      `${subject}, which belongs in a ${expected} campaign, but its campaignId points at "${campaign.id}" (${campaign.campaignType}).`,
    ),
  ]
}

/* -------------------------------------------------------------------------- */
/*  Ads                                                                        */
/* -------------------------------------------------------------------------- */

function checkAd(ad: AdEntity, index: IHierarchyIndex): HierarchyViolation[] {
  const violations: HierarchyViolation[] = []

  for (const placementId of ad.placementIds) {
    if (!index.placementsById.has(placementId)) {
      violations.push(
        violation(
          'AD_PLACEMENT_UNRESOLVED',
          'ad',
          ad.id,
          `Ad "${ad.id}" references placement "${placementId}", which is not a placement in this hierarchy.`,
        ),
      )
    }
  }
  for (const creativeId of ad.creativeIds) {
    if (!index.creativesById.has(creativeId)) {
      violations.push(
        violation(
          'AD_CREATIVE_UNRESOLVED',
          'ad',
          ad.id,
          `Ad "${ad.id}" references creative "${creativeId}", which is not a creative in this hierarchy.`,
        ),
      )
    }
  }

  const campaign = index.campaignsById.get(ad.campaignId)
  if (!campaign) {
    violations.push(unresolvedCampaign('ad', ad.id, ad.campaignId))
  } else {
    violations.push(
      /* §5 gives the ad type a Campaign Type too, so a tracking ad parked in
       * the Display campaign is caught here rather than slipping through §8.2's
       * tracking exemption. */
      ...checkMechanicBelongsInCampaign(
        'ad',
        ad.id,
        `Ad "${ad.id}" has type "${ad.type}"`,
        ad.type,
        campaign,
      ),
      ...checkAdLinksStayInCampaign(ad, campaign, index),
    )
  }

  return [...violations, ...checkAdCreativeSizeMatch(ad, campaign, index)]
}

function checkAdLinksStayInCampaign(
  ad: AdEntity,
  campaign: CampaignEntity,
  index: IHierarchyIndex,
): HierarchyViolation[] {
  const linked = [
    ...ad.placementIds.map((id) => ({ label: 'placement', entity: index.placementsById.get(id) })),
    ...ad.creativeIds.map((id) => ({ label: 'creative', entity: index.creativesById.get(id) })),
  ]

  return linked.flatMap(({ label, entity }) => {
    /* An entity that doesn't resolve, or whose own campaignId is dangling, is
     * already reported where it lives. */
    if (!entity || !index.campaignsById.has(entity.campaignId)) {
      return []
    }
    if (entity.campaignId === campaign.id) {
      return []
    }
    return [
      violation(
        'ENTITY_ASSIGNED_ACROSS_CAMPAIGN_TYPES',
        'ad',
        ad.id,
        `Ad "${ad.id}" belongs to campaign "${campaign.id}" (${campaign.campaignType}) but links ${label} "${entity.id}", which belongs to campaign "${entity.campaignId}".`,
      ),
    ]
  })
}

/**
 * §8.2: a served ad links exactly one creative, size-matched to its placement.
 * The count is checked whatever else is wrong with the ad — it is an
 * independent defect, not a consequence of one. The size comparison is only
 * made for a pair that actually resolves inside this ad's own campaign;
 * anywhere else, the mismatch is a symptom of the reference problem already
 * reported.
 */
function checkAdCreativeSizeMatch(
  ad: AdEntity,
  campaign: CampaignEntity | undefined,
  index: IHierarchyIndex,
): HierarchyViolation[] {
  if (ad.type === 'AD_SERVING_TRACKING') {
    return []
  }

  if (ad.creativeIds.length !== 1) {
    return [
      violation(
        'AD_CREATIVE_COUNT_INVALID',
        'ad',
        ad.id,
        `Ad "${ad.id}" links ${ad.creativeIds.length} creatives; a non-tracking ad links exactly one creative, size-matched to its placement.`,
      ),
    ]
  }

  const creative = index.creativesById.get(ad.creativeIds[0]!)
  if (!campaign || creative?.campaignId !== campaign.id) {
    return []
  }

  return ad.placementIds.flatMap((placementId) => {
    const placement = index.placementsById.get(placementId)
    if (placement?.campaignId !== campaign.id || placement.size === creative.size) {
      return []
    }
    return [
      violation(
        'AD_CREATIVE_SIZE_MISMATCH',
        'ad',
        ad.id,
        `Ad "${ad.id}" links creative "${creative.id}" (${creative.size}), which does not match the size of its placement "${placement.id}" (${placement.size}).`,
      ),
    ]
  })
}

/* -------------------------------------------------------------------------- */
/*  Violation constructors                                                     */
/* -------------------------------------------------------------------------- */

function unresolvedCampaign(
  entityType: HierarchyEntityType,
  entityId: string,
  campaignId: string,
): HierarchyViolation {
  return unresolvedReference(
    'CAMPAIGN_REFERENCE_UNRESOLVED',
    entityType,
    entityId,
    'campaignId',
    campaignId,
    'campaign',
  )
}

function unresolvedReference(
  code: HierarchyViolationCode,
  entityType: HierarchyEntityType,
  entityId: string,
  field: string,
  referencedId: string,
  referencedKind: string,
): HierarchyViolation {
  return violation(
    code,
    entityType,
    entityId,
    `${ENTITY_LABEL[entityType]} "${entityId}" has ${field} "${referencedId}", which is not a ${referencedKind} in this hierarchy.`,
  )
}

function sizeNotInDictionary(
  entityType: HierarchyEntityType,
  entityId: string,
  size: string,
): HierarchyViolation {
  return violation(
    'SIZE_NOT_IN_DICTIONARY',
    entityType,
    entityId,
    `${ENTITY_LABEL[entityType]} "${entityId}" has size "${size}", which the field dictionary does not allow.`,
  )
}

/** The §8 invariant is derived from the code, never hand-paired with it. */
function violation(
  code: HierarchyViolationCode,
  entityType: HierarchyEntityType,
  entityId: string,
  message: string,
): HierarchyViolation {
  return { code, invariant: INVARIANT_BY_CODE[code], entityType, entityId, message }
}
