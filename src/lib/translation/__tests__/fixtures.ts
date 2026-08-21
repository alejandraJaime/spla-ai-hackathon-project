import type { Hierarchy, Plan } from '../translation.types'

/**
 * A hand-written valid Plan: a three-size display line plus a floodlight line,
 * with the gaps the extractor is expected to record rather than fill.
 */
export const VALID_PLAN: Plan = {
  plan: {
    advertiser: 'Acme Foods',
    campaignName: 'Acme Autumn Launch',
    objective: 'Brand Awareness',
    flightStart: '2026-09-01',
    flightEnd: '2026-10-15',
    currency: 'USD',
    totalBudget: 120000,
  },
  tactics: [
    {
      sourceLine: 12,
      name: 'GDN prospecting banners',
      channel: 'DISPLAY',
      format: 'DISPLAY',
      mediaPartner: 'Google Display Network',
      adSizes: ['300 x 250', '728 x 90', '160 x 600'],
      startDate: '2026-09-01',
      endDate: '2026-10-15',
      pricingModel: 'CPM',
      rate: 4.5,
      budget: 90000,
      impressionsGoal: 20000000,
      targeting: 'Foodies 25-54, US',
      landingPageUrl: 'https://acme.example/autumn',
      kpi: 'Reach',
      trackingOnly: false,
      notes: null,
      assumptions: [],
    },
    {
      sourceLine: 'row 13',
      name: 'Site-wide floodlight',
      channel: 'TRACKING',
      format: 'TRACKING',
      mediaPartner: null,
      adSizes: ['1 x 1'],
      startDate: '2026-09-01',
      endDate: null,
      pricingModel: null,
      rate: null,
      budget: null,
      impressionsGoal: null,
      targeting: null,
      landingPageUrl: null,
      kpi: null,
      trackingOnly: true,
      notes: 'Pixel supplied by the analytics team.',
      assumptions: ['End date was blank on this line; left null.'],
    },
  ],
  assumptions: ['Currency was not stated; assumed USD from the budget column.'],
}

/**
 * A hand-written valid Hierarchy: one Display campaign (two sizes on one site)
 * and one Standard Tracking campaign, entities held in flat arrays and linked
 * by id the way CM360 models them.
 */
export const VALID_HIERARCHY: Hierarchy = {
  platform: 'CM360',
  campaigns: [
    {
      id: 'cmp_1',
      name: 'Acme Foods | Display | Brand Awareness | 2026-09-01-2026-10-15',
      campaignType: 'Display',
      advertiser: 'Acme Foods',
      startDate: '2026-09-01',
      endDate: '2026-10-15',
      defaultLandingPageId: 'lp_1',
    },
    {
      id: 'cmp_2',
      name: 'Acme Foods | Standard Tracking | Brand Awareness | 2026-09-01-2026-10-15',
      campaignType: 'Standard Tracking',
      advertiser: 'Acme Foods',
      startDate: '2026-09-01',
      endDate: '2026-10-15',
      defaultLandingPageId: 'lp_2',
    },
  ],
  sites: [
    { id: 'site_1', name: 'Google Display Network' },
    { id: 'site_2', name: 'acme.example' },
  ],
  landingPages: [
    { id: 'lp_1', name: 'Acme Foods | autumn', url: 'https://acme.example/autumn' },
    { id: 'lp_2', name: 'Acme Foods | home', url: 'https://acme.example' },
  ],
  placements: [
    {
      id: 'plc_1',
      name: 'Display | Premium Publishers | 300 x 250 | Desktop & Mobile | US',
      campaignId: 'cmp_1',
      siteId: 'site_1',
      compatibility: 'DISPLAY',
      size: '300 x 250',
      pricingModel: 'CPM',
      rate: 4.5,
      startDate: '2026-09-01',
      endDate: '2026-10-15',
      isTracking: false,
      sourceTacticName: 'GDN prospecting banners',
    },
    {
      id: 'plc_2',
      name: 'Display | Premium Publishers | 728 x 90 | Desktop & Mobile | US',
      campaignId: 'cmp_1',
      siteId: 'site_1',
      compatibility: 'DISPLAY',
      size: '728 x 90',
      pricingModel: 'CPM',
      rate: 4.5,
      startDate: '2026-09-01',
      endDate: '2026-10-15',
      isTracking: false,
      sourceTacticName: 'GDN prospecting banners',
    },
    {
      id: 'plc_3',
      name: 'Standard Tracking | Direct Sales | 1 x 1 | Desktop & Mobile | US',
      campaignId: 'cmp_2',
      siteId: 'site_2',
      compatibility: 'TRACKING',
      size: '1 x 1',
      pricingModel: 'FLAT',
      rate: 0,
      startDate: '2026-09-01',
      endDate: '2026-10-15',
      isTracking: true,
      sourceTacticName: 'Site-wide floodlight',
    },
  ],
  creatives: [
    {
      id: 'cre_1',
      name: 'Display | Image | 300 x 250',
      campaignId: 'cmp_1',
      type: 'IMAGE',
      size: '300 x 250',
      isTracking: false,
      landingPageId: 'lp_1',
      sourceTacticName: 'GDN prospecting banners',
    },
    {
      id: 'cre_2',
      name: 'Display | Image | 728 x 90',
      campaignId: 'cmp_1',
      type: 'IMAGE',
      size: '728 x 90',
      isTracking: false,
      landingPageId: 'lp_1',
      sourceTacticName: 'GDN prospecting banners',
    },
    {
      id: 'cre_3',
      name: 'Standard Tracking | Image | 1 x 1',
      campaignId: 'cmp_2',
      type: 'TRACKING_TEXT',
      size: '1 x 1',
      isTracking: true,
      landingPageId: 'lp_2',
      sourceTacticName: 'Site-wide floodlight',
    },
  ],
  ads: [
    {
      id: 'ad_1',
      name: 'Display | Brand Awareness | 300 x 250',
      campaignId: 'cmp_1',
      type: 'AD_SERVING_STANDARD',
      placementIds: ['plc_1'],
      creativeIds: ['cre_1'],
      sourceTacticName: 'GDN prospecting banners',
    },
    {
      id: 'ad_2',
      name: 'Display | Brand Awareness | 728 x 90',
      campaignId: 'cmp_1',
      type: 'AD_SERVING_STANDARD',
      placementIds: ['plc_2'],
      creativeIds: ['cre_2'],
      sourceTacticName: 'GDN prospecting banners',
    },
    {
      id: 'ad_3',
      name: 'Standard Tracking | Brand Awareness | 1 x 1',
      campaignId: 'cmp_2',
      type: 'AD_SERVING_TRACKING',
      placementIds: ['plc_3'],
      creativeIds: ['cre_3'],
      sourceTacticName: 'Site-wide floodlight',
    },
  ],
  assumptions: [
    'Currency was not stated; assumed USD from the budget column.',
    'The 160 x 600 size was not trafficked because the plan gave no rate for it.',
  ],
  changeSummary: null,
}

/** Deep clone so a test can mutate one field into an invalid state. */
export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
