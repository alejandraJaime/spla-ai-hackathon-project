/**
 * Splitting Step 2's multi-campaign output into one single-campaign hierarchy
 * per Campaign Type, which is the unit that gets persisted and versioned
 * (ADR-0001: one CM360 campaign per Campaign Type, each independently
 * Hierarchy-Versioned).
 *
 * Placements, creatives and ads carry a `campaignId`, so they partition
 * exactly. Two things do not partition, and are handled deliberately rather
 * than quietly:
 *
 *   - Sites and landing pages carry no `campaignId` — they are shared reference
 *     data — so each output takes the ones its own entities reference. That is
 *     what keeps campaign-spec §8's `siteId`/`landingPageId` invariants
 *     satisfiable once a hierarchy stands alone, and it means a landing page
 *     two Campaign Types both point at is carried into both.
 *   - An entity no campaign claims (a `campaignId` that resolves to nothing) is
 *     adopted by the first campaign. Dropping it would be worse than carrying
 *     it: the §8 pass reports it, and ticket 11 has to render the broken entity
 *     the user is being asked to clarify.
 */
import type { Hierarchy } from '../translation.types'

export function splitByCampaignType(hierarchy: Hierarchy): Hierarchy[] {
  const campaignIds = new Set(hierarchy.campaigns.map((campaign) => campaign.id))
  const referencedSiteIds = new Set(hierarchy.placements.map((placement) => placement.siteId))
  const referencedLandingPageIds = new Set([
    ...hierarchy.creatives.map((creative) => creative.landingPageId),
    ...hierarchy.campaigns.map((campaign) => campaign.defaultLandingPageId),
  ])

  return hierarchy.campaigns.map((campaign, campaignIndex) => {
    /* Exactly one output adopts what nothing else claims, so nothing is
     * duplicated and nothing is lost. */
    const adoptsUnclaimed = campaignIndex === 0
    const belongsToThisCampaign = (campaignId: string) =>
      campaignId === campaign.id || (adoptsUnclaimed && !campaignIds.has(campaignId))
    const isCarried = (id: string, ownIds: Set<string | null>, referenced: Set<string | null>) =>
      ownIds.has(id) || (adoptsUnclaimed && !referenced.has(id))

    const placements = hierarchy.placements.filter((placement) =>
      belongsToThisCampaign(placement.campaignId),
    )
    const creatives = hierarchy.creatives.filter((creative) =>
      belongsToThisCampaign(creative.campaignId),
    )

    const siteIds = new Set(placements.map((placement) => placement.siteId))
    const landingPageIds = new Set([
      ...creatives.map((creative) => creative.landingPageId),
      campaign.defaultLandingPageId,
    ])

    return {
      platform: hierarchy.platform,
      campaigns: [campaign],
      sites: hierarchy.sites.filter((site) => isCarried(site.id, siteIds, referencedSiteIds)),
      landingPages: hierarchy.landingPages.filter((landingPage) =>
        isCarried(landingPage.id, landingPageIds, referencedLandingPageIds),
      ),
      placements,
      creatives,
      ads: hierarchy.ads.filter((ad) => belongsToThisCampaign(ad.campaignId)),
      assumptions: [...hierarchy.assumptions],
      changeSummary: hierarchy.changeSummary,
    }
  })
}
