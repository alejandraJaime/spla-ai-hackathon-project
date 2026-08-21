/**
 * Campaign Type resolution (campaign-spec §1) — which of the three build
 * patterns a tactic expands into, and therefore which CM360 campaign it belongs
 * to (ADR-0001).
 *
 * ORDER IS LOAD-BEARING. A tracking line is also, technically, a display-shaped
 * line: it has a size, it has a site, and a `1 x 1` "banner" parses as a banner.
 * So tracking is decided FIRST. Reversing these two branches builds tracking
 * pixels as served display ads — a hierarchy that looks entirely plausible and
 * is wrong. After tracking, the order is campaign-spec §1's own: display, then
 * YouTube.
 */
import type { CampaignType } from '../translation.types'
import type { CampaignTypeSignals, ResolvedCampaignType } from './types'

/** The canonical size of every tracking placement and creative (§4B). */
export const TRACKING_SIZE = '1 x 1'

/**
 * The three Campaign Types the prototype builds, spelled as the field
 * dictionary spells them. Code has to name them to map CM360 mechanics onto
 * them (§5); a test pins these against the dictionary so a rename there is a
 * failing test rather than silent drift.
 */
export const CAMPAIGN_TYPES = {
  display: 'Display',
  standardTracking: 'Standard Tracking',
  youTube: 'YouTube',
} as const satisfies Record<string, CampaignType>

/**
 * Returns the Campaign Type a tactic builds under, or `null` when the
 * prototype has no build pattern for it (§7: record it as an assumption, don't
 * build it and don't drop it silently).
 */
export function resolveCampaignType(tactic: CampaignTypeSignals): ResolvedCampaignType {
  if (isTrackingLine(tactic)) {
    return CAMPAIGN_TYPES.standardTracking
  }
  if (isDisplayLine(tactic)) {
    return CAMPAIGN_TYPES.display
  }
  if (isYouTubeLine(tactic)) {
    return CAMPAIGN_TYPES.youTube
  }
  return null
}

/**
 * `trackingOnly`, a TRACKING channel/format, or a line whose every size is
 * `1 x 1`. "Every" rather than "any": a line mixing `1 x 1` with real banner
 * sizes is a served display line with a stray size, not a tracking tag.
 */
function isTrackingLine({ trackingOnly, channel, format, adSizes }: CampaignTypeSignals): boolean {
  return (
    trackingOnly ||
    channel === 'TRACKING' ||
    format === 'TRACKING' ||
    (adSizes.length > 0 && adSizes.every((size) => size === TRACKING_SIZE))
  )
}

function isDisplayLine({ channel, format }: CampaignTypeSignals): boolean {
  return channel === 'DISPLAY' || format === 'DISPLAY'
}

function isYouTubeLine({ channel, format, mediaPartner }: CampaignTypeSignals): boolean {
  return channel === 'VIDEO' || format === 'IN_STREAM_VIDEO' || /youtube/i.test(mediaPartner ?? '')
}
