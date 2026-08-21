import { dictionaryValues } from '../../knowledge'
import { CAMPAIGN_TYPES, resolveCampaignType } from '../hierarchy.rules'
import { aTactic } from './hierarchy.fixtures'

describe('resolveCampaignType', () => {
  /* The one non-mechanical judgment in the build: a tracking line is also a
   * display-shaped line, so tracking has to win. */
  it('resolves a 1 x 1 tracking-only line to Standard Tracking, not Display', () => {
    const trackingLine = aTactic({
      name: 'Floodlight tag',
      channel: 'DISPLAY',
      format: 'DISPLAY',
      adSizes: ['1 x 1'],
      trackingOnly: true,
    })

    expect(resolveCampaignType(trackingLine)).toBe('Standard Tracking')
  })

  it.each([
    ['trackingOnly is set', aTactic({ trackingOnly: true, adSizes: ['300 x 250'] })],
    ['the channel is TRACKING', aTactic({ channel: 'TRACKING' })],
    ['the format is TRACKING', aTactic({ format: 'TRACKING' })],
    ['every size is 1 x 1', aTactic({ adSizes: ['1 x 1'] })],
  ])('resolves Standard Tracking when %s', (_reason, tactic) => {
    expect(resolveCampaignType(tactic)).toBe('Standard Tracking')
  })

  it('reads a line mixing 1 x 1 with real banner sizes as display, not tracking', () => {
    const tactic = aTactic({ adSizes: ['300 x 250', '1 x 1'] })

    expect(resolveCampaignType(tactic)).toBe('Display')
  })

  it.each([
    ['the channel is DISPLAY', aTactic({ channel: 'DISPLAY', format: 'UNKNOWN' })],
    ['the format is DISPLAY', aTactic({ channel: 'OTHER', format: 'DISPLAY' })],
  ])('resolves Display when %s', (_reason, tactic) => {
    expect(resolveCampaignType(tactic)).toBe('Display')
  })

  it.each([
    [
      'the channel is VIDEO',
      aTactic({ channel: 'VIDEO', format: 'UNKNOWN', adSizes: ['1920 x 1080'] }),
    ],
    [
      'the format is IN_STREAM_VIDEO',
      aTactic({ channel: 'OTHER', format: 'IN_STREAM_VIDEO', adSizes: ['1920 x 1080'] }),
    ],
    [
      'the media partner is YouTube',
      aTactic({ channel: 'OTHER', format: 'UNKNOWN', mediaPartner: 'YouTube Masthead' }),
    ],
  ])('resolves YouTube when %s', (_reason, tactic) => {
    expect(resolveCampaignType(tactic)).toBe('YouTube')
  })

  /* §7: a channel with no build pattern is recorded, not built. */
  it('resolves nothing for a channel the prototype has no build pattern for', () => {
    const audioLine = aTactic({
      name: 'Spotify audio',
      channel: 'OTHER',
      format: 'UNKNOWN',
      mediaPartner: 'Spotify',
      adSizes: [],
    })

    expect(resolveCampaignType(audioLine)).toBeNull()
  })
})

describe('CAMPAIGN_TYPES', () => {
  it('spells every Campaign Type the way the field dictionary spells it', () => {
    expect(Object.values(CAMPAIGN_TYPES)).toEqual(dictionaryValues('Campaign Type'))
  })
})
