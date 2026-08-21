import { validateHierarchy } from '../hierarchy.validator'
import type { HierarchyViolation } from '../types'
import { aDisplayHierarchy, aMixedHierarchy, aYouTubeHierarchy } from './hierarchy.fixtures'

/* Jest's asymmetric matchers are typed `any`; these keep the expectations
 * typed, so a renamed violation field is a compile error in the tests too. */
const messageNaming = (text: string) => expect.stringContaining(text) as unknown as string
const aViolationLike = (violation: Partial<HierarchyViolation>) =>
  expect.objectContaining(violation) as unknown as HierarchyViolation

describe('a valid hierarchy', () => {
  it.each([
    ['a single Display campaign', aDisplayHierarchy()],
    ['a mixed Display + Standard Tracking plan', aMixedHierarchy()],
    ['a minimal YouTube campaign', aYouTubeHierarchy()],
  ])('returns no violations for %s', (_case, hierarchy) => {
    expect(validateHierarchy(hierarchy)).toEqual([])
  })
})

/* campaign-spec §8.1 — every ad reference resolves. */
describe('§8.1 unresolvable ad references', () => {
  it('names the ad and the placement that does not exist', () => {
    const hierarchy = aDisplayHierarchy()
    hierarchy.ads[0]!.placementIds = ['plc_9']

    expect(validateHierarchy(hierarchy)).toEqual([
      {
        code: 'AD_PLACEMENT_UNRESOLVED',
        invariant: 1,
        entityType: 'ad',
        entityId: 'ad_1',
        message: messageNaming('plc_9'),
      },
    ])
  })

  it('names the ad and the creative that does not exist', () => {
    const hierarchy = aDisplayHierarchy()
    hierarchy.ads[0]!.creativeIds = ['cre_9']

    expect(validateHierarchy(hierarchy)).toEqual([
      {
        code: 'AD_CREATIVE_UNRESOLVED',
        invariant: 1,
        entityType: 'ad',
        entityId: 'ad_1',
        message: messageNaming('cre_9'),
      },
    ])
  })
})

/* campaign-spec §8.2 — one size-matched creative per served ad. */
describe('§8.2 a non-tracking ad links exactly one size-matched creative', () => {
  it('flags an ad linking no creative', () => {
    const hierarchy = aDisplayHierarchy()
    hierarchy.ads[0]!.creativeIds = []

    expect(validateHierarchy(hierarchy)).toEqual([
      {
        code: 'AD_CREATIVE_COUNT_INVALID',
        invariant: 2,
        entityType: 'ad',
        entityId: 'ad_1',
        message: messageNaming('exactly one'),
      },
    ])
  })

  it('flags an ad linking two creatives', () => {
    const hierarchy = aMixedHierarchy()
    hierarchy.ads[0]!.creativeIds = ['cre_1', 'cre_2']

    expect(validateHierarchy(hierarchy)).toEqual([
      {
        code: 'AD_CREATIVE_COUNT_INVALID',
        invariant: 2,
        entityType: 'ad',
        entityId: 'ad_1',
        message: messageNaming('exactly one'),
      },
    ])
  })

  it("flags a creative whose size does not match its ad's placement", () => {
    const hierarchy = aMixedHierarchy()
    hierarchy.ads[0]!.creativeIds = ['cre_2']

    expect(validateHierarchy(hierarchy)).toEqual([
      {
        code: 'AD_CREATIVE_SIZE_MISMATCH',
        invariant: 2,
        entityType: 'ad',
        entityId: 'ad_1',
        message: messageNaming('728 x 90'),
      },
    ])
  })

  it('exempts a tracking ad, which carries no served creative payload', () => {
    const hierarchy = aMixedHierarchy()
    hierarchy.ads[2]!.creativeIds = []

    expect(validateHierarchy(hierarchy)).toEqual([])
  })
})

/* campaign-spec §8.3 — tracking entities are 1 x 1 / TRACKING / isTracking. */
describe('§8.3 tracking entities are tracking-shaped', () => {
  it('flags a tracking placement that is not 1 x 1', () => {
    const hierarchy = aMixedHierarchy()
    hierarchy.placements[2]!.size = '300 x 250'

    expect(validateHierarchy(hierarchy)).toEqual([
      {
        code: 'TRACKING_ENTITY_MALFORMED',
        invariant: 3,
        entityType: 'placement',
        entityId: 'plc_3',
        message: messageNaming('1 x 1'),
      },
    ])
  })

  it('flags a tracking creative that is not 1 x 1', () => {
    const hierarchy = aMixedHierarchy()
    hierarchy.creatives[2]!.size = '300 x 250'

    expect(validateHierarchy(hierarchy)).toEqual([
      {
        code: 'TRACKING_ENTITY_MALFORMED',
        invariant: 3,
        entityType: 'creative',
        entityId: 'cre_3',
        message: messageNaming('1 x 1'),
      },
    ])
  })

  it('flags a 1 x 1 placement that is not marked as tracking', () => {
    const hierarchy = aMixedHierarchy()
    hierarchy.placements[2]!.isTracking = false

    expect(validateHierarchy(hierarchy)).toEqual([
      {
        code: 'TRACKING_ENTITY_MALFORMED',
        invariant: 3,
        entityType: 'placement',
        entityId: 'plc_3',
        message: messageNaming('isTracking'),
      },
    ])
  })

  it('flags a tracking placement whose compatibility is not TRACKING', () => {
    const hierarchy = aMixedHierarchy()
    hierarchy.placements[2]!.compatibility = 'DISPLAY'

    expect(validateHierarchy(hierarchy)).toEqual([
      {
        code: 'TRACKING_ENTITY_MALFORMED',
        invariant: 3,
        entityType: 'placement',
        entityId: 'plc_3',
        message: messageNaming('TRACKING'),
      },
    ])
  })
})

/* campaign-spec §8.4 — YouTube entities are IN_STREAM_VIDEO. */
describe('§8.4 YouTube entities are in-stream video', () => {
  it('flags a YouTube placement that is not IN_STREAM_VIDEO', () => {
    const hierarchy = aYouTubeHierarchy()
    hierarchy.placements[0]!.compatibility = 'DISPLAY'

    expect(validateHierarchy(hierarchy)).toEqual([
      {
        code: 'YOUTUBE_ENTITY_NOT_IN_STREAM_VIDEO',
        invariant: 4,
        entityType: 'placement',
        entityId: 'plc_1',
        message: messageNaming('IN_STREAM_VIDEO'),
      },
    ])
  })

  it('flags a YouTube creative that is not IN_STREAM_VIDEO', () => {
    const hierarchy = aYouTubeHierarchy()
    hierarchy.creatives[0]!.type = 'HTML5_BANNER'

    expect(validateHierarchy(hierarchy)).toEqual([
      {
        code: 'YOUTUBE_ENTITY_NOT_IN_STREAM_VIDEO',
        invariant: 4,
        entityType: 'creative',
        entityId: 'cre_1',
        message: messageNaming('IN_STREAM_VIDEO'),
      },
    ])
  })
})

/* campaign-spec §8.5 — every campaign / site / landing page reference resolves. */
describe('§8.5 unresolvable entity references', () => {
  it('flags a placement pointing at a campaign that does not exist', () => {
    const hierarchy = aDisplayHierarchy()
    hierarchy.placements[0]!.campaignId = 'cmp_9'

    expect(validateHierarchy(hierarchy)).toEqual([
      {
        code: 'CAMPAIGN_REFERENCE_UNRESOLVED',
        invariant: 5,
        entityType: 'placement',
        entityId: 'plc_1',
        message: messageNaming('cmp_9'),
      },
    ])
  })

  it('flags a placement pointing at a site that does not exist', () => {
    const hierarchy = aDisplayHierarchy()
    hierarchy.placements[0]!.siteId = 'site_9'

    expect(validateHierarchy(hierarchy)).toEqual([
      {
        code: 'SITE_REFERENCE_UNRESOLVED',
        invariant: 5,
        entityType: 'placement',
        entityId: 'plc_1',
        message: messageNaming('site_9'),
      },
    ])
  })

  it('flags a creative pointing at a landing page that does not exist', () => {
    const hierarchy = aDisplayHierarchy()
    hierarchy.creatives[0]!.landingPageId = 'lp_9'

    expect(validateHierarchy(hierarchy)).toEqual([
      {
        code: 'LANDING_PAGE_REFERENCE_UNRESOLVED',
        invariant: 5,
        entityType: 'creative',
        entityId: 'cre_1',
        message: messageNaming('lp_9'),
      },
    ])
  })

  it("flags a campaign's default landing page that does not exist", () => {
    const hierarchy = aDisplayHierarchy()
    hierarchy.campaigns[0]!.defaultLandingPageId = 'lp_9'

    expect(validateHierarchy(hierarchy)).toEqual([
      {
        code: 'LANDING_PAGE_REFERENCE_UNRESOLVED',
        invariant: 5,
        entityType: 'campaign',
        entityId: 'cmp_1',
        message: messageNaming('lp_9'),
      },
    ])
  })

  it('accepts a creative with no landing page at all', () => {
    const hierarchy = aDisplayHierarchy()
    hierarchy.creatives[0]!.landingPageId = null

    expect(validateHierarchy(hierarchy)).toEqual([])
  })

  it('flags an ad pointing at a campaign that does not exist', () => {
    const hierarchy = aDisplayHierarchy()
    hierarchy.ads[0]!.campaignId = 'cmp_9'

    expect(validateHierarchy(hierarchy)).toEqual([
      {
        code: 'CAMPAIGN_REFERENCE_UNRESOLVED',
        invariant: 5,
        entityType: 'ad',
        entityId: 'ad_1',
        message: messageNaming('cmp_9'),
      },
    ])
  })
})

/* campaign-spec §8.6 — every size is a dictionary size. */
describe('§8.6 sizes come from the dictionary', () => {
  it('flags a size the dictionary does not allow', () => {
    const hierarchy = aDisplayHierarchy()
    hierarchy.placements[0]!.size = '301 x 251'
    hierarchy.creatives[0]!.size = '301 x 251'

    expect(validateHierarchy(hierarchy)).toEqual([
      {
        code: 'SIZE_NOT_IN_DICTIONARY',
        invariant: 6,
        entityType: 'placement',
        entityId: 'plc_1',
        message: messageNaming('301 x 251'),
      },
      {
        code: 'SIZE_NOT_IN_DICTIONARY',
        invariant: 6,
        entityType: 'creative',
        entityId: 'cre_1',
        message: messageNaming('301 x 251'),
      },
    ])
  })

  it('checks against whichever allowed-size list it is given', () => {
    const hierarchy = aDisplayHierarchy()

    expect(validateHierarchy(hierarchy, ['728 x 90'])).toEqual([
      aViolationLike({ code: 'SIZE_NOT_IN_DICTIONARY', entityId: 'plc_1' }),
      aViolationLike({ code: 'SIZE_NOT_IN_DICTIONARY', entityId: 'cre_1' }),
    ])
  })
})

/* campaign-spec §8.7 — one campaign per Campaign Type, no cross-type entities. */
describe('§8.7 one campaign per Campaign Type', () => {
  it('flags two campaigns sharing a Campaign Type', () => {
    const hierarchy = aDisplayHierarchy()
    hierarchy.campaigns.push({
      ...hierarchy.campaigns[0]!,
      id: 'cmp_2',
      name: 'Acme | Display | Reach | 2026-09-01-2026-09-30',
    })

    expect(validateHierarchy(hierarchy)).toEqual([
      {
        code: 'DUPLICATE_CAMPAIGN_TYPE',
        invariant: 7,
        entityType: 'campaign',
        entityId: 'cmp_2',
        message: messageNaming('Display'),
      },
    ])
  })

  /* Misfiling an entity also strands the ad that links it, so both the
   * misfiled entity and the now-straddling ad are named. */
  it('flags a display-shaped placement sitting in the Standard Tracking campaign', () => {
    const hierarchy = aMixedHierarchy()
    hierarchy.placements[0]!.campaignId = 'cmp_2'

    expect(validateHierarchy(hierarchy)).toEqual([
      aViolationLike({
        code: 'ENTITY_ASSIGNED_ACROSS_CAMPAIGN_TYPES',
        invariant: 7,
        entityType: 'placement',
        entityId: 'plc_1',
        message: messageNaming('Standard Tracking'),
      }),
      aViolationLike({
        code: 'ENTITY_ASSIGNED_ACROSS_CAMPAIGN_TYPES',
        entityType: 'ad',
        entityId: 'ad_1',
      }),
    ])
  })

  it('flags a tracking creative sitting in the Display campaign', () => {
    const hierarchy = aMixedHierarchy()
    hierarchy.creatives[2]!.campaignId = 'cmp_1'

    expect(validateHierarchy(hierarchy)).toEqual([
      aViolationLike({
        code: 'ENTITY_ASSIGNED_ACROSS_CAMPAIGN_TYPES',
        invariant: 7,
        entityType: 'creative',
        entityId: 'cre_3',
        message: messageNaming('Display'),
      }),
      aViolationLike({
        code: 'ENTITY_ASSIGNED_ACROSS_CAMPAIGN_TYPES',
        entityType: 'ad',
        entityId: 'ad_3',
      }),
    ])
  })

  it('flags an ad linking a placement that belongs to another campaign', () => {
    const hierarchy = aMixedHierarchy()
    hierarchy.ads[0]!.placementIds = ['plc_3']

    expect(validateHierarchy(hierarchy)).toEqual([
      aViolationLike({
        code: 'ENTITY_ASSIGNED_ACROSS_CAMPAIGN_TYPES',
        invariant: 7,
        entityType: 'ad',
        entityId: 'ad_1',
        message: messageNaming('plc_3'),
      }),
    ])
  })

  /* §5 gives the ad type a Campaign Type too. Without that rule an ad typed
   * AD_SERVING_TRACKING claimed §8.2's tracking exemption and nothing else
   * looked at it, so a tracking-typed ad serving mismatched display entities
   * out of the Display campaign came back clean. */
  it('flags a tracking-typed ad sitting in the Display campaign', () => {
    const hierarchy = aDisplayHierarchy()
    hierarchy.ads[0]!.type = 'AD_SERVING_TRACKING'
    hierarchy.ads[0]!.creativeIds = ['cre_2']

    expect(validateHierarchy(hierarchy)).toEqual([
      aViolationLike({
        code: 'ENTITY_ASSIGNED_ACROSS_CAMPAIGN_TYPES',
        invariant: 7,
        entityType: 'ad',
        entityId: 'ad_1',
        message: messageNaming('AD_SERVING_TRACKING'),
      }),
    ])
  })

  it('flags a served ad sitting in the Standard Tracking campaign', () => {
    const hierarchy = aMixedHierarchy()
    hierarchy.ads[2]!.type = 'AD_SERVING_STANDARD'

    expect(validateHierarchy(hierarchy)).toContainEqual(
      aViolationLike({
        code: 'ENTITY_ASSIGNED_ACROSS_CAMPAIGN_TYPES',
        entityType: 'ad',
        entityId: 'ad_3',
      }),
    )
  })

  it('flags an ad linking a creative that belongs to another campaign', () => {
    const hierarchy = aMixedHierarchy()
    hierarchy.ads[2]!.creativeIds = ['cre_1']

    expect(validateHierarchy(hierarchy)).toEqual([
      aViolationLike({
        code: 'ENTITY_ASSIGNED_ACROSS_CAMPAIGN_TYPES',
        invariant: 7,
        entityType: 'ad',
        entityId: 'ad_3',
        message: messageNaming('cre_1'),
      }),
    ])
  })
})

describe('the check itself', () => {
  it('reports every violation rather than throwing on the first', () => {
    const hierarchy = aDisplayHierarchy()
    hierarchy.campaigns = []
    hierarchy.sites = []
    hierarchy.landingPages = []

    const violations = validateHierarchy(hierarchy)

    expect(violations.length).toBeGreaterThan(1)
    expect(violations.map((violation) => violation.code)).toContain('CAMPAIGN_REFERENCE_UNRESOLVED')
    expect(violations.map((violation) => violation.code)).toContain('SITE_REFERENCE_UNRESOLVED')
  })

  /* Two independent defects on one ad. Reporting only the first costs ticket
   * 07 a whole attempt out of a three-attempt budget to discover the second. */
  it('reports a second, independent defect on the same entity', () => {
    const hierarchy = aDisplayHierarchy()
    hierarchy.ads[0]!.placementIds = ['plc_9']
    hierarchy.ads[0]!.creativeIds = ['cre_1', 'cre_2', 'cre_2']

    expect(validateHierarchy(hierarchy).map((violation) => violation.code)).toEqual([
      'AD_PLACEMENT_UNRESOLVED',
      'AD_CREATIVE_COUNT_INVALID',
    ])
  })

  it('leaves the hierarchy it was given untouched', () => {
    const hierarchy = aMixedHierarchy()
    const before = JSON.stringify(hierarchy)

    validateHierarchy(hierarchy)

    expect(JSON.stringify(hierarchy)).toBe(before)
  })
})
