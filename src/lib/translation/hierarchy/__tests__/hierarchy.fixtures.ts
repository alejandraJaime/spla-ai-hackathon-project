/**
 * Fixtures for the pure hierarchy tests, built from the module's existing
 * hand-written `VALID_HIERARCHY` / `VALID_PLAN` so there is one entity
 * vocabulary — one set of ids, sizes and names — across every test that reasons
 * about a hierarchy. Each fixture is cloned, so a test is free to mutate one
 * field into the state it wants to catch.
 */
import { clone, VALID_HIERARCHY, VALID_PLAN } from '../../__tests__/fixtures'
import type { Hierarchy, Tactic } from '../../translation.types'

/** A display line from the sample plan: three sizes on one media partner. */
export function aTactic(overrides: Partial<Tactic> = {}): Tactic {
  return { ...clone(VALID_PLAN.tactics[0]!), ...overrides }
}

/**
 * Two Campaign Types in one hierarchy — the shape Step 2 emits for a mixed plan
 * (ADR-0001), before it is split for persistence. Display on `cmp_1` with two
 * sizes on one site; Standard Tracking on `cmp_2` with its own 1 x 1 set.
 */
export function aMixedHierarchy(): Hierarchy {
  return clone(VALID_HIERARCHY)
}

/** The Display campaign on its own: the smallest valid single-campaign case. */
export function aDisplayHierarchy(): Hierarchy {
  const hierarchy = clone(VALID_HIERARCHY)
  const displayCampaignId = 'cmp_1'

  return {
    ...hierarchy,
    campaigns: hierarchy.campaigns.filter((campaign) => campaign.id === displayCampaignId),
    sites: hierarchy.sites.filter((site) => site.id === 'site_1'),
    landingPages: hierarchy.landingPages.filter((landingPage) => landingPage.id === 'lp_1'),
    placements: hierarchy.placements.filter(
      (placement) => placement.campaignId === displayCampaignId,
    ),
    creatives: hierarchy.creatives.filter((creative) => creative.campaignId === displayCampaignId),
    ads: hierarchy.ads.filter((ad) => ad.campaignId === displayCampaignId),
  }
}

/**
 * A valid minimal YouTube hierarchy (campaign-spec §4C): the display case with
 * in-stream mechanics and one video size, which is all §4C's fan-out produces.
 */
export function aYouTubeHierarchy(): Hierarchy {
  const hierarchy = aDisplayHierarchy()
  const videoSize = '1920 x 1080'

  return {
    ...hierarchy,
    campaigns: hierarchy.campaigns.map((campaign) => ({ ...campaign, campaignType: 'YouTube' })),
    sites: hierarchy.sites.map((site) => ({ ...site, name: 'YouTube' })),
    placements: hierarchy.placements.slice(0, 1).map((placement) => ({
      ...placement,
      compatibility: 'IN_STREAM_VIDEO' as const,
      size: videoSize,
      pricingModel: 'CPV' as const,
      rate: 0.03,
    })),
    creatives: hierarchy.creatives.slice(0, 1).map((creative) => ({
      ...creative,
      type: 'IN_STREAM_VIDEO' as const,
      size: videoSize,
    })),
    ads: hierarchy.ads.slice(0, 1),
  }
}
