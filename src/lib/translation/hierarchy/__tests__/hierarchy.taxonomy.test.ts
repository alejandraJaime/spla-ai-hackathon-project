import {
  buildAdName,
  buildCampaignName,
  buildCreativeName,
  buildLandingPageName,
  buildPlacementName,
  buildSiteName,
} from '../hierarchy.taxonomy'

describe('buildCampaignName', () => {
  it('names a campaign in campaign-spec §3 token order', () => {
    const built = buildCampaignName({
      advertiser: 'Acme',
      campaignType: 'Display',
      campaignObjective: 'Brand Awareness',
      flightStart: '2026-09-01',
      flightEnd: '2026-09-30',
    })

    expect(built).toEqual({
      name: 'Acme | Display | Brand Awareness | 2026-09-01-2026-09-30',
      assumptions: [],
    })
  })

  it('drops a token whose value is missing rather than emitting an empty delimiter', () => {
    const built = buildCampaignName({
      advertiser: 'Acme',
      campaignType: 'Display',
      campaignObjective: null,
      flightStart: '2026-09-01',
      flightEnd: '2026-09-30',
    })

    expect(built.name).toBe('Acme | Display | 2026-09-01-2026-09-30')
    expect(built.assumptions).toEqual([
      'The campaign name omits its "Campaign Objective" token because no value was available.',
    ])
  })
})

describe('buildSiteName', () => {
  it('names a site with the media partner as given', () => {
    expect(buildSiteName({ mediaPartner: 'Google Display Network' })).toEqual({
      name: 'Google Display Network',
      assumptions: [],
    })
  })

  /* campaign-spec §6 gives the caller a default site name; the taxonomy never
   * invents one, it only reports that it had nothing to name the site with. */
  it('reports a missing media partner rather than inventing a site name', () => {
    const built = buildSiteName({ mediaPartner: '  ' })

    expect(built.name).toBe('')
    expect(built.assumptions).toEqual([
      'The site name omits its "Media Partner" token because no value was available.',
    ])
  })
})

describe('buildLandingPageName', () => {
  it.each([
    ['https://www.example.com/summer-sale?utm_source=x', 'Acme | example-summer-sale'],
    ['https://acme.co.uk/', 'Acme | acme'],
    ['http://example.com', 'Acme | example'],
    ['example.com/Womens_Boots/', 'Acme | example-womens-boots'],
  ])('slugs %s into a short landing-page name', (url, expected) => {
    expect(buildLandingPageName({ advertiser: 'Acme', url }).name).toBe(expected)
  })

  it('drops the slug token when there is no url', () => {
    const built = buildLandingPageName({ advertiser: 'Acme', url: null })

    expect(built.name).toBe('Acme')
    expect(built.assumptions).toEqual([
      'The landing page name omits its "URL Slug" token because no value was available.',
    ])
  })
})

describe('buildPlacementName', () => {
  it('names a placement in campaign-spec §3 token order', () => {
    const built = buildPlacementName({
      campaignType: 'Display',
      publisher: 'Premium Publishers',
      size: '300 x 250',
      mediaFormat: 'Desktop',
      country: 'US',
    })

    expect(built).toEqual({
      name: 'Display | Premium Publishers | 300 x 250 | Desktop | US',
      assumptions: [],
    })
  })

  it('closes the gap left by a missing middle token instead of emitting an empty one', () => {
    const built = buildPlacementName({
      campaignType: 'Display',
      publisher: null,
      size: '300 x 250',
      mediaFormat: 'Desktop',
      country: 'US',
    })

    expect(built.name).toBe('Display | 300 x 250 | Desktop | US')
    expect(built.assumptions).toEqual([
      'The placement name omits its "Publisher" token because no value was available.',
    ])
  })
})

describe('buildCreativeName', () => {
  it('names a creative in campaign-spec §3 token order', () => {
    expect(
      buildCreativeName({ campaignType: 'Display', mediaType: 'Image', size: '300 x 250' }),
    ).toEqual({ name: 'Display | Image | 300 x 250', assumptions: [] })
  })

  it('names a tracking creative with the tracking size', () => {
    expect(
      buildCreativeName({
        campaignType: 'Standard Tracking',
        mediaType: 'Image',
        size: '1 x 1',
      }).name,
    ).toBe('Standard Tracking | Image | 1 x 1')
  })
})

describe('buildAdName', () => {
  it('names an ad in campaign-spec §3 token order', () => {
    expect(
      buildAdName({ campaignType: 'YouTube', tactic: 'Brand Awareness', size: '1920 x 1080' }),
    ).toEqual({ name: 'YouTube | Brand Awareness | 1920 x 1080', assumptions: [] })
  })
})

describe('every built name', () => {
  const builtWithEveryTokenMissing = [
    buildCampaignName({
      advertiser: null,
      campaignType: null,
      campaignObjective: null,
      flightStart: null,
      flightEnd: null,
    }),
    buildPlacementName({
      campaignType: null,
      publisher: null,
      size: null,
      mediaFormat: null,
      country: null,
    }),
    buildCreativeName({ campaignType: null, mediaType: null, size: null }),
    buildAdName({ campaignType: null, tactic: null, size: null }),
    buildLandingPageName({ advertiser: null, url: null }),
  ]

  it.each(builtWithEveryTokenMissing)('never emits an empty delimiter (%p)', (built) => {
    expect(built.name).not.toMatch(/\|/)
  })

  it('reports one assumption per dropped token', () => {
    expect(builtWithEveryTokenMissing.map((built) => built.assumptions.length)).toEqual([
      4, 5, 3, 3, 2,
    ])
  })

  it('drops a half-open flight window whole, naming the window as the omission', () => {
    const built = buildCampaignName({
      advertiser: 'Acme',
      campaignType: 'Display',
      campaignObjective: 'Reach',
      flightStart: '2026-09-01',
      flightEnd: null,
    })

    expect(built.name).toBe('Acme | Display | Reach')
    expect(built.assumptions).toEqual([
      'The campaign name omits its "Flight Window" token because no value was available.',
    ])
  })
})
