import { splitByCampaignType } from '../hierarchy.split'
import { validateHierarchy } from '../hierarchy.validator'
import { aDisplayHierarchy, aMixedHierarchy } from './hierarchy.fixtures'

describe('splitByCampaignType', () => {
  it('returns one single-campaign hierarchy per Campaign Type', () => {
    const split = splitByCampaignType(aMixedHierarchy())

    expect(
      split.map((hierarchy) => hierarchy.campaigns.map((campaign) => campaign.campaignType)),
    ).toEqual([['Display'], ['Standard Tracking']])
  })

  it('partitions placements, creatives and ads by their campaignId', () => {
    const [display, tracking] = splitByCampaignType(aMixedHierarchy())

    expect(display?.placements.map((placement) => placement.id)).toEqual(['plc_1', 'plc_2'])
    expect(display?.creatives.map((creative) => creative.id)).toEqual(['cre_1', 'cre_2'])
    expect(display?.ads.map((ad) => ad.id)).toEqual(['ad_1', 'ad_2'])
    expect(tracking?.placements.map((placement) => placement.id)).toEqual(['plc_3'])
    expect(tracking?.creatives.map((creative) => creative.id)).toEqual(['cre_3'])
    expect(tracking?.ads.map((ad) => ad.id)).toEqual(['ad_3'])
  })

  it('partitions every placement, creative and ad exactly once', () => {
    const source = aMixedHierarchy()
    const split = splitByCampaignType(source)

    const idsIn = (hierarchies: typeof split) =>
      hierarchies.flatMap((hierarchy) => [
        ...hierarchy.placements.map((placement) => placement.id),
        ...hierarchy.creatives.map((creative) => creative.id),
        ...hierarchy.ads.map((ad) => ad.id),
      ])

    const splitIds = idsIn(split)

    expect(splitIds.sort()).toEqual(idsIn([source]).sort())
    expect(new Set(splitIds).size).toBe(splitIds.length)
  })

  it('carries each campaign the sites and landing pages its own entities reference', () => {
    const [display, tracking] = splitByCampaignType(aMixedHierarchy())

    expect(display?.sites.map((site) => site.id)).toEqual(['site_1'])
    expect(display?.landingPages.map((page) => page.id)).toEqual(['lp_1'])
    expect(tracking?.sites.map((site) => site.id)).toEqual(['site_2'])
    expect(tracking?.landingPages.map((page) => page.id)).toEqual(['lp_2'])
  })

  it('carries the platform, the assumptions and the change summary onto every hierarchy', () => {
    const source = aMixedHierarchy()
    source.changeSummary = 'Added a 728 x 90 banner.'

    for (const hierarchy of splitByCampaignType(source)) {
      expect(hierarchy.platform).toBe('CM360')
      expect(hierarchy.assumptions).toEqual(source.assumptions)
      expect(hierarchy.changeSummary).toBe('Added a 728 x 90 banner.')
    }
  })

  it('leaves a single-campaign hierarchy alone', () => {
    const source = aDisplayHierarchy()

    expect(splitByCampaignType(source)).toEqual([source])
  })

  /* A landing page both Campaign Types point at cannot be partitioned: each
   * hierarchy has to resolve its own `landingPageId` once it stands alone. */
  it('carries a landing page both campaigns reference into both hierarchies', () => {
    const source = aMixedHierarchy()
    source.creatives[2]!.landingPageId = 'lp_1'

    const carried = splitByCampaignType(source).map((hierarchy) =>
      hierarchy.landingPages.map((landingPage) => landingPage.id),
    )

    expect(carried).toEqual([['lp_1'], ['lp_1', 'lp_2']])
  })

  /* Ticket 11 has to render the broken entity the user is clarifying, so a
   * misfiled one is carried rather than lost between the two outputs. */
  it('keeps an entity whose campaignId matches no campaign', () => {
    const source = aMixedHierarchy()
    source.placements[2]!.campaignId = 'cmp_9'

    const split = splitByCampaignType(source)

    expect(split[0]?.placements.map((placement) => placement.id)).toEqual([
      'plc_1',
      'plc_2',
      'plc_3',
    ])
    expect(split[1]?.placements).toEqual([])
  })

  it('keeps a site nothing references rather than losing it in the split', () => {
    const source = aMixedHierarchy()
    source.sites.push({ id: 'site_9', name: 'Unused partner' })

    const carried = splitByCampaignType(source).flatMap((hierarchy) =>
      hierarchy.sites.map((site) => site.id),
    )

    expect(carried).toContain('site_9')
  })
})

describe('a split hierarchy', () => {
  /* The split is what gets persisted and re-validated on every later edit, so
   * each half has to satisfy campaign-spec §8 while standing alone. */
  it('still satisfies every campaign-spec §8 invariant on its own', () => {
    for (const hierarchy of splitByCampaignType(aMixedHierarchy())) {
      expect(validateHierarchy(hierarchy)).toEqual([])
    }
  })
})
