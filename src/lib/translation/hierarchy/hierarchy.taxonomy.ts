/**
 * The naming taxonomy (campaign-spec §3): the token order for each entity
 * level, joined with ` | `, every token spelled as the field dictionary spells
 * it. Callers pass dictionary values in; this module never invents or snaps a
 * value, it only orders and joins them.
 *
 * A token whose value is genuinely missing is DROPPED — never emitted as an
 * empty `| |` — and the omission comes back as an assumption for the review
 * panel, because a silently shortened name is indistinguishable from a name
 * that was always meant to be short.
 */
import type {
  IAdNameTokens,
  ICampaignNameTokens,
  ICreativeNameTokens,
  ILandingPageNameTokens,
  IPlacementNameTokens,
  ISiteNameTokens,
  ITaxonomyName,
  ITaxonomyToken,
} from './types'

const TAXONOMY_DELIMITER = ' | '

/** `{Advertiser} | {Campaign Type} | {Campaign Objective} | {FlightStart}-{FlightEnd}` */
export function buildCampaignName(tokens: ICampaignNameTokens): ITaxonomyName {
  return joinTokens('campaign', [
    { field: 'Advertiser', value: tokens.advertiser },
    { field: 'Campaign Type', value: tokens.campaignType },
    { field: 'Campaign Objective', value: tokens.campaignObjective },
    { field: 'Flight Window', value: buildFlightWindow(tokens.flightStart, tokens.flightEnd) },
  ])
}

/** The media partner / publisher name as given — CM360 site names are freeform. */
export function buildSiteName(tokens: ISiteNameTokens): ITaxonomyName {
  return joinTokens('site', [{ field: 'Media Partner', value: tokens.mediaPartner }])
}

/** `{Advertiser} | {short-slug-of-url}` */
export function buildLandingPageName(tokens: ILandingPageNameTokens): ITaxonomyName {
  return joinTokens('landing page', [
    { field: 'Advertiser', value: tokens.advertiser },
    { field: 'URL Slug', value: slugifyUrl(tokens.url) },
  ])
}

/** `{Campaign Type} | {Publisher} | {Size} | {Media Format} | {Country}` */
export function buildPlacementName(tokens: IPlacementNameTokens): ITaxonomyName {
  return joinTokens('placement', [
    { field: 'Campaign Type', value: tokens.campaignType },
    { field: 'Publisher', value: tokens.publisher },
    { field: 'Size', value: tokens.size },
    { field: 'Media Format', value: tokens.mediaFormat },
    { field: 'Country', value: tokens.country },
  ])
}

/** `{Campaign Type} | {Media Type} | {Size}` */
export function buildCreativeName(tokens: ICreativeNameTokens): ITaxonomyName {
  return joinTokens('creative', [
    { field: 'Campaign Type', value: tokens.campaignType },
    { field: 'Media Type', value: tokens.mediaType },
    { field: 'Size', value: tokens.size },
  ])
}

/** `{Campaign Type} | {Tactic} | {Size}` */
export function buildAdName(tokens: IAdNameTokens): ITaxonomyName {
  return joinTokens('ad', [
    { field: 'Campaign Type', value: tokens.campaignType },
    { field: 'Tactic', value: tokens.tactic },
    { field: 'Size', value: tokens.size },
  ])
}

/**
 * The short slug §3 asks for: the site's own name plus its first path segment,
 * e.g. `https://www.example.com/summer-sale?utm=1` -> `example-summer-sale`.
 * Hand-parsed rather than via `URL`, which needs a protocol a media plan often
 * omits.
 */
function slugifyUrl(url: string | null): string | null {
  const bareUrl = (url ?? '')
    .trim()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
    .replace(/^www\./i, '')
  const [hostname = '', ...pathParts] = bareUrl.split(/[/?#]/)
  const siteLabel = hostname.split('.')[0] ?? ''
  const firstPathSegment = pathParts.find((part) => part.length > 0) ?? ''

  const slug = [siteLabel, firstPathSegment]
    .map(toKebabCase)
    .filter(Boolean)
    .join('-')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/, '')

  return slug || null
}

const MAX_SLUG_LENGTH = 40

function toKebabCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Both ends or neither: a half-open range reads as a typo in a campaign name,
 * so a missing end drops the whole window token.
 */
function buildFlightWindow(start: string | null, end: string | null): string | null {
  return start?.trim() && end?.trim() ? `${start.trim()}-${end.trim()}` : null
}

/**
 * Joins the tokens that have values and records one assumption per token that
 * did not. Empty and whitespace-only values count as missing.
 */
function joinTokens(entityLabel: string, tokens: ITaxonomyToken[]): ITaxonomyName {
  const present: string[] = []
  const assumptions: string[] = []

  for (const { field, value } of tokens) {
    const trimmed = value?.trim()
    if (trimmed) {
      present.push(trimmed)
    } else {
      assumptions.push(
        `The ${entityLabel} name omits its "${field}" token because no value was available.`,
      )
    }
  }

  return { name: present.join(TAXONOMY_DELIMITER), assumptions }
}
